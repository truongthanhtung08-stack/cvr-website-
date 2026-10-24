import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SavedClient from "@/components/SavedClient";
import RecentlyViewed from "@/components/RecentlyViewed";
import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";

export const metadata: Metadata = {
  title: "Tin đã lưu",
  description: "Danh sách bất động sản bạn đã lưu để xem lại tại Coastal Land.",
  // Nội dung riêng của từng khách (lưu trong máy) → Googlebot chỉ thấy trang rỗng.
  robots: { index: false, follow: true },
};

export default function TinLuuPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-footer sm:px-6 lg:px-8">
          {/* Một bộ "Xem thêm" cho cả trang: mở danh sách Tin đã lưu thì ẩn tiêu đề trang + khối đã xem, và ngược lại */}
          <HomeExpandProvider>
            <HomeCollapsible>
              <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Tin đã lưu</h1>
            </HomeCollapsible>
            <SavedClient />
            {/* Bất động sản đã xem — khách quay lại xem các tin mình quan tâm (chủ dự án 24/10/2026); chỉ hiện khi có lịch sử xem */}
            <RecentlyViewed boTinDaLuu />
          </HomeExpandProvider>
        </div>
      </main>
      <Footer />
    </>
  );
}

