"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================================
// KHUNG VUỐT NGANG — mọi bảng kiểu ma trận (giá gói tin, giá đẩy tin, đặc điểm) và dải gói có hình minh hoạ.
// Chủ dự án 22/10/2026 tối: "kiểu ma trận thì khách không biết còn phần giấu phía trong" → nội dung rộng hơn khung thì có
//   · hàng nút ‹ › NẰM TRÊN khung, canh phải — KHÔNG đè lên tên gói ("dấu thanh trượt <> để cho không bị che tên gói")
//   · mép phải mờ dần khi còn phần bên phải
// Bấm › / ‹ là cuộn sang; hết phần giấu phía nào thì nút phía đó mờ đi. Vừa khung thì không hiện gì. Không câu hướng dẫn.
// Trước khi đo (lúc trang vừa mở): điện thoại để sẵn hàng nút (bảng gần như luôn rộng hơn màn hình) cho trang không bị
// xô khi nút hiện ra; máy tính để ẩn.
// ============================================================================

export default function KhungCuonNgang({
  children,
  className = "",
  khung = "rounded-2xl border border-cvr-line bg-white",
}: {
  children: React.ReactNode;
  className?: string; // lớp của vỏ ngoài (vd ẩn/hiện theo màn hình)
  khung?: string;     // lớp của ô cuộn (viền, bo góc, nền / hàng flex của dải thẻ)
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [daDo, setDaDo] = useState(false);
  const [trai, setTrai] = useState(false);
  const [phai, setPhai] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const doLai = () => {
      setTrai(el.scrollLeft > 4);
      setPhai(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
      setDaDo(true);
    };
    doLai();
    el.addEventListener("scroll", doLai, { passive: true });
    const ro = new ResizeObserver(doLai);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", doLai);
      ro.disconnect();
    };
  }, []);

  const cuon = (huong: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: huong * Math.max(140, el.clientWidth * 0.6), behavior: "smooth" });
  };
  const coTran = trai || phai;
  const nut =
    "flex h-8 w-8 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-ink transition hover:border-cvr-ink active:scale-95 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className={className}>
      <div className={`mb-2 justify-end gap-1.5 ${!daDo ? "flex sm:hidden" : coTran ? "flex" : "hidden"}`}>
        <button type="button" aria-label="Xem phần bên trái" disabled={!trai} onClick={() => cuon(-1)} className={nut}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button type="button" aria-label="Xem phần bên phải" disabled={daDo && !phai} onClick={() => cuon(1)} className={nut}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      {/* Không dải mờ mép phải (chủ dự án 23/10/2026: "vì sao các mục chuyển qua lại có dải mờ bên phải") — nút ‹ › trên đầu đã
          báo còn phần bên kia. */}
      <div ref={ref} className={`overflow-x-auto ${khung}`}>
        {children}
      </div>
    </div>
  );
}
