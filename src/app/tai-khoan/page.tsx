"use client";

import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { roleLabel, statusBadge } from "@/lib/adminLabels";
import { conThieuDeLenCap, freeNote, levelOf, levelTiepTheo, tenGoiMienPhi, vnd } from "@/lib/billing";
import { useBilling } from "@/lib/useBilling";
import { PageHeader } from "@/components/Ui";

// Tổng quan tài khoản thành viên: ví (số dư · điểm · cấp) + gói dịch vụ +
// lối tắt đăng tin (Mua bán / Cho thuê / Dự án) và quản lý tài khoản.
export default function AccountOverviewPage() {
  const { profile, loading } = useProfile();
  // Giá · điểm · cấp thành viên lấy từ bản admin đã lưu (không phải giá cứng trong code)
  const { billing, loading: billingLoading } = useBilling();

  if (loading || billingLoading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;
  if (!profile) return <p className="text-sm text-cvr-muted">Không tải được hồ sơ. Vui lòng đăng nhập lại.</p>;

  // Ví: các cột balance/points/total_topup có thể chưa bật trong CSDL → coi như 0.
  const p = profile as unknown as { balance?: number; points?: number; total_topup?: number };
  const balance = p.balance ?? 0;
  const points = p.points ?? 0;
  // Cấp hội viên xét theo TỔNG TIỀN ĐÃ NẠP (cột profiles.total_topup)
  const totalTopup = p.total_topup ?? 0;
  // QUYỀN ĐĂNG DỰ ÁN — mặc định KHOÁ. Chỉ mở khi quản trị viên duyệt hồ sơ
  // Chủ đầu tư / Công ty phân phối (cột profiles.can_post_project).
  const duocDangDuAn = Boolean((profile as unknown as { can_post_project?: boolean }).can_post_project);

  const level = levelOf(billing, totalTopup);       // null = chưa đạt mốc nào
  const capKeTiep = levelTiepTheo(billing, totalTopup);
  const conThieu = conThieuDeLenCap(billing, totalTopup);
  const pointValue = points * billing.points.redeemRate;
  const free = billing.free;

  return (
    // ── BỐ CỤC XẾP THEO VIỆC KHÁCH CẦN LÀM, KHÔNG THEO CON SỐ ────────────────
    // Trước đây khách vừa đăng nhập là gặp ngay 6 ô số liệu (số dư · điểm · cấp ·
    // vai trò · gói · tin miễn phí) rồi 3 cụm nút rải rác → rối, không biết bấm
    // đâu. Nay còn 4 khối, mỗi khối MỘT việc, xếp từ việc chính xuống phụ:
    //   1. Đăng tin  →  2. Tin của tôi  →  3. Ví & hội viên  →  4. Tài khoản
    <div className="space-y-5">
      <PageHeader title="Tổng quan" desc="Đăng tin, quản lý tin đã đăng và ví thành viên." />

      {/* 1. ĐĂNG TIN — việc chính, đưa lên TRÊN CÙNG. Viền xanh + nền xanh nhạt
             + icon từng loại để nhìn phát nhận ra ngay. */}
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
        {free.active && (
          <p className="mt-4 rounded-xl border border-cvr-blue/25 bg-white px-4 py-3 text-sm text-cvr-blue-ink">
            {freeNote(free, tenGoiMienPhi(billing))}
          </p>
        )}
      </div>

      {/* 2. TIN CỦA TÔI — gom hết lối vào quản lý tin về MỘT chỗ. Trước đây
             "Tin đã đăng"/"Tin đã lưu" nằm lẫn trong ô Trạng thái tài khoản. */}
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-cvr-ink">Tin của tôi</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <LoiTat href="/tai-khoan/tin-dang" title="Tin đã đăng" desc="Xem, sửa, gia hạn tin" />
          <LoiTat href="/tin-luu" title="Tin đã lưu" desc="Bất động sản bạn quan tâm" />
          <LoiTat href="/tai-khoan/du-an" title="Dự án của tôi" desc={duocDangDuAn ? "Quản lý dự án đã đăng" : "Cần duyệt hồ sơ"} />
        </div>
      </div>

      {/* 3. VÍ & HỘI VIÊN — gộp 6 ô cũ thành MỘT khối: 3 chỉ số chính trên một
             hàng, thông tin gói để ở dòng phụ, nút nạp/đổi ngay trong khối. */}
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-cvr-ink">Ví &amp; hội viên</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ChiSo label="Số dư tài khoản" value={vnd(balance)} accent />
          <ChiSo label="Điểm thưởng" value={`${points} điểm`} sub={pointValue > 0 ? `≈ ${vnd(pointValue)}` : "Nạp tiền để tích điểm"} />
          <ChiSo
            label="Cấp hội viên"
            value={level ? level.name : "Chưa có cấp"}
            sub={
              capKeTiep
                ? `Nạp thêm ${vnd(conThieu)} để lên ${capKeTiep.name}`
                : level && level.discount > 0
                  ? `Giảm thêm ${level.discount}% khi đăng tin`
                  : undefined
            }
            color={level?.color}
          />
        </div>
        <p className="mt-4 border-t border-cvr-line pt-3 text-sm text-cvr-muted">
          Vai trò: <strong className="font-semibold text-cvr-ink">{roleLabel(profile.role)}</strong>
          {" · "}Gói dịch vụ: <strong className="font-semibold text-cvr-ink">{profile.plan || "Basic (miễn phí)"}</strong>
          {" · "}
          {free.active && free.quota === 0
            ? <>Tin miễn phí: <strong className="font-semibold text-cvr-ink">Không giới hạn</strong></>
            : <>Tin miễn phí còn lại: <strong className="font-semibold text-cvr-ink">{profile.free_quota} tin</strong></>}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
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
      </div>

      {/* 4. TÀI KHOẢN — gọn một dòng, không còn lẫn nút quản lý tin. */}
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-cvr-ink">Tài khoản</h2>
            <p className="mt-1 truncate text-sm text-cvr-muted">
              {profile.email} {profile.phone ? `· ${profile.phone}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {statusBadge(profile.status)}
            <Link href="/tai-khoan/cai-dat" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
              Cài đặt
            </Link>
          </div>
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

// Chỉ số trong khối Ví — KHÔNG còn là thẻ nổi riêng (trước mỗi con số một thẻ
// viền + đổ bóng nên 6 con số thành 6 khối, nhìn rất nặng).
function ChiSo({ label, value, sub, accent, color }: { label: string; value: string; sub?: string; accent?: boolean; color?: string }) {
  return (
    <div className="rounded-xl bg-cvr-surface p-4">
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

// Lối tắt trong khối "Tin của tôi" — cùng kiểu ô bấm với PostType cho đồng bộ.
function LoiTat({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-cvr-line p-4 transition hover:border-cvr-blue hover:shadow-lux"
    >
      <span className="block font-semibold text-cvr-ink">{title}</span>
      <span className="mt-0.5 block text-xs text-cvr-muted">{desc}</span>
    </Link>
  );
}

// Ô "Đăng dự án" khi CHƯA được duyệt: không bấm vào form được, thay bằng lối
// gửi hồ sơ để quản trị viên xét (Chủ đầu tư / Công ty phân phối).
function PostTypeKhoa({ icon, title, desc, moKhoa }: { icon: string; title: string; desc: string; moKhoa: boolean }) {
  if (moKhoa) return <PostType href="/tai-khoan/du-an/moi" icon={icon} title={title} desc={desc} />;
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
        <Link href="/tai-khoan/du-an/ho-so" className="mt-1 inline-block text-xs font-semibold text-cvr-blue-ink underline">
          Gửi yêu cầu đăng dự án →
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
