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

export default async function Home() {
  // B2: tin từ Supabase (bảng listings) — chưa có bảng/lỗi → tự dùng dữ liệu mẫu
  const listings = await getListings();
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero: khung GIỮ NGUYÊN — ảnh PHỦ KÍN khung (cover), không hụt 2 bên */}
        <Hero />
        {/* Không bọc Reveal: section này ló ngay dưới banner (above-the-fold),
            cần hiện tức thì để tạo kết nối — tránh bị "vùng chết" của Reveal ẩn đi. */}
        <FeaturedListings items={listings} />
        <Reveal>
          <ProjectsSection />
        </Reveal>
        {/* "Dành riêng cho bạn" TẠM ẨN theo yêu cầu — mở lại: bỏ comment import ForYou + khối này.
        <Reveal>
          <ForYou />
        </Reveal> */}
        <Reveal>
          <LocationGrid />
        </Reveal>
        <Reveal>
          <NewsSection />
        </Reveal>
        <Reveal>
          <AdBannerSeller />
        </Reveal>
        <Reveal>
          <AdBannerApp />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
