"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PhotoViewer from "@/components/PhotoViewer";
import PhotoList from "@/components/PhotoList";
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
//     Basic   : 1 khung 16:9 · 343×193 (Google Discover), ảnh trên nội dung dưới
//   Khung chính TỰ CHẠY ảnh (video đứng đầu), vuốt qua lại xem tại chỗ; bấm ảnh → xem toàn
//   màn hình kiểu Facebook; bấm video → mở tin. Ảnh lệch khổ thì hiện trọn, 2 bên viền đen.
//   HÀNG CUỐI: ảnh đại diện (không có → 2 chữ viết tắt) · tên · ngày đăng; Diamond · Gold ·
//   Silver thêm Zalo + "Hiện số 090 ***" (bấm là gọi); Basic không có số (chỉ ở trang tin).
//   MỌI CẤP: ảnh trên, nội dung dưới (chủ dự án 09/10/2026 — chuẩn riêng của Coastal Land).
// ============================================================================

// Số mục thông số THEO CẤP (cấp càng cao càng đủ): Diamond giá · m² · PN · WC · giá/m² · Gold giá · m² · PN · WC
// · Silver giá · m² · PN · Basic giá · m² (đất không có PN/WC thì giá/m² lên trước).
const SO_THONG_SO: Record<TierId, number> = { diamond: 5, gold: 4, silver: 3, basic: 2 };

const IconAnh = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-9 8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconPlay = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
);

// Thông số theo LOẠI HÌNH (chủ dự án 09/10/2026: "tuỳ loại hình BĐS"), rồi cắt theo cấp.
// Thứ tự: giá · m² · PN · WC · giá/m² (đất không có PN/WC).
type MucSo = { chu: string; do?: boolean; icon?: "pn" | "wc" };
function thongSo(l: Listing): MucSo[] {
  const loai = (l.type || "").toLowerCase();
  const canHo = /căn hộ|chung cư|condotel|officetel|penthouse/.test(loai);
  const dat = /đất/.test(loai);
  const nha = !canHo && !dat && /nhà|biệt thự|villa|shophouse|liền kề/.test(loai);
  const ds: MucSo[] = [{ chu: l.price === "Thỏa thuận" ? "Giá thỏa thuận" : l.price, do: true }];
  if (l.area) ds.push({ chu: l.area, do: true });
  if ((canHo || nha) && l.beds) ds.push({ chu: String(l.beds), icon: "pn" });
  if ((canHo || nha) && l.baths) ds.push({ chu: String(l.baths), icon: "wc" });
  if (l.pricePerM2 && (canHo || dat || nha)) ds.push({ chu: l.pricePerM2 });
  return ds;
}

// Địa chỉ trên thẻ như Batdongsan: "P. Hải Vân (Q. Liên Chiểu cũ)" — phường mới + quận cũ.
// Không có địa chỉ hệ cũ thì giữ địa chỉ mới, viết tắt cấp đầu.
function diaChiThe(l: Listing): string {
  const vt = (x: string) => x.replace(/^Phường /, "P. ").replace(/^Xã /, "X. ").replace(/^Quận /, "Q. ").replace(/^Huyện /, "H. ").replace(/^Thị xã /, "TX. ").replace(/^Thành phố /, "TP. ");
  const moi = l.location.split(",").map((x) => x.trim()).filter(Boolean);
  const cu = (l.locationCu ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const quanCu = cu.length >= 3 ? cu[1] : cu.length === 2 ? cu[0] : "";
  if (moi.length >= 2 && /^(Quận|Huyện|Thị xã|Thành phố) /.test(quanCu)) return `${vt(moi[0])} (${vt(quanCu)} cũ)`;
  return [vt(moi[0] ?? ""), ...moi.slice(1)].join(", ");
}

// 2 chữ viết tắt của tên (chữ đầu + chữ cuối): "Trần Mai Chi" → "TC"
function viTat(ten?: string): string {
  const w = (ten || "Coastal Land").trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? "C") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
}

