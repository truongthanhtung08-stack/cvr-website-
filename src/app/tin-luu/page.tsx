import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SavedClient from "@/components/SavedClient";

export const metadata: Metadata = {
  title: "Tin đã lưu | Coastal Land",
  description: "Danh sách bất động sản bạn đã lưu để xem lại tại Coastal Land.",
};

export default function TinLuuPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-white/40">
            <Link href="/" className="hover:text-white/70">Trang chủ</Link>
            <span>/</span>
            <span className="text-white/70">Tin đã lưu</span>
          </nav>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Tin đã lưu</h1>
          <p className="mt-1.5 text-sm text-white/55">Những bất động sản bạn đã lưu để xem lại — lưu ngay trên trình duyệt này.</p>

          <SavedClient />
        </div>
      </main>
      <Footer />
    </>
  );
}

