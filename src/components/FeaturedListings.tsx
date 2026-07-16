"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { featuredListings, type Listing } from "@/lib/data";
import { tierFromBadge, type TierId } from "@/lib/packages";

// ── Tab nhanh: kết hợp MỤC ĐÍCH (bán/thuê) × LOẠI SẢN PHẨM ────────────────────
const isBan = (l: Listing) => (l.purpose ?? "ban") === "ban";
type TypeTab = { label: string; match: (l: Listing) => boolean };
const typeTabs: TypeTab[] = [
  { label: "Tất cả",        match: () => true },
  { label: "Bán đất",       match: (l) => isBan(l) && l.type.includes("Đất") },
  { label: "Bán nhà riêng", match: (l) => isBan(l) && (l.type.includes("Nhà") || l.type.includes("Villa") || l.type.includes("Biệt thự") || l.type.includes("Shophouse")) },
  { label: "Bán căn hộ",    match: (l) => isBan(l) && (l.type.includes("Căn hộ") || l.type.includes("Condotel")) },
  { label: "Cho thuê",      match: (l) => (l.purpose ?? "ban") === "thue" },
];

// ── 4 tầng hiển thị theo bảng "Loại tin và đặc điểm" (Gía đăng tin + QC) ──────
// Thứ hạng 1→4 · Kích thước: Rất lớn → Lớn → Trung bình → Nhỏ nhất
const TIER_ROWS: {
  tier: TierId;
  max: number;
  cols: string;
  variant: "featured" | "grid" | "mini";
}[] = [
  { tier: "diamond", max: 2, cols: "grid-cols-1 sm:grid-cols-2",                 variant: "featured" }, // Rất lớn
  { tier: "gold",    max: 3, cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",  variant: "grid" },     // Lớn
  { tier: "silver",  max: 4, cols: "grid-cols-2 lg:grid-cols-4",                 variant: "grid" },     // Trung bình
  { tier: "basic",   max: 4, cols: "grid-cols-2 lg:grid-cols-4",                 variant: "mini" },     // Nhỏ nhất
];

export default function FeaturedListings() {
  const [activeTab, setActiveTab] = useState("Tất cả");

  // Lọc theo tab rồi chia 4 tầng theo cấp tin (Diamond → Gold → Silver → Basic)
  const activeMatch = typeTabs.find((t) => t.label === activeTab)?.match ?? (() => true);
  const filtered = featuredListings.filter((l) => activeMatch(l));
  const rows = TIER_ROWS.map((r) => ({
    ...r,
    items: filtered.filter((l) => tierFromBadge(l.badge) === r.tier).slice(0, r.max),
  })).filter((r) => r.items.length > 0);

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

        {/* Tiêu đề (link "Xem tất cả" đặt ở CUỐI phần) */}
        <h2 className="text-2xl font-semibold text-cvr-ink">
          Bất động sản dành cho bạn
        </h2>

        {/* Tabs loại hình */}
        <div className="mt-5 flex flex-wrap gap-2">
          {typeTabs.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setActiveTab(t.label)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeTab === t.label
                  ? "scale-105 bg-cvr-ink text-white shadow-lg shadow-black/10"
                  : "border border-black/15 text-cvr-body hover:border-black/40 hover:text-cvr-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 4 tầng tin theo cấp — kích thước giảm dần đúng bảng đặc điểm */}
        {rows.length > 0 ? (
          <>
            <div className="mt-5 space-y-5">
              {rows.map((r) => (
                <div key={r.tier} className={`cards-stagger grid gap-5 ${r.cols}`}>
                  {r.items.map((item) => (
                    <PropertyCard key={item.id} item={item} variant={r.variant} />
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Link href="/mua-ban" className="text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
                Xem tất cả →
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-10 text-center text-cvr-muted">
            Đang cập nhật tin đăng theo loại hình này...
          </p>
        )}

      </div>
    </section>
  );
}
