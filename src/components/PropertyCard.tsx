import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/data";

export default function PropertyCard({ item }: { item: Listing }) {
  return (
    <Link
      href={`/bat-dong-san/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/30 hover:shadow-2xl hover:shadow-black/50"
    >
      {/* Ảnh */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {item.badge && (
          <span className="absolute left-3 top-3 rounded-md bg-white px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-cl-ink">
            {item.badge}
          </span>
        )}
        <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {item.type}
        </span>
      </div>

      {/* Nội dung */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-white group-hover:text-white">
          {item.title}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-white">{item.price}</span>
          {item.pricePerM2 && (
            <span className="text-xs text-white/50">{item.pricePerM2}</span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-white/60">
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h16v4M4 8h16v12H4V8z" /></svg>
            {item.area}
          </span>
          {item.beds && (
            <span className="inline-flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M3 12V7a2 2 0 012-2h14a2 2 0 012 2v5M3 12v5m18-5v5" /></svg>
              {item.beds} PN
            </span>
          )}
          {item.baths && (
            <span className="inline-flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16v3a4 4 0 01-4 4H8a4 4 0 01-4-4v-3zM7 12V6a2 2 0 114 0" /></svg>
              {item.baths} WC
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1 border-t border-white/10 pt-3 text-xs text-white/50">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="truncate">{item.location}</span>
        </div>
      </div>
    </Link>
  );
}
