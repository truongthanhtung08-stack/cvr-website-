import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchClient from "@/components/SearchClient";

export const metadata: Metadata = {
  title: "Tìm kiếm bất động sản | Central Land",
  description:
    "Tìm nhà đất, căn hộ, đất nền, dự án tại Đà Nẵng, Huế và Miền Trung — lọc theo khu vực, loại hình, mức giá.",
};

export default function TimKiemPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 pb-20 pt-32 text-white/50 sm:px-6 lg:px-8">
              Đang tải bộ tìm kiếm…
            </div>
          }
        >
          <SearchClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
