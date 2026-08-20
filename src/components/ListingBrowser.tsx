"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Bản đồ chỉ chạy phía trình duyệt (Leaflet đụng tới window) → nạp động, tắt SSR.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-cvr-muted">Đang tải bản đồ…</div>,
});
import PropertyCard from "@/components/PropertyCard";
import FilterBar from "@/components/FilterBar";
import ActiveFilters from "@/components/ActiveFilters";
import { featuredListings, type Article, type Listing } from "@/lib/data";
import {
  sortListings,
  filtersFromParams,
  emptyFilters,
  hasActiveFilters,
  priceRangesFor,
  areaRanges,
  type Filters,
  type SortKey,
} from "@/lib/filters";
import { smartFilter, smartSearch, TIER_LABEL } from "@/lib/smartSearch";

const PER_PAGE = 8;

export default function ListingBrowser({
  heading,
  purpose = "ban",
  items = featuredListings,
  articles = [],
  relevance = false,
  nested = false,
  initialTypes,
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
  // Trang DANH MỤC (/mua-ban/can-ho-chung-cu…): mở sẵn đúng loại hình của danh mục.
  // Khách vẫn bỏ chọn / đổi lọc bình thường — đây chỉ là giá trị khởi đầu.
  initialTypes?: string[];
}) {
  const params = useSearchParams();

  const [filters, setFiltersState] = useState<Filters>(() => {
    const f = filtersFromParams(params);
    // Địa chỉ chưa chỉ định loại hình → lấy loại hình của danh mục đang xem
    if (initialTypes?.length && !f.types.length) f.types = [...initialTypes];
    return f;
  });
  const [sort, setSort] = useState<SortKey>(relevance ? "lien-quan" : "moi");
  const [view, setView] = useState<"list" | "grid">("list");
  // Chế độ BẢN ĐỒ (kiểu Batdongsan): bật là cả trang chuyển sang xem bản đồ,
  // marker chạy theo đúng bộ lọc đang áp dụng.
  const [mapMode, setMapMode] = useState(false);
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

  // NỚI LỎNG THÔNG MINH: chọn lọc quá chặt cũng không ra màn hình trống —
  // tin khớp đủ lên đầu (Tầng 1), thiếu tiêu chí phụ xuống Tầng 2/3 kèm nhãn.
  const hits = useMemo(() => smartFilter(base, { ...filters, keyword: "" }), [base, filters]);
  // Từ khoá gõ tay xử lý bằng lõi tìm kiếm thông minh (bóc tách câu dài)
  const search = useMemo(() => smartSearch(hits.map((h) => h.item), filters.keyword), [hits, filters.keyword]);
  const coTuKhoa = filters.keyword.trim().length > 0;

  const results = useMemo(
    () => (coTuKhoa ? search.hits.map((h) => h.item) : sortListings(hits.map((h) => h.item), sort)),
    [coTuKhoa, search, hits, sort],
  );
  // Tầng của từng tin + chữ cần bôi đậm
  const tierById = useMemo(() => new Map(hits.map((h) => [h.item.id, h.tier])), [hits]);
  const termsById = useMemo(() => new Map(search.hits.map((h) => [h.item.id, h.matched])), [search]);

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
    <div className={nested ? "pb-20 pt-1 sm:pt-6" : "mx-auto max-w-7xl px-4 pb-20 pt-0 sm:px-6 sm:pt-0 lg:px-8"}>
      {/* ── Phần trên kiểu Homedy (gọn): thanh lọc → tiêu đề + bộ đếm.
           Trang cấp 1 KHÔNG dùng breadcrumb (menu đã chỉ vị trí — chuẩn Apple). ── */}
      <div>
        <FilterBar
          value={filters}
          onChange={setFilters}
          purpose={purpose}
          onMap={() => setMapMode((v) => !v)}
          mapActive={mapMode}
        />
      </div>

      {/* Chip bộ lọc đang áp dụng */}
      {active && (
        <div className="mt-3">
          <ActiveFilters value={filters} onChange={setFilters} />
        </div>
      )}

      {/* TIÊU ĐỀ và HÀNG ĐIỀU KHIỂN nằm CÙNG MỘT HÀNG (tiêu đề trái · chế độ xem +
          sắp xếp phải) — trước đây điều khiển chiếm riêng một hàng, chừa một dải
          trống ngang giữa tiêu đề và danh sách tin. */}
      {/* id="ket-qua": mốc để bấm Tìm / Enter / chọn gợi ý là CUỘN THẲNG xuống đây,
          khách thấy trang chạy ngay cả khi kết quả không đổi. scroll-mt bù header. */}
      <div id="ket-qua" className="mt-4 flex scroll-mt-20 flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:scroll-mt-24">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">{heading}</h1>
          {/* Câu đếm TẠM ẨN trên mobile (theo yêu cầu) */}
          <p className="mt-1 hidden text-sm text-cvr-muted sm:block">
            Hiện có <span className="font-semibold text-cvr-ink">{results.length}</span> bất động sản{active ? " phù hợp " : " "}tại Đà Nẵng, Huế &amp; Miền Trung.
          </p>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              {/* XEM BẢN ĐỒ — CHỈ mobile. Trên PC nút này nằm NGAY CẠNH ô tìm kiếm
                  (do FilterBar dựng, đúng bố cục Batdongsan) nên ở đây ẩn đi. */}
              <button
                type="button"
                onClick={() => setMapMode((v) => !v)}
                aria-pressed={mapMode}
                className={`mr-auto inline-flex min-h-[38px] items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition sm:hidden ${
                  mapMode
                    ? "bg-cvr-ink text-white"
                    : "border border-cvr-line bg-white text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5l6 2.4 5-2.4v14.4l-5 2.4-6-2.4-5 2.4V4.9l5-2.4v16.8" />
                </svg>
                {mapMode ? "Xem danh sách" : "Xem bản đồ"}
              </button>
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
      </div>

      {/* ═══ CHẾ ĐỘ BẢN ĐỒ ═══ marker là viên GIÁ, bấm ra thẻ mini dẫn tới tin.
          Bấm "Xem danh sách" để quay lại. */}
      {mapMode && (
        <div className="mt-4 overflow-hidden rounded-xl border border-cvr-line">
          <div className="h-[62vh] min-h-[380px] w-full">
            <MapView items={results} />
          </div>
          <p className="border-t border-cvr-line bg-cvr-surface px-3 py-2 text-xs text-cvr-muted">
            Đang hiện <span className="font-semibold text-cvr-ink">{results.length}</span> bất động sản theo bộ lọc.
            Bấm vào viên giá để xem nhanh tin.
          </p>
        </div>
      )}

      <div className={`mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3 ${mapMode ? "hidden" : ""}`}>

        {/* CỘT TRÁI: danh sách tin */}
        <div className="lg:col-span-2">
          {pageItems.length > 0 ? (
            <>
              {/* Nhãn TẦNG kết quả — cho biết nhóm tin đang xem khớp tới đâu */}
              {(active || coTuKhoa) && (() => {
                const t = tierById.get(pageItems[0].id) ?? 1;
                return t === 1 ? null : <p className="mb-3 text-sm font-medium text-cvr-body">{TIER_LABEL[t]}</p>;
              })()}
              {/* MOBILE (< 640px): LUÔN thẻ dọc — ảnh trên, nội dung dưới (thuần CSS,
                  không phụ thuộc JS → chắc chắn đúng trên mọi máy) */}
              <div className="reveal is-visible cards-stagger grid grid-cols-1 gap-5 sm:hidden">
                {pageItems.map((item) => (
                  <PropertyCard key={item.id} item={item} layout="grid" showTime terms={termsById.get(item.id) ?? []} />
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
                  <PropertyCard key={item.id} item={item} layout={view} showTime terms={termsById.get(item.id) ?? []} />
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
          {/* Cột phải DÍNH CỐ ĐỊNH khi cuộn, cao hơn màn hình thì cuộn trong khung */}
          <div className="no-scrollbar sticky top-20 max-h-[calc(100vh-6rem)] space-y-5 overflow-y-auto">
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
