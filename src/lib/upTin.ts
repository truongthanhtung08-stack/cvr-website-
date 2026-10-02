import type { SupabaseClient } from "@supabase/supabase-js";
import { ghepBillingLuu, bangTheoMucDich, huongKhuyenMai, quotePrice, vnd, type BillingData } from "@/lib/billing";
import { tachThue } from "@/lib/thue";
import { baoLoi } from "@/lib/baoLoi";
import { guiThongBao, MAU_DA_NHAN_TIN, maTin } from "@/lib/thongBao";
import type { TierId } from "@/lib/packages";

// ============================================================================
// ĐĂNG LẠI TIN ĐÃ HẾT HẠN = GỬI DUYỆT NHƯ TIN MỚI (chuẩn Batdongsan, chốt 01/10/2026)
// ----------------------------------------------------------------------------
// Batdongsan: "Tin mới; Tin đăng lại" đều qua kiểm duyệt như nhau. Vì vậy đăng lại
// KHÔNG trừ tiền, KHÔNG cho tin lên sóng ở đây — chỉ:
//   · ghi gói khách chọn vào details.plan (+ giá đã báo, máy chủ tự tính)
//   · xoá hạn cũ, trả quyền trừ tiền (da_tru_vi = false) → tin chuyển 'pending'
// Admin bấm Duyệt → /api/tin-dang/duyet làm ĐÚNG như tin mới: tính giá, miễn phí
// thành viên mới, voucher hội viên, trừ ví, ghi doanh thu, ngày đăng + hạn tính từ
// lúc duyệt. MỘT đường duyệt, MỘT cách tính tiền cho mọi tin.
// Cùng bất động sản → giữ mã tin, nội dung, ảnh, lượt xem, người hỏi số.
//
// Ví không đủ (so như form đăng tin mới: giá gói, miễn phí thì 0) → ghi up_cho; nạp
// đủ là máy tự gửi duyệt đúng gói đã chọn (xuLyUpCho).
// ============================================================================

export const HANG_UP: TierId[] = ["basic", "silver", "gold", "diamond"];

export type KetQuaUp =
  | { ok: true; phaiTra: number; mienPhi: boolean; tieuDe: string; tenGoi: string }
  | { ok: false; loi: string; viThieu?: number; code?: number };

export async function thucHienUpTin(
  admin: SupabaseClient,
  userId: string,
  id: string,
  goi: TierId,
  soNgay: number,
): Promise<KetQuaUp> {
  const { data: tin } = await admin.from("listings").select("id,title,owner_id,status,purpose,details").eq("id", id).single();
  if (!tin) return { ok: false, loi: "Không tìm thấy tin.", code: 404 };
  if (tin.owner_id !== userId) return { ok: false, loi: "Tin này không phải của bạn.", code: 403 };
  // Chỉ tin ĐÃ HẾT HẠN. Tin đang hiển thị muốn lên đầu thì dùng Đẩy tin.
  if (tin.status !== "expired") return { ok: false, loi: "Chỉ đăng lại được tin đã hết hạn. Tin đang hiển thị muốn lên đầu thì dùng Đẩy tin." };

  const { data: sc } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  const bang: BillingData = bangTheoMucDich(ghepBillingLuu(sc?.[0]?.data as Partial<BillingData> | undefined), tin.purpose);
  if (!bang.plans.find((p) => p.tierId === goi)?.terms.some((t) => t.days === soNgay)) {
    return { ok: false, loi: "Hạng tin hoặc thời hạn này hiện không bán." };
  }
  const tenGoi = bang.plans.find((p) => p.tierId === goi)?.name ?? "Gói tin";

  const { data: hsArr } = await admin
    .from("profiles")
    .select("created_at,role,free_quota,balance,email,phone,full_name")
    .eq("id", userId)
    .limit(1);
  const hs = hsArr?.[0];
  if (!hs) return { ok: false, loi: "Không tìm thấy tài khoản.", code: 404 };

  // ── Giá BÁO cho khách: y như form đăng tin mới (giá gói; miễn phí thì 0) ──
  // Tiền THẬT chỉ trừ lúc admin duyệt (duyet/route.ts) — không bao giờ cao hơn số báo.
  const homNay = new Date().toISOString().slice(0, 10);
  const soNgayMoTk = hs.created_at ? (Date.now() - new Date(hs.created_at).getTime()) / 86_400_000 : Number.POSITIVE_INFINITY;
  const bao = quotePrice({ data: bang, tierId: goi, days: soNgay, today: homNay, isNewMember: soNgayMoTk <= bang.free.days });
  // Khuyến mãi: CÙNG MỘT điều kiện với form đăng tin + duyệt tin (huongKhuyenMai).
  const mienPhi = huongKhuyenMai(bang.free, { goi, homNay, coChu: true, soNgayMoTk, role: hs.role, freeQuota: hs.free_quota });
  const giaBao = mienPhi ? 0 : bao.total;
  const phaiTra = tachThue(giaBao).tongTra;

  if (phaiTra > Number(hs.balance ?? 0)) {
    const du = Number(hs.balance ?? 0);
    return { ok: false, loi: `Ví không đủ: cần ${vnd(phaiTra)}, còn ${vnd(du)}.`, viThieu: phaiTra - du };
  }

  // ── Gửi duyệt: tin rời trạng thái hết hạn, chờ admin như tin mới ───────────
  const { nhac_het_han: _nhac, bao_da_nhan: _bao, ly_do_tu_choi: _lyDo, ...chiTiet } =
    (tin.details as Record<string, unknown> | null) ?? {};
  void _nhac; void _bao; void _lyDo;
  const { data: daGui, error } = await admin
    .from("listings")
    .update({
      status: "pending",
      // Gói ghi ĐÚNG MỘT CHỖ như tin mới (details.plan) — xoá cột gói cũ để duyệt tin
      // không đọc nhầm gói của lần đăng trước (duyet ưu tiên tier_yeu_cau/tier_days).
      tier_yeu_cau: null,
      tier_days: null,
      tier_expires_at: null,
      da_tru_vi: false,
      details: { ...chiTiet, plan: { tier: goi, days: soNgay, giaBao }, dang_lai: true },
    })
    .eq("id", id)
    .eq("status", "expired") // bấm hai lần không gửi hai lần
    .select("id");
  if (error) return { ok: false, loi: error.message, code: 500 };
  if (!daGui?.length) return { ok: false, loi: "Tin đã được gửi đăng lại rồi." };

  // ĐÃ GỬI → huỷ mọi yêu cầu "chờ nạp" của tin này, không thì lần nạp sau gửi lại lần nữa.
  await admin.from("up_cho").update({ trang_thai: "huy", ghi_chu: "Tin đã gửi đăng lại", xong_luc: new Date().toISOString() })
    .eq("listing_id", id).eq("trang_thai", "cho");

  await guiThongBao({
    email: hs.email,
    phone: hs.phone,
    tieuDe: "Coastal Land đã nhận yêu cầu đăng lại tin",
    loiNhan: "Tin đang chờ kiểm duyệt như tin mới. Duyệt xong tin hiển thị lại, ngày đăng và thời hạn tính từ lúc duyệt; " +
      "phí gói (nếu có) trừ vào ví lúc duyệt. Theo dõi tại coastalland.vn/tai-khoan/tin-dang.",
    cacDong: [
      { nhan: "Tin đăng", giaTri: tin.title },
      { nhan: "Gói", giaTri: `${tenGoi} · ${soNgay} ngày` },
      { nhan: "Phí", giaTri: mienPhi ? "Miễn phí" : vnd(phaiTra) },
    ],
    // Khách chỉ dùng SĐT (không email) vẫn phải được báo → mẫu ZBS "đã nhận tin, chờ duyệt"
    // (641611, đã duyệt) — đăng lại cũng là gửi tin chờ duyệt như tin mới.
    znsTemplateId: MAU_DA_NHAN_TIN,
    znsData: {
      ten_khach_hang: hs.full_name || "Quý khách",
      ma_tin: maTin(id),
      ten_tin: tin.title,
      thoi_gian: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }),
    },
  });

  return { ok: true, phaiTra, mienPhi, tieuDe: tin.title, tenGoi };
}

