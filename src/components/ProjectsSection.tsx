import Image from "next/image";
import Link from "next/link";
import { projects } from "@/lib/data";

export default function ProjectsSection() {
  return (
    <section className="border-t border-white/5 bg-cl-charcoal">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Dự án nổi bật
          </h2>
          <Link
            href="/du-an"
            className="shrink-0 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="cards-stagger mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((p) => (
            <Link
              key={p.name}
              href="/du-an"
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:-translate-y-1 hover:border-white/30"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-cl-ink">
                  {p.status}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-bold leading-snug text-white">{p.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-white/50">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {p.location}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs text-white/60">{p.type}</span>
                  <span className="text-sm font-bold text-white">{p.priceFrom}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
