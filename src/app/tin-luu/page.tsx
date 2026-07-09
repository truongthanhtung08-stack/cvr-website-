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
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-cvr-muted">
            <Link href="/" className="hover:text-cvr-ink">Trang chủ</Link>
            <span>/</span>
            <span className="text-cvr-body">Tin đã lưu</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Tin đã lưu</h1>
          <p className="mt-1.5 text-sm text-cvr-muted">Những bất động sản bạn đã lưu để xem lại — lưu ngay trên trình duyệt này.</p>

          <SavedClient />
        </div>
      </main>
      <Footer />
    </>
  );
}

