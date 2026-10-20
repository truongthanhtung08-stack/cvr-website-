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
import { diaChiHaiDong, moTaThe, soDongMoTa } from "@/lib/trichMoTa";

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

// Số mục thông số THEO CẤP — đúng quy định admin "Thông số trên thẻ tin" (site_content quy_dinh_gia, 20/10/2026):
// Diamond giá · diện tích · giá/m² · phòng ngủ · WC · Gold, Silver, Basic giá · diện tích.
const SO_THONG_SO: Record<TierId, number> = { diamond: 5, gold: 2, silver: 2, basic: 2 };
// Máy tính giữ bản đã chốt 18/10 (Diamond 5 · Gold 4 · Silver 3 · Basic 2) — chưa có yêu cầu đổi.
const SO_THONG_SO_PC: Record<TierId, number> = { diamond: 5, gold: 4, silver: 3, basic: 2 };

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


// 2 chữ viết tắt của tên (chữ đầu + chữ cuối): "Trần Mai Chi" → "TC"
function viTat(ten?: string): string {
  const w = (ten || "Coastal Land").trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? "C") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
}

// Ô ảnh: ảnh LẤP ĐẦY khung, không bao giờ có viền (chủ dự án 09/10/2026: "ghét nhất là viền" — như
// Facebook). dau = ảnh đầu của thẻ → tải ngay, không để khung trắng chờ ảnh.
// duPhong: ảnh thay khi ảnh chính lỗi (ảnh bìa video YouTube bản HD không phải video nào cũng có).
// videoTep: video tải lên (mp4…) không có ảnh bìa → hiện khung hình đầu của chính video, không để trắng.
function O({ src, alt, className = "", sizes, onMo, children, dau, duPhong, videoTep }: { src?: string; alt: string; className?: string; sizes: string; onMo: () => void; children?: React.ReactNode; vuaKhung?: boolean; dau?: boolean; duPhong?: string; videoTep?: string }) {
  const [loi, setLoi] = useState(false);
  const nguon = loi && duPhong ? duPhong : src;
  return (
    <button type="button" onClick={onMo} className={`relative block overflow-hidden bg-cvr-surface ${className}`}>
      {nguon && <Image src={nguon} alt={alt} fill sizes={sizes} loading={dau ? "eager" : "lazy"} unoptimized={nguon.startsWith("https://i.ytimg.com")} className="object-cover" onError={() => setLoi(true)} onLoad={(e) => { if (duPhong && e.currentTarget.naturalWidth <= 120) setLoi(true); }} />}
      {!nguon && videoTep && <video src={`${videoTep}#t=0.1`} preload="metadata" muted playsInline className="absolute inset-0 h-full w-full object-cover" />}
      {children}
    </button>
  );
}

