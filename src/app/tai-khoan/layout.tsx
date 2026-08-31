"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useProfile } from "@/lib/useProfile";
import { signOut } from "@/lib/useAuth";

// ============================================================================
// KHU VỰC QUẢN LÝ CỦA KHÁCH HÀNG (/tai-khoan) — "trang admin của khách".
// Thanh điều hướng đầy đủ, chia nhóm như khu quản trị:
//   · Máy tính (lg+): cột trái dính theo cuộn, thấy hết mọi mục cùng lúc.
//   · Điện thoại: một hàng chip cuộn ngang, mục đang xem tô đậm.
// Middleware đã chặn khách chưa đăng nhập.
// ============================================================================

type Muc = { label: string; href: string; icon: string };

const nhomMuc: { nhom: string; items: Muc[] }[] = [
  {
    nhom: "",
    items: [{ label: "Tổng quan", href: "/tai-khoan", icon: "grid" }],
  },
  {
    nhom: "Tin đăng",
    items: [
      { label: "Tin đã đăng", href: "/tai-khoan/tin-dang", icon: "doc" },
      { label: "Tin đã lưu", href: "/tin-luu", icon: "heart" },
      { label: "Dự án của tôi", href: "/tai-khoan/du-an", icon: "building" },
    ],
  },
  {
    nhom: "Ví & ưu đãi",
    items: [
      { label: "Nạp tiền", href: "/tai-khoan/nap-tien", icon: "card" },
      { label: "Hóa đơn của tôi", href: "/tai-khoan/hoa-don", icon: "card" },
      { label: "Đổi điểm", href: "/tai-khoan/doi-diem", icon: "star" },
      { label: "Bảng giá dịch vụ", href: "/bao-gia-dang-tin", icon: "tag" },
    ],
  },
  {
    nhom: "Tài khoản",
    items: [{ label: "Cài đặt", href: "/tai-khoan/cai-dat", icon: "gear" }],
  },
];

const tatCaMuc = nhomMuc.flatMap((g) => g.items);

function dangXem(href: string, pathname: string): boolean {
  if (href === "/tai-khoan") return pathname === "/tai-khoan";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, loading } = useProfile();

  return (
    <>
      <Header />
      <main className="flex-1 bg-cvr-surface">
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-footer sm:px-6">
          {/* LỜI CHÀO, KHÔNG PHẢI TIÊU ĐỀ TRANG.
              Trước đây chỗ này là <h1> ghi TÊN KHÁCH, rồi mỗi trang con lại có
              <h1> riêng → hai tiêu đề chồng nhau, và trang nào cũng "đội" tên
              người thay vì tên trang. Nay để một dòng chào nhỏ; tên trang do
              CHÍNH trang đó đặt (xem PageHeader). */}
          <p className="text-sm text-cvr-muted">
            {loading ? "Tài khoản" : <>Xin chào, <strong className="font-semibold text-cvr-ink">{profile?.full_name || "bạn"}</strong></>}
          </p>

          {/* ĐIỆN THOẠI — hàng chip cuộn ngang, DÍNH ngay dưới header (60px) để
              cuộn tới đâu vẫn thấy đường đi, không phải vuốt ngược lên đầu trang. */}
          <nav
            aria-label="Điều hướng tài khoản"
            className="no-scrollbar sticky top-[calc(60px+var(--backbar-h)+env(safe-area-inset-top))] z-20 -mx-4 mt-5 flex gap-1.5 overflow-x-auto border-y border-cvr-line bg-white px-4 py-2.5 sm:-mx-6 sm:px-6 lg:hidden"
          >
            {tatCaMuc.map((m) => {
              const active = dangXem(m.href, pathname);
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-cvr-ink text-white"
                      : "border border-cvr-line bg-white text-cvr-body active:bg-cvr-surface"
                  }`}
                >
                  <MucIcon name={m.icon} />
                  {m.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[232px_1fr] lg:gap-8">
            {/* MÁY TÍNH — cột điều hướng dính theo cuộn */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-cvr-line bg-white p-3 shadow-lux">
                <Link
                  href="/dang-tin"
                  className="mb-3 flex items-center justify-center gap-1.5 rounded-xl bg-cvr-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Đăng tin mới
                </Link>

                {nhomMuc.map((g, i) => (
                  <div key={g.nhom || i} className={i > 0 ? "mt-4" : ""}>
                    {g.nhom && (
                      <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-cvr-faint">
                        {g.nhom}
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {g.items.map((m) => {
                        const active = dangXem(m.href, pathname);
                        return (
                          <Link
                            key={m.href}
                            href={m.href}
                            aria-current={active ? "page" : undefined}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                              active
                                ? "bg-cvr-ink text-white"
                                : "text-cvr-body hover:bg-cvr-surface hover:text-cvr-ink"
                            }`}
                          >
                            <MucIcon name={m.icon} />
                            {m.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

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
  if (name === "building")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16m0-10h2a2 2 0 012 2v8M9 7h2m-2 4h2m-2 4h2" /></svg>;
  if (name === "heart")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 20s-7-4.5-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.5 12 20 12 20z" /></svg>;
  if (name === "card")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm2 9h4" /></svg>;
  if (name === "star")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L4.5 10l5.2-.8L12 4.5z" /></svg>;
  if (name === "tag")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 11V5a2 2 0 012-2h6l9 9a2 2 0 010 2.83l-5.17 5.17a2 2 0 01-2.83 0L3 11z" /></svg>;
  if (name === "gear")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.2a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.6 1.7 1.7 0 00-1.9.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H2.9a2 2 0 110-4H3a1.7 1.7 0 001.6-1.1 1.7 1.7 0 00-.4-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V2.9a2 2 0 114 0V3a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1h.2a2 2 0 110 4H21a1.7 1.7 0 00-1.5 1z" /></svg>;
  if (name === "out")
    return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 01-2-2V6a2 2 0 012-2h6" /></svg>;
  return <svg className={common} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" /></svg>;
}
