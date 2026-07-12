import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { asset } from "@/lib/asset";

export const metadata: Metadata = {
  title: "Giới thiệu | Coastal Land",
  description:
    "Coastal Land (coastalland.vn) — nền tảng công nghệ và cổng thông tin Bất động sản trực tuyến hàng đầu tại Việt Nam. Hệ thống ưu việc giúp khách hàng kết nối dễ dàng và thực hiện giao dịch.",
};

const stats = [
  { value: "2", label: "Thị trường trọng điểm", sub: "Đà Nẵng · Huế" },
  { value: "1.000+", label: "Tin đăng chọn lọc", sub: "cập nhật mỗi ngày" },
  { value: "24/7", label: "Hỗ trợ trực tuyến", sub: "minh bạch · nhanh" },
];

const values = [
  {
    title: "Minh bạch",
    desc: "Thông tin rõ ràng, pháp lý kiểm chứng — người mua yên tâm, người bán uy tín.",
    d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Công nghệ",
    desc: "Bộ lọc thông minh, gợi ý cá nhân hoá và dữ liệu lớn — tìm đúng bất động sản nhanh nhất.",
    d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    title: "An toàn",
    desc: "Kết nối trực tiếp người mua và người bán, hỗ trợ pháp lý xuyên suốt giao dịch.",
    d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Đồng hành",
    desc: "Phục vụ môi giới, chính chủ và doanh nghiệp — cùng phát triển thị trường bền vững.",
    d: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-4.5",
  },
];

// Khối ảnh có chú thích (dùng lại nhiều nơi) — vuông cạnh kiểu Apple mới.
function Figure({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-cvr-surface ${className}`}>
      <Image src={asset(src)} alt={alt} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
    </div>
  );
}

export default function GioiThieuPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        {/* ── Hero giới thiệu ── */}
        <section className="relative isolate">
          <div className="relative h-[30vh] min-h-[200px] w-full overflow-hidden bg-cvr-ink sm:h-[38vh] sm:max-h-[400px]">
            <Image
              src={asset("/images/gioi-thieu/hero-gioi-thieu.jpg")}
              alt="Không gian làm việc Coastal Land bên bờ biển Duyên hải Miền Trung"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </section>

        {/* ── Câu chuyện ── */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cvr-blue-ink">Chúng tôi là ai</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
            Nền tảng công nghệ và cổng thông tin    Bất động sản hàng đầu
              </h1>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-cvr-body">
                <p>
                  <span className="font-semibold text-cvr-ink">Coastal Land</span> (coastalland.vn) là một trong những
                  nền tảng công nghệ và cổng thông tin bất động sản trực tuyến hàng đầu tại Việt Nam, Chúng tôi khởi đầu từ
                  Đà Nẵng và mở rộng khắp các khu vực đầy tiềm năng thuộc Duyên hải Miền Trung và Tây Nguyên.
                </p>
                <p>
                  Với nền tảng công nghệ ưu việt cùng chiến lược Marketing hiệu quả, Chúng tôi gắn kết và tạo kết nối giữa những người có nhu cầu mua và bán bất động sản, giữa người dùng và các chuyên gia nhằm giúp mọi người tìm kiếm, chia sẻ và giao dịch nhanh chóng, thuận tiện.
                  
                  <span className="font-semibold text-cvr-ink"> </span>
                </p>
              </div>
            </div>
            <Figure src="/images/gioi-thieu/office.jpg" alt="Văn phòng Coastal Land" className="aspect-[16/10] w-full" />
          </div>
        </section>

        {/* ── Tầm nhìn & Sứ mệnh ── */}
        <section className="bg-cvr-surface">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="border border-cvr-line bg-white p-8 shadow-lux">
                <h3 className="text-lg font-semibold tracking-tight text-cvr-ink">Tầm nhìn</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-cvr-body">
                  Trở thành nền tảng PropTech hàng đầu Việt Nam và xây dựng hệ sinh thái bất động sản thân thiện dễ dàng đến người dùng.
                </p>
              </div>
              <div className="border border-cvr-line bg-white p-8 shadow-lux">
                <h3 className="text-lg font-semibold tracking-tight text-cvr-ink">Sứ mệnh</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-cvr-body">
                  Kết nối mọi người mua – bán bất động sản dễ dàng, minh bạch và an toàn; mang công nghệ đến gần
                  người dùng và nâng chuẩn dịch vụ bất động sản.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Giá trị cốt lõi ── */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cvr-blue-ink">Giá trị cốt lõi</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
              Điều làm nên Coastal Land
            </h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="border border-cvr-line bg-white p-6 shadow-lux transition hover:-translate-y-1 hover:border-cvr-blue/40">
                <span className="flex h-11 w-11 items-center justify-center bg-cvr-blue/10 text-cvr-blue-ink">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={v.d} />
                  </svg>
                </span>
                <h3 className="mt-4 font-semibold text-cvr-ink">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cvr-muted">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Số liệu ── */}
        <section className="relative isolate overflow-hidden bg-cvr-ink">
          <Image
            src={asset("/images/gioi-thieu/ben-du-thuyen.jpg")}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{s.value}</p>
                  <p className="mt-2 text-sm font-medium text-white">{s.label}</p>
                  <p className="text-xs text-white/60">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Thị trường Miền Trung ── */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <Figure src="/images/gioi-thieu/chuyen-sau.jpg" alt="Không gian ven biển Duyên hải Miền Trung" className="order-2 aspect-[16/10] w-full lg:order-1" />
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cvr-blue-ink">Thị trường chuyên sâu</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
                Duyên hải Miền Trung
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-cvr-body">
                Chúng tôi thấu hiểu nhu cầu của người dùng cũng như tiềm năng các đô thị ven biển
                Miền Trung — từ căn hộ, nhà phố, đất nền đến bất động sản nghỉ dưỡng — để mỗi kết quả tìm kiếm
                đều sát nhu cầu thật.
              </p>
              <Link
                href="/du-an"
                className="mt-6 inline-flex items-center gap-2 bg-cvr-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink"
              >
                Khám phá dự án
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-cvr-line bg-cvr-surface">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6 lg:px-8">
            <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
              Bắt đầu cùng Coastal Land
            </h2>
            <p className="max-w-xl text-[15px] text-cvr-muted">
              Đăng tin để tiếp cận khách hàng và nhà đầu tư, hoặc tìm ngay bất động sản phù hợp.
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-3">
              <Link href="/dang-tin" className="bg-cvr-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink">
                Đăng tin ngay
              </Link>
              <Link href="/mua-ban" className="border border-cvr-line bg-white px-6 py-3 text-sm font-semibold text-cvr-ink transition hover:bg-black/5">
                Xem bất động sản
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
