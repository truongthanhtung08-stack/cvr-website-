"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import FilterDropdown, { FilterDropdownGroup } from "@/components/FilterDropdown";
import { normalizeVi } from "@/lib/filters";
import type { Project, Article } from "@/lib/data";

// Danh sách dự án trang /du-an — bố cục kiểu Batdongsan:
// thanh lọc dưới Hero (ô tìm + dropdown Khu vực · Loại hình · Trạng thái)
// → tiêu đề + bộ đếm nhảy theo bộ lọc → thẻ ngang (ảnh trái · thông tin phải)
// + sidebar phải = lọc theo khu vực (đếm số dự án) + tin tức bất động sản.
// Dữ liệu do trang cha truyền vào (đọc từ Supabase — admin đăng gì hiện nấy).

// Tỉnh/thành = phần cuối của location ("Hòa Hải, Ngũ Hành Sơn, Đà Nẵng" → "Đà Nẵng")
const provinceOf = (location: string) => location.split(",").pop()?.trim() ?? "";
// Gom type tự do của dự án về 3 nhóm loại hình lớn (đủ cho bộ dữ liệu hiện tại)
const typeOf = (type: string) =>
  type.includes("Căn hộ") ? "Căn hộ" : type.includes("đô thị") ? "Khu đô thị" : "Nghỉ dưỡng & biệt thự";
// Giá/m² tham khảo: lấy hàng "Giá..." trong bảng quy mô của dự án
const priceRef = (p: Project) =>
  p.scale.find((s) => s.label.startsWith("Giá"))?.value;

const ALL = "Tất cả";

// Đếm số dự án theo từng giá trị của 1 tiêu chí
function countBy(projects: Project[], key: (p: Project) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const p of projects) m.set(key(p), (m.get(key(p)) ?? 0) + 1);
  return [...m];
}

