"use client";

import { useState } from "react";
import Image from "next/image";
import PhotoViewer from "@/components/PhotoViewer";

// Ảnh trang dự án TRA CỨU (30/10/2026): một ảnh đại diện lấp khung; hồ sơ có nhiều ảnh → bộ đếm ảnh góc dưới phải (cùng kiểu
// trang dự án), bấm ảnh hay bộ đếm là xem lớn, vuốt đổi ảnh. Khung do trang cha đặt kích thước (ảnh tự giãn theo bảng thông tin).
export default function AnhTraCuu({ images, alt }: { images: string[]; alt: string }) {
  const [mo, setMo] = useState(false);
  if (!images.length) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/logo/symbol-dark.svg" alt="" className="absolute inset-0 m-auto h-14 w-14 opacity-25" />;
  }
  return (
    <>
      <button type="button" onClick={() => setMo(true)} className="group absolute inset-0" aria-label={`Xem ảnh ${alt}`}>
        <Image src={images[0]} alt={alt} fill priority fetchPriority="high" sizes="(max-width:1024px) 100vw, 40vw" className="object-cover" />
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-sm font-semibold text-cvr-ink shadow-md">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              <circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none" />
            </svg>
            {images.length}
          </span>
        )}
      </button>
      {mo && <PhotoViewer images={images} start={0} title={alt} onClose={() => setMo(false)} />}
    </>
  );
}
