import type { SupabaseClient } from "@supabase/supabase-js";
import { guiThongBao, MAU_THANH_TOAN } from "@/lib/thongBao";

// ════════════════════════════════════════════════════════════════════════════
// BÁO "THANH TOÁN DỊCH VỤ THÀNH CÔNG" (mẫu ZBS 641606) — gọi SAU KHI đã trừ ví
// cho Up tin · đẩy tin · gói đẩy · gói hội viên. Không báo khi 0đ (miễn phí,
// dùng lượt/voucher) — không có giao dịch tiền thì không có gì để xác nhận.
// Gửi hỏng KHÔNG được làm hỏng giao dịch: tiền đã trừ, dịch vụ đã chạy.
// Duyệt tin (trừ ví lúc duyệt) KHÔNG gọi hàm này — đã có tin "Tin đã duyệt".
// ════════════════════════════════════════════════════════════════════════════
export async function baoThanhToan(
  admin: SupabaseClient,
  userId: string,
  { dichVu, soTien, soDu }: { dichVu: string; soTien: number; soDu: number | null | undefined },
): Promise<void> {
  if (!(soTien > 0)) return;
  try {
    const { data: hs } = await admin.from("profiles").select("email,phone,full_name").eq("id", userId).limit(1);
    const ho = hs?.[0] as { email: string | null; phone: string | null; full_name: string | null } | undefined;
    const vnd = (v: number) => `${v.toLocaleString("vi-VN")} đ`;
    const luc = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
    // Mã giao dịch: thời điểm (giờ VN) + 4 ký tự đầu mã khách — đủ để tra sổ doanh thu.
    const maGiaoDich = `CL${new Date(Date.now() + 7 * 3_600_000).toISOString().replace(/\D/g, "").slice(2, 14)}${userId.slice(0, 4).toUpperCase()}`;
    const soDuChu = soDu == null ? "—" : vnd(Number(soDu));

    await guiThongBao({
      email: ho?.email,
      phone: ho?.phone,
      tieuDe: "Thanh toán dịch vụ thành công",
      loiNhan: "Coastal Land xác nhận giao dịch thanh toán dịch vụ của bạn đã thành công. Lịch sử giao dịch xem tại coastalland.vn/tai-khoan/nap-tien.",
      cacDong: [
        { nhan: "Mã giao dịch", giaTri: maGiaoDich },
        { nhan: "Dịch vụ", giaTri: dichVu },
        { nhan: "Số tiền", giaTri: vnd(soTien) },
        { nhan: "Số dư ví", giaTri: soDuChu },
        { nhan: "Thời gian", giaTri: luc },
      ],
      znsTemplateId: MAU_THANH_TOAN,
      znsData: {
        ten_khach_hang: ho?.full_name || "Quý khách",
        ma_giao_dich: maGiaoDich,
        ten_dich_vu: dichVu,
        so_tien: vnd(soTien),
        so_du: soDuChu,
        thoi_gian: luc,
      },
    });
  } catch (e) {
    console.warn("[bao-thanh-toan]", e);
  }
}
