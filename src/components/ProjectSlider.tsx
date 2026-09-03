"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import AnhChay from "@/components/AnhChay";
import { chuThuan } from "@/lib/chuThuan";
import Link from "next/link";
import type { Project, Article } from "@/lib/data";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import Pager from "@/components/Pager";
import { useHomeSection } from "@/components/HomeExpand";

// ── KHỐI DỰ ÁN DÙNG CHUNG (trang chủ · "Dự án liên quan" ở trang chi tiết) ────
// Cấu trúc đã chốt:
//   · Slide 8 dự án, xếp theo CẤP VIP (Diamond → Gold → Silver → thường).
//   · Nút "Xem thêm" ở dưới → XỔ RA ngay tại chỗ danh sách dạng List,
//     phân trang 8 dự án/trang (không rời khỏi trang đang xem).
//   · Bấm "Thu gọn" để quay lại slide.

const PER_PAGE = 8;
const TIER_RANK: Record<string, number> = { diamond: 0, gold: 1, silver: 2, basic: 3 };
const TIER_ACCENT: Record<string, string> = {
  diamond: "#d7263d",
  gold: "#c9a24a",
  silver: "#0071e3",
};
const TIER_SHORT: Record<string, string> = { diamond: "Diamond", gold: "Gold", silver: "Silver" };

