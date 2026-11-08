"use client";

import { useState } from "react";
import Image from "next/image";
import PhotoViewer from "@/components/PhotoViewer";
import PhotoList from "@/components/PhotoList";
import DemAnhVideo from "@/components/DemAnhVideo";
import { anhNho } from "@/lib/asset";

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
  // ÍT ẢNH KHÔNG ĐỂ Ô TRỐNG (chủ dự án 30/10/2026 — dự án tra cứu có khi chỉ 1 ảnh) — máy tính: 1 ảnh tràn hết khung · 2 ảnh chia
  // đôi · 3 ảnh: lớn trái + 2 ảnh phải xếp trên dưới · 4 ảnh: lớn trái + phải 1 ảnh trên, 2 ảnh dưới · từ 5 ảnh: lưới 1 + 2×2 như cũ
  const n = Math.min(images.length, 5);
  const lopLon = n === 1 ? "sm:col-span-4" : "sm:col-span-2";
  const lopNho = (i: number) =>
    n === 2 ? "sm:col-span-2 sm:row-span-2" : n === 3 ? "sm:col-span-2" : n === 4 && i === 0 ? "sm:col-span-2" : "";
  const open = (i: number) => { setActive(i); setLightbox(true); };

  // MỘT ẢNH (dự án tra cứu): khung CÙNG CỠ khung nhiều ảnh (hết bề ngang, cao 300 px máy tính) — anh 08/11/2026: "cấu trúc lại dự án tra cứu gọn tốt",
  // ảnh nhỏ 320 px lệch khi trang đã 2 cột như dự án nổi bật (trước: 30/10/2026 ảnh nhỏ 16:10).
  // Chuẩn lọc ảnh: ảnh ngang 16:10 (vd 1600 × 1000) là khít khung, không phải chỉnh.
  if (images.length === 1) {
    return (
      <>
        <button type="button" onClick={() => open(0)} className="group relative block h-[190px] w-full overflow-hidden bg-cvr-surface sm:h-[300px] sm:rounded-xl">
          <Image src={anhNho(images[0])} alt={alt} fill priority quality={90} sizes="(max-width:640px) 100vw, 88vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        </button>
        {lightbox && <PhotoViewer images={images} start={active} title={alt} onClose={() => setLightbox(false)} />}
      </>
    );
  }
  return (
    <>
      <div className="relative">
        <div className="grid h-[190px] grid-cols-4 grid-rows-2 gap-px overflow-hidden rounded-none sm:h-[300px]">
          {/* Ảnh lớn — trái, chiếm 2 cột × 2 hàng (mobile: full) */}
          <button
            type="button"
            onClick={() => open(0)}
            className={`group relative col-span-4 row-span-2 overflow-hidden ${lopLon}`}
          >
            {/* Ảnh đầu dùng bản NHỎ (1280 px, đủ nét cho khung ≤ 630 px) — CÙNG tệp với bộ ảnh điện thoại (Gallery) nên trang chỉ tải trước
                MỘT ảnh. Trước 31/10/2026 khung này lấy ảnh gốc: điện thoại (khung ẩn) vẫn tải trước thêm ảnh gốc ~380 KB, tranh đường truyền
                với ảnh đầu → LCP trang dự án ~5,2 s. Cùng cách trang tin (KhungAnhPC). Bấm ảnh xem lớn vẫn là ảnh gốc. */}
            <Image src={anhNho(images[0])} alt={alt} fill priority quality={90} sizes={n === 1 ? "(max-width:640px) 100vw, 88vw" : "(max-width:640px) 100vw, 44vw"} className="object-cover transition-transform duration-500 group-hover:scale-105" />
          </button>

          {/* 4 ảnh nhỏ — phải, lưới 2×2 (ẩn trên mobile) */}
          {thumbs.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => open(i + 1)}
              className={`group relative hidden overflow-hidden sm:block ${lopNho(i)}`}
            >
              <Image src={src} alt={`${alt} ${i + 2}`} fill sizes={lopNho(i) ? "44vw" : "22vw"} className="object-cover transition-transform duration-500 group-hover:scale-105" />
            </button>
          ))}
        </div>

        {/* Đếm ảnh — MỘT KIỂU với khung ảnh trang tin (DemAnhVideo, góc TRÁI DƯỚI như thẻ tin; góc trái trên là nhãn tình trạng) — anh 08/11/2026.
            Bấm vào khung ảnh là mở ảnh, không cần nút đếm bấm riêng. */}
        {images.length > 1 && <DemAnhVideo soAnh={images.length} soVideo={0} className="absolute bottom-3 left-3 z-[3]" />}
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
