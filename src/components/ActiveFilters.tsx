"use client";

import { priceRangeText, areaRangeText, type Filters } from "@/lib/filters";

// Chip các bộ lọc đang áp dụng — bấm X để gỡ từng cái (giống Homedy).
export default function ActiveFilters({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
}) {
  const f = value;
  const chips: { key: string; label: string; clear: Partial<Filters> }[] = [];

  if (f.province) chips.push({ key: "tinh", label: f.province, clear: { province: "", district: "", ward: "" } });
  if (f.district) chips.push({ key: "quan", label: f.district, clear: { district: "", ward: "" } });
  if (f.ward) chips.push({ key: "phuong", label: f.ward, clear: { ward: "" } });
  f.types.forEach((t) =>
    chips.push({ key: `loai-${t}`, label: t, clear: { types: f.types.filter((x) => x !== t) } }),
  );
  if (f.priceMin != null || f.priceMax != null)
    chips.push({ key: "gia", label: priceRangeText(f.priceMin, f.priceMax), clear: { priceMin: null, priceMax: null } });
  if (f.areaMin != null || f.areaMax != null)
    chips.push({ key: "dt", label: areaRangeText(f.areaMin, f.areaMax), clear: { areaMin: null, areaMax: null } });
  if (f.beds) chips.push({ key: "pn", label: f.beds >= 5 ? "5+ phòng ngủ" : `${f.beds} phòng ngủ`, clear: { beds: 0 } });
  if (f.direction) chips.push({ key: "huong", label: `Hướng ${f.direction}`, clear: { direction: "" } });
  if (f.keyword.trim()) chips.push({ key: "q", label: `“${f.keyword.trim()}”`, clear: { keyword: "" } });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange({ ...f, ...c.clear })}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 py-1 pl-3 pr-2 text-xs text-white/80 transition hover:border-white/40 hover:text-white"
        >
          <span className="max-w-[180px] truncate">{c.label}</span>
          <svg className="h-3 w-3 text-white/50" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
    </div>
  );
}
