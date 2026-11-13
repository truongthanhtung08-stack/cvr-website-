import type { Metadata, ResolvingMetadata } from "next";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KhungDangTin from "@/components/KhungDangTin";
import { metaDangTin } from "./metaDangTin";

// Ảnh đại diện + mô tả khi chia sẻ (mẫu 1; ?mau=2..5 ở dang-tin/mau/[n]): metaDangTin.ts
export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return metaDangTin(parent);
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

