import Image from "next/image";
import Link from "next/link";

export default function AppDownload() {
  return (
    <section className="border-t border-white/5 bg-cl-ink">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Panel inset — thụt vào cho cân với trang */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cl-charcoal to-cl-ink">
          <div className="grid grid-cols-1 items-center gap-10 p-8 sm:p-12 lg:grid-cols-2">
            {/* Phone mockups */}
            <div className="relative flex justify-center">
              <div className="relative">
                <div className="absolute -left-12 top-8 hidden h-[360px] w-[175px] rotate-[-8deg] overflow-hidden rounded-[2rem] border-4 border-white/15 bg-cl-ink shadow-2xl sm:block">
                  <Image src="/images/gallery/p03.jpg" alt="" fill className="object-cover opacity-80" sizes="175px" />
                </div>
                <div className="relative h-[400px] w-[195px] overflow-hidden rounded-[2.2rem] border-4 border-white/20 bg-cl-ink shadow-2xl">
                  <Image src="/images/gallery/p01.jpg" alt="Ứng dụng CENTRAL LAND" fill className="object-cover" sizes="195px" />
                  <div className="absolute inset-x-0 top-0 flex justify-center pt-2">
                    <span className="h-1.5 w-16 rounded-full bg-white/40" />
                  </div>
                </div>
              </div>
            </div>

            {/* Nội dung */}
            <div>
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                TÌM KIẾM · LỰA CHỌN BẤT ĐỘNG SẢN
                <br />
                <span className="text-cl-stone">MỌI LÚC, MỌI NƠI</span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/65">
                Cài đặt ứng dụng CENTRAL LAND trên điện thoại để tìm kiếm nhà đất
                bán – cho thuê nhanh chóng, xem đầy đủ thông tin dự án và cập nhật
                tin tức thị trường BĐS Miền Trung liên tục.
              </p>

              {/* CTA Đăng tin */}
              <Link
                href="/dang-tin"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-cl-ink transition-colors hover:bg-white/90"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Đăng tin ngay
              </Link>

              <div className="mt-7 flex items-center gap-5">
                {/* QR */}
                <div className="rounded-xl bg-white p-2.5">
                  <Image src="/images/qr.png" alt="Quét mã tải ứng dụng" width={100} height={100} className="h-[100px] w-[100px]" />
                </div>

                {/* Store badges */}
                <div className="flex flex-col gap-3">
                  <a href="#" className="flex items-center gap-3 rounded-lg border border-white/20 bg-cl-ink px-4 py-2.5 transition-colors hover:bg-white/5">
                    <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.78 1.3 10.32.86 1.24 1.89 2.64 3.23 2.59 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.15-2.52.99-1.44 1.4-2.84 1.42-2.91-.03-.01-2.72-1.04-2.75-4.13zM14.6 4.6c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.33-.59 3.03-1.46z"/></svg>
                    <span className="flex flex-col leading-tight">
                      <span className="text-[10px] text-white/60">Tải về trên</span>
                      <span className="text-sm font-semibold text-white">App Store</span>
                    </span>
                  </a>
                  <a href="#" className="flex items-center gap-3 rounded-lg border border-white/20 bg-cl-ink px-4 py-2.5 transition-colors hover:bg-white/5">
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
      </div>
    </section>
  );
}
