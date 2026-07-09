"use client";

import Link from "next/link";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { featuredListings } from "@/lib/data";
import { useCompare } from "@/lib/useCompare";

// Thanh SO SÁNH nổi (III.2) — hiện khi đã chọn ≥1 tin. Đặt giữa-dưới để không đè Chatbox.
export default function CompareBar() {
  const { ids, remove, clear, count } = useCompare();
  if (count === 0) return null;

  const items = ids
    .map((id) => featuredListings.find((l) => l.id === id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:px-0">
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-cvr-line bg-white/95 p-2.5 pl-4 shadow-2xl shadow-black/15 backdrop-blur-md">
        <span className="hidden shrink-0 text-sm font-semibold text-cvr-ink sm:block">So sánh</span>

        {/* Thumbnails đã chọn */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {items.map((it) => (
            <div key={it.id} className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg">
              <Image src={asset(it.image)} alt={it.title} fill sizes="56px" className="object-cover" />
              <button
                type="button"
                aria-label="Bỏ khỏi so sánh"
                onClick={() => remove(it.id)}
                className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-md bg-black/70 text-white transition hover:bg-black"
              >
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={clear}
          className="shrink-0 text-xs font-medium text-cvr-muted transition hover:text-cvr-ink"
        >
          Xoá
        </button>
        <Link
          href="/so-sanh"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-cvr-gold px-4 py-2 text-sm font-bold text-cvr-ink transition hover:bg-cvr-gold-soft"
        >
          So sánh ({count})
        </Link>
      </div>
    </div>
  );
}
