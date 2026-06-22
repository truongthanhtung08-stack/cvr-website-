"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { featuredListings, type Listing } from "@/lib/data";
import { useSaved } from "@/lib/useSaved";

export default function SavedClient() {
  const { ids } = useSaved();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = ids
    .map((id) => featuredListings.find((l) => l.id === id))
    .filter((x): x is Listing => Boolean(x));

  if (!mounted) {
    return <p className="mt-8 text-sm text-white/50">Đang tải tin đã lưu…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-20 text-center">
        <svg className="mb-4 h-12 w-12 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <p className="text-white/70">Bạn chưa lưu tin nào.</p>
        <p className="mt-1 text-sm text-white/45">Bấm biểu tượng trái tim ❤ trên mỗi tin để lưu lại xem sau.</p>
        <Link href="/mua-ban" className="mt-5 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-cl-ink transition hover:bg-white/90">
          Khám phá nhà đất
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-4 text-sm text-white/70">
        <span className="font-bold text-white">{items.length}</span> tin đã lưu
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {items.map((item) => (
          <PropertyCard key={item.id} item={item} layout="list" />
        ))}
      </div>
    </>
  );
}
