"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { conThieuDeLenCap, freeDangChay, freeNote, levelOf, levelTiepTheo, tenGoiMienPhi, vnd } from "@/lib/billing";
import { useBilling } from "@/lib/useBilling";
import { PageHeader } from "@/components/Ui";
import DoDangKyMoi from "@/components/DoDangKyMoi";
import NhanTinCuaToi from "@/components/NhanTinCuaToi";

// ============================================================================
// TỔNG QUAN — GỌN CÒN 3 KHỐI (chủ dự án chốt 24/09/2026)
//   1. Ví: số dư · điểm · cấp hội viên
//   2. Việc cần làm: chỉ những dòng ĐANG có việc (khách mới, tin chờ duyệt,
//      tin bị từ chối, tin VIP sắp hết hạn)
//   3. 7 ngày qua: lượt xem (so tuần trước) · người hỏi số · tin đang đăng
// Bỏ các nút đăng tin to và lối tắt trùng menu — khách vào tới đây là đã biết
// việc; đăng tin nằm sẵn ở thanh dưới (điện thoại) và menu trái (máy tính).
// ============================================================================

type SoLieu = {
  coTin: boolean;
  dangDang: number;
  choDuyet: number;
  biTuChoi: number;
  sapHetHan: number;     // tin VIP còn ≤ 3 ngày
  tongXem: number;
  xem7: number;
  xem7Truoc: number;
  hoiSo7: number;
  khachMoi: number;      // tương tác sau lần cuối mở trang Khách hàng
  tinTot: { id: string; title: string; luot: number } | null;
};

// Cùng khoá với trang Khách hàng — mốc lần cuối người bán xem danh sách khách.
const KHOA_DA_XEM = "cl_khach_hang_da_xem";

