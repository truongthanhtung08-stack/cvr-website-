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
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <h2 className="text-xl font-semibold text-cvr-ink sm:text-2xl">Tin tức</h2>

        {/* Các mục tin tức (T19): Pháp lý, Quy hoạch, Tư vấn đầu tư… — cuộn ngang 1 dòng trên mobile */}
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:mt-4 sm:flex-wrap sm:px-0">
          {["Tất cả", "Phân tích thị trường", "Pháp lý", "Quy hoạch", "Tư vấn đầu tư", "Cẩm nang"].map((c, i) => (
            <Link
              key={c}
              href="/tin-tuc"
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                i === 0 ? "bg-cvr-ink text-white" : "border border-black/15 text-cvr-body hover:border-black/40 hover:text-cvr-ink"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

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
              {/* Tin đầu: ưu tiên full tiêu đề (tới 3 dòng) — MOBILE gọn 1 dòng nội dung (T19) */}
              <h3 className="mt-2.5 line-clamp-3 text-lg font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                {featured.title}
              </h3>
              <p className="mt-2 line-clamp-1 text-sm leading-relaxed text-cvr-muted sm:line-clamp-3">{featured.excerpt}</p>
            </div>
          </Link>

          {/* Danh sách tin — mỗi tin: ảnh nhỏ + tiêu đề + mô tả + thể loại/ngày */}
          {headlines.length > 0 && (
          <div className="hidden divide-y divide-cvr-line/70 rounded-none border border-cvr-line bg-white px-5 shadow-lux lg:col-span-3 lg:flex lg:flex-col">
            {headlines.map((a) => (
              <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex flex-1 flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:gap-4 sm:py-4">
                {/* MOBILE: hình TRÊN (tràn ngang), chữ DƯỚI — kiểu Báo Mới (T19). DESKTOP: hình trái. */}
                <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg sm:aspect-[4/3] sm:w-32">
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
                  <p className="mt-1 line-clamp-1 text-sm leading-relaxed text-cvr-muted sm:line-clamp-2">{a.excerpt}</p>
                  <p className="mt-1.5 text-xs text-cvr-faint">{a.category} · {a.date}</p>
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>

        {/* MOBILE: slide 10 tin (ảnh TRÀN VIỀN trên · chữ dưới) + nút Xem thêm. Desktop ẩn. */}
        {rest.length > 0 && (
          <div className="lg:hidden">
            <div className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
              {rest.slice(0, 10).map((a) => (
                <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="flex w-[80%] shrink-0 snap-start flex-col overflow-hidden rounded-none border border-cvr-line bg-white shadow-lux">
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <Image src={a.image} alt={a.title} fill sizes="80vw" className="object-cover" />
                  </div>
                  <div className="p-3">
                    <h3 className="h-[3em] overflow-hidden font-semibold leading-[1.5] text-cvr-ink">{a.title}</h3>
                    <p className="mt-1.5 text-xs text-cvr-faint">{a.category} · {a.date}</p>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/tin-tuc" className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-cvr-line text-[15px] font-semibold text-cvr-ink transition active:bg-cvr-surface">
              Xem thêm tin tức
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        )}

        {/* Xem thêm — DESKTOP giữ nguyên link góc phải */}
        <div className="mt-4 hidden justify-end lg:flex">
          <Link href="/tin-tuc" className="text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
            Xem thêm tin tức →
          </Link>
        </div>
      </div>
    </section>
  );
}
