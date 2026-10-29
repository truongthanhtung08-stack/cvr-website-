"use client";

import { useState } from "react";
import Image from "next/image";
import PhotoViewer from "@/components/PhotoViewer";
import PhotoList from "@/components/PhotoList";

// Lưới ảnh chi tiết dự án kiểu Batdongsan: 1 ảnh lớn trái + 4 ảnh nhỏ phải (2×2),
// bộ đếm ảnh góc dưới phải. Bấm ảnh bất kỳ → xem toàn màn hình kiểu Facebook
// (vuốt ngang đổi ảnh, vuốt xuống thoát, zoom không kéo ảnh ra ngoài khung).
// Bấm bộ đếm ảnh trên ĐIỆN THOẠI → danh sách ảnh xếp dọc (giống trang tin BĐS):
// cuộn lên xuống, cuộn tiếp ở cuối trang là thoát — xem PhotoList.
type Props = {
  images: string[];
  alt: string;
};

export default function ProjectGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [list, setList] = useState(false);
  const thumbs = images.slice(1, 5);
  const open = (i: number) => { setActive(i); setLightbox(true); };
  // Điện thoại chỉ thấy 1 ảnh lớn → bộ đếm mở DANH SÁCH ảnh.
  // Máy tính đã có lưới 5 ảnh → bộ đếm mở thẳng ảnh lớn như cũ.
  const bamDem = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) open(0);
    else setList(true);
  };

  return (
    <>
      <div className="relative">
        <div className="grid h-[190px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-none sm:h-[300px]">
          {/* Ảnh lớn — trái, chiếm 2 cột × 2 hàng (mobile: full) */}
          <button
            type="button"
            onClick={() => open(0)}
            className="group relative col-span-4 row-span-2 overflow-hidden sm:col-span-2"
          >
            <Image src={images[0]} alt={alt} fill priority quality={90} sizes="(max-width:640px) 100vw, 44vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          </button>

          {/* 4 ảnh nhỏ — phải, lưới 2×2 (ẩn trên mobile) */}
          {thumbs.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => open(i + 1)}
              className="group relative hidden overflow-hidden sm:block"
            >
              <Image src={src} alt={`${alt} ${i + 2}`} fill sizes="22vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            </button>
          ))}
        </div>

        {/* Bộ đếm ảnh — góc dưới phải */}
        <button
          type="button"
          onClick={bamDem}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-sm font-semibold text-cvr-ink shadow-md transition hover:bg-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16a0 0 0 010 0v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a0 0 0 010 0z" />
            <circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none" />
          </svg>
          {images.length}
        </button>
      </div>

      {/* Danh sách ảnh kiểu Facebook (điện thoại) — cuộn tiếp ở cuối trang là thoát */}
      {list && (
        <PhotoList images={images} title={alt} onPick={open} onClose={() => setList(false)} nhanPhim={!lightbox} />
      )}

      {/* Lightbox — xem lớn + zoom được (cuộn/bấm đúp), vuốt đổi ảnh */}
      {lightbox && <PhotoViewer images={images} start={active} title={alt} onClose={() => setLightbox(false)} />}
    </>
  );
}
