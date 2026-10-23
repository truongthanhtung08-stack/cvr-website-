"use client";

import { useEffect, useRef, useState } from "react";
import ShareButtons from "@/components/ShareButtons";
import BieuTuongThe from "@/components/BieuTuongThe";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
// Bộ xem ảnh chỉ tải khi khách bấm mở (tốc độ điện thoại, đo 22/10/2026): trước đây nằm sẵn trong mã mọi trang có thẻ tin.
const PhotoViewer = dynamic(() => import("@/components/PhotoViewer"), { ssr: false });
const PhotoList = dynamic(() => import("@/components/PhotoList"), { ssr: false });
import Highlight from "@/components/Highlight";
import { NutLienHeThe } from "@/components/LienHeReveal";
import { freshText, type Listing } from "@/lib/data";
import { getTier, tierFromBadge, type TierId } from "@/lib/packages";
import { useSaved } from "@/lib/useSaved";
import { tieuDeThe } from "@/lib/chuThuong";
import { videoPosterUrl } from "@/lib/media";
import { moTaThe, soDongMoTa } from "@/lib/trichMoTa";
import { thongSoTheoCap } from "@/lib/thongSoThe";
import DemAnhVideo, { IconPlay } from "@/components/DemAnhVideo";

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

// Số mục thông số theo cấp + thông số theo loại hình: src/lib/thongSoThe.ts (dùng chung với thẻ trang chủ máy tính).
// Máy tính cùng một luật (chủ dự án 20/10/2026: "quy định tin theo cấp thì bản nào cũng như vậy").




// 2 chữ viết tắt của tên (chữ đầu + chữ cuối): "Trần Mai Chi" → "TC"
// Tin của chính Coastal Land: ký hiệu thương hiệu "CVR", không viết tắt "CL" (chủ dự án 22/10/2026 tối)
function viTat(ten?: string): string {
  if (!ten || /^coastal\s*land$/i.test(ten.trim())) return "CVR";
  const w = ten.trim().split(/\s+/).filter(Boolean);
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
      {nguon && <Image src={nguon} alt={alt} fill sizes={sizes} loading={dau ? "eager" : "lazy"} fetchPriority={dau ? "high" : undefined} unoptimized={nguon.startsWith("https://i.ytimg.com")} className="object-cover" onError={() => setLoi(true)} onLoad={(e) => { if (duPhong && e.currentTarget.naturalWidth <= 120) setLoi(true); }} />}
      {!nguon && videoTep && <video src={`${videoTep}#t=0.1`} preload="metadata" muted playsInline className="absolute inset-0 h-full w-full object-cover" />}
      {children}
    </button>
  );
}

