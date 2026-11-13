import type { Metadata } from "next";
import Header from "@/components/Header";
import { Suspense } from "react";
import TimTrangChu from "@/components/TimTrangChu";
import { goiYTrangChu, tinDem } from "@/lib/goiYTrangChu";
import Hero from "@/components/Hero";
import FeaturedListings from "@/components/FeaturedListings";
import ProjectsSection from "@/components/ProjectsSection";
import BaMucChinh from "@/components/BaMucChinh";
// import ForYou from "@/components/ForYou"; // TẠM ẨN — chờ chốt vị trí đặt lại (component vẫn còn)
import LocationGrid from "@/components/LocationGrid";
import NewsSection from "@/components/NewsSection";
// import PromoBanner from "@/components/PromoBanner";   // thay bằng AdBannerSeller (mẫu Apple) — khôi phục nếu cần
// import AppDownload from "@/components/AppDownload";   // thay bằng AdBannerApp (mẫu Apple) — khôi phục nếu cần
import Footer from "@/components/Footer";
import TimKiemPhoBien from "@/components/TimKiemPhoBien";
import { HomeExpandProvider, HomeCollapsible, AnKhiMo } from "@/components/HomeExpand";
import { getListings, getListingsHetHan, getListingsThe } from "@/lib/listingsDb";
import { chonTinTrangChu } from "@/lib/tinNoiBat";
import { getArticles, getProjectsNoiBat } from "@/lib/contentDb";
import { getHeroBanners, getHomeAreas, getFeaturedArticleSlug } from "@/lib/siteContent";
import { THANH_PHO } from "@/lib/pseo";
import { slugKhuVuc } from "@/lib/khuVuc";
import { normalizeVi } from "@/lib/filters";
import { layThuongHieu, tieuDeThuongHieu } from "@/lib/thuongHieu";

// Tiêu đề trang chủ phải CÓ TỪ KHOÁ — trước đây để trống nên Google chỉ thấy
// "COASTAL LAND", không hiểu trang này bán gì, ở đâu.
// Tên + câu thương hiệu từ sheet "Thương hiệu" (src/lib/thuongHieu.ts, 12/11/2026) — mặc định đúng chữ đang chạy.
export async function generateMetadata(): Promise<Metadata> {
  const th = await layThuongHieu();
  return {
  // absolute: trang chủ nằm trong nhóm (trang-chu) nên mẫu "%s | COASTAL LAND" của layout áp thêm → lặp tên (20/10/2026)
  // Tên thương hiệu đứng trước (chủ dự án 24/10/2026: tìm trên Google phải ra "COASTAL LAND" kèm câu, như Batdongsan.com)
  title: { absolute: tieuDeThuongHieu(th) },
  description:
    `${th.cau2}, căn hộ, đất nền và dự án. Tin hình thật, liên hệ trực tiếp người bán, người cho thuê, lọc theo khu vực, loại hình, mức giá.`,
  alternates: { canonical: "/" },
  };
}

