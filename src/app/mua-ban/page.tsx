import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TimKiemPhoBien from "@/components/TimKiemPhoBien";
import { ListingListJsonLd } from "@/components/ListJsonLd";
import ListingBrowser from "@/components/ListingBrowser";
import { goiNheBaiViet } from "@/lib/goiNhe";
import KhungChoDanhMuc from "@/components/KhungChoDanhMuc";
import KhuVucLinks from "@/components/KhuVucLinks";
import { getListings } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";
import { thangHienTai } from "@/lib/thang";

// Tiêu đề kèm tháng (chủ dự án chốt 15/10/2026) → phải tính lúc dựng trang, không để hằng số.
export async function generateMetadata(): Promise<Metadata> {
  return {
  alternates: { canonical: "/mua-ban" },
    title: `Mua bán nhà đất ${thangHienTai()}`,
  description: "Tin mua bán nhà đất, căn hộ, đất nền, nhà phố, biệt thự, condotel — hình thật, liên hệ trực tiếp người đăng, lọc theo khu vực, loại hình, mức giá.",
  };
}

// ── ĐẾM TIN THEO TỈNH — cho khối "Nhà đất bán theo khu vực" cuối trang ──────
// Tách ra hàm dùng chung vì cả trang này lẫn trang danh mục con đều cần.
const tinhCua = (location: string) => location.split(",").pop()?.trim() ?? "";
function demTheoTinh(items: { location: string }[]): [string, number][] {
  const m = new Map<string, number>();
  for (const l of items) {
    const t = tinhCua(l.location);
    if (t) m.set(t, (m.get(t) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function MuaBanPage() {
  // B2: tin từ Supabase (fallback dữ liệu mẫu) + bài viết cho cột phải
  const [listings, articles] = await Promise.all([getListings(), getArticles()]);
  const tinBan = listings.filter((l) => (l.purpose ?? "ban") === "ban");
  return (
    <>
      <ListingListJsonLd items={tinBan} heading={`Mua bán nhà đất ${thangHienTai()}`} path="/mua-ban" />
      <Header />
      <main className="flex-1 bg-white">
        {/* Khung chờ: CHỈ cao bằng thanh lọc thật (không pt-32 như trước — đó chính là
            mảng trắng 128px nằm ngay dưới header lúc trang đang tải).
            Khung chờ này kiêm luôn phần nội dung MÁY CHỦ dựng sẵn cho Google đọc —
            xem lý do đầy đủ trong KhungChoDanhMuc.tsx. */}
        <Suspense
          fallback={
            <KhungChoDanhMuc
              heading={`Mua bán nhà đất ${thangHienTai()}`}
              moTa="Tin bán nhà riêng, căn hộ chung cư, đất nền, nhà mặt phố và biệt thự. Lọc theo tỉnh, phường/xã, dự án, loại hình, khoảng giá và diện tích."
              items={tinBan}
            />
          }
        >
          <ListingBrowser purpose="ban" heading={`Mua bán nhà đất ${thangHienTai()}`} nguon="ban" choTai={<KhungChoDanhMuc heading={`Mua bán nhà đất ${thangHienTai()}`} moTa="Tin bán nhà riêng, căn hộ chung cư, đất nền, nhà mặt phố và biệt thự. Lọc theo tỉnh, phường/xã, dự án, loại hình, khoảng giá và diện tích." items={tinBan} />} articles={goiNheBaiViet(articles)} />
        </Suspense>
        {/* ĐƯỜNG BÒ TỚI TRANG KHU VỰC — khối này trang danh mục con đã dùng từ lâu,
            chỉ trang gốc là chưa có. Đo ngày 18/09/2026: /mua-ban/da-nang và
            /mua-ban/hue bị Google báo "URL is unknown to Google" — chưa từng biết
            đến, dù nằm trong sitemap. Thiếu liên kết nội bộ là trang coi như
            không tồn tại. Đặt ở đây để Google (và khách) có lối sang. */}
        <KhuVucLinks base="/mua-ban" demTheoTinh={demTheoTinh(tinBan)} />
        <TimKiemPhoBien muc="ban" />
      </main>
      <Footer />
    </>
  );
}

