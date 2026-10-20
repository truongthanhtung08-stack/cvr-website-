"use client";

import { useState } from "react";
import OGoTuGian from "@/components/OGoTuGian";
import ChonCoTim from "@/components/ChonCoTim";

// Ô CHỌN CÓ LỐI TỰ GHI (chủ dự án 10/10/2026): ô có danh sách chuẩn thì cho chọn, kèm dòng
// cuối "Khác — tự ghi" để chắc chắn khách ghi được khi danh sách không có đúng thứ mình cần.
// Giá trị ngoài danh sách (tin cũ, bản nháp, khách tự ghi) hiện ở ô gõ, không bị mất.
// ⛔ Khai báo ở MỨC TỆP, không đặt trong thân component khác — khai báo bên trong thì mỗi lần
// gõ React dựng lại ô, khách chỉ gõ được một ký tự (lỗi 10/10/2026).
const KHAC = "__tu_ghi"; // chỉ để form biết đang ở chế độ tự ghi — không lưu xuống DB
const KHAC_NHAN = "Khác — tự ghi"; // dòng cuối bảng chọn của web (mục không bắt buộc)

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
  // MỤC KHÔNG BẮT BUỘC → bảng chọn của web (chủ dự án 16/10/2026: trong Zalo bảng chọn gốc của
  // điện thoại không có nút tắt, khách không chọn thì kẹt). Bảng có nút quay lại, "Đóng", "Bỏ chọn".
  const dangGhi = tuGhi || (!!value && !options.includes(value));
  // ⛔ "Khác — tự ghi" LÀ DÒNG CUỐI CỦA BẢNG, chọn xong bảng đóng và Ô GHI HIỆN NGAY DƯỚI ô chọn trong form — cấu trúc đã
  // duyệt nhiều lần (chủ dự án 21/10/2026: "không phải hiện lên kiểu khung search", bàn phím che, khách không thấy chỗ ghi).
  // 16/10/2026 đổi sang bảng của web mà dòng này chỉ hiện khi gõ tìm → khách tưởng mất. ĐỪNG đổi lại kiểu gõ trong bảng.
  if (!batBuoc) {
    return (
      <>
        <ChonCoTim
          value={dangGhi ? KHAC_NHAN : value}
          onChange={(v) => { setTuGhi(v === KHAC_NHAN); onChange(v === KHAC_NHAN ? "" : v); }}
          options={[...options, KHAC_NHAN]}
          placeholder="Chọn"
          timPlaceholder="Tìm"
          className={className}
          xoaDuoc
        />
        {dangGhi && <OGoTuGian value={value} onChange={onChange} autoFocus={!value} className={className + " mt-2"} />}
      </>
    );
  }
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
          className={className}
        >
          <option value="">Chọn</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
          <option value={KHAC}>Khác — tự ghi</option>
        </select>
      </div>
      {dangGhi && <OGoTuGian value={value} onChange={onChange} className={className + " mt-2"} />}
    </>
  );
}
