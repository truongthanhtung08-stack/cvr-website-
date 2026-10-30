"use client";

import { useState } from "react";
import { useHomeSection } from "@/components/HomeExpand";
import PhanTrang from "@/components/PhanTrang";
import { TheDuAnDoc } from "@/components/TraCuuDuAn";
import type { DongTraCuu } from "@/lib/traCuuDuAn";

// "DỰ ÁN TƯƠNG TỰ" trang dự án tra cứu — CHUẨN khối có "Xem thêm" (chủ dự án 30/10/2026): slide tối đa 8 thẻ dự án (thẻ dọc cùng
// kiểu Dự án nổi bật) + nút Xem thêm → phần còn lại của trang ẩn, danh sách thẻ Tra cứu 10 dự án / trang; nút Quay lại về như cũ
// (HomeExpand). Nguồn đã xếp: cùng tỉnh, cùng nhóm loại hình trước.
const SLIDE = 8;
const MOI_TRANG = 10;

export default function DuAnTuongTuTraCuu({ ds, id }: { ds: DongTraCuu[]; id?: string }) {
  const { expanded, hidden, toggle } = useHomeSection("du-an-tuong-tu");
  const [trang, setTrang] = useState(1);
  if (hidden || ds.length === 0) return null;

  if (expanded) {
    const tong = Math.max(1, Math.ceil(ds.length / MOI_TRANG));
    const hienTai = Math.min(trang, tong);
    return (
      <section className="pt-4 sm:pt-6">
        <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Dự án tương tự</h2>
        {/* Lưới thẻ dọc như danh sách Xem thêm trang Dự án: PC 4 · máy tính bảng 2 · điện thoại 1 cột (30/10/2026) */}
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {ds.slice((hienTai - 1) * MOI_TRANG, hienTai * MOI_TRANG).map((x) => <li key={x.slug}><TheDuAnDoc d={x} /></li>)}
        </ul>
        <PhanTrang hienTai={hienTai} tong={tong} doiTrang={(p) => { setTrang(p); window.scrollTo({ top: 0 }); }} />
      </section>
    );
  }

  return (
    <section id={id} className="mt-6 scroll-mt-14 sm:mt-14">
      <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Dự án tương tự</h2>
      {/* Slide: điện thoại 1 thẻ (lộ thẻ kế), máy tính bảng 2, máy tính 4 — vuốt / cuộn ngang */}
      <ul className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 py-2 sm:mx-0 sm:scroll-px-0 sm:gap-5 sm:px-0">
        {ds.slice(0, SLIDE).map((x) => (
          <li key={x.slug} className="w-[80%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"><TheDuAnDoc d={x} /></li>
        ))}
      </ul>
      {/* "Xem thêm" chỉ khi còn dự án ngoài slide (30/10/2026) */}
      {ds.length > SLIDE && (
      <div className="mt-6 flex justify-center">
        <button type="button" onClick={() => { setTrang(1); toggle(); }} className="btn-xemthem">
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
