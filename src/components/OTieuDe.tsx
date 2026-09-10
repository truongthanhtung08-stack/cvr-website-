"use client";

import { useEffect, useRef } from "react";

// ============================================================================
// Ô NHẬP TIÊU ĐỀ TIN — HIỆN TRỌN CHỮ, KHÔNG BAO GIỜ BỊ CHE
//
// Trước đây tiêu đề dùng <input> MỘT DÒNG. Tiêu đề tin bất động sản thường dài
// 60–90 ký tự, gõ tới đâu chữ trôi sang trái tới đó → phần đầu ("Bán nhà mặt…")
// biến mất khỏi khung, người đăng không đọc lại được câu mình vừa viết, cũng
// không soát được lỗi. Chủ dự án đã chỉ đúng chỗ này bằng ảnh chụp.
//
// Nay là <textarea> TỰ GIÃN CHIỀU CAO: gõ dài tới đâu ô cao thêm tới đó, luôn
// thấy đủ câu. Vẫn hành xử như một ô nhập tiêu đề bình thường:
//   · Enter KHÔNG xuống dòng (tiêu đề là một dòng dữ liệu, xuống dòng làm hỏng
//     cả tiêu đề lẫn thẻ <title> khi lên web) — chặn Enter và cắt mọi ký tự
//     xuống dòng nếu người dùng dán từ Word/Excel vào.
//   · Đếm ký tự để người đăng biết tiêu đề đã đủ dài cho SEO chưa.
// ============================================================================

const NGAN_NHAT = 30;   // dưới mức này tin bị chặn khi lưu
const TOT_NHAT = 70;    // quá mức này Google thường cắt bớt trên kết quả tìm kiếm

export default function OTieuDe({
  value,
  onChange,
  placeholder,
  className = "",
  required,
  demKyTu = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  demKyTu?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Giãn theo nội dung. Đặt về "auto" trước rồi mới đo scrollHeight — không thì
  // ô chỉ cao lên mà không bao giờ thấp xuống khi người dùng xoá bớt chữ.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const so = value.trim().length;

  return (
    <div>
      <textarea
        ref={ref}
        required={required}
        rows={2}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[\r\n]+/g, " "))}
        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        className={`${className} resize-none overflow-hidden leading-snug`}
      />
      {demKyTu && (
        <p className="mt-1 text-xs text-cvr-faint">
          {so} ký tự
          {so === 0
            ? ""
            : so < NGAN_NHAT
              ? ` · cần thêm ${NGAN_NHAT - so} ký tự nữa`
              : so > TOT_NHAT
                ? " · hơi dài, Google có thể cắt bớt khi hiện kết quả"
                : " · độ dài tốt"}
        </p>
      )}
    </div>
  );
}