// ── TIỀN VỪA VÀO VÍ → TỰ GỬI ĐĂNG LẠI CÁC TIN ĐANG CHỜ NẠP ──────────────────
// Gọi sau khi cộng ví (webhook PayOS, admin cộng tay). KHÔNG BAO GIỜ ném lỗi:
// tiền đã vào ví rồi, lỗi ở đây không được làm hỏng việc nạp tiền.
export async function xuLyUpCho(admin: SupabaseClient, userId: string): Promise<number> {
  let daGui = 0;
  try {
    // Yêu cầu quá 7 ngày không nạp → bỏ.
    await admin.from("up_cho").update({ trang_thai: "huy", ghi_chu: "Quá 7 ngày chưa nạp", xong_luc: new Date().toISOString() })
      .eq("user_id", userId).eq("trang_thai", "cho").lt("tao_luc", new Date(Date.now() - 7 * 86_400_000).toISOString());

    const { data: ds } = await admin.from("up_cho").select("id,listing_id,tier,so_ngay")
      .eq("user_id", userId).eq("trang_thai", "cho").order("tao_luc", { ascending: true });

    for (const y of (ds ?? []) as { id: number; listing_id: string; tier: TierId; so_ngay: number }[]) {
      const kq = await thucHienUpTin(admin, userId, y.listing_id, y.tier, y.so_ngay);
      if (!kq.ok && kq.viThieu) break; // vẫn chưa đủ tiền → giữ nguyên chờ, dừng
      await admin.from("up_cho").update({
        trang_thai: kq.ok ? "xong" : "loi",
        ghi_chu: kq.ok ? "Đã gửi đăng lại, chờ duyệt" : kq.loi,
        xong_luc: new Date().toISOString(),
      }).eq("id", y.id);
      if (kq.ok) daGui++;
    }
  } catch (e) {
    await baoLoi({
      noi: "up-tin-cho-nap",
      mucDo: "nang",
      tomTat: "Tự gửi đăng lại tin sau khi nạp tiền bị lỗi",
      chiTiet: String(e),
      hauQua: "Khách đã nạp tiền nhưng tin chưa được gửi đăng lại.",
      canLam: "Vào /admin kiểm bảng up_cho của khách, gửi đăng lại giúp khách.",
      khoa: `up-cho:${userId}`,
    }).catch(() => {});
  }
  return daGui;
}
