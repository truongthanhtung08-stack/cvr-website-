"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

const navItems = [
  { label: "Nhà đất bán", href: "/mua-ban" },
  { label: "Nhà đất cho thuê", href: "/cho-thue" },
  { label: "Dự án", href: "/du-an" },
  { label: "Tin tức", href: "/tin-tuc" },
];

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
          scrolled ? "h-[72px]" : "h-20"
        }`}
      >
        {/* Logo chuẩn */}
        <Link href="/">
          <BrandLogo size="md" />
        </Link>

        {/* Điều hướng */}
        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
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
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-cl-ink shadow-lg transition-colors hover:bg-white/90"
          >
            Đăng tin
          </Link>
        </div>
      </div>
    </header>
  );
}
