"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import FilterBar from "@/components/FilterBar";
import ActiveFilters from "@/components/ActiveFilters";
import { featuredListings, type Listing } from "@/lib/data";
import {
  applyFilters,
  sortListings,
  filtersFromParams,
  emptyFilters,
  hasActiveFilters,
  type Filters,
  type SortKey,
} from "@/lib/filters";

const PER_PAGE = 8; // mỗi trang 8 tin (giống danh sách /mua-ban)

// Trang kết quả tìm kiếm chung (đích của ô tìm kiếm ở Hero + nút "Xem thêm" trang chủ).
// Dùng HỆ LỌC THÔNG MINH chung với /mua-ban, /cho-thue:
//   • KHÔNG giới hạn khu vực — FilterBar phủ toàn bộ Tỉnh/Quận/Phường.
//   • Từ khoá khớp không phân biệt dấu + sửa lỗi gõ (applyFilters → normalizeVi).
//   • Hiểu đúng tham số từ Hero: tinh/quan/phuong, loai (nhiều loại), giaMin/giaMax,
//     dtMin/dtMax, pn, huong, q, mode.
// items: tin THẬT từ Supabase (server truyền xuống). Không truyền → dữ liệu mẫu.
export default function SearchClient({ items = featuredListings }: { items?: Listing[] }) {
  const params = useSearchParams();
  const mode = params.get("mode") ?? "";
  // Tab đã chọn ở Hero → danh mục loại hình + nguồn tin theo mục đích.
  const purpose: "ban" | "thue" = mode === "Cho thuê" ? "thue" : "ban";

  const [filters, setFilters] = useState<Filters>(() => filtersFromParams(params));
  const [sort, setSort] = useState<SortKey>("moi");
  const [page, setPage] = useState(1);
  // Đổi bộ lọc / sắp xếp → luôn quay về trang 1
  const changeFilters = (f: Filters) => { setFilters(f); setPage(1); };
  const changeSort = (s: SortKey) => { setSort(s); setPage(1); };

  // Nguồn tin theo mục đích (bán/thuê) — giá bán tính TỶ, giá thuê tính TRIỆU/THÁNG
  // nên tách riêng để lọc giá đúng đơn vị. Trong mỗi mục đích: KHÔNG giới hạn khu vực.
  const base = useMemo(
    () => items.filter((l) => (l.purpose ?? "ban") === purpose),
    [items, purpose],
  );

  const results = useMemo(
    () => sortListings(applyFilters(base, filters), sort),
    [base, filters, sort],
  );
  const active = hasActiveFilters(filters);

  // Phân trang: 8 tin/trang, kẹp trang hiện tại trong [1, totalPages]
  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageItems = results.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Tìm kiếm bất động sản</h1>
      <p className="mt-1.5 text-sm text-cvr-muted">
        Không giới hạn khu vực — gõ khu vực, dự án hay loại hình bất động sản đều ra kết quả.
      </p>

      {/* Thanh lọc thông minh (dùng chung với /mua-ban, /cho-thue) */}
      <div className="mt-5">
        <FilterBar value={filters} onChange={changeFilters} purpose={purpose} />
      </div>

      {/* Chip bộ lọc đang áp dụng */}
      {active && (
        <div className="mt-3">
          <ActiveFilters value={filters} onChange={changeFilters} />
        </div>
      )}

      {/* Tổng kết + sắp xếp + xoá lọc */}
      <div className="mb-5 mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-cvr-body">
          <span className="font-bold text-cvr-ink">{results.length}</span> bất động sản{active ? " phù hợp" : ""}
        </p>
        <div className="flex items-center gap-3">
          {active && (
            <button
              type="button"
              onClick={() => changeFilters(emptyFilters())}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cvr-line px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Xoá lọc
            </button>
          )}
          <select
            aria-label="Sắp xếp"
            value={sort}
            onChange={(e) => changeSort(e.target.value as SortKey)}
            className="h-9 rounded-lg border border-cvr-line bg-white px-3 text-xs text-cvr-ink outline-none transition focus:border-cvr-ink"
          >
            <option value="moi">Mới nhất</option>
            <option value="gia-tang">Giá thấp → cao</option>
            <option value="gia-giam">Giá cao → thấp</option>
            <option value="dt-giam">Diện tích lớn nhất</option>
            {purpose === "ban" && <option value="gia-m2">Giá/m² thấp nhất</option>}
          </select>
        </div>
      </div>

      {/* Kết quả — 8 tin/trang, có phân trang 1,2,3… */}
      {results.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((item) => (
              <PropertyCard key={item.id} item={item} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} type="button" onClick={() => setPage(p)} className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${p === current ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"}`}>{p}</button>
              ))}
              <button type="button" disabled={current === totalPages} onClick={() => setPage(current + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30">›</button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-cvr-line py-20 text-center">
          <svg className="mb-4 h-12 w-12 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <p className="text-cvr-body">Không tìm thấy bất động sản phù hợp.</p>
          <p className="mt-1 text-sm text-cvr-muted">Thử nới rộng bộ lọc hoặc xoá bớt từ khoá.</p>
          <button
            type="button"
            onClick={() => changeFilters(emptyFilters())}
            className="mt-5 rounded-lg bg-cvr-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-body"
          >
            Xoá bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
