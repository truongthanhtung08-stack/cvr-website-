"use client";

import { useState } from "react";
import FilterBar from "@/components/FilterBar";
import { emptyFilters, filtersToParams, type Filters } from "@/lib/filters";

const tabs = ["Mua bán", "Cho thuê", "Dự án"];

// Khối tìm kiếm trang chủ (tab + bộ lọc) — tách riêng, nằm dưới banner Hero.
export default function HomeSearch() {
  const [tab, setTab] = useState(tabs[0]);
  const [filters, setFilters] = useState<Filters>(emptyFilters());

  function handleSearch() {
    const params = filtersToParams(filters);
    params.set("mode", tab);
    window.location.href = `/tim-kiem?${params.toString()}`;
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-cl-ink/[0.06] p-2.5 shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/10 backdrop-blur-2xl">
      <div className="mb-2 flex gap-1.5">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3.5 py-1 text-[13px] font-semibold transition-all ${
              tab === t ? "bg-white text-cl-ink" : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <FilterBar value={filters} onChange={setFilters} onSearch={handleSearch} compact />
    </div>
  );
}
