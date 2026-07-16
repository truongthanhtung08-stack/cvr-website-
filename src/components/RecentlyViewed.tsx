"use client";

import { useEffect, useState } from "react";
import ListingSlider from "@/components/ListingSlider";
import { featuredListings, type Listing } from "@/lib/data";
import { useRecentlyViewed } from "@/lib/useRecentlyViewed";

// Mục "Bất động sản đã xem" — chỉ hiện khi có lịch sử xem (giống Homedy).
export default function RecentlyViewed() {
  const ids = useRecentlyViewed();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = ids
    .map((id) => featuredListings.find((l) => l.id === id))
    .filter((x): x is Listing => Boolean(x))
    .slice(0, 8);

  if (!mounted || items.length === 0) return null;

  return (
    <section className="section-edge bg-cvr-surface">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-cvr-ink">Bất động sản đã xem</h2>
        <div className="mt-4">
          <ListingSlider items={items} />
        </div>
      </div>
    </section>
  );
}
