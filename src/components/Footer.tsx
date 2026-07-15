import Image from "next/image";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { asset } from "@/lib/asset";

// Ảnh minh hoạ khu "Thông tin Coastal Land" (lấy từ bộ ảnh dự án) → dẫn tới trang giới thiệu.
const footerShots = [
  { src: "/images/gioi-thieu/intro-thanh-pho.jpg", alt: "Đô thị ven biển Duyên hải Miền Trung" },
  { src: "/images/gioi-thieu/villa-bien.jpg", alt: "Biệt thự view biển" },
  { src: "/images/gioi-thieu/ben-du-thuyen.jpg", alt: "Đô thị ven biển" },
];

const columns = [
  {
    title: "Về COASTAL LAND",
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
      { label: "BĐS Huế", href: "/mua-ban?tinh=Huế" },
      { label: "BĐS Quảng Bình", href: "/mua-ban?tinh=Huế" },
      { label: "BĐS Quảng Ngãi", href: "/mua-ban?tinh=Huế" },
      { label: "BĐS Khánh Hòa", href: "/mua-ban?tinh=Khánh Hòa" },
      { label: "BĐS Lâm Đồng", href: "/mua-ban?tinh=Lâm Đồng" },
      { label: "BĐS Gia Lai", href: "/mua-ban?tinh=Gia Lai" },
      { label: "BĐS Đắk Lắk", href: "/mua-ban?tinh=Đắk Lắk" },
    ],
  },
];

// Icon social — cùng viewBox 24×24, fill currentColor, độ phủ tương đương nhau
// nên đồng đều tỷ lệ trong nút tròn. Zalo dùng bong bóng chat (nhận diện qua nhãn).
const socials = [
  { label: "Zalo", href: "#", d: "M12 2.4c-5.46 0-9.9 3.66-9.9 8.18 0 2.6 1.47 4.92 3.76 6.43-.16.57-.52 1.72-.66 2.18-.17.55.2.55.42.45.29-.12 2.5-1.66 3.46-2.31.94.22 1.93.34 2.92.34 5.46 0 9.9-3.66 9.9-8.18S17.46 2.4 12 2.4z" },
  { label: "Facebook", href: "#", d: "M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" },
  { label: "X", href: "#", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" },
  { label: "YouTube", href: "#", d: "M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" },
];

export default function Footer() {
  return (
    <footer className="footer-glow mt-auto text-cvr-body">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Thương hiệu + liên hệ */}
          <div className="col-span-2">
            <BrandLogo size="lg" />
            <p className="mt-3 text-sm font-semibold text-cvr-ink">
              Bất động sản Duyên hải Miền Trung
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-cvr-muted">
              Coastal Land (coastalland.vn) là nền tảng công nghệ và cổng thông tin bất động sản trực tuyến hàng đầu tại Việt Nam.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-cvr-body">
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-cvr-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" /></svg>
                Hotline: <span className="font-semibold text-cvr-ink">+84 377 985 036</span>
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-cvr-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8l9-5 9 5" /></svg>
                lienhe@coastalland.vn
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-cvr-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Đà Nẵng
              </li>
            </ul>

            <div className="mt-6 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-cvr-body transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-110 hover:border-cvr-ink hover:bg-cvr-ink hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={s.d} /></svg>
                </a>
              ))}
            </div>

            {/* Ảnh minh hoạ — dẫn tới trang Giới thiệu */}
            <div className="mt-6 grid max-w-sm grid-cols-3 gap-2">
              {footerShots.map((s) => (
                <Link key={s.src} href="/gioi-thieu" aria-label="Giới thiệu Coastal Land" className="group relative aspect-[4/3] overflow-hidden bg-cvr-surface ring-1 ring-black/5">
                  <Image src={asset(s.src)} alt={s.alt} fill sizes="140px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </Link>
              ))}
            </div>
          </div>

          {/* Cột liên kết */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-cvr-ink">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block text-sm text-cvr-muted transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1 hover:text-cvr-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-2 border-t border-cvr-line pt-6 text-xs leading-relaxed text-cvr-faint">
          <p className="font-semibold text-cvr-body">
            Central Coast Vietnam Real Estate (CVR)
          </p>
          {/* 2 dòng pháp lý (ĐKKD · địa chỉ/hotline) — CHỪA LẠI, bổ sung khi có thông tin */}
          <p className="pt-2 text-cvr-muted">
            © {new Date().getFullYear()} COASTAL LAND · coastalland.vn
          </p>
        </div>
      </div>
    </footer>
  );
}
