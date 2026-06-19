import Image from "next/image";
import Link from "next/link";
import { areas } from "@/lib/data";

export default function LocationGrid() {
  return (
    <section className="section-edge bg-cl-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-serif text-2xl font-bold text-white">
          Bất động sản theo địa điểm
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {areas.map((area) => (
            <Link
              key={area.name}
              href={area.href}
              className="card-lux group relative h-44 overflow-hidden rounded-2xl ring-1 ring-white/5 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/60 hover:ring-white/25"
            >
              <span className="card-sheen z-[3]" aria-hidden />
              <Image
                src={area.image}
                alt={area.name}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.12]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-500 group-hover:from-black/90" />
              <div className="absolute bottom-0 left-0 p-5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1">
                <h3 className="text-xl font-bold text-white">{area.name}</h3>
                <p className="mt-1 text-sm text-white/70">{area.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
