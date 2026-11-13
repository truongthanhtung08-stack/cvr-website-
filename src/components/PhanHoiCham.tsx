"use client";

import { useEffect } from "react";

// PHẢN HỒI CHẠM TOÀN WEB TRÊN ĐIỆN THOẠI — chuẩn Apple (anh 13/11/2026: "kiểm tra và chỉnh đồng nhất UI/UX, animation chuẩn Apple trên mobile").
// Đo 13/11 khổ 375: trang chủ 147 nút / thẻ bấm được, hơn 100 cái chạm vào KHÔNG thấy gì — iPhone Safari chỉ chạy :active khi trang có
// lắng nghe touchstart, còn Android chạm nhanh thì :active tắt trước khi kịp vẽ. Một chỗ cho cả web:
//   ① lắng nghe touchstart rỗng → mọi kiểu :active sẵn có (Tailwind active:, .press, globals.css) chạy được trên iPhone;
//   ② chạm là gắn .vua-bam ~220 ms vào đúng nút / thẻ / liên kết vừa chạm → globals.css vẽ cùng nhịp nhấn với :active.
// Không đổi giao diện lúc đứng yên; chỉ transform / opacity; tôn trọng giảm chuyển động (CSS).
export default function PhanHoiCham() {
  useEffect(() => {
    const rong = () => {};
    const cham = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      const el = (e.target as Element | null)?.closest?.("a, button, [role='button'], summary, label[for]");
      if (!el || (el as HTMLButtonElement).disabled) return;
      el.classList.remove("vua-bam");
      void (el as HTMLElement).offsetWidth; // chạm liên tiếp: chạy lại nhịp từ đầu
      el.classList.add("vua-bam");
      window.setTimeout(() => el.classList.remove("vua-bam"), 220);
    };
    document.addEventListener("touchstart", rong, { passive: true });
    document.addEventListener("pointerdown", cham, { passive: true });
    return () => { document.removeEventListener("touchstart", rong); document.removeEventListener("pointerdown", cham); };
  }, []);
  return null;
}
