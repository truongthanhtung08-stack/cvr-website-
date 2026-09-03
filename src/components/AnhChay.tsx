"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTamDung } from "@/lib/useAutoSlide";

// ── ẢNH TỰ CHẠY TRONG THẺ (tin đăng · dự án) ─────────────────────────────────
//
// Cùng cách làm với ô KHU VỰC ở trang chủ (LocationGrid) — đó là chuẩn mặc định
// của web này: ảnh chồng lên nhau, đổi bằng mờ dần, không phải thanh trượt.
//
// Vì sao thẻ nên chạy ảnh: một tin có tới 15 ảnh mà thẻ chỉ khoe đúng ảnh bìa thì
// khách phải bấm vào mới biết bên trong có gì. Cho ảnh chạy là khách lướt qua đã
// thấy được nhà đó ra sao — quyết định bấm vào nhanh hơn hẳn.
//
// Ba điều bắt buộc giữ, nếu không trang sẽ ì và gây khó chịu:
//   1. CHỈ chạy khi thẻ đang trong tầm nhìn — một trang có mấy chục thẻ, chạy hết
//      cùng lúc là máy yếu giật ngay.
//   2. Mỗi thẻ trễ một nhịp khác nhau (suy từ tên tệp ảnh) — không thì cả lưới
//      thẻ chớp đồng loạt, nhìn nhức mắt.
//   3. Rê chuột / chạm vào thì DỪNG, để khách xem kỹ tấm đang thích.
export default function AnhChay({
  images,
  alt,
  sizes,
  className = "object-cover",
  nhip = 4500,
}: {
  images: string[];
  alt: string;
  sizes: string;
  className?: string;
  nhip?: number;
}) {
  // Nhiều nhất 6 tấm: đủ khoe, không kéo theo cả chục ảnh nặng cho mỗi thẻ.
  const ds = images.filter(Boolean).slice(0, 6);
  // Khoá ổn định của danh sách ảnh: mảng ds được dựng lại mỗi lần vẽ, đưa thẳng
  // vào danh sách phụ thuộc thì bộ đếm bị đặt lại liên tục, ảnh không bao giờ đổi.
  const khoa = ds.join("|");
  const boxRef = useRef<HTMLSpanElement>(null);
  const [i, setI] = useState(0);
  // Chạm là dừng, vài giây sau tự chạy tiếp — trên điện thoại không có động tác
  // "rê chuột ra" nên phải tự quay lại, nếu không chạm một cái là đứng vĩnh viễn.
  const { dung, chamVao, setDung } = useTamDung(6000);
  const [trongTam, setTrongTam] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || ds.length < 2) return;
    const io = new IntersectionObserver(([e]) => setTrongTam(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [ds.length]);

  useEffect(() => {
    if (ds.length < 2 || dung || !trongTam) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Trễ mở màn riêng cho từng thẻ, suy từ tên tệp ảnh → cùng một thẻ luôn ra
    // cùng một nhịp (không nhảy loạn mỗi lần vẽ lại), mà các thẻ thì lệch nhau.
    let h = 0;
    for (const c of ds[0]) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const tre = h % 2600;

    let dem: ReturnType<typeof setInterval>;
    const toi = () => setI((n) => (n + 1) % ds.length);
    const batDau = setTimeout(() => {
      toi();
      dem = setInterval(() => {
        if (!document.hidden) toi();
      }, nhip);
    }, tre);
    return () => {
      clearTimeout(batDau);
      clearInterval(dem);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoa, dung, trongTam, nhip]);

  return (
    <span
      ref={boxRef}
      className="absolute inset-0 block"
      onMouseEnter={() => setDung(true)}
      onMouseLeave={() => setDung(false)}
      onTouchStart={chamVao}
    >
      {ds.map((src, k) => (
        <Image
          key={src}
          src={src}
          alt={k === 0 ? alt : ""}
          fill
          sizes={sizes}
          className={`${className} transition-opacity duration-700 ease-out ${k === i ? "opacity-100" : "opacity-0"}`}
          // Chỉ tấm đầu được ưu tiên tải; các tấm sau tải lười cho nhẹ trang.
          loading={k === 0 ? undefined : "lazy"}
        />
      ))}
    </span>
  );
}
