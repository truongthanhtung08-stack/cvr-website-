import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/data";

// Khối Tin tức trang chủ — cấu trúc kiểu Batdongsan:
// BÀI NỔI BẬT (gọn, 2/5 chiều ngang) bên trái + DANH SÁCH tin bên phải, mỗi tin
// đủ 3 dòng (tiêu đề · mô tả · thể loại/ngày) kèm ảnh nhỏ. Giao diện thẻ Apple.
// Số tin vừa khung trang chủ — phần còn lại xem ở /tin-tuc qua nút "Xem thêm".
export default function NewsSection({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  const [featured, ...rest] = articles;
  const headlines = rest.slice(0, 4); // vừa chiều cao bài nổi bật

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-cvr-ink">Tin tức</h2>

        <div className={`mt-5 grid grid-cols-1 gap-5 ${headlines.length ? "lg:grid-cols-5" : "lg:grid-cols-2"}`}>
          {/* Bài nổi bật */}
          <Link
            href={`/tin-tuc/${featured.slug}`}
            className={`card-lux group relative flex flex-col overflow-hidden rounded-none border border-cvr-line bg-white shadow-lux shadow-lux-hover hover:-translate-y-1 ${headlines.length ? "lg:col-span-2" : ""}`}
          >
            <span className="card-sheen" aria-hidden />
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="flex items-center gap-2 text-xs text-cvr-muted">
                <span className="rounded-full bg-cvr-surface px-2.5 py-0.5 font-medium text-cvr-body">{featured.category}</span>
                <span>{featured.date}</span>
              </p>
              <h3 className="mt-2.5 line-clamp-2 text-lg font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                {featured.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-cvr-muted">{featured.excerpt}</p>
            </div>
          </Link>

          {/* Danh sách tin — mỗi tin: ảnh nhỏ + tiêu đề + mô tả + thể loại/ngày */}
          {headlines.length > 0 && (
          <div className="flex flex-col divide-y divide-cvr-line/70 rounded-none border border-cvr-line bg-white px-5 shadow-lux lg:col-span-3">
            {headlines.map((a) => (
              <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex flex-1 items-center gap-4 py-4">
                <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg sm:w-32">
                  <Image
                    src={a.image}
                    alt={a.title}
                    fill
                    sizes="128px"
                    className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                    {a.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-cvr-muted">{a.excerpt}</p>
                  <p className="mt-1.5 text-xs text-cvr-faint">{a.category} · {a.date}</p>
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>

        {/* Xem thêm — phần tin còn lại nằm ở trang /tin-tuc */}
        <div className="mt-5 flex justify-end">
          <Link href="/tin-tuc" className="text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
            Xem thêm tin tức →
          </Link>
        </div>
      </div>
    </section>
  );
}
