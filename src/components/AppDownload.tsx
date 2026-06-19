import Image from "next/image";
import { asset } from "@/lib/asset";

const features = [
  "Tìm nhanh theo khu vực, loại hình, mức giá",
  "Lưu tin yêu thích & so sánh bất động sản",
  "Nhận thông báo dự án và tin mới phù hợp",
];

export default function AppDownload() {
  return (
    <section className="section-edge bg-cl-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cl-charcoal to-cl-ink p-8 sm:p-12">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            {/* Trái: giới thiệu */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Ứng dụng CENTRAL LAND
              </span>
              <h2 className="mt-3 text-balance font-serif text-2xl font-bold leading-snug text-white sm:text-3xl">
                Tìm & chọn bất động sản{" "}
                <span className="text-cl-stone">mọi lúc, mọi nơi</span>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
                Tải ứng dụng để theo dõi nhà đất bán – cho thuê, dự án và thị
                trường bất động sản Miền Trung ngay trên điện thoại.
              </p>

              <ul className="mt-6 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/80">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Phải: cách tải — QR + nút store */}
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 md:flex-row md:items-center md:justify-center">
              {/* QR */}
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-xl bg-white p-3">
                  <Image
                    src={asset("/images/qr.png")}
                    alt="Quét mã QR để tải ứng dụng CENTRAL LAND"
                    width={128}
                    height={128}
                    className="h-32 w-32"
                  />
                </div>
                <span className="text-xs text-white/50">Quét mã để tải</span>
              </div>

              <div className="hidden h-28 w-px bg-white/10 md:block" />

              {/* Nút store */}
              <div className="flex flex-col gap-3">
                <a href="#" className="flex items-center gap-3 rounded-xl border border-white/20 bg-cl-ink px-5 py-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/5">
                  <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.78 1.3 10.32.86 1.24 1.89 2.64 3.23 2.59 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.15-2.52.99-1.44 1.4-2.84 1.42-2.91-.03-.01-2.72-1.04-2.75-4.13zM14.6 4.6c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.33-.59 3.03-1.46z"/></svg>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] text-white/60">Tải về trên</span>
                    <span className="text-sm font-semibold text-white">App Store</span>
                  </span>
                </a>
                <a href="#" className="flex items-center gap-3 rounded-xl border border-white/20 bg-cl-ink px-5 py-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/5">
                  <svg className="h-7 w-7" viewBox="0 0 24 24"><path fill="#fff" d="M3.6 2.4c-.3.3-.5.7-.5 1.2v16.8c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L3.7 2.3l-.1.1z"/><path fill="#fff" d="M16.3 15.4L13 12.1v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2-.1.1z"/><path fill="#fff" d="M16.4 15.3L13 12 3.6 21.6c.4.4 1 .4 1.6.1l11.2-6.4M16.4 8.7L5.2 2.3c-.6-.3-1.2-.3-1.6.1L13 12l3.4-3.3z"/></svg>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] text-white/60">Tải về trên</span>
                    <span className="text-sm font-semibold text-white">Google Play</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
