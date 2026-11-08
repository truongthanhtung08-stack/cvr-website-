"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// HIỆU ỨNG CHUNG CẢ WEB — CHẠM + CUỘN (anh 08/11/2026: "hiệu ứng làm thế nào thì áp chung hết" · "không thấy hiệu ứng nào trên mobile
// khi cuộn, vuốt, trỏ vào menu (chưa bấm và bấm)").
//
// 1. CHẠM (mọi link / nút / thẻ, trừ thanh dưới đã có hiệu ứng riêng):
//    · đặt ngón tay ~50ms không di chuyển → nút MỜ XUỐNG và GIỮ mờ khi ngón còn đặt (lớp .dang-nhan) — "trỏ vào, chưa bấm" thấy ngay
//    · nhấc tay → sáng lại êm 220ms; chạm rất nhanh (< 50ms) vẫn nháy một nhịp lúc nhấc
//    · ngón tay đi > 8px / trang cuộn / huỷ chạm → bỏ ngay (vuốt cuộn không làm thẻ nhấp nháy — lỗi giật trước đây)
//    · chuột (máy tính): nhấn là mờ, nhả là sáng
// 2. CUỘN: tiêu đề khối (main section h2) trồi lên + hiện dần — KHÔNG thẻ tin (transform làm phần tử fixed trong thẻ lọt vào thẻ, lỗi 08/11/2026). Trình duyệt hỗ trợ animation-timeline
//    thì CSS lo (globals.css, chạy trên GPU); không hỗ trợ (Samsung Internet cũ…) thì dự phòng ở đây bằng IntersectionObserver —
//    chỉ ẩn thứ NẰM DƯỚI màn hình lúc đó (đầu trang, ảnh LCP luôn hiện ngay — CLAUDE.md 0C2), không bao giờ kẹt ẩn.
const CHO = 50;
const XA = 8;
const CHON = "a[href], button, [role=button], summary";

export default function HieuUngCham() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let hen = 0;
    let dang: HTMLElement | null = null;
    let x0 = 0;
    let y0 = 0;
    // Nhả: bỏ lớp mờ + cho sáng lại êm bằng Web Animations (không đụng transition riêng của từng nút)
    const tha = () => {
      clearTimeout(hen); hen = 0;
      if (!dang) return;
      const el = dang; dang = null;
      const nho = el.classList.contains("dang-nhan-nho");
      el.classList.remove("dang-nhan", "dang-nhan-nho");
      el.animate(nho
        ? [{ opacity: 0.55, transform: "scale(0.96)" }, { opacity: 1, transform: "scale(1)" }]
        : [{ opacity: 0.55 }, { opacity: 1 }], { duration: 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const el = (e.target as HTMLElement | null)?.closest?.(CHON) as HTMLElement | null;
      if (!el || el.closest("[aria-label='Điều hướng nhanh']") || (el as HTMLButtonElement).disabled) return;
      tha();
      x0 = e.clientX; y0 = e.clientY;
      const nhan = () => { hen = 0; dang = el; el.classList.toggle("dang-nhan-nho", el.offsetWidth < 240); el.classList.add("dang-nhan"); };
      if (e.pointerType === "mouse") nhan();
      else hen = window.setTimeout(nhan, CHO);
    };
    const onMove = (e: PointerEvent) => { if ((hen || dang) && Math.hypot(e.clientX - x0, e.clientY - y0) > XA) tha(); };
    const onUp = (e: PointerEvent) => {
      if (hen) {
        // chạm nhanh hơn 50ms → nháy một nhịp lúc nhấc tay
        const el = (e.target as HTMLElement | null)?.closest?.(CHON) as HTMLElement | null;
        clearTimeout(hen); hen = 0;
        if (el && Math.hypot(e.clientX - x0, e.clientY - y0) <= XA) {
          el.animate([{ opacity: 1 }, { opacity: 0.55, offset: 0.25 }, { opacity: 1 }], { duration: 260, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
        }
        return;
      }
      tha();
    };
    const o = { capture: true, passive: true } as const;
    document.addEventListener("pointerdown", onDown, o);
    document.addEventListener("pointermove", onMove, o);
    document.addEventListener("pointerup", onUp, o);
    document.addEventListener("pointercancel", tha, o);
    window.addEventListener("scroll", tha, { passive: true });
    return () => {
      tha();
      document.removeEventListener("pointerdown", onDown, o);
      document.removeEventListener("pointermove", onMove, o);
      document.removeEventListener("pointerup", onUp, o);
      document.removeEventListener("pointercancel", tha, o);
      window.removeEventListener("scroll", tha);
    };
  }, []);

  // CUỘN — dự phòng khi trình duyệt chưa hỗ trợ animation-timeline (có thì CSS đã lo, ở đây không làm gì)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: view()")) return;
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((ds) => {
      for (const d of ds) if (d.isIntersecting) { d.target.classList.add("da-hien"); io.unobserve(d.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    let khung = 0;
    const quet = () => {
      khung = 0;
      const day = window.innerHeight;
      document.querySelectorAll<HTMLElement>("main section h2:not([data-hien])").forEach((el) => {
        el.dataset.hien = "1";
        if (el.getBoundingClientRect().top > day) { el.classList.add("cho-hien"); io.observe(el); } // chỉ thứ dưới màn hình
      });
    };
    const henQuet = () => { if (!khung) khung = requestAnimationFrame(quet); };
    quet();
    const mo = new MutationObserver(henQuet); // danh sách nạp thêm (Xem thêm, chuyển trang) → quét phần mới
    const main = document.querySelector("main");
    if (main) mo.observe(main, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); cancelAnimationFrame(khung); };
  }, [pathname]);

  return null;
}