// Xếp theo cấp VIP, giữ nguyên thứ tự gốc (mới nhất trước) khi cùng cấp.
export function sortProjectsByTier(list: Project[]): Project[] {
  return list
    .map((p, i) => ({ p, i, r: TIER_RANK[p.tier ?? "basic"] ?? 3 }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((e) => e.p);
}

function TierBadge({ tier }: { tier?: string }) {
  if (!tier || tier === "basic") return null;
  return (
    <span
      className="absolute left-3 top-3 rounded-full px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em] text-white shadow-[0_2px_10px_rgba(0,0,0,0.28)] ring-1 ring-white/25 backdrop-blur-md"
      style={{ backgroundColor: TIER_ACCENT[tier] }}
    >
      {TIER_SHORT[tier]}
    </span>
  );
}

function PinIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// Thẻ dự án dạng lưới/slide — ảnh TRÊN, nội dung DƯỚI (kiểu điện thoại)
export function ProjectCard({ p }: { p: Project }) {
  return (
    <Link
      href={`/du-an/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-none border-0 bg-white shadow-lux shadow-lux-hover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 sm:border sm:border-cvr-line"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-cvr-surface sm:aspect-[16/10]">
        <AnhChay images={[p.image, ...(p.photos ?? [])]} alt={p.name} sizes="(max-width: 640px) 86vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        <TierBadge tier={p.tier} />
        <span className="absolute right-3 top-3 rounded-full bg-white/80 px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em] text-cvr-ink shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-1 ring-white/60 backdrop-blur-md">
          {p.status}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="clamp-2 min-h-[3em] font-semibold leading-[1.5] text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
          {p.name}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-cvr-muted">
          <PinIcon /><span className="line-clamp-1">{p.location}</span>
        </p>
        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <span className="text-[15px] font-semibold text-cvr-ink">{p.priceFrom}</span>
          <span className="text-[13px] text-cvr-body">{p.type}</span>
        </div>
      </div>
    </Link>
  );
}

// Hàng dự án dạng LIST — ảnh TRÁI, nội dung PHẢI (kiểu PC / khi xổ "Xem thêm")
export function ProjectRow({ p }: { p: Project }) {
  return (
    <Link
      href={`/du-an/${p.slug}`}
      // ĐIỆN THOẠI: ảnh TRÊN – nội dung DƯỚI · MÁY TÍNH: ảnh TRÁI – nội dung PHẢI
      className="group flex flex-col gap-3 overflow-hidden border border-cvr-line bg-white p-2.5 shadow-lux shadow-lux-hover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 sm:flex-row sm:gap-4 sm:p-3"
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-cvr-surface sm:aspect-[4/3] sm:w-[38%] sm:min-w-[240px] sm:max-w-[420px]">
        <AnhChay images={[p.image, ...(p.photos ?? [])]} alt={p.name} sizes="(max-width: 640px) 100vw, 38vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        <TierBadge tier={p.tier} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:text-base">
          {p.name}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-cvr-muted">
          <PinIcon /><span className="line-clamp-1">{p.location}</span>
        </p>
        <p className="mt-1.5 hidden text-sm leading-relaxed text-cvr-muted sm:line-clamp-2">{chuThuan(p.overview[0])}</p>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-2">
          <span className="text-[15px] font-semibold text-cvr-ink">{p.priceFrom}</span>
          <span className="text-[13px] text-cvr-body">{p.type}</span>
          <span className="text-[13px] text-cvr-muted">{p.status}</span>
        </div>
      </div>
    </Link>
  );
}

// ── DANH SÁCH DỰ ÁN DẠNG LIST, PHÂN TRANG 8/TRANG ────────────────────────────
// Dùng chung cho nút "Xem thêm" ở trang chủ và ở "Dự án liên quan".
export function ProjectListPaged({ projects }: { projects: Project[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(projects.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageItems = projects.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <div>
      <div className="space-y-4">
        {pageItems.map((p) => (
          <ProjectRow key={p.slug} p={p} />
        ))}
      </div>

      <Pager page={current} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

// Nút "Xem thêm" dùng chung — bấm là ra danh sách theo trang. KHÔNG có "Thu gọn":
// đã mở danh sách thì nút biến mất.
// Mũi tên chạy slide — chỉ hiện trên máy có chuột (điện thoại vuốt tay).
function SlideArrow({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  const prev = dir === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={prev ? "Xem dự án trước" : "Xem dự án tiếp theo"}
      className={`absolute top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cvr-line bg-white/95 text-cvr-ink shadow-lux backdrop-blur transition hover:bg-white lg:flex ${
        prev ? "-left-4" : "-right-4"
      }`}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={prev ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}

export function ExpandToggle({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  if (expanded) return null;
  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="btn-xemthem"
      >
        Xem thêm
        <svg
          className="h-4 w-4"
          fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

export default function ProjectSlider({
  projects,
  title,
  emptyNote,
  sectionKey = "du-an-lien-quan",
  articles = [],
  relevance = false,
}: {
  projects: Project[];
  title: string;
  emptyNote?: string;
  // "Dự án tương tự": nguồn đã xếp sẵn theo ĐỘ LIÊN QUAN → GIỮ NGUYÊN thứ tự đó,
  // không xếp lại theo hạng VIP (nếu xếp lại thì mất ưu tiên "tương tự").
  relevance?: boolean;
  // Tin tức cho CỘT PHẢI của danh sách dự án (giống trang /du-an)
  articles?: Article[];
  // Bấm "Xem thêm" → phần còn lại của trang ẩn đi, không đổ dài xuống dưới
  sectionKey?: string;
}) {
  const { expanded, hidden, toggle } = useHomeSection(sectionKey);
  // Chạy slide bằng mũi tên: cuộn đúng 1 màn thẻ mỗi lần bấm.
  const trackRef = useRef<HTMLDivElement>(null);
  const slide = (huong: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: huong * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const sorted = relevance ? projects : sortProjectsByTier(projects);
  const top8 = sorted.slice(0, 8);

  // Khối khác đang mở danh sách → khối này ẩn
  if (hidden) return null;

  // Chưa có dự án → VẪN dựng khung (tiêu đề + ô báo trống) để khi có dự án là
  // chạy đúng cấu trúc slide + "Xem thêm" mà không phải sửa gì thêm.
  if (sorted.length === 0) {
    return (
      <div className="mt-10 sm:mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">{title}</h2>
        <p className="mt-5 rounded-xl border border-dashed border-cvr-line bg-cvr-surface px-4 py-8 text-center text-sm text-cvr-muted">
          {emptyNote ?? "Chưa có dự án nào."}
        </p>
      </div>
    );
  }

  return (
    /* Đã mở danh sách → bỏ khoảng cách trên đầu (nội dung phía trên đã ẩn) */
    /* Cách khối trên 40px — trước để 56px, lệch hẳn với 32px giữa các khối nội
       dung phía trên (Tổng quan · Vị trí · Tiến độ · Bảng giá · Chủ đầu tư). */
    <div className={expanded ? undefined : "mt-10"}>
      {/* Mở danh sách rồi thì ẩn tiêu đề khối — danh sách đã có tiêu đề riêng */}
      {!expanded && <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">{title}</h2>}

      {!expanded ? (
        /* SLIDE 8 dự án — CHẠY NGANG Ở MỌI KÍCH THƯỚC MÀN (trước đây PC bị dựng
           thành lưới tĩnh 4×2, không phải slide). Điện thoại 1 thẻ · tablet 2 ·
           PC 4 thẻ mỗi màn; vuốt hoặc bấm mũi tên để chạy. */
        <div className="relative mt-5">
          <div ref={trackRef} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:px-0">
            {top8.map((p) => (
              <div
                key={p.slug}
                className="w-[80%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
              >
                <ProjectCard p={p} />
              </div>
            ))}
          </div>
          {/* Mũi tên — chỉ hiện trên máy có chuột */}
          <SlideArrow dir="prev" onClick={() => slide(-1)} />
          <SlideArrow dir="next" onClick={() => slide(1)} />
        </div>
      ) : (
        /* XỔ RA: ĐÚNG bố cục trang /du-an — danh sách + CỘT PHẢI (lọc khu vực,
           tin tức) + phân trang. Dùng lại chính ProjectsBrowser nên không lệch. */
        <ProjectsBrowser projects={sorted} articles={articles} />
      )}

      {/* LUÔN có nút — cấu trúc đồng nhất ở mọi phần, kể cả khi ít hơn 8 dự án */}
      {sorted.length > 0 && (
        <ExpandToggle expanded={expanded} onClick={toggle} />
      )}
    </div>
  );
}
