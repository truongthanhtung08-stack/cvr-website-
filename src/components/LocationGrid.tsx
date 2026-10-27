"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useHomeSection } from "@/components/HomeExpand";
import { asset, anhNho } from "@/lib/asset";
import { HOME_AREAS_DEFAULT, areaImages, type AreaCard } from "@/lib/khuVucMacDinh";
import { slugKhuVuc, timKhuVuc } from "@/lib/khuVuc";

// ── ĐƯỜNG DẪN CỦA MỘT THẺ KHU VỰC (sửa 18/09/2026) ──────────────────────────
// Dữ liệu khối này do admin nhập ở /admin/noi-dung, và từ trước tới nay đều ghi
// dạng "/mua-ban?tinh=Đà Nẵng". Với người dùng thì vẫn ra đúng danh sách, nhưng
// với Google đó là một địa chỉ TỰ KHAI canonical về /mua-ban — nghĩa là:
//   · trang khu vực thật (/mua-ban/da-nang: có tiêu đề riêng, mô tả riêng, bảng
//     giá riêng) không nhận được liên kết nào từ trang chủ → trang "mồ côi";
//   · sức mạnh của khối khu vực ngay trang chủ rơi vào hư không.
//
// Chuyển đổi Ở CHỖ HIỂN THỊ chứ không sửa dữ liệu, vì hai lý do:
//   1. Nội dung admin trong Supabase ĐÈ lên mặc định trong code — sửa code mà
//      admin đã lưu thì không ăn thua.
//   2. Chủ dự án không phải vào sửa lại 11 dòng bằng tay, và sau này nhập thêm
//      khu vực mới vẫn tự đúng.
//
// Chỉ đổi khi tên đúng là một TỈNH/THÀNH có trang riêng. Thẻ ghi địa danh nhỏ
// hơn tỉnh ("Nha Trang", "Quy Nhơn", "Hội An") giữ nguyên ?tinh= — không có
// trang riêng cho chúng, đổi bừa là dẫn khách vào trang không tồn tại.
function duongDanKhuVuc(area: AreaCard): string {
  const ten = area.href.match(/[?&]tinh=([^&]+)/)?.[1];
  if (!ten) return area.href;
  const slug = slugKhuVuc(decodeURIComponent(ten));
  return timKhuVuc(slug) ? `/mua-ban/${slug}` : area.href;
}

// Bố cục Homedy: gói gọn 2 HÀNG — ô ĐẦU là địa điểm LÕI 2×2, kèm 4 địa điểm nhỏ.
// Dữ liệu admin sửa được (getHomeAreas) — chưa nhập → mặc định trong code.
// Mỗi ô có thể có NHIỀU ảnh → tự chuyển ảnh (mờ dần), lệch nhịp giữa các ô.
export default function LocationGrid({ areas = HOME_AREAS_DEFAULT }: { areas?: AreaCard[] }) {
  const shown = areas.slice(0, 5); // [0] = địa điểm lõi (lớn) + 4 ô nhỏ
  const gridRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  // Khối này KHÔNG có "Xem thêm" (theo yêu cầu) — chỉ ẩn đi khi khối khác đang mở.
  const { hidden } = useHomeSection("khu-vuc");

  // Chỉ chạy slide khi phần này đang hiện trong khung nhìn (tiết chế kiểu Apple).
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (hidden) return null;

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-7 lg:px-8">
        <h2 className="text-xl font-semibold text-cvr-ink sm:text-2xl">
          Bất động sản theo khu vực
        </h2>

        {/* Mosaic khu vực (ô lõi 2×2 + 4 ô nhỏ) — GIỮ NGUYÊN cấu trúc.
            MOBILE: TRÀN VIỀN sát mép màn hình (-mx-4) · DESKTOP: giữ như cũ. */}
        {/* GỌN + TỶ LỆ VÀNG (chủ dự án 24/10/2026): 5 ô, ô nhỏ khung 1,618, ô lõi rộng gấp đôi CÙNG chiều cao (3,236 = hai khung vàng).
            Máy tính: cả 5 ô MỘT hàng, cao hơn chút (ô nhỏ 1,35 · ô lõi 2,7 — chủ dự án 24/10/2026) · điện thoại: ô lõi một hàng + 4 ô nhỏ 2×2. Khe 1px (nhỏ nhất), không viền. */}
        <div ref={gridRef} className="-mx-4 mt-4 grid grid-cols-2 gap-px sm:mx-0 sm:mt-5 sm:grid-cols-6">
          {shown.map((area, i) => (
            <AreaTile
              key={area.name}
              area={area}
              big={i === 0}          // Đà Nẵng — địa điểm lõi
              running={running}
              delay={3000 + i * 1400} // chờ rồi mới đổi, lệch nhịp giữa các ô (5 ô không đổi dồn một lúc — 24/10/2026)
            />
          ))}
        </div>

      </div>
    </section>
  );
}

function AreaTile({ area, big, running, delay }: { area: AreaCard; big: boolean; running: boolean; delay: number }) {
  const images = areaImages(area);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!running || images.length < 2) return;
    let timer: ReturnType<typeof setInterval>;
    const next = () => setCurrent((n) => (n + 1) % images.length);
    const start = setTimeout(() => {
      next();
      timer = setInterval(next, 7000); // mỗi ảnh đứng 7 giây (trước 5) — 5 ô cùng chạy, chậm lại cho dễ nhìn (24/10/2026)
    }, delay);
    return () => { clearTimeout(start); clearInterval(timer); };
  }, [running, images.length, delay]);

  return (
    <Link
      href={duongDanKhuVuc(area)}
      className={`card-lux group relative overflow-hidden transition-transform hover:-translate-y-1 ${
        big ? "col-span-2 aspect-[3.236] sm:aspect-[2.7]" : "aspect-[1.618] sm:aspect-[1.35]"
      }`}
    >
      <span className="card-sheen z-[3]" aria-hidden />
      {images.map((src, k) => (
        <Image
          key={src}
          src={anhNho(asset(src))}
          alt={area.name}
          fill
          sizes={big ? "(max-width: 640px) 100vw, 34vw" : "(max-width: 640px) 50vw, 17vw"}
          className={`object-cover contrast-[1.04] saturate-[1.06] transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08] ${
            k === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* Ảnh giữ nguyên độ nét & độ sáng gốc; chỉ dải chân ô tối dần để chữ nổi rõ.
          (Trước đây ảnh bị đẩy sáng brightness-110 nên chữ trắng chìm vào ảnh.) */}
      {/* Chữ dễ đọc trên mọi ảnh (chủ dự án 24/10/2026): dải chân ô đậm hơn, cao 60% — ảnh sáng (bãi biển, trời) chữ trắng vẫn nổi */}
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(to_top,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.5)_35%,rgba(0,0,0,0.15)_70%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 p-2.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 sm:p-3 [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
        <h3 className={`font-semibold leading-tight tracking-[-0.01em] text-white ${big ? "text-lg sm:text-xl" : "text-[15px] sm:text-base"}`}>
          {area.name}
        </h3>
        <p className="mt-0.5 text-[11px] font-medium text-white/90 sm:text-xs">{area.count}</p>
      </div>
    </Link>
  );
}
