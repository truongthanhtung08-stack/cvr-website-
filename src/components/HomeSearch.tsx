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
    <div className="flex items-center gap-7">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={`relative pb-2 text-[15px] font-semibold transition-colors [text-shadow:0_1px_10px_rgba(0,0,0,0.6)] ${
            tab === t ? "text-white" : "text-white/70 hover:text-white"
          }`}
        >
          {t}
          {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-cvr-gold shadow-[0_1px_6px_rgba(0,0,0,0.5)]" />}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="mx-auto w-full max-w-2xl"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <FilterBar value={filters} onChange={setFilters} onSearch={handleSearch} onMap={handleMap} compact leading={tabBar} purpose={purpose} />
    </div>
  );
}
