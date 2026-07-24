import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedListings from "@/components/FeaturedListings";
import ProjectsSection from "@/components/ProjectsSection";
// import ForYou from "@/components/ForYou"; // TẠM ẨN — chờ chốt vị trí đặt lại (component vẫn còn)
import LocationGrid from "@/components/LocationGrid";
import NewsSection from "@/components/NewsSection";
// import PromoBanner from "@/components/PromoBanner";   // thay bằng AdBannerSeller (mẫu Apple) — khôi phục nếu cần
// import AppDownload from "@/components/AppDownload";   // thay bằng AdBannerApp (mẫu Apple) — khôi phục nếu cần
import { AdBannerSeller, AdBannerApp } from "@/components/HomeAdBanners";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { getListings } from "@/lib/listingsDb";
import { getArticles, getProjects } from "@/lib/contentDb";
import { getHeroBanners, getHomeAd, getHomeAreas } from "@/lib/siteContent";

export default async function Home() {
  // B2: tin từ Supabase (bảng listings) — chưa có bảng/lỗi → tự dùng dữ liệu mẫu
  // Dự án + Tin tức: nội dung admin tự tạo (contentDb) — chưa có → mẫu
  // Hero + 2 banner cuối + khu vực: ảnh/chữ admin sửa được (siteContent) — chưa nhập → mặc định
  const [listings, projects, articles, heroBanners, homeAd, homeAreas] = await Promise.all([
    getListings(), getProjects(), getArticles(), getHeroBanners(), getHomeAd(), getHomeAreas(),
  ]);
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero: khung GIỮ NGUYÊN — ảnh PHỦ KÍN khung (cover), không hụt 2 bên */}
        <Hero banners={heroBanners} />
        {/* Không bọc Reveal: section này ló ngay dưới banner (above-the-fold),
            cần hiện tức thì để tạo kết nối — tránh bị "vùng chết" của Reveal ẩn đi. */}
        <FeaturedListings items={listings} />
        <Reveal>
          <ProjectsSection projects={projects} />
        </Reveal>
        {/* "Dành riêng cho bạn" TẠM ẨN theo yêu cầu — mở lại: bỏ comment import ForYou + khối này.
        <Reveal>
          <ForYou />
        </Reveal> */}
        <Reveal>
          <LocationGrid areas={homeAreas} />
        </Reveal>
        <Reveal>
          <NewsSection articles={articles} />
        </Reveal>
        {/* KHÔNG bọc Reveal: 2 banner cuối đứng yên, không hiệu ứng hiện dần */}
        <AdBannerSeller data={homeAd.seller} />
        {/* KHÔNG bọc Reveal: banner App phải đứng yên tuyệt đối (yêu cầu: bỏ hiệu ứng cụm iPhone) */}
        <AdBannerApp data={homeAd.app} />
      </main>
      <Footer />
    </>
  );
}
