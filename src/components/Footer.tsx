import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

const columns = [
  {
    title: "Về CENTRAL LAND",
    links: [
      { label: "Giới thiệu", href: "/gioi-thieu" },
      { label: "Tuyển dụng", href: "/tuyen-dung" },
      { label: "Liên hệ", href: "/lien-he" },
      { label: "Quy chế hoạt động", href: "/quy-che" },
      { label: "Điều khoản thoả thuận", href: "/dieu-khoan" },
      { label: "Chính sách bảo mật", href: "/bao-mat" },
    ],
  },
  {
    title: "Hỗ trợ khách hàng",
    links: [
      { label: "Hướng dẫn đăng tin", href: "/huong-dan" },
      { label: "Bảng giá dịch vụ", href: "/bang-gia" },
      { label: "Câu hỏi thường gặp", href: "/faq" },
      { label: "Quy định đăng tin", href: "/quy-dinh" },
      { label: "Góp ý, báo lỗi", href: "/gop-y" },
    ],
  },
  {
    title: "Khu vực",
    links: [
      { label: "BĐS Đà Nẵng", href: "/mua-ban?tinh=Đà Nẵng" },
      { label: "BĐS Thừa Thiên Huế", href: "/mua-ban?tinh=Thừa Thiên Huế" },
      { label: "BĐS Quảng Nam", href: "/mua-ban?tinh=Quảng Nam" },
      { label: "BĐS Bình Định", href: "/mua-ban?tinh=Bình Định" },
    ],
  },
];

const socials = [
  { label: "Facebook", href: "#", d: "M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" },
  { label: "YouTube", href: "#", d: "M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" },
  { label: "Zalo", href: "#", d: "M12 2C6.5 2 2 5.9 2 10.7c0 2.7 1.4 5.1 3.7 6.7-.2.7-.6 1.9-.7 2.2-.1.4.2.4.4.3.2-.1 2.4-1.6 3.3-2.2.4.1 1.1.1 1.3.1 5.5 0 10-3.9 10-8.7S17.5 2 12 2z" },
];

export default function Footer() {
  return (
    <footer className="footer-glow mt-auto text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Thương hiệu + liên hệ */}
          <div className="col-span-2">
            <BrandLogo size="lg" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
              Sàn giao dịch bất động sản trung gian, khách quan tại Đà Nẵng, Huế
              và Miền Trung. Kết nối trực tiếp người mua và người bán — minh bạch,
              an toàn.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" /></svg>
                Hotline: <span className="font-semibold text-white">0905 123 456</span>
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8l9-5 9 5" /></svg>
                hi@centralcoast.vn
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Đà Nẵng — Thừa Thiên Huế, Việt Nam
              </li>
            </ul>

            <div className="mt-6 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-110 hover:border-white hover:bg-white hover:text-cl-ink"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={s.d} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Cột liên kết */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block text-sm text-slate-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-2 border-t border-white/10 pt-6 text-xs leading-relaxed text-slate-500">
          <p className="font-semibold text-slate-300">
            CÔNG TY CỔ PHẦN CENTRAL LAND
          </p>
          <p>
            Giấy chứng nhận ĐKKD số 0401XXXXXX do Sở KH&amp;ĐT TP. Đà Nẵng cấp ·
            Người chịu trách nhiệm nội dung: Trương Thanh Tùng
          </p>
          <p>
            Địa chỉ: Quận Hải Châu, TP. Đà Nẵng · Hotline: 0905 123 456 · Email:
            hi@centralcoast.vn
          </p>
          <p className="pt-2 text-slate-400">
            © {new Date().getFullYear()} CENTRAL LAND · centralcoast.vn
          </p>
        </div>
      </div>
    </footer>
  );
}
