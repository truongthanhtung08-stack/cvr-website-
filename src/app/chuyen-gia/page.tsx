import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExpertsBrowser from "@/components/ExpertsBrowser";

export const metadata: Metadata = {
  alternates: { canonical: "/chuyen-gia" },
  title: "Danh bạ chuyên gia bất động sản Đà Nẵng, Huế",
  description: "Kết nối chuyên gia môi giới bất động sản uy tín, đã xác minh tại Đà Nẵng và Huế — tư vấn khách quan, hỗ trợ pháp lý và giao dịch an toàn.",
};

export default function ChuyenGiaPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Danh bạ chuyên gia</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-cvr-muted">Kết nối trực tiếp chuyên gia môi giới đã được Coastal Land xác minh tại Đà Nẵng & Huế — tư vấn khách quan, hỗ trợ pháp lý, đồng hành toàn giao dịch.</p>
            </div>
            <div className="flex gap-2.5">
              <Link href="/chuyen-gia/cong-ty" className="rounded-lg border border-cvr-line bg-white px-4 py-2.5 text-sm font-semibold text-cvr-ink transition hover:bg-black/5">Sàn & công ty</Link>
              <Link href="/chuyen-gia/dang-ky" className="rounded-lg bg-cvr-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-body">Trở thành chuyên gia</Link>
            </div>
          </div>

          <ExpertsBrowser />
        </div>
      </main>
      <Footer />
    </>
  );
}
