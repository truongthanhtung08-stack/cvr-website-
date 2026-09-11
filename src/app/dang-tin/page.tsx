import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostListingForm from "@/components/PostListingForm";

export const metadata: Metadata = {
  alternates: { canonical: "/dang-tin" },
  title: "Đăng tin bất động sản",
  description: "Đăng tin bán / cho thuê nhà đất tại Đà Nẵng, Huế và Miền Trung trên Coastal Land — biểu mẫu đầy đủ thuộc tính theo loại hình, tin được duyệt nhanh.",
};

export default function DangTinPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto w-full max-w-4xl overflow-x-clip px-4 pt-10 pb-footer sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-cvr-ink sm:text-4xl">Đăng tin bất động sản</h1>
          </div>

          <div className="mt-8">
            {/* Suspense: form đọc ?id= (chế độ sửa tin) bằng useSearchParams */}
            <Suspense fallback={<p className="py-16 text-center text-sm text-cvr-muted">Đang tải…</p>}>
              <PostListingForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

