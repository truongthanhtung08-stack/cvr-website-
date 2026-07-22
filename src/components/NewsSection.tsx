import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/data";

// Khối Tin tức trang chủ — cấu trúc kiểu Batdongsan:
// BÀI NỔI BẬT lớn bên trái (ảnh + tiêu đề + mô tả) + CỘT TIÊU ĐỀ tin mới bên phải
// (chỉ chữ, ngăn dòng kẻ — gọn, lướt nhanh). Giao diện thẻ Apple (trắng + shadow-lux).
// Bài viết do trang cha truyền vào (đọc từ Supabase — admin đăng gì hiện nấy).
export default function NewsSection({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  const [featured, ...rest] = articles;
  const headlines = rest.slice(0, 6);

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-cvr-ink">Tin tức</h2>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Bài nổi bật */}
          <Link
            href={`/tin-tuc/${featured.slug}`}
            className="card-lux group relative flex flex-col overflow-hidden rounded-none border border-cvr-line bg-white shadow-lux shadow-lux-hover hover:-translate-y-1"
          >
            <span className="card-sheen" aria-hidden />
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="flex items-center gap-2 text-xs text-cvr-muted">
                <span className="rounded-full bg-cvr-surface px-2.5 py-0.5 font-medium text-cvr-body">{featured.category}</span>
                <span>{featured.date}</span>
              </p>
              <h3 className="mt-2.5 line-clamp-2 text-lg font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:text-xl">
                {featured.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-cvr-muted">{featured.excerpt}</p>
            </div>
          </Link>

          {/* Cột tiêu đề tin mới — mỗi dòng giãn đều theo chiều cao bài nổi bật */}
          <div className="flex flex-col divide-y divide-cvr-line/70 rounded-none border border-cvr-line bg-white px-5 py-1.5 shadow-lux">
            {headlines.map((a) => (
              <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex flex-1 flex-col justify-center py-3">
                <h3 className="line-clamp-2 font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                  {a.title}
                </h3>
                <p className="mt-1 text-xs text-cvr-muted">{a.category} · {a.date}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Xem thêm — cuối phần, canh phải (đồng bộ các section khác) */}
        <div className="mt-5 flex justify-end">
          <Link href="/tin-tuc" className="text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
            Xem tất cả →
          </Link>
        </div>
      </div>
    </section>
  );
}
