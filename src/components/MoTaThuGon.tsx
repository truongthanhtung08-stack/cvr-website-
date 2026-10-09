"use client";

import { useEffect, useRef, useState } from "react";

// MÔ TẢ TIN DÀI → THU GỌN + "Xem thêm" (như Batdongsan, chủ dự án 09/10/2026).
// Ngắn hơn khung thì hiện trọn, không có nút. Mô tả dài: "Xem thêm" ↔ "Thu gọn" (chủ dự án 09/10/2026).
export default function MoTaThuGon({ children, cao = 240 }: { children: React.ReactNode; cao?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dai, setDai] = useState(false);
  const [mo, setMo] = useState(false);
  useEffect(() => {
    const el = ref.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (el) setDai(el.scrollHeight > cao + 40);
  }, [cao]);
  return (
    <div>
      <div ref={ref} className="relative overflow-hidden" style={dai && !mo ? { maxHeight: cao } : undefined}>
        {children}
        {dai && !mo && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-cvr-surface to-transparent" aria-hidden />}
      </div>
      {dai && (
        <button type="button" onClick={() => setMo((v) => !v)} className="mt-2 text-[14px] font-semibold text-cvr-blue-ink">
          {mo ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </div>
  );
}
