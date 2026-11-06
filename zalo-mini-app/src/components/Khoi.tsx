import React, { ReactNode } from "react";
import { Text, useNavigate } from "zmp-ui";

// Khối nội dung: tiêu đề cả dòng · nội dung · nút "Xem thêm" DƯỚI nội dung, canh giữa (như web bản điện thoại, 06/11/2026 — trước nằm cạnh
// tiêu đề làm tiêu đề bị cắt ở khổ máy thật).
export default function Khoi({ tieuDe, xemThem, children }: { tieuDe: string; xemThem?: string; children: ReactNode }) {
  const dieuHuong = useNavigate();
  return (
    <section className="khoi">
      <div className="khoi-dau">
        <Text.Title size="small">{tieuDe}</Text.Title>
      </div>
      {children}
      {xemThem && <div className="hang-xem-them"><button className="btn-xemthem" onClick={() => dieuHuong(xemThem)}>Xem thêm<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>}
    </section>
  );
}
