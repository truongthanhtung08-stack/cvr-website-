"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { anhNho } from "@/lib/asset";
// Bộ xem ảnh lớn (zoom, vuốt đổi ảnh) — CÙNG bộ với thư viện ảnh dự án nổi bật; chỉ tải khi bấm vào ảnh
const PhotoViewer = dynamic(() => import("@/components/PhotoViewer"));
// Điện thoại: bấm ảnh → danh sách ảnh xếp dọc kiểu Facebook — CÙNG cơ chế khung ảnh dự án nổi bật (ProjectGallery / PhotoList, 31/10/2026)
const PhotoList = dynamic(() => import("@/components/PhotoList"));

// ============================================================================
// ẢNH ĐẦU TRANG DỰ ÁN TRA CỨU (chủ dự án 31/10/2026): MỘT khung = ảnh đại diện; có từ 2 ảnh thì tự chuyển (mờ dần, như ô Khu
// vực trang chủ — tối đa 6 tấm). Khuôn trang Mua bán: ảnh rộng hết cột trái, PC 800 × 240 (10:3 — chủ dự án 31/10/2026: "khung ảnh QUÁ TO" ba lần; laptop 1366 × 768 mở lên thấy đủ tên · ảnh · thanh mục · đầu bảng Tổng quan;
// trước 800 × 450); điện thoại tràn viền 16:9.
// Ảnh tra cứu nhiều nguồn, cỡ / tỷ lệ khác nhau, admin không chỉnh được → ảnh HIỆN TRỌN không cắt, phần khung thừa lấp bằng
// chính ảnh đó làm mờ (không viền trắng / đen).
// Rê chuột thì dừng. Chỉ nạp tấm đang hiện + tấm kế.
// ============================================================================

const NHIP = 4500;

// khung: lớp cỡ khung (mặc định 16:9; trang chi tiết tra cứu truyền khung 16:9 cột 1/3 PC, cao theo hàng — 31/10/2026)
export default function AnhTraCuu({ images, alt, khung = "aspect-[16/9]" }: { images: string[]; alt: string; khung?: string }) {
  const ds = images.filter(Boolean).slice(0, 6);
  const [i, setI] = useState(0);
  const [dung, setDung] = useState(false);
  const [xemTo, setXemTo] = useState(false);
  const [dsDoc, setDsDoc] = useState(false);
  // Máy tính: mở thẳng ảnh lớn · điện thoại: mở danh sách ảnh kiểu Facebook (bấm một tấm trong danh sách → xem lớn)
  const moAnh = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setXemTo(true);
    else setDsDoc(true);
  };

  useEffect(() => {
    if (ds.length < 2 || dung) return;
    const t = setInterval(() => setI((x) => (x + 1) % ds.length), NHIP);
    return () => clearInterval(t);
  }, [ds.length, dung]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-cvr-surface ${khung}`}
      onMouseEnter={() => setDung(true)}
      onMouseLeave={() => setDung(false)}
    >
      {/* Chưa có ảnh: khung xám + biểu tượng Coastal Land (như thẻ tra cứu) — đầu trang luôn cùng một dáng (31/10/2026) */}
      {ds.length === 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/logo/symbol-dark.svg" alt="" className="absolute inset-0 m-auto h-12 w-12 opacity-25" />
      )}
      {/* Dựng tấm trước (đang mờ dần đi) · tấm đang hiện · tấm kế (nạp sẵn) — không chớp nền xám khi chuyển */}
      {/* Bấm vào ảnh → mở xem to (chủ dự án 31/10/2026) */}
      {ds.length > 0 && <button type="button" aria-label="Xem ảnh lớn" onClick={moAnh} className="absolute inset-0 z-[5] cursor-zoom-in" />}
      {dsDoc && <PhotoList images={ds} title={alt} onPick={(k) => { setI(k); setXemTo(true); }} onClose={() => setDsDoc(false)} nhanPhim={!xemTo} />}
      {/* Ảnh lớn dựng SAU danh sách → nằm trên danh sách khi mở từ danh sách */}
      {xemTo && <PhotoViewer images={ds} start={i} title={alt} onClose={() => setXemTo(false)} />}
      {ds.map((src, k) => (k === i || k === (i + 1) % ds.length || k === (i - 1 + ds.length) % ds.length) && (
        <div key={src} className={`absolute inset-0 transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`} aria-hidden={k !== i}>
          {/* Nền: chính ảnh đó phóng to, làm mờ — lấp phần khung thừa */}
          <Image src={anhNho(src)} alt="" fill sizes="(max-width:1024px) 100vw, 800px" className="z-0 scale-110 object-cover blur-2xl brightness-90" />
          {/* Ảnh thật hiện trọn, không cắt — bản NHỎ 1280 px, cùng tệp bộ ảnh điện thoại (Gallery) nên trang chỉ tải trước một ảnh (31/10/2026,
              như ProjectGallery); bấm xem lớn vẫn là ảnh gốc */}
          <Image src={anhNho(src)} alt={k === i ? alt : ""} fill priority={k === 0} fetchPriority={k === 0 ? "high" : "auto"} sizes="(max-width:1024px) 100vw, 800px" className="z-[1] object-contain" />
        </div>
      ))}
      {ds.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {ds.map((src, k) => (
            <button key={src} type="button" aria-label={`Ảnh ${k + 1}`} onClick={() => setI(k)}
              className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
