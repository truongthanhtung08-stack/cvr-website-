"use client";

import { useState } from "react";

// MỤC ẨN / HIỆN — MỘT KIỂU cho mọi phần KHÔNG BẮT BUỘC dài của trang đăng tin (chủ dự án 15/10/2026 Nội thất,
// Tiện ích; 22/10/2026 đổi kiểu theo mẫu đã duyệt + áp Đặc điểm, Quy định gói tin). Khối nền xám riêng, tên to,
// dòng dưới ghi sẵn bên trong có gì (lấy từ chính danh sách — khách nhìn là biết khối dùng để làm gì, không lẫn
// với nút chọn nhỏ), mũi tên trong vòng tròn. Mặc định thu gọn; đã chọn gì vẫn giữ khi ẩn. Mục bắt buộc KHÔNG
// đặt trong khối này — luôn hiện.
export default function MucAnHien({ ten, goiY, soChon, children }: { ten: string; goiY?: string; soChon?: number; children: React.ReactNode }) {
  const [mo, setMo] = useState(false);
  return (
    <div className="rounded-2xl bg-cvr-surface">
      <button type="button" onClick={() => setMo(!mo)} aria-expanded={mo} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
        <span className="min-w-0">
          <span className="block text-base font-semibold tracking-tight text-cvr-ink">
            {ten}
            {!!soChon && <span className="ml-1.5 font-normal text-cvr-muted">({soChon})</span>}
          </span>
          {goiY && !mo && <span className="mt-0.5 block truncate text-[13px] text-cvr-muted">{goiY}</span>}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-cvr-line">
          <svg className={`h-4 w-4 text-cvr-ink transition ${mo ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      {mo && <div className="space-y-4 px-4 pb-4">{children}</div>}
    </div>
  );
}

// Dòng gợi ý: 3 mục đầu của danh sách + "…" nếu còn.
export const goiYDanhSach = (ds: string[]) => (ds.length > 3 ? `${ds.slice(0, 3).join(", ")}…` : ds.join(", "));
