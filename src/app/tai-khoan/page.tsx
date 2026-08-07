"use client";

import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { roleLabel, statusBadge } from "@/lib/adminLabels";
import { freeNote, levelOf, tenGoiMienPhi, vnd } from "@/lib/billing";
import { useBilling } from "@/lib/useBilling";

// Tổng quan tài khoản thành viên: ví (số dư · điểm · cấp) + gói dịch vụ +
// lối tắt đăng tin (Mua bán / Cho thuê / Dự án) và quản lý tài khoản.
export default function AccountOverviewPage() {
  const { profile, loading } = useProfile();
  // Giá · điểm · cấp thành viên lấy từ bản admin đã lưu (không phải giá cứng trong code)
  const { billing, loading: billingLoading } = useBilling();

  if (loading || billingLoading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;
  if (!profile) return <p className="text-sm text-cvr-muted">Không tải được hồ sơ. Vui lòng đăng nhập lại.</p>;

  // Ví: các cột balance/points/total_spend có thể chưa bật trong CSDL → coi như 0.
  const p = profile as unknown as { balance?: number; points?: number; total_spend?: number };
  const balance = p.balance ?? 0;
  const points = p.points ?? 0;
  const totalSpend = p.total_spend ?? 0;
  const level = levelOf(billing, totalSpend);
  const pointValue = points * billing.points.redeemRate;
  const free = billing.free;

  return (
    <div className="space-y-5">
      {/* Ví thành viên */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Số dư tài khoản" value={vnd(balance)} accent />
        <Card label="Điểm thưởng" value={`${points} điểm`} sub={pointValue > 0 ? `≈ ${vnd(pointValue)}` : "Nạp tiền để tích điểm"} />
        <Card label="Cấp thành viên" value={level.name} sub={level.discount > 0 ? `Giảm thêm ${level.discount}% khi đăng tin` : "Chi tiêu để lên cấp"} color={level.color} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/tai-khoan/nap-tien" className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          + Nạp tiền
        </Link>
        <Link href="/tai-khoan/doi-diem" className="rounded-lg border border-cvr-line px-5 py-2.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
          Đổi điểm
        </Link>
        <Link href="/bao-gia-dang-tin" className="rounded-lg border border-cvr-line px-5 py-2.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
          Bảng giá dịch vụ
        </Link>
      </div>

      {/* Gói dịch vụ + hạn mức */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Vai trò" value={roleLabel(profile.role)} />
        <Card label="Gói dịch vụ" value={profile.plan || "Basic (miễn phí)"} />
        <Card
          label={free.active && free.quota === 0 ? "Tin miễn phí" : "Tin miễn phí còn lại"}
          value={free.active && free.quota === 0 ? "Không giới hạn" : `${profile.free_quota} tin`}
        />
      </div>

      {free.active && (
        <p className="rounded-xl border border-cvr-blue/25 bg-cvr-blue/[0.06] px-4 py-3 text-sm text-cvr-blue-ink">
          {freeNote(free, tenGoiMienPhi(billing))}
        </p>
      )}

      {/* Đăng tin — đúng 3 loại của nền tảng */}
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-cvr-ink">Đăng tin mới</h2>
        <p className="mt-1 text-sm text-cvr-muted">Chọn loại tin bạn muốn đăng.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PostType href="/dang-tin?loai=ban" title="Mua bán" desc="Nhà, đất, căn hộ cần bán" />
          <PostType href="/dang-tin?loai=thue" title="Cho thuê" desc="Nhà, mặt bằng, căn hộ cho thuê" />
          <PostType href="/dang-tin?loai=du-an" title="Dự án" desc="Dự án chủ đầu tư phân phối" />
        </div>
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
        <div className="mt-4 flex flex-wrap gap-3">
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

function Card({ label, value, sub, accent, color }: { label: string; value: string; sub?: string; accent?: boolean; color?: string }) {
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
      <p className="text-sm text-cvr-muted">{label}</p>
      <p
        className={`mt-1.5 text-lg font-semibold tracking-tight ${accent ? "text-cvr-blue-ink" : "text-cvr-ink"}`}
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-cvr-muted">{sub}</p>}
    </div>
  );
}

function PostType({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-xl border border-cvr-line p-4 transition hover:border-cvr-ink hover:shadow-sm">
      <p className="font-semibold text-cvr-ink">{title}</p>
      <p className="mt-0.5 text-xs text-cvr-muted">{desc}</p>
    </Link>
  );
}
