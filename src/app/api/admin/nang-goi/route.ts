import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ghepBillingLuu, bangTheoMucDich, giaNangGoi, loaiVoucherTin, vnd, type BillingData } from "@/lib/billing";
import { goiHienTai, type YeuCauNang } from "@/lib/nangGoi";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { guiThongBao, maTin, MAU_DUYET_TIN, MAU_TU_CHOI } from "@/lib/thongBao";
import { baoLoi } from "@/lib/baoLoi";
import { SU_CO } from "@/lib/chuThongBao";

// ============================================================================
// ADMIN DUYỆT / TỪ CHỐI YÊU CẦU NÂNG GÓI (chủ dự án chốt 01/11/2026)
// POST { id }                     → trừ ví đúng số đã báo khách, đổi gói, hạn = ngày duyệt + số ngày gói mới
//                                   (MỘT hạn, gói cũ dừng), ghi doanh thu (loai "nang_goi"), báo khách.
// POST { id, tuChoi: true, lyDo } → xoá yêu cầu (nhả tạm giữ), báo khách.
// CHỐNG TRỪ HAI LẦN: giành quyền bằng cách chuyển details.nang_cho → nang_dang_duyet (chỉ một lượt ghi
// thắng, lọc theo gui_luc); trừ ví hỏng thì trả nang_cho lại. Chuyển trước khi trừ còn để tru_vi không
// tính chính yêu cầu này vào tạm giữ (0067).
// GIÁ: tính lại từ bảng giá tại mốc khách gửi. Không bao giờ thu hơn số đã báo; số đã báo THẤP hơn giá
// tính lại (bảng giá đổi, hoặc dữ liệu bị sửa) → không duyệt, từ chối để khách gửi lại.
// ============================================================================
export const dynamic = "force-dynamic";

const loi = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

