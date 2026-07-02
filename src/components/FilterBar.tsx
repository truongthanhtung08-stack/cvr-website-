"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FilterDropdown, { PanelActions, FilterDropdownGroup } from "@/components/FilterDropdown";
import { provinceNames, districtsOf, wardsOf } from "@/lib/locations";
import {
  typeGroupsFor,
  priceRangesFor,
  areaRanges,
  bedroomOptions,
  directionOptions,
  priceRangeText,
  areaRangeText,
  emptyFilters,
  normalizeVi,
  type Filters,
} from "@/lib/filters";
import { suggest, popularSuggestions, type Suggestion, type SuggestKind } from "@/lib/suggest";

const RECENT_KEY = "cvr-recent-search"; // lịch sử tìm kiếm (localStorage)

// Icon (path d) cho từng nhóm gợi ý.
const SUGGEST_ICON: Record<SuggestKind, string> = {
  "Khu vực": "M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  "Loại hình": "M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 014 9V4a1 1 0 011-1z",
  "Sản phẩm": "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  "Dự án": "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-14h.01M11 7h.01M7 11h.01M11 11h.01M7 15h.01M11 15h.01",
  "Tin tức": "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 0a2 2 0 012 2v9a2 2 0 11-4 0V9a2 2 0 012-2zM5 12h6m-6 4h6m-6-8h6",
};

