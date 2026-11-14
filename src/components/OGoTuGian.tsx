"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

// Ô GÕ TỰ GIÃN (chủ dự án 10/10/2026): khách ghi ngắn thì một dòng; ghi dài thì ô tự cao
// thêm, xuống dòng được (Enter), không cắt chữ, không cuộn ngang. Dùng cho ô "Khác — tự ghi"
// và các ô đặc điểm gõ tay. Trang tin giữ đúng chỗ xuống dòng (whitespace-pre-line).
// ⛔ Khai báo ở MỨC TỆP — đặt trong thân component khác thì gõ một ký tự là mất con trỏ.
export default function OGoTuGian({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
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
  // CHỌN "Khác — tự ghi" (14/11/2026, đo khung 375: ô ghi mở ra nằm DƯỚI mép màn hình — bảng chọn đang khoá cuộn trang lúc ô nhận
  // con trỏ nên trình duyệt không kéo ô lên). Bảng đóng xong mà ô còn ngoài phần nhìn thấy → đưa ô vào giữa màn hình, giữ con trỏ.
  useEffect(() => {
    if (!autoFocus) return;
    const t = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const vv = window.visualViewport;
      const tren = vv?.offsetTop ?? 0;
      const duoi = tren + (vv?.height ?? window.innerHeight);
      const r = el.getBoundingClientRect();
      if (r.top < tren + 120 || r.bottom > duoi - 16) el.scrollIntoView({ block: "center", behavior: "smooth" });
      if (document.activeElement !== el) el.focus({ preventScroll: true });
    }, 350);
    return () => window.clearTimeout(t);
    // chỉ lúc ô vừa hiện (chọn "Khác — tự ghi")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      // Ô MỘT Ý (chỉ tự giãn khi chữ dài): phím Enter của bàn phím là "Tiếp" sang ô kế, không xuống dòng (lib/oTiepTheo)
      data-mot-dong=""
      // Giữ đúng khung của ô nhập (bỏ chiều cao cố định h-10/h-11 → thành chiều cao tối thiểu, tự cao thêm).
      className={className.replace(/\bh-(10|11)\b/, "min-h-$1") + " block resize-none overflow-hidden py-2.5 leading-6"}
    />
  );
}
