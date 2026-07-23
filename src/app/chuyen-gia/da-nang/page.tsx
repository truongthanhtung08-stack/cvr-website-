import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExpertsBrowser from "@/components/ExpertsBrowser";

export const metadata: Metadata = {
  title: "Chuyên gia bất động sản tại Đà Nẵng | Coastal Land",
  description: "Danh bạ chuyên gia môi giới bất động sản uy tín tại Đà Nẵng — đã xác minh, nhiều năm kinh nghiệm, hỗ trợ tư vấn và pháp lý.",
};

export default function ChuyenGiaDaNangPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Chuyên gia tại Đà Nẵng</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-cvr-muted">Chuyên gia môi giới am hiểu thị trường Đà Nẵng — căn hộ ven sông, villa biển, đất nền và nhà phố.</p>
          <ExpertsBrowser initialCity="Đà Nẵng" />
        </div>
      </main>
      <Footer />
    </>
  );
}
