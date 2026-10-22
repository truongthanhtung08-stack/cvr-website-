"use client";

import { useState } from "react";

// DANH SÁCH DÀI → hiện N mục đầu + "Xem thêm" ↔ "Thu gọn" (chủ dự án 22/10/2026: "các phần thuộc một dự án bố cục gọn,
// chuẩn"; chuẩn "Xem thêm" đã chốt — dự án 6 mục). Cùng kiểu nút với mô tả tin (MoTaThuGon). Ít hơn hoặc bằng N thì hiện
// trọn, không có nút.
export default function DanhSachThuGon({ children, soHien = 6, className }: { children: React.ReactNode[]; soHien?: number; className: string }) {
  const [mo, setMo] = useState(false);
  return (
    <>
      <div className={className}>{mo ? children : children.slice(0, soHien)}</div>
      {children.length > soHien && (
        <button type="button" onClick={() => setMo((v) => !v)} className="mt-2 text-[14px] font-semibold text-cvr-blue-ink">
          {mo ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </>
  );
}
