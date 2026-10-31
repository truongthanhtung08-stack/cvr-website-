import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TimKiemPhoBien from "@/components/TimKiemPhoBien";
import { ListingListJsonLd } from "@/components/ListJsonLd";
import ListingBrowser from "@/components/ListingBrowser";
import { goiNheBaiViet } from "@/lib/goiNhe";
import { ketQuaTrangDau } from "@/lib/ketQuaDau";
import KhuVucLinks from "@/components/KhuVucLinks";
import { getListings } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";
import { thangHienTai } from "@/lib/thang";

// Đếm tin theo tỉnh — cho khối "Cho thuê theo khu vực" ở cuối trang.
const tinhCua = (location: string) => location.split(",").pop()?.trim() ?? "";
function demTheoTinh(items: { location: string }[]): [string, number][] {
  const m = new Map<string, number>();
  for (const l of items) {
    const t = tinhCua(l.location);
    if (t) m.set(t, (m.get(t) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

// Tiêu đề kèm tháng (chủ dự án chốt 15/10/2026) → phải tính lúc dựng trang, không để hằng số.
export async function generateMetadata(): Promise<Metadata> {
  return {
  alternates: { canonical: "/cho-thue" },
    title: `Cho thuê nhà đất ${thangHienTai()}`,
  description: "Tin cho thuê căn hộ, nhà nguyên căn, văn phòng, mặt bằng kinh doanh, kho xưởng — hình thật, liên hệ trực tiếp người cho thuê, lọc theo khu vực, loại hình, giá.",
  };
}

export default async function ChoThuePage() {
  // B2: tin từ Supabase (fallback dữ liệu mẫu) + bài viết cho cột phải
  const [listings, articles, ketQuaDau] = await Promise.all([getListings(), getArticles(), ketQuaTrangDau("thue")]);
  const tinThue = listings.filter((l) => (l.purpose ?? "ban") === "thue");
  return (
    <>
      <ListingListJsonLd items={tinThue} heading={`Cho thuê nhà đất ${thangHienTai()}`} path="/cho-thue" />
      <Header />
      <main className="flex-1 bg-white">
        {/* Trang 1 máy chủ dựng sẵn (lib/ketQuaDau, 21/10/2026) — HTML có tin thật khách nhìn thấy */}
        <ListingBrowser purpose="thue" heading={`Cho thuê nhà đất ${thangHienTai()}`} nguon="thue" ketQuaDau={ketQuaDau} articles={goiNheBaiViet(articles)} duongTrang="/cho-thue" />
        {/* Đường bò tới trang khu vực cho thuê — cùng lý do như ở /mua-ban:
            trang /cho-thue/<tỉnh> chưa có liên kết nội bộ nào trỏ tới. */}
        <KhuVucLinks base="/cho-thue" demTheoTinh={demTheoTinh(tinThue)} sat />
        <TimKiemPhoBien muc="thue" />
      </main>
      <Footer />
    </>
  );
}

