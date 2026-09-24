"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useProfile } from "@/lib/useProfile";
import { signOut } from "@/lib/useAuth";
import { vnd } from "@/lib/billing";
import { MUC_TAI_KHOAN } from "@/lib/menuTaiKhoan";

// ============================================================================
// KHU VỰC QUẢN LÝ CỦA KHÁCH HÀNG (/tai-khoan) — "trang admin của khách".
//
// GỌN THEO KHUNG BATDONGSAN (chủ dự án chốt 24/09/2026): 4 mục chính
//   Tổng quan · Tin đăng · Khách hàng · Đăng tin
// + nhóm Tài khoản (ví, hoá đơn, điểm, bảng giá, dự án, tin đã lưu, cài đặt).
// Không trùng lặp, không nút kêu gọi to — khách vào tới đây là đã biết việc.
//
//   · Máy tính (lg+): cột trái dính theo cuộn.
//   · Điện thoại: KHÔNG có menu ở đầu trang nữa — thanh dưới cùng (MobileTabBar)
//     tự đổi sang 5 nút của người bán khi đang ở /tai-khoan.
// Middleware đã chặn khách chưa đăng nhập.
// ============================================================================

type Muc = { label: string; href: string; icon: string };

const MUC_CHINH: Muc[] = [
  { label: "Tổng quan", href: "/tai-khoan", icon: "grid" },
  { label: "Tin đăng", href: "/tai-khoan/tin-dang", icon: "doc" },
  { label: "Khách hàng", href: "/tai-khoan/khach-hang", icon: "users" },
  { label: "Đăng tin", href: "/dang-tin", icon: "plus" },
];

function dangXem(href: string, pathname: string): boolean {
  if (href === "/tai-khoan") return pathname === "/tai-khoan";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, loading } = useProfile();
  // Số dư ví: cột balance có thể chưa bật trong CSDL → coi như 0.
  const soDu = (profile as unknown as { balance?: number } | null)?.balance ?? 0;

  const dong = (m: Muc, phu?: React.ReactNode) => {
    const active = dangXem(m.href, pathname);
    return (
      <Link
        key={m.href}
        href={m.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          active ? "bg-cvr-ink text-white" : "text-cvr-body hover:bg-cvr-surface hover:text-cvr-ink"
        }`}
      >
        <MucIcon name={m.icon} />
        <span className="min-w-0 flex-1 truncate">{m.label}</span>
        {phu}
      </Link>
    );
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-cvr-surface">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-footer sm:px-6 lg:pt-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[232px_1fr] lg:gap-8">
            {/* MÁY TÍNH — cột điều hướng dính theo cuộn */}
            <aside className="hidden lg:block">
              <div className="no-scrollbar sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-cvr-line bg-white p-3 shadow-lux">
                <p className="truncate px-3 pb-2 pt-1 text-sm text-cvr-muted">
                  {loading ? "Tài khoản" : <>Xin chào, <strong className="font-semibold text-cvr-ink">{profile?.full_name || "bạn"}</strong></>}
                </p>
                <div className="space-y-0.5">{MUC_CHINH.map((m) => dong(m))}</div>

                <div className="mt-4 border-t border-cvr-line pt-4">
                  <p className="mb-2 px-3 text-[13px] font-semibold text-cvr-ink">Tài khoản</p>
                  <div className="space-y-0.5">
                    {MUC_TAI_KHOAN.map((m) =>
                      dong(
                        m,
                        m.href === "/tai-khoan/nap-tien" ? (
                          <span className={`shrink-0 text-xs font-semibold ${dangXem(m.href, pathname) ? "text-white" : "text-cvr-ink"}`}>
                            {loading ? "…" : vnd(soDu)}
                          </span>
                        ) : undefined,
                      ),
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-cvr-line pt-3">
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-cvr-muted transition hover:bg-cvr-surface hover:text-cvr-ink"
                  >
                    <MucIcon name="out" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </aside>

            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function MucIcon({ name }: { name: string }) {
  const common = "h-[18px] w-[18px] shrink-0";
  const props = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, viewBox: "0 0 24 24" } as const;
  if (name === "grid")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>;
  if (name === "plus")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>;
  if (name === "building")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16m0-10h2a2 2 0 012 2v8M9 7h2m-2 4h2m-2 4h2" /></svg>;
  if (name === "heart")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 20s-7-4.5-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.5 12 20 12 20z" /></svg>;
  if (name === "card")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm2 9h4" /></svg>;
  if (name === "bill")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12v18l-3-1.8-3 1.8-3-1.8L6 21V3zm3 5h6M9 12h6m-6 4h4" /></svg>;
  if (name === "star")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L4.5 10l5.2-.8L12 4.5z" /></svg>;
  if (name === "tag")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 11V5a2 2 0 012-2h6l9 9a2 2 0 010 2.83l-5.17 5.17a2 2 0 01-2.83 0L3 11z" /></svg>;
  if (name === "gear")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.2a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.6 1.7 1.7 0 00-1.9.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H2.9a2 2 0 110-4H3a1.7 1.7 0 001.6-1.1 1.7 1.7 0 00-.4-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V2.9a2 2 0 114 0V3a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1h.2a2 2 0 110 4H21a1.7 1.7 0 00-1.5 1z" /></svg>;
  if (name === "users")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3 3 0 100-6 3 3 0 000 6zM21 19v-1a4 4 0 00-3-3.87M15.5 4.13a3 3 0 010 5.74" /></svg>;
  if (name === "out")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 01-2-2V6a2 2 0 012-2h6" /></svg>;
  return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" /></svg>;
}
