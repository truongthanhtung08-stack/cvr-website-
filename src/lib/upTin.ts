import type { SupabaseClient } from "@supabase/supabase-js";
import { BILLING_DEFAULT, bangTheoMucDich, freeDangChay, loaiVoucherTin, quotePrice, vnd, type BillingData } from "@/lib/billing";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { baoLoi } from "@/lib/baoLoi";
import { guiThongBao } from "@/lib/thongBao";
import type { TierId } from "@/lib/packages";

// ============================================================================
// UP TIN = GIA HẠN GÓI TIN — MỘT HÀM DÙNG CHUNG (chủ dự án chốt 25/09/2026)
// ----------------------------------------------------------------------------
// Gọi từ 2 nơi, cùng một cách tính:
//   · Khách bấm Up tin (/api/tin-dang/up)
//   · Tiền vừa vào ví → tự Up các tin đang CHỜ NẠP (bảng up_cho, 0044)
// Giá tính y như ĐĂNG TIN MỚI (bảng theo mục đích, miễn phí thành viên mới,
// voucher hội viên) — máy chủ tự tính, không nhận số tiền từ trình duyệt.
// Ngày đăng, mốc lên đầu và hạn gói TÍNH LẠI TỪ HÔM NAY (hàm CSDL up_tin, 0041/0042).
// ============================================================================

export const HANG_UP: TierId[] = ["basic", "silver", "gold", "diamond"];

export type KetQuaUp =
  | { ok: true; daTru: number; mienPhi: boolean; soDu?: number; hetHan?: string; tieuDe: string; tenGoi: string }
  | { ok: false; loi: string; viThieu?: number; code?: number };

