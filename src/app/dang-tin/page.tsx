import type { Metadata, ResolvingMetadata } from "next";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KhungDangTin from "@/components/KhungDangTin";

// ẢNH ĐẠI DIỆN KHI DÁN LIÊN KẾT /dang-tin lên Facebook, Zalo (anh chọn mẫu 1 xanh biển 14/11/2026, phiên Thiết kế làm): ảnh
// "Đăng tin mua bán, cho thuê nhà đất" + nút Đăng tin. Chỉ trang này đổi ảnh; tiêu đề, mô tả chia sẻ giữ như mọi trang (lấy từ layout).
const ANH_DAI_DIEN = { url: "/images/anh-dai-dien-dang-tin.jpg", width: 1200, height: 630, alt: "Đăng tin mua bán, cho thuê nhà đất — COASTAL LAND" };
export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  const p = await parent;
  return {
    alternates: { canonical: "/dang-tin" },
    title: "Đăng tin bất động sản",
    description: "Đăng tin bán / cho thuê nhà đất trên Coastal Land — biểu mẫu đầy đủ thuộc tính theo loại hình, tin được duyệt nhanh.",
    openGraph: { ...p.openGraph, url: "/dang-tin", images: [ANH_DAI_DIEN] },
    twitter: { ...p.twitter, images: [ANH_DAI_DIEN.url] },
  };
}

export default function DangTinPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Đăng tin", href: "/dang-tin" }]} />
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto w-full max-w-4xl overflow-x-clip px-4 pt-5 pb-footer sm:px-6 sm:pt-8 lg:max-w-6xl lg:px-8">
          {/* Tiêu đề gọn (chủ dự án 22/10/2026: "Tạo tin đăng", bớt khoảng trắng trên dưới) */}
          <h1 className="text-center text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Tạo tin đăng</h1>

          <div className="mt-4">
            {/* Suspense: form đọc ?id= (chế độ sửa tin) bằng useSearchParams */}
            <Suspense fallback={<p className="py-16 text-center text-sm text-cvr-muted">Đang tải…</p>}>
              <KhungDangTin />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

