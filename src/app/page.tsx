import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedListings from "@/components/FeaturedListings";
import ProjectsSection from "@/components/ProjectsSection";
// import ForYou from "@/components/ForYou"; // TẠM ẨN — chờ chốt vị trí đặt lại (component vẫn còn)
import LocationGrid from "@/components/LocationGrid";
import NewsSection from "@/components/NewsSection";
// import PromoBanner from "@/components/PromoBanner";   // thay bằng AdBannerSeller (mẫu Apple) — khôi phục nếu cần
// import AppDownload from "@/components/AppDownload";   // thay bằng AdBannerApp (mẫu Apple) — khôi phục nếu cần
import { AdBannerAll } from "@/components/HomeAdBanners";
import Footer from "@/components/Footer";
import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import { getListings } from "@/lib/listingsDb";
import { getArticles, getProjects } from "@/lib/contentDb";
import { getHeroBanners, getHomeAd, getHomeAreas, getFeaturedArticleSlug } from "@/lib/siteContent";

// Tiêu đề trang chủ phải CÓ TỪ KHOÁ — trước đây để trống nên Google chỉ thấy
// "COASTAL LAND", không hiểu trang này bán gì, ở đâu.
export const metadata: Metadata = {
  title: "Bất động sản Đà Nẵng, Huế & Miền Trung | COASTAL LAND",
  description:
    "Mua bán, cho thuê nhà đất, căn hộ, đất nền và dự án tại Đà Nẵng, Huế và Duyên hải Miền Trung. Tin đăng hình thật, lọc theo khu vực, loại hình và mức giá — người mua miễn phí trọn đời.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  // B2: tin từ Supabase (bảng listings) — chưa có bảng/lỗi → tự dùng dữ liệu mẫu
  // Dự án + Tin tức: nội dung admin tự tạo (contentDb) — chưa có → mẫu
  // Hero + 2 banner cuối + khu vực: ảnh/chữ admin sửa được (siteContent) — chưa nhập → mặc định
  const [listings, projects, articles, heroBanners, homeAd, homeAreas, featuredSlug] = await Promise.all([
    getListings(), getProjects(), getArticles(), getHeroBanners(), getHomeAd(), getHomeAreas(),
    getFeaturedArticleSlug(),
  ]);
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero: khung GIỮ NGUYÊN — ảnh PHỦ KÍN khung (cover), không hụt 2 bên.
            mobileTwoLine: mobile chỉ 2 dòng text (tiêu đề + phụ đề) canh dưới-trái, không ngắt dòng */}
        <HomeExpandProvider>
          {/* Hero + 2 banner: không có nút "Xem thêm" → ẩn khi bất kỳ khối nào đang mở */}
          <HomeCollapsible>
            <Hero banners={heroBanners} mobileTwoLine />
          </HomeCollapsible>

          {/* 4 khối có nút "Xem thêm" — mỗi khối tự ẩn khi khối khác đang mở.
              Không bọc Reveal: Reveal ẩn/hiện theo cuộn sẽ đá nhau với cơ chế mở rộng. */}
          <FeaturedListings items={listings} />
          <ProjectsSection projects={projects} articles={articles} />
          {/* "Dành riêng cho bạn" TẠM ẨN theo yêu cầu — mở lại: bỏ comment import ForYou + khối này.
          <ForYou /> */}
          <LocationGrid areas={homeAreas} />
          <NewsSection articles={articles} featuredSlug={featuredSlug} />

          {/* 2 banner cuối ĐÃ GỘP thành 1 (mẫu Demo 2 — file 10.08.2026) */}
          <HomeCollapsible>
            <AdBannerAll data={homeAd} />
          </HomeCollapsible>
        </HomeExpandProvider>
      </main>
      <Footer />
    </>
  );
}
