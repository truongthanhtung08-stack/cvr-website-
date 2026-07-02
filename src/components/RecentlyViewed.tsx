"use client";

import { useEffect, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
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
    <section className="section-edge bg-cvr-ink">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-12">
        <h2 className="font-serif text-2xl font-bold text-white">Bất động sản đã xem</h2>
        <div className="mt-4 flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <div key={item.id} className="w-[80%] shrink-0 sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)]">
              <PropertyCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
