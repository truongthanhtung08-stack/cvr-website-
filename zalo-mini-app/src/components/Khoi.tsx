import React, { ReactNode } from "react";
import { Text, useNavigate } from "zmp-ui";

// Khối nội dung: tiêu đề + "Xem thêm" dẫn tới trang đầy đủ (cấu trúc giống web).
export default function Khoi({ tieuDe, xemThem, children }: { tieuDe: string; xemThem?: string; children: ReactNode }) {
  const dieuHuong = useNavigate();
  return (
    <section className="khoi">
      <div className="khoi-dau">
        <Text.Title size="small">{tieuDe}</Text.Title>
        {xemThem && <span className="xem-them" onClick={() => dieuHuong(xemThem)}>Xem thêm</span>}
      </div>
      {children}
    </section>
  );
}
