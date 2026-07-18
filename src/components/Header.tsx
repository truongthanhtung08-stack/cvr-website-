"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { packages } from "@/lib/packages";
import { haptic } from "@/lib/haptic";
import { useAuth, displayName, signOut } from "@/lib/useAuth";

type NavChild = { label: string; href: string };
type NavItem = { label: string; href: string; children?: NavChild[] };

// Đầy đủ loại hình BĐS bán (kiểu Homedy)
const loaiHinhBan: NavChild[] = [
  { label: "Căn hộ chung cư", href: "/mua-ban/can-ho-chung-cu" },
  { label: "Nhà riêng", href: "/mua-ban/nha-rieng" },
  { label: "Nhà biệt thự, liền kề", href: "/mua-ban/biet-thu-lien-ke" },
  { label: "Nhà mặt phố", href: "/mua-ban/nha-mat-pho" },
  { label: "Shophouse, nhà phố thương mại", href: "/mua-ban/shophouse" },
  { label: "Đất nền dự án", href: "/mua-ban/dat-nen-du-an" },
  { label: "Đất", href: "/mua-ban/dat" },
  { label: "Trang trại, khu nghỉ dưỡng", href: "/mua-ban/trang-trai-nghi-duong" },
  { label: "Condotel", href: "/mua-ban/condotel" },
  { label: "Kho, nhà xưởng", href: "/mua-ban/kho-nha-xuong" },
  { label: "Bất động sản khác", href: "/mua-ban/bds-khac" },
];

// Đầy đủ loại hình BĐS cho thuê (kiểu Homedy)
const loaiHinhThue: NavChild[] = [
  { label: "Căn hộ chung cư", href: "/cho-thue/can-ho-chung-cu" },
  { label: "Nhà riêng", href: "/cho-thue/nha-rieng" },
  { label: "Nhà biệt thự, liền kề", href: "/cho-thue/biet-thu-lien-ke" },
  { label: "Nhà mặt phố", href: "/cho-thue/nha-mat-pho" },
  { label: "Shophouse, nhà phố thương mại", href: "/cho-thue/shophouse" },
  { label: "Nhà trọ, phòng trọ", href: "/cho-thue/phong-tro" },
  { label: "Văn phòng", href: "/cho-thue/van-phong" },
  { label: "Cửa hàng, ki ốt", href: "/cho-thue/cua-hang-ki-ot" },
  { label: "Kho, nhà xưởng, đất", href: "/cho-thue/kho-nha-xuong" },
  { label: "Bất động sản khác", href: "/cho-thue/bds-khac" },
];

const loaiHinhDuAn: NavChild[] = [
  { label: "Căn hộ chung cư", href: "/du-an/can-ho-chung-cu" },
  { label: "Khu đô thị mới", href: "/du-an/khu-do-thi-moi" },
  { label: "Khu nghỉ dưỡng, sinh thái", href: "/du-an/khu-nghi-duong" },
  { label: "Nhà ở xã hội", href: "/du-an/nha-o-xa-hoi" },
  { label: "Cao ốc văn phòng", href: "/du-an/cao-oc-van-phong" },
  { label: "Trung tâm thương mại", href: "/du-an/trung-tam-thuong-mai" },
  { label: "Biệt thự, liền kề", href: "/du-an/biet-thu-lien-ke" },
  { label: "Shophouse", href: "/du-an/shophouse" },
];

const danhMucChuyenGia: NavChild[] = [
  { label: "Danh bạ chuyên gia", href: "/chuyen-gia" },
  { label: "Chuyên gia tại Đà Nẵng", href: "/chuyen-gia/da-nang" },
  { label: "Chuyên gia tại Huế", href: "/chuyen-gia/hue" },
  { label: "Sàn giao dịch, công ty BĐS", href: "/chuyen-gia/cong-ty" },
  { label: "Trở thành chuyên gia", href: "/chuyen-gia/dang-ky" },
];

// Menu Tiện ích — trang báo giá tổng + các gói dịch vụ (lấy từ packages.ts để không lặp dữ liệu)
const danhMucTienIch: NavChild[] = [
  { label: "Báo giá Dịch vụ và Truyền thông", href: "/bao-gia-dang-tin" },
  ...packages.map((p) => ({ label: p.label, href: `/tien-ich/${p.slug}` })),
];

