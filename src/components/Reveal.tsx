"use client";

import { useEffect, useRef, useState } from "react";

// Bọc một mục để nó nhẹ nhàng hiện lên (fade + trượt) khi cuộn tới.
export default function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // NGUYÊN TẮC SẮT: nội dung KHÔNG BAO GIỜ được kẹt ẩn.
  //   • "show"  = hiện thẳng, không hiệu ứng (mặc định SSR + khi đã trong khung nhìn).
  //   • "armed" = ẩn sẵn CHỜ cuộn tới (chỉ dùng cho mục DƯỚI màn hình → không nhấp nháy).
  //   • "in"    = cuộn tới → animate hiện dần.
  // Vì mặc định là "show", nếu JS không chạy / hydrate lỗi trên máy yếu thì nội
  // dung VẪN hiện đầy đủ (khác bản cũ: CSS ẩn sẵn, hỏng JS là trắng vĩnh viễn).
  const [state, setState] = useState<"show" | "armed" | "in">("show");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Đã trong (hoặc gần) khung nhìn ngay khi tải → hiện luôn, khỏi animate.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      setState("show");
      return;
    }

    // Dưới màn hình → ẩn sẵn, chờ cuộn tới. Kiểm tra vị trí trực tiếp (chạy trên
    // MỌI trình duyệt, không phụ thuộc IntersectionObserver vốn có máy không kích hoạt).
    setState("armed");
    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setState("in");
      cleanup();
    };
    const check = () => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) reveal();
    };
    const cleanup = () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      window.clearTimeout(safety);
    };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    // Lưới an toàn: tối đa 1.5s là hiện — tuyệt đối không để lại mảng trắng.
    const safety = window.setTimeout(reveal, 1500);
    return cleanup;
  }, []);

  const cls = state === "show" ? "" : state === "armed" ? "armed" : "armed is-visible";
  return (
    <div ref={ref} className={`reveal ${cls} ${className}`}>
      {children}
    </div>
  );
}
