"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PhotoViewer from "@/components/PhotoViewer";
import Highlight from "@/components/Highlight";
import { NutLienHeThe } from "@/components/LienHeReveal";
import { freshText, type Listing } from "@/lib/data";
import { getTier, tierFromBadge, type TierId } from "@/lib/packages";
import { useSaved } from "@/lib/useSaved";
import { chuThuong, tenDiaDanh } from "@/lib/chuThuong";

// ============================================================================
// THẺ TIN THEO CẤP — BẢN ĐIỆN THOẠI (chuẩn đã chốt 09/10/2026: docs/THE-TIN-THEO-CAP.md).
// Dùng ở trang danh sách (Mua bán / Cho thuê) và khối "Bất động sản nổi bật" trang chủ.
//   KHUNG ẢNH — ảnh trên · nội dung dưới (thẻ rộng 343px):
//     Basic   : khung Google Discover 16:9 · 343×193
//     Silver  : khung chuẩn 4:3 · 343×257 (4:3 = khổ ảnh điện thoại, giữ được nhiều ảnh nhất)
//     Gold    : khung chuẩn chia kiểu Batdongsan — chính 245×257 trái + 2 phụ 3:4 96×128 phải
//     Diamond : khung chuẩn + 3 phụ 4:3 113×85 dưới (kiểu Batdongsan)
//   Ảnh dọc ở khung chính hiện trọn ảnh, hai bên lót chính ảnh đó làm mờ.
//   Huy hiệu góc trên trái + dải nhấn đỉnh thẻ: như cũ. Số đếm: 🖼 số ảnh (+ ▶ nếu có video).
//   Bấm ảnh → xem toàn màn hình kiểu Facebook (PhotoViewer).
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