// Thứ tự menu: Dự án · Mua bán · Cho thuê · Tin tức · Chuyên gia · Tiện ích
const navItems: NavItem[] = [
  { label: "Dự án", href: "/du-an", children: loaiHinhDuAn },
  { label: "Mua bán", href: "/mua-ban", children: loaiHinhBan },
  { label: "Cho thuê", href: "/cho-thue", children: loaiHinhThue },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Chuyên gia", href: "/chuyen-gia", children: danhMucChuyenGia },
  { label: "Tiện ích", href: "/tien-ich/goi-dang-tin", children: danhMucTienIch },
];

const chevronDown = (
  <svg
    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// Panel dropdown nền trắng (tương phản trên header tối, kiểu flyout Apple)
function DropdownPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100">
      <div className="origin-top translate-y-1.5 scale-[0.98] overflow-hidden rounded-xl border border-cvr-line bg-white py-2 opacity-0 shadow-xl shadow-black/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
        {children}
      </div>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  if (!item.children) {
    return (
      <Link
        href={item.href}
        className="nav-link text-sm font-medium text-cvr-line transition-colors hover:text-white"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href={item.href}
        className="nav-link text-sm font-medium text-cvr-line transition-colors group-hover:text-white"
      >
        {item.label}
      </Link>

      <DropdownPanel>
        {item.children.map((child) => (
          <Link
            key={child.href}
            href={child.href}
            className="block px-4 py-2.5 text-sm font-medium text-cvr-body transition-colors hover:bg-cvr-surface hover:text-cvr-ink"
          >
            {child.label}
          </Link>
        ))}
      </DropdownPanel>
    </div>
  );
}

// Nút "Lưu" — dẫn tới danh sách tin đã lưu
function SaveButton() {
  return (
    <Link
      href="/tin-luu"
      className="hidden items-center gap-1.5 text-sm font-medium text-cvr-line transition-colors hover:text-white sm:flex"
    >
      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      Lưu
    </Link>
  );
}

// Menu tài khoản khi đã đăng nhập (avatar + dropdown)
function AccountMenu({ name, onLogout }: { name: string; onLogout: () => void }) {
  const initial = name.trim().charAt(0).toUpperCase() || "T";
  const links: NavChild[] = [
    { label: "Tổng quan", href: "/tai-khoan" },
    { label: "Tin đã đăng", href: "/tai-khoan/tin-dang" },
    { label: "Tin đã lưu", href: "/tin-luu" },
    { label: "Cài đặt tài khoản", href: "/tai-khoan/cai-dat" },
  ];

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 transition-colors"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/15">
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-cvr-line group-hover:text-white lg:inline">
          {name}
        </span>
        {chevronDown}
      </button>

      <DropdownPanel>
        <div className="border-b border-cvr-line px-4 pb-2.5 pt-1">
          <p className="truncate text-sm font-semibold text-cvr-ink">{name}</p>
          <p className="text-xs text-cvr-muted">Thành viên COASTAL LAND</p>
        </div>
        {links.map((child) => (
          <Link
            key={child.href}
            href={child.href}
            className="block px-4 py-2.5 text-sm font-medium text-cvr-body transition-colors hover:bg-cvr-surface hover:text-cvr-ink"
          >
            {child.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="block w-full border-t border-cvr-line px-4 py-2.5 text-left text-sm font-medium text-cvr-muted transition-colors hover:bg-cvr-surface hover:text-cvr-ink"
        >
          Đăng xuất
        </button>
      </DropdownPanel>
    </div>
  );
}

// ── Menu MOBILE (< lg) — panel trượt xuống kiểu Apple: nền tối, chữ lớn,
//    mục có danh mục con mở dạng accordion. Khoá cuộn nền khi đang mở.
function MobileMenu({
  open,
  onClose,
  user,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: ReturnType<typeof useAuth>["user"];
  onLogout: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Đóng menu thì gập luôn accordion để lần mở sau sạch sẽ
  useEffect(() => {
    if (!open) setExpanded(null);
  }, [open]);

  return (
    <div
      // absolute theo header (KHÔNG dùng fixed: backdrop-filter của .nav-glass biến header
      // thành containing block, fixed sẽ neo sai). top-full = ngay dưới thanh 60px.
      className={`absolute inset-x-0 top-full z-40 flex h-[calc(100dvh-60px)] flex-col overflow-y-auto overscroll-contain bg-[#161617]/97 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0 pointer-events-none"
      }`}
    >
      <nav className="flex-1 px-6 pb-10 pt-4">
        {navItems.map((item) => (
          <div key={item.href} className="border-b border-white/10">
            {item.children ? (
              <>
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                  aria-expanded={expanded === item.label}
                  className="flex min-h-[52px] w-full items-center justify-between text-left text-[17px] font-medium text-white"
                >
                  {item.label}
                  <svg
                    className={`h-4 w-4 text-white/50 transition-transform duration-300 ${expanded === item.label ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className="grid"
                  // Inline (không dùng class grid-rows-[..] — Tailwind không sinh rule ổn định)
                  style={{
                    gridTemplateRows: expanded === item.label ? "1fr" : "0fr",
                    transition: "grid-template-rows 300ms cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  <div className="overflow-hidden">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block py-2.5 text-[15px] font-semibold text-white/90"
                    >
                      Xem tất cả {item.label.toLowerCase()}
                    </Link>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className="block py-2.5 text-[15px] text-white/70 transition-colors active:text-white"
                      >
                        {child.label}
                      </Link>
                    ))}
                    <div className="h-2" />
                  </div>
                </div>
              </>
            ) : (
              <Link
                href={item.href}
                onClick={onClose}
                className="flex min-h-[52px] items-center text-[17px] font-medium text-white"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}

        {/* Hành động phụ — Lưu · Tài khoản */}
        <div className="mt-2">
          <Link
            href="/tin-luu"
            onClick={onClose}
            className="flex min-h-[48px] items-center gap-2.5 border-b border-white/10 text-[15px] text-white/80"
          >
            <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Tin đã lưu
          </Link>
          {user ? (
            <>
              <Link
                href="/tai-khoan"
                onClick={onClose}
                className="flex min-h-[48px] items-center gap-2.5 border-b border-white/10 text-[15px] text-white/80"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white ring-1 ring-white/15">
                  {displayName(user).trim().charAt(0).toUpperCase() || "T"}
                </span>
                {displayName(user)}
              </Link>
              <button
                type="button"
                onClick={() => { onLogout(); onClose(); }}
                className="flex min-h-[48px] w-full items-center text-left text-[15px] text-white/60"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/dang-nhap"
              onClick={onClose}
              className="flex min-h-[48px] items-center text-[15px] text-white/80"
            >
              Đăng nhập / Đăng ký
            </Link>
          )}
        </div>

        {/* CTA Đăng tin — nổi bật cuối menu */}
        <Link
          href="/dang-tin"
          onClick={() => { haptic(); onClose(); }}
          className="btn-dangtin mt-5 flex min-h-[48px] items-center justify-center gap-1.5 rounded-full text-[15px] font-semibold text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Đăng tin ngay
        </Link>
      </nav>
    </div>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`nav-glass sticky top-0 z-50 w-full border-b border-white/10 transition-shadow duration-300 ${
        scrolled ? "shadow-lg shadow-black/25" : ""
      }`}
    >
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo trắng (nền tối) */}
        <Link href="/" aria-label="COASTAL LAND — Trang chủ">
          <BrandLogo size="md" tone="light" />
        </Link>

        {/* Điều hướng */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Hành động: Lưu · (Đăng nhập | Tài khoản) · Đăng tin */}
        <div className="flex items-center gap-3 sm:gap-5">
          <SaveButton />

          {user ? (
            <AccountMenu name={displayName(user)} onLogout={signOut} />
          ) : (
            <Link
              href="/dang-nhap"
              className="hidden text-sm font-medium text-cvr-line transition-colors hover:text-white sm:block"
            >
              Đăng nhập
            </Link>
          )}

          <Link
            href="/dang-tin"
            onClick={() => haptic()}
            className="btn-dangtin flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white sm:px-5 sm:py-2.5"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Đăng tin
          </Link>

          {/* Hamburger — chỉ mobile/tablet (< lg), 2 gạch → X kiểu Apple */}
          <button
            type="button"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="relative flex h-11 w-9 items-center justify-center lg:hidden"
          >
            <span
              className={`absolute h-[1.5px] w-[18px] rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                menuOpen ? "rotate-45" : "-translate-y-[3.5px]"
              }`}
            />
            <span
              className={`absolute h-[1.5px] w-[18px] rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                menuOpen ? "-rotate-45" : "translate-y-[3.5px]"
              }`}
            />
          </button>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} user={user} onLogout={signOut} />
    </header>
  );
}
