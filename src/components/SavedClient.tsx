"use client";

import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { useSaved } from "@/lib/useSaved";
import { useListingsByIds } from "@/lib/useListingsByIds";

export default function SavedClient() {
  const { ids, ready } = useSaved();
  // Tin THẬT lấy từ Supabase theo id đã lưu (id nằm trong máy, tin nằm trên server).
  const { items, loading } = useListingsByIds(ids);

  if (!ready || loading) {
    return <p className="mt-8 text-sm text-cvr-muted">Đang tải tin đã lưu…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-none border border-dashed border-cvr-line py-20 text-center">
        <svg className="mb-4 h-12 w-12 text-cvr-line" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        {/* Có id đã lưu nhưng không tra được tin nào = tin đã bị gỡ hoặc ngừng hiển thị */}
        <p className="text-cvr-body">{ids.length > 0 ? "Những tin bạn lưu không còn hiển thị." : "Bạn chưa lưu tin nào."}</p>
        <p className="mt-1 text-sm text-cvr-muted">
          {ids.length > 0
            ? "Tin có thể đã được gỡ hoặc hết hạn đăng."
            : "Bấm biểu tượng trái tim ❤ trên mỗi tin để lưu lại xem sau."}
        </p>
        <Link href="/mua-ban" className="mt-5 rounded-lg bg-cvr-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          Khám phá nhà đất
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-4 text-sm text-cvr-body">
        <span className="font-bold text-cvr-ink">{items.length}</span> tin đã lưu
      </p>
      {/* MOBILE: thẻ DỌC (ảnh trên, nội dung dưới) · DESKTOP: hàng ngang như cũ */}
      <div className="mt-4 grid grid-cols-1 gap-5 sm:hidden">
        {items.map((item) => (
          <PropertyCard key={item.id} item={item} layout="grid" />
        ))}
      </div>
      <div className="mt-4 hidden flex-col gap-4 sm:flex">
        {items.map((item) => (
          <PropertyCard key={item.id} item={item} layout="list" />
        ))}
      </div>
    </>
  );
}