export async function thucHienUpTin(
  admin: SupabaseClient,
  userId: string,
  id: string,
  goi: TierId,
  soNgay: number,
): Promise<KetQuaUp> {
  const { data: tin } = await admin.from("listings").select("id,title,owner_id,status,purpose").eq("id", id).single();
  if (!tin) return { ok: false, loi: "Không tìm thấy tin.", code: 404 };
  if (tin.owner_id !== userId) return { ok: false, loi: "Tin này không phải của bạn.", code: 403 };
  if (tin.status !== "approved" && tin.status !== "expired") return { ok: false, loi: "Chỉ Up được tin đang đăng hoặc đã hết hạn." };

  const { data: sc } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  const bang: BillingData = bangTheoMucDich({ ...BILLING_DEFAULT, ...((sc?.[0]?.data as Partial<BillingData>) ?? {}) }, tin.purpose);
  if (!bang.plans.find((p) => p.tierId === goi)?.terms.some((t) => t.days === soNgay)) {
    return { ok: false, loi: "Hạng tin hoặc thời hạn này hiện không bán." };
  }
  const tenGoi = bang.plans.find((p) => p.tierId === goi)?.name ?? "Gói tin";

  const { data: hsArr } = await admin
    .from("profiles")
    .select("created_at,role,free_quota,balance,email,phone,full_name,xuat_hoa_don,hd_ten_cong_ty,hd_mst,hd_dia_chi,hd_email")
    .eq("id", userId)
    .limit(1);
  const hs = hsArr?.[0];
  if (!hs) return { ok: false, loi: "Không tìm thấy tài khoản.", code: 404 };

  // ── Giá: y như đăng mới ──────────────────────────────────────────────────
  const homNay = new Date().toISOString().slice(0, 10);
  const soNgayMoTk = hs.created_at ? (Date.now() - new Date(hs.created_at).getTime()) / 86_400_000 : Number.POSITIVE_INFINITY;
  const bao = quotePrice({ data: bang, tierId: goi, days: soNgay, today: homNay, isNewMember: soNgayMoTk <= bang.free.days });
  let tien = tachThue(bao.total);

  // Chương trình miễn phí thành viên mới — cùng điều kiện với duyệt tin.
  const f = bang.free;
  const hopDoiTuong = f.audience === "all" || (f.audience === "new" && soNgayMoTk <= f.days) || f.audience === (hs.role ?? "buyer");
  const coTheMienPhi = freeDangChay(f, homNay) && goi === f.tierId && hopDoiTuong && (f.quota === 0 || Number(hs.free_quota ?? 0) > 0);

  let mienPhi = coTheMienPhi;
  if (mienPhi && f.quota !== 0) {
    const { data: luot } = await admin.rpc("dung_luot_mien_phi", { p_user: userId });
    mienPhi = Boolean(luot && (luot as unknown[]).length);
  }
  if (mienPhi) tien = tachThue(0);

  // Voucher gói hội viên (0040) — chỉ khi thật sự có tiền phải trả.
  let voucher: { id: number; giam: number } | null = null;
  if (tien.tienHang > 0) {
    const { data: vc } = await admin.rpc("dung_voucher", { p_user: userId, p_loai: loaiVoucherTin(goi) });
    const v = (vc as { id: number; giam: number }[] | null)?.[0];
    if (v) {
      voucher = { id: v.id, giam: Math.min(Number(v.giam), tien.tienHang) };
      tien = tachThue(tien.tienHang - voucher.giam);
    }
  }

  // Ví thiếu (đã tính cả voucher) → hoàn voucher, báo số còn thiếu. Kiểm ở đây
  // để khách có voucher đủ bù phần thiếu không bị báo nhầm là thiếu tiền.
  if (tien.tongTra > Number(hs.balance ?? 0)) {
    if (voucher) await admin.rpc("hoan_voucher", { p_id: voucher.id });
    const du = Number(hs.balance ?? 0);
    return { ok: false, loi: `Ví không đủ: cần ${vnd(tien.tongTra)}, còn ${vnd(du)}.`, viThieu: tien.tongTra - du };
  }

  // ── Up: trừ ví + đặt lại ngày trong MỘT hàm CSDL ─────────────────────────
  const { data: kq, error } = await admin.rpc("up_tin", {
    p_listing: id, p_user: userId, p_tier: goi, p_so_ngay: soNgay, p_tien: tien.tongTra,
  });
  if (error) {
    if (voucher) await admin.rpc("hoan_voucher", { p_id: voucher.id });
    if (/VI_KHONG_DU/.test(error.message)) {
      const { data: vi } = await admin.from("profiles").select("balance").eq("id", userId).limit(1);
      const du = Number(vi?.[0]?.balance ?? 0);
      return { ok: false, loi: `Ví không đủ: cần ${vnd(tien.tongTra)}, còn ${vnd(du)}.`, viThieu: tien.tongTra - du };
    }
    return { ok: false, loi: error.message, code: 500 };
  }
  const d = (kq as { so_du: number; het_han: string }[] | null)?.[0];

  // ĐÃ UP XONG → huỷ mọi yêu cầu "chờ nạp" của tin này. Không huỷ thì lần nạp
  // tiền kế tiếp sẽ tự Up THÊM lần nữa = thu tiền hai lần.
  await admin.from("up_cho").update({ trang_thai: "huy", ghi_chu: "Tin đã được Up", xong_luc: new Date().toISOString() })
    .eq("listing_id", id).eq("trang_thai", "cho");

  // ── Ghi sổ doanh thu (chỉ khi có thu tiền) ───────────────────────────────
  if (tien.tongTra > 0) {
    const canHoaDon = Boolean(hs.xuat_hoa_don);
    const { error: loiSo } = await admin.from("doanh_thu").insert({
      user_id: userId,
      listing_id: id,
      loai: "up_tin",
      mo_ta: `Up tin ${tenGoi} ${soNgay} ngày — ${tin.title}${voucher ? ` (voucher hội viên −${vnd(voucher.giam)})` : ""}`,
      tien_hang: tien.tienHang,
      tien_thue: tien.tienThue,
      thue_suat: THUE_SUAT_GTGT,
      tong_tra: tien.tongTra,
      yeu_cau_hoa_don: canHoaDon,
      hoa_don_loai: canHoaDon ? "rieng" : "tong",
      ten_nguoi_mua: canHoaDon ? hs.hd_ten_cong_ty : hs.full_name,
      mst_nguoi_mua: canHoaDon ? hs.hd_mst : null,
      dia_chi_nguoi_mua: canHoaDon ? hs.hd_dia_chi : null,
      email_nguoi_mua: (canHoaDon ? hs.hd_email : null) || hs.email,
    });
    if (loiSo) {
      await baoLoi({
        noi: "up-tin",
        mucDo: "chet",
        tomTat: "Đã trừ tiền Up tin nhưng KHÔNG ghi được sổ doanh thu",
        chiTiet: `Tin ${id} — ${loiSo.message}`,
        hauQua: "Tờ khai thuế thiếu một khoản thu, khách cũng không được xuất hóa đơn khoản này.",
        canLam: `Vào /admin/hoa-don-thue → ghi tay khoản ${vnd(tien.tongTra)} (Up tin "${tin.title}").`,
        khoa: `up-tin:doanh-thu:${id}:${homNay}`,
      });
    }
  }

  return { ok: true, daTru: tien.tongTra, mienPhi, soDu: d?.so_du, hetHan: d?.het_han, tieuDe: tin.title, tenGoi };
}

