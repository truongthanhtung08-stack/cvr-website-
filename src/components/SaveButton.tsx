"use client";

import { useSaved } from "@/lib/useSaved";

// Nút "lưu tin" (trái tim). variant "overlay" = trên ẢNH (nền đen mờ) ·
// "bare" = trên nền TRẮNG (đáy thẻ, chỉ icon). Bấm không điều hướng (chặn link cha).
export default function SaveButton({
  id,
  className = "",
  variant = "overlay",
}: {
  id: string;
  className?: string;
  variant?: "overlay" | "bare";
}) {
  const { has, toggle } = useSaved();
  const saved = has(id);

  const style =
    variant === "bare"
      ? `${saved ? "text-cvr-blue" : "text-cvr-muted hover:text-cvr-blue"}`
      : `backdrop-blur-sm ${saved ? "bg-cvr-blue text-white" : "bg-black/45 text-white hover:bg-black/70"}`;

  return (
    <button
      type="button"
      aria-label={saved ? "Bỏ lưu tin" : "Lưu tin"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition ${style} ${className}`}
    >
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}
