import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/data";

// Danh sách tin DẠNG LIST (kiểu Batdongsan): mỗi tin 1 hàng ngang — ảnh nhỏ bên trái,
// tiêu đề · giá · diện tích · khu vực bên phải. Dùng cho "Tin đăng mới nhất" trang dự án.
export default function ListingList({ items }: { items: Listing[] }) {
  return (
    <ul className="divide-y divide-cvr-line overflow-hidden rounded-none border border-cvr-line bg-white shadow-lux">
      {items.map((l) => (
        <li key={l.id}>
          <Link
            href={`/bat-dong-san/${l.id}`}
            // MOBILE: thẻ DỌC — ảnh trên, nội dung dưới. DESKTOP: giữ hàng ngang.
            className="group flex flex-col gap-3 p-3 transition-colors hover:bg-cvr-surface sm:flex-row sm:gap-4 sm:p-4"
          >
            <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl sm:aspect-[4/3] sm:w-40">
              <Image src={l.image} alt={l.title} fill sizes="(max-width: 640px) 100vw, 160px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className="line-clamp-2 font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                {l.title}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-[16px] font-bold text-red-500">{l.price}</span>
                <span className="text-cvr-muted">{l.area}</span>
                {l.pricePerM2 && <span className="text-cvr-muted">· {l.pricePerM2}</span>}
              </div>
              <p className="mt-auto flex items-center gap-1.5 pt-1.5 text-[13px] text-cvr-muted">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="line-clamp-1">{l.location}</span>
                <span className="ml-1 hidden rounded bg-cvr-surface px-1.5 py-0.5 text-[12px] text-cvr-body sm:inline">{l.type}</span>
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
