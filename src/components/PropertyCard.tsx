import Image from "next/image";
import Link from "next/link";
import SaveButton from "@/components/SaveButton";
import { listingSummary, type Listing } from "@/lib/data";

function getAgentForListing(id: string) {
  const agents = [
    { name: "Trương Thanh Tùng", role: "Chuyên viên cấp cao" },
    { name: "Nguyễn Thị Hương", role: "Chuyên viên tư vấn" },
    { name: "Lê Hoàng Nam", role: "Chuyên viên dự án" },
  ];
  const idx = Math.max(0, (parseInt(id, 10) || 1) - 1);
  return agents[idx % agents.length];
}

export default function PropertyCard({
  item,
  layout = "grid",
}: {
  item: Listing;
  layout?: "grid" | "list";
}) {
  if (layout === "list") return <PropertyRow item={item} />;

  const agent = getAgentForListing(item.id);

  return (
    <Link
      href={`/bat-dong-san/${item.id}`}
      className="card-lux group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:-translate-y-2 hover:border-cl-gold/40 hover:shadow-2xl hover:shadow-black/60"
    >
      {/* Vệt sáng lướt qua khi hover */}
      <span className="card-sheen" aria-hidden />
      {/* Ảnh */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-90" />
        {item.badge && (
          <span className="absolute left-3 top-3 rounded-md bg-cl-gold px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-cl-ink">
            {item.badge}
          </span>
        )}
        <SaveButton id={item.id} className="absolute right-3 top-3" />
        <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {item.type}
        </span>
      </div>

      {/* Nội dung */}
      <div className="flex min-h-[220px] flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-white">{item.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/70">{listingSummary(item)}</p>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/70">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-white/40">Người đăng</p>
            <p className="font-medium text-white">{agent.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.15em] text-white/40">Liên hệ</p>
            <p className="font-medium text-white">{agent.role}</p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 text-sm font-semibold text-white">
          <span className="text-base sm:text-lg">{item.price}</span>
          <span className="text-sm text-white/60">{item.area}</span>
        </div>
      </div>
    </Link>
  );
}

// ===== Hàng danh sách (kiểu Homedy: ảnh trái – thông tin phải) =====
function PropertyRow({ item }: { item: Listing }) {
  return (
    <Link
      href={`/bat-dong-san/${item.id}`}
      className="card-lux group relative flex gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 hover:border-cl-gold/40 hover:shadow-2xl hover:shadow-black/50 sm:gap-4 sm:p-3"
    >
      <span className="card-sheen" aria-hidden />
      {/* Ảnh trái */}
      <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-xl sm:w-60 md:w-72">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 33vw, 288px"
          className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />
        {item.badge && (
          <span className="absolute left-2 top-2 rounded-md bg-cl-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cl-ink">
            {item.badge}
          </span>
        )}
        <SaveButton id={item.id} className="absolute right-2 top-2 h-8 w-8" />
      </div>

      {/* Thông tin phải */}
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-semibold leading-snug text-white transition-colors group-hover:text-cl-gold-soft sm:text-lg">
            {item.title}
          </h3>
          <div className="shrink-0 text-right">
            <div className="text-base font-medium text-white sm:text-xl">{item.price}</div>
            {item.pricePerM2 && <div className="text-[11px] text-white/45">{item.pricePerM2}</div>}
          </div>
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs text-white/50">
          <PinIcon />
          <span className="truncate">{item.location}</span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/65">
          <Spec icon="area">{item.area}</Spec>
          {item.beds ? <Spec icon="bed">{item.beds} PN</Spec> : null}
          {item.baths ? <Spec icon="bath">{item.baths} WC</Spec> : null}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <span className="rounded-md border border-cl-gold/30 bg-cl-gold/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cl-gold-soft">
            {item.type}
          </span>
        </div>
      </div>
    </Link>
  );
}

function Spec({ icon, children }: { icon: "area" | "bed" | "bath"; children: React.ReactNode }) {
  const d =
    icon === "area"
      ? "M4 8V4h16v4M4 8h16v12H4V8z"
      : icon === "bed"
        ? "M3 12h18M3 12V7a2 2 0 012-2h14a2 2 0 012 2v5M3 12v5m18-5v5"
        : "M4 12h16v3a4 4 0 01-4 4H8a4 4 0 01-4-4v-3zM7 12V6a2 2 0 114 0";
  return (
    <span className="inline-flex items-center gap-1">
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      </svg>
      {children}
    </span>
  );
}

function PinIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
