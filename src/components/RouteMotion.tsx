"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// ── CHUYỂN TRANG MƯỢT (thay cho rung phản hồi) ──────────────────────────────
// Vấn đề trước đây: trang chủ / mua-bán / cho-thuê / dự án đều render ĐỘNG trên
// máy chủ (đọc Supabase no-store). Chạm vào tab → trình duyệt đứng im 1–3 giây
// rồi mới nhảy trang → cảm giác "rất chậm, bấm không ăn".
//
// Ở đây làm 2 việc, đều thuần hình ảnh:
//   1. Chạm vào link nội bộ → hiện NGAY thanh tiến trình mảnh trên đỉnh màn hình
//      (không cần chờ máy chủ) — người dùng biết máy đã nhận lệnh.
//   2. Trang mới hiện ra → nội dung dâng lên + hiện dần 420ms (kiểu Apple).
//
// Việc rút ngắn thời gian chờ THẬT do các file loading.tsx đảm nhiệm.
export default function RouteMotion() {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const firstRender = useRef(true);

  // (1) Bắt mọi cú chạm vào link nội bộ — dùng capture để chạy trước Next Link.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;

      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Bấm đúng trang đang đứng → không có gì để chờ
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      setBusy(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // (2) Trang mới đã hiện → tắt thanh tiến trình + chạy hiệu ứng vào trang.
  useEffect(() => {
    setBusy(false);

    if (firstRender.current) {
      firstRender.current = false;
      return; // lần tải đầu: KHÔNG chạy hiệu ứng (giữ LCP nhanh)
    }

    const body = document.body;
    body.removeAttribute("data-nav");
    void body.offsetWidth; // ép trình duyệt chạy lại animation
    body.setAttribute("data-nav", "in");

    const t = setTimeout(() => body.removeAttribute("data-nav"), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  // Điều hướng bị huỷ (mất mạng, link mở hộp thoại thay vì chuyển trang) →
  // tự tắt thanh sau 6s để không có vạch xanh treo trên đỉnh màn hình.
  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => setBusy(false), 6000);
    return () => clearTimeout(t);
  }, [busy]);

  return busy ? <div className="cvr-progress" aria-hidden /> : null;
}
