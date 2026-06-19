"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

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

const navItems: NavItem[] = [
  { label: "Nhà đất bán", href: "/mua-ban", children: loaiHinhBan },
  { label: "Nhà đất cho thuê", href: "/cho-thue", children: loaiHinhThue },
  { label: "Dự án", href: "/du-an", children: loaiHinhDuAn },
  { label: "Chuyên gia", href: "/chuyen-gia", children: danhMucChuyenGia },
  { label: "Tin tức", href: "/tin-tuc" },
];

function NavLink({ item }: { item: NavItem }) {
  if (!item.children) {
    return (
      <Link
        href={item.href}
        className="nav-link text-sm font-medium text-white/80 transition-colors hover:text-white"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href={item.href}
        className="nav-link flex items-center gap-1 py-2 text-sm font-medium text-white/80 transition-colors group-hover:text-white"
      >
        {item.label}
        <svg
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </Link>

      {/* Menu con (dropdown) */}
      <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100">
        <div className="origin-top translate-y-1.5 scale-[0.98] overflow-hidden rounded-xl border border-black/5 bg-white py-2 opacity-0 shadow-2xl shadow-black/30 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="block px-4 py-2.5 text-sm font-medium text-cl-ink/80 transition-colors hover:bg-cl-stone/60 hover:text-cl-ink"
            >
              {child.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-cl-ink/85 shadow-lg shadow-black/20 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8 ${
          scrolled ? "h-[60px]" : "h-[68px]"
        }`}
      >
        {/* Logo chuẩn */}
        <Link href="/">
          <BrandLogo size="md" />
        </Link>

        {/* Điều hướng */}
        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Hành động */}
        <div className="flex items-center gap-4">
          <Link
            href="/dang-nhap"
            className="hidden text-sm font-medium text-white/80 transition-colors hover:text-white sm:block"
          >
            Đăng nhập
          </Link>
          <Link
            href="/dang-tin"
            className="btn-dangtin btn-dangtin--pulse group flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-cl-ink"
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
