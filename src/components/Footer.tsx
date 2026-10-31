"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { docRest } from "@/lib/supabase/nap";
import { FOOTER_DEFAULT, type FooterData } from "@/lib/footerMacDinh";
import { PHAP_LY } from "@/lib/phapLy";
import { ZALO_OA_URL } from "@/lib/lienHe";

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
// Riêng ZALO LUÔN trỏ về ZALO OA của công ty (chốt 25/09/2026) — mọi việc với
// Zalo về sau (tin nhắn, thông báo, mini app) đều đi qua OA, không qua nick cá nhân.
// Mạng chưa có link → icon VẪN hiện nhưng chưa bấm được (kích hoạt khi có link).
// Bảo đảm luôn có Zalo trong danh sách mạng xã hội (dù admin lưu thiếu).
function withZalo(list: FooterData["socials"]): FooterData["socials"] {
  return list.some((s) => s.label === "Zalo") ? list : [{ label: "Zalo", href: "#" }, ...list];
}

function socialHref(label: string, href: string): string | null {
  if (label === "Zalo") return ZALO_OA_URL;
  const v = (href ?? "").trim();
  if (v && v !== "#") return v;
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
    // Điện thoại: trải ngang hết bề rộng, các tỉnh nối nhau thành 2–3 hàng thay vì 9 dòng dọc (24/10/2026).
    ngang: true,
    // ⚠️ TRỎ VÀO TRANG KHU VỰC THẬT (/mua-ban/da-nang), KHÔNG dùng ?tinh=Đà Nẵng.
    // Sửa ngày 18/09/2026. Trước đây cả 9 dòng này đều trỏ /mua-ban?tinh=<tên tỉnh>,
    // mà footer thì có mặt trên MỌI trang — nghĩa là:
    //   · Trang khu vực thật (/mua-ban/da-nang) có tiêu đề riêng, bảng giá riêng,
    //     mô tả riêng nhưng KHÔNG nhận được một liên kết nội bộ nào từ cả website,
    //     chỉ nằm trơ trong sitemap. Google gọi đây là trang "mồ côi" và gần như
    //     không bao giờ xếp hạng nổi.
    //   · Còn /mua-ban?tinh=… thì tự khai canonical về /mua-ban, nên toàn bộ sức
    //     mạnh của 9 liên kết × mọi trang rơi vào hư không.
    // Nhóm truy vấn địa phương ("bất động sản Đà Nẵng", "nhà đất Huế") là nhóm
    // đông nhất ngành — đây là chỗ đáng giá nhất của liên kết nội bộ.
    links: [
      { label: "BĐS Đà Nẵng", href: "/mua-ban/da-nang" },
      { label: "BĐS Huế", href: "/mua-ban/hue" },
      { label: "BĐS Quảng Trị", href: "/mua-ban/quang-tri" },
      { label: "BĐS Quảng Ngãi", href: "/mua-ban/quang-ngai" },
      { label: "BĐS Khánh Hòa", href: "/mua-ban/khanh-hoa" },
      { label: "BĐS Lâm Đồng", href: "/mua-ban/lam-dong" },
      { label: "BĐS Gia Lai", href: "/mua-ban/gia-lai" },
      { label: "BĐS Hà Nội", href: "/mua-ban/ha-noi" },
      { label: "BĐS Hồ Chí Minh", href: "/mua-ban/ho-chi-minh" },
    ],
  },
];

// 👉 Nội dung pháp lý (ĐKKD, MST, người chịu trách nhiệm, địa chỉ) nằm ở src/lib/phapLy.ts.

export default function Footer() {
  // Tải nội dung footer từ Supabase (admin sửa được); chưa có → dùng mặc định.
  const [f, setF] = useState<FooterData>(FOOTER_DEFAULT);
  useEffect(() => {
    (async () => {
      // Đọc thẳng qua REST (không cần thư viện Supabase ~58 KB ở mọi trang) — cùng truy vấn như trước
      const rows = await docRest<{ data: Partial<FooterData> | null }[]>("site_content?select=data&key=eq.footer&limit=1").catch(() => null);
      const d = rows?.[0]?.data ?? null;
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
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-cvr-muted">
              {f.description}
            </p>

            {/* Thông tin liên hệ: địa chỉ → điện thoại → email → website. Tên công ty + mã số doanh nghiệp ĐÃ BỎ khỏi chân trang
                (chủ dự án 25/10/2026) — vẫn hiện ở Quy chế, Điều khoản, Bảo mật, Liên hệ (lấy từ phapLy.ts). */}
            <ul className="mt-6 space-y-2 text-sm text-cvr-body">
              <li className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {/* ĐỊA CHỈ lấy từ src/lib/phapLy.ts — MỘT nguồn cho footer, Liên hệ, Quy chế (Admin không đè). */}
                {PHAP_LY.diaChiDayDu || f.address}
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 shrink-0 text-cvr-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" /></svg>
                Hỗ trợ kỹ thuật: <a href={`tel:${f.hotline.replace(/\s/g, "")}`} className="whitespace-nowrap font-semibold text-cvr-ink">{f.hotline}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 shrink-0 text-cvr-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8l9-5 9 5" /></svg>
                <a href={`mailto:${f.email}`} className="hover:text-cvr-ink">{f.email}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="h-4 w-4 shrink-0 text-cvr-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg>
                <a href="https://coastalland.vn" className="hover:text-cvr-ink">coastalland.vn</a>
              </li>
            </ul>

            {/* Mạng xã hội — bấm là nối thẳng tới trang/kênh tương ứng. Gọn lại 24/10/2026 (chủ dự án): nút 36px, không viền, cả PC + điện thoại */}
            <div className="mt-5 flex flex-wrap gap-2.5">
              {f.socials.map((s) => {
                const href = socialHref(s.label, s.href);
                const box = "flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";
                const icon = s.label === "Zalo" ? (
                  <ZaloMark className="h-5 w-5" />
                ) : (
                  <svg className="h-[18px] w-[18px]" fill={SOCIAL_COLORS[s.label] ?? DEFAULT_SOCIAL_COLOR} viewBox="0 0 24 24"><path d={SOCIAL_PATHS[s.label] ?? DEFAULT_SOCIAL_PATH} /></svg>
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
            <div key={col.title} className={col.ngang ? "col-span-2 md:col-span-1" : undefined}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-cvr-ink">
                {col.title}
              </h3>
              <ul className={col.ngang ? "mt-4 flex flex-wrap gap-x-5 gap-y-2.5 md:block md:space-y-2.5" : "mt-4 space-y-2.5"}>
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

        {/* Dải cuối chỉ còn dòng pháp lý chưa có ở trên + ©. Tên công ty, mã số, điện thoại,
            email, địa chỉ đã gộp lên khối thông tin công ty; đoạn miễn trừ đã có ở Quy chế,
            Điều khoản, Câu hỏi thường gặp; hàng liên kết pháp lý trùng hai cột trên (24/10/2026). */}
        <div className="mt-8 space-y-2 border-t border-cvr-line pt-5 text-xs leading-relaxed text-cvr-faint">
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

          <p className="text-cvr-muted">
            © {new Date().getFullYear()} COASTAL LAND
          </p>
        </div>
      </div>
    </footer>
  );
}
