import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";

// ===== 2 banner quảng cáo cuối trang chủ — theo mẫu banner Apple =====
// (D:\Coastal Land\Tạo_chỉnh sửa ảnh video\banner mẫu 1-2.png)
// Giải phẫu mẫu: panel ngang bo góc lớn — TRÁI: tiêu đề lớn + 1 nút pill (canh giữa cột);
// PHẢI: hình ảnh tràn. Mẫu 1 nền sáng gradient; mẫu 2 nền đen.
// Thay cho PromoBanner + AppDownload (2 component cũ vẫn còn, khôi phục nếu cần).

// ── Banner 1 (nền sáng → ánh vàng): dành cho NGƯỜI BÁN & MÔI GIỚI ──
export function AdBannerSeller() {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl bg-gradient-to-r from-[#ececee] via-[#efe9dd] to-[#dfc492] shadow-lux md:min-h-[340px] md:grid-cols-2">
          {/* Trái: chữ canh giữa cột (kiểu mẫu 1) */}
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center sm:px-10">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cvr-gold-ink">
              Dành cho người bán &amp; môi giới
            </span>
            <h2 className="mt-2.5 max-w-md text-balance text-2xl font-semibold leading-tight text-cvr-ink sm:text-3xl">
              Đăng tin hôm nay. Đến đúng người mua Miền Trung.
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-cvr-body">
              Gói VIP Diamond / Gold, nạp tiền nhận ưu đãi — tin của bạn luôn nổi bật.
            </p>
            <Link
              href="/dang-tin"
              className="mt-6 inline-flex items-center rounded-full bg-cvr-ink px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              Đăng tin ngay
            </Link>
          </div>
          {/* Phải: ảnh tràn */}
          <div className="relative aspect-[16/10] md:aspect-auto">
            <Image
              src={asset("/images/tin/1.jpg")}
              alt="Biệt thự ven biển Miền Trung — đăng tin cùng COASTAL LAND"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Banner 2 (nền đen — kiểu mẫu 2): ỨNG DỤNG COASTAL LAND ──
// Cấu trúc 3 khối theo mẫu Homedy (điện thoại · chữ · QR + nút tải), da thịt Apple.
export function AdBannerApp() {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a1c] to-[#0b0b0c] px-6 py-8 shadow-lux sm:px-10 md:min-h-[340px] md:grid-cols-[1fr_1.25fr_auto]">

          {/* Điện thoại — 2 máy xếp lớp (kiểu Homedy), màn hình app COASTAL LAND */}
          <div className="order-2 flex items-center justify-center md:order-1">
            <PhoneMock className="-rotate-6 translate-x-4 scale-[0.9] opacity-75" />
            <PhoneMock className="z-10 -translate-x-3" />
          </div>

          {/* Chữ — giữa */}
          <div className="order-1 md:order-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cvr-gold-soft">
              Ứng dụng COASTAL LAND
            </span>
            <h2 className="mt-2.5 text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl">
              Tìm kiếm – lựa chọn bất động sản.{" "}
              <span className="text-white/55">Mọi lúc, mọi nơi.</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
              Cài ứng dụng COASTAL LAND để tìm nhà đất bán – cho thuê nhanh chóng,
              xem đầy đủ dự án mới và tin tức thị trường Miền Trung cập nhật liên tục.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-cvr-gold-soft">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-semibold text-white">4.9/5</span>
              <span className="text-xs text-white/50">· Miễn phí cho iOS &amp; Android</span>
            </div>
          </div>

          {/* QR + nút tải — phải (kiểu Homedy) */}
          <div className="order-3 flex flex-row items-center justify-center gap-4 md:flex-col md:gap-3">
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-2.5">
              <Image
                src={asset("/images/qr.png")}
                alt="Quét mã QR để tải ứng dụng COASTAL LAND"
                width={88}
                height={88}
                className="h-[88px] w-[88px]"
              />
              <span className="text-[9px] text-cvr-muted">Quét để tải</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {/* Cập nhật href khi app lên store thật */}
              <a href="#" className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-white/90">
                <svg className="h-6 w-6 text-cvr-ink" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.78 1.3 10.32.86 1.24 1.89 2.64 3.23 2.59 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.15-2.52.99-1.44 1.4-2.84 1.42-2.91-.03-.01-2.72-1.04-2.75-4.13zM14.6 4.6c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.33-.59 3.03-1.46z"/></svg>
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] text-cvr-muted">Tải về trên</span>
                  <span className="text-sm font-semibold text-cvr-ink">App Store</span>
                </span>
              </a>
              <a href="#" className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-white/90">
                <svg className="h-6 w-6" viewBox="0 0 24 24"><path fill="#0a0a0a" d="M3.6 2.4c-.3.3-.5.7-.5 1.2v16.8c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L3.7 2.3l-.1.1z"/><path fill="#0a0a0a" d="M16.3 15.4L13 12.1v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2-.1.1z"/><path fill="#0a0a0a" d="M16.4 15.3L13 12 3.6 21.6c.4.4 1 .4 1.6.1l11.2-6.4M16.4 8.7L5.2 2.3c-.6-.3-1.2-.3-1.6.1L13 12l3.4-3.3z"/></svg>
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] text-cvr-muted">Tải về trên</span>
                  <span className="text-sm font-semibold text-cvr-ink">Google Play</span>
                </span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// Khung điện thoại tối giản + màn hình app mẫu (thẻ tin có huy hiệu VIP)
function PhoneMock({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-[148px] shrink-0 rounded-[1.8rem] border-[5px] border-black/70 bg-white shadow-2xl shadow-black/50 ${className}`}>
      {/* Notch */}
      <div className="absolute left-1/2 top-1.5 z-10 h-3 w-16 -translate-x-1/2 rounded-full bg-black/80" />
      <div className="overflow-hidden rounded-[1.45rem]">
        {/* Thanh app */}
        <div className="flex items-center justify-between bg-cvr-ink px-3 pb-2 pt-4 text-white">
          <span className="text-[8px] font-bold tracking-wide">COASTAL LAND</span>
          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </div>
        {/* Nội dung: thẻ tin mẫu */}
        <div className="space-y-2 bg-cvr-surface p-2">
          <div className="overflow-hidden rounded-lg border-t-2 border-cvr-gold bg-white shadow-sm">
            <div className="relative h-14 bg-gradient-to-br from-cvr-ink/80 to-cvr-muted">
              <span className="absolute left-1 top-1 bg-cvr-gold px-1 py-0.5 text-[6px] font-bold uppercase text-cvr-ink">Diamond</span>
            </div>
            <div className="space-y-1 p-1.5">
              <div className="h-1 w-4/5 rounded-full" style={{ backgroundColor: "#8a6d2e" }} />
              <div className="h-1 w-3/5 rounded-full bg-cvr-line" />
              <div className="mt-0.5 flex items-center justify-between">
                <span className="text-[7px] font-bold text-cvr-ink">33 tỷ</span>
                <span className="text-[6px] text-cvr-muted">350 m²</span>
              </div>
            </div>
          </div>
          {/* thẻ mờ gợi ý cuộn */}
          <div className="overflow-hidden rounded-lg bg-white/70 p-1.5 shadow-sm">
            <div className="h-8 rounded bg-cvr-line/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
