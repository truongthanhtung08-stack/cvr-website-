import Image from "next/image";
import Link from "next/link";
import { articles } from "@/lib/data";

export default function NewsSection() {
  return (
    <section className="bg-cl-ink">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Tin tức bất động sản
          </h2>
          <Link
            href="/tin-tuc"
            className="shrink-0 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.title}
              href="/tin-tuc"
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:-translate-y-1 hover:border-white/30"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={a.image}
                  alt={a.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="rounded bg-white/10 px-2 py-0.5 font-medium text-white/80">
                    {a.category}
                  </span>
                  <span>{a.date}</span>
                </div>
                <h3 className="mt-3 line-clamp-2 font-bold leading-snug text-white">
                  {a.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">
                  {a.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
