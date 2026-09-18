import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ============================================================================
// TRANG 404 — "KHÔNG TÌM THẤY"
// ----------------------------------------------------------------------------
// Trước ngày 18/09/2026 web không có file này, nên Next trả về trang mặc định
// của nó: một dòng tiếng Anh "404: This page could not be found." trên nền
// trắng, không header, không footer, không lối đi tiếp.
//
// Vì sao phải có (cả ba lý do đều là tiền):
//   1. TIN HẾT HẠN / TIN ĐÃ BÁN: khách bấm từ Google hoặc từ link Zalo cũ vào
//      một tin không còn nữa. Gặp trang trắng tiếng Anh là họ thoát luôn. Gặp
//      trang này thì còn đường đi tiếp sang tin khác cùng nhu cầu.
//   2. GOOGLE: tỷ lệ thoát ngay của một tên miền là tín hiệu chất lượng. Trang
//      404 cụt lủn làm hỏng tín hiệu đó ở đúng nhóm trang nhiều nhất (tin cũ).
//   3. GOOGLE ADS: quảng cáo lỡ trỏ vào đường dẫn hỏng thì bị từ chối trang
//      đích. Trang 404 tử tế giúp tài khoản không bị đánh dấu.
//
// Mã trạng thái HTTP vẫn là 404 (Next tự lo) — điều này BẮT BUỘC phải đúng:
// trả về 200 cho trang không tồn tại ("soft 404") là lỗi SEO nặng.
// ============================================================================

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  // Trang lỗi thì đừng để Google lập chỉ mục, nhưng vẫn cho đi theo liên kết
  // để bot tìm được đường sang các trang còn sống.
  robots: { index: false, follow: true },
};

const LOI_DI = [
  { href: "/mua-ban", nhan: "Nhà đất bán", ta: "Nhà riêng, căn hộ, đất nền đang rao bán" },
  { href: "/cho-thue", nhan: "Nhà đất cho thuê", ta: "Căn hộ, nhà nguyên căn, mặt bằng, văn phòng" },
  { href: "/du-an", nhan: "Dự án", ta: "Dự án tại Đà Nẵng, Huế và Miền Trung" },
  { href: "/tin-tuc", nhan: "Tin tức", ta: "Thị trường, pháp lý, kinh nghiệm mua bán" },
];

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <section className="mx-auto w-full max-w-3xl px-4 pb-20 pt-24 text-center sm:px-6 sm:pb-28 sm:pt-32">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cvr-faint">404</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cvr-ink sm:text-4xl">
            Không tìm thấy trang này
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cvr-muted sm:text-base">
            Có thể tin đã được gỡ, đã bán hoặc đường dẫn bị gõ sai. Bạn thử tìm lại từ các mục
            bên dưới — bất động sản phù hợp thường vẫn còn ở đó.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-lg bg-cvr-ink px-6 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
            >
              Về trang chủ
            </Link>
            <Link
              href="/tim-kiem"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-cvr-line px-6 text-sm font-semibold text-cvr-ink transition hover:border-cvr-ink active:scale-[0.98]"
            >
              Tìm bất động sản
            </Link>
          </div>

          {/* Lối đi tiếp — cũng là đường cho bot Google bò sang trang còn sống */}
          <div className="mt-12 grid gap-4 text-left sm:grid-cols-2">
            {LOI_DI.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="group rounded-2xl border border-cvr-line bg-white p-5 shadow-lux transition hover:-translate-y-0.5 hover:border-cvr-gold"
              >
                <p className="text-base font-semibold text-cvr-ink">{m.nhan}</p>
                <p className="mt-1 text-sm leading-relaxed text-cvr-muted">{m.ta}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
