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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Kích hoạt ngay khi mép trên của mục lọt vào ~88% chiều cao màn hình.
      // Dùng rootMargin thay cho threshold để mục cao (lưới nhiều card trên
      // mobile) vẫn luôn hiện — threshold cố định sẽ không bao giờ đạt nếu
      // mục cao hơn màn hình.
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
