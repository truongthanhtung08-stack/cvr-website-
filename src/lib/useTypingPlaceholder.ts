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
const TOC_GO = 55;   // ms mỗi chữ khi gõ
const TOC_XOA = 26;  // ms mỗi chữ khi xoá (xoá luôn nhanh hơn gõ)
const GIU = 1800;    // ms giữ nguyên câu đủ nghĩa
const NGHI = 320;    // ms nghỉ giữa 2 câu

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
    // Người dùng tắt hiệu ứng chuyển động → giữ nguyên câu đầu, không chạy gì.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let timer: number;
    const buoc = () => {
      const cau = phrases[idx.current] ?? "";
      if (!xoa.current) {
        if (len.current < cau.length) {
          len.current += 1;
          setText(cau.slice(0, len.current));
          timer = window.setTimeout(buoc, TOC_GO);
        } else {
          xoa.current = true;
          timer = window.setTimeout(buoc, GIU);
        }
      } else if (len.current > 0) {
        len.current -= 1;
        setText(cau.slice(0, len.current));
        timer = window.setTimeout(buoc, TOC_XOA);
      } else {
        xoa.current = false;
        idx.current = (idx.current + 1) % phrases.length;
        timer = window.setTimeout(buoc, NGHI);
      }
    };
    timer = window.setTimeout(buoc, GIU);

    // Tab ẩn → dừng; quay lại → chạy tiếp
    const onVis = () => {
      window.clearTimeout(timer);
      if (!document.hidden) timer = window.setTimeout(buoc, NGHI);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [paused, key, dau, phrases]);

  return text;
}
