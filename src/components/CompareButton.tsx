"use client";

import { useCompare } from "@/lib/useCompare";
import { haptic } from "@/lib/haptic";

// Nút "So sánh" trên card (III.2). Bấm không điều hướng (chặn link cha).
export default function CompareButton({ id, className = "" }: { id: string; className?: string }) {
  const { has, toggle, full } = useCompare();
  const on = has(id);

  return (
    <button
      type="button"
      aria-label={on ? "Bỏ so sánh" : "Thêm vào so sánh"}
      aria-pressed={on}
      title={!on && full ? `Chỉ so sánh tối đa 4 tin` : on ? "Bỏ so sánh" : "Thêm vào so sánh"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        haptic();
        toggle(id);
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition ${
        on ? "bg-cvr-gold text-cvr-ink" : "bg-black/45 text-white hover:bg-black/70"
      } ${className}`}
    >
      {/* Icon so sánh (2 cột) */}
      <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4v16m8-16v16M4 8h8m-8 8h8" />
      </svg>
    </button>
  );
}
