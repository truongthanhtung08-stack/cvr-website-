import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchClient from "@/components/SearchClient";
import { getListings } from "@/lib/listingsDb";

export const metadata: Metadata = {
  alternates: { canonical: "/tim-kiem" },
  // Google khuyến cáo KHÔNG lập chỉ mục trang kết quả tìm kiếm nội bộ: mỗi tổ hợp
  // bộ lọc sinh ra một địa chỉ khác nhau (?q=&kv=&loai=…) → hàng nghìn trang gần
  // giống nhau, làm loãng chất lượng site. Khách vẫn dùng bình thường; các đường
  // dẫn danh mục (/mua-ban/can-ho-chung-cu…) mới là trang để Google xếp hạng.
  robots: { index: false, follow: true },
  title: "Tìm kiếm bất động sản",
  description:
    "Tìm nhà đất, căn hộ, đất nền, dự án tại Đà Nẵng, Huế và Miền Trung — lọc theo khu vực, loại hình, mức giá.",
};

// Đọc tin thật từ Supabase (no-store) → BẮT BUỘC render động, không static.
export const dynamic = "force-dynamic";

export default async function TimKiemPage() {
  const listings = await getListings(); // tin THẬT từ Supabase (fallback mẫu khi lỗi)
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 text-cvr-muted sm:px-6 lg:px-8">
              Đang tải bộ tìm kiếm…
            </div>
          }
        >
          <SearchClient items={listings} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
