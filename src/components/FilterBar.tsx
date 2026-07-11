"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FilterDropdown, { PanelActions, FilterDropdownGroup } from "@/components/FilterDropdown";
import { provinceNames, districtsOf, wardsOf } from "@/lib/locations";
import { projects } from "@/lib/data";
import {
  typeGroupsFor,
  priceRangesFor,
  areaRanges,
  bedroomOptions,
  directionOptions,
  priceRangeText,
  areaRangeText,
  normalizeVi,
  locationLabel,
  sameLocation,
  MAX_LOCATIONS,
  legalOptions,
  furnishingOptions,
  emptyFilters,
  hasActiveFilters,
  type Filters,
  type LocationSel,
} from "@/lib/filters";
import { suggest, popularSuggestions, type Suggestion, type SuggestKind } from "@/lib/suggest";

const RECENT_KEY = "cvr-recent-search"; // lịch sử tìm kiếm (localStorage)

// Icon (path d) cho từng nhóm gợi ý.
const SUGGEST_ICON: Record<SuggestKind, string> = {
  "Mục đích": "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
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
  mapActive = false,
  compact = false,
  leading,
  purpose = "ban",
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  onSearch?: () => void;
  // Bấm "Bản đồ" — bật/tắt chế độ bản đồ (nút nằm cạnh ô tìm, kiểu Batdongsan).
  onMap?: () => void;
  mapActive?: boolean;
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
  const hh = compact ? "h-12" : "h-10"; // compact = thanh tìm kiếm LỚN ở Hero · trang danh sách = gọn

  // Autocomplete đa tầng: Khu vực · Loại hình · Sản phẩm · Dự án · Tin tức.
  // Khi chạm vào ô (chưa gõ) → hiện Lịch sử + Gợi ý phổ biến (mô hình Homedy).
  const router = useRouter();
  const [sugOpen, setSugOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState<Suggestion[]>([]);
  const boxRef = useRef<HTMLDivElement>(null); // vùng ô tìm — để bấm-ra-ngoài thì đóng gợi ý

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(r)) setRecent(r);
    } catch { /* bỏ qua localStorage lỗi */ }
  }, []);

  // Ẩn gợi ý THÔNG MINH: chỉ đóng khi bấm RA NGOÀI ô tìm (thay onBlur hẹn-giờ chập chờn).
  useEffect(() => {
    if (!sugOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) { setSugOpen(false); setActiveIdx(-1); }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [sugOpen]);

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
  // Panel: chỉ VÀI gợi ý điển hình — đang gõ → tối đa 6 kết quả khớp; chưa gõ → ≤3 lịch sử + phổ biến.
  const recentShown = recent.slice(0, 3);
  const panelItems: Suggestion[] = typed ? suggest(f.keyword, 6) : [...recentShown, ...popularSuggestions];

  const applySuggestion = (s: Suggestion) => {
    pushRecent(s);
    if (s.kind === "Khu vực" && s.province) {
      // Thêm khu vực vào danh sách ĐA CHỌN (không ghi đè, không trùng, tối đa 5).
      const sel: LocationSel = { province: s.province, district: s.district || undefined, ward: s.ward || undefined };
      const dup = f.locations.some((l) => sameLocation(l, sel));
      const locations = dup || f.locations.length >= MAX_LOCATIONS ? f.locations : [...f.locations, sel];
      set({ locations, keyword: "" });
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
  const locLabel =
    f.locations.length === 0 ? "" :
    f.locations.length === 1 ? locationLabel(f.locations[0]) :
    `${locationLabel(f.locations[0])} +${f.locations.length - 1}`;
  const typeLabel =
    f.types.length === 0 ? "" : f.types.length === 1 ? f.types[0] : `${f.types.length} loại hình`;
  // Lọc thêm ĐẶC THÙ theo ý định: mua bán = Hướng + Pháp lý · cho thuê = Nội thất.
  const moreCount =
    (f.beds ? 1 : 0) +
    (purpose === "ban" ? (f.direction ? 1 : 0) + (f.legal ? 1 : 0) : (f.furnishing ? 1 : 0));

  // Mỗi ô lọc rộng vừa đúng nội dung (pill gọn, hiện đủ chữ, không kéo giãn).
  const ddClass = "shrink-0";

  // ===== "Loại nhà đất" — dòng 2 (bố cục Batdongsan) =====
  const typeDropdown = (
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
                className="h-4 w-4 shrink-0 accent-cvr-blue"
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
                          className="h-4 w-4 shrink-0 accent-cvr-blue"
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
  );

  // ===== Các dropdown chi tiết — dòng 2 (thứ tự hiển thị xếp ở phần return) =====
  // Khu vực — ĐA CHỌN (tối đa 5) theo tầng Tỉnh→Quận→Phường (kiểu Batdongsan)
  const locationDropdown = (
      <FilterDropdown label="Khu vực" summary={locLabel} active={f.locations.length > 0} panelClassName="w-80" compact={compact} className={ddClass}>
        {() => (
          <LocationPanel
            locations={f.locations}
            onChange={(locations) => set({ locations })}
          />
        )}
      </FilterDropdown>
  );

  // Dự án — LỌC ĐỘNG theo khu vực đã chọn (kiểu Batdongsan)
  const projectDropdown = (
      <FilterDropdown label="Dự án" summary={f.project} active={!!f.project} panelClassName="w-72" compact={compact} className={ddClass}>
        {({ close }) => (
          <ProjectPanel
            locations={f.locations}
            project={f.project}
            onPick={(name) => { set({ project: f.project === name ? "" : name }); close(); }}
          />
        )}
      </FilterDropdown>
  );

  // Khoảng giá (tên nhãn kiểu Batdongsan)
  const priceDropdown = (
      <FilterDropdown label="Khoảng giá" summary={priceLabel} active={f.priceMin != null || f.priceMax != null} panelClassName="w-80" compact={compact} className={ddClass}>
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
  );

  // Diện tích
  const areaDropdown = (
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
  );

  // "Lọc" — phòng ngủ + hướng + pháp lý/nội thất (đứng ĐẦU dòng 2, kiểu Batdongsan)
  const moreDropdown = (
      <FilterDropdown
        label="Lọc"
        summary={moreCount ? `Lọc (${moreCount})` : ""}
        active={moreCount > 0}
        panelClassName="w-80"
        className={ddClass}
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
            {purpose === "ban" && (
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
            )}
            {/* Đặc thù theo ý định: MUA BÁN → Pháp lý · CHO THUÊ → Nội thất */}
            {purpose === "ban" ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Pháp lý</p>
                <div className="flex flex-wrap gap-1.5">
                  {legalOptions.map((x) => (
                    <Chip key={x} active={f.legal === x} onClick={() => set({ legal: f.legal === x ? "" : x })}>
                      {x}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Nội thất</p>
                <div className="flex flex-wrap gap-1.5">
                  {furnishingOptions.map((x) => (
                    <Chip key={x} active={f.furnishing === x} onClick={() => set({ furnishing: f.furnishing === x ? "" : x })}>
                      {x}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <PanelActions onReset={() => set({ beds: 0, direction: "", legal: "", furnishing: "" })} onApply={close} />
          </div>
        )}
      </FilterDropdown>
  );

  // ===== Ô từ khoá + nút tìm kiếm (dùng chung) =====
  const searchBox = (
    <div ref={boxRef} className={compact ? "flex w-full gap-2.5" : "flex w-full gap-2"}>
      <div className={compact ? "relative flex-1" : "relative flex h-12 min-w-0 flex-1 items-center rounded-none bg-cvr-surface transition focus-within:ring-2 focus-within:ring-cvr-blue/40"}>
        <svg className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
        <input
          type="text"
          value={f.keyword}
          onChange={(e) => { set({ keyword: e.target.value }); setSugOpen(true); setActiveIdx(-1); }}
          onFocus={() => setSugOpen(true)}
          onKeyDown={onKeyNav}
          placeholder="Nhập khu vực, dự án, hoặc loại bất động sản…"
          aria-label="Tìm theo từ khoá, khu vực, loại hình, dự án, tin"
          autoComplete="off"
          role="combobox"
          aria-expanded={sugOpen}
          className={
            compact
              ? "h-12 w-full rounded-xl border border-transparent bg-white pl-11 pr-4 text-[15px] text-cvr-ink placeholder-cvr-faint shadow-lg shadow-black/20 ring-1 ring-black/5 outline-none transition focus:ring-2 focus:ring-cvr-blue/50"
              : "h-full w-full min-w-0 flex-1 border-none bg-transparent pl-11 pr-3 text-[15px] text-cvr-ink placeholder-cvr-faint outline-none"
          }
        />
        {/* Nút Tìm kiếm NẰM TRONG thanh tìm (kiểu Batdongsan) — trang danh sách */}
        {!compact && (
          <button
            type="button"
            aria-label="Tìm kiếm"
            onClick={() => { setSugOpen(false); onSearch?.(); }}
            className="m-1.5 flex h-9 shrink-0 items-center justify-center rounded-none bg-cvr-blue px-5 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink active:scale-95"
          >
            Tìm kiếm
          </button>
        )}
        {sugOpen && panelItems.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-[120] mt-1.5 max-h-80 overflow-y-auto rounded-none border border-cvr-line bg-white p-1.5 shadow-2xl shadow-black/20 ring-1 ring-inset ring-black/5">
            {panelItems.map((s, i) => {
              const header = !typed
                ? i === 0 && recentShown.length > 0 ? "recent" : i === recentShown.length ? "popular" : ""
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
      {compact && onSearch && (
        <button
          type="button"
          onClick={onSearch}
          aria-label="Tìm kiếm"
          className={`flex ${hh} shrink-0 items-center justify-center gap-2 font-semibold transition active:scale-95 ${
            compact
              ? "rounded-xl bg-cvr-blue px-6 text-[15px] text-white shadow-lg shadow-black/20 hover:bg-cvr-blue-ink"
              : "rounded-xl bg-cvr-blue px-6 text-sm text-white hover:bg-cvr-blue-ink"
          }`}
        >
          {!compact && (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
          )}
          Tìm kiếm
        </button>
      )}
      {/* Nút Bản đồ — cạnh ô tìm kiếm (kiểu Batdongsan), chỉ ở trang danh sách */}
      {!compact && onMap && (
        <button
          type="button"
          onClick={onMap}
          aria-pressed={mapActive}
          className={`flex h-12 shrink-0 items-center gap-2 rounded-none px-5 text-sm font-semibold text-white transition ${
            mapActive ? "bg-cvr-blue-ink" : "bg-cvr-blue hover:bg-cvr-blue-ink"
          }`}
        >
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4M9 7l6-3" /></svg>
          Xem bản đồ
        </button>
      )}
    </div>
  );

  // Compact (Hero): kiểu "bay" trên ảnh — tab canh giữa + 1 thanh tìm kiếm LỚN,
  // KHÔNG hộp nền, KHÔNG dàn dropdown (lọc chi tiết nằm ở trang kết quả).
  // Autocomplete thông minh (khu vực · loại hình · dự án · tin) vẫn nằm trong ô tìm (suggest.ts).
  if (compact) {
    return (
      <div className="flex flex-col gap-3.5">
        {/* Dòng 1: tab (menu) — canh giữa, gạch chân tab đang chọn */}
        {leading && <div className="flex justify-center">{leading}</div>}
        {/* Dòng 2: thanh tìm kiếm lớn */}
        {searchBox}
      </div>
    );
  }

  // Mặc định (trang danh sách/tìm kiếm): bố cục Batdongsan, da Apple —
  // DÒNG 1: Loại nhà đất (dẫn đầu) + ô tìm kiếm + Bản đồ ·
  // DÒNG 2: Khu vực · Dự án · Mức giá · Diện tích · Lọc thêm · Đặt lại (phải).
  const hasActive = hasActiveFilters(f);
  return (
    <FilterDropdownGroup>
      <div className="rounded-none border border-cvr-line bg-white p-2.5 shadow-lux">
        <div className="flex flex-col gap-2">
          {searchBox}
          <div className="flex flex-wrap items-center gap-2">
            {moreDropdown}
            <FilterToggle label="Tin xác thực" checked={f.verified} onChange={(v) => set({ verified: v })} />
            {typeDropdown}
            {priceDropdown}
            {areaDropdown}
            {locationDropdown}
            {projectDropdown}
            <FilterToggle label="Môi giới chuyên nghiệp" checked={f.broker} onChange={(v) => set({ broker: v })} />
            {hasActive && (
              <button
                type="button"
                onClick={() => onChange(emptyFilters())}
                className="flex h-9 items-center justify-center gap-1.5 px-3 text-sm font-medium text-cvr-muted transition hover:text-cvr-blue-ink lg:ml-auto"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.13-3.36M20 15A8 8 0 015.87 18.36" />
                </svg>
                Đặt lại
              </button>
            )}
          </div>
        </div>
      </div>
    </FilterDropdownGroup>
  );
}

// ===== Bộ phận con =====

// Bộ chọn khu vực ĐA TẦNG + ĐA CHỌN (kiểu Batdongsan): duyệt Tỉnh→Quận→Phường,
// thêm cả tỉnh/quận hoặc chọn tới phường; mỗi khu vực là 1 chip (tối đa MAX_LOCATIONS).
function LocationPanel({
  locations, onChange,
}: {
  locations: LocationSel[];
  onChange: (locations: LocationSel[]) => void;
}) {
  const [q, setQ] = useState("");
  const [prov, setProv] = useState(""); // đường dẫn đang duyệt (chưa cam kết)
  const [dist, setDist] = useState("");
  const wardList = prov && dist ? wardsOf(prov, dist) : [];
  const level: "province" | "district" | "ward" =
    !prov ? "province" : !dist ? "district" : wardList.length ? "ward" : "district";

  const list = level === "province" ? provinceNames : level === "district" ? districtsOf(prov) : wardList;
  const nq = normalizeVi(q);
  const filtered = nq ? list.filter((x) => normalizeVi(x).includes(nq)) : list;

  const full = locations.length >= MAX_LOCATIONS;
  const add = (sel: LocationSel) => {
    if (full || locations.some((l) => sameLocation(l, sel))) return;
    onChange([...locations, sel]);
    setProv(""); setDist(""); setQ("");
  };
  const remove = (i: number) => onChange(locations.filter((_, k) => k !== i));

  const pick = (name: string) => {
    if (level === "province") { setProv(name); setQ(""); }
    else if (level === "district") { setDist(name); setQ(""); }
    else add({ province: prov, district: dist, ward: name }); // tới phường = thêm luôn
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
      {/* Khu vực ĐÃ CHỌN — chip gỡ riêng */}
      {locations.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {locations.map((l, i) => (
            <span key={`${locationLabel(l)}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-cvr-blue/10 py-1 pl-2.5 pr-1.5 text-xs font-medium text-cvr-blue-ink">
              <span className="max-w-[9rem] truncate">{locationLabel(l)}</span>
              <button type="button" onClick={() => remove(i)} aria-label="Gỡ khu vực" className="text-cvr-blue/60 transition hover:text-cvr-blue-ink">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Breadcrumb tầng đang duyệt */}
      <div className="mb-2 flex flex-wrap items-center gap-0.5 text-xs">
        <Crumb active={!prov} onClick={() => { setProv(""); setDist(""); setQ(""); }}>Toàn quốc</Crumb>
        {prov && <><span className="text-cvr-faint">›</span><Crumb active={!dist} onClick={() => { setDist(""); setQ(""); }}>{prov}</Crumb></>}
        {dist && <><span className="text-cvr-faint">›</span><span className="max-w-[8rem] truncate px-1.5 py-0.5 font-semibold text-cvr-ink">{dist}</span></>}
      </div>

      {/* Thêm nhanh cả tỉnh / cả quận đang duyệt */}
      {prov && !full && (
        <button
          type="button"
          onClick={() => add(dist ? { province: prov, district: dist } : { province: prov })}
          className="mb-2 w-full rounded-lg border border-cvr-blue/30 bg-cvr-blue/[0.06] px-2.5 py-1.5 text-left text-xs font-medium text-cvr-blue-ink transition hover:bg-cvr-blue/15"
        >
          ＋ Thêm cả {dist || prov}
        </button>
      )}

      {/* Lọc nhanh trong tầng hiện tại */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={level === "province" ? "Tìm tỉnh/thành…" : level === "district" ? "Tìm quận/huyện…" : "Tìm phường/xã…"}
        aria-label="Lọc nhanh khu vực"
        className="h-9 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
      />

      {/* Danh sách bấm chọn */}
      <div className="mt-2 max-h-56 space-y-0.5 overflow-y-auto">
        {full && <p className="px-2 py-2 text-center text-xs font-medium text-cvr-blue-ink">Đã đạt tối đa {MAX_LOCATIONS} khu vực</p>}
        {filtered.length === 0 && <p className="px-2 py-3 text-center text-sm text-cvr-faint">Không có kết quả</p>}
        {filtered.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => pick(name)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-cvr-ink/80 transition hover:bg-black/5"
          >
            <span className="truncate">{name}</span>
            {level !== "ward" ? <span className="shrink-0 text-cvr-faint">›</span> : <span className="shrink-0 text-[11px] text-cvr-faint">＋ Thêm</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// Danh sách dự án — LỌC ĐỘNG theo khu vực đã chọn (kiểu Batdongsan): chọn Đà Nẵng
// → chỉ hiện dự án Đà Nẵng. Chưa chọn khu vực → hiện tất cả.
function ProjectPanel({
  locations, project, onPick,
}: {
  locations: LocationSel[];
  project: string;
  onPick: (name: string) => void;
}) {
  const [q, setQ] = useState("");
  const inArea = (loc: string) =>
    locations.length === 0 ||
    locations.some((l) => loc.includes(l.province) && (!l.district || loc.includes(l.district)) && (!l.ward || loc.includes(l.ward)));
  const base = projects.filter((p) => inArea(p.location));
  const nq = normalizeVi(q);
  const list = nq ? base.filter((p) => normalizeVi(`${p.name} ${p.location} ${p.developer}`).includes(nq)) : base;

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm dự án…"
        aria-label="Tìm dự án"
        className="h-9 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
      />
      <div className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
        {list.length === 0 && (
          <p className="px-2 py-3 text-center text-sm text-cvr-faint">
            {locations.length ? "Chưa có dự án ở khu vực đã chọn" : "Không có dự án khớp"}
          </p>
        )}
        {list.map((p) => {
          const active = project === p.name;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => onPick(p.name)}
              className={`flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left text-sm transition ${active ? "bg-cvr-blue/10 text-cvr-blue-ink" : "text-cvr-ink/80 hover:bg-black/5"}`}
            >
              <span className="truncate font-medium">{p.name}</span>
              <span className="truncate text-[11px] text-cvr-faint">{p.location}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Toggle bật/tắt kiểu Batdongsan (Tin xác thực · Môi giới chuyên nghiệp) — công tắc iOS/Apple.
function FilterToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex h-10 shrink-0 items-center gap-2.5 rounded-none border px-3.5 text-sm transition ${
        checked
          ? "border-cvr-blue/50 bg-white font-medium text-cvr-ink"
          : "border-cvr-line bg-white text-cvr-body hover:border-cvr-ink/35"
      }`}
    >
      {label}
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-cvr-blue" : "bg-black/15"}`} aria-hidden>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        active ? "border-cvr-blue bg-cvr-blue text-white" : "border-black/15 text-cvr-ink/75 hover:border-cvr-blue/50 hover:text-cvr-ink"
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
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-cvr-blue"
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
          className="h-10 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
        />
        <span className="text-cvr-faint">–</span>
        <input
          type="number" inputMode="decimal" step={step} min={0} placeholder="Tối đa"
          value={draftMax}
          onChange={(e) => setDraftMax(e.target.value)}
          onBlur={() => commit(draftMin, draftMax)}
          className="h-10 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-blue/60"
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
                active ? "bg-cvr-blue/10 font-medium text-cvr-blue-ink" : "text-cvr-ink/75 hover:bg-black/5"
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
