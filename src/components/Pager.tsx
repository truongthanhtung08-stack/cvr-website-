"use client";

// Bộ chuyển trang dùng chung cho các danh sách "Xem thêm" xổ ra tại chỗ
// (tin trang chủ · dự án trang chủ · dự án liên quan).
export default function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Bấm sang trang khác → hiện NGAY từ mục đầu tiên của trang đó
  // (nhảy thẳng lên đầu danh sách, khách không phải tự cuộn lên).
  const go = (p: number) => { onChange(p); window.scrollTo({ top: 0 }); };

  const btn =
    "flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition";

  return (
    <div className="mt-6 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="Trang trước"
        className={`${btn} border border-cvr-line text-cvr-body hover:bg-cvr-surface disabled:opacity-40`}
      >
        ‹
      </button>
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => go(i + 1)}
          aria-current={i + 1 === page ? "page" : undefined}
          className={`${btn} ${
            i + 1 === page
              ? "bg-cvr-ink text-white"
              : "border border-cvr-line text-cvr-body hover:bg-cvr-surface"
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        aria-label="Trang sau"
        className={`${btn} border border-cvr-line text-cvr-body hover:bg-cvr-surface disabled:opacity-40`}
      >
        ›
      </button>
    </div>
  );
}
