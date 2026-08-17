import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { agencies } from "@/lib/experts";

export const metadata: Metadata = {
  alternates: { canonical: "/chuyen-gia/cong-ty" },
  title: "Sàn giao dịch & công ty bất động sản",
  description: "Danh sách sàn giao dịch và công ty bất động sản đối tác của Coastal Land tại Đà Nẵng và Huế.",
};

export default function CongTyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Sàn giao dịch & công ty BĐS</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-cvr-muted">Các sàn giao dịch, công ty bất động sản đối tác của Coastal Land tại Đà Nẵng và Huế.</p>

          {/* Chưa có sàn/công ty đối tác thật nào → nói rõ đang cập nhật. Trước đây
              chỗ này liệt kê 4 công ty bịa kèm số chuyên gia và năm thành lập tự
              nghĩ ra, trong đó có 2 "chi nhánh Coastal Land" không tồn tại.
              Lý do đầy đủ: src/lib/experts.ts */}
          {agencies.length === 0 && (
            <div className="mt-6 rounded-none border border-cvr-line bg-cvr-surface px-6 py-12 text-center">
              <p className="text-[15px] font-semibold text-cvr-ink">Danh sách đang được cập nhật</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-cvr-muted">
                Coastal Land đang kết nối với các sàn giao dịch và công ty bất động sản
                tại Đà Nẵng, Huế. Đơn vị muốn hợp tác xin liên hệ qua trang Đăng ký.
              </p>
              <a
                href="/chuyen-gia/dang-ky"
                className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-cvr-ink px-5 text-sm font-semibold text-white transition hover:bg-cvr-body"
              >
                Đăng ký hợp tác
              </a>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {agencies.map((a) => {
              const initials = a.name.replace(/^Sàn |^Coastal Land.*/, "S").trim().split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
              return (
                <div key={a.slug} className="shadow-lux flex items-center gap-4 rounded-none border border-cvr-line bg-white p-5 transition hover:-translate-y-1 hover:border-cvr-blue/40">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-cvr-ink text-lg font-bold text-white">
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