// vuaKhung: ảnh DỌC đặt vào khung ngang thì hiện TRỌN ảnh (không cắt mất nửa), hai bên lót chính ảnh đó làm mờ
function O({ src, alt, className = "", sizes, onMo, children, vuaKhung }: { src?: string; alt: string; className?: string; sizes: string; onMo: () => void; children?: React.ReactNode; vuaKhung?: boolean }) {
  const [doc, setDoc] = useState(false);
  return (
    <button type="button" onClick={onMo} className={`relative block overflow-hidden bg-cvr-surface ${className}`}>
      {src && doc && <Image src={src} alt="" aria-hidden fill sizes="10vw" className="scale-110 object-cover blur-xl brightness-90" />}
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={doc ? "object-contain" : "object-cover"}
          onLoad={vuaKhung ? (e) => setDoc(e.currentTarget.naturalWidth < e.currentTarget.naturalHeight) : undefined}
        />
      )}
      {children}
    </button>
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
  const vip = t === "diamond" || t === "gold";
  const ten = tenDiaDanh(item);
  const tieuDe = tier.uppercase ? item.title : chuThuong(item.title, ten);
  const so = thongSo(item).slice(0, SO_THONG_SO[t]);
  const soAnh = item.imageCount || anh.length;
  const moc = freshText(item.postedAt, item.bumpedAt);
  const ngay = !moc || moc.startsWith("Làm mới") ? moc : `Đăng ${moc.charAt(0).toLowerCase()}${moc.slice(1)}`;

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

  const chinh = (
    <div className="relative w-full">
      <O vuaKhung src={anh[0]} alt={item.title} className={`${t === "basic" ? "aspect-[16/9]" : "aspect-[4/3]"} w-full`} sizes="100vw" onMo={() => setXem(0)} />
      {dem}
    </div>
  );
  let khungAnh: React.ReactNode = chinh;
  if (t === "gold" && anh.length >= 3) {
    khungAnh = (
      <div className="flex aspect-[4/3] w-full gap-[2px]">
        <div className="relative min-w-0 flex-1">
          <O vuaKhung src={anh[0]} alt={item.title} className="h-full w-full" sizes="75vw" onMo={() => setXem(0)} />
          {dem}
        </div>
        <div className="grid w-[calc((100%-2px)*0.2815)] shrink-0 grid-rows-2 gap-[2px]">
          {anh.slice(1, 3).map((src, k) => <O key={k} src={src} alt={item.title} className="h-full w-full" sizes="33vw" onMo={() => setXem(k + 1)} />)}
        </div>
      </div>
    );
  } else if (t === "diamond" && anh.length >= 4) {
    khungAnh = (
      <div className="grid gap-[2px]">
        {chinh}
        <div className="grid grid-cols-3 gap-[2px]">
          {anh.slice(1, 4).map((src, k) => <O key={k} src={src} alt={item.title} className="aspect-[4/3]" sizes="33vw" onMo={() => setXem(k + 1)} />)}
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
  // HÀNG ĐÁY (như Batdongsan): trái = ảnh đại diện + tên người đăng / thời gian (Diamond · Gold), cấp khác chỉ
  // thời gian · phải = Hiện số (Diamond · Gold, bấm là gọi điện thoại) · Yêu thích · Chia sẻ (ô viền).
  // Thẻ tin KHÔNG có Zalo — Zalo chỉ ở trang chi tiết (như Batdongsan).
  const oCls = "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cvr-line text-cvr-ink transition active:scale-95";
  const hangDay = (
    <div className="mt-3 flex items-center gap-2.5">
      {vip && (item.agentAvatar
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={item.agentAvatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
        : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-[12px] font-semibold text-cvr-body">{(item.agentName || "C").trim().charAt(0).toUpperCase()}</span>)}
      <div className="min-w-0 flex-1">
        {vip && <p className="truncate text-[14px] font-semibold text-cvr-ink">{item.agentName || "Coastal Land"}</p>}
        <p className="truncate text-[13px] text-cvr-muted">{ngay}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.preventDefault()}>
        {vip && (
          <NutLienHeThe
            listingId={item.id}
            hienSo
            nhanTin={false}
            soCls="flex h-10 max-w-[140px] shrink-0 items-center gap-1.5 rounded-lg bg-cvr-blue px-3.5 text-[14px] font-semibold text-white transition active:scale-95"
            oCls={oCls}
          />
        )}
        <button type="button" aria-label={daLuu ? "Bỏ yêu thích" : "Yêu thích"} aria-pressed={daLuu} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(item.id); }} className={`${oCls} ${daLuu ? "text-red-500" : ""}`}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill={daLuu ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Chia sẻ"
          onClick={(e) => {
            e.preventDefault(); e.stopPropagation();
            const url = `${window.location.origin}${href}`;
            if (navigator.share) navigator.share({ title: item.title, url }).catch(() => {});
            else navigator.clipboard?.writeText(url);
          }}
          className={oCls}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
            <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
            <path strokeLinecap="round" d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
          </svg>
        </button>
      </div>
    </div>
  );

  // Ảnh trên, nội dung dưới — MỌI cấp (kể cả Basic), chủ dự án 09/10/2026. Chữ như Batdongsan: tiêu đề cùng cỡ mọi cấp, 2 dòng;
  // không hiện mô tả trên thẻ.
  return (
    <article className="overflow-hidden bg-white shadow-lux">
      {tier.bar && t !== "basic" && <div className="h-px w-full" style={{ backgroundColor: tier.bar }} aria-hidden />}
      <div className="relative">
        {khungAnh}
        {huyHieu}
      </div>
      <Link href={href} className="block px-3.5 pt-3">
        <h3 className={`line-clamp-2 text-[16px] leading-[1.4] text-cvr-ink ${t === "basic" ? "font-medium" : "font-bold"} ${tier.uppercase ? "uppercase" : ""}`}><Highlight text={tieuDe} terms={terms} /></h3>
        {thongSoDong}
        {diaChi}
      </Link>
      <div className="px-3.5 pb-3">{hangDay}</div>
      {xem >= 0 && <PhotoViewer images={anh} start={xem} title={item.title} listingId={item.id} onClose={() => setXem(-1)} />}
    </article>
  );
}