// KHUNG CHÍNH TỰ CHẠY: vuốt qua lại xem ảnh/video ngay trên thẻ; không chạm gì thì tự chuyển
// 3,5 giây/ảnh khi thẻ đang hiện trên màn hình; vừa chạm thì nghỉ 6 giây rồi chạy lại.
// Dải ảnh dịch bằng transform theo SỐ THỨ TỰ ảnh → luôn dừng đúng khít một ảnh, không lệch mép.
type Slide = { anh?: string; video?: boolean; duPhong?: string; videoTep?: string };
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
          <O key={k} dau={k === 0} src={s.anh} duPhong={s.duPhong} videoTep={s.videoTep} alt={alt} sizes={sizes} className={`h-full w-full shrink-0 ${s.video ? "bg-black" : ""}`} onMo={() => { if (!daKeo.current) onMo(k); }}>
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
// pc: HÀNG DANH SÁCH máy tính (trang Mua bán / Cho thuê) — cùng nội dung thẻ điện thoại, chỉ khác khung (nhánh ở dưới).
// moTa: dòng mô tả dưới địa chỉ theo cấp (Basic 2 · Silver 2 · Gold 3 · Diamond 3 — src/lib/trichMoTa.ts) — MỌI NƠI (trang chủ, danh sách, mẫu thẻ admin), nâng cấp là tự đúng (chủ dự án 20/10/2026).
export default function TheTinMobile({ item, terms = [], tuChay = false, pc = false, moTa = true, dcCu = true }: { item: Listing; terms?: string[]; tuChay?: boolean; pc?: boolean; moTa?: boolean; dcCu?: boolean }) {
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
  const so = thongSo(item).slice(0, (pc ? SO_THONG_SO_PC : SO_THONG_SO)[t]);
  const soAnh = item.imageCount || anh.length;
  const moc = freshText(item.postedAt, item.bumpedAt);
  const ngay = !moc || moc.startsWith("Làm mới") ? moc : `Đăng ${moc.charAt(0).toLowerCase()}${moc.slice(1)}`;

  // Dải khung chính: video đứng đầu (ảnh chờ YouTube), rồi tới ảnh
  // Ảnh bìa video: bản HD 16:9 (không dải đen như bản hq), lỗi thì lùi bản mq — cũng 16:9, không dải đen
  const pv = item.video ? videoPosterUrl(item.video) : null;
  // TIN CÓ VIDEO: video đứng ĐẦU làm khung đại diện (chủ dự án 10/10/2026) — khung neo ảnh bìa YouTube
  // hoặc khung hình đầu của video tải lên, không bao giờ trắng. Không video: ảnh đại diện.
  // tuChay = false (trang chủ, danh sách): CHỈ một khung đại diện — không lộ ảnh khác.
  const slideVideo: Slide[] = item.video
    ? [pv ? { anh: pv.hd, duPhong: pv.hd.replace("maxresdefault", "mqdefault"), video: true } : { videoTep: item.video, video: true }]
    : [];
  const daySlide: Slide[] = [...slideVideo, ...anh.map((a) => ({ anh: a }))];
  const slides: Slide[] = tuChay ? daySlide : daySlide.slice(0, 1);
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
  // KHUNG ẢNH THEO CẤP lấy TỶ LỆ VÀNG (1,618) làm chuẩn (chủ dự án 20/10/2026), màn 375: Basic 16:9 = 211 (nhỏ nhất) · Silver tỷ lệ vàng = 232 ·
  // Gold chính tỷ lệ vàng (= Silver) + 3 phụ 16:9 · Diamond chính 3:2 = 250 (to hơn Gold) + 3 phụ 3:2 — Gold, Diamond cùng số ảnh, cùng cách xếp.
  let khungAnh: React.ReactNode = khungChinh("aspect-[1.618] w-full", "100vw");
  if ((t === "gold" || t === "diamond") && anh.length >= 4) {
    khungAnh = (
      <div className="grid gap-px">
        {khungChinh(t === "diamond" ? "aspect-[3/2] w-full" : "aspect-[1.618] w-full", "100vw")}
        <div className="grid grid-cols-3 gap-px">
          {anh.slice(1, 4).map((src, k) => <O key={k} vuaKhung src={src} alt={item.title} className={t === "diamond" ? "aspect-[3/2]" : "aspect-[16/9]"} sizes="33vw" onMo={() => setDs(true)} />)}
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
    <p className={`${pc ? "mt-1.5" : "mt-2"} flex flex-wrap items-center gap-x-1.5 text-[15px] text-cvr-body`}>
      {so.map((x, i) => (
        <span key={i} className={`flex items-center gap-1 ${x.do ? "font-bold text-red-500" : ""}`}>
          {x.chu}
          {x.icon === "pn" && <IconPN />}
          {x.icon === "wc" && <IconWC />}
          {/* Dấu · đứng SAU mục (không đứng trước mục sau): chữ to trong Zalo/Facebook làm dòng xuống hàng
              thì dấu nằm cuối dòng trên, không lơ lửng đầu dòng dưới (20/10/2026) */}
          {i < so.length - 1 && <span className="ml-0.5 text-cvr-muted">·</span>}
        </span>
      ))}
    </p>
  );
  // PC: hai dòng địa chỉ (hệ mới trên · hệ cũ dưới). Điện thoại: MỘT dòng "Phường, Tỉnh/Thành phố" (chủ dự án 20/10/2026)
  const dc = diaChiHaiDong(item);
  const diaChiDong = (
    <>
      <p className={pc ? "mt-1 flex items-center gap-1 text-[14px] text-cvr-body" : "mt-1.5 flex items-start gap-1 text-[14px] text-cvr-body"}>
        <svg className={`${pc ? "" : "mt-px "}h-4 w-4 shrink-0`} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" aria-hidden><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
        <span className={pc ? "truncate" : "line-clamp-2"}><Highlight text={pc ? dc.moi : item.location} terms={terms} /></span>
      </p>
      {pc && dcCu && dc.cu && <p className="mt-0.5 truncate pl-5 text-[13px] text-cvr-faint">Địa chỉ hệ cũ: <Highlight text={dc.cu} terms={terms} /></p>}
    </>
  );
  const trich = moTa ? moTaThe(item) : "";
  const soDong = soDongMoTa(item);
  // Điện thoại: tiêu đề → giá · m² → địa chỉ → mô tả (chủ dự án 20/10/2026: giá · diện tích ngay dưới tiêu đề)
  const moTaDong = trich ? <p className={`${pc ? "mt-1" : "mt-2"} ${["", "line-clamp-1", "line-clamp-2", "line-clamp-3"][soDong]} text-[14px] leading-[1.45] text-cvr-muted`}><Highlight text={trich} terms={terms} /></p> : null;
  const diaChi = diaChiDong;

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
    ? <img src={item.agentAvatar} alt={item.agentName ?? ""} className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-cvr-line" />
    : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-[14px] font-semibold text-cvr-body ring-1 ring-cvr-line">{viTat(item.agentName)}</span>;
  const nguoiDang = (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[15px] font-semibold leading-tight text-cvr-ink">{item.agentName || "Coastal Land"}</p>
      <p className="mt-0.5 truncate text-[13px] leading-tight text-cvr-muted">{ngay}</p>
    </div>
  );

  // ── MÁY TÍNH (pc) — trang Mua bán / Cho thuê, MỖI TIN MỘT HÀNG (trang không có ô trống), chủ dự án 18/10/2026.
  //    NỘI DUNG = đúng thẻ điện thoại theo cấp (tiêu đề, thông số, địa chỉ, người đăng, Zalo + Hiện số, Thích, Chia sẻ).
  //    KHUNG: mỗi ảnh đúng tỷ lệ chuẩn, ảnh chính to rõ hơn ảnh phụ, cân với phần chữ, nhỏ dần theo cấp (cột ~869):
  //      Diamond: ảnh TRÊN, dải rộng hết hàng (3:1) — chính 2:1 579×290 + phụ 2:1 290×145 + 2 phụ 1:1 145×145 · chữ dưới
  //      Gold:    ảnh TRÊN, dải rộng hết thẻ (4:1, thấp hơn Diamond) — chính 2:1 + 2 phụ vuông 1:1 · chữ dưới
  //               (bỏ bề rộng cố định 760: màn rộng để trống bên phải — chủ dự án 18/10/2026)
  //      Silver:  ảnh TRÁI 4:3 340×255 · Basic: ảnh TRÁI 16:9 280×158 (Silver to hẳn hơn Basic) · chữ phải, dàn đều theo cao ảnh
  if (pc) {
    const tren = t === "diamond" || t === "gold";
    const phu = t === "diamond" && anh.length >= 4 ? anh.slice(1, 4) : t === "gold" && anh.length >= 3 ? anh.slice(1, 3) : [];
    const rongDai = "w-full";
    let anhPC: React.ReactNode;
    if (tren && phu.length) {
      anhPC = (
        t === "diamond" ? (
          <div className={`grid aspect-[3/1] grid-cols-[2fr_1fr] gap-px overflow-hidden rounded-xl ${rongDai}`}>
            {khungChinh("h-full w-full", "580px")}
            <div className="grid grid-rows-2 gap-px">
              <O src={phu[0]} alt={item.title} className="h-full w-full" sizes="290px" onMo={() => setDs(true)} />
              <div className="grid grid-cols-2 gap-px">
                {phu.slice(1).map((src, k) => <O key={k} src={src} alt={item.title} className="h-full w-full" sizes="145px" onMo={() => setDs(true)} />)}
              </div>
            </div>
          </div>
        ) : (
          <div className={`grid aspect-[4/1] grid-cols-[2fr_1fr_1fr] gap-px overflow-hidden rounded-xl ${rongDai}`}>
            {khungChinh("h-full w-full", "580px")}
            {phu.map((src, k) => <O key={k} src={src} alt={item.title} className="h-full w-full" sizes="300px" onMo={() => setDs(true)} />)}
          </div>
        )
      );
    } else if (tren) {
      anhPC = <div className={`overflow-hidden rounded-xl ${rongDai}`}>{khungChinh(`${t === "gold" ? "aspect-[4/1]" : "aspect-[3/1]"} w-full`, "870px")}</div>;
    } else {
      anhPC = <div className={`shrink-0 overflow-hidden rounded-xl ${t === "basic" ? "w-[280px]" : "w-[340px]"}`}>{khungChinh(t === "basic" ? "aspect-[16/9] w-full" : "aspect-[4/3] w-full", "340px")}</div>;
    }
    // Silver · Basic: tiêu đề giữ chỗ 2 dòng để thẻ cùng cấp cao như nhau (Diamond · Gold chữ dưới ảnh — không giữ, khỏi dòng trống). Silver · Basic (ảnh trái): 3 nhóm — tiêu đề / giá + địa chỉ /
    // hàng cuối — DÀN ĐỀU theo chiều cao ảnh (justify-between), không dồn khoảng trống một chỗ.
    const tieuDePC = <Link href={href} className="block"><h3 className={`line-clamp-2 ${tren ? "" : "min-h-[2.8em]"} text-[16px] leading-[1.4] text-cvr-ink ${t === "basic" ? "font-medium" : "font-bold"} ${tier.uppercase ? "uppercase" : ""}`}><Highlight text={tieuDe} terms={terms} /></h3></Link>;
    const soPC = <Link href={href} className="block [&>p:first-child]:mt-0">{thongSoDong}{diaChi}</Link>;
    // Hàng cuối MỘT DÒNG (PC rộng, chủ dự án 18/10/2026): người đăng trái · Zalo + Hiện số (Diamond · Gold · Silver) · Thích · Chia sẻ phải.
    const cuoi = (
      <div className="flex items-center gap-2.5" onClick={(e) => e.preventDefault()}>
        {anhDaiDien}
        {nguoiDang}
        {coSo && (
          <NutLienHeThe
            listingId={item.id}
            hienSo
            zaloTruoc
            nhan={item.soDau ? `Hiện số ${item.soDau} ***` : "Hiện số"}
            soCls="flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-cvr-blue px-4 text-[14px] font-semibold text-white transition active:scale-95"
            oCls="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border border-cvr-line transition active:scale-95"
          />
        )}
        {nutThich}
        {nutChiaSe}
      </div>
    );
    return (
      <article className={`relative flex gap-4 overflow-hidden bg-white p-3 ${tren ? "flex-col" : ""}`}>
        {tier.bar && <div className="absolute inset-x-0 top-0 z-10 h-px" style={{ backgroundColor: tier.bar }} aria-hidden />}
        {/* Diamond · Gold (ảnh trên) khung phải rộng theo thẻ — self-start làm khung co về 0 khi ảnh rộng "w-full" */}
        <div className={`relative ${tren ? "w-full" : "self-start"}`}>
          {anhPC}
          {huyHieu}
        </div>
        {tren
          ? <div className="flex min-w-0 flex-col gap-2">{tieuDePC}{moTaDong}{soPC}<div className="pt-1">{cuoi}</div></div>
          : <div className="flex min-w-0 flex-1 flex-col justify-between">{tieuDePC}{moTaDong}{soPC}{cuoi}</div>}
        {ds && <PhotoList images={anh} videos={item.video ? [item.video] : []} title={item.title} onPick={setXem} onClose={() => setDs(false)} nhanPhim={xem < 0} banDo={{ diaChi: item.location, q: item.mapPin || item.location }} listingId={item.id} duongDan={href} />}
        {xem >= 0 && <PhotoViewer images={anh} start={xem} title={item.title} listingId={item.id} onClose={() => setXem(-1)} />}
      </article>
    );
  }

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
          {moTaDong}
        </Link>
        <div className="mt-3 flex items-center gap-2.5 px-3.5 pb-3" onClick={(e) => e.preventDefault()}>
          {anhDaiDien}
          {nguoiDang}
          {nutThich}
          {nutChiaSe}
        </div>
        {ds && <PhotoList images={anh} videos={item.video ? [item.video] : []} title={item.title} onPick={setXem} onClose={() => setDs(false)} nhanPhim={xem < 0} banDo={{ diaChi: item.location, q: item.mapPin || item.location }} listingId={item.id} duongDan={href} />}
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
        <h3 className={`${t === "gold" || t === "diamond" ? "line-clamp-3" : "line-clamp-2"} text-[16px] font-bold leading-[1.4] text-cvr-ink ${tier.uppercase ? "uppercase" : ""}`}><Highlight text={tieuDe} terms={terms} /></h3>
        {thongSoDong}
        {diaChi}
        {moTaDong}
      </Link>
      {/* Hàng cuối cân đối với cả thẻ (chủ dự án 20/10/2026): dòng 1 GIỐNG HỆT thẻ Basic — người đăng (ảnh · tên · ngày)
          + Thích + Chia sẻ sát phải; dòng 2 Zalo + "Hiện số 093 ***" trải hết bề ngang thẻ. */}
      <div className="px-3.5 pb-3" onClick={(e) => e.preventDefault()}>
        <div className="mt-3 flex items-center gap-2.5">
          {anhDaiDien}
          {nguoiDang}
          {nutThich}
          {nutChiaSe}
        </div>
        {coSo && (
          <div className="mt-2.5 flex items-center gap-2">
            <NutLienHeThe
              listingId={item.id}
              hienSo
              zaloTruoc
              nhan={item.soDau ? `Hiện số ${item.soDau} ***` : "Hiện số"}
              soCls="flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-cvr-blue px-3 text-[13px] font-semibold text-white transition active:scale-95"
              oCls="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg border border-cvr-line transition active:scale-95"
            />
          </div>
        )}
      </div>
      {ds && <PhotoList images={anh} videos={item.video ? [item.video] : []} title={item.title} onPick={setXem} onClose={() => setDs(false)} nhanPhim={xem < 0} banDo={{ diaChi: item.location, q: item.mapPin || item.location }} listingId={item.id} duongDan={href} />}
        {xem >= 0 && <PhotoViewer images={anh} start={xem} title={item.title} listingId={item.id} onClose={() => setXem(-1)} />}
    </article>
  );
}
