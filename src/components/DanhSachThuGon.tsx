"use client";

import { useState } from "react";
import { veDauKhoi } from "@/lib/thuGon";

// DANH SÁCH DÀI → hiện N mục đầu + "Xem thêm" ↔ "Thu gọn" (chủ dự án 22/10/2026: "các phần thuộc một dự án bố cục gọn,
// chuẩn"; chuẩn "Xem thêm" đã chốt — dự án 6 mục). Cùng kiểu nút với mô tả tin (MoTaThuGon). Ít hơn hoặc bằng N thì hiện
// trọn, không có nút.
// anBangCss (24/10/2026 — khối "Mọi người cũng tìm kiếm" cuối trang pSEO): mục bị thu VẪN nằm trong HTML (ẩn bằng CSS)
// để Google đọc đủ liên kết nội bộ; chỉ khách không thấy cho tới khi bấm "Xem thêm". the="ul" giữ đúng danh sách ul/li.
export default function DanhSachThuGon({ children, soHien = 6, className, the = "div", anBangCss = false }: {
  children: React.ReactNode[]; soHien?: number; className: string; the?: "div" | "ul"; anBangCss?: boolean;
}) {
  const [mo, setMo] = useState(false);
  const Khung = the;
  // Ẩn bằng CSS (nth-child) — bản build thật truyền danh sách từ máy chủ dạng "lười" nên không gắn thuộc tính từng mục được
  // (đo trên web 24/10/2026: nút có mà 18 ô vẫn hiện). Chuỗi lớp phải viết nguyên văn để Tailwind sinh CSS.
  const AN: Record<number, string> = { 8: "[&>*:nth-child(n+9)]:hidden" };
  const anCss = anBangCss && !mo ? ` ${AN[soHien] ?? ""}` : "";
  const hien = anBangCss || mo ? children : children.slice(0, soHien);
  return (
    <>
      <Khung className={className + anCss}>{hien}</Khung>
      {children.length > soHien && (
        // MỘT KIỂU NÚT "Xem thêm / Thu gọn" CẢ WEB, căn giữa dưới nội dung (chủ dự án 30/10/2026: chữ xanh lệch trái là mất hợp lý)
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={(e) => { if (mo) veDauKhoi(e.currentTarget); setMo((v) => !v); }} className="btn-xemthem">
            {mo ? "Thu gọn" : "Xem thêm"}
            <svg className={`h-4 w-4 transition-transform ${mo ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      )}
    </>
  );
}
