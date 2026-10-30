"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// ============================================================================
// ẢNH ĐẦU TRANG DỰ ÁN TRA CỨU (chủ dự án 31/10/2026): MỘT khung = ảnh đại diện; có từ 2 ảnh thì tự chuyển (mờ dần, như ô Khu
// vực trang chủ — tối đa 6 tấm). Đặt NGAY TRONG khối tên dự án: PC ảnh ở cột phải 384 × 216, chữ trái; điện thoại tràn viền 16:9.
// Ảnh tra cứu nhiều nguồn, cỡ / tỷ lệ khác nhau, admin không chỉnh được → ảnh HIỆN TRỌN không cắt, phần khung thừa lấp bằng
// chính ảnh đó làm mờ (không viền trắng / đen).
// Rê chuột thì dừng. Chỉ nạp tấm đang hiện + tấm kế.
// ============================================================================

const NHIP = 4500;

export default function AnhTraCuu({ images, alt }: { images: string[]; alt: string }) {
  const ds = images.filter(Boolean).slice(0, 6);
  const [i, setI] = useState(0);
  const [dung, setDung] = useState(false);

  useEffect(() => {
    if (ds.length < 2 || dung) return;
    const t = setInterval(() => setI((x) => (x + 1) % ds.length), NHIP);
    return () => clearInterval(t);
  }, [ds.length, dung]);

  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden bg-cvr-surface"
      onMouseEnter={() => setDung(true)}
      onMouseLeave={() => setDung(false)}
    >
      {/* Dựng tấm trước (đang mờ dần đi) · tấm đang hiện · tấm kế (nạp sẵn) — không chớp nền xám khi chuyển */}
      {ds.map((src, k) => (k === i || k === (i + 1) % ds.length || k === (i - 1 + ds.length) % ds.length) && (
        <div key={src} className={`absolute inset-0 transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`} aria-hidden={k !== i}>
          {/* Nền: chính ảnh đó phóng to, làm mờ — lấp phần khung thừa */}
          <Image src={src} alt="" fill sizes="(max-width:640px) 100vw, 384px" className="scale-110 object-cover blur-2xl brightness-90" />
          {/* Ảnh thật hiện trọn, không cắt */}
          <Image src={src} alt={k === i ? alt : ""} fill priority={k === 0} fetchPriority={k === 0 ? "high" : "auto"} sizes="(max-width:640px) 100vw, 384px" className="object-contain" />
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
