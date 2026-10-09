"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PhotoViewer from "@/components/PhotoViewer";
import Highlight from "@/components/Highlight";
import { NutLienHeThe } from "@/components/LienHeReveal";
import { freshText, type Listing } from "@/lib/data";
import { getTier, tierFromBadge, type TierId } from "@/lib/packages";
import { useSaved } from "@/lib/useSaved";
import { chuThuong, tenDiaDanh } from "@/lib/chuThuong";
import { videoPosterUrl } from "@/lib/media";

// ============================================================================
// THẺ TIN THEO CẤP — BẢN ĐIỆN THOẠI (docs/THE-TIN-THEO-CAP.md, chủ dự án 09/10/2026).
// Dùng ở trang danh sách (Mua bán / Cho thuê) và khối tin trang chủ.
//   KHUNG ẢNH (thẻ rộng 343px):
//     Silver  : 1 khung 4:3 · 343×257
//     Gold    : khung 4:3 chia kiểu Batdongsan — chính 245×257 trái + 2 phụ 3:4 96×128 phải
//     Diamond : chính 4:3 343×257 + 3 phụ 4:3 113×85 dưới (kiểu Batdongsan)
//     Basic   : như tin thường Batdongsan — tiêu đề trên, ảnh 4:3 136×102 trái, chữ phải
//   Khung chính TỰ CHẠY ảnh (video đứng đầu), vuốt qua lại xem tại chỗ; bấm ảnh → xem toàn
//   màn hình kiểu Facebook; bấm video → mở tin. Ảnh lệch khổ thì hiện trọn, 2 bên viền đen.
//   HÀNG CUỐI: ảnh đại diện (không có → 2 chữ viết tắt) · tên · ngày đăng; Diamond · Gold ·
//   Silver thêm Zalo + "Hiện số 090 ***" (bấm là gọi); Basic không có số (chỉ ở trang tin).
// ============================================================================

// Số mục thông số theo cấp (như Batdongsan): Diamond giá · m² · giá/m² · PN · WC · các cấp khác giá · m²
const SO_THONG_SO: Record<TierId, number> = { diamond: 5, gold: 2, silver: 2, basic: 2 };

const IconAnh = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-9 8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconPlay = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
);

// Thông số theo LOẠI HÌNH (chủ dự án 09/10/2026: "tuỳ loại hình BĐS"), rồi cắt theo cấp.
// Thứ tự như Batdongsan: giá · m² · giá/m² · PN · WC (đất không có PN/WC).
type MucSo = { chu: string; do?: boolean; icon?: "pn" | "wc" };
function thongSo(l: Listing): MucSo[] {
  const loai = (l.type || "").toLowerCase();
  const canHo = /căn hộ|chung cư|condotel|officetel|penthouse/.test(loai);
  const dat = /đất/.test(loai);
  const nha = !canHo && !dat && /nhà|biệt thự|villa|shophouse|liền kề/.test(loai);
  const ds: MucSo[] = [{ chu: l.price, do: l.price !== "Thỏa thuận" }];
  if (l.area) ds.push({ chu: l.area, do: true });
  if (l.pricePerM2 && (canHo || dat || nha)) ds.push({ chu: l.pricePerM2 });
  if ((canHo || nha) && l.beds) ds.push({ chu: String(l.beds), icon: "pn" });
  if ((canHo || nha) && l.baths) ds.push({ chu: String(l.baths), icon: "wc" });
  return ds;
}

// 2 chữ viết tắt của tên (chữ đầu + chữ cuối): "Trần Mai Chi" → "TC"
function viTat(ten?: string): string {
  const w = (ten || "Coastal Land").trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? "C") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
}

