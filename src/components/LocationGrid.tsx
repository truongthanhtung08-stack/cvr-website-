import Image from "next/image";
import Link from "next/link";
import { areas } from "@/lib/data";

// Bố cục Homedy: gói gọn 2 HÀNG — Đà Nẵng là ô LÕI 2×2, kèm 4 địa điểm
// (Huế, Khánh Hòa, Quảng Ngãi, Gia Lai). Bấm "Xem tất cả" để xem mọi khu vực.
export default function LocationGrid() {
  const shown = areas.slice(0, 5); // [0] = Đà Nẵng (lõi) + 4 ô nhỏ

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-2xl font-bold text-cvr-ink">
          Bất động sản theo khu vực
        </h2>

        {/* 2 hàng gọn: Đà Nẵng ô lõi 2×2 (trái) + 4 ô (2×2 bên phải), cao đều nhau */}
        <div className="mt-5 grid grid-cols-2 gap-4 [grid-auto-rows:11rem] sm:grid-cols-4">
          {shown.map((area, i) => {
            const big = i === 0; // Đà Nẵng — địa điểm lõi
            return (
              <Link
                key={area.name}
                href={area.href}
                className={`card-lux group relative overflow-hidden ring-1 ring-black/5 shadow-lux transition-transform hover:-translate-y-1.5 shadow-lux-hover hover:ring-cvr-gold/40 ${
                  big ? "col-span-2 row-span-2" : ""
                }`}
              >
                <span className="card-sheen z-[3]" aria-hidden />
                <Image
                  src={area.image}
                  alt={area.name}
                  fill
                  sizes={big ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
                  className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.12]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-500 group-hover:from-black/90" />
                <div className="absolute bottom-0 left-0 p-5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1">
                  {big && (
                    <span className="mb-1.5 inline-block bg-cvr-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cvr-ink">
                      Địa điểm nổi bật
                    </span>
                  )}
                  <h3 className={`font-bold text-white ${big ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}>
                    {area.name}
                  </h3>
                  <p className={`mt-1 text-white/70 ${big ? "text-sm" : "text-xs"}`}>{area.count}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Xem tất cả khu vực — cuối phần, canh phải */}
        <div className="mt-5 flex justify-end">
          <Link href="/mua-ban" className="text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
            Xem tất cả khu vực →
          </Link>
        </div>
      </div>
    </section>
  );
}
