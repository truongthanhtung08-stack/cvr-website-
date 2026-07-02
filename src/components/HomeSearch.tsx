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

  // Mở trang kết quả ở chế độ bản đồ (bản đồ sẽ hiển thị khi xây xong).
  function handleMap() {
    const params = filtersToParams(filters);
    params.set("mode", tab);
    params.set("view", "map");
    window.location.href = `/tim-kiem?${params.toString()}`;
  }

  // Tab "Cho thuê" → danh mục loại hình cho thuê; còn lại (Mua bán/Dự án) → mua bán
  const purpose: "ban" | "thue" = tab === "Cho thuê" ? "thue" : "ban";

  const tabBar = (
    <div className="flex shrink-0 gap-1.5">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={`h-8 rounded-lg px-3 text-[13px] font-semibold transition-all ${
            tab === t ? "bg-white text-cvr-ink" : "bg-white/10 text-white/80 hover:bg-white/20"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto w-fit max-w-full rounded-2xl border border-white/10 bg-cvr-ink/75 p-2 shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/10 backdrop-blur-2xl backdrop-saturate-150">
      <FilterBar value={filters} onChange={setFilters} onSearch={handleSearch} onMap={handleMap} compact leading={tabBar} purpose={purpose} />
    </div>
  );
}
