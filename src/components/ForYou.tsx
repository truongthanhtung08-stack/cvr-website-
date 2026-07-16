"use client";

import { useEffect, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import { featuredListings, type Listing } from "@/lib/data";
import { useRecentlyViewed } from "@/lib/useRecentlyViewed";

// Khối "Dành riêng cho bạn" (III.6) — gợi ý theo hành vi xem tin.
// Suy luận SỞ THÍCH (loại hình + tỉnh/thành hay xem) rồi gợi ý tin KHÁC phù hợp.
// Chưa có lịch sử → gợi ý các tin cao cấp (VIP/Nổi bật) làm mặc định.
function provinceOf(l: Listing) {
  return l.location.split(",").pop()?.trim() ?? "";
}

export default function ForYou() {
  const ids = useRecentlyViewed();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const viewed = ids
    .map((id) => featuredListings.find((l) => l.id === id))
    .filter((x): x is Listing => Boolean(x));

  let items: Listing[];
  if (viewed.length > 0) {
    // Sở thích: loại hình + tỉnh xuất hiện nhiều nhất trong tin đã xem
    const topType = mode(viewed.map((l) => l.type));
    const topProvince = mode(viewed.map(provinceOf));
    const viewedIds = new Set(viewed.map((l) => l.id));
    // Chấm điểm tin chưa xem theo mức khớp sở thích
    items = featuredListings
      .filter((l) => !viewedIds.has(l.id))
      .map((l) => ({
        l,
        score: (l.type === topType ? 2 : 0) + (provinceOf(l) === topProvince ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.l);
  } else {
    // Mặc định: tin cao cấp
    items = featuredListings.filter((l) => l.badge === "VIP" || l.badge === "Nổi bật").slice(0, 8);
  }

  if (!mounted || items.length === 0) return null;

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-cvr-ink sm:text-3xl">Dành riêng cho bạn</h2>
            <p className="mt-1.5 text-sm text-cvr-muted">
              {viewed.length > 0 ? "Gợi ý dựa trên bất động sản bạn vừa xem" : "Những bất động sản nổi bật đáng chú ý"}
            </p>
          </div>
        </div>
        {/* Mobile 1 tin/hàng · tablet 2 · desktop 4 (đồng bộ FeaturedListings) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => <PropertyCard key={item.id} item={item} />)}
        </div>
      </div>
    </section>
  );
}

// Giá trị xuất hiện nhiều nhất trong mảng
function mode(arr: string[]): string {
  const m = new Map<string, number>();
  for (const x of arr) if (x) m.set(x, (m.get(x) ?? 0) + 1);
  let best = "";
  let bestN = 0;
  for (const [k, n] of m) if (n > bestN) { best = k; bestN = n; }
  return best;
}
