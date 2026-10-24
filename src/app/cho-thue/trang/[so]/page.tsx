import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TimKiemPhoBien from "@/components/TimKiemPhoBien";
import { ListingListJsonLd } from "@/components/ListJsonLd";
import ListingBrowser from "@/components/ListingBrowser";
import { goiNheBaiViet } from "@/lib/goiNhe";
import { ketQuaTrangDau } from "@/lib/ketQuaDau";
import { getArticles } from "@/lib/contentDb";
import { thangHienTai } from "@/lib/thang";

// ============================================================================
// /cho-thue/trang/N — PHÂN TRANG THẬT CHO GOOGLE (24/10/2026)
// Search Console 24/10: 306 trang chưa được Google ghé (240 trang tin). Gốc: ?trang=N máy chủ trả đúng 10 tin của trang 1
// (số trang chỉ áp ở trình duyệt) và canonical về /cho-thue → Google chỉ thấy 10 tin đầu. Trang này dựng sẵn đúng 10 tin của
// trang N, canonical về chính nó → mọi tin có đường dẫn nội bộ Google lần theo được.
// Chi phí: như /cho-thue — trang tĩnh, dựng lại theo bộ nhớ đệm "listings" (1 giờ + khi tin đổi thật); trang chưa dựng
// thì dựng lần đầu có người/Google vào rồi lưu. Không thêm truy vấn Supabase (dùng chung bản đệm getListings).
// ============================================================================

const so = (s: string) => (/^\d+$/.test(s) ? parseInt(s, 10) : 0);

export async function generateStaticParams() {
  const kq = await ketQuaTrangDau("thue").catch(() => null);
  return Array.from({ length: Math.max(0, (kq?.soTrang ?? 1) - 1) }, (_, i) => ({ so: String(i + 2) }));
}

export async function generateMetadata({ params }: { params: Promise<{ so: string }> }): Promise<Metadata> {
  const n = so((await params).so);
  const title = `Cho thuê nhà đất ${thangHienTai()} – Trang ${n}`;
  return {
    title,
    description: `Tin cho thuê căn hộ, nhà nguyên căn, văn phòng, mặt bằng kinh doanh, kho xưởng — trang ${n}. Hình thật, lọc theo khu vực, loại hình, giá.`,
    alternates: { canonical: `/cho-thue/trang/${n}` },
  };
}

export default async function ChoThueTrangPage({ params }: { params: Promise<{ so: string }> }) {
  const n = so((await params).so);
  if (n < 2) notFound();
  const [articles, ketQuaDau] = await Promise.all([getArticles(), ketQuaTrangDau("thue", {}, n)]);
  if (n > ketQuaDau.soTrang) notFound();
  const heading = `Cho thuê nhà đất ${thangHienTai()}`;
  return (
    <>
      <ListingListJsonLd items={ketQuaDau.trang} heading={heading} path={`/cho-thue/trang/${n}`} />
      <Header />
      <main className="flex-1 bg-white">
        <ListingBrowser purpose="thue" heading={heading} nguon="thue" ketQuaDau={ketQuaDau} articles={goiNheBaiViet(articles)} duongTrang="/cho-thue" trangDau={n} />
        <TimKiemPhoBien muc="thue" />
      </main>
      <Footer />
    </>
  );
}
