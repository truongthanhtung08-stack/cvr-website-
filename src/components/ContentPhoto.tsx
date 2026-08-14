"use client";

import { useState } from "react";
import PhotoViewer from "@/components/PhotoViewer";

// ẢNH CHÈN GIỮA NỘI DUNG (mô tả tin BĐS · tổng quan dự án · bài tin tức).
// Bấm vào ảnh → mở toàn màn hình như thư viện ảnh: ZOOM (chụm 2 ngón / bấm đúp),
// vuốt ngang qua các ảnh khác TRONG CÙNG BÀI, vuốt xuống thoát — dùng chung
// PhotoViewer nên cách dùng giống hệt mọi chỗ có ảnh khác.
export default function ContentPhoto({
  images,
  index,
  title,
}: {
  images: string[];   // toàn bộ ảnh chèn trong bài (để vuốt qua lại)
  index: number;      // vị trí ảnh này trong bài
  title?: string;
}) {
  const [mo, setMo] = useState(false);

  return (
    <>
      <figure className="overflow-hidden rounded-xl border border-cvr-line">
        <button
          type="button"
          onClick={() => setMo(true)}
          aria-label={`Phóng to ảnh ${index + 1}`}
          className="group relative block w-full cursor-zoom-in"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[index]} alt="" loading="lazy" className="h-auto w-full object-cover" />
          <span className="pointer-events-none absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 8v6m-3-3h6m4 0a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </button>
      </figure>

      {mo && (
        <PhotoViewer images={images} start={index} title={title} onClose={() => setMo(false)} />
      )}
    </>
  );
}
