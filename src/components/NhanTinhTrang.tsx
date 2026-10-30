import { getTier } from "@/lib/packages";

const NHAN_CLS =
  "pointer-events-none absolute left-2 top-2 z-10 flex h-[18px] items-center rounded-full px-2 text-[9px] font-bold uppercase leading-none tracking-[0.06em] shadow-[0_1px_4px_rgba(0,0,0,0.3)]";

// ============================================================================
// NHÃN TÌNH TRẠNG DỰ ÁN — MỘT NHÃN cho mọi nơi có dự án (thẻ trang chủ, /du-an, Xem thêm, Dự án tương tự, ảnh đầu trang chi tiết).
// Chủ dự án 31/10/2026: chỉ dự án cấp VIP có tình trạng thành NHÃN trên ảnh, màu theo cấp; theo quy định hiển thị cấp (chốt 4–5/9):
// huy hiệu viên thuốc (dáng HUY_HIEU_CLS, nhỏ hơn) + dải màu cấp đỉnh khung ảnh, màu lấy từ packages.ts. Dự án thường: không nhãn, tình trạng ghi
// thành chữ ở phần nội dung (mỗi nơi tự ghi). Đặt trong khung ảnh có `relative`.
// ============================================================================

export type CapVip = "diamond" | "gold" | "silver";
export const capVip = (tier?: string): CapVip | undefined =>
  tier === "diamond" || tier === "gold" || tier === "silver" ? tier : undefined;

export default function NhanTinhTrang({ tier, tinhTrang }: { tier?: string; tinhTrang?: string }) {
  const cap = capVip(tier);
  if (!cap) return null;
  const t = getTier(cap);
  return (
    <>
      <span className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px" style={{ backgroundColor: t.bar }} aria-hidden />
      {/* NHỎ GỌN (chủ dự án 31/10/2026): cao 18 px, chữ 9 px, rộng theo chữ, sát góc trái trên 8 px — cùng dáng viên thuốc,
          màu, chữ hoa của huy hiệu cấp thẻ tin (HUY_HIEU_CLS) nhưng nhỏ hơn để không che ảnh */}
      <span className={NHAN_CLS} style={{ backgroundColor: t.accent, color: t.badgeText }}>
        {tinhTrang || "Đang cập nhật"}
      </span>
    </>
  );
}
