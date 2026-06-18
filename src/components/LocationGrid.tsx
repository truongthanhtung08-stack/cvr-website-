import Image from "next/image";
import Link from "next/link";
import { areas } from "@/lib/data";

export default function LocationGrid() {
  return (
    <section className="border-t border-white/5 bg-cl-charcoal">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl font-bold text-white">
          Bất động sản theo địa điểm
        </h2>

        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {areas.map((area) => (
            <Link
              key={area.name}
              href={area.href}
              className="group relative h-44 overflow-hidden rounded-2xl"
            >
              <Image
                src={area.image}
                alt={area.name}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
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
