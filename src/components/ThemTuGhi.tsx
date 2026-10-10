"use client";

import { useState } from "react";

// THÊM MỤC TỰ GHI vào danh sách tick (Nội thất, Tiện ích) — chủ dự án 10/10/2026: danh sách
// chuẩn để chọn nhanh, kèm lối để khách tự bổ sung mục danh sách chưa có. Mục thêm hiện như
// một ô đã tick (bấm lần nữa là bỏ). Trang tin hiện đủ ("Tiện ích khác", Nội thất).
// ⛔ Khai báo ở MỨC TỆP — đặt trong thân component khác thì gõ một ký tự là mất con trỏ.
export default function ThemTuGhi({ onThem, className }: { onThem: (v: string) => void; className: string }) {
  const [chu, setChu] = useState("");
  const them = () => {
    const v = chu.trim();
    if (v) onThem(v);
    setChu("");
  };
  return (
    <div className="mt-3 flex gap-2">
      <input
        type="text"
        value={chu}
        onChange={(e) => setChu(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            them();
          }
        }}
        placeholder="Mục khác — tự ghi"
        className={className + " min-w-0 flex-1"}
      />
      <button type="button" onClick={them} className="shrink-0 rounded-lg border border-cvr-line px-4 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
        Thêm
      </button>
    </div>
  );
}
