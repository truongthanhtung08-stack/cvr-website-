"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { featuredListings } from "@/lib/data";

const cityTabs = [
  "Tất cả",
  "Đà Nẵng",
  "Thừa Thiên Huế",
  "Quảng Nam",
  "Bình Định",
  "Quảng Ngãi",
];

export default function FeaturedListings() {
  const [city, setCity] = useState("Tất cả");

  const listings =
    city === "Tất cả"
      ? featuredListings.slice(0, 12)
      : featuredListings.filter((l) => l.location.includes(city));

  return (
    <section className="bg-cl-ink">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-3xl font-bold text-white">
            Bất động sản dành cho bạn
          </h2>
          <Link
            href="/mua-ban"
            className="shrink-0 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Xem tất cả →
          </Link>
        </div>

        {/* Tabs lọc theo địa điểm */}
        <div className="mt-5 flex flex-wrap gap-2">
          {cityTabs.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCity(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                city === c
                  ? "bg-white text-cl-ink"
                  : "border border-white/15 text-white/70 hover:border-white/40 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {listings.length > 0 ? (
          <div className="cards-stagger mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((item) => (
              <PropertyCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-white/50">
            Đang cập nhật tin đăng tại khu vực này...
          </p>
        )}
      </div>
    </section>
  );
}
