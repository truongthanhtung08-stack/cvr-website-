import Image from "next/image";
import Link from "next/link";
import { anhNho } from "@/lib/asset";

// CỘT PHẢI TRANG DỰ ÁN — "Dự án cập nhật": CỐ ĐỊNH 10 dự án, xếp sẵn ở máy chủ theo CẤP VIP (Diamond → Gold → Silver → Basic), cùng cấp
// thì ngày cập nhật mới nhất. Không "Xem thêm" (anh 08/11/2026: "fix 10 dự án theo cấp VIP thôi, để xem thêm xổ xuống dài quá").
export type DuAnGon = { slug: string; name: string; image: string; diaChi: string };

export default function DuAnKhacCot({ ds }: { ds: DuAnGon[] }) {
  if (!ds.length) return null;
  return (
    <div className="hidden rounded-2xl border border-cvr-line bg-white p-4 lg:block lg:p-5">
      <p className="text-base font-semibold tracking-tight text-cvr-ink">Dự án cập nhật</p>
      <div className="mt-2 flex flex-col divide-y divide-cvr-line/70">
        {ds.slice(0, 10).map((d) => (
          <Link key={d.slug} href={`/du-an/${d.slug}`} className="group flex items-center gap-3 py-3 last:pb-0">
            <span className="relative aspect-[1.618/1] w-20 shrink-0 overflow-hidden rounded-md bg-cvr-surface">
              {d.image && <Image src={anhNho(d.image)} alt={d.name} fill sizes="80px" className="object-cover" />}
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">{d.name}</span>
              {d.diaChi && <span className="mt-0.5 line-clamp-1 block text-xs text-cvr-faint">{d.diaChi}</span>}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
