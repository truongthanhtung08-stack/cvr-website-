import Image from "next/image";
import { asset } from "@/lib/asset";

const features = [
  "Tìm nhanh theo khu vực, loại hình, mức giá",
  "Lưu tin yêu thích & so sánh bất động sản",
  "Nhận thông báo dự án và tin mới phù hợp",
];

export default function AppDownload() {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Panel nền tối nổi bật (chuyên nghiệp, thu hút) — bản gọn */}
        <div className="overflow-hidden rounded-none bg-gradient-to-br from-cvr-ink to-[#2b2b2e] p-6 shadow-lux sm:p-8">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            {/* Trái: giới thiệu + đánh giá + tải */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cvr-gold-soft">
                Ứng dụng COASTAL LAND
              </span>
              <h2 className="mt-2 text-balance text-2xl font-semibold leading-snug text-white">
                Tìm &amp; chọn bất động sản{" "}
                <span className="text-white/55">mọi lúc, mọi nơi</span>
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
                Tải ứng dụng để theo dõi nhà đất bán – cho thuê, dự án và thị
                trường bất động sản Miền Trung ngay trên điện thoại.
              </p>

              {/* Đánh giá */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-cvr-gold-soft">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-white">4.9/5</span>
                <span className="text-xs text-white/50">· Miễn phí cho iOS &amp; Android</span>
              </div>

              <ul className="mt-4 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/80">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-cvr-gold-soft" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Nút store + QR */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a href="#" className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-white/90">
                  <svg className="h-6 w-6 text-cvr-ink" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.78 1.3 10.32.86 1.24 1.89 2.64 3.23 2.59 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.15-2.52.99-1.44 1.4-2.84 1.42-2.91-.03-.01-2.72-1.04-2.75-4.13zM14.6 4.6c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.33-.59 3.03-1.46z"/></svg>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] text-cvr-muted">Tải về trên</span>
                    <span className="text-sm font-semibold text-cvr-ink">App Store</span>
                  </span>
                </a>
                <a href="#" className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-white/90">
                  <svg className="h-6 w-6" viewBox="0 0 24 24"><path fill="#0a0a0a" d="M3.6 2.4c-.3.3-.5.7-.5 1.2v16.8c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L3.7 2.3l-.1.1z"/><path fill="#0a0a0a" d="M16.3 15.4L13 12.1v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2-.1.1z"/><path fill="#0a0a0a" d="M16.4 15.3L13 12 3.6 21.6c.4.4 1 .4 1.6.1l11.2-6.4M16.4 8.7L5.2 2.3c-.6-.3-1.2-.3-1.6.1L13 12l3.4-3.3z"/></svg>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] text-cvr-muted">Tải về trên</span>
                    <span className="text-sm font-semibold text-cvr-ink">Google Play</span>
                  </span>
                </a>
                {/* QR */}
                <div className="flex flex-col items-center gap-1 rounded-xl bg-white p-1.5">
                  <Image
                    src={asset("/images/qr.png")}
                    alt="Quét mã QR để tải ứng dụng COASTAL LAND"
                    width={48}
                    height={48}
                    className="h-12 w-12"
                  />
                  <span className="text-[9px] text-cvr-muted">Quét để tải</span>
                </div>
              </div>
            </div>

            {/* Phải: mockup điện thoại (CSS, không cần ảnh) */}
            <div className="flex justify-center">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Khung điện thoại tối giản + màn hình app mẫu (thẻ tin có huy hiệu VIP)
function PhoneMockup() {
  return (
    <div className="relative w-[176px] rounded-[2rem] border-[5px] border-black/80 bg-white shadow-2xl shadow-black/40">
      {/* Notch */}
      <div className="absolute left-1/2 top-2 z-10 h-4 w-24 -translate-x-1/2 rounded-full bg-black/80" />
      <div className="overflow-hidden rounded-[1.7rem]">
        {/* Thanh app */}
        <div className="flex items-center justify-between bg-cvr-ink px-4 pb-2.5 pt-6 text-white">
          <span className="text-[11px] font-bold tracking-wide">COASTAL LAND</span>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </div>
        {/* Nội dung: 1 thẻ tin mẫu */}
        <div className="space-y-2.5 bg-cvr-surface p-3">
          <div className="overflow-hidden rounded-lg border-t-2 border-cvr-gold bg-white shadow-sm">
            <div className="relative h-20 bg-gradient-to-br from-cvr-ink/80 to-cvr-muted">
              <span className="absolute left-1.5 top-1.5 bg-cvr-gold px-1 py-0.5 text-[7px] font-bold uppercase text-white">Diamond</span>
            </div>
            <div className="space-y-1 p-2">
              <div className="h-1.5 w-4/5 rounded-full" style={{ backgroundColor: "#8a6d2e" }} />
              <div className="h-1.5 w-3/5 rounded-full bg-cvr-line" />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[9px] font-bold text-cvr-ink">33 tỷ</span>
                <span className="text-[8px] text-cvr-muted">350 m²</span>
              </div>
            </div>
          </div>
          {/* thẻ mờ phía dưới gợi ý cuộn */}
          <div className="overflow-hidden rounded-lg bg-white/70 p-2 shadow-sm">
            <div className="h-12 rounded bg-cvr-line/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
