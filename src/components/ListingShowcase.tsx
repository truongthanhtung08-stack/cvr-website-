"use client";

import ListingSlider from "@/components/ListingSlider";
import ListingBrowser from "@/components/ListingBrowser";
import { useHomeSection } from "@/components/HomeExpand";
import type { Listing } from "@/lib/data";

// ── KHỐI TIN DÙNG CHUNG ──────────────────────────────────────────────────────
// Cấu trúc chuẩn áp cho MỌI phần danh sách tin (BĐS tương tự · tin của dự án…):
//   · Mặc định: SLIDE cuộn ngang.
//   · Nút "Xem thêm" → ra ĐÚNG bố cục trang danh sách: tin bên trái + CỘT PHẢI
//     (lọc theo giá, theo khu vực) + phân trang. Dùng lại chính ListingBrowser
//     của /mua-ban nên không lệch cấu trúc. KHÔNG có "Thu gọn".
export default function ListingShowcase({
  items,
  emptyNote = "Chưa có tin đăng ở mục này.",
  sectionKey = "showcase",
  purpose = "ban",
  heading,
}: {
  items: Listing[];
  emptyNote?: string;
  // Khoá của khối — bấm "Xem thêm" thì phần còn lại của trang ẩn đi.
  sectionKey?: string;
  // Mục đích của danh sách khi mở rộng (bán / cho thuê).
  purpose?: "ban" | "thue";
  heading?: string;
}) {
  const { expanded, toggle } = useHomeSection(sectionKey);

  // Chưa có tin → VẪN dựng sẵn khung, chỉ báo trống.
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-cvr-line bg-cvr-surface px-4 py-8 text-center text-sm text-cvr-muted">
        {emptyNote}
      </p>
    );
  }

  // Đã bấm "Xem thêm" → danh sách theo trang + cột phải
  if (expanded) {
    return (
      <ListingBrowser
        heading={heading ?? (purpose === "thue" ? "Bất động sản cho thuê" : "Bất động sản mua bán")}
        purpose={purpose}
        items={items}
      />
    );
  }

  return (
    <div>
      <ListingSlider items={items.slice(0, 8)} />
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-cvr-line px-6 text-sm font-semibold text-cvr-ink transition hover:bg-cvr-surface active:bg-cvr-surface"
        >
          {`Xem thêm (${items.length} tin)`}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
