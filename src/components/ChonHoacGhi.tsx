"use client";

import { useState } from "react";
import OGoTuGian from "@/components/OGoTuGian";

// Ô CHỌN CÓ LỐI TỰ GHI (chủ dự án 10/10/2026): ô có danh sách chuẩn thì cho chọn, kèm dòng
// cuối "Khác — tự ghi" để chắc chắn khách ghi được khi danh sách không có đúng thứ mình cần.
// Giá trị ngoài danh sách (tin cũ, bản nháp, khách tự ghi) hiện ở ô gõ, không bị mất.
// MỤC KHÔNG BẮT BUỘC (chủ dự án 16/10/2026: "chọn hoặc không chọn — thoát chỗ nào"): đã chọn hoặc
// đang tự ghi thì có nút × ngay trong ô để bỏ, ô trở về trống. Ô bắt buộc (batBuoc) không có nút này.
// ⛔ Khai báo ở MỨC TỆP, không đặt trong thân component khác — khai báo bên trong thì mỗi lần
// gõ React dựng lại ô, khách chỉ gõ được một ký tự (lỗi 10/10/2026).
const KHAC = "__tu_ghi"; // chỉ để form biết đang ở chế độ tự ghi — không lưu xuống DB

export default function ChonHoacGhi({
  value,
  onChange,
  options,
  className,
  batBuoc,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className: string;
  batBuoc?: boolean;
}) {
  const [tuGhi, setTuGhi] = useState(false);
  const dangGhi = tuGhi || (!!value && !options.includes(value));
  const boDuoc = !batBuoc && (!!value || dangGhi);
  return (
    <>
      <div className="relative">
        <select
          value={dangGhi ? KHAC : value}
          onChange={(e) => {
            const x = e.target.value;
            setTuGhi(x === KHAC);
            onChange(x === KHAC ? "" : x);
          }}
          className={className + (boDuoc ? " pr-16" : "")}
        >
          <option value="">Chọn</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
          <option value={KHAC}>Khác — tự ghi</option>
        </select>
        {boDuoc && (
          <button
            type="button"
            aria-label="Bỏ chọn"
            onClick={() => { setTuGhi(false); onChange(""); }}
            className="absolute right-8 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-cvr-muted transition hover:bg-cvr-line/60"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      {dangGhi && <OGoTuGian value={value} onChange={onChange} className={className + " mt-2"} />}
    </>
  );
}
