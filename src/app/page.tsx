import type { Metadata } from "next";
import Header from "@/components/Header";
import TimTrangChu from "@/components/TimTrangChu";
import FeaturedListings from "@/components/FeaturedListings";
import ProjectsSection from "@/components/ProjectsSection";
// import ForYou from "@/components/ForYou"; // TẠM ẨN — chờ chốt vị trí đặt lại (component vẫn còn)
import LocationGrid from "@/components/LocationGrid";
import NewsSection from "@/components/NewsSection";
// import PromoBanner from "@/components/PromoBanner";   // thay bằng AdBannerSeller (mẫu Apple) — khôi phục nếu cần
// import AppDownload from "@/components/AppDownload";   // thay bằng AdBannerApp (mẫu Apple) — khôi phục nếu cần
import Footer from "@/components/Footer";
import TimKiemPhoBien from "@/components/TimKiemPhoBien";
import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import { getListingsThe } from "@/lib/listingsDb";
import { chonTinTrangChu } from "@/lib/tinNoiBat";
import { getArticles, getProjects } from "@/lib/contentDb";
import { getHomeAreas, getFeaturedArticleSlug } from "@/lib/siteContent";

// Tiêu đề trang chủ phải CÓ TỪ KHOÁ — trước đây để trống nên Google chỉ thấy
// "COASTAL LAND", không hiểu trang này bán gì, ở đâu.
export const metadata: Metadata = {
  title: "Cổng thông tin mua bán, cho thuê nhà đất | COASTAL LAND",
  description:
    "Cổng thông tin mua bán, cho thuê nhà đất, căn hộ, đất nền và dự án. Tin hình thật, liên hệ trực tiếp người đăng, lọc theo khu vực, loại hình, mức giá.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  // B2: tin từ Supabase (bảng listings) — chưa có bảng/lỗi → tự dùng dữ liệu mẫu
  // Dự án + Tin tức: nội dung admin tự tạo (contentDb) — chưa có → mẫu
  // Khu vực (Hero ảnh và banner cuối đã bỏ 17/10/2026 — không giúp SEO, không giúp tìm tin): ảnh/chữ admin sửa được (siteContent) — chưa nhập → mặc định
  const [listings, projects, articles, homeAreas, featuredSlug] = await Promise.all([
    getListingsThe(), getProjects(), getArticles(), getHomeAreas(),
    getFeaturedArticleSlug(),
  ]);
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* H1 CỦA TRANG CHỦ — chỉ dành cho Google và trình đọc màn hình, KHÔNG hiện
            trên màn hình (sr-only) nên bố cục đã duyệt giữ nguyên tuyệt đối.
            Vì sao cần: trang chủ trước đây không có thẻ <h1> nào, chỉ có h2/h3 — mà
            H1 chính là câu trả lời cho "trang này nói về cái gì". Thiếu nó là bỏ không
            một điểm cộng miễn phí, nhất là khi đang chạy Google Ads (bot chấm trang
            đích đọc cấu trúc tiêu đề). Câu chữ trùng đúng câu định vị chuẩn ở layout. */}
        <h1 className="sr-only">COASTAL LAND — Cổng thông tin mua bán, cho thuê nhà đất</h1>
        <HomeExpandProvider>
          {/* BỘ LỌC LÀ HERO (chủ dự án 17/10/2026: bỏ Hero ảnh, "bộ lọc giờ là Hero" — trọng tâm, dễ dùng,
              trực quan). Bộ tìm 3 bước kiểu Airbnb — TimTrangChu. Ẩn khi một khối "Xem thêm" đang mở. */}
          <HomeCollapsible>
            <section className="border-b border-cvr-line bg-cvr-surface px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
              <TimTrangChu />
            </section>
          </HomeCollapsible>

          {/* 4 khối có nút "Xem thêm" — mỗi khối tự ẩn khi khối khác đang mở.
              Không bọc Reveal: Reveal ẩn/hiện theo cuộn sẽ đá nhau với cơ chế mở rộng. */}
          {/* Chỉ chở đúng số tin khối này hiện (20 tin mỗi tab) — 16/10/2026, trang chủ 632KB */}
          <FeaturedListings items={chonTinTrangChu(listings)} />
          <ProjectsSection projects={projects} articles={articles} />
          {/* "Dành riêng cho bạn" TẠM ẨN theo yêu cầu — mở lại: bỏ comment import ForYou + khối này.
          <ForYou /> */}
          <LocationGrid areas={homeAreas} />
          <NewsSection articles={articles} featuredSlug={featuredSlug} />

        </HomeExpandProvider>
        {/* Kế hoạch Airbnb GĐ A — docs/KE-HOACH-AIRBNB.md */}
        <TimKiemPhoBien />
      </main>
      <Footer />
    </>
  );
}
