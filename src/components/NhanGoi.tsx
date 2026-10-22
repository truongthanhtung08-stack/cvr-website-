import { getTier, type TierId } from "@/lib/packages";

// ============================================================================
// TÊN GÓI TIN TRÊN MỌI BẢNG GIÁ / BẢNG QUYỀN LỢI — một kiểu cho cả web (trang Báo giá, bước chọn gói khi đăng tin,
// mua gói đẩy, bảng quyền lợi). Chủ dự án 22/10/2026:
//   · màu gói theo đúng huy hiệu trên thẻ tin — CVR Basic KHÔNG có màu (thẻ tin Basic không huy hiệu) → chữ thường
//   · dưới tên gói là hệ số X (X8, X15, X30 · Cơ sở (1x))
// ============================================================================

export default function NhanGoi({ id, heSo = true }: { id: TierId; heSo?: boolean }) {
  const t = getTier(id);
  return (
    <span className="inline-flex flex-col items-center">
      {id === "basic" ? (
        <span className="whitespace-nowrap py-1 text-[12px] font-semibold tracking-tight text-cvr-ink sm:text-[13px]">{t.name}</span>
      ) : (
        <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight sm:px-3 sm:text-xs" style={{ backgroundColor: t.accent, color: t.badgeText }}>
          {t.name}
        </span>
      )}
      {heSo && <span className="mt-1 text-[11px] font-semibold tracking-wide text-cvr-muted">{t.heSoText}</span>}
    </span>
  );
}