// KHUNG CHÍNH TỰ CHẠY: vuốt qua lại xem ảnh/video ngay trên thẻ; không chạm gì thì tự chuyển
// 3,5 giây/ảnh khi thẻ đang hiện trên màn hình; vừa chạm thì nghỉ 6 giây rồi chạy lại.
// Dải ảnh dịch bằng transform theo SỐ THỨ TỰ ảnh → luôn dừng đúng khít một ảnh, không lệch mép.
type Slide = { anh?: string; video?: boolean; duPhong?: string; videoTep?: string };
function KhungChay({ slides, alt, khung, sizes, onMo, children, tuChay = true, uuTien = false }: { slides: Slide[]; alt: string; khung: string; sizes: string; onMo: (k: number) => void; children?: React.ReactNode; tuChay?: boolean; uuTien?: boolean }) {
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
          <O key={k} dau={uuTien && k === 0} src={s.anh} duPhong={s.duPhong} videoTep={s.videoTep} alt={alt} sizes={sizes} className={`h-full w-full shrink-0 ${s.video ? "bg-black" : ""}`} onMo={() => { if (!daKeo.current) onMo(k); }}>
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
// uuTien = thẻ ĐẦU danh sách: ảnh đầu tải ngay. Thẻ khác tải khi khách cuộn gần tới — trước đây thẻ nào cũng tải ngay, trang chủ bắt
// điện thoại tải trước 10+ ảnh cùng lúc, ảnh đầu trang phải xếp hàng (đo 20/10/2026: 8,8 giây mới hiện).
export default function TheTinMobile({ item, terms = [], tuChay = false, pc = false, moTa = true, dcCu = true, uuTien = false }: { item: Listing; terms?: string[]; tuChay?: boolean; pc?: boolean; moTa?: boolean; dcCu?: boolean; uuTien?: boolean }) {
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
  // Xuống dòng không cắt số + đơn vị (giuCum, chủ dự án 23/10/2026)
  const tieuDe = tieuDeThe(item, !!tier.uppercase);
  // Điện thoại: bỏ nội thất (chủ dự án 23/10/2026) — Diamond · Gold MỘT dòng: giá · diện tích · giá/m² (nếu có) · PN · WC
  const so = thongSoTheoCap(item, t).filter((x) => pc || x.icon !== "sofa");
  const soAnh = item.imageCount || anh.length;
  // "3 giờ trước" tính theo giờ hiện tại: trang máy chủ dựng sẵn (đệm tới 1 giờ) ghi giờ lúc dựng → vẽ lại một lần sau khi
  // mở để chữ đúng giờ máy khách (kèm suppressHydrationWarning ở dòng chữ, không để React báo lệch và dựng lại cả trang)
  const [, setDaMo] = useState(false);
  useEffect(() => setDaMo(true), []);
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
  // MÁY TÍNH (pc): bấm ảnh trên thẻ = MỞ TRANG TIN (cách mở chuẩn máy tính; xem ảnh/video bằng khung slide của trang tin)
  // — KHÔNG mở danh sách ảnh/video kiểu điện thoại (chủ dự án 20/10/2026).
  const router = useRouter();
  const moTin = () => router.push(href);
  const moSlide = (k: number) => {
    void k;
    if (pc) return moTin();
    setDs(true);
  };

  // Chỉ báo tin có bao nhiêu ảnh, bao nhiêu video (chủ dự án 09/10/2026) — cùng kiểu với khung ảnh trang tin (DemAnhVideo)
  const dem = <DemAnhVideo soAnh={soAnh} soVideo={item.soVideo ?? (item.hasVideo ? 1 : 0)} className="absolute bottom-1.5 right-1.5" />;
  const huyHieu = t !== "basic" && (
    <span
      className={`pointer-events-none absolute left-2.5 top-2.5 rounded-full px-2 py-[3px] text-[11px] font-semibold uppercase tracking-[0.06em] shadow-[0_2px_10px_rgba(0,0,0,0.28)] ring-1 backdrop-blur-md ${t === "diamond" ? "ring-[#d9b64e]/70" : "ring-white/25"}`}
      style={{ backgroundColor: `${tier.accent}e6`, color: tier.badgeText }}
    >
      {tier.short}
    </span>
  );
  // CHIA SẺ — MỘT tính năng chung cả web (chủ dự án 23/10/2026: "nút like, chia sẻ không phải để cho có — đây là tính năng chung
  // cả web"): thẻ tin dùng ĐÚNG bảng chia sẻ của trang tin (ShareButtons) cho link tin này — điện thoại bật khay chia sẻ của máy
  // (Zalo, Messenger, Facebook…), máy tính mở bảng Zalo · Facebook · Sao chép link. Trước đây thẻ máy tính bấm chỉ lặng lẽ chép link.
  const nutChiaSe = (
    <ShareButtons title={item.title} duongDan={href} moLen nutCls={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-cvr-ink transition active:scale-95 ${pc ? "border border-cvr-line hover:border-cvr-ink" : "-mr-1.5"}`} />
  );

  const khungChinh = (khung: string, sizes: string) => (
    <KhungChay slides={slides} alt={item.title} khung={khung} sizes={sizes} onMo={moSlide} tuChay={tuChay} uuTien={uuTien}>{dem}</KhungChay>
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

  // DIAMOND: cả dòng ĐÚNG MỘT DÒNG (chủ dự án 23/10/2026) — không xuống dòng; màn hẹp thì chữ dòng này co theo bề ngang
  // (tối đa 15px, màn 320 ≈ 12,8px), khoảng cách dấu · thu lại. Cấp khác xuống dòng tự nhiên khi không đủ chỗ.
  const motDong = t === "diamond" && !pc;
  // CÂN ĐỐI TỰ GIÃN (chủ dự án 23/10/2026): điện thoại, dòng ĐỦ trường (≥ 5 mục) thì dàn đều hết bề ngang thẻ; thiếu trường
  // thì giữ khoảng cách tự nhiên từ trái — không giãn thưa vài mục ra hai mép.
  const dan = !pc && so.length >= 5 ? "justify-between" : "";
  // Một nhóm mục thông số: dấu · đứng SAU mục (không đứng trước mục sau) — chữ to trong Zalo/Facebook làm dòng xuống hàng
  // thì dấu nằm cuối dòng trên, không lơ lửng đầu dòng dưới (20/10/2026)
  const mucSo = (ds: typeof so) => ds.map((x, i) => (
    <span key={i} className={`flex shrink-0 items-center gap-1 ${x.do ? "font-bold text-red-500" : ""}`}>
      {x.icon === "sofa" && <BieuTuongThe loai="sofa" />}
      {x.chu}
      {(x.icon === "pn" || x.icon === "wc") && <BieuTuongThe loai={x.icon} />}
      {i < ds.length - 1 && <span className="ml-0.5 text-cvr-muted">·</span>}
    </span>
  ));
  // Thông số MỘT dòng mọi cấp, chữ 15px — không tách dòng, không đổi cỡ chữ (chủ dự án 23/10/2026)
  const thongSoDong = (
    <p className={`${pc ? "mt-1.5" : "mt-2"} flex items-center text-cvr-body ${dan} ${motDong && !(t === "diamond" || t === "gold") ? "flex-nowrap gap-x-1 overflow-hidden whitespace-nowrap text-[min(15px,3.7vw)]" : "flex-wrap gap-x-1.5 text-[15px]"}`}>
      {mucSo(so)}
    </p>
  );
  // Địa chỉ MỘT dòng "Phường, Tỉnh/Thành phố" — điện thoại và máy tính cùng quy định (chủ dự án 20/10/2026)

  const diaChiDong = (
    <>
      <p className={pc ? "mt-1 flex items-center gap-1 text-[14px] text-cvr-body" : "mt-1.5 flex items-start gap-1 text-[14px] text-cvr-body"}>
        <svg className={`${pc ? "" : "mt-px "}h-4 w-4 shrink-0`} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" aria-hidden><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
        {/* Điện thoại: địa chỉ ĐÚNG MỘT DÒNG, không bị che (chủ dự án 23/10/2026) — dài nhất hiện có "Phường Bắc Nha Trang, Khánh
            Hòa" vừa màn 320; màn hẹp chữ co theo bề ngang (tối đa 14px) thay vì xuống dòng hay cắt "…" */}
        <span className={pc ? "truncate" : "whitespace-nowrap text-[min(14px,3.9vw)]"}><Highlight text={item.location} terms={terms} /></span>
      </p>
    </>
  );
  const trich = moTa ? moTaThe(item) : "";
  const soDong = soDongMoTa(item);
  // Điện thoại: tiêu đề → giá · m² → địa chỉ → mô tả (chủ dự án 20/10/2026: giá · diện tích ngay dưới tiêu đề)
  const moTaDong = trich ? <p className={`${pc ? "mt-1" : "mt-2"} ${["", "line-clamp-1", "line-clamp-2", "line-clamp-3"][soDong]} text-[14px] leading-[1.45] text-cvr-muted`}><Highlight text={trich} terms={terms} /></p> : null;
  const diaChi = diaChiDong;

  // Hàng người đăng ĐIỆN THOẠI gọn, cân với chữ phía trên (chủ dự án 23/10/2026): ảnh 32px · tên 14px · ngày 12px · Thích, Chia sẻ
  // chỉ biểu tượng (không khung viền), vùng bấm vẫn 36px. Máy tính giữ cỡ cũ + khung viền (hàng nút 40px).
  const oCls = `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-cvr-ink transition active:scale-95 ${pc ? "border border-cvr-line" : ""}`;
  const nutThich = (
    <button type="button" aria-label={daLuu ? "Bỏ yêu thích" : "Yêu thích"} aria-pressed={daLuu} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(item.id); }} className={`${oCls} ${daLuu ? "text-red-500" : ""}`}>
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill={daLuu ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
  const anhDaiDien = item.agentAvatar
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={item.agentAvatar} alt={item.agentName ?? ""} className={`${pc ? "h-10 w-10" : "h-8 w-8"} shrink-0 rounded-full object-cover ring-1 ring-cvr-line`} />
    : <span className={`flex ${pc ? "h-10 w-10 text-[14px]" : "h-8 w-8 text-[12px]"} shrink-0 items-center justify-center rounded-full bg-cvr-surface font-semibold text-cvr-body ring-1 ring-cvr-line`}>{viTat(item.agentName)}</span>;
  const nguoiDang = (
    <div className="min-w-0 flex-1">
      <p className={`truncate ${pc ? "text-[15px]" : "text-[14px]"} font-semibold leading-tight text-cvr-ink`}>{item.agentName || "Coastal Land"}</p>
      <p suppressHydrationWarning className={`mt-0.5 truncate ${pc ? "text-[13px]" : "text-[12px]"} leading-tight text-cvr-muted`}>{ngay}</p>
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
    // Diamond · Gold (QUY TẮC chủ dự án 20/10/2026): DẢI ẢNH TRẢI HẾT BỀ NGANG thẻ (869) — 1 ảnh chính + 3 ảnh phụ
    // (1 phụ trên, 2 phụ dưới) bên phải; ảnh chính TỶ LỆ VÀNG 1,618. Gold cùng cách xếp, cả dải THẤP hơn Diamond.
    //   Diamond (cao 322): chính 521×322 · phụ trên 347×215 · 2 phụ dưới 173×107 (mọi khung tỷ lệ vàng)
    //   (chủ dự án 20/10/2026: cả dải ảnh Diamond · Gold thu nhỏ còn 90% — rộng 782, cao 290: chính 469×290 ·
    //    phụ trên 312×193 · 2 phụ dưới 156×96, vẫn toàn tỷ lệ vàng)
    //   Gold    = CÙNG KHUNG Diamond (chủ dự án 20/10/2026: ưu tiên 1 cả trang cân đối, ưu tiên 2 tỷ lệ vàng — hết bề ngang
    //           + toàn tỷ lệ vàng chỉ có một cỡ 322); Gold khác Diamond ở nhãn, dải màu, số thông số.
    // Chữ dưới dải ảnh: tiêu đề → giá · diện tích → địa chỉ → mô tả; hàng người đăng + nút ở đáy.
    const phu = (t === "diamond" || t === "gold") && anh.length >= 4 ? anh.slice(1, 4) : [];
    let anhPC: React.ReactNode;
    if (tren && phu.length) {
      // CHỐT 20/10 (chủ dự án): Diamond dải 869×322 toàn tỷ lệ vàng (chính 521×322) · Gold dải 869×290 THẤP hơn
      // (chính tỷ lệ vàng 469×290, phụ 2:1) — cả hai hết bề ngang, Diamond to hơn Gold.
      const o = (src: string, k: number, sz: string) => <O key={k} src={src} alt={item.title} className="h-full w-full" sizes={sz} onMo={moTin} />;
      anhPC = (
        <div className={`grid w-full ${t === "diamond" ? "grid-cols-[521fr_347fr]" : "grid-cols-[469fr_399fr]"} gap-px overflow-hidden rounded-xl`}>
          {khungChinh("aspect-[1.618] w-full", "530px")}
          <div className="grid grid-rows-[2fr_1fr] gap-px">
            {o(phu[0], 0, "450px")}
            <div className="grid grid-cols-2 gap-px">{phu.slice(1).map((x, k) => o(x, k + 1, "225px"))}</div>
          </div>
        </div>
      );
    } else if (tren) {
      anhPC = <div className="w-full overflow-hidden rounded-xl">{khungChinh(`${t === "diamond" ? "aspect-[2.7]" : "aspect-[3.34]"} w-full`, "870px")}</div>;
    } else {
      // Silver · Basic: MỘT khung chính, ảnh trái, TỶ LỆ VÀNG, chữ một bên; cao ảnh KHỚP cao phần chữ (chủ dự án 20/10/2026):
      // Silver 400×247 · Basic 360×222 (kéo dài ngang theo chủ dự án 20/10/2026, vẫn tỷ lệ vàng). Bậc: 290 · 290 · 247 · 222.
      anhPC = <div className={`shrink-0 overflow-hidden rounded-xl ${t === "basic" ? "w-[360px]" : "w-[400px]"}`}>{khungChinh("aspect-[1.618] w-full", "340px")}</div>;
    }
    // CÙNG CẤU TRÚC thẻ điện thoại (chủ dự án 20/10/2026): tiêu đề (Basic 2 · Silver 2 · Gold 3 · Diamond 3 dòng) → giá · diện tích
    // → địa chỉ → mô tả → hàng cuối. Silver · Basic: tiêu đề giữ chỗ 2 dòng để thẻ cùng cấp cao như nhau. Chữ chia 3 nhóm — tiêu đề / giá + địa chỉ + mô tả /
    // hàng cuối — DÀN ĐỀU theo chiều cao ảnh (justify-between), không dồn khoảng trống một chỗ.
    const tieuDePC = <Link href={href} className="block"><h3 className={`${t === "gold" || t === "diamond" ? "line-clamp-3" : "line-clamp-2 min-h-[2.8em]"} text-[16px] leading-[1.4] text-cvr-ink ${t === "basic" ? "font-medium" : "font-bold"} ${tier.uppercase ? "uppercase" : ""}`}><Highlight text={tieuDe} terms={terms} /></h3></Link>;
    const soPC = <Link href={href} className="block [&>p:first-child]:mt-0">{thongSoDong}{diaChi}</Link>;
    // Hàng cuối MỘT DÒNG, 4 cấp như nhau — GIỮ ĐÚNG bản đang chạy trên web (chủ dự án 23/10/2026: "trên web có vậy đâu!").
    const cuoiCu = (
      <div className="flex items-center gap-2.5" onClick={(e) => e.preventDefault()}>
        {anhDaiDien}
        {nguoiDang}
        {coSo && (
          <NutLienHeThe
            listingId={item.id}
            hienSo
            zaloTruoc
            nhan={item.soDau ? `${item.soDau} ***` : "Hiện số"}
            soCls="flex min-h-10 shrink-0 py-1.5 items-center gap-1.5 whitespace-nowrap rounded-lg bg-cvr-blue px-3 text-[13px] font-semibold text-white transition active:scale-95"
            oCls="flex min-h-10 w-11 shrink-0 self-stretch items-center justify-center rounded-lg border border-cvr-line transition active:scale-95"
          />
        )}
        {nutThich}
        {nutChiaSe}
      </div>
    );
    // Dải màu cấp nằm SÁT mép trên khung ảnh, bo theo góc ảnh (chủ dự án 20/10/2026).
    const khoiAnh = (
      <div className="relative shrink-0 self-start overflow-hidden rounded-xl">
        {anhPC}
        {tier.bar && <div className="absolute inset-x-0 top-0 z-10 h-px" style={{ backgroundColor: tier.bar }} aria-hidden />}
        {huyHieu}
      </div>
    );
    return (
      <article className={`relative flex gap-4 overflow-hidden bg-white p-3 ${tren ? "flex-col" : ""}`}>
        {tren ? (
          // Diamond · Gold: dải ảnh trên hết bề ngang → chữ dưới → hàng cuối (người đăng trái, nút phải).
          <>
            <div className="relative w-full overflow-hidden rounded-xl">
              {anhPC}
              {tier.bar && <div className="absolute inset-x-0 top-0 z-10 h-px" style={{ backgroundColor: tier.bar }} aria-hidden />}
              {huyHieu}
            </div>
            {/* Chữ gọn cho thẻ VIP thấp lại (cả trang cân đối): thông số và địa chỉ (hệ mới) CHUNG một hàng */}
            <div className="-mt-1 flex min-w-0 flex-col gap-1.5">
              {tieuDePC}
              {/* Thông số và địa chỉ HAI DÒNG RIÊNG như điện thoại (chủ dự án 23/10/2026: "vì sao lại đưa dòng địa chỉ lên đó") */}
              {soPC}
              {moTaDong}
            </div>
            <div className="border-t border-cvr-line pt-3">{cuoiCu}</div>
          </>
        ) : (
          <>
            {/* Silver · Basic: BỐ CỤC ĐÃ DUYỆT (đang chạy trên web) — giữ nguyên, chủ dự án 23/10/2026: "cấu trúc đã fix từ lâu, chỉ
                sửa cái tôi yêu cầu" */}
            {khoiAnh}
            <div className="flex min-w-0 flex-1 flex-col">{tieuDePC}<div className="mt-2">{soPC}{moTaDong}</div><div className="mt-auto pt-3">{cuoiCu}</div></div>
          </>
        )}
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
              nhan={item.soDau ? `${item.soDau} ***` : "Hiện số"}
              soCls="flex min-h-9 min-w-0 flex-[3] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-cvr-blue px-2 py-1.5 text-[13px] font-semibold text-white transition active:scale-95"
              oCls="flex min-h-9 min-w-0 flex-[2] self-stretch items-center justify-center gap-1.5 rounded-lg border border-cvr-line px-2 transition active:scale-95"
              chuZalo="Zalo"
            />
          </div>
        )}
      </div>
      {ds && <PhotoList images={anh} videos={item.video ? [item.video] : []} title={item.title} onPick={setXem} onClose={() => setDs(false)} nhanPhim={xem < 0} banDo={{ diaChi: item.location, q: item.mapPin || item.location }} listingId={item.id} duongDan={href} />}
        {xem >= 0 && <PhotoViewer images={anh} start={xem} title={item.title} listingId={item.id} onClose={() => setXem(-1)} />}
    </article>
  );
}
