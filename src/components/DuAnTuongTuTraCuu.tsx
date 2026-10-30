"use client";

import dynamic from "next/dynamic";
import { useHomeSection } from "@/components/HomeExpand";
import { TheDuAnDoc } from "@/components/TraCuuDuAn";
// Danh sách "Xem thêm" = ĐÚNG DẠNG TRANG DANH SÁCH DỰ ÁN MẶC ĐỊNH (chủ dự án 30/10/2026): thanh tìm + lọc, thẻ dự án, cột khu vực,
// 10 dự án / trang — nạp khi bấm Xem thêm (không tải sẵn lúc mở trang dự án)
const ProjectsBrowser = dynamic(() => import("@/components/ProjectsBrowser"));
import type { DongTraCuu } from "@/lib/traCuuDuAn";

// "DỰ ÁN TƯƠNG TỰ" trang dự án tra cứu — CHUẨN khối có "Xem thêm" (chủ dự án 30/10/2026): slide tối đa 8 thẻ dự án (thẻ dọc cùng
// kiểu Dự án nổi bật) + nút Xem thêm → phần còn lại của trang ẩn, danh sách thẻ Tra cứu 10 dự án / trang; nút Quay lại về như cũ
// (HomeExpand). Nguồn đã xếp: cùng tỉnh, cùng nhóm loại hình trước.
const SLIDE = 8;

export default function DuAnTuongTuTraCuu({ ds, id }: { ds: DongTraCuu[]; id?: string }) {
  const { expanded, hidden, toggle } = useHomeSection("du-an-tuong-tu");
  if (hidden || ds.length === 0) return null;

  if (expanded) return <div className="pt-1"><ProjectsBrowser projects={[]} articles={[]} traCuu={ds} danhSachNoiBat tieuDeDs="Dự án tương tự" /></div>;

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