// ── TIỀN VỪA VÀO VÍ → TỰ UP CÁC TIN ĐANG CHỜ NẠP ────────────────────────────
// Gọi sau khi cộng ví (webhook PayOS, admin cộng tay). KHÔNG BAO GIỜ ném lỗi:
// tiền đã vào ví rồi, lỗi ở đây không được làm hỏng việc nạp tiền.
export async function xuLyUpCho(admin: SupabaseClient, userId: string): Promise<number> {
  let daUp = 0;
  try {
    // Yêu cầu quá 7 ngày không nạp → bỏ.
    await admin.from("up_cho").update({ trang_thai: "huy", ghi_chu: "Quá 7 ngày chưa nạp", xong_luc: new Date().toISOString() })
      .eq("user_id", userId).eq("trang_thai", "cho").lt("tao_luc", new Date(Date.now() - 7 * 86_400_000).toISOString());

    const { data: ds } = await admin.from("up_cho").select("id,listing_id,tier,so_ngay")
      .eq("user_id", userId).eq("trang_thai", "cho").order("tao_luc", { ascending: true });
    const { data: hs } = await admin.from("profiles").select("email,phone").eq("id", userId).limit(1);

    for (const y of (ds ?? []) as { id: number; listing_id: string; tier: TierId; so_ngay: number }[]) {
      const kq = await thucHienUpTin(admin, userId, y.listing_id, y.tier, y.so_ngay);
      if (!kq.ok && kq.viThieu) break; // vẫn chưa đủ tiền → giữ nguyên chờ, dừng
      await admin.from("up_cho").update({
        trang_thai: kq.ok ? "xong" : "loi",
        ghi_chu: kq.ok ? `Đã trừ ${vnd(kq.daTru)}` : kq.loi,
        xong_luc: new Date().toISOString(),
      }).eq("id", y.id);
      if (!kq.ok) continue;
      daUp++;
      await guiThongBao({
        email: hs?.[0]?.email,
        phone: hs?.[0]?.phone,
        tieuDe: "Tin của bạn đã được Up tự động",
        loiNhan: "Tiền nạp đã vào ví, tin đã được Up theo đúng gói bạn chọn.",
        cacDong: [
          { nhan: "Tin đăng", giaTri: kq.tieuDe },
          { nhan: "Gói", giaTri: `${kq.tenGoi} · ${y.so_ngay} ngày` },
          { nhan: "Đã trừ ví", giaTri: vnd(kq.daTru) },
          ...(kq.hetHan ? [{ nhan: "Hiển thị đến", giaTri: new Date(kq.hetHan).toLocaleDateString("vi-VN") }] : []),
        ],
      });
    }
  } catch (e) {
    await baoLoi({
      noi: "up-tin-cho-nap",
      mucDo: "nang",
      tomTat: "Tự Up tin sau khi nạp tiền bị lỗi",
      chiTiet: String(e),
      hauQua: "Khách đã nạp tiền nhưng tin chưa được Up tự động.",
      canLam: "Vào /admin kiểm bảng up_cho của khách, Up tay giúp khách.",
      khoa: `up-cho:${userId}`,
    }).catch(() => {});
  }
  return daUp;
}
