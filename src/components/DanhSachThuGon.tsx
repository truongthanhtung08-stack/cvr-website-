"use client";

import { cloneElement, isValidElement, useState } from "react";

// DANH SÁCH DÀI → hiện N mục đầu + "Xem thêm" ↔ "Thu gọn" (chủ dự án 22/10/2026: "các phần thuộc một dự án bố cục gọn,
// chuẩn"; chuẩn "Xem thêm" đã chốt — dự án 6 mục). Cùng kiểu nút với mô tả tin (MoTaThuGon). Ít hơn hoặc bằng N thì hiện
// trọn, không có nút.
// anBangCss (24/10/2026 — khối "Mọi người cũng tìm kiếm" cuối trang pSEO): mục bị thu VẪN nằm trong HTML (thuộc tính hidden)
// để Google đọc đủ liên kết nội bộ; chỉ khách không thấy cho tới khi bấm "Xem thêm". the="ul" giữ đúng danh sách ul/li.
export default function DanhSachThuGon({ children, soHien = 6, className, the = "div", anBangCss = false }: {
  children: React.ReactNode[]; soHien?: number; className: string; the?: "div" | "ul"; anBangCss?: boolean;
}) {
  const [mo, setMo] = useState(false);
  const Khung = the;
  const hien = anBangCss
    ? children.map((c, i) => (!mo && i >= soHien && isValidElement<{ hidden?: boolean }>(c) ? cloneElement(c, { hidden: true }) : c))
    : mo ? children : children.slice(0, soHien);
  return (
    <>
      <Khung className={className}>{hien}</Khung>
      {children.length > soHien && (
        <button type="button" onClick={() => setMo((v) => !v)} className="mt-2 text-[14px] font-semibold text-cvr-blue-ink">
          {mo ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </>
  );
}
