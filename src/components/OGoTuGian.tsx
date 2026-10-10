"use client";

import { useLayoutEffect, useRef } from "react";

// Ô GÕ TỰ GIÃN (chủ dự án 10/10/2026): khách ghi ngắn thì một dòng; ghi dài thì ô tự cao
// thêm, xuống dòng được (Enter), không cắt chữ, không cuộn ngang. Dùng cho ô "Khác — tự ghi"
// và các ô đặc điểm gõ tay. Trang tin giữ đúng chỗ xuống dòng (whitespace-pre-line).
// ⛔ Khai báo ở MỨC TỆP — đặt trong thân component khác thì gõ một ký tự là mất con trỏ.
export default function OGoTuGian({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Cao đúng theo nội dung — cả khi giá trị nạp từ bản nháp / tin cũ.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      // Giữ đúng khung của ô nhập (bỏ chiều cao cố định h-10/h-11 → thành chiều cao tối thiểu, tự cao thêm).
      className={className.replace(/\bh-(10|11)\b/, "min-h-$1") + " block resize-none overflow-hidden py-2.5 leading-6"}
    />
  );
}
