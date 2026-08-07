"use client";

import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { roleLabel, statusBadge } from "@/lib/adminLabels";
import { freeNote, levelOf, levelTiepTheo, tenGoiMienPhi, vnd } from "@/lib/billing";
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
  // QUYỀN ĐĂNG DỰ ÁN — mặc định KHOÁ. Chỉ mở khi quản trị viên duyệt hồ sơ
  // Chủ đầu tư / Công ty phân phối (cột profiles.can_post_project).
  const duocDangDuAn = Boolean((profile as unknown as { can_post_project?: boolean }).can_post_project);

  const level = levelOf(billing, totalSpend);       // null = chưa đạt mốc nào
  const capKeTiep = levelTiepTheo(billing, totalSpend);
  const pointValue = points * billing.points.redeemRate;
  const free = billing.free;

  return (
    <div className="space-y-5">
      {/* Ví thành viên */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Số dư tài khoản" value={vnd(balance)} accent />
        <Card label="Điểm thưởng" value={`${points} điểm`} sub={pointValue > 0 ? `≈ ${vnd(pointValue)}` : "Nạp tiền để tích điểm"} />
        <Card
          label="Cấp hội viên"
          value={level ? level.name : "Chưa có cấp"}
          sub={
            level && level.discount > 0
              ? `Giảm thêm ${level.discount}% khi đăng tin`
              : capKeTiep
                ? `Chi tiêu ${vnd(capKeTiep.minSpend)} để lên ${capKeTiep.name}`
                : undefined
          }
          color={level?.color}
        />
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

      {/* ĐĂNG TIN — việc quan trọng nhất của khách, nên làm NỔI hẳn:
          viền xanh + nền xanh nhạt + icon từng loại để nhìn phát nhận ra ngay. */}
      <div className="rounded-2xl border-2 border-cvr-blue/35 bg-cvr-blue/[0.05] p-5 shadow-lux">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cvr-blue text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-cvr-ink">Đăng tin mới</h2>
            <p className="mt-0.5 text-sm text-cvr-muted">Chọn loại tin bạn muốn đăng — chỉ mất 2 phút.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PostType href="/dang-tin?loai=ban" icon="tag" title="Mua bán" desc="Nhà, đất, căn hộ cần bán" />
          <PostType href="/dang-tin?loai=thue" icon="key" title="Cho thuê" desc="Nhà, mặt bằng, căn hộ cho thuê" />
          {/* ĐĂNG DỰ ÁN — KHOÁ, chỉ mở cho Chủ đầu tư / Công ty phân phối đã được
              quản trị viên xét duyệt hồ sơ. Trước đây ô này dẫn sang form tin
              mua bán/cho thuê (không đăng được dự án) nên gây hiểu nhầm. */}
          <PostTypeKhoa
            icon="building"
            title="Dự án"
            desc={
              duocDangDuAn
                ? "Đăng dự án của bạn"
                : "Chỉ dành cho Chủ đầu tư / Công ty phân phối — cần duyệt hồ sơ"
            }
            moKhoa={duocDangDuAn}
          />
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

// Ô "Đăng dự án" khi CHƯA được duyệt: không bấm vào form được, thay bằng lối
// gửi hồ sơ để quản trị viên xét (Chủ đầu tư / Công ty phân phối).
function PostTypeKhoa({ icon, title, desc, moKhoa }: { icon: string; title: string; desc: string; moKhoa: boolean }) {
  if (moKhoa) return <PostType href="/dang-tin/du-an" icon={icon} title={title} desc={desc} />;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-cvr-line bg-cvr-surface p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-cvr-faint">
        <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-cvr-body">{title}</span>
        <span className="mt-0.5 block text-xs text-cvr-muted">{desc}</span>
        <Link href="/tai-khoan/cai-dat" className="mt-1 inline-block text-xs font-semibold text-cvr-blue-ink underline">
          Gửi hồ sơ xét duyệt →
        </Link>
      </span>
    </div>
  );
}

function PostType({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  const props = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, viewBox: "0 0 24 24" } as const;
  const hinh =
    icon === "tag" ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 11V5a2 2 0 012-2h6l9 9a2 2 0 010 2.83l-5.17 5.17a2 2 0 01-2.83 0L3 11z" />
    ) : icon === "key" ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a4 4 0 11-3.9 5H8v3H5v3H2v-3l6.1-6A4 4 0 0115 7z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16m0-10h2a2 2 0 012 2v8M9 7h2m-2 4h2m-2 4h2" />
    );
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-cvr-line bg-white p-4 transition hover:border-cvr-blue hover:shadow-lux"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cvr-blue/10 text-cvr-blue-ink">
        <svg className="h-[22px] w-[22px]" {...props}>{hinh}</svg>
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-cvr-ink">{title}</span>
        <span className="mt-0.5 block text-xs text-cvr-muted">{desc}</span>
      </span>
    </Link>
  );
}
