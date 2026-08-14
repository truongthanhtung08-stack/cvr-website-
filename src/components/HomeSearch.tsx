"use client";

import { useState } from "react";
import FilterBar from "@/components/FilterBar";
import { emptyFilters, filtersToParams, type Filters } from "@/lib/filters";

const tabs = ["Mua bán", "Cho thuê", "Dự án"];

// Khối tìm kiếm trang chủ (tab + bộ lọc) — nằm trên banner Hero.
// CHỨC NĂNG bộ lọc GIỮ NGUYÊN 100% (FilterBar dùng chung với các trang danh sách):
// tìm từ khoá, khu vực đa chọn, dự án, loại hình, khoảng giá, diện tích…
// Chỉ phần NHÌN của hàng tab trên máy tính được làm lại theo UI mẫu:
// viên thuốc nền tối mờ, mục đang chọn nền trắng chữ đen.
export default function HomeSearch({ defaultTab }: { defaultTab?: string }) {
  const [tab, setTab] = useState(defaultTab && tabs.includes(defaultTab) ? defaultTab : tabs[0]);
  const [filters, setFilters] = useState<Filters>(emptyFilters());

  // Trang ĐÍCH theo đúng tab đang chọn — bấm mục nào thì tìm trong mục đó:
  //   Dự án   → /du-an     (tìm trong danh sách DỰ ÁN)
  //   Mua bán → /mua-ban   · Cho thuê → /cho-thue  (tìm trong TIN đúng mục đích)
  // Trước đây mọi tab đều đổ về /tim-kiem nên bấm "Dự án" lại ra tin bán/thuê.
  function trangDich(params: URLSearchParams): string {
    if (tab === "Dự án") return `/du-an?${params.toString()}`;
    if (tab === "Cho thuê") return `/cho-thue?${params.toString()}`;
    return `/mua-ban?${params.toString()}`;
  }

  function handleSearch() {
    const params = filtersToParams(filters);
    params.set("mode", tab);
    window.location.href = trangDich(params);
  }

  // Mở trang kết quả ở chế độ bản đồ (bản đồ sẽ hiển thị khi xây xong).
  function handleMap() {
    const params = filtersToParams(filters);
    params.set("mode", tab);
    params.set("view", "map");
    window.location.href = trangDich(params);
  }

  // Tab "Cho thuê" → danh mục loại hình cho thuê; còn lại (Mua bán/Dự án) → mua bán
  const purpose: "ban" | "thue" = tab === "Cho thuê" ? "thue" : "ban";

  const tabBar = (
    <>
      {/* ĐIỆN THOẠI: giữ nguyên kiểu gạch chân đã duyệt */}
      <div className="flex items-center gap-7 sm:hidden">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            // MOBILE: thanh tìm nằm trên nền TRẮNG (phía trên Hero) nên chữ phải
            // ĐEN — trước đây để chữ trắng theo kiểu đè lên ảnh, đưa xuống nền
            // trắng là mất chữ.
            className={`relative pb-1.5 text-[15px] font-semibold transition-colors ${
              tab === t ? "text-cvr-ink" : "text-cvr-muted"
            }`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-cvr-blue" />}
          </button>
        ))}
      </div>

      {/* MÁY TÍNH: menu nằm TRONG lớp kính — chữ trắng, mục đang chọn viên trắng */}
      <div className="hidden items-center gap-1 sm:inline-flex">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-[13.5px] font-semibold tracking-[-0.01em] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              tab === t
                ? "bg-white text-cvr-ink shadow-[0_1px_6px_rgba(0,0,0,0.2)]"
                : "text-white/85 hover:bg-white/15 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div
      className="mx-auto w-full max-w-2xl"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      {/* MỘT KHỐI TRẮNG DUY NHẤT (chỉ máy tính): menu và ô tìm nằm chung một nền,
          không lồng khối. Điện thoại giữ nguyên như đã duyệt. */}
      <div className="sm:rounded-[22px] sm:bg-black/15 sm:p-2.5 sm:shadow-2xl sm:shadow-black/25 sm:ring-1 sm:ring-inset sm:ring-white/25 sm:backdrop-blur-xl sm:backdrop-saturate-150">
        <FilterBar value={filters} onChange={setFilters} onSearch={handleSearch} onMap={handleMap} compact leading={tabBar} purpose={purpose} />
      </div>
    </div>
  );
}
