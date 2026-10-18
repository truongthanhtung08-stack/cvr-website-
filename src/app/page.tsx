import type { Metadata } from "next";
import Header from "@/components/Header";
import { Suspense } from "react";
import TimTrangChu from "@/components/TimTrangChu";
import { goiYTrangChu, tinDem } from "@/lib/goiYTrangChu";
import Hero from "@/components/Hero";
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
import { getListings, getListingsThe } from "@/lib/listingsDb";
import { chonTinTrangChu } from "@/lib/tinNoiBat";
import { getArticles, getProjects } from "@/lib/contentDb";
import { getHeroBanners, getHomeAreas, getFeaturedArticleSlug } from "@/lib/siteContent";

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
  // Hero ảnh + khu vực: ảnh/chữ admin sửa được (siteContent) — chưa nhập → mặc định
  // tinDu: bản đầy đủ (cùng lần đọc có cache) — chỉ dùng ở máy chủ để dựng cụm gợi ý, không gửi xuống máy khách
  const [listings, tinDu, projects, articles, homeAreas, featuredSlug, heroBanners] = await Promise.all([
    getListingsThe(), getListings(), getProjects(), getArticles(), getHomeAreas(),
    getFeaturedArticleSlug(), getHeroBanners(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* H1 CỦA TRANG CHỦ — chỉ cho Google và trình đọc màn hình (sr-only); chủ dự án 17/10/2026 bỏ dòng tiêu đề hiển thị. */}
        <HomeExpandProvider>
          {/* HERO ẢNH + BỘ TÌM MỚI (chủ dự án 18/10/2026: khôi phục Hero theo khung ảnh mới nhất, GIỮ NGUYÊN chức năng bộ tìm
              kiểu Google — chỉ lấy lại giao diện cũ). Khung đã duyệt 08/10: máy tính 7:2 (ảnh 2880×823), điện thoại 2,3:1
              (ảnh 1200×520), ảnh ở /admin/noi-dung. Điện thoại: thanh tìm NGAY TRÊN ảnh (ảnh sạch) · máy tính: bộ tìm ĐÈ LÊN mép
              trên ảnh như Hero cũ. Hero tắt ô tìm riêng (search={false}) — chỉ một bộ tìm. Ẩn khi một khối "Xem thêm" đang mở. */}
          <HomeCollapsible>
            <h1 className="sr-only">Cổng thông tin mua bán, cho thuê nhà đất</h1>
            <div className="relative">
              <div className="bg-white pt-3 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:bg-transparent sm:pt-8">
                {/* Suspense: chạm ô tìm khi trang chưa nạp xong mã → React nạp ô tìm trước, không mất cú chạm đầu */}
                <Suspense>
                  <TimTrangChu goiYTin={goiYTrangChu(tinDu)} tinDem={tinDem(tinDu)} trenAnh />
                </Suspense>
              </div>
              <Hero banners={heroBanners} mobileTwoLine search={false} />
            </div>
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