// Thanh lọc kiểu Homedy — fully controlled qua props value/onChange.
export default function FilterBar({
  value,
  onChange,
  onSearch,
  onMap,
  compact = false,
  leading,
  purpose = "ban",
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  onSearch?: () => void;
  // Bấm "Bản đồ" — mở chế độ bản đồ (vd: chuyển sang /tim-kiem dạng bản đồ).
  onMap?: () => void;
  compact?: boolean;
  // Nội dung đứng đầu dòng 1 (vd: tab Mua bán/Cho thuê/Dự án) — chỉ dùng ở chế độ compact.
  leading?: React.ReactNode;
  // Mục đích trang → danh mục loại hình tương ứng (mua bán vs cho thuê).
  purpose?: "ban" | "thue";
}) {
  const f = value;
  // Danh mục loại hình theo đúng mục đích trang
  const typeGroups = typeGroupsFor(purpose);
  const typeOptions = typeGroups.flatMap((g) => g.items);
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });
  const hh = compact ? "h-8" : "h-11"; // chiều cao ô (gọn hết cỡ khi đặt trên Hero)

  // Autocomplete đa tầng: Khu vực · Loại hình · Sản phẩm · Dự án · Tin tức.
  // Khi chạm vào ô (chưa gõ) → hiện Lịch sử + Gợi ý phổ biến (mô hình Homedy).
  const router = useRouter();
  const [sugOpen, setSugOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState<Suggestion[]>([]);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(r)) setRecent(r);
    } catch { /* bỏ qua localStorage lỗi */ }
  }, []);

  const pushRecent = (s: Suggestion) => {
    setRecent((prev) => {
      const next = [s, ...prev.filter((x) => x.label !== s.label)].slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };
  const clearRecent = () => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* noop */ }
  };

  const typed = f.keyword.trim().length > 0;
  // Panel: đang gõ → kết quả khớp; chưa gõ → lịch sử + phổ biến.
  const panelItems: Suggestion[] = typed ? suggest(f.keyword, 8) : [...recent, ...popularSuggestions];

  const applySuggestion = (s: Suggestion) => {
    pushRecent(s);
    if (s.kind === "Khu vực") {
      set({ province: s.province ?? "", district: s.district ?? "", ward: s.ward ?? "", keyword: "" });
    } else if (s.kind === "Loại hình" && s.type) {
      set({ types: f.types.includes(s.type) ? f.types : [...f.types, s.type], keyword: "" });
    } else if (s.href) {
      router.push(s.href); // Sản phẩm / Dự án / Tin tức → trang chi tiết
    } else if (s.keyword) {
      set({ keyword: s.keyword });
    }
    setSugOpen(false);
    setActiveIdx(-1);
  };

  // Điều hướng bằng phím trong panel gợi ý.
  const onKeyNav = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!sugOpen) { setSugOpen(true); return; }
      setActiveIdx((i) => Math.min(i + 1, panelItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (sugOpen && activeIdx >= 0 && panelItems[activeIdx]) {
        e.preventDefault();
        applySuggestion(panelItems[activeIdx]);
      } else {
        setSugOpen(false);
        onSearch?.();
      }
    } else if (e.key === "Escape") {
      setSugOpen(false);
      setActiveIdx(-1);
    }
  };


  const areaLabel = areaRangeText(f.areaMin, f.areaMax);
  const priceLabel = priceRangeText(f.priceMin, f.priceMax);
  const locLabel = f.ward || f.district || f.province;
  const typeLabel =
    f.types.length === 0 ? "" : f.types.length === 1 ? f.types[0] : `${f.types.length} loại hình`;
  const moreCount = (f.beds ? 1 : 0) + (f.direction ? 1 : 0);

  // Compact: mỗi ô lọc rộng vừa đúng nội dung (hiện đủ chữ, không cắt).
  const ddClass = compact ? "shrink-0" : "lg:flex-1 lg:min-w-0";

  // ===== Nhóm dropdown (dùng chung cho cả 2 layout) =====
  const dropdowns = (
    <>
      {/* Khu vực — danh sách bấm chọn + lọc nhanh + breadcrumb (kiểu Homedy) */}
      <FilterDropdown label="Khu vực" summary={locLabel} active={!!locLabel} panelClassName="w-72" compact={compact} className={ddClass}>
        {() => (
          <LocationPanel
            province={f.province}
            district={f.district}
            ward={f.ward}
            onChange={(patch) => set(patch)}
          />
        )}
      </FilterDropdown>

      {/* Loại nhà đất — gom nhóm + chọn tất cả (kiểu Homedy) */}
      <FilterDropdown label="Loại nhà đất" summary={typeLabel} active={f.types.length > 0} panelClassName="w-72" compact={compact} className={ddClass}>
        {() => {
          const allChecked = typeOptions.every((t) => f.types.includes(t));
          return (
            <div>
              {/* Chọn tất cả */}
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-cvr-ink transition hover:bg-black/5">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={() => set({ types: allChecked ? [] : [...typeOptions] })}
                  className="h-4 w-4 shrink-0 accent-cvr-ink"
                />
                <span>Tất cả loại nhà đất</span>
              </label>

              <div className="mt-1 max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {typeGroups.map((g) => (
                  <div key={g.label}>
                    <p className="px-2 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-cvr-faint">{g.label}</p>
                    {g.items.map((t) => {
                      const checked = f.types.includes(t);
                      return (
                        <label
                          key={t}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-cvr-ink/80 transition hover:bg-black/5"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              set({ types: checked ? f.types.filter((x) => x !== t) : [...f.types, t] })
                            }
                            className="h-4 w-4 shrink-0 accent-cvr-ink"
                          />
                          <span className="truncate">{t}</span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>

              {f.types.length > 0 && (
                <button
                  type="button"
                  onClick={() => set({ types: [] })}
                  className="mt-2 border-t border-cvr-line pt-2 text-xs font-medium text-cvr-muted transition hover:text-cvr-ink"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>
          );
        }}
      </FilterDropdown>

      {/* Mức giá */}
      <FilterDropdown label="Mức giá" summary={priceLabel} active={f.priceMin != null || f.priceMax != null} panelClassName="w-80" compact={compact} className={ddClass}>
        {({ close }) => (
          <RangePanel
            unit="tỷ"
            step={0.5}
            sliderMax={50}
            min={f.priceMin}
            max={f.priceMax}
            presets={priceRangesFor(purpose)}
            onPick={(min, max) => set({ priceMin: min, priceMax: max })}
            onReset={() => set({ priceMin: null, priceMax: null })}
            onApply={close}
          />
        )}
      </FilterDropdown>

      {/* Diện tích */}
      <FilterDropdown label="Diện tích" summary={areaLabel} active={f.areaMin != null || f.areaMax != null} panelClassName="w-80" compact={compact} className={ddClass}>
        {({ close }) => (
          <RangePanel
            unit="m²"
            step={10}
            sliderMax={500}
            min={f.areaMin}
            max={f.areaMax}
            presets={areaRanges}
            onPick={(min, max) => set({ areaMin: min, areaMax: max })}
            onReset={() => set({ areaMin: null, areaMax: null })}
            onApply={close}
          />
        )}
      </FilterDropdown>

      {/* Lọc thêm: phòng ngủ + hướng */}
      <FilterDropdown
        label="Lọc thêm"
        summary={moreCount ? `Lọc thêm (${moreCount})` : ""}
        active={moreCount > 0}
        panelClassName="w-80"
        className={ddClass}
        align="right"
        compact={compact}
      >
        {({ close }) => (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Số phòng ngủ</p>
              <div className="flex flex-wrap gap-1.5">
                {bedroomOptions.map((n) => (
                  <Chip key={n} active={f.beds === n} onClick={() => set({ beds: f.beds === n ? 0 : n })}>
                    {n === 5 ? "5+ PN" : `${n} PN`}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Hướng nhà</p>
              <div className="flex flex-wrap gap-1.5">
                {directionOptions.map((d) => (
                  <Chip key={d} active={f.direction === d} onClick={() => set({ direction: f.direction === d ? "" : d })}>
                    {d}
                  </Chip>
                ))}
              </div>
            </div>
            <PanelActions onReset={() => set({ beds: 0, direction: "" })} onApply={close} />
          </div>
        )}
      </FilterDropdown>
    </>
  );

  // ===== Ô từ khoá + nút tìm kiếm (dùng chung) =====
  const searchBox = (
    <div className={compact ? "flex min-w-[360px] flex-1 gap-2" : "flex gap-2 lg:w-72 xl:w-80"}>
      <div className="relative flex-1">
        <svg className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${compact ? "text-white/55" : "text-cvr-faint"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
        <input
          type="text"
          value={f.keyword}
          onChange={(e) => { set({ keyword: e.target.value }); setSugOpen(true); setActiveIdx(-1); }}
          onFocus={() => setSugOpen(true)}
          onBlur={() => setTimeout(() => setSugOpen(false), 150)}
          onKeyDown={onKeyNav}
          placeholder="Bán chung cư tại Đà Nẵng 2 phòng ngủ"
          aria-label="Tìm theo từ khoá, khu vực, loại hình, dự án, tin"
          autoComplete="off"
          role="combobox"
          aria-expanded={sugOpen}
          className={`${hh} w-full rounded-lg border pl-9 pr-3 text-sm outline-none transition ${
            compact
              ? "border-white/15 bg-white/10 text-white placeholder-white/40 placeholder:italic focus:border-white/45 focus:bg-white/15"
              : "border-black/12 bg-black/[0.03] text-cvr-ink placeholder-cvr-faint focus:border-cvr-ink/40 focus:bg-black/[0.05]"
          }`}
        />
        {sugOpen && panelItems.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-[120] mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-cvr-line bg-white p-1.5 shadow-2xl shadow-black/20 ring-1 ring-inset ring-black/5">
            {panelItems.map((s, i) => {
              const header = !typed
                ? i === 0 && recent.length > 0 ? "recent" : i === recent.length ? "popular" : ""
                : "";
              return (
                <div key={`${s.label}-${i}`}>
                  {header === "recent" && (
                    <div className="flex items-center justify-between px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-cvr-faint">
                      <span>Tìm kiếm gần đây</span>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={clearRecent} className="font-medium normal-case text-cvr-muted transition hover:text-cvr-ink">Xoá</button>
                    </div>
                  )}
                  {header === "popular" && (
                    <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-cvr-faint">Gợi ý phổ biến</div>
                  )}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => applySuggestion(s)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
                      i === activeIdx ? "bg-black/[0.06] text-cvr-ink" : "text-cvr-ink/85 hover:bg-black/5"
                    }`}
                  >
                    <svg className="h-4 w-4 shrink-0 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={SUGGEST_ICON[s.kind]} />
                    </svg>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{s.label}</span>
                      {s.sub && <span className="truncate text-[11px] text-cvr-faint">{s.sub}</span>}
                    </span>
                    <span className="shrink-0 text-[11px] text-cvr-faint">{s.kind}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {onSearch && (
        <button
          type="button"
          onClick={onSearch}
          aria-label="Tìm kiếm"
          className={`flex ${hh} shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition active:scale-95 ${
            compact ? "w-8 bg-white text-cvr-ink hover:bg-white/90" : "bg-cvr-ink px-6 text-white hover:bg-cvr-ink/90"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          {!compact && "Tìm kiếm"}
        </button>
      )}
    </div>
  );

  // Compact (Hero): gọn hết mức — ĐÚNG 2 dòng.
  // Dòng 1 = menu (tab) + ô tìm kiếm từ khoá; dòng 2 = các ô lọc (rộng bằng nhau).
  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        {/* Dòng 1: tab (menu) — vạch ngăn cách biệt — ô từ khoá — Bản đồ */}
        <div className="flex flex-wrap items-center gap-2">
          {leading}
          {leading && <span aria-hidden className="mx-1 h-5 w-px shrink-0 self-center bg-white/20" />}
          {searchBox}
          <button
            type="button"
            onClick={onMap}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 text-sm font-medium text-white/85 transition hover:border-white/35 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Bản đồ
          </button>
        </div>
        {/* Dòng 2: các ô lọc (rộng vừa đủ chữ) — Đặt lại ở cuối */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdownGroup>{dropdowns}</FilterDropdownGroup>
          <button
            type="button"
            onClick={() => onChange(emptyFilters())}
            className="ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 text-sm font-medium text-white/85 transition hover:border-white/35 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Đặt lại
          </button>
        </div>
      </div>
    );
  }

  // Mặc định (trang tìm kiếm): dropdown chiếm phần lớn, ô tìm bên phải.
  return (
    <div className="rounded-2xl border border-cvr-line bg-black/[0.02] p-2.5 shadow-xl shadow-black/10 backdrop-blur-md">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-1">
          <FilterDropdownGroup>{dropdowns}</FilterDropdownGroup>
        </div>
        {searchBox}
      </div>
    </div>
  );
}

// ===== Bộ phận con =====

// Bộ chọn khu vực kiểu Homedy: bấm chọn theo tầng Tỉnh → Quận → Phường,
// có breadcrumb để quay lại + ô lọc nhanh trong panel.
function LocationPanel({
  province, district, ward, onChange,
}: {
  province: string;
  district: string;
  ward: string;
  onChange: (patch: { province?: string; district?: string; ward?: string }) => void;
}) {
  const [q, setQ] = useState("");
  const wardList = province && district ? wardsOf(province, district) : [];
  const level: "province" | "district" | "ward" =
    !province ? "province" : !district ? "district" : wardList.length ? "ward" : "district";

  const list = level === "province" ? provinceNames : level === "district" ? districtsOf(province) : wardList;
  const nq = normalizeVi(q);
  const filtered = nq ? list.filter((x) => normalizeVi(x).includes(nq)) : list;

  const pick = (name: string) => {
    if (level === "province") onChange({ province: name, district: "", ward: "" });
    else if (level === "district") onChange({ district: name, ward: "" });
    else onChange({ ward: name });
    setQ("");
  };

  const Crumb = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`max-w-[8rem] truncate rounded px-1.5 py-0.5 ${active ? "font-semibold text-cvr-ink" : "text-cvr-muted hover:text-cvr-ink"}`}
    >
      {children}
    </button>
  );

  return (
    <div>
      {/* Breadcrumb tầng địa giới */}
      <div className="mb-2 flex flex-wrap items-center gap-0.5 text-xs">
        <Crumb active={!province} onClick={() => { onChange({ province: "", district: "", ward: "" }); setQ(""); }}>Toàn quốc</Crumb>
        {province && <><span className="text-cvr-faint">›</span><Crumb active={!district} onClick={() => { onChange({ district: "", ward: "" }); setQ(""); }}>{province}</Crumb></>}
        {district && <><span className="text-cvr-faint">›</span><Crumb active={!ward} onClick={() => { onChange({ ward: "" }); setQ(""); }}>{district}</Crumb></>}
        {ward && <><span className="text-cvr-faint">›</span><span className="max-w-[8rem] truncate px-1.5 py-0.5 font-semibold text-cvr-ink">{ward}</span></>}
      </div>

      {/* Lọc nhanh trong tầng hiện tại */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={level === "province" ? "Tìm tỉnh/thành…" : level === "district" ? "Tìm quận/huyện…" : "Tìm phường/xã…"}
        aria-label="Lọc nhanh khu vực"
        className="h-9 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-ink/40"
      />

      {/* Danh sách bấm chọn */}
      <div className="mt-2 max-h-56 space-y-0.5 overflow-y-auto">
        {filtered.length === 0 && <p className="px-2 py-3 text-center text-sm text-cvr-faint">Không có kết quả</p>}
        {filtered.map((name) => {
          const active = level === "province" ? province === name : level === "district" ? district === name : ward === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => pick(name)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
                active ? "bg-cvr-ink/10 text-cvr-ink" : "text-cvr-ink/80 hover:bg-black/5"
              }`}
            >
              <span className="truncate">{name}</span>
              {level !== "ward" && <span className="shrink-0 text-cvr-faint">›</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        active ? "border-cvr-ink bg-cvr-ink text-white" : "border-black/15 text-cvr-ink/75 hover:border-black/40 hover:text-cvr-ink"
      }`}
    >
      {children}
    </button>
  );
}

function RangePanel({
  unit, step, sliderMax, min, max, presets, onPick, onReset, onApply,
}: {
  unit: string;
  step: number;
  sliderMax: number; // mốc tối đa của thanh trượt (kéo tới cuối = không giới hạn)
  min: number | null;
  max: number | null;
  presets: { label: string; min: number; max: number | null }[];
  onPick: (min: number | null, max: number | null) => void;
  onReset: () => void;
  onApply: () => void;
}) {
  // Bản nháp cho ô nhập tuỳ chỉnh (chỉ ghi vào filter khi rời ô)
  const [draftMin, setDraftMin] = useState(min == null ? "" : String(min));
  const [draftMax, setDraftMax] = useState(max == null ? "" : String(max));

  const commit = (mn: string, mx: string) => {
    const a = mn.trim() === "" ? null : Number(mn.replace(",", "."));
    const b = mx.trim() === "" ? null : Number(mx.replace(",", "."));
    onPick(Number.isNaN(a as number) ? null : a, Number.isNaN(b as number) ? null : b);
  };

  // Giá trị hiện tại cho thanh trượt (rỗng = 0 / hết mốc)
  const lo = draftMin.trim() === "" ? 0 : Math.max(0, Number(draftMin.replace(",", ".")) || 0);
  const hi = draftMax.trim() === "" ? sliderMax : Math.min(sliderMax, Number(draftMax.replace(",", ".")) || sliderMax);
  const pct = (v: number) => Math.max(0, Math.min(100, (v / sliderMax) * 100));
  const onSlide = (nlo: number, nhi: number) => {
    const a = nlo <= 0 ? "" : String(nlo);
    const b = nhi >= sliderMax ? "" : String(nhi); // kéo tới cuối = không giới hạn trên
    setDraftMin(a);
    setDraftMax(b);
    onPick(a === "" ? null : nlo, b === "" ? null : nhi);
  };

  return (
    <div>
      {/* Thanh trượt 2 đầu kiểu Homedy */}
      <div className="relative mb-3 h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-black/10" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-cvr-ink"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          className="cvr-range absolute left-0 top-0 h-5 w-full"
          type="range" min={0} max={sliderMax} step={step} value={lo}
          aria-label={`Tối thiểu (${unit})`}
          onChange={(e) => onSlide(Math.min(Number(e.target.value), hi), hi)}
        />
        <input
          className="cvr-range absolute left-0 top-0 h-5 w-full"
          type="range" min={0} max={sliderMax} step={step} value={hi}
          aria-label={`Tối đa (${unit})`}
          onChange={(e) => onSlide(lo, Math.max(Number(e.target.value), lo))}
        />
      </div>

      {/* Ô nhập khoảng tuỳ chỉnh */}
      <div className="flex items-center gap-2">
        <input
          type="number" inputMode="decimal" step={step} min={0} placeholder="Tối thiểu"
          value={draftMin}
          onChange={(e) => setDraftMin(e.target.value)}
          onBlur={() => commit(draftMin, draftMax)}
          className="h-10 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-ink/40"
        />
        <span className="text-cvr-faint">–</span>
        <input
          type="number" inputMode="decimal" step={step} min={0} placeholder="Tối đa"
          value={draftMax}
          onChange={(e) => setDraftMax(e.target.value)}
          onBlur={() => commit(draftMin, draftMax)}
          className="h-10 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-ink/40"
        />
        <span className="shrink-0 text-xs text-cvr-faint">{unit}</span>
      </div>

      {/* Khoảng có sẵn */}
      <div className="mt-3 max-h-52 space-y-0.5 overflow-y-auto">
        {presets.map((p) => {
          const active = min === p.min && (max ?? null) === (p.max ?? null);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setDraftMin(String(p.min));
                setDraftMax(p.max == null ? "" : String(p.max));
                onPick(p.min, p.max);
              }}
              className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
                active ? "bg-cvr-ink/10 text-cvr-ink" : "text-cvr-ink/75 hover:bg-black/5"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <PanelActions
        onReset={() => { setDraftMin(""); setDraftMax(""); onReset(); }}
        onApply={onApply}
      />
    </div>
  );
}
