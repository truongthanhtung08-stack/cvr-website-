"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSaved } from "@/lib/useSaved";
import { useAuth } from "@/lib/useAuth";
import { haptic } from "@/lib/haptic";
import { resetHomeIfOnHome } from "@/components/HomeExpand";

// ── Thanh tab DƯỚI CÙNG — chỉ hiện trên điện thoại/tablet (< lg). Desktop KHÔNG đổi gì.
//
// Chuẩn Apple (iOS Tab Bar):
//   · Chiều cao 49pt + đệm thêm đúng safe-area (thanh Home iPhone).
//   · Nền kính mờ saturate(180%) blur(20px) — cùng công thức với .nav-glass của header.
//   · Viền trên là sợi tóc thật (0.5px trên màn retina).
//   · Icon 25px: mục KHÔNG chọn = nét mảnh · mục ĐANG chọn = ĐẶC (filled) + màu nhấn.
//   · Nhãn 10px, tracking âm nhẹ. Vùng chạm ≥ 49px.

type IconPair = { line: React.ReactNode; fill: React.ReactNode };

const ICONS: Record<string, IconPair> = {
  // Ngôi nhà
  home: {
    line: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.4 12 4.3l7.5 6.1V19a1.6 1.6 0 0 1-1.6 1.6h-3.3v-5.9H9.4v5.9H6.1A1.6 1.6 0 0 1 4.5 19Z" />,
    fill: <path d="M11.06 3.03a1.5 1.5 0 0 1 1.88 0l7.5 6.1c.35.29.56.72.56 1.17V19a2.6 2.6 0 0 1-2.6 2.6h-3.3a1 1 0 0 1-1-1v-4.9h-4.2v4.9a1 1 0 0 1-1 1H6.1A2.6 2.6 0 0 1 3.5 19v-8.7c0-.45.21-.88.56-1.17Z" />,
  },
  // Thẻ giá — Mua bán
  tag: {
    line: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.1 3.6h5.8a1.5 1.5 0 0 1 1.5 1.5v5.8a1.5 1.5 0 0 1-.44 1.06l-7.7 7.7a1.5 1.5 0 0 1-2.12 0l-5.8-5.8a1.5 1.5 0 0 1 0-2.12l7.7-7.7a1.5 1.5 0 0 1 1.06-.44Z" />
        <path strokeLinecap="round" strokeWidth={2.6} d="M16.4 7.6h.01" />
      </>
    ),
    fill: <path fillRule="evenodd" clipRule="evenodd" d="M13.1 3.1h5.8A2 2 0 0 1 20.9 5.1v5.8a2 2 0 0 1-.59 1.42l-7.7 7.7a2 2 0 0 1-2.83 0l-5.8-5.8a2 2 0 0 1 0-2.83l7.7-7.7a2 2 0 0 1 1.42-.59Zm3.3 3.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />,
  },
  // Toà nhà — Cho thuê
  building: {
    line: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.4 20.5V6a1.6 1.6 0 0 1 1.6-1.6h5a1.6 1.6 0 0 1 1.6 1.6v14.5M12.6 20.5V10.6h5.4A1.6 1.6 0 0 1 19.6 12.2v8.3M3 20.5h18" />
        <path strokeLinecap="round" d="M7.2 8.3h2.2M7.2 12h2.2M7.2 15.7h2.2M15.2 14.3h1.7M15.2 17.4h1.7" />
      </>
    ),
    fill: (
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 3.4h5a2.6 2.6 0 0 1 2.6 2.6v3.6H18a2.6 2.6 0 0 1 2.6 2.6v8.3H22a.75.75 0 0 1 0 1.5H2a.75.75 0 0 1 0-1.5h1.4V6A2.6 2.6 0 0 1 6 3.4Zm1.2 3.9a.75.75 0 0 0 0 1.5h2.2a.75.75 0 0 0 0-1.5H7.2Zm0 3.7a.75.75 0 0 0 0 1.5h2.2a.75.75 0 0 0 0-1.5H7.2Zm0 3.7a.75.75 0 0 0 0 1.5h2.2a.75.75 0 0 0 0-1.5H7.2Zm8 -.9a.75.75 0 0 0 0 1.5h1.7a.75.75 0 0 0 0-1.5h-1.7Zm0 3.1a.75.75 0 0 0 0 1.5h1.7a.75.75 0 0 0 0-1.5h-1.7Z"
      />
    ),
  },
  // Hai toà tháp — Dự án
  duAn: {
    line: (
      <>
        <rect x="3.5" y="8.5" width="7" height="11.5" rx="1" />
        <rect x="12" y="4" width="8" height="16" rx="1" />
        <path strokeLinecap="round" d="M2.5 20.5h19M6 11.6h2M6 14.6h2M15 7.2h2M15 10.6h2M15 14h2" />
      </>
    ),
    fill: (
      <>
        <rect x="3.4" y="8.4" width="7.2" height="12.2" rx="1.2" />
        <rect x="11.9" y="3.9" width="8.2" height="16.7" rx="1.2" />
      </>
    ),
  },
  // Người dùng — Tài khoản
  user: {
    line: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.9 8.2a3.9 3.9 0 1 1-7.8 0 3.9 3.9 0 0 1 7.8 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.9 20.6a7.1 7.1 0 0 1 14.2 0" />
      </>
    ),
    fill: <path d="M12 3.55a4.65 4.65 0 1 0 0 9.3 4.65 4.65 0 0 0 0-9.3ZM12 14.1a7.85 7.85 0 0 0-7.85 6.9 1 1 0 0 0 1 1.1h13.7a1 1 0 0 0 1-1.1A7.85 7.85 0 0 0 12 14.1Z" />,
  },
};

