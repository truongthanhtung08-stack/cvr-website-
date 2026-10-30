import { getTier, HUY_HIEU_CLS } from "@/lib/packages";

// ============================================================================
// NHÃN TÌNH TRẠNG DỰ ÁN — MỘT NHÃN cho mọi nơi có dự án (thẻ trang chủ, /du-an, Xem thêm, Dự án tương tự, ảnh đầu trang chi tiết).
// Chủ dự án 31/10/2026: chỉ dự án cấp VIP có tình trạng thành NHÃN trên ảnh, màu theo cấp; theo quy định hiển thị cấp (chốt 4–5/9):
// huy hiệu viên thuốc HUY_HIEU_CLS + dải màu cấp đỉnh khung ảnh, màu lấy từ packages.ts. Dự án thường: không nhãn, tình trạng ghi
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
      {/* Mọi nhãn rộng đều 112 px (vừa chữ dài nhất "Đã hoàn thành"), chữ căn giữa */}
      <span className={HUY_HIEU_CLS.replace("w-[70px]", "w-[112px]")} style={{ backgroundColor: t.accent, color: t.badgeText }}>
        {tinhTrang || "Đang cập nhật"}
      </span>
    </>
  );
}
