"use client";

import { useEffect, useRef, useState } from "react";

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
//   · Enter XUỐNG DÒNG được (chủ dự án 15/10/2026, thay cách cũ chặn Enter). Trang tin
//     hiện đúng chỗ xuống dòng; thẻ <title>, mô tả Google, thẻ tin gộp thành một dòng.
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

  // GÕ KHÔNG GIẬT (anh 17/11/2026: "nhập câu dài rất giật lag"): đo 375px — mỗi phím báo ra ngoài làm vẽ lại CẢ form đăng tin
  // (trung vị 43 ms/phím trên máy tính, điện thoại chậm ~4 lần). Cùng cách ô Mô tả (ContentEditor, 16/11): chữ hiện ngay trong
  // ô, ngừng gõ 300 ms mới báo ra ngoài; rời ô / đóng trang → báo ngay nên Đăng, Lưu nháp không mất chữ.
  const [chu, setChu] = useState(value);
  const daBao = useRef(value);
  const chuRef = useRef(value);
  const hen = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });
  // Giá trị đổi từ ngoài (mở tin nháp, sửa tin) → ô theo giá trị đó
  useEffect(() => {
    if (value === daBao.current) return;
    daBao.current = value;
    chuRef.current = value;
    setChu(value);
  }, [value]);
  const bao = () => {
    if (hen.current) { clearTimeout(hen.current); hen.current = null; }
    if (chuRef.current === daBao.current) return;
    daBao.current = chuRef.current;
    onChangeRef.current(chuRef.current);
  };
  const baoRef = useRef(bao);
  useEffect(() => { baoRef.current = bao; });
  useEffect(() => () => { if (hen.current) baoRef.current(); }, []);
  // Chạm / bấm chỗ khác (nút Đăng, Lưu nháp, Xem trước…) → báo ngay TRƯỚC cú bấm, kể cả máy không rời ô khi bấm nút
  useEffect(() => {
    const cham = (e: PointerEvent) => { if (hen.current && e.target !== ref.current) baoRef.current(); };
    document.addEventListener("pointerdown", cham, true);
    return () => document.removeEventListener("pointerdown", cham, true);
  }, []);

  // Giãn theo nội dung. Đặt về "auto" trước rồi mới đo scrollHeight — không thì
  // ô chỉ cao lên mà không bao giờ thấp xuống khi người dùng xoá bớt chữ.
  // ĐIỆN THOẠI (< 640px, anh 17/11/2026: "khung đủ cho 1 câu chuẩn, nhập nhiều câu thì chạy trong khung, không giật khi bấm"):
  // KHUNG CỐ ĐỊNH 3 dòng (đo 375px: tiêu đề chuẩn 63–68 ký tự = 2–3 dòng), dài hơn cuộn trong ô. Không giãn bằng mã — ô đổi cỡ
  // mỗi lần xuống dòng là cả trang bên dưới dịch theo = giật.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(max-width: 639px)").matches) {
      el.style.height = "";
      return;
    }
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [chu]);

  const so = chu.trim().length;

  return (
    <div>
      <textarea
        ref={ref}
        required={required}
        rows={2}
        value={chu}
        placeholder={placeholder}
        // Enter XUỐNG DÒNG được, giữ mọi ký tự khách gõ (chủ dự án 15/10/2026). Trang tin hiện đúng
        // chỗ xuống dòng; chỗ dùng cho Google / thẻ tin thì gộp thành một dòng.
        onChange={(e) => {
          chuRef.current = e.target.value;
          setChu(e.target.value);
          if (hen.current) clearTimeout(hen.current);
          hen.current = window.setTimeout(() => baoRef.current(), 300);
        }}
        onBlur={bao}
        // py-2.5: lớp ô chung (h-11, chỉ có lề ngang) làm chữ dính sát mép trên — "ô tiêu đề bố trí rất lệch" (chủ dự án 03/11/2026 mục 8)
        className={`${className.replace(/\bh-11\b/, "min-h-11")} resize-none overflow-hidden py-2.5 max-sm:h-[88px] max-sm:overflow-y-auto max-sm:overscroll-contain leading-snug focus:placeholder:text-transparent`} // chạm vào là chữ gợi ý ẩn (anh 16/11/2026)
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
