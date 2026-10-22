"use client";

import { useState } from "react";

// THÊM MỤC TỰ GHI vào danh sách tick (Nội thất, Tiện ích) — chủ dự án 10/10/2026: danh sách
// chuẩn để chọn nhanh, kèm lối để khách tự bổ sung mục danh sách chưa có. Mục thêm hiện như
// một ô đã tick (bấm lần nữa là bỏ). Trang tin hiện đủ ("Tiện ích khác", Nội thất).
// ⛔ Khai báo ở MỨC TỆP — đặt trong thân component khác thì gõ một ký tự là mất con trỏ.
// ĐỒNG BỘ MỌI Ô CHỌN (chủ dự án 22/10/2026): "Khác — tự ghi" là MỤC CUỐI của danh sách, trông như các mục khác;
// bấm vào thì ô ghi hiện NGAY tại đó (như dòng "Khác — tự ghi" cuối bảng chọn). Đặt trong hàng mục (flex-wrap) thì
// boc = "" để nằm cuối hàng; ô ghi mở ra chiếm trọn hàng.
export default function ThemTuGhi({ onThem, className, boc = "mt-3" }: { onThem: (v: string) => void; className: string; boc?: string }) {
  const [chu, setChu] = useState("");
  const [mo, setMo] = useState(false);
  const them = () => {
    const v = chu.trim();
    if (v) onThem(v);
    setChu("");
    setMo(false);
  };
  if (!mo)
    return (
      <div className={boc}>
        <button type="button" onClick={() => setMo(true)} className="rounded-lg border border-cvr-line px-3 py-2 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
          Khác — tự ghi
        </button>
      </div>
    );
  return (
    <div className={`${boc} flex w-full basis-full gap-2`}>
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
        autoFocus
        placeholder="Khác — tự ghi"
        className={className + " min-w-0 flex-1"}
      />
      <button type="button" onClick={them} className="shrink-0 rounded-lg border border-cvr-line px-4 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
        Thêm
      </button>
    </div>
  );
}
