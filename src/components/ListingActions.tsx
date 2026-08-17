"use client";

import { useSaved } from "@/lib/useSaved";
import { useCompare } from "@/lib/useCompare";

// Hàng thao tác trên TRANG CHI TIẾT tin: Lưu tin (yêu thích) · So sánh.
// Trên thẻ tin đã có nút icon; ở trang chi tiết dùng nút CÓ CHỮ cho rõ ràng
// (giống batdongsan.com.vn / homedy). Trạng thái lưu chung một chỗ với thẻ tin.
export default function ListingActions({ id }: { id: string }) {
  const { has: daLuu, toggle: luu } = useSaved();
  const { has: dangSoSanh, toggle: soSanh, full } = useCompare();
  const saved = daLuu(id);
  const compared = dangSoSanh(id);

  const base =
    "inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const off = "border-cvr-line bg-white text-cvr-body hover:-translate-y-0.5 hover:border-cvr-ink hover:text-cvr-ink";
  const on = "border-cvr-blue bg-cvr-blue text-white hover:bg-cvr-blue-ink";

  return (
    <div className="mt-4 flex flex-wrap gap-2.5">
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => luu(id)}
        className={`${base} ${saved ? on : off}`}
      >
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        {saved ? "Đã lưu" : "Lưu tin"}
      </button>

      <button
        type="button"
        aria-pressed={compared}
        title={!compared && full ? "Chỉ so sánh tối đa 4 tin" : undefined}
        onClick={() => soSanh(id)}
        className={`${base} ${compared ? on : off}`}
      >
        <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 4v16m8-16v16M4 8h8m-8 8h8" />
        </svg>
        {compared ? "Đang so sánh" : "So sánh"}
      </button>
    </div>
  );
}