export async function POST(request: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Chưa đăng nhập", 401);
  const { data: me } = await ssr.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return loi("Chỉ quản trị viên được duyệt", 403);

  const { id, tuChoi, lyDo } = (await request.json().catch(() => ({}))) as { id?: string; tuChoi?: boolean; lyDo?: string };
  if (!id) return loi("Thiếu mã tin");
  const admin = createAdminClient();
  if (!admin) return loi("Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ.", 500);

  const { data: tin } = await admin
    .from("listings")
    .select("id,title,owner_id,status,purpose,tier,published_at,tier_expires_at,details")
    .eq("id", id)
    .single();
  if (!tin) return loi("Không tìm thấy tin", 404);
  const details = (tin.details ?? {}) as Record<string, unknown>;
  const yc = details.nang_cho as YeuCauNang | undefined;
  if (!yc) return NextResponse.json({ ok: true, boQua: "Tin không còn yêu cầu nâng gói (đã duyệt, đã huỷ hoặc đã từ chối)" });

  const { data: hsArr } = await admin
    .from("profiles")
    .select("balance,email,phone,full_name,xuat_hoa_don,hd_ten_cong_ty,hd_mst,hd_dia_chi,hd_email")
    .eq("id", tin.owner_id)
    .limit(1);
  const hs = hsArr?.[0] as { balance: number | null; email: string | null; phone: string | null; full_name: string | null;
    xuat_hoa_don: boolean | null; hd_ten_cong_ty: string | null; hd_mst: string | null; hd_dia_chi: string | null; hd_email: string | null } | undefined;
  const { nang_cho: _bo, ...khongYeuCau } = details;
  void _bo;

  // ── TỪ CHỐI ───────────────────────────────────────────────────────────────
  if (tuChoi) {
    const ly = (lyDo ?? "").trim() || "Yêu cầu chưa phù hợp";
    const { error } = await admin.from("listings").update({ details: khongYeuCau }).eq("id", id);
    if (error) return loi(error.message, 500);
    await guiThongBao({
      email: hs?.email, phone: hs?.phone,
      tieuDe: "Yêu cầu nâng gói chưa được duyệt",
      cacDong: [{ nhan: "Tin đăng", giaTri: tin.title }, { nhan: "Lý do", giaTri: ly }, { nhan: "Tiền tạm giữ", giaTri: "Đã nhả về ví" }],
      znsTemplateId: MAU_TU_CHOI,
      znsData: { ten_khach_hang: hs?.full_name || "Quý khách", ma_tin: maTin(String(tin.id)), ten_tin: tin.title, ly_do: ly },
    });
    return NextResponse.json({ ok: true, tuChoi: true });
  }

  // ── DUYỆT ─────────────────────────────────────────────────────────────────
  if (tin.status !== "approved") return loi("Tin không còn hiện trên web — từ chối yêu cầu này.");
  const { data: sc } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  const bang = ghepBillingLuu(sc?.[0]?.data as Partial<BillingData> | undefined);
  const { data: hv } = await admin.from("hoi_vien").select("goi").eq("user_id", tin.owner_id).gt("het_han", yc.gui_luc).limit(1);
  const thamSo = {
    data: bang, purpose: tin.purpose, tierMoi: yc.tier, soNgay: yc.days, goiHienTai: goiHienTai(tin),
    hoiVienId: (hv?.[0]?.goi as string | undefined) ?? null, apKhauTru: yc.apKhauTru, luc: Date.parse(yc.gui_luc),
  };
  let gia = giaNangGoi(thamSo);
  if (!gia) return loi("Gói khách chọn không còn trong bảng giá — từ chối để khách gửi lại.");
  if (yc.truocThue < gia.truocThue) return loi(`Số tiền trong yêu cầu (${vnd(yc.tongTra)}) thấp hơn bảng giá (${vnd(gia.tongTra)}) — từ chối để khách gửi lại.`);

  // Giành quyền xử lý
  const { data: gianh, error: loiGianh } = await admin
    .from("listings")
    .update({ details: { ...khongYeuCau, nang_dang_duyet: yc } })
    .eq("id", id)
    .eq("details->nang_cho->>gui_luc", yc.gui_luc)
    .select("id");
  if (loiGianh) return loi(loiGianh.message, 500);
  if (!gianh?.length) return NextResponse.json({ ok: true, boQua: "Yêu cầu đã được xử lý ở nơi khác" });

  // ── VOUCHER HỘI VIÊN "tin-vip" (chủ dự án 01/11/2026: CÓ áp cho nâng gói) — như đường duyệt tin: dùng lúc thu tiền,
  // trừ vào giá chưa thuế SAU khấu trừ và ưu đãi hội viên (giaNangGoi), lần thu không thành thì hoàn. Chỉ có voucher khi khách
  // đã mua gói hội viên — tức bảng Hội viên đã công bố. Tạm giữ lúc gửi là giá trước voucher (như 0056 với tin chờ duyệt).
  let voucher: { id: number; giam: number } | null = null;
  if (gia.truocThue > 0 && bang.hoiVien?.length) {
    const { data: vc } = await admin.rpc("dung_voucher", { p_user: tin.owner_id, p_loai: loaiVoucherTin(yc.tier) });
    const v = (vc as { id: number; giam: number }[] | null)?.[0];
    const coVoucher = v ? giaNangGoi({ ...thamSo, voucher: Number(v.giam) }) : null;
    if (v && coVoucher) { voucher = { id: v.id, giam: coVoucher.voucher }; gia = coVoucher; }
  }
  const tien = tachThue(gia.truocThue); // ≤ số đã báo
  const traLai = async () => {
    if (voucher) await admin.rpc("hoan_voucher", { p_id: voucher.id });
    await admin.from("listings").update({ details }).eq("id", id);
  };

  let soDuConLai = Number(hs?.balance ?? 0);
  if (tien.tongTra > 0) {
    const { data: viSau, error: loiVi } = await admin.rpc("tru_vi", { p_user: tin.owner_id, p_tien: tien.tongTra });
    if (loiVi) { await traLai(); return loi("Trừ ví thất bại: " + loiVi.message, 500); }
    if (!viSau || (viSau as unknown[]).length === 0) {
      await traLai();
      return loi(`Ví khách không đủ ${vnd(tien.tongTra)} tại thời điểm trừ tiền. Nhắc khách nạp thêm rồi duyệt lại.`);
    }
    soDuConLai = Number((viSau as { so_du: number }[])[0].so_du);

    const canHoaDon = Boolean(hs?.xuat_hoa_don);
    const tenGoiMoi = bangTheoMucDich(bang, tin.purpose).plans.find((p) => p.tierId === yc.tier)?.name ?? "Gói tin";
    const { error: loiSo } = await admin.from("doanh_thu").insert({
      user_id: tin.owner_id,
      listing_id: id,
      loai: "nang_goi",
      mo_ta: `Nâng gói · ${tenGoiMoi} ${yc.days} ngày — ${tin.title}${gia.khauTru ? ` (khấu trừ gói đang chạy −${vnd(gia.khauTru)})` : ""}${voucher ? ` (voucher hội viên −${vnd(voucher.giam)})` : ""}`,
      tien_hang: tien.tienHang,
      tien_thue: tien.tienThue,
      thue_suat: THUE_SUAT_GTGT,
      tong_tra: tien.tongTra,
      yeu_cau_hoa_don: canHoaDon,
      hoa_don_loai: canHoaDon ? "rieng" : "tong",
      ten_nguoi_mua: canHoaDon ? hs?.hd_ten_cong_ty : hs?.full_name,
      mst_nguoi_mua: canHoaDon ? hs?.hd_mst : null,
      dia_chi_nguoi_mua: canHoaDon ? hs?.hd_dia_chi : null,
      email_nguoi_mua: (canHoaDon ? hs?.hd_email : null) || hs?.email,
    });
    if (loiSo) {
      await baoLoi({
        noi: "nang-goi", khach: true, mucDo: "chet",
        tomTat: SU_CO.doanhThuDuyetTin.tomTat,
        chiTiet: `Nâng gói tin ${id} — ${loiSo.message}`,
        hauQua: SU_CO.doanhThuDuyetTin.hauQua,
        canLam: `Vào /admin/hoa-don-thue → ghi tay khoản ${vnd(tien.tongTra)} nâng gói tin "${tin.title}".`,
        khoa: `nang-goi:doanh-thu:${id}`,
      });
    }
  }

  // ── Đổi gói: MỘT hạn = ngày duyệt + số ngày gói mới; gói cũ dừng ──────────
  const bayGio = new Date();
  const hetHan = new Date(bayGio.getTime() + yc.days * 86_400_000).toISOString();
  const { nang_dang_duyet: _x, han_basic: _hb, ...giu } = { ...khongYeuCau } as Record<string, unknown>;
  void _x; void _hb;
  const planCu = (details.plan ?? {}) as Record<string, unknown>;
  const { error: loiLen } = await admin
    .from("listings")
    .update({
      tier: yc.tier,
      tier_days: yc.days,
      tier_expires_at: hetHan,
      published_at: bayGio.toISOString(),
      gia_chua_thue: tien.tienHang,
      tien_thue: tien.tienThue,
      thue_suat: THUE_SUAT_GTGT,
      details: {
        ...giu,
        // Ngày lên web gốc giữ nguyên để trang tin hiện đúng (như ListingForm nâng VIP).
        len_web_luc: (details.len_web_luc as string | undefined) ?? tin.published_at,
        // giaBao = phí thực trả (chưa VAT) của gói mới, tu = ngày bắt đầu gói — để lần nâng sau tính khấu trừ.
        plan: { ...planCu, tier: yc.tier, days: yc.days, giaBao: tien.tienHang, khuyenMai: false, tu: bayGio.toISOString(), nang: true },
      },
    })
    .eq("id", id);
  if (loiLen) return loi("Đã trừ tiền nhưng chưa đổi được gói: " + loiLen.message, 500);
  revalidateTag("listings", "max"); // gói tin đổi thật → trang hiện hạng mới

  await guiThongBao({
    email: hs?.email, phone: hs?.phone,
    tieuDe: "Gói tin của bạn đã được nâng",
    cacDong: [
      { nhan: "Tin đăng", giaTri: tin.title },
      { nhan: "Gói mới", giaTri: `${bangTheoMucDich(bang, tin.purpose).plans.find((p) => p.tierId === yc.tier)?.name ?? "Gói tin"} · ${yc.days} ngày` },
      ...(gia.khauTru ? [{ nhan: "Khấu trừ gói đang chạy", giaTri: `−${vnd(gia.khauTru)} (chưa thuế)` }] : []),
      ...(voucher ? [{ nhan: "Voucher hội viên", giaTri: `−${vnd(voucher.giam)} (chưa thuế)` }] : []),
      { nhan: "Tiền dịch vụ", giaTri: vnd(tien.tienHang) },
      { nhan: `Thuế GTGT ${(THUE_SUAT_GTGT * 100).toFixed(0)}%`, giaTri: vnd(tien.tienThue) },
      { nhan: "Đã trừ ví", giaTri: vnd(tien.tongTra) },
      { nhan: "Số dư còn lại", giaTri: vnd(soDuConLai) },
      { nhan: "Hiển thị đến", giaTri: new Date(hetHan).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) },
    ],
    znsTemplateId: MAU_DUYET_TIN,
    znsData: { ten_khach_hang: hs?.full_name || "Quý khách", ma_giao_dich: maTin(String(tin.id)), ten_tin: tin.title, so_tien: vnd(tien.tongTra), so_du: vnd(soDuConLai) },
  });
  return NextResponse.json({ ok: true, daTru: tien.tongTra, hetHan });
}