function TabIcon({ name, active }: { name: keyof typeof ICONS; active: boolean }) {
  const g = ICONS[name];
  return (
    <svg
      className="h-[25px] w-[25px]"
      viewBox="0 0 24 24"
      aria-hidden
      {...(active
        ? { fill: "currentColor", stroke: "none" }
        : { fill: "none", stroke: "currentColor", strokeWidth: 1.6 })}
    >
      {active ? g.fill : g.line}
    </svg>
  );
}

// Trang KHÔNG hiện tab bar: đã có thanh hành động riêng dưới đáy, hoặc là luồng
// toàn màn hình (đăng nhập / đăng tin / admin) — tab bar chỉ gây rối và che nút.
const HIDDEN_PREFIXES = [
  "/admin",
  "/bat-dong-san/", // đã có thanh Gọi · Zalo dính đáy
  "/dang-nhap",
  "/dang-ky",
  "/quen-mat-khau",
  "/dang-tin",
  "/auth",
];

export default function MobileTabBar() {
  const pathname = usePathname() || "/";
  const { count } = useSaved();
  const { user } = useAuth();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const tabs = [
    { href: "/", label: "Trang chủ", icon: "home" as const, on: pathname === "/" },
    { href: "/mua-ban", label: "Mua bán", icon: "tag" as const, on: pathname.startsWith("/mua-ban") },
    { href: "/cho-thue", label: "Cho thuê", icon: "building" as const, on: pathname.startsWith("/cho-thue") },
    { href: "/du-an", label: "Dự án", icon: "duAn" as const, on: pathname.startsWith("/du-an") },
    {
      href: user ? "/tai-khoan" : "/dang-nhap",
      label: "Tài khoản",
      icon: "user" as const,
      on: pathname.startsWith("/tai-khoan"),
    },
  ];

  return (
    <>
      {/* Chỗ trống cuối trang để tab bar không che nội dung/footer */}
      <div className="h-[var(--tabbar-h)] shrink-0 lg:hidden" aria-hidden />

      <nav
        aria-label="Điều hướng nhanh"
        className="tabbar-glass fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="flex items-stretch">
          {tabs.map((t) => (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                onClick={() => { haptic(); if (t.href === "/") resetHomeIfOnHome(); }}
                aria-current={t.on ? "page" : undefined}
                className={`flex h-[49px] flex-col items-center justify-center gap-[2px] transition-colors duration-200 ${
                  t.on ? "text-cvr-blue" : "text-cvr-muted active:text-cvr-ink"
                }`}
              >
                <span className="relative">
                  <TabIcon name={t.icon} active={t.on} />
                  {t.href === "/tin-luu" && count > 0 && (
                    <span className="absolute -right-1.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium leading-none tracking-[-0.01em]">{t.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
