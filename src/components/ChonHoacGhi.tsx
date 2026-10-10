"use client";

import { useState } from "react";
import OGoTuGian from "@/components/OGoTuGian";

// Ô CHỌN CÓ LỐI TỰ GHI (chủ dự án 10/10/2026): ô có danh sách chuẩn thì cho chọn, kèm dòng
// cuối "Khác — tự ghi" để chắc chắn khách ghi được khi danh sách không có đúng thứ mình cần.
// Giá trị ngoài danh sách (tin cũ, bản nháp, khách tự ghi) hiện ở ô gõ, không bị mất.
// ⛔ Khai báo ở MỨC TỆP, không đặt trong thân component khác — khai báo bên trong thì mỗi lần
// gõ React dựng lại ô, khách chỉ gõ được một ký tự (lỗi 10/10/2026).
const KHAC = "__tu_ghi"; // chỉ để form biết đang ở chế độ tự ghi — không lưu xuống DB

export default function ChonHoacGhi({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className: string;
}) {
  const [tuGhi, setTuGhi] = useState(false);
  const dangGhi = tuGhi || (!!value && !options.includes(value));
  return (
    <>
      <select
        value={dangGhi ? KHAC : value}
        onChange={(e) => {
          const x = e.target.value;
          setTuGhi(x === KHAC);
          onChange(x === KHAC ? "" : x);
        }}
        className={className}
      >
        <option value="">Chọn</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={KHAC}>Khác — tự ghi</option>
      </select>
      {dangGhi && <OGoTuGian value={value} onChange={onChange} className={className + " mt-2"} />}
    </>
  );
}
