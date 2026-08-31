import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExpertsBrowser from "@/components/ExpertsBrowser";

export const metadata: Metadata = {
  alternates: { canonical: "/chuyen-gia/hue" },
  title: "Chuyên gia bất động sản tại Huế",
  description: "Danh bạ chuyên gia môi giới bất động sản uy tín tại Huế — đã xác minh, am hiểu thị trường Cố đô, hỗ trợ tư vấn và pháp lý.",
};

export default function ChuyenGiaHuePage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-footer sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Chuyên gia tại Huế</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-cvr-muted">Chuyên gia môi giới am hiểu thị trường Cố đô Huế — nhà phố, đất nền và biệt thự, liền kề.</p>
          <ExpertsBrowser initialCity="Huế" />
        </div>
      </main>
      <Footer />
    </>
  );
}
