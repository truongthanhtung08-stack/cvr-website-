"use client";

import { useEffect, useRef, useState } from "react";

// MÔ TẢ TIN DÀI → THU GỌN + "Xem thêm" (như Batdongsan, chủ dự án 09/10/2026).
// Ngắn hơn khung thì hiện trọn, không có nút. Mô tả dài: "Xem thêm" ↔ "Thu gọn" (chủ dự án 09/10/2026).
//
// SỐ ĐIỆN THOẠI TRONG MÔ TẢ kiểu Batdongsan (chủ dự án 10/10/2026): máy chủ đã ẩn đuôi "0969 938 ∗∗∗";
// ở đây gắn nút "Hiện số" ngay cạnh — bấm là đi ĐÚNG luồng nút Hiện số của trang (xác thực nếu cần),
// có số rồi thì số trong mô tả hiện đủ.
const CO_SO_AN = /\d{4} \d{3} ∗∗∗/;

export default function MoTaThuGon({ children, cao = 240 }: { children: React.ReactNode; cao?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dai, setDai] = useState(false);
  const [mo, setMo] = useState(false);
  useEffect(() => {
    const el = ref.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (el) setDai(el.scrollHeight > cao + 40);
  }, [cao]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Bấm "Hiện số" trong mô tả = bấm nút Hiện số của trang; có số (link tel:) thì điền đủ vào mô tả
    const hienSo = () => {
      const nutTrang = [...document.querySelectorAll("button")].find((x) => /^Hiện số/.test(x.textContent?.trim() ?? "") && !el.contains(x));
      nutTrang?.click();
      let lan = 0;
      const doi = window.setInterval(() => {
        const tel = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]')].map((a) => a.href.replace(/\D/g, "").replace(/^84/, "0"));
        if (!tel.length && ++lan <= 120) return;
        window.clearInterval(doi);
        el.querySelectorAll<HTMLElement>("[data-so-an]").forEach((s) => {
          const du = tel.find((x) => x.startsWith(s.dataset.soAn ?? "-"));
          if (!du) return;
          s.textContent = du.replace(/^(\d{4})(\d{3})(\d+)$/, "$1 $2 $3");
          const b = s.nextElementSibling;
          if (b?.tagName === "BUTTON") b.remove();
        });
      }, 500);
    };
    // Đổi từng số đã ẩn đuôi thành [số ẩn][Hiện số]
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const ds: Text[] = [];
    while (walker.nextNode()) if (CO_SO_AN.test((walker.currentNode as Text).data)) ds.push(walker.currentNode as Text);
    for (const t of ds) {
      const frag = document.createDocumentFragment();
      let cuoi = 0;
      for (const m of t.data.matchAll(/(\d{4} \d{3}) ∗∗∗/g)) {
        frag.append(t.data.slice(cuoi, m.index));
        const so = document.createElement("span");
        so.dataset.soAn = m[1].replace(/\D/g, "");
        so.className = "font-semibold text-cvr-ink";
        so.textContent = `${m[1]} ∗∗∗`;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ml-1.5 font-semibold text-cvr-blue-ink underline underline-offset-2";
        b.textContent = "Hiện số";
        b.addEventListener("click", hienSo);
        frag.append(so, b);
        cuoi = (m.index ?? 0) + m[0].length;
      }
      frag.append(t.data.slice(cuoi));
      t.replaceWith(frag);
    }
  }, []);

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