// Ô ảnh: ảnh LẤP ĐẦY khung, không bao giờ có viền (chủ dự án 09/10/2026: "ghét nhất là viền" — như
// Facebook). dau = ảnh đầu của thẻ → tải ngay, không để khung trắng chờ ảnh.
// duPhong: ảnh thay khi ảnh chính lỗi (ảnh bìa video YouTube bản HD không phải video nào cũng có).
function O({ src, alt, className = "", sizes, onMo, children, dau, duPhong }: { src?: string; alt: string; className?: string; sizes: string; onMo: () => void; children?: React.ReactNode; vuaKhung?: boolean; dau?: boolean; duPhong?: string }) {
  const [loi, setLoi] = useState(false);
  const nguon = loi && duPhong ? duPhong : src;
  return (
    <button type="button" onClick={onMo} className={`relative block overflow-hidden bg-cvr-surface ${className}`}>
      {nguon && <Image src={nguon} alt={alt} fill sizes={sizes} loading={dau ? "eager" : "lazy"} unoptimized={nguon.startsWith("https://i.ytimg.com")} className="object-cover" onError={() => setLoi(true)} />}
      {children}
    </button>
  );
}

// KHUNG CHÍNH TỰ CHẠY: vuốt qua lại xem ảnh/video ngay trên thẻ; không chạm gì thì tự chuyển
// 3,5 giây/ảnh khi thẻ đang hiện trên màn hình; vừa chạm thì nghỉ 6 giây rồi chạy lại.
// Dải ảnh dịch bằng transform theo SỐ THỨ TỰ ảnh → luôn dừng đúng khít một ảnh, không lệch mép.
type Slide = { anh?: string; video?: boolean; duPhong?: string };
function KhungChay({ slides, alt, khung, sizes, onMo, children, tuChay = true }: { slides: Slide[]; alt: string; khung: string; sizes: string; onMo: (k: number) => void; children?: React.ReactNode; tuChay?: boolean }) {
  const goc = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [keo, setKeo] = useState(0); // px đang kéo
  const cham = useRef(0);
  const batDau = useRef<{ x: number; y: number; ngang: boolean | null } | null>(null);
  const daKeo = useRef(false);
  const n = slides.length;
  useEffect(() => {
    const el = goc.current;
    if (!el || n < 2 || !tuChay) return;
    let thay = false;
    const io = new IntersectionObserver(([e]) => { thay = e.intersectionRatio >= 0.6; }, { threshold: [0, 0.6, 1] });
    io.observe(el);
    const id = window.setInterval(() => {
      if (!thay || document.hidden || batDau.current || Date.now() - cham.current < 6000) return;
      setI((x) => (x + 1) % n);
    }, 3500);
    return () => { window.clearInterval(id); io.disconnect(); };
  }, [n, tuChay]);
  const tStart = (e: React.TouchEvent) => {
    cham.current = Date.now();
    daKeo.current = false;
    batDau.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, ngang: null };
  };
  const tMove = (e: React.TouchEvent) => {
    const b0 = batDau.current;
    if (!b0) return;
    const dx = e.touches[0].clientX - b0.x;
    const dy = e.touches[0].clientY - b0.y;
    if (b0.ngang === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) b0.ngang = Math.abs(dx) > Math.abs(dy);
    if (b0.ngang) { daKeo.current = true; setKeo(dx); }
  };
  const tEnd = () => {
    const w = goc.current?.clientWidth ?? 1;
    if (batDau.current?.ngang && Math.abs(keo) > w * 0.18) setI((x) => Math.min(n - 1, Math.max(0, x + (keo < 0 ? 1 : -1))));
    setKeo(0);
    batDau.current = null;
    cham.current = Date.now();
  };
  return (
    <div ref={goc} className={`relative overflow-hidden ${khung}`} onTouchStart={tStart} onTouchMove={tMove} onTouchEnd={tEnd} onTouchCancel={tEnd}>
      <div
        className="flex h-full w-full"
        style={{ transform: `translate3d(calc(${-i * 100}% + ${keo}px), 0, 0)`, transition: keo ? "none" : "transform 0.35s cubic-bezier(0.22,1,0.36,1)" }}
      >
        {slides.map((s, k) => (
          <O key={k} dau={k === 0} src={s.anh} duPhong={s.duPhong} alt={alt} sizes={sizes} className={`h-full w-full shrink-0 ${s.video ? "bg-black" : ""}`} onMo={() => { if (!daKeo.current) onMo(k); }}>
            {s.video && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white"><IconPlay /></span>
              </span>
            )}
          </O>
        ))}
      </div>
      {n > 1 && (
        <span className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
          {slides.slice(0, 8).map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i % 8 ? "w-3.5 bg-white" : "w-1.5 bg-white/60"}`} />)}
        </span>
      )}
      {children}
    </div>
  );
}

// tuChay mặc định TẮT: trang chủ và trang danh sách chỉ hiện ẢNH ĐẠI DIỆN, không chạy slide — slide chỉ
// chạy khi mở tin (chủ dự án 09/10/2026).
export default function TheTinMobile({ item, terms = [], tuChay = false }: { item: Listing; terms?: string[]; tuChay?: boolean }) {
  const t: TierId = item.badge ? tierFromBadge(item.badge) : "basic";
  const tier = getTier(t);
  const href = `/bat-dong-san/${item.id}`;
  const anh = (item.images?.length ? item.images : [item.image]).filter(Boolean);
  const [xem, setXem] = useState(-1);
  // Bấm ảnh trên thẻ → danh sách kiểu Facebook: video + ảnh + bản đồ (chủ dự án 09/10/2026)
  const [ds, setDs] = useState(false);
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
  // Ảnh bìa video: bản HD 16:9 (không dải đen như bản hq), lỗi thì lùi bản mq — cũng 16:9, không dải đen
  const pv = item.video ? videoPosterUrl(item.video) : null;
  // ẢNH ĐẠI DIỆN luôn đứng đầu (chủ dự án 09/10/2026), video ngay sau, rồi các ảnh còn lại.
  // tuChay = false (trang chủ): CHỈ ảnh đại diện — không lộ ảnh khác ra trang chủ.
  const slideVideo: Slide[] = item.video ? [{ anh: pv?.hd, duPhong: pv?.hd.replace("maxresdefault", "mqdefault"), video: true }] : [];
  const slides: Slide[] = tuChay
    ? [...anh.slice(0, 1).map((a) => ({ anh: a })), ...slideVideo, ...anh.slice(1).map((a) => ({ anh: a }))]
    : anh.slice(0, 1).map((a) => ({ anh: a }));
  const moSlide = (k: number) => {
    void k;
    setDs(true);
  };

  const dem = (
    <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/55 px-1.5 py-0.5 text-[12px] font-semibold text-white">
      {/* Chỉ báo tin có bao nhiêu ảnh, bao nhiêu video (chủ dự án 09/10/2026) */}
      <IconAnh />{soAnh}
      {(item.soVideo ?? (item.hasVideo ? 1 : 0)) > 0 && <><span className="ml-1.5"><IconPlay /></span>{item.soVideo ?? 1}</>}
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
    <button type="button" aria-label="Chia sẻ" onClick={chiaSe} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cvr-line text-cvr-ink transition active:scale-95">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
        <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
        <path strokeLinecap="round" d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
      </svg>
    </button>
  );

  const khungChinh = (khung: string, sizes: string) => (
    <KhungChay slides={slides} alt={item.title} khung={khung} sizes={sizes} onMo={moSlide} tuChay={tuChay}>{dem}</KhungChay>
  );
  let khungAnh: React.ReactNode = khungChinh("aspect-[4/3] w-full", "100vw");
  if (t === "gold" && anh.length >= 3) {
    khungAnh = (
      <div className="flex aspect-[4/3] w-full gap-px">
        {khungChinh("h-full min-w-0 flex-1", "75vw")}
        <div className="grid w-[calc((100%-1px)*0.2815)] shrink-0 grid-rows-2 gap-px">
          {anh.slice(1, 3).map((src, k) => <O key={k} vuaKhung src={src} alt={item.title} className="h-full w-full" sizes="33vw" onMo={() => setDs(true)} />)}
        </div>
      </div>
    );
  } else if (t === "diamond" && anh.length >= 4) {
    khungAnh = (
      <div className="grid gap-px">
        {khungChinh("aspect-[4/3] w-full", "100vw")}
        <div className="grid grid-cols-3 gap-px">
          {anh.slice(1, 4).map((src, k) => <O key={k} vuaKhung src={src} alt={item.title} className="aspect-[4/3]" sizes="33vw" onMo={() => setDs(true)} />)}
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
      <span className="truncate"><Highlight text={diaChiThe(item)} terms={terms} /></span>
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
    ? <img src={item.agentAvatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-cvr-line" />
    : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-[14px] font-semibold text-cvr-body ring-1 ring-cvr-line">{viTat(item.agentName)}</span>;
  const nguoiDang = (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[15px] font-semibold leading-tight text-cvr-ink">{item.agentName || "Coastal Land"}</p>
      <p className="mt-0.5 truncate text-[13px] leading-tight text-cvr-muted">{ngay}</p>
    </div>
  );

  // ── BASIC: ảnh trên, nội dung dưới như mọi thẻ Coastal Land — ảnh 16:9 (khung Google Discover),
  //    hàng cuối: người đăng + Thích, không có số (số chỉ ở trang tin) ──────────────────────
  if (t === "basic") {
    return (
      <article className="overflow-hidden bg-white">
        <div className="relative">
          {khungChinh("aspect-[16/9] w-full", "100vw")}
        </div>
        <Link href={href} className="block px-3.5 pt-3">
          <h3 className="line-clamp-2 text-[16px] font-medium leading-[1.4] text-cvr-ink"><Highlight text={tieuDe} terms={terms} /></h3>
          {thongSoDong}
          {diaChi}
        </Link>
        <div className="mt-3 flex items-center gap-2.5 px-3.5 pb-3" onClick={(e) => e.preventDefault()}>
          {anhDaiDien}
          {nguoiDang}
          {nutThich}
          {nutChiaSe}
        </div>
        {ds && <PhotoList images={anh} videos={item.video ? [item.video] : []} title={item.title} onPick={setXem} onClose={() => setDs(false)} nhanPhim={xem < 0} banDo={{ diaChi: item.location, q: item.mapPin || item.location }} />}
        {xem >= 0 && <PhotoViewer images={anh} start={xem} title={item.title} listingId={item.id} onClose={() => setXem(-1)} />}
      </article>
    );
  }

  // ── DIAMOND · GOLD · SILVER: ảnh trên, nội dung dưới ──────────────────────
  return (
    <article className="overflow-hidden bg-white">
      {tier.bar && <div className="h-px w-full" style={{ backgroundColor: tier.bar }} aria-hidden />}
      <div className="relative">
        {khungAnh}
        {huyHieu}
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
          {nutChiaSe}
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
      {ds && <PhotoList images={anh} videos={item.video ? [item.video] : []} title={item.title} onPick={setXem} onClose={() => setDs(false)} nhanPhim={xem < 0} banDo={{ diaChi: item.location, q: item.mapPin || item.location }} />}
        {xem >= 0 && <PhotoViewer images={anh} start={xem} title={item.title} listingId={item.id} onClose={() => setXem(-1)} />}
    </article>
  );
}