export default async function Home() {
  const th = await layThuongHieu();
  // B2: tin từ Supabase (bảng listings) — chưa có bảng/lỗi → tự dùng dữ liệu mẫu
  // Dự án + Tin tức: nội dung admin tự tạo (contentDb) — chưa có → mẫu
  // Hero ảnh + khu vực: ảnh/chữ admin sửa được (siteContent) — chưa nhập → mặc định
  // tinDu: bản đầy đủ (cùng lần đọc có cache) — chỉ dùng ở máy chủ để dựng cụm gợi ý, không gửi xuống máy khách
  const [listings, tinDu, projects, articles, homeAreas, featuredSlug, heroBanners, tinHetHan] = await Promise.all([
    getListingsThe(), getListings(), getProjectsNoiBat(), getArticles(), getHomeAreas(),
    getFeaturedArticleSlug(), getHeroBanners(), getListingsHetHan().catch(() => []),
  ]);

  // 20/10/2026 (trang chủ 603 KB > ngưỡng 450): thẻ chỉ cần phần đầu — bỏ toàn văn bài viết và phần giới thiệu, bảng giá,
  // mặt bằng… của dự án khỏi dữ liệu gửi kèm (ProjectsSection dùng name/slug/type/status/priceFrom/location/image/photos/map).
  const baiThe = articles.map(({ content: _c, ...a }) => a);
  const duAnThe = projects.map(({ scale: _s, amenities: _a, overview: _o, priceTable: _pt, floorPlans: _fp, places: _pl, developerInfo: _di, videos: _v, ...p }) => ({
    // Giữ đoạn giới thiệu đầu + dòng "Giá…" cho thẻ ngang "Xem thêm" (thẻ dự án đang chạy trên web: loại hình · giới thiệu, giá tham khảo)
    ...p, scale: _s.filter((x) => x.label.startsWith("Giá")), amenities: [], overview: _o.slice(0, 1),
    // 27/10/2026: thẻ dự án chạy tối đa 6 ảnh của [image, ...photos] (AnhChay `slice(0, 6)`) → bỏ ảnh thứ 7 trở đi
    ...(p.photos ? { photos: p.photos.slice(0, 6) } : {}),
  }));

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
          {/* ĐIỆN THOẠI: hai khung bọc "trong suốt về bố cục" (contents) để ô tìm DÍNH suốt trang khi cuộn (chủ dự án 02/11/2026: "bộ lọc
              trang chủ cố định khi cuộn vuốt lên xuống") — giao diện không đổi; máy tính giữ nguyên */}
          <HomeCollapsible className="max-sm:contents">
            <h1 className="sr-only">{th.cau2}</h1>
            <div className="relative max-sm:contents">
              {/* NỀN BỘ LỌC trên điện thoại (chủ dự án 01/11/2026: "cần cái nền, kiểu đơn giản để nhìn là biết ngay bộ lọc, cả 4 phần"): dải nền xám nhạt tràn hết bề ngang bao ô tìm + hàng trường lọc; ô tìm, nút trường lọc trắng nổi trên nền — kiểu Google. Máy tính giữ nguyên. */}
              <div className="khoi-loc-dinh bg-cvr-surface pb-0 pt-1 max-sm:sticky max-sm:top-[calc(var(--hdr)+var(--at))] max-sm:z-20 max-sm:shadow-[0_1px_0_rgba(0,0,0,0.08)] max-sm:has-[[data-man-tim].flex]:z-[90] sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:bg-transparent sm:pb-0 sm:pt-8">
                {/* Suspense: chạm ô tìm khi trang chưa nạp xong mã → React nạp ô tìm trước, không mất cú chạm đầu */}
                {/* CHỖ GIỮ Ô TÌM (anh 13/11/2026: "bấm vào ô search giật kinh khủng"): TimTrangChu đọc useSearchParams nên máy chủ
                    không vẽ nó — trước đây khối này trống (cao 4px) tới khi mã chạy xong, ô tìm chèn vào đẩy ảnh đầu trang + 3 nút
                    xuống 50px đúng lúc khách chạm. Nay máy chủ vẽ sẵn ô y hệt (cùng cỡ, cùng chữ) + đoạn ghi nhận cú chạm sớm
                    (data-mo-tim → window.__cvrMoTim, TimTrangChu mở màn tìm khi chạy xong) → không xô, không mất cú chạm. */}
                <Suspense
                  fallback={
                    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                      <div className="pb-1 pt-1.5 sm:hidden">
                        <script dangerouslySetInnerHTML={{ __html: "document.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&t.closest('[data-mo-tim]'))window.__cvrMoTim=1},true)" }} />
                        <button type="button" data-mo-tim className="relative flex h-10 w-full items-center rounded-full bg-white pl-10 pr-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.12)] ring-1 ring-black/12">
                          <svg aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" /></svg>
                          <span className="min-w-0 truncate text-[15px] text-cvr-faint">Tìm nhà đất theo khu vực, dự án…</span>
                        </button>
                      </div>
                    </div>
                  }
                >
                  <TimTrangChu goiYTin={goiYTrangChu(tinDu)} tinDem={tinDem(tinDu)} trenAnh />
                </Suspense>
              </div>
              <Hero banners={heroBanners} mobileTwoLine search={false} />
            </div>
            {/* Ba mảng chính Mua bán · Cho thuê · Dự án NGAY TRÊN dòng "Bất động sản nổi bật" (điện thoại, anh 08/11/2026) — lối vào thẳng trang tổng */}
            <BaMucChinh />
          </HomeCollapsible>

          {/* 4 khối có nút "Xem thêm" — mỗi khối tự ẩn khi khối khác đang mở.
              Không bọc Reveal: Reveal ẩn/hiện theo cuộn sẽ đá nhau với cơ chế mở rộng. */}
          {/* Chỉ chở đúng số tin khối này hiện (20 tin mỗi tab) — 16/10/2026, trang chủ 632KB */}
          <FeaturedListings items={chonTinTrangChu(listings)} />
          {/* "Bất động sản đã xem" ĐÃ BỎ khỏi trang chủ (chủ dự án 24/10/2026) — chỉ giữ ở trang tin: khách mới không thấy,
              hiện sau khi tải nên xô trang, chiếm vị trí số 2 */}
          <ProjectsSection projects={duAnThe} articles={baiThe} />
          {/* "Dành riêng cho bạn" TẠM ẨN theo yêu cầu — mở lại: bỏ comment import ForYou + khối này.
          <ForYou /> */}
          {/* Ô thành phố (Nha Trang, Quy Nhơn…) trỏ thẳng trang thành phố thay cho /mua-ban?tinh= — Search Console 20/10/2026:
              /mua-ban?tinh=Nha Trang có lượt hiện nhưng canonical về /mua-ban nên phí. Tính ở máy chủ, không thêm mã cho máy khách. */}
          {/* THỨ TỰ Ô (anh 13/11/2026): Đà Nẵng (ô lớn, ô đầu) giữ nguyên; các khu vực còn lại xếp theo số tin nhiều → ít */}
          <LocationGrid areas={((ds) => [ds[0], ...ds.slice(1).sort((x, y) => Number(String(y.count).replace(/\D/g, "") || 0) - Number(String(x.count).replace(/\D/g, "") || 0))].filter(Boolean))(homeAreas.map((a) => {
            const ten = decodeURIComponent(a.href.match(/[?&]tinh=([^&]+)/)?.[1] ?? "");
            const tp = ten ? THANH_PHO.find((t) => t.name === ten) : undefined;
            // SỐ TIN THẬT (chủ dự án 31/10/2026: cấm số liệu mẫu — web thật từng hiện "Đà Nẵng 1.240 tin" viết sẵn): đếm tin bán.
            // 06/11/2026 (chủ dự án): GỘP CẢ TỈNH chứa khu vực (Quy Nhơn → cả Gia Lai, Nha Trang → cả Khánh Hòa…) và TÍNH CẢ TIN
            // HẾT HẠN (tin hết hạn vẫn hiện ở trang danh sách). Tỉnh = phần cuối địa chỉ hệ mới, như demTinTheoKhuVuc.
            const tinhO = normalizeVi(tp?.tinh ?? ten);
            const so = ten ? [...tinDu, ...tinHetHan].filter((l) => (l.purpose ?? "ban") === "ban"
              && normalizeVi(l.location.split(",").pop() ?? "") === tinhO).length : null;
            const b = so === null ? a : { ...a, count: `${so.toLocaleString("vi-VN")} tin` };
            return tp ? { ...b, href: `/mua-ban/${slugKhuVuc(tp.tinh)}/${tp.slug}` } : b;
          }))} />
          {/* cuoiTrang: khi đang mở danh sách Tin tức thì Tin tức là khối cuối (khối Tìm kiếm phổ biến ẩn) → cách footer đúng chuẩn */}
          <NewsSection articles={baiThe} featuredSlug={featuredSlug} cuoiTrang />
          {/* Tìm kiếm phổ biến (đường dẫn từ khoá cho Google) ở CUỐI trang chủ, sát footer như Airbnb, Batdongsan — không chen giữa
              nội dung khách đang xem (chủ dự án 25/10/2026: "đưa xuống cuối trang"). Cách khối trên 56 · 24 như mọi khối, tự có lề
              đáy tới footer. Đang mở danh sách Tin tức thì ẩn. */}
          <AnKhiMo khoa="tin-tuc" className="section-edge pt-1"><TimKiemPhoBien trangChu /></AnKhiMo>
        {/* Kế hoạch Airbnb GĐ A — docs/KE-HOACH-AIRBNB.md */}
        </HomeExpandProvider>
      </main>
      <Footer />
    </>
  );
}
