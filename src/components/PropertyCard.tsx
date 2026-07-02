import Image from "next/image";
import Link from "next/link";
import SaveButton from "@/components/SaveButton";
import { listingSummary, type Listing } from "@/lib/data";

const AGENTS = [
  { name: "Trương Thanh Tùng", phone: "0905 123 456" },
  { name: "Nguyễn Thị Hương",  phone: "0901 234 567" },
  { name: "Lê Hoàng Nam",      phone: "0902 345 678" },
];
function getAgent(id: string) {
  return AGENTS[(Math.max(0, parseInt(id, 10) || 1) - 1) % AGENTS.length];
}

function AgentAvatar({ name, size = 6 }: { name: string; size?: number }) {
  const initials = name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-cvr-surface font-bold text-cvr-body ring-1 ring-cvr-line"
      style={{ width: `${size * 4}px`, height: `${size * 4}px`, fontSize: `${size * 1.6}px` }}
    >
      {initials}
    </span>
  );
}

// ── Card lưới — bố cục giống Homedy (.product-item) ──────────────────────────
export default function PropertyCard({
  item,
  layout = "grid",
  showTime = false,
}: {
  item: Listing;
  layout?: "grid" | "list";
  // Hiện "Hôm nay" (thời gian đăng) — chỉ ở trang list (Mua bán/Cho thuê), KHÔNG ở trang chủ.
  showTime?: boolean;
}) {
  if (layout === "list") return <PropertyRow item={item} showTime={showTime} />;
  const agent = getAgent(item.id);

  return (
    <Link
      href={`/bat-dong-san/${item.id}`}
      className="flex flex-col overflow-hidden border border-cvr-line bg-white transition-shadow hover:shadow-md"
    >
      {/* Ảnh */}
      <div className="relative aspect-[4/3] overflow-hidden bg-cvr-surface">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
        {item.badge && (
          <span className={`absolute left-2 top-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            item.badge === "VIP" ? "bg-red-500 text-white" :
            item.badge === "Nổi bật" ? "bg-orange-500 text-white" :
            "bg-green-500 text-white"
          }`}>
            {item.badge}
          </span>
        )}
        <SaveButton id={item.id} className="absolute right-2 top-2" />
        {/* Badge số ảnh kiểu Homedy */}
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
          <CameraIcon />1
        </span>
      </div>

      {/* Nội dung */}
      <div className="flex flex-1 flex-col p-3">

        {/* Tiêu đề — 2 dòng */}
        <h3 className="line-clamp-2 min-h-[2.6rem] text-sm font-semibold uppercase leading-snug text-cvr-ink">
          {item.title}
        </h3>

        {/* Mô tả — 2 dòng */}
        <p className="mt-1 line-clamp-2 min-h-[2.2rem] text-[13px] leading-relaxed text-cvr-muted">
          {listingSummary(item)}
        </p>

        {/* Giá — Diện tích (giá trái · diện tích phải, dãn cách giống Homedy) */}
        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <span className={`text-[13px] ${item.price === "Thỏa thuận" ? "text-cvr-muted" : "text-cvr-ink"}`}>
            {item.price}
          </span>
          <span className="flex items-baseline gap-2 text-[13px] text-cvr-body">
            <span>{item.area}</span>
            {item.pricePerM2 && <span className="text-xs text-cvr-muted">{item.pricePerM2}</span>}
          </span>
        </div>

        {/* Địa chỉ */}
        <p className="mt-1.5 flex items-center gap-1 text-xs text-cvr-muted">
          <PinIcon /><span className="line-clamp-1">{item.location}</span>
        </p>

        {/* Đáy: agent (+ thời gian chỉ ở trang list) */}
        <div className="mt-2.5 flex items-center gap-2 border-t border-cvr-line pt-2.5">
          <AgentAvatar name={agent.name} size={7} />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-cvr-body">{agent.name}</span>
          {showTime && <span className="shrink-0 text-[11px] text-cvr-faint">Hôm nay</span>}
        </div>

      </div>
    </Link>
  );
}

// ── List row ─────────────────────────────────────────────────────────────────
function PropertyRow({ item, showTime = false }: { item: Listing; showTime?: boolean }) {
  const agent = getAgent(item.id);
  return (
    <Link
      href={`/bat-dong-san/${item.id}`}
      className="flex gap-3 overflow-hidden border border-cvr-line bg-white p-2.5 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-48 shrink-0 overflow-hidden bg-cvr-surface">
        <Image src={item.image} alt={item.title} fill sizes="192px" className="object-cover" />
        {item.badge && (
          <span className={`absolute left-2 top-2 px-1.5 py-0.5 text-[10px] font-bold uppercase ${
            item.badge === "VIP" ? "bg-red-500 text-white" :
            item.badge === "Nổi bật" ? "bg-orange-500 text-white" : "bg-green-500 text-white"
          }`}>{item.badge}</span>
        )}
        <SaveButton id={item.id} className="absolute right-2 top-2 h-7 w-7" />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
          <CameraIcon />1
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 text-base font-semibold uppercase leading-snug text-cvr-ink">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-cvr-muted">{listingSummary(item)}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`text-sm ${item.price === "Thỏa thuận" ? "text-cvr-muted" : "text-cvr-ink"}`}>{item.price}</span>
          <span className="text-sm text-cvr-body">{item.area}</span>
          {item.pricePerM2 && <span className="text-[13px] text-cvr-muted">{item.pricePerM2}</span>}
          {item.beds ? <span className="text-[13px] text-cvr-muted">{item.beds} PN</span> : null}
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-cvr-muted"><PinIcon /><span className="truncate">{item.location}</span></p>
        <div className="mt-auto flex items-center gap-2 border-t border-cvr-line pt-2">
          <AgentAvatar name={agent.name} size={7} />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-cvr-body">{agent.name}</span>
          {showTime && <span className="shrink-0 text-[11px] text-cvr-faint">Hôm nay</span>}
        </div>
      </div>
    </Link>
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

function CameraIcon() {
  return (
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 3l-1.5 2H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.5L15 3H9zm3 5a5 5 0 110 10 5 5 0 010-10z" />
    </svg>
  );
}