// Ô ảnh. vuaKhung: ảnh lệch khổ khung quá 15% thì hiện TRỌN ảnh, 2 bên viền đen (chủ dự án
// 09/10/2026: "ảnh nào không đúng thì 2 viền màu đen 2 bên"); ảnh gần đúng khổ thì lấp đầy khung.
function O({ src, alt, className = "", sizes, onMo, children, vuaKhung }: { src?: string; alt: string; className?: string; sizes: string; onMo: () => void; children?: React.ReactNode; vuaKhung?: boolean }) {
  const [lech, setLech] = useState(false);
  return (
    <button type="button" onClick={onMo} className={`relative block overflow-hidden ${lech ? "bg-black" : "bg-cvr-surface"} ${className}`}>
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={lech ? "object-contain" : "object-cover"}
          onLoad={vuaKhung ? (e) => {
            const img = e.currentTarget;
            const khung = img.parentElement;
            if (!khung || !img.naturalHeight || !khung.clientHeight) return;
            const tl = (img.naturalWidth / img.naturalHeight) / (khung.clientWidth / khung.clientHeight);
            setLech(Math.abs(Math.log(tl)) > Math.log(1.15));
          } : undefined}
        />
      )}
      {children}
    </button>
  );
}

// KHUNG CHÍNH TỰ CHẠY: vuốt qua lại xem ảnh/video ngay trên thẻ; không chạm gì thì tự chuyển
// 3,5 giây/ảnh khi thẻ đang hiện trên màn hình; vừa chạm thì nghỉ 6 giây rồi chạy lại.
type Slide = { anh?: string; video?: boolean };
function KhungChay({ slides, alt, khung, sizes, onMo, children }: { slides: Slide[]; alt: string; khung: string; sizes: string; onMo: (k: number) => void; children?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const cham = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || slides.length < 2) return;
    let thay = false;
    const io = new IntersectionObserver(([e]) => { thay = e.intersectionRatio >= 0.6; }, { threshold: [0, 0.6, 1] });
    io.observe(el);
    const id = window.setInterval(() => {
      if (!thay || document.hidden || Date.now() - cham.current < 6000) return;
      const tiep = (Math.round(el.scrollLeft / el.clientWidth) + 1) % slides.length;
      el.scrollTo({ left: tiep * el.clientWidth, behavior: tiep === 0 ? "auto" : "smooth" });
    }, 3500);
    return () => { window.clearInterval(id); io.disconnect(); };
  }, [slides.length]);
  const daCham = () => { cham.current = Date.now(); };
  return (
    <div className={`relative overflow-hidden ${khung}`}>
      <div
        ref={ref}
        onTouchStart={daCham}
        onPointerDown={daCham}
        onWheel={daCham}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      >
        {slides.map((s, k) => (
          <O key={k} vuaKhung={!s.video} src={s.anh} alt={alt} sizes={sizes} className={`h-full w-full shrink-0 snap-center ${s.video ? "bg-black" : ""}`} onMo={() => onMo(k)}>
            {s.video && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white"><IconPlay /></span>
              </span>
            )}
          </O>
        ))}
      </div>
      {children}
    </div>
  );
}

