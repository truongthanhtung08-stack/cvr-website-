import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { agencies } from "@/lib/experts";

export const metadata: Metadata = {
  title: "Sàn giao dịch & công ty bất động sản | Coastal Land",
  description: "Danh sách sàn giao dịch và công ty bất động sản đối tác của Coastal Land tại Đà Nẵng và Huế.",
};

export default function CongTyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-cvr-muted">
            <Link href="/" className="hover:text-cvr-ink">Trang chủ</Link>
            <span>/</span>
            <Link href="/chuyen-gia" className="hover:text-cvr-ink">Chuyên gia</Link>
            <span>/</span>
            <span className="text-cvr-body">Sàn & công ty</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Sàn giao dịch & công ty BĐS</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-cvr-muted">Các sàn giao dịch, công ty bất động sản đối tác của Coastal Land tại Đà Nẵng và Huế.</p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {agencies.map((a) => {
              const initials = a.name.replace(/^Sàn |^Coastal Land.*/, "S").trim().split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
              return (
                <div key={a.slug} className="shadow-lux flex items-center gap-4 rounded-2xl border border-cvr-line bg-white p-5 transition hover:-translate-y-1 hover:border-cvr-gold/40">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cvr-ink text-lg font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-cvr-ink">{a.name}</h3>
                    <p className="mt-0.5 text-xs text-cvr-muted">{a.address} · Từ {a.established}</p>
                    <p className="mt-1 text-xs font-medium text-cvr-gold-ink">{a.agents} chuyên gia · {a.city}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
