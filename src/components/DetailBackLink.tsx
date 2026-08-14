"use client";

import { useRouter } from "next/navigation";

// Link "‹ Quay lại kết quả tìm kiếm" cho trang chi tiết BĐS — CHỈ DESKTOP (lg).
// Mobile đã có thanh BackBar dính dưới header. router.back() → về ĐÚNG trang kết
// quả tìm kiếm (giữ bộ lọc + vị trí cuộn); vào thẳng bằng link (không có lịch sử)
// → về trang danh sách theo mục đích cho an toàn.
export default function DetailBackLink({ fallback = "/mua-ban" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Quay lại kết quả tìm kiếm
    </button>
  );
}
