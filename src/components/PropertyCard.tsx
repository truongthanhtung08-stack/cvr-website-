import Image from "next/image";
import Link from "next/link";
import SaveButton from "@/components/SaveButton";
import CompareButton from "@/components/CompareButton";
import { listingSummary, type Listing } from "@/lib/data";
import { tierFromBadge, getTier } from "@/lib/packages";

// Tên NGƯỜI ĐĂNG hiển thị trên thẻ: lấy từ tin thật (details.contact.name —
// là tên KHÁCH HÀNG kể cả khi admin đăng giùm). Tin không có tên → "Coastal Land".
function agentNameOf(item: Listing): string {
  return item.agentName?.trim() || "Coastal Land";
}

function AgentAvatar({ name, src, size = 6 }: { name: string; src?: string; size?: number }) {
  const dim = `${size * 4}px`;
  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={name}
        className="shrink-0 rounded-full object-cover ring-1 ring-cvr-line"
        style={{ width: dim, height: dim }}
      />
    );
  }
  const initials = name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-cvr-surface font-bold text-cvr-body ring-1 ring-cvr-line"
      style={{ width: dim, height: dim, fontSize: `${size * 1.6}px` }}
    >
      {initials}
    </span>
  );
}

// ── Card lưới — bố cục giống Homedy (.product-item) ──────────────────────────
// variant theo KÍCH THƯỚC tin trong bảng "Loại tin và đặc điểm":
//   "featured" = Rất lớn (Diamond) · "grid" = Lớn/Trung bình (Gold/Silver) · "mini" = Nhỏ nhất (Basic)
//   "tier" = thẻ CÙNG KÍCH THƯỚC, phân cấp bằng NỘI DUNG: màu tiêu đề + số dòng mô tả
//            (Diamond 2 · Gold 1 · Silver/Basic 0) + hiện thành viên (chỉ Diamond/Gold).
export default function PropertyCard({
  item,
  layout = "grid",
  variant = "grid",
  showTime = false,
}: {
  item: Listing;
  layout?: "grid" | "list";
  variant?: "featured" | "grid" | "mini" | "tier";
  // Hiện "Hôm nay" (thời gian đăng) — chỉ ở trang list (Mua bán/Cho thuê), KHÔNG ở trang chủ.
  showTime?: boolean;
}) {
  if (layout === "list") return <PropertyRow item={item} showTime={showTime} />;
  const agentName = agentNameOf(item);
  // Hạng CVR của tin (từ huy hiệu VIP/Nổi bật/Mới). Tin không huy hiệu → tin thường.
  const tier = item.badge ? getTier(tierFromBadge(item.badge)) : null;
  const isFeatured = variant === "featured";
  const isMini = variant === "mini";
  const isTier = variant === "tier";
  const tierId = tier?.id ?? "basic";
  // Lượng nội dung theo cấp (variant "tier") — các variant khác giữ nguyên hành vi cũ.
  // Diamond & Gold: 2 dòng · Silver: 1 dòng · Basic: 0 dòng (theo cấp VIP thành viên).
  const descLines = isTier ? (tierId === "diamond" || tierId === "gold" ? 2 : tierId === "silver" ? 1 : 0) : isMini ? 0 : 2;
  // Thẻ trang chủ (tier): MỌI cấp đều hiện thông tin thành viên ở đáy (kể cả Silver/Basic)
  // để thẻ không bị trống — đồng bộ với tin VIP (yêu cầu T19 mobile).
  const showAgent = isTier ? true : !isMini;

  return (
    <Link
      href={`/bat-dong-san/${item.id}`}
      // Khung thẻ Apple thuần: viền tóc cvr-line + bóng mềm — KHÔNG viền màu theo cấp.
      // Cấp tin thể hiện qua huy hiệu + màu TIÊU ĐỀ (đúng bảng đặc điểm), không tô khung.
      className="flex flex-col overflow-hidden rounded-none border-0 bg-white shadow-lux shadow-lux-hover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 sm:border sm:border-cvr-line"
    >
      {/* Ảnh — Diamond khung rộng hơn (rất lớn), còn lại 4/3 */}
      {/* Thẻ trang chủ (tier) trên MOBILE: ảnh 16/10 thấp hơn để màn hình đầu thấy trọn thẻ */}
      <div className={`relative overflow-hidden bg-cvr-surface ${isFeatured ? "aspect-[16/10]" : isTier ? "aspect-[16/10]" : "aspect-[16/10]"}`}>
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes={isFeatured ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
          className="object-cover"
        />
        {tier && (
          <span
            className={`absolute left-2 top-2 font-bold uppercase tracking-wide ${isFeatured ? "px-2 py-1 text-[11px]" : "px-1.5 py-0.5 text-[10px]"}`}
            style={{ backgroundColor: tier.accent, color: "#fff" }}
          >
            {tier.short}
          </span>
        )}
        {/* DESKTOP (đã duyệt): GIỮ NGUYÊN Yêu thích + So sánh trên ảnh.
            MOBILE: chỉ So sánh trên ảnh; Yêu thích (tim) chuyển xuống ĐÁY thẻ. */}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <SaveButton id={item.id} className={`hidden sm:flex ${isMini ? "h-7 w-7" : ""}`} />
          <CompareButton id={item.id} className={isMini ? "h-7 w-7" : undefined} />
          {!showAgent && <SaveButton id={item.id} className={`sm:hidden ${isMini ? "h-7 w-7" : ""}`} />}
        </div>
        {/* Badge số ảnh kiểu Homedy */}
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
          <CameraIcon />{item.imageCount || 1}
        </span>
      </div>

      {/* Nội dung */}
      <div className={`flex flex-1 flex-col ${isFeatured ? "p-4" : isMini ? "p-2.5" : "p-3"}`}>

        {/* Tiêu đề — 2 dòng, kiểu chữ theo cấp tin (Diamond/Gold VIẾT HOA) */}
        {/* Tiêu đề: cao ĐÚNG 2 dòng (h-[3em] = 2×leading-1.5) + overflow-hidden →
            dòng 3 bị ẩn HẲN, không lú dấu. (line-clamp-2 của Tailwind build này hỏng.) */}
        <h3
          className={`h-[3em] overflow-hidden font-semibold leading-[1.5] text-cvr-ink ${tier?.uppercase ? "uppercase" : ""} ${
            isFeatured ? "text-lg" : isMini ? "text-sm" : "text-[15px]"
          }`}
          style={tier?.titleColor ? { color: tier.titleColor } : undefined}
        >
          {item.title}
        </h3>

        {/* Mô tả — số dòng theo cấp (Diamond 2 · Gold 1 · Silver/Basic 0) */}
        {descLines > 0 && (
          <p className={`mt-1 text-sm leading-relaxed text-cvr-muted ${
            /* Thẻ trang chủ trên MOBILE: ẩn mô tả cho thẻ gọn, màn hình đầu thấy trọn tin */
            isTier ? "hidden sm:block " : ""
          }${descLines === 1 ? "line-clamp-1" : "line-clamp-2 min-h-[2.2rem]"}`}>
            {listingSummary(item)}
          </p>
        )}

        {/* Giá — Diện tích (giá trái · diện tích phải, dãn cách giống Homedy) */}
        <div className={`flex items-baseline justify-between gap-2 ${isMini ? "mt-1.5" : "mt-2.5"}`}>
          <span className={`font-semibold ${isFeatured ? "text-base" : "text-[15px]"} ${item.price === "Thỏa thuận" ? "text-cvr-muted" : "text-cvr-ink"}`}>
            {item.price}
          </span>
          <span className={`flex items-baseline gap-2 text-cvr-body ${isFeatured ? "text-sm" : "text-[13px]"}`}>
            <span>{item.area}</span>
            {!isMini && item.pricePerM2 && <span className="text-xs text-cvr-muted">{item.pricePerM2}</span>}
          </span>
        </div>

        {/* Địa chỉ */}
        <p className="mt-1.5 flex items-center gap-1 text-[13px] text-cvr-muted">
          <PinIcon /><span className="line-clamp-1">{item.location}</span>
        </p>

        {/* Đáy: thành viên đăng tin — chỉ cấp cao (variant "tier": Diamond/Gold) */}
        {showAgent && (
          <div className={`flex items-center gap-2 border-t border-cvr-line pt-2.5 ${isTier ? "mt-auto" : "mt-2.5"}`}>
            <AgentAvatar name={agentName} src={item.agentAvatar} size={7} />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-cvr-body">{agentName}</span>
            {showTime && <span className="shrink-0 text-[11px] text-cvr-faint">Hôm nay</span>}
            {/* Nút Yêu thích (tim) ở ĐÁY thẻ — CHỈ mobile (desktop giữ tim trên ảnh) */}
            <SaveButton id={item.id} variant="bare" className="h-8 w-8 shrink-0 sm:hidden" />
          </div>
        )}

      </div>
    </Link>
  );
}

// ── List row ─────────────────────────────────────────────────────────────────
function PropertyRow({ item, showTime = false }: { item: Listing; showTime?: boolean }) {
  const agentName = agentNameOf(item);
  const tier = item.badge ? getTier(tierFromBadge(item.badge)) : null;
  return (
    <Link
      href={`/bat-dong-san/${item.id}`}
      // ĐIỆN THOẠI: ảnh TRÊN – nội dung DƯỚI (xếp dọc).
      // MÁY TÍNH: ảnh TRÁI – nội dung PHẢI, ảnh chiếm ~38% bề ngang thẻ.
      className="flex flex-col gap-3 overflow-hidden rounded-none border border-cvr-line bg-white p-2.5 shadow-lux shadow-lux-hover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 sm:flex-row sm:gap-4 sm:p-3"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-cvr-surface sm:aspect-[16/10] sm:w-[30%] sm:min-w-[190px] sm:max-w-[300px]">
        <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, 38vw" className="object-cover" />
        {tier && (
          <span
            className="absolute left-2 top-2 px-1.5 py-0.5 text-[10px] font-bold uppercase"
            style={{ backgroundColor: tier.accent, color: "#fff" }}
          >{tier.short}</span>
        )}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <SaveButton id={item.id} className="h-7 w-7" />
          <CompareButton id={item.id} className="h-7 w-7" />
        </div>
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
          <CameraIcon />{item.imageCount || 1}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3
          className={`h-[3em] overflow-hidden text-sm font-semibold leading-[1.5] text-cvr-ink sm:text-base ${tier?.uppercase ? "uppercase" : ""}`}
          style={tier?.titleColor ? { color: tier.titleColor } : undefined}
        >
          {item.title}
        </h3>
        <p className="mt-1 hidden text-sm leading-relaxed text-cvr-muted sm:line-clamp-2">{listingSummary(item)}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`text-sm ${item.price === "Thỏa thuận" ? "text-cvr-muted" : "text-cvr-ink"}`}>{item.price}</span>
          <span className="text-sm text-cvr-body">{item.area}</span>
          {item.pricePerM2 && <span className="text-[13px] text-cvr-muted">{item.pricePerM2}</span>}
          {item.beds ? <span className="text-[13px] text-cvr-muted">{item.beds} PN</span> : null}
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-cvr-muted"><PinIcon /><span className="truncate">{item.location}</span></p>
        <div className="mt-auto flex items-center gap-2 border-t border-cvr-line pt-2">
          <AgentAvatar name={agentName} src={item.agentAvatar} size={7} />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-cvr-body">{agentName}</span>
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
