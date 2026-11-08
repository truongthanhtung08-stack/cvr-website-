"use client";

import { useEffect } from "react";

// HIỆU ỨNG CHẠM CHUNG CẢ WEB (anh 08/11/2026: "cần hiệu ứng chuyển động chuẩn và mượt khi bấm vào menu cũng như vào các phần nào
// trên trang web — hiện tại rất khô cứng"). :active trên điện thoại chỉ hiện khi giữ ngón tay đủ lâu (iPhone bỏ qua hẳn) → mọi
// cú chạm vào link / nút / thẻ gắn lớp "vua-cham" 220ms: mờ nhẹ rồi sáng lại; nút nhỏ (< 240px) nhún thêm. Chỉ opacity/transform
// (CLAUDE.md 0C2: không làm chậm trang). Thanh dưới có hiệu ứng riêng (MobileTabBar "vua-bam") nên bỏ qua ở đây.
export default function HieuUngCham() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const el = (e.target as HTMLElement | null)?.closest?.("a[href], button, [role=button], summary") as HTMLElement | null;
      if (!el || el.closest("[aria-label='Điều hướng nhanh']") || (el as HTMLButtonElement).disabled) return;
      el.classList.remove("vua-cham", "vua-cham-nho");
      void el.offsetWidth; // chạm liên tiếp vẫn chạy lại
      el.classList.add("vua-cham");
      if (el.getBoundingClientRect().width < 240) el.classList.add("vua-cham-nho");
      window.setTimeout(() => el.classList.remove("vua-cham", "vua-cham-nho"), 240);
    };
    document.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    return () => document.removeEventListener("pointerdown", onDown, { capture: true });
  }, []);
  return null;
}
