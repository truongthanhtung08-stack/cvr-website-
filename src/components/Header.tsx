"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { packages } from "@/lib/packages";
import { haptic } from "@/lib/haptic";

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

// Menu Tiện ích — các gói dịch vụ (lấy từ packages.ts để không lặp dữ liệu)
const danhMucTienIch: NavChild[] = packages.map((p) => ({
  label: p.label,
  href: `/tien-ich/${p.slug}`,
}));

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
      href="/tin-da-luu"
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
    { label: "Tin đã lưu", href: "/tin-da-luu" },
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

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [member, setMember] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trạng thái đăng nhập (tạm — sẽ thay bằng Supabase Auth). Đọc từ localStorage
  // key "cvr-member" = {"name":"..."} để demo cả 2 giao diện khách/thành viên.
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("cvr-member");
        setMember(raw ? JSON.parse(raw) : null);
      } catch {
        setMember(null);
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  const logout = () => {
    localStorage.removeItem("cvr-member");
    setMember(null);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-white/10 bg-cvr-ink/80 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-300 ${
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

          {member ? (
            <AccountMenu name={member.name} onLogout={logout} />
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
            className="btn-dangtin btn-dangtin--pulse group flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Đăng tin
          </Link>
        </div>
      </div>
    </header>
  );
}
