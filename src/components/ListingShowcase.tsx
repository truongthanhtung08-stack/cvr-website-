"use client";

import { useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import ListingSlider from "@/components/ListingSlider";
import Pager from "@/components/Pager";
import type { Listing } from "@/lib/data";

const PER_PAGE = 8;

// ── KHỐI TIN DÙNG CHUNG ──────────────────────────────────────────────────────
// Cấu trúc chuẩn áp cho MỌI phần danh sách tin (BĐS tương tự · tin của dự án…):
//   · Mặc định: SLIDE cuộn ngang.
//   · Nút "Xem thêm" ở dưới → đổ ra DANH SÁCH dạng list (ảnh trái – nội dung phải),
//     phân trang 8 tin/trang, ngay tại chỗ. Bấm "Thu gọn" quay lại slide.
export default function ListingShowcase({
  items,
  emptyNote = "Chưa có tin đăng ở mục này.",
}: {
  items: Listing[];
  emptyNote?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);

  // Chưa có tin → VẪN dựng sẵn khung, chỉ báo trống. Có tin là chạy đúng cấu trúc
  // slide + "Xem thêm" mà không phải sửa gì thêm.
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-cvr-line bg-cvr-surface px-4 py-8 text-center text-sm text-cvr-muted">
        {emptyNote}
      </p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageItems = items.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <div>
      {!expanded ? (
        <ListingSlider items={items.slice(0, 8)} />
      ) : (
        <>
          <div className="space-y-4">
            {pageItems.map((l) => (
              <PropertyCard key={l.id} item={l} layout="list" />
            ))}
          </div>
          <Pager page={current} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {items.length > 8 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => { setExpanded((v) => !v); setPage(1); }}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-cvr-line px-6 text-sm font-semibold text-cvr-ink transition hover:bg-cvr-surface active:bg-cvr-surface"
          >
            {expanded ? "Thu gọn" : `Xem thêm (${items.length} tin)`}
            <svg
              className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
