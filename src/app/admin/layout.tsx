"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "@/lib/useProfile";
import { signOut } from "@/lib/useAuth";

const nav = [
  { label: "Tổng quan", href: "/admin", icon: "grid" },
  { label: "Tin đăng", href: "/admin/tin-dang", icon: "doc" },
  { label: "Đăng tin mới", href: "/admin/tin-dang/moi", icon: "plus" },
  { label: "Dự án", href: "/admin/du-an", icon: "building" },
  { label: "Tin tức", href: "/admin/tin-tuc", icon: "news" },
  { label: "Khách hàng", href: "/admin/khach-hang", icon: "users" },
];

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-cvr-surface text-sm text-cvr-muted">
        Đang tải khu vực quản trị…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cvr-surface">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-cvr-line bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-cvr-line px-5">
          <span className="text-base font-semibold tracking-tight text-cvr-ink">COASTAL LAND</span>
          <span className="rounded bg-cvr-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Admin
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
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
        <header className="flex h-16 items-center justify-between border-b border-cvr-line bg-white px-5">
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-sm font-semibold text-cvr-ink">COASTAL LAND</span>
            <span className="rounded bg-cvr-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Admin</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-cvr-body">
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

        {/* Nav ngang cho mobile */}
        <nav className="flex gap-1 overflow-x-auto border-b border-cvr-line bg-white px-3 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-cvr-body hover:bg-cvr-surface"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-5 sm:p-6 lg:p-8">{children}</main>
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
  if (name === "news")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 002 2zm0 0a2 2 0 002-2V8M7 8h6m-6 4h6m-6 4h4" /></svg>;
  return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" /></svg>;
}
