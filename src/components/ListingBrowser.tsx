"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import FilterBar from "@/components/FilterBar";
import ActiveFilters from "@/components/ActiveFilters";
import { featuredListings, type Article, type Listing } from "@/lib/data";
import {
  applyFilters,
  sortListings,
  filtersFromParams,
  emptyFilters,
  hasActiveFilters,
  priceRangesFor,
  areaRanges,
  type Filters,
  type SortKey,
} from "@/lib/filters";

const PER_PAGE = 8;

export default function ListingBrowser({
  heading,
  purpose = "ban",
  items = featuredListings,
  articles = [],
  relevance = false,
  nested = false,
}: {
  heading: string;
  // Mục đích trang: "ban" = mua bán · "thue" = cho thuê — lọc nguồn tin + danh mục loại hình.
  purpose?: "ban" | "thue";
  // Tin từ Supabase (server truyền xuống) — không truyền thì dùng dữ liệu mẫu.
  items?: Listing[];
  // Bài viết cho cột phải "Bài viết được quan tâm" (trang Mua bán / Cho thuê).
  // Không truyền → khối này không hiện (vd khi nhúng trong trang chi tiết tin).
  articles?: Article[];
  // Danh sách "tin tương tự": nguồn đã sắp theo độ liên quan → mặc định giữ đúng
  // thứ tự đó (thay vì Mới nhất) và thêm lựa chọn sắp xếp "Liên quan nhất".
  relevance?: boolean;
  // Đặt bên trong một trang đã có khung max-w-7xl + lề ngang (trang chi tiết tin,
  // chi tiết dự án…) → BỎ khung riêng, nếu không lề bị cộng dồn gấp đôi.
  nested?: boolean;
}) {
  const params = useSearchParams();

  const [filters, setFiltersState] = useState<Filters>(() => filtersFromParams(params));
  const [sort, setSort] = useState<SortKey>(relevance ? "lien-quan" : "moi");
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);

  // Đổi bộ lọc → luôn quay về trang 1
  const setFilters = (f: Filters) => { setFiltersState(f); setPage(1); };

  // Bấm sang trang khác → hiện NGAY từ tin đầu tiên của trang đó (nhảy thẳng lên
  // đầu danh sách, không phải cuộn tay). Áp dụng cho mọi danh sách phân trang.
  const goPage = (p: number) => { setPage(p); window.scrollTo({ top: 0 }); };

  // Nguồn tin theo đúng MỤC ĐÍCH của trang (bán / thuê)
  const base = useMemo(
    () => items.filter((l) => (l.purpose ?? "ban") === purpose),
    [items, purpose],
  );

  const results = useMemo(
    () => sortListings(applyFilters(base, filters), sort),
    [base, filters, sort],
  );

  // Số tin theo tỉnh/thành (cho sidebar "theo khu vực" — giống Homedy)
  const provinces = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of base) {
      const p = l.location.split(",").pop()?.trim() ?? "";
      if (p) m.set(p, (m.get(p) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [base]);

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageItems = results.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const active = hasActiveFilters(filters);

  return (
    // PC: thanh lọc nằm SÁT header, không chừa khoảng trống (file V3 10.08.2026).
    <div className={nested ? "pb-20 pt-1 sm:pt-6" : "mx-auto max-w-7xl px-4 pb-20 pt-1 sm:px-6 sm:pt-2 lg:px-8"}>
      {/* ── Phần trên kiểu Homedy (gọn): thanh lọc → tiêu đề + bộ đếm.
           Trang cấp 1 KHÔNG dùng breadcrumb (menu đã chỉ vị trí — chuẩn Apple). ── */}
      <div>
        <FilterBar
          value={filters}
          onChange={setFilters}
          purpose={purpose}
        />
      </div>

      {/* Chip bộ lọc đang áp dụng */}
      {active && (
        <div className="mt-3">
          <ActiveFilters value={filters} onChange={setFilters} />
        </div>
      )}

      {/* Tiêu đề + bộ đếm nhảy theo bộ lọc — câu đếm TẠM ẨN trên mobile (theo yêu cầu) */}
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">{heading}</h1>
      <p className="mt-1 hidden text-sm text-cvr-muted sm:block">
        Hiện có <span className="font-semibold text-cvr-ink">{results.length}</span> bất động sản{active ? " phù hợp " : " "}tại Đà Nẵng, Huế &amp; Miền Trung.
      </p>

      {/* Hàng điều khiển dùng chung: xoá lọc · chế độ xem (Danh sách/Lưới/Bản đồ) · sắp xếp.
          Trên mobile TẠM ẨN chế độ xem + sắp xếp (theo yêu cầu), giữ nút Xoá lọc. */}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-3 sm:mt-4">
              {active && (
                <button
                  type="button"
                  onClick={() => setFilters(emptyFilters())}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cvr-line px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Xoá lọc
                </button>
              )}
              <div className="hidden sm:block">
                <ViewToggle view={view} setView={setView} />
              </div>
              <select
                aria-label="Sắp xếp"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="hidden h-9 rounded-lg border border-cvr-line bg-white px-3 text-xs text-cvr-ink outline-none transition focus:border-cvr-ink sm:block"
              >
                {relevance && <option value="lien-quan">Liên quan nhất</option>}
                <option value="moi">Mới nhất</option>
                <option value="gia-tang">Giá thấp → cao</option>
                <option value="gia-giam">Giá cao → thấp</option>
                <option value="dt-giam">Diện tích lớn nhất</option>
                {purpose === "ban" && <option value="gia-m2">Giá/m² thấp nhất</option>}
              </select>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* CỘT TRÁI: danh sách tin */}
        <div className="lg:col-span-2">
          {pageItems.length > 0 ? (
            <>
              {/* MOBILE (< 640px): LUÔN thẻ dọc — ảnh trên, nội dung dưới (thuần CSS,
                  không phụ thuộc JS → chắc chắn đúng trên mọi máy) */}
              <div className="reveal is-visible cards-stagger grid grid-cols-1 gap-5 sm:hidden">
                {pageItems.map((item) => (
                  <PropertyCard key={item.id} item={item} layout="grid" showTime />
                ))}
              </div>
              {/* DESKTOP (≥ 640px): theo chế độ xem đã chọn (Danh sách = thẻ ngang · Lưới = thẻ dọc) */}
              <div
                className={`reveal is-visible cards-stagger hidden ${
                  view === "list"
                    ? "sm:flex sm:flex-col sm:gap-4"
                    : "sm:grid sm:grid-cols-2 sm:gap-5"
                }`}
              >
                {pageItems.map((item) => (
                  <PropertyCard key={item.id} item={item} layout={view} showTime />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-1.5">
                  <button type="button" disabled={current === 1} onClick={() => goPage(current - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30">‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} type="button" onClick={() => goPage(p)} className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${p === current ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"}`}>{p}</button>
                  ))}
                  <button type="button" disabled={current === totalPages} onClick={() => goPage(current + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30">›</button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-cvr-line py-20 text-center">
              <p className="text-cvr-body">Không tìm thấy bất động sản phù hợp.</p>
              <button type="button" onClick={() => setFilters(emptyFilters())} className="mt-5 rounded-lg bg-cvr-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-body">Xoá bộ lọc</button>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: sidebar lọc nhanh */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-5">
            {/* Lọc theo khoảng giá — mua bán = tỷ · cho thuê = triệu/tháng */}
            <SidebarFilter title={purpose === "thue" ? "Lọc theo giá thuê (tháng)" : "Lọc theo khoảng giá"}>
              {priceRangesFor(purpose).map((r) => {
                const on = filters.priceMin === r.min && filters.priceMax === r.max;
                return (
                  <SidebarLink
                    key={r.label}
                    active={on}
                    onClick={() => setFilters(on
                      ? { ...filters, priceMin: null, priceMax: null }
                      : { ...filters, priceMin: r.min, priceMax: r.max })}
                  >
                    {r.label}
                  </SidebarLink>
                );
              })}
            </SidebarFilter>

            {/* Lọc theo diện tích */}
            <SidebarFilter title="Lọc theo diện tích">
              {areaRanges.map((r) => {
                const on = filters.areaMin === r.min && filters.areaMax === r.max;
                return (
                  <SidebarLink
                    key={r.label}
                    active={on}
                    onClick={() => setFilters(on
                      ? { ...filters, areaMin: null, areaMax: null }
                      : { ...filters, areaMin: r.min, areaMax: r.max })}
                  >
                    {r.label}
                  </SidebarLink>
                );
              })}
            </SidebarFilter>

            {/* Bất động sản theo khu vực */}
            <SidebarFilter title={`${heading} theo khu vực`}>
              {provinces.map(([prov, count]) => {
                const on = filters.locations.some((l) => l.province === prov && !l.district && !l.ward);
                return (
                  <SidebarLink
                    key={prov}
                    active={on}
                    count={count}
                    onClick={() => setFilters(on
                      ? { ...filters, locations: filters.locations.filter((l) => !(l.province === prov && !l.district && !l.ward)) }
                      : { ...filters, locations: [...filters.locations, { province: prov }] })}
                  >
                    {prov}
                  </SidebarLink>
                );
              })}
            </SidebarFilter>

            {/* Bài viết được quan tâm — CÙNG kiểu với cột phải trang Tin tức */}
            {articles.length > 0 && (
              <div className="rounded-none border border-cvr-line bg-white p-4 shadow-lux">
                <p className="mb-1 text-sm font-semibold text-cvr-ink">Bài viết được quan tâm</p>
                <div className="flex flex-col divide-y divide-cvr-line/70">
                  {articles.slice(0, 5).map((a, i) => (
                    <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex gap-3 py-2.5 last:pb-0">
                      <span className="w-5 shrink-0 text-lg font-semibold leading-snug text-cvr-faint">{i + 1}</span>
                      <span className="line-clamp-2 text-[13px] font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                        {a.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}

// ── Sidebar lọc nhanh (giống .product-right của Homedy) ──────────────────────
function SidebarFilter({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-none border border-cvr-line bg-white p-4 shadow-lux">
      <p className="mb-2.5 text-sm font-semibold text-cvr-ink">{title}</p>
      <ul className="grid grid-cols-2 gap-1.5">{children}</ul>
    </div>
  );
}

function SidebarLink({ active, onClick, count, children }: { active: boolean; onClick: () => void; count?: number; children: React.ReactNode }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-center text-[12px] transition ${
          active
            ? "border-cvr-ink bg-cvr-ink font-semibold text-white"
            : "border-cvr-line bg-cvr-surface text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
        }`}
      >
        <span className="truncate">{children}</span>
        {count != null && (
          <span className={active ? "text-white/70" : "text-cvr-faint"}>({count})</span>
        )}
      </button>
    </li>
  );
}

// Nút chuyển chế độ xem Danh sách / Lưới
export function ViewToggle({
  view,
  setView,
}: {
  view: "list" | "grid";
  setView: (v: "list" | "grid") => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-cvr-line bg-white p-0.5">
      <button
        type="button"
        aria-label="Xem dạng danh sách"
        aria-pressed={view === "list"}
        onClick={() => setView("list")}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${view === "list" ? "bg-cvr-ink text-white" : "text-cvr-muted hover:text-cvr-ink"}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <button
        type="button"
        aria-label="Xem dạng lưới"
        aria-pressed={view === "grid"}
        onClick={() => setView("grid")}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${view === "grid" ? "bg-cvr-ink text-white" : "text-cvr-muted hover:text-cvr-ink"}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 15h6v4H4v-4zm10 0h6v4h-6v-4z" /></svg>
      </button>
    </div>
  );
}
