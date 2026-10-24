"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useProfile } from "@/lib/useProfile";
import { useAuth, anhDaiDien } from "@/lib/useAuth";
import AnhDaiDien from "@/components/AnhDaiDien";
import { signOut } from "@/lib/useAuth";
import { vnd } from "@/lib/billing";
import { MUC_TAI_KHOAN } from "@/lib/menuTaiKhoan";
import BieuTuong, { type TenBieuTuong } from "@/components/BieuTuong";

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
  const { user } = useAuth();
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
                <div className="flex items-center gap-2.5 px-3 pb-3 pt-1">
                  <AnhDaiDien url={profile?.avatar_url || anhDaiDien(user)} ten={profile?.full_name || "T"} className="h-9 w-9 bg-cvr-surface text-sm text-cvr-ink ring-1 ring-cvr-line" />
                  <p className="min-w-0 truncate text-sm text-cvr-muted">
                    {loading ? "Tài khoản" : <>Xin chào, <strong className="font-semibold text-cvr-ink">{profile?.full_name || "bạn"}</strong></>}
                  </p>
                </div>
                <div className="space-y-0.5">{MUC_CHINH.map((m) => dong(m))}</div>

                <div className="mt-4 border-t border-cvr-line pt-4">
                  {/* Tiêu đề nhóm = trang Tài khoản (menu avatar trỏ tới đây) → bấm được, sáng khi đang đứng */}
                  <Link
                    href="/tai-khoan/ca-nhan"
                    aria-current={pathname === "/tai-khoan/ca-nhan" ? "page" : undefined}
                    className={`mb-2 block rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                      pathname === "/tai-khoan/ca-nhan" ? "bg-cvr-ink text-white" : "text-cvr-ink hover:bg-cvr-surface"
                    }`}
                  >
                    Tài khoản
                  </Link>
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

// Biểu tượng cột trái khu tài khoản = BỘ CHUNG Phosphor (cùng hình thanh tab người bán, 25/10/2026)
const MUC_PHOSPHOR: Record<string, TenBieuTuong> = {
  grid: "tongQuan", doc: "tinDang", users: "khachHang", plus: "dangTin", building: "duAn", heart: "tim", bell: "thongBao",
  card: "vi", bill: "hoaDon", star: "hoiVien", tag: "baoGia", gear: "caiDat", out: "dangXuat",
};
function MucIcon({ name }: { name: string }) {
  return <BieuTuong ten={MUC_PHOSPHOR[name] ?? "quanTri"} className="h-[18px] w-[18px] shrink-0" />;
}