export default function ProjectsBrowser({
  projects,
  articles,
  hero,
}: {
  projects: Project[];
  articles: Article[];
  // Banner Hero — nhận từ trang cha để đặt ĐÚNG thứ tự: mobile nằm DƯỚI thanh lọc,
  // desktop nằm TRÊN (dùng CSS order, không đổi cấu trúc dữ liệu).
  hero?: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(ALL);
  const [province, setProvince] = useState(ALL);
  const [type, setType] = useState(ALL);

  const provinceCounts = countBy(projects, (p) => provinceOf(p.location));
  const typeCounts = countBy(projects, (p) => typeOf(p.type));
  const statusCounts = countBy(projects, (p) => p.status);

  const nq = normalizeVi(q.trim());
  const visible = projects.filter(
    (p) =>
      (status === ALL || p.status === status) &&
      (province === ALL || provinceOf(p.location) === province) &&
      (type === ALL || typeOf(p.type) === type) &&
      (!nq || normalizeVi(`${p.name} ${p.developer} ${p.location}`).includes(nq))
  );

  const hasActive = q.trim() !== "" || status !== ALL || province !== ALL || type !== ALL;
  const reset = () => { setQ(""); setStatus(ALL); setProvince(ALL); setType(ALL); };

  // Panel chọn 1 giá trị trong dropdown (kèm số dự án mỗi mục)
  const optionList = (
    options: [string, number][],
    value: string,
    onPick: (v: string) => void,
    close: () => void
  ) => (
    <div className="space-y-0.5">
      {[[ALL, projects.length] as [string, number], ...options].map(([name, count]) => (
        <button
          key={name}
          type="button"
          onClick={() => { onPick(name); close(); }}
          className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
            value === name ? "bg-cvr-blue/10 font-medium text-cvr-blue-ink" : "text-cvr-ink/80 hover:bg-black/5"
          }`}
        >
          <span className="truncate">{name}</span>
          <span className="shrink-0 text-[11px] text-cvr-faint">{count} dự án</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col">
      {/* Hero banner — MOBILE nằm DƯỚI thanh lọc (mẫu Batdongsan), DESKTOP nằm TRÊN.
          Âm lề để banner tràn hết bề ngang, không bị lề trang bó lại. */}
      {hero && (
        // Tràn viền THẬT: kéo ra full bề ngang màn hình, không bị khung max-w-7xl bó lại
        // (trước đây Hero nằm ngoài khung nên full màn hình — phải giữ đúng như vậy trên PC).
        <div className="relative left-1/2 order-2 mb-3 w-screen -translate-x-1/2 sm:order-1 sm:mb-0">
          {hero}
        </div>
      )}

      {/* ── Thanh tìm + lọc dự án (MOBILE: lên trên cùng) ── */}
      <div className="order-1 mt-2.5 rounded-none border border-cvr-line bg-white p-2.5 shadow-lux sm:order-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          {/* Ô tìm nhanh dự án */}
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm nhanh theo tên dự án, chủ đầu tư, vị trí…"
              aria-label="Tìm nhanh dự án"
              className="h-10 w-full rounded-xl border border-transparent bg-cvr-surface pl-9 pr-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white"
            />
          </div>

          {/* Chip lọc: Khu vực · Loại hình · Trạng thái — MOBILE cuộn ngang 1 dòng */}
          <div className="no-scrollbar -mx-2.5 flex items-center gap-2 overflow-x-auto px-2.5 pb-0.5 lg:mx-0 lg:overflow-visible lg:px-0">
            <FilterDropdownGroup>
              <FilterDropdown label="Khu vực" summary={province === ALL ? "" : province} active={province !== ALL} panelClassName="w-64" className="shrink-0">
                {({ close }) => optionList(provinceCounts, province, setProvince, close)}
              </FilterDropdown>
              <FilterDropdown label="Loại hình" summary={type === ALL ? "" : type} active={type !== ALL} panelClassName="w-64" className="shrink-0">
                {({ close }) => optionList(typeCounts, type, setType, close)}
              </FilterDropdown>
              <FilterDropdown label="Trạng thái" summary={status === ALL ? "" : status} active={status !== ALL} panelClassName="w-64" className="shrink-0">
                {({ close }) => optionList(statusCounts, status, setStatus, close)}
              </FilterDropdown>
            </FilterDropdownGroup>
          </div>

          {hasActive && (
            <button
              type="button"
              onClick={reset}
              className="h-10 shrink-0 rounded-lg px-3 text-sm font-medium text-cvr-muted transition hover:text-cvr-blue-ink"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Phần còn lại LUÔN nằm cuối (sau Hero và thanh lọc) trên mọi kích thước */}
      <div className="order-3">
      {/* Tiêu đề + bộ đếm nhảy theo bộ lọc (kiểu Batdongsan) */}
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
        Dự án bất động sản Miền Trung
      </h1>
      <p className="mt-1.5 text-sm text-cvr-muted">
        Hiện có {visible.length} dự án căn hộ, khu đô thị và nghỉ dưỡng đang được Coastal Land phân phối.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Cột chính: thẻ dự án ngang ── */}
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-5">
            {visible.map((p) => (
              <Link
                key={p.slug}
                href={`/du-an/${p.slug}`}
                className="card-lux group relative flex gap-3 overflow-hidden rounded-none border border-cvr-line bg-white p-2.5 shadow-lux shadow-lux-hover hover:-translate-y-1 hover:border-cvr-blue/45 sm:gap-5 sm:p-3"
              >
                {/* Ảnh trái */}
                <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-xl bg-cvr-surface sm:w-56 md:w-64">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width:640px) 33vw, 256px"
                    className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                  />
                  <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cvr-ink backdrop-blur-sm">
                    {p.status}
                  </span>
                </div>

                {/* Thông tin phải */}
                <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
                  <h3 className="line-clamp-2 font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:text-lg">
                    {p.name}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="text-base font-semibold text-cvr-gold-ink sm:text-lg">{p.priceFrom}</span>
                    {priceRef(p) && <span className="text-xs text-cvr-muted">{priceRef(p)}</span>}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-cvr-muted">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{p.location}</span>
                  </p>
                  <p className="mb-3 mt-1.5 line-clamp-2 text-xs leading-relaxed text-cvr-muted">
                    {p.type} · {p.overview[0]}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-cvr-line pt-2.5">
                    <span className="truncate text-xs text-cvr-body">
                      Chủ đầu tư: <span className="font-medium text-cvr-ink">{p.developer}</span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-cvr-muted transition-colors group-hover:text-cvr-blue-ink">
                      Xem dự án →
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {visible.length === 0 && (
              <p className="rounded-none border border-cvr-line bg-cvr-surface p-10 text-center text-sm text-cvr-muted">
                Chưa có dự án phù hợp bộ lọc. Hãy đổi từ khoá hoặc bấm &ldquo;Đặt lại&rdquo;.
              </p>
            )}
          </div>
        </div>

        {/* ── Sidebar: lọc theo khu vực + tin tức (kiểu Batdongsan) ── */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-none border border-cvr-line bg-white p-5 shadow-lux">
              <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Lọc theo khu vực</h2>
              <div className="mt-3 flex flex-col">
                {[[ALL, projects.length] as [string, number], ...provinceCounts].map(([name, count]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setProvince(name)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      province === name
                        ? "bg-cvr-surface font-semibold text-cvr-ink"
                        : "text-cvr-body hover:bg-cvr-surface hover:text-cvr-ink"
                    }`}
                  >
                    <span>{name === ALL ? "Tất cả khu vực" : name}</span>
                    <span className="text-xs text-cvr-muted">{count} dự án</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tin tức bất động sản — 5 bài mới nhất */}
            <div className="rounded-none border border-cvr-line bg-white p-5 shadow-lux">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Tin tức bất động sản</h2>
                <Link href="/tin-tuc" className="shrink-0 text-xs font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
                  Xem thêm →
                </Link>
              </div>
              <div className="mt-2 flex flex-col divide-y divide-cvr-line/70">
                {articles.slice(0, 5).map((a) => (
                  <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group py-3 first:pt-2 last:pb-0">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                      {a.title}
                    </p>
                    <p className="mt-1 text-xs text-cvr-muted">{a.category} · {a.date}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
      </div>
    </div>
  );
}
