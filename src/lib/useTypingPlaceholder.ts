"use client";

import { useEffect, useRef, useState } from "react";

// Placeholder CHẠY CHỮ trong ô tìm kiếm (kiểu gõ máy): gõ dần từng chữ → giữ
// một nhịp cho đọc kịp → xoá → sang câu kế. Mục đích: dẫn người tìm biết NÊN GÕ
// GÌ, thay cho một dòng cố định chung chung.
//
// Kỷ luật (chuẩn Apple):
//   • Tôn trọng prefers-reduced-motion → đứng yên ở câu đầu.
//   • Người dùng đã gõ chữ (paused) → dừng hẳn, không giật chữ dưới tay họ.
//   • Tab ẩn → không chạy timer (đỡ tốn pin).

export function useTypingPlaceholder(phrases: string[], paused = false): string {
  const dau = phrases[0] ?? "";
  const [text, setText] = useState(dau);
  const idx = useRef(0);
  const len = useRef(dau.length);
  const xoa = useRef(false);

  // Đổi bộ câu (vd: chuyển tab Mua bán → Cho thuê) → về câu đầu của bộ mới.
  // Chỉnh state NGAY trong lúc render (cách React khuyến nghị), không dùng effect.
  const key = phrases.join("|");
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setText(dau); // các con trỏ chạy chữ được đặt lại trong effect ngay bên dưới
  }

  useEffect(() => {
    // Bộ câu mới (hoặc vừa gõ xong) → chạy lại từ đầu câu 1.
    idx.current = 0;
    len.current = dau.length;
    xoa.current = false;
    if (paused || phrases.length === 0) return;
    // Máy tắt hiệu ứng chuyển động → vẫn hiện câu gợi ý, đổi NGUYÊN CÂU mỗi 3,5 giây, không gõ từng chữ (01/11/2026: trước đây đứng
    // yên một câu nên khách bật chế độ này "không thấy câu gợi ý chạy")
    // LUÔN ĐỔI NGUYÊN CÂU (lỗi 18, 07/11/2026): gõ từng chữ cái làm ô trống có lúc chỉ hiện "B", "Bán n" — nhìn như khách đã gõ dở.
    // Nay hiện trọn câu, 3,5 giây đổi câu khác; tab ẩn thì trình duyệt tự giãn nhịp hẹn giờ.
    if (phrases.length < 2) return;
    const id = window.setInterval(() => { idx.current = (idx.current + 1) % phrases.length; setText(phrases[idx.current]); }, 3500);
    return () => window.clearInterval(id);
  }, [paused, key, dau, phrases]);

  return text;
}