export default function TheTinMobile({ item, terms = [] }: { item: Listing; terms?: string[] }) {
  const t: TierId = item.badge ? tierFromBadge(item.badge) : "basic";
  const tier = getTier(t);
  const href = `/bat-dong-san/${item.id}`;
  const anh = (item.images?.length ? item.images : [item.image]).filter(Boolean);
  const [xem, setXem] = useState(-1);
  const { has, toggle } = useSaved();
  const daLuu = has(item.id);
  const coSo = t !== "basic"; // Diamond · Gold · Silver: Zalo + Hiện số trên thẻ
  const ten = tenDiaDanh(item);
  const tieuDe = tier.uppercase ? item.title : chuThuong(item.title, ten);
  const so = thongSo(item).slice(0, SO_THONG_SO[t]);
  const soAnh = item.imageCount || anh.length;
  const moc = freshText(item.postedAt, item.bumpedAt);
  const ngay = !moc || moc.startsWith("Làm mới") ? moc : `Đăng ${moc.charAt(0).toLowerCase()}${moc.slice(1)}`;

  // Dải khung chính: video đứng đầu (ảnh chờ YouTube), rồi tới ảnh
  const poster = item.video ? videoPosterUrl(item.video)?.thuong : undefined;
  const slides: Slide[] = [...(item.video ? [{ anh: poster, video: true }] : []), ...anh.map((a) => ({ anh: a }))];
  const coVideo = Boolean(item.video);
  const moSlide = (k: number) => {
    if (coVideo && k === 0) { window.location.href = href; return; }
    setXem(k - (coVideo ? 1 : 0));
  };

  const dem = (
    <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/55 px-1.5 py-0.5 text-[12px] font-semibold text-white">
      <IconAnh />{soAnh}{item.hasVideo && <span className="ml-1"><IconPlay /></span>}
    </span>
  );
  const huyHieu = t !== "basic" && (
    <span
      className={`pointer-events-none absolute left-2.5 top-2.5 rounded-full px-2 py-[3px] text-[11px] font-semibold uppercase tracking-[0.06em] shadow-[0_2px_10px_rgba(0,0,0,0.28)] ring-1 backdrop-blur-md ${t === "diamond" ? "ring-[#d9b64e]/70" : "ring-white/25"}`}
      style={{ backgroundColor: `${tier.accent}e6`, color: tier.badgeText }}
    >
      {tier.short}
    </span>
  );
  const chiaSe = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}${href}`;
    if (navigator.share) navigator.share({ title: item.title, url }).catch(() => {});
    else navigator.clipboard?.writeText(url);
  };
  const nutChiaSe = (
    <button type="button" aria-label="Chia sẻ" onClick={chiaSe} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition active:scale-95">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
        <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
        <path strokeLinecap="round" d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
      </svg>
    </button>
  );

  const khungChinh = (khung: string, sizes: string) => (
    <KhungChay slides={slides} alt={item.title} khung={khung} sizes={sizes} onMo={moSlide}>{dem}</KhungChay>
  );
  let khungAnh: React.ReactNode = khungChinh("aspect-[4/3] w-full", "100vw");
  if (t === "gold" && anh.length >= 3) {
    khungAnh = (
      <div className="flex aspect-[4/3] w-full gap-[2px]">
        {khungChinh("h-full min-w-0 flex-1", "75vw")}
        <div className="grid w-[calc((100%-2px)*0.2815)] shrink-0 grid-rows-2 gap-[2px]">
          {anh.slice(1, 3).map((src, k) => <O key={k} vuaKhung src={src} alt={item.title} className="h-full w-full" sizes="33vw" onMo={() => setXem(k + 1)} />)}
        </div>
      </div>
    );
  } else if (t === "diamond" && anh.length >= 4) {
    khungAnh = (
      <div className="grid gap-[2px]">
        {khungChinh("aspect-[4/3] w-full", "100vw")}
        <div className="grid grid-cols-3 gap-[2px]">
          {anh.slice(1, 4).map((src, k) => <O key={k} vuaKhung src={src} alt={item.title} className="aspect-[4/3]" sizes="33vw" onMo={() => setXem(k + 1)} />)}
        </div>
      </div>
    );
  }

  const IconPN = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 18V7m0 7h18v4M21 14v-2a3 3 0 00-3-3h-7v5M7 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>
  );
  const IconWC = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16v2a5 5 0 01-5 5H9a5 5 0 01-5-5v-2zM6 12V6a2 2 0 014 0M8 19l-1 2m10-2l1 2" /></svg>
  );
  const thongSoDong = (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[15px] text-cvr-body">
      {so.map((x, i) => (
        <span key={i} className={`flex items-center gap-1 ${x.do ? "font-bold text-red-500" : ""}`}>
          {i > 0 && <span className="mr-0.5 text-cvr-muted">·</span>}
          {x.chu}
          {x.icon === "pn" && <IconPN />}
          {x.icon === "wc" && <IconWC />}
        </span>
      ))}
    </p>
  );
  const diaChi = (
    <p className="mt-1 flex items-center gap-1 text-[14px] text-cvr-body">
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" aria-hidden><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
      <span className="truncate"><Highlight text={item.location} terms={terms} /></span>
    </p>
  );

  const oCls = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cvr-line text-cvr-ink transition active:scale-95";
  const nutThich = (
    <button type="button" aria-label={daLuu ? "Bỏ yêu thích" : "Yêu thích"} aria-pressed={daLuu} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(item.id); }} className={`${oCls} ${daLuu ? "text-red-500" : ""}`}>
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill={daLuu ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
  const anhDaiDien = item.agentAvatar
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={item.agentAvatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
    : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-[12px] font-semibold text-cvr-body">{viTat(item.agentName)}</span>;
  const nguoiDang = (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[14px] font-semibold text-cvr-ink">{item.agentName || "Coastal Land"}</p>
      <p className="truncate text-[12px] text-cvr-muted">{ngay}</p>
    </div>
  );

  // ── BASIC: như tin thường Batdongsan ─────────────────────────────────────
  if (t === "basic") {
    return (
      <article className="overflow-hidden bg-white px-3.5 pb-3 pt-3 shadow-lux">
        <Link href={href} className="block">
          <h3 className="line-clamp-2 text-[16px] font-medium leading-[1.4] text-cvr-ink"><Highlight text={tieuDe} terms={terms} /></h3>
        </Link>
        <div className="mt-2 flex gap-3">
          {khungChinh("aspect-[4/3] w-[136px] shrink-0 rounded-lg", "136px")}
          <div className="flex min-w-0 flex-1 flex-col">
            <Link href={href} className="block">
              {thongSoDong}
              {diaChi}
            </Link>
            <div className="mt-auto flex items-center gap-1.5 pt-1.5" onClick={(e) => e.preventDefault()}>
              {item.agentAvatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={item.agentAvatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-[11px] font-semibold text-cvr-body">{viTat(item.agentName)}</span>}
              {nguoiDang}
              {nutThich}
            </div>
          </div>
        </div>
        {xem >= 0 && <PhotoViewer images={anh} start={xem} title={item.title} listingId={item.id} onClose={() => setXem(-1)} />}
      </article>
    );
  }

  // ── DIAMOND · GOLD · SILVER: ảnh trên, nội dung dưới ──────────────────────
  return (
    <article className="overflow-hidden bg-white shadow-lux">
      {tier.bar && <div className="h-px w-full" style={{ backgroundColor: tier.bar }} aria-hidden />}
      <div className="relative">
        {khungAnh}
        {huyHieu}
        {nutChiaSe}
      </div>
      <Link href={href} className="block px-3.5 pt-3">
        <h3 className={`line-clamp-2 text-[16px] font-bold leading-[1.4] text-cvr-ink ${tier.uppercase ? "uppercase" : ""}`}><Highlight text={tieuDe} terms={terms} /></h3>
        {thongSoDong}
        {diaChi}
      </Link>
      {/* Hàng cuối 2 dòng (một dòng thì tên bị cắt còn "Tr…"): người đăng + ♥ · rồi Zalo + Hiện số */}
      <div className="px-3.5 pb-3" onClick={(e) => e.preventDefault()}>
        <div className="mt-3 flex items-center gap-2.5">
          {anhDaiDien}
          {nguoiDang}
          {nutThich}
        </div>
        {coSo && (
          <div className="mt-2.5 flex gap-2">
            <NutLienHeThe
              listingId={item.id}
              hienSo
              zaloTruoc
              nhan={item.soDau ? `Hiện số ${item.soDau} ***` : "Hiện số"}
              soCls="flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-cvr-blue px-3 text-[14px] font-semibold text-white transition active:scale-95"
              oCls="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border border-cvr-line transition active:scale-95"
            />
          </div>
        )}
      </div>
      {xem >= 0 && <PhotoViewer images={anh} start={xem} title={item.title} listingId={item.id} onClose={() => setXem(-1)} />}
    </article>
  );
}
