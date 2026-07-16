"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useProfile } from "@/lib/useProfile";

const tabs = [
  { label: "Tổng quan", href: "/tai-khoan" },
  { label: "Tin đã đăng", href: "/tai-khoan/tin-dang" },
  { label: "Cài đặt", href: "/tai-khoan/cai-dat" },
];

// Khu vực tài khoản thành viên (middleware đã chặn khách chưa đăng nhập).
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, loading } = useProfile();

  return (
    <>
      <Header />
      <main className="flex-1 bg-cvr-surface">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">
            {loading ? "Tài khoản" : profile?.full_name || "Tài khoản"}
          </h1>
          <p className="mt-1 text-sm text-cvr-muted">Quản lý tin đăng và thông tin cá nhân.</p>

          {/* Tab điều hướng */}
          <nav className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-cvr-line bg-white p-1">
            {tabs.map((t) => {
              const active = t.href === "/tai-khoan" ? pathname === t.href : pathname.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                    active ? "bg-cvr-ink text-white" : "text-cvr-body hover:bg-cvr-surface"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
