"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase/client";
import { FOOTER_DEFAULT, type FooterData } from "@/lib/siteContent";
import { PHAP_LY, MIEN_TRU } from "@/lib/phapLy";

// Đường dẫn icon SVG theo tên mạng xã hội (link do admin nhập, icon giữ trong code).
const SOCIAL_PATHS: Record<string, string> = {
  Facebook: "M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z",
  X: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z",
  YouTube: "M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z",
};
const DEFAULT_SOCIAL_PATH = SOCIAL_PATHS.Facebook;

// Màu thương hiệu từng mạng — tô đúng logo (Zalo xanh · Facebook xanh · X đen · YouTube đỏ).
const SOCIAL_COLORS: Record<string, string> = {
  Zalo: "#0068FF",
  Facebook: "#1877F2",
  X: "#000000",
  YouTube: "#FF0000",
};
const DEFAULT_SOCIAL_COLOR = SOCIAL_COLORS.Facebook;

// Zalo KHÔNG phải hình bong bóng chat — nhận diện đúng của Zalo là ô bo góc
// màu xanh #0068FF với chữ "Zalo" trắng ở giữa. Vẽ riêng, không dùng SOCIAL_PATHS.
function ZaloMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6.5" fill={SOCIAL_COLORS.Zalo} />
      <text
        x="12"
        y="15.6"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="8.6"
        fontWeight="700"
        fontFamily="Helvetica, Arial, sans-serif"
        letterSpacing="-0.3"
      >
        Zalo
      </text>
    </svg>
  );
}

// Link mạng xã hội: admin nhập link nào thì dùng link đó (/admin/noi-dung).
// Riêng ZALO chưa nhập → tự trỏ thẳng tới số Hỗ trợ kỹ thuật (mở chat Zalo).
// Mạng chưa có link → icon VẪN hiện nhưng chưa bấm được (kích hoạt khi có link).
// Bảo đảm luôn có Zalo trong danh sách mạng xã hội (dù admin lưu thiếu).
function withZalo(list: FooterData["socials"]): FooterData["socials"] {
  return list.some((s) => s.label === "Zalo") ? list : [{ label: "Zalo", href: "#" }, ...list];
}

function socialHref(label: string, href: string, hotline: string): string | null {
  const v = (href ?? "").trim();
  if (v && v !== "#") return v;
  if (label === "Zalo") {
    const digits = hotline.replace(/\D/g, "").replace(/^84/, "0");
    return digits ? `https://zalo.me/${digits}` : null;
  }
  return null;
}

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
      { label: "Báo giá dịch vụ", href: "/bao-gia-dang-tin" },
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
      { label: "BĐS Quảng Trị", href: "/mua-ban?tinh=Quảng Trị" },
      { label: "BĐS Quảng Ngãi", href: "/mua-ban?tinh=Quảng Ngãi" },
      { label: "BĐS Khánh Hòa", href: "/mua-ban?tinh=Khánh Hòa" },
      { label: "BĐS Lâm Đồng", href: "/mua-ban?tinh=Lâm Đồng" },
      { label: "BĐS Gia Lai", href: "/mua-ban?tinh=Gia Lai" },
      { label: "BĐS Hà Nội", href: "/mua-ban?tinh=Hà Nội" },
      { label: "BĐS Hồ Chí Minh", href: "/mua-ban?tinh=Hồ Chí Minh" },
    ],
  },
];

// Dải pháp lý cuối footer — cấu trúc rút gọn theo chuẩn chung của Batdongsan /
// Homedy, giữ đúng vị thế CỔNG THÔNG TIN của Coastal Land.
// 👉 Nội dung (ĐKKD, MST, người chịu trách nhiệm, địa chỉ) nằm ở src/lib/phapLy.ts.

// Hàng liên kết pháp lý cuối cùng (gọn, 1 dòng) — giống dải cuối của các sàn lớn.
const LINK_PHAP_LY = [
  { label: "Điều khoản thoả thuận", href: "/dieu-khoan" },
  { label: "Chính sách bảo mật", href: "/bao-mat" },
  { label: "Quy chế hoạt động", href: "/quy-che" },
  { label: "Quy định đăng tin", href: "/quy-dinh" },
  { label: "Góp ý, báo lỗi", href: "/gop-y" },
];

