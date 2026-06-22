"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import FilterBar from "@/components/FilterBar";
import ActiveFilters from "@/components/ActiveFilters";
import { featuredListings } from "@/lib/data";
import {
  applyFilters,
  sortListings,
  filtersFromParams,
  emptyFilters,
  hasActiveFilters,
  type Filters,
  type SortKey,
} from "@/lib/filters";

const PER_PAGE = 8;

export default function ListingBrowser({
  heading,
  subheading,
}: {
  heading: string;
  subheading: string;
}) {
  const params = useSearchParams();

  const [filters, setFiltersState] = useState<Filters>(() => filtersFromParams(params));
  const [sort, setSort] = useState<SortKey>("moi");
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);

  // Đổi bộ lọc → luôn quay về trang 1
  const setFilters = (f: Filters) => { setFiltersState(f); setPage(1); };

  const results = useMemo(
    () => sortListings(applyFilters(featuredListings, filters), sort),
    [filters, sort],
  );

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageItems = results.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const active = hasActiveFilters(filters);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-white/40">
        <a href="/" className="hover:text-white/70">Trang chủ</a>
        <span>/</span>
        <span className="text-white/70">{heading}</span>
      </nav>

      <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">{heading}</h1>
      <p className="mt-1.5 text-sm text-white/55">{subheading}</p>

      {/* Thanh lọc Homedy-style */}
      <div className="mt-5">
        <FilterBar value={filters} onChange={setFilters} />
      </div>

      {/* Chip bộ lọc đang áp dụng */}
      {active && (
        <div className="mt-3">
          <ActiveFilters value={filters} onChange={setFilters} />
        </div>
      )}

      {/* Tổng kết + sắp xếp */}
      <div className="mb-5 mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/70">
          <span className="font-bold text-white">{results.length}</span> bất động sản{active ? " phù hợp" : ""}
        </p>
        <div className="flex items-center gap-3">
          {active && (
            <button
              type="button"
              onClick={() => setFilters(emptyFilters())}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/35 hover:text-white"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Xoá lọc
            </button>
          )}
          <ViewToggle view={view} setView={setView} />
          <select
            aria-label="Sắp xếp"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white outline-none transition focus:border-white/40"
          >
            <option value="moi">Mới nhất</option>
            <option value="gia-tang">Giá thấp → cao</option>
            <option value="gia-giam">Giá cao → thấp</option>
            <option value="dt-giam">Diện tích lớn nhất</option>
          </select>
        </div>
      </div>

      {/* Kết quả */}
      {pageItems.length > 0 ? (
        <>
          <div
            className={
              view === "list"
                ? "flex flex-col gap-4"
                : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }
          >
            {pageItems.map((item) => <PropertyCard key={item.id} item={item} layout={view} />)}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} type="button" onClick={() => setPage(p)} className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${p === current ? "bg-white text-cl-ink" : "border border-white/15 text-white/70 hover:border-white/40 hover:text-white"}`}>{p}</button>
              ))}
              <button type="button" disabled={current === totalPages} onClick={() => setPage(current + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">›</button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-20 text-center">
          <p className="text-white/70">Không tìm thấy bất động sản phù hợp.</p>
          <button type="button" onClick={() => setFilters(emptyFilters())} className="mt-5 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-cl-ink transition hover:bg-white/90">Xoá bộ lọc</button>
        </div>
      )}
    </div>
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
    <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
      <button
        type="button"
        aria-label="Xem dạng danh sách"
        aria-pressed={view === "list"}
        onClick={() => setView("list")}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${view === "list" ? "bg-cl-gold text-cl-ink" : "text-white/55 hover:text-white"}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <button
        type="button"
        aria-label="Xem dạng lưới"
        aria-pressed={view === "grid"}
        onClick={() => setView("grid")}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${view === "grid" ? "bg-cl-gold text-cl-ink" : "text-white/55 hover:text-white"}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 15h6v4H4v-4zm10 0h6v4h-6v-4z" /></svg>
      </button>
    </div>
  );
}
