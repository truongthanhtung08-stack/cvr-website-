"use client";

import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { signOut } from "@/lib/useAuth";
import { roleLabel, statusBadge } from "@/lib/adminLabels";
import { vnd } from "@/lib/billing";
import { MUC_TAI_KHOAN } from "@/lib/menuTaiKhoan";
import { PageHeader } from "@/components/Ui";

// ============================================================================
// TÀI KHOẢN — nút cuối ở thanh dưới cùng (chế độ người bán) trên điện thoại.
// Gom mọi thứ PHỤ về một chỗ (ví, hoá đơn, điểm, bảng giá, dự án, tin đã lưu,
// cài đặt) để Tổng quan chỉ còn việc chính. Kiểu danh sách cài đặt của iPhone:
// mỗi dòng một mục, số liệu nằm bên phải, không nút to.
// Máy tính cũng vào được trang này, nhưng menu trái đã có sẵn các mục đó.
// ============================================================================
export default function TaiKhoanCaNhanPage() {
  const { profile, loading } = useProfile();
  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;
  if (!profile) return <p className="text-sm text-cvr-muted">Không tải được hồ sơ. Vui lòng đăng nhập lại.</p>;

  const p = profile as unknown as { balance?: number; points?: number };
  const giaTri: Record<string, string> = {
    "/tai-khoan/nap-tien": vnd(p.balance ?? 0),
    "/tai-khoan/doi-diem": `${p.points ?? 0} điểm`,
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Tài khoản" />

      {/* Thông tin người dùng */}
      <section className="flex items-center justify-between gap-3 rounded-2xl border border-cvr-line bg-white p-4 shadow-sm">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-cvr-ink">{profile.full_name || "Thành viên"}</p>
          <p className="truncate text-sm text-cvr-muted">
            {[profile.phone, profile.email].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-0.5 text-[13px] text-cvr-muted">{roleLabel(profile.role)}</p>
        </div>
        <div className="shrink-0">{statusBadge(profile.status)}</div>
      </section>

      {/* Danh sách mục — một dòng một việc */}
      <nav aria-label="Mục tài khoản" className="overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-sm">
        {[...MUC_TAI_KHOAN, ...(profile.role === "admin" ? [{ label: "Trang quản trị", href: "/admin", icon: "" }] : [])].map((m, i) => (
          <Link
            key={m.href}
            href={m.href}
            className={`flex items-center justify-between gap-3 px-4 py-3.5 text-[15px] text-cvr-ink transition active:bg-cvr-surface ${i > 0 ? "border-t border-cvr-line/70" : ""}`}
          >
            <span className="min-w-0 truncate">{m.label}</span>
            <span className="flex shrink-0 items-center gap-2 text-sm text-cvr-muted">
              {giaTri[m.href]}
              <svg className="h-4 w-4 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={signOut}
        className="w-full rounded-2xl border border-cvr-line bg-white py-3.5 text-[15px] font-medium text-red-600 shadow-sm transition active:bg-cvr-surface"
      >
        Đăng xuất
      </button>
    </div>
  );
}
