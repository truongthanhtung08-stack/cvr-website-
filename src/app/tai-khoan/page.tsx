"use client";

import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { roleLabel, statusBadge } from "@/lib/adminLabels";

// Tổng quan tài khoản: thông tin gói + hạn mức + lối tắt.
export default function AccountOverviewPage() {
  const { profile, loading } = useProfile();

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;
  if (!profile) return <p className="text-sm text-cvr-muted">Không tải được hồ sơ. Vui lòng đăng nhập lại.</p>;

  return (
    <div className="space-y-5">
      {/* Thẻ trạng thái */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Vai trò" value={roleLabel(profile.role)} />
        <Card label="Gói dịch vụ" value={profile.plan || "Basic (miễn phí)"} />
        <Card label="Hạn mức tin miễn phí" value={`${profile.free_quota} tin`} />
      </div>

      {/* Trạng thái tài khoản */}
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-cvr-ink">Trạng thái tài khoản</h2>
            <p className="mt-1 text-sm text-cvr-muted">
              {profile.email} {profile.phone ? `· ${profile.phone}` : ""}
            </p>
          </div>
          {statusBadge(profile.status)}
        </div>
      </div>

      {/* Lối tắt */}
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-cvr-ink">Bắt đầu nhanh</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/dang-tin" className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
            + Đăng tin mới
          </Link>
          <Link href="/tai-khoan/tin-dang" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            Tin đã đăng
          </Link>
          <Link href="/tin-luu" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            Tin đã lưu
          </Link>
          <Link href="/tai-khoan/cai-dat" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            Cài đặt tài khoản
          </Link>
        </div>
      </div>

      {profile.role === "admin" && (
        <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-cvr-ink">Quản trị viên</h2>
          <p className="mt-1 text-sm text-cvr-muted">Bạn có quyền quản trị nền tảng.</p>
          <Link href="/admin" className="mt-3 inline-block rounded-lg bg-cvr-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink">
            Mở trang quản trị →
          </Link>
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
      <p className="text-sm text-cvr-muted">{label}</p>
      <p className="mt-1.5 text-lg font-semibold tracking-tight text-cvr-ink">{value}</p>
    </div>
  );
}
