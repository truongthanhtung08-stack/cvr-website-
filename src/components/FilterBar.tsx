"use client";

import { useState } from "react";
import FilterDropdown, { PanelActions } from "@/components/FilterDropdown";
import { provinceNames, districtsOf, wardsOf } from "@/lib/locations";
import {
  propertyTypeOptions,
  priceRanges,
  areaRanges,
  bedroomOptions,
  directionOptions,
  priceRangeText,
  areaRangeText,
  type Filters,
} from "@/lib/filters";

// Thanh lọc kiểu Homedy — fully controlled qua props value/onChange.
export default function FilterBar({
  value,
  onChange,
  onSearch,
  compact = false,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  onSearch?: () => void;
  compact?: boolean;
}) {
  const f = value;
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });
  const hh = compact ? "h-10" : "h-11"; // chiều cao ô (gọn khi đặt trên Hero)

  const districts = f.province ? districtsOf(f.province) : [];
  const wards = f.province && f.district ? wardsOf(f.province, f.district) : [];

  const areaLabel = areaRangeText(f.areaMin, f.areaMax);
  const priceLabel = priceRangeText(f.priceMin, f.priceMax);
  const locLabel = f.ward || f.district || f.province;
  const typeLabel =
    f.types.length === 0 ? "" : f.types.length === 1 ? f.types[0] : `${f.types.length} loại hình`;
  const moreCount = (f.beds ? 1 : 0) + (f.direction ? 1 : 0);

  // Layout: compact (Hero, kiểu Homedy) = 1 hàng cuốn, dropdown vừa nội dung + keyword rộng.
  const ddClass = compact ? "" : "lg:flex-1 lg:min-w-0";
  return (
    <div className={compact ? "" : "rounded-2xl border border-white/12 bg-white/[0.04] p-2.5 shadow-xl shadow-black/30 backdrop-blur-md"}>
      <div className={compact ? "flex flex-wrap items-center gap-2" : "flex flex-col gap-2 lg:flex-row lg:items-center"}>
        {/* Nhóm dropdown */}
        <div className={compact ? "contents" : "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-1"}>
        {/* Khu vực */}
        <FilterDropdown label="Khu vực" summary={locLabel} active={!!locLabel} panelClassName="w-72" compact={compact} className={ddClass}>
          {() => (
            <div className="space-y-2">
              <PanelSelect
                label="Tỉnh / Thành"
                value={f.province}
                onChange={(v) => set({ province: v, district: "", ward: "" })}
                options={provinceNames}
                placeholder="Toàn khu vực"
              />
              <PanelSelect
                label="Quận / Huyện"
                value={f.district}
                onChange={(v) => set({ district: v, ward: "" })}
                options={districts}
                placeholder="Quận / Huyện"
                disabled={!f.province}
              />
              <PanelSelect
                label="Phường / Xã"
                value={f.ward}
                onChange={(v) => set({ ward: v })}
                options={wards}
                placeholder="Phường / Xã"
                disabled={!f.district}
              />
              <button
                type="button"
                onClick={() => set({ province: "", district: "", ward: "" })}
                className="text-xs font-medium text-white/55 transition hover:text-white"
              >
                Xoá khu vực
              </button>
            </div>
          )}
        </FilterDropdown>

        {/* Loại nhà đất — chọn nhiều */}
        <FilterDropdown label="Loại nhà đất" summary={typeLabel} active={f.types.length > 0} panelClassName="w-72" compact={compact} className={ddClass}>
          {() => (
            <div>
              <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
                {propertyTypeOptions.map((t) => {
                  const checked = f.types.includes(t);
                  return (
                    <label
                      key={t}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-white/80 transition hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          set({ types: checked ? f.types.filter((x) => x !== t) : [...f.types, t] })
                        }
                        className="h-4 w-4 shrink-0 accent-white"
                      />
                      <span className="truncate">{t}</span>
                    </label>
                  );
                })}
              </div>
              {f.types.length > 0 && (
                <button
                  type="button"
                  onClick={() => set({ types: [] })}
                  className="mt-2 border-t border-white/10 pt-2 text-xs font-medium text-white/55 transition hover:text-white"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>
          )}
        </FilterDropdown>

        {/* Mức giá */}
        <FilterDropdown label="Mức giá" summary={priceLabel} active={f.priceMin != null || f.priceMax != null} panelClassName="w-80" compact={compact} className={ddClass}>
          {({ close }) => (
            <RangePanel
              unit="tỷ"
              step={0.5}
              min={f.priceMin}
              max={f.priceMax}
              presets={priceRanges}
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Số phòng ngủ</p>
                <div className="flex flex-wrap gap-1.5">
                  {bedroomOptions.map((n) => (
                    <Chip key={n} active={f.beds === n} onClick={() => set({ beds: f.beds === n ? 0 : n })}>
                      {n === 5 ? "5+ PN" : `${n} PN`}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Hướng nhà</p>
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
        </div>

        {/* Từ khoá + tìm kiếm — compact: keyword RỘNG tối đa, nút chỉ ICON */}
        <div className={compact ? "flex min-w-[200px] flex-1 gap-2" : "flex gap-2 lg:w-72 xl:w-80"}>
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              type="text"
              value={f.keyword}
              onChange={(e) => set({ keyword: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") onSearch?.(); }}
              placeholder="Từ khoá: dự án, đường, phường…"
              className={`${hh} w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/40 focus:bg-white/10`}
            />
          </div>
          {onSearch && (
            <button
              type="button"
              onClick={onSearch}
              aria-label="Tìm kiếm"
              className={`flex ${hh} shrink-0 items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-cl-ink transition hover:bg-white/90 active:scale-95 ${compact ? "w-10" : "px-6"}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
              {!compact && "Tìm kiếm"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Bộ phận con =====

function PanelSelect({
  label, value, onChange, options, placeholder, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string; disabled?: boolean;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        active ? "border-white bg-white text-cl-ink" : "border-white/15 text-white/75 hover:border-white/40 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function RangePanel({
  unit, step, min, max, presets, onPick, onReset, onApply,
}: {
  unit: string;
  step: number;
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

  return (
    <div>
      {/* Ô nhập khoảng tuỳ chỉnh */}
      <div className="flex items-center gap-2">
        <input
          type="number" inputMode="decimal" step={step} min={0} placeholder="Tối thiểu"
          value={draftMin}
          onChange={(e) => setDraftMin(e.target.value)}
          onBlur={() => commit(draftMin, draftMax)}
          className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/35 outline-none focus:border-white/40"
        />
        <span className="text-white/40">–</span>
        <input
          type="number" inputMode="decimal" step={step} min={0} placeholder="Tối đa"
          value={draftMax}
          onChange={(e) => setDraftMax(e.target.value)}
          onBlur={() => commit(draftMin, draftMax)}
          className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/35 outline-none focus:border-white/40"
        />
        <span className="shrink-0 text-xs text-white/45">{unit}</span>
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
                active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/5"
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
