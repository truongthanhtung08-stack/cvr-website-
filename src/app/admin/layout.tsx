"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "@/lib/useProfile";
import { signOut } from "@/lib/useAuth";

// Điều hướng quản trị — chia NHÓM cho dễ tìm (thay vì 9 mục phẳng):
//   Tổng quan · Đăng bán (nội dung tin) · Kinh doanh (khách, giá, thu tiền) · Website
const navGroups: { group: string; items: { label: string; href: string; icon: string }[] }[] = [
  {
    group: "",
    items: [{ label: "Tổng quan", href: "/admin", icon: "grid" }],
  },
  {
    group: "Nội dung đăng",
    items: [
      { label: "Tin đăng", href: "/admin/tin-dang", icon: "doc" },
      { label: "Đăng tin mới", href: "/admin/tin-dang/moi", icon: "plus" },
      { label: "Dự án", href: "/admin/du-an", icon: "building" },
      { label: "Tin tức", href: "/admin/tin-tuc", icon: "news" },
    ],
  },
  {
    group: "Kinh doanh",
    items: [
      { label: "Khách hàng", href: "/admin/khach-hang", icon: "users" },
      { label: "Giá & khuyến mãi", href: "/admin/gia-khuyen-mai", icon: "tag" },
      { label: "Thanh toán", href: "/admin/thanh-toan", icon: "card" },
    ],
  },
  {
    group: "Website",
    items: [{ label: "Nội dung web", href: "/admin/noi-dung", icon: "doc" }],
  },
];

const nav = navGroups.flatMap((g) => g.items);

// Mục đang xem: khớp chính xác với /admin, khớp tiền tố với các mục còn lại.
// Riêng "Tin đăng" không sáng khi đang ở "Đăng tin mới".
function isActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/tin-dang") return pathname === "/admin/tin-dang" || /^\/admin\/tin-dang\/(?!moi)/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile();
  const pathname = usePathname();

  // Gác phía client (lớp 2, cùng với middleware): không phải admin → về trang chủ.
  useEffect(() => {
    if (!loading && (!profile || profile.role !== "admin")) {
      window.location.href = "/";
    }
  }, [loading, profile]);

  if (loading || !profile || profile.role !== "admin") {
    // Màn hình chờ giữ ĐÚNG khung của trang quản trị (có chỗ cột trái + thanh trên)
    // → khi tải xong nội dung không bị nhảy sang phải như trước.
    return (
      <div className="flex min-h-screen bg-cvr-surface">
        <div className="hidden w-60 shrink-0 border-r border-cvr-line bg-white md:block" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="h-14 shrink-0 border-b border-cvr-line bg-white sm:h-16" />
          <div className="h-[45px] shrink-0 border-b border-cvr-line bg-white md:hidden" />
          <div className="flex flex-1 items-center justify-center text-sm text-cvr-muted">
            Đang tải khu vực quản trị…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cvr-surface">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-cvr-line bg-white md:flex">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-cvr-line px-5">
          <span className="text-base font-semibold tracking-tight text-cvr-ink">COASTAL LAND</span>
          <span className="rounded bg-cvr-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Admin
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {navGroups.map((g, gi) => (
            <div key={g.group || gi} className={gi > 0 ? "mt-4" : ""}>
              {g.group && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-cvr-faint">
                  {g.group}
                </p>
              )}
              <div className="space-y-1">
                {g.items.map((item) => {
                  const active = isActive(item.href, pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-cvr-ink text-white"
                          : "text-cvr-body hover:bg-cvr-surface hover:text-cvr-ink"
                      }`}
                    >
                      <NavIcon name={item.icon} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-cvr-line p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-cvr-muted transition hover:bg-cvr-surface hover:text-cvr-ink"
          >
            ← Về trang chủ
          </Link>
        </div>
      </aside>

      {/* Nội dung */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Thanh trên — dính khi cuộn để luôn có lối đăng xuất / về trang chủ */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-cvr-line bg-white/95 px-4 backdrop-blur sm:h-16 sm:px-5">
          {/* Điều hướng: Quay lại · Tiến tới · Tổng quan — luôn có ở mọi trang admin */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Quay lại"
              onClick={() => window.history.back()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
            >
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              type="button"
              aria-label="Tiến tới"
              onClick={() => window.history.forward()}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink sm:flex"
            >
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <Link
              href="/admin"
              aria-label="Tổng quan"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-cvr-line px-3 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
            >
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-8 9 8M5 10v10h14V10" /></svg>
              <span className="hidden sm:inline">Tổng quan</span>
            </Link>
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-4">
            <Link href="/" className="hidden text-sm text-cvr-muted transition hover:text-cvr-ink sm:inline">
              Xem web ↗
            </Link>
            <span className="hidden max-w-[180px] truncate text-sm text-cvr-body sm:inline">
              {profile.full_name || profile.email}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-cvr-line px-3 py-1.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Điều hướng ngang trên điện thoại — dính dưới thanh trên, mục đang xem
            được tô đậm, cuộn ngang một dòng (không xuống hàng, không cắt chữ) */}
        <nav className="no-scrollbar sticky top-14 z-20 flex gap-1.5 overflow-x-auto border-b border-cvr-line bg-white px-3 py-2 sm:top-16 md:hidden">
          {nav.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body active:bg-cvr-surface"
                }`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-5 lg:p-6"><div className="mx-auto w-full max-w-5xl">{children}</div></main>
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  const common = "h-[18px] w-[18px] shrink-0";
  const props = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, viewBox: "0 0 24 24" } as const;
  if (name === "grid")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>;
  if (name === "users")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a4 4 0 00-3-3.87M9 20H4v-1a4 4 0 013-3.87m6-1a4 4 0 100-8 4 4 0 000 8zm6-4a3 3 0 10-2-5.24M5 12a3 3 0 002-5.24" /></svg>;
  if (name === "plus")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg>;
  if (name === "building")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16m0-10h2a2 2 0 012 2v8M9 7h2m-2 4h2m-2 4h2" /></svg>;
  if (name === "tag")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 11V5a2 2 0 012-2h6l9 9a2 2 0 010 2.83l-5.17 5.17a2 2 0 01-2.83 0L3 11z" /></svg>;
  if (name === "card")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm2 9h4" /></svg>;
  if (name === "news")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 002 2zm0 0a2 2 0 002-2V8M7 8h6m-6 4h6m-6 4h4" /></svg>;
  return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" /></svg>;
}
