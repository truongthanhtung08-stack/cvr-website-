"use client";

import { useState } from "react";
import { useHomeSection } from "@/components/HomeExpand";
import { TheDuAnDoc } from "@/components/TraCuuDuAn";
import PhanTrang from "@/components/PhanTrang";
import type { DongTraCuu } from "@/lib/traCuuDuAn";

// "DỰ ÁN TƯƠNG TỰ" trang dự án tra cứu — CHUẨN khối có "Xem thêm" (chủ dự án 30/10/2026): slide tối đa 8 thẻ dự án (thẻ dọc cùng
// kiểu Dự án nổi bật) + nút Xem thêm → phần còn lại của trang ẩn, danh sách thẻ Tra cứu 10 dự án / trang; nút Quay lại về như cũ
// (HomeExpand). Nguồn đã xếp: cùng tỉnh, cùng nhóm loại hình trước.
const SLIDE = 8;

export default function DuAnTuongTuTraCuu({ ds, id }: { ds: DongTraCuu[]; id?: string }) {
  const { expanded, hidden, toggle } = useHomeSection("du-an-tuong-tu");
  if (hidden || ds.length === 0) return null;

  // "Xem thêm" = CÙNG BỐ CỤC THẺ với dải slide (chủ dự án 31/10/2026: dự án tương tự một bố cục thẻ): lưới 4 thẻ / hàng,
  // thẻ trong hàng cao bằng nhau, 12 dự án / trang
  if (expanded) return <DanhSachTuongTu ds={ds} />;

  return (
    // PC cách đều như mọi phần trang dự án: 48 px trên, tiêu đề → thẻ 20 px (chủ dự án 31/10/2026)
    <section id={id} className="mt-6 scroll-mt-14 sm:mt-12">
      <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Dự án tương tự</h2>
      {/* Slide: điện thoại 1 thẻ (lộ thẻ kế), máy tính bảng 2, máy tính 4 — vuốt / cuộn ngang */}
      <ul className="no-scrollbar -mx-4 mt-4 grid snap-x snap-mandatory scroll-px-4 auto-cols-[80%] grid-flow-col items-start gap-x-4 overflow-x-auto px-4 py-2 sm:mx-0 sm:mt-3 sm:scroll-px-0 sm:auto-cols-[calc(50%-10px)] sm:gap-x-5 sm:px-0 lg:auto-cols-[calc(25%-15px)]">
        {ds.slice(0, SLIDE).map((x) => (
          <li key={x.slug} className="snap-start"><TheDuAnDoc d={x} /></li>
        ))}
      </ul>
      {/* "Xem thêm" chỉ khi còn dự án ngoài slide (30/10/2026) */}
      {ds.length > SLIDE && (
      <div className="mt-6 flex justify-center">
        <button type="button" onClick={toggle} className="btn-xemthem">
          Xem thêm
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      )}
    </section>
  );
}

const MOI_TRANG = 12;
function DanhSachTuongTu({ ds }: { ds: DongTraCuu[] }) {
  const [trang, setTrang] = useState(1);
  const tong = Math.max(1, Math.ceil(ds.length / MOI_TRANG));
  return (
    <section className="pt-1">
      <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Dự án tương tự</h2>
      <ul className="mt-4 grid grid-cols-1 items-start gap-x-4 gap-y-6 sm:mt-5 sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-4">
        {ds.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG).map((x) => (
          <li key={x.slug}><TheDuAnDoc d={x} /></li>
        ))}
      </ul>
      <PhanTrang hienTai={trang} tong={tong} doiTrang={(t) => { setTrang(t); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
    </section>
  );
}