export default function AccountOverviewPage() {
  const { profile, loading } = useProfile();
  const { billing, loading: billingLoading } = useBilling();
  const [so, setSo] = useState<SoLieu | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("listings")
        .select("id,title,status,view_count,tier,tier_expires_at")
        .eq("owner_id", user.id);
      const list = (data ?? []) as {
        id: string; title: string; status: string; view_count: number | null; tier: string | null; tier_expires_at: string | null;
      }[];
      const rong: SoLieu = { coTin: false, dangDang: 0, choDuyet: 0, biTuChoi: 0, sapHetHan: 0, tongXem: 0, xem7: 0, xem7Truoc: 0, hoiSo7: 0, khachMoi: 0, tinTot: null };
      if (!list.length) return setSo(rong);

      const ids = list.map((l) => l.id);
      const ngay = (lui: number) => {
        const d = new Date();
        d.setDate(d.getDate() - lui);
        return d.toISOString().slice(0, 10);
      };
      const moc7 = ngay(7);
      const moc14 = ngay(14);
      let mocKhach = "";
      try { mocKhach = localStorage.getItem(KHOA_DA_XEM) ?? ""; } catch { /* bị chặn → không đếm khách mới */ }

      const [{ data: xem }, { data: leads }, { data: viewers }] = await Promise.all([
        supabase.from("listing_view_daily").select("listing_id,ngay,luot").in("listing_id", ids).gte("ngay", moc14),
        // Lấy từ mốc SỚM HƠN trong hai mốc (14 ngày trước / lần cuối xem Khách hàng)
        // để đếm "khách mới" khớp tuyệt đối với trang Khách hàng.
        supabase.from("listing_leads").select("id,created_at,viewer_id,viewer_phone").in("listing_id", ids)
          .gte("created_at", mocKhach && mocKhach < moc14 ? mocKhach : moc14),
        mocKhach
          ? supabase.from("listing_viewer").select("viewer_id").in("listing_id", ids).gt("lan_cuoi", mocKhach)
          : Promise.resolve({ data: [] as { viewer_id: string }[] }),
      ]);

      let xem7 = 0;
      let xem7Truoc = 0;
      const theoTin = new Map<string, number>();
      for (const d of (xem ?? []) as { listing_id: string; ngay: string; luot: number }[]) {
        const l = Number(d.luot) || 0;
        if (String(d.ngay).slice(0, 10) >= moc7) {
          xem7 += l;
          theoTin.set(d.listing_id, (theoTin.get(d.listing_id) ?? 0) + l);
        } else xem7Truoc += l;
      }
      let tinTot: SoLieu["tinTot"] = null;
      for (const [id, luot] of theoTin) {
        if (!tinTot || luot > tinTot.luot) tinTot = { id, title: list.find((l) => l.id === id)?.title ?? "", luot };
      }

      const dsLead = (leads ?? []) as { id: string; created_at: string; viewer_id: string | null; viewer_phone: string | null }[];
      // KHÁCH MỚI đếm theo NGƯỜI, cùng cách gom với trang Khách hàng: viewer_id,
      // lead cũ không có viewer_id thì gom theo số điện thoại.
      const nguoiMoi = new Set<string>();
      if (mocKhach) {
        for (const l of dsLead) {
          if (l.created_at > mocKhach) nguoiMoi.add(l.viewer_id ?? `sdt:${(l.viewer_phone ?? "").replace(/\D/g, "") || l.id}`);
        }
        for (const v of (viewers ?? []) as { viewer_id: string }[]) nguoiMoi.add(v.viewer_id);
      }
      const baNgayNua = Date.now() + 3 * 86_400_000;
      setSo({
        coTin: true,
        dangDang: list.filter((l) => l.status === "approved").length,
        choDuyet: list.filter((l) => l.status === "pending").length,
        biTuChoi: list.filter((l) => l.status === "rejected").length,
        sapHetHan: list.filter((l) => l.status === "approved" && l.tier && l.tier !== "basic" && l.tier_expires_at
          && new Date(l.tier_expires_at).getTime() > Date.now() && new Date(l.tier_expires_at).getTime() <= baNgayNua).length,
        tongXem: list.reduce((s, l) => s + (l.view_count ?? 0), 0),
        xem7,
        xem7Truoc,
        hoiSo7: dsLead.filter((l) => l.created_at.slice(0, 10) >= moc7).length,
        khachMoi: nguoiMoi.size,
        tinTot,
      });
    })();
  }, []);

  if (loading || billingLoading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;
  if (!profile) return <p className="text-sm text-cvr-muted">Không tải được hồ sơ. Vui lòng đăng nhập lại.</p>;

  const p = profile as unknown as { balance?: number; points?: number; total_topup?: number };
  const totalTopup = p.total_topup ?? 0;
  const level = levelOf(billing, totalTopup);
  const capKeTiep = levelTiepTheo(billing, totalTopup);
  const conThieu = conThieuDeLenCap(billing, totalTopup);
  const freeConChay = freeDangChay(billing.free, new Date().toISOString().slice(0, 10));

  const viec = so ? [
    so.khachMoi > 0 && { href: "/tai-khoan/khach-hang", text: `${so.khachMoi} khách mới quan tâm tin của bạn`, noiBat: true },
    so.biTuChoi > 0 && { href: "/tai-khoan/tin-dang", text: `${so.biTuChoi} tin chưa được duyệt — xem lý do và sửa lại` },
    so.sapHetHan > 0 && { href: "/tai-khoan/tin-dang", text: `${so.sapHetHan} tin VIP sắp hết hạn trong 3 ngày` },
    so.choDuyet > 0 && { href: "/tai-khoan/tin-dang", text: `${so.choDuyet} tin đang chờ duyệt` },
  ].filter(Boolean) as { href: string; text: string; noiBat?: boolean }[] : [];

  return (
    <div className="space-y-5">
      {/* Đếm "đăng ký thành công" cho Google Ads — chỉ tính tài khoản vừa tạo */}
      <DoDangKyMoi />
      <PageHeader title="Tổng quan" />
      {/* Môi giới được đăng tin hộ: mời nhận tin mang số điện thoại của mình về */}
      <NhanTinCuaToi />

      {/* 1. VÍ */}
      <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-cvr-muted">Số dư ví</p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums text-cvr-ink">{vnd(p.balance ?? 0)}</p>
          </div>
          <Link href="/tai-khoan/nap-tien" className="shrink-0 text-sm font-semibold text-cvr-blue-ink hover:underline">Nạp tiền →</Link>
        </div>
        <p className="mt-3 border-t border-cvr-line pt-3 text-sm text-cvr-muted">
          <Link href="/tai-khoan/doi-diem" className="hover:text-cvr-ink">
            Điểm thưởng: <strong className="font-semibold text-cvr-ink">{p.points ?? 0}</strong>
          </Link>
          {" · "}Hội viên:{" "}
          <strong className="font-semibold" style={level?.color ? { color: level.color } : undefined}>{level ? level.name : "Chưa có cấp"}</strong>
          {capKeTiep && <> · nạp thêm {vnd(conThieu)} để lên {capKeTiep.name}</>}
        </p>
        {freeConChay && (
          <p className="mt-2 text-sm text-cvr-blue-ink">
            {freeNote(billing.free, tenGoiMienPhi(billing))}
            {billing.free.quota > 0 && <> Bạn còn <strong className="font-semibold">{profile.free_quota ?? 0} tin</strong> miễn phí.</>}
          </p>
        )}
      </section>

      {/* 2. VIỆC CẦN LÀM — chỉ dòng đang có việc */}
      {so && (
        <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-cvr-ink">Việc cần làm</h2>
          {!so.coTin ? (
            <p className="mt-2 text-sm text-cvr-muted">
              Bạn chưa có tin nào.{" "}
              <Link href="/dang-tin" className="font-semibold text-cvr-blue-ink hover:underline">Đăng tin</Link>
            </p>
          ) : viec.length === 0 ? (
            <p className="mt-2 text-sm text-cvr-muted">Không có việc cần xử lý.</p>
          ) : (
            <ul className="mt-2 divide-y divide-cvr-line/70">
              {viec.map((v) => (
                <li key={v.text}>
                  <Link href={v.href} className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:text-cvr-ink">
                    <span className={`flex items-center gap-2 ${v.noiBat ? "font-semibold text-cvr-blue-ink" : "text-cvr-body"}`}>
                      {v.noiBat && <span className="h-2 w-2 shrink-0 rounded-full bg-cvr-blue" aria-hidden />}
                      {v.text}
                    </span>
                    <svg className="h-4 w-4 shrink-0 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 3. 7 NGÀY QUA */}
      {so?.coTin && (
        <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-cvr-ink">7 ngày qua</h2>
            <Link href="/tai-khoan/khach-hang" className="text-sm font-semibold text-cvr-blue-ink hover:underline">Chi tiết →</Link>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <O nhan="Lượt xem" so={so.xem7} phu={so.xem7Truoc > 0 ? xuHuong(so.xem7, so.xem7Truoc) : undefined} />
            <O nhan="Người hỏi số" so={so.hoiSo7} accent />
            <O nhan="Tin đang đăng" so={so.dangDang} />
          </div>
          {so.tinTot && so.tinTot.luot > 0 && (
            <p className="mt-3 truncate text-sm text-cvr-muted">
              Xem nhiều nhất:{" "}
              <Link href={`/tai-khoan/tin-dang/${so.tinTot.id}`} className="font-medium text-cvr-ink hover:underline">{so.tinTot.title}</Link>
              {" "}· {so.tinTot.luot} lượt
            </p>
          )}
        </section>
      )}

      {profile.role === "admin" && (
        <Link href="/admin" className="block text-sm font-semibold text-cvr-blue-ink hover:underline">Mở trang quản trị →</Link>
      )}
    </div>
  );
}

function xuHuong(nay: number, truoc: number): React.ReactNode {
  const pt = Math.round(((nay - truoc) / truoc) * 100);
  return <span className={pt >= 0 ? "text-green-600" : "text-red-600"}>{pt >= 0 ? "▲" : "▼"} {Math.abs(pt)}%</span>;
}

function O({ nhan, so, accent, phu }: { nhan: string; so: number; accent?: boolean; phu?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-cvr-surface p-3">
      <p className="text-xs text-cvr-muted">{nhan}</p>
      <p className={`mt-0.5 text-xl font-semibold tracking-tight tabular-nums ${accent && so > 0 ? "text-cvr-blue-ink" : "text-cvr-ink"}`}>
        {so.toLocaleString("vi-VN")}
      </p>
      {phu && <p className="text-[11px] font-semibold">{phu}</p>}
    </div>
  );
}