export default function Footer() {
  // Tải nội dung footer từ Supabase (admin sửa được); chưa có → dùng mặc định.
  const [f, setF] = useState<FooterData>(FOOTER_DEFAULT);
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("site_content").select("data").eq("key", "footer").maybeSingle();
      const d = (data?.data ?? null) as Partial<FooterData> | null;
      if (d) setF({
        ...FOOTER_DEFAULT, ...d,
        // ZALO luôn có mặt: admin lưu danh sách thiếu Zalo thì tự chèn lên đầu.
        socials: withZalo(d.socials?.length ? d.socials : FOOTER_DEFAULT.socials),
        images: d.images?.length ? d.images : FOOTER_DEFAULT.images,
      });
    })();
  }, []);
  return (
    <footer className="footer-glow mt-auto text-cvr-body">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Thương hiệu + liên hệ */}
          <div className="col-span-2">
            <BrandLogo size="lg" />
            <p className="mt-3 text-sm font-semibold text-cvr-ink">
              {f.tagline}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-cvr-muted">
              {f.description}
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-cvr-body">
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-cvr-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" /></svg>
                Hỗ trợ kỹ thuật: <span className="font-semibold text-cvr-ink">{f.hotline}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-cvr-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8l9-5 9 5" /></svg>
                {f.email}
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-cvr-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {/* ĐỊA CHỈ lấy từ src/lib/phapLy.ts — MỘT nguồn duy nhất cho cả footer,
                    trang Liên hệ và Quy chế. Trước đây lấy từ Admin nên sửa trong code
                    không lên được (Admin đè). Xoá diaChiDayDu thì mới quay về ô Admin. */}
                {PHAP_LY.diaChiDayDu || f.address}
              </li>
            </ul>

            {/* Mạng xã hội — icon TO, bấm là nối thẳng tới trang/kênh tương ứng */}
            <div className="mt-6 flex flex-wrap gap-3.5">
              {f.socials.map((s) => {
                const href = socialHref(s.label, s.href, f.hotline);
                const box = "flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";
                const icon = s.label === "Zalo" ? (
                  <ZaloMark className="h-[26px] w-[26px]" />
                ) : (
                  <svg className="h-6 w-6" fill={SOCIAL_COLORS[s.label] ?? DEFAULT_SOCIAL_COLOR} viewBox="0 0 24 24"><path d={SOCIAL_PATHS[s.label] ?? DEFAULT_SOCIAL_PATH} /></svg>
                );
                return href ? (
                  <a
                    key={s.label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className={`${box} hover:-translate-y-0.5 hover:scale-110 hover:shadow-md`}
                  >
                    {icon}
                  </a>
                ) : (
                  <span key={s.label} aria-label={s.label} title="Sắp kết nối" className={`${box} cursor-default opacity-45`}>
                    {icon}
                  </span>
                );
              })}
            </div>

            {/* 3 ảnh minh hoạ: ĐÃ BỎ theo yêu cầu (file V3 10.08.2026).
                Dữ liệu images vẫn còn trong admin — chưa xoá, chỉ không hiển thị. */}
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
          {/* Tên pháp lý lấy từ phapLy.ts (đúng giấy ĐKKD) — không để admin sửa lệch giấy phép.
              Chưa điền thì mới dùng tên trong phần Nội dung web. */}
          <p className="font-semibold text-cvr-body">
            {PHAP_LY.tenCongTy || f.company}
          </p>

          {/* Dòng pháp lý — ô nào trống trong src/lib/phapLy.ts thì tự ẩn, không lộ chữ mẫu */}
          {PHAP_LY.dangKyKinhDoanh && <p>{PHAP_LY.dangKyKinhDoanh}</p>}
          {PHAP_LY.maSoThue && <p>Mã số thuế: {PHAP_LY.maSoThue}</p>}
          <p>
            Địa chỉ: {PHAP_LY.diaChiDayDu || f.address}
            <span className="mx-1.5 text-cvr-line">·</span>
            Hotline: <a href={`tel:${f.hotline.replace(/\s/g, "")}`} className="hover:text-cvr-ink">{f.hotline}</a>
            <span className="mx-1.5 text-cvr-line">·</span>
            Email: <a href={`mailto:${f.email}`} className="hover:text-cvr-ink">{f.email}</a>
          </p>
          {PHAP_LY.chiuTrachNhiemNoiDung && (
            <p>Chịu trách nhiệm nội dung: {PHAP_LY.chiuTrachNhiemNoiDung}</p>
          )}
          {PHAP_LY.boCongThuong && (
            <p>
              <a
                href={PHAP_LY.boCongThuong}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cvr-ink"
              >
                Đã thông báo website với Bộ Công Thương
              </a>
            </p>
          )}

          {/* Miễn trừ trách nhiệm — giữ đúng vị thế cổng thông tin */}
          <p className="max-w-4xl pt-1">{MIEN_TRU}</p>

          {/* Hàng liên kết pháp lý */}
          <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 pt-2">
            {LINK_PHAP_LY.map((l, i) => (
              <span key={l.href} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-cvr-line">·</span>}
                <Link href={l.href} className="transition-colors hover:text-cvr-ink">
                  {l.label}
                </Link>
              </span>
            ))}
          </nav>

          <p className="pt-2 text-cvr-muted">
            © {new Date().getFullYear()} COASTAL LAND · coastalland.vn
          </p>
        </div>
      </div>
    </footer>
  );
}
