// HIỂN THỊ MỘT CHƯƠNG TRÌNH — MỘT KIỂU CHO TOÀN WEB (chủ dự án 22/10/2026: "chương trình thì có Tên, Nội dung — áp dụng
// chung toàn web cho thống nhất"; "bố cục đẹp mắt — chương trình cần thu hút"; "Tiêu đề — Nội dung khuyến mãi — Áp dụng").
// BA PHẦN: Tiêu đề (biểu tượng quà + tên đậm) · Nội dung khuyến mãi (câu quyền lợi + nhãn điểm chính: cấp tin, số ngày
// hiển thị, ảnh, video) · Áp dụng (kẻ mảnh, chữ nhỏ). Dùng thẻ <span> để đặt được trong nút (ô chọn ở form đăng tin).
// Dữ liệu từ chuongTrinhTvMoi (src/lib/billing.ts) — đúng tên admin đặt, số lấy từ chương trình đã duyệt.
export default function NoiDungChuongTrinh({ ct }: { ct: { ten: string; the?: string[]; noiDung: string[]; apDung?: string } }) {
  return (
    <span className="block min-w-0">
      {ct.ten && (
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cvr-blue text-white" aria-hidden>
            <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </span>
          <span className="text-[16px] font-semibold leading-snug tracking-tight text-cvr-ink">{ct.ten}</span>
        </span>
      )}
      {ct.noiDung.map((d) => (
        <span key={d} className="mt-2.5 block text-[14px] font-medium leading-snug text-cvr-ink">{d}</span>
      ))}
      {!!ct.the?.length && (
        <span className="mt-2 flex flex-wrap gap-1.5">
          {ct.the.map((t) => (
            <span key={t} className="rounded-full bg-white px-2.5 py-1 text-[12.5px] font-medium text-cvr-ink ring-1 ring-inset ring-cvr-blue/30">{t}</span>
          ))}
        </span>
      )}
      {ct.apDung && (
        <span className="mt-3 block border-t border-cvr-blue/20 pt-2.5 text-[12.5px] leading-snug text-cvr-muted">
          <span className="font-semibold text-cvr-body">Áp dụng:</span> {ct.apDung}
        </span>
      )}
    </span>
  );
}
