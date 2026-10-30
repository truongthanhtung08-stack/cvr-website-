"use client";

import { useEffect, useRef, useState } from "react";
import { diemCat, veDauKhoi } from "@/lib/thuGon";

// NỘI DUNG DÀI → THU GỌN, nút "Xem thêm" kiểu Batdongsan ở cuối mục Tổng quan dự án (chủ dự án 31/10/2026: "dài thì xem thêm").
// Nội dung cao hơn CAO × 1,5 thì cắt ở CAO px (vệt mờ cuối), ngắn thì hiện trọn, không nút. Đường cắt rơi giữa ảnh / bản đồ / video
// thì cắt ngay trên nó. Bấm thanh mục (#tong-quan, #vi-tri…) tới phần đang bị thu → tự mở. Chữ vẫn có đủ trong HTML (Google đọc đủ).
const CAO = 720;

export default function ThuGonTrang({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dai, setDai] = useState(false);
  const [mo, setMo] = useState(false);
  const [catTai, setCatTai] = useState(CAO);
  // Cắt ngay dưới ảnh → không phủ vệt mờ (vệt mờ sẽ đè lên đáy ảnh)
  const [duoiAnh, setDuoiAnh] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tinh = () => {
      setDai(el.scrollHeight > CAO * 1.5);
      // Chỗ cắt theo luật chung cả web (diemCat): không cắt ngang ảnh, bản đồ, video, bảng…
      const { cat, sauKhoi: sauAnh } = diemCat(el, CAO);
      setCatTai(cat);
      setDuoiAnh(sauAnh);
    };
    tinh();
    // Ảnh, bản đồ tải xong mới có chiều cao thật → đo lại mỗi khi khối con đổi cỡ
    const ro = new ResizeObserver(tinh);
    [...el.children].forEach((c) => ro.observe(c));
    const anh = [...el.querySelectorAll("img")];
    anh.forEach((a) => a.addEventListener("load", tinh));
    // Bấm liên kết tới một mục nằm trong phần đang thu → mở ra trước khi cuộn tới
    const bam = (e: MouseEvent) => {
      // Liên kết #mục hoặc nút thanh mục dự án (ProjectNav, data-muc)
      const a = (e.target as HTMLElement).closest?.("a[href^='#'], [data-muc]");
      const id = a?.getAttribute("data-muc") ?? a?.getAttribute("href")?.slice(1);
      if (id && el.querySelector(`#${CSS.escape(id)}`)) setMo(true);
    };
    document.addEventListener("click", bam, true);
    return () => {
      anh.forEach((a) => a.removeEventListener("load", tinh));
      ro.disconnect();
      document.removeEventListener("click", bam, true);
    };
  }, []);

  return (
    <div>
      <div ref={ref} className={`relative overflow-hidden ${className}`} style={dai && !mo ? { maxHeight: `${catTai}px` } : undefined}>
        {children}
        {dai && !mo && !duoiAnh && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" aria-hidden />}
      </div>
      {dai && (
        // Như Batdongsan: "Xem thêm" → mở hết, "Thu gọn" nằm SÁT ngay dưới nội dung (chủ dự án 31/10/2026). Cùng kiểu nút cả web
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={(e) => { if (mo) veDauKhoi(e.currentTarget); setMo((v) => !v); }} className="btn-xemthem">
            {mo ? "Thu gọn" : "Xem thêm"}
            <svg className={`h-4 w-4 transition-transform ${mo ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
