"use client";

import { useEffect } from "react";

// HIỆU ỨNG CHẠM CHUNG CẢ WEB (anh 08/11/2026: "cần hiệu ứng chuyển động chuẩn và mượt khi bấm vào menu cũng như vào các phần nào
// trên trang web — hiện tại rất khô cứng"). Chạm link / nút / thẻ → mờ nhẹ rồi sáng lại; nút nhỏ (< 240px) nhún thêm.
// CHỐNG GIẬT (anh 08/11/2026: "mọi thứ rất giật lag"): bản đầu chạy ngay lúc đặt ngón tay → mỗi lần BẮT ĐẦU VUỐT CUỘN cả thẻ tin nhấp nháy
// trong lúc cuộn + ép tính lại bố cục (offsetWidth). Nay: chỉ chạy khi là CHẠM BẤM — giữ yên 60ms không di chuyển; ngón tay đi > 8px,
// trang cuộn hay huỷ chạm thì bỏ. Chạy bằng Web Animations (GPU, chỉ opacity/transform), không đổi lớp, không ép bố cục.
// Thanh dưới có hiệu ứng riêng (MobileTabBar) nên bỏ qua ở đây.
const CHO = 60;
const XA = 8;
const MO = [{ opacity: 1 }, { opacity: 0.6, offset: 0.3 }, { opacity: 1 }];
const NHUN = [{ transform: "scale(1)" }, { transform: "scale(0.95)", offset: 0.3 }, { transform: "scale(1)" }];
const CACH = { duration: 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)" };

export default function HieuUngCham() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let hen = 0;
    let x0 = 0;
    let y0 = 0;
    const bo = () => { clearTimeout(hen); hen = 0; };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const el = (e.target as HTMLElement | null)?.closest?.("a[href], button, [role=button], summary") as HTMLElement | null;
      if (!el || el.closest("[aria-label='Điều hướng nhanh']") || (el as HTMLButtonElement).disabled) return;
      bo();
      x0 = e.clientX; y0 = e.clientY;
      const chay = () => {
        hen = 0;
        el.animate(MO, CACH);
        // nút nhỏ nhún thêm — đo kích thước một lần, sau khi đã chắc là chạm bấm (không đo trong lúc cuộn)
        if (el.offsetWidth < 240 && getComputedStyle(el).display !== "inline") el.animate(NHUN, { ...CACH, composite: "add" });
      };
      // chuột (máy tính) không có chuyện vuốt cuộn → chạy ngay; ngón tay → chờ 60ms xem có phải vuốt không
      if (e.pointerType === "mouse") chay();
      else hen = window.setTimeout(chay, CHO);
    };
    const onMove = (e: PointerEvent) => { if (hen && Math.hypot(e.clientX - x0, e.clientY - y0) > XA) bo(); };
    const onUp = () => { if (hen) { clearTimeout(hen); hen = 0; } };
    document.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    document.addEventListener("pointermove", onMove, { capture: true, passive: true });
    document.addEventListener("pointercancel", bo, { capture: true, passive: true });
    window.addEventListener("scroll", bo, { passive: true });
    // nhả tay trước 60ms (chạm rất nhanh) → vẫn chạy hiệu ứng ngay lúc nhả
    const onUpNhanh = (e: PointerEvent) => {
      if (!hen) return;
      const el = (e.target as HTMLElement | null)?.closest?.("a[href], button, [role=button], summary") as HTMLElement | null;
      onUp();
      if (el && Math.hypot(e.clientX - x0, e.clientY - y0) <= XA) el.animate(MO, CACH);
    };
    document.addEventListener("pointerup", onUpNhanh, { capture: true, passive: true });
    return () => {
      bo();
      document.removeEventListener("pointerdown", onDown, { capture: true });
      document.removeEventListener("pointermove", onMove, { capture: true });
      document.removeEventListener("pointercancel", bo, { capture: true });
      document.removeEventListener("pointerup", onUpNhanh, { capture: true });
      window.removeEventListener("scroll", bo);
    };
  }, []);
  return null;
}
