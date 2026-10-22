"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { useAuth, anhDaiDien } from "@/lib/useAuth";
import AnhDaiDien from "@/components/AnhDaiDien";
import NoiDungChuongTrinh from "@/components/NoiDungChuongTrinh";
import { chuongTrinhTvMoi, freeDangChay, vnd } from "@/lib/billing";
import { useBilling } from "@/lib/useBilling";
import { ngayVN, tuNgayVN } from "@/lib/ngayVN";
import { khoaKhach } from "@/lib/khachHang";
import { PageHeader } from "@/components/Ui";
import DoDangKyMoi from "@/components/DoDangKyMoi";
import NhanTinCuaToi from "@/components/NhanTinCuaToi";

// ============================================================================
// TỔNG QUAN — GỌN CÒN 2 KHỐI (chủ dự án chốt 24/09/2026; 22/10/2026 bỏ khối "Việc cần làm" — "rất vớ vẩn, chỉ cho
// admin là tôi thôi": trang của khách không có danh sách việc)
//   1. Ví: số dư · điểm · cấp hội viên · chương trình đang chạy
//   2. 7 ngày qua: lượt xem (so tuần trước) · người hỏi số · tin đang đăng
// Bỏ các nút đăng tin to và lối tắt trùng menu — khách vào tới đây là đã biết
// việc; đăng tin nằm sẵn ở thanh dưới (điện thoại) và menu trái (máy tính).
// ============================================================================

type SoLieu = {
  coTin: boolean;
  dangDang: number;
  tongXem: number;
  xem7: number;
  xem7Truoc: number;
  hoiSo7: number;
  tinTot: { id: string; title: string; luot: number } | null;
};

export default function AccountOverviewPage() {
  const { profile, loading } = useProfile();
  const { user } = useAuth();
  const { billing, loading: billingLoading } = useBilling();
  const [so, setSo] = useState<SoLieu | null>(null);
  const [goiHv, setGoiHv] = useState<{ ten_goi: string; het_han: string } | null>(null);

  // Gói hội viên đang chạy (bảng hoi_vien, 0040 — RLS: chỉ đọc được của mình).
  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      // PHẢI lọc user_id: tài khoản admin đọc được gói của mọi người (RLS).
      const { data } = await sb.from("hoi_vien").select("ten_goi,het_han").eq("user_id", user.id)
        .gt("het_han", new Date().toISOString()).order("het_han", { ascending: false }).limit(1);
      setGoiHv((data?.[0] as { ten_goi: string; het_han: string } | undefined) ?? null);
    })();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("listings")
        .select("id,title,status,view_count")
        .eq("owner_id", user.id);
      const list = (data ?? []) as {
        id: string; title: string; status: string; view_count: number | null;
      }[];
      const rong: SoLieu = { coTin: false, dangDang: 0, tongXem: 0, xem7: 0, xem7Truoc: 0, hoiSo7: 0, tinTot: null };
      if (!list.length) return setSo(rong);

      const ids = list.map((l) => l.id);
      // Ngày theo giờ VN, đúng 7 ngày (kể cả hôm nay) so với 7 ngày liền trước.
      const moc7 = tuNgayVN(7);
      const moc14 = tuNgayVN(14);

      const [{ data: xem }, { data: leads }] = await Promise.all([
        supabase.from("listing_view_daily").select("listing_id,ngay,luot").in("listing_id", ids).gte("ngay", moc14),
        supabase.from("listing_leads").select("id,created_at,viewer_id,viewer_phone").in("listing_id", ids)
          .gte("created_at", `${moc14}T00:00:00+07:00`),
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
      setSo({
        coTin: true,
        dangDang: list.filter((l) => l.status === "approved").length,
        tongXem: list.reduce((s, l) => s + (l.view_count ?? 0), 0),
        xem7,
        xem7Truoc,
        // Đếm NGƯỜI hỏi số (một người hỏi 2 tin vẫn là 1) — khớp trang Khách hàng.
        hoiSo7: new Set(dsLead.filter((l) => ngayVN(l.created_at) >= moc7).map((l) => khoaKhach(l.viewer_id, l.viewer_phone, l.id))).size,
        tinTot,
      });
    })();
  }, []);

  if (loading || billingLoading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;
  if (!profile) return <p className="text-sm text-cvr-muted">Không tải được hồ sơ. Vui lòng đăng nhập lại.</p>;

  const p = profile as unknown as { balance?: number };
  const freeConChay = freeDangChay(billing.free, new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-5">
      {/* Đếm "đăng ký thành công" cho Google Ads — chỉ tính tài khoản vừa tạo */}
      <DoDangKyMoi />
      <PageHeader title="Tổng quan" />
      {/* ẢNH + TÊN KHÁCH (chủ dự án 15/10/2026): vào là thấy tài khoản của mình. Bấm → hồ sơ cá nhân.
          Ảnh: hồ sơ → ảnh tài khoản Google/Zalo → chữ viết tắt (giống trang Hồ sơ cá nhân). */}
      <Link href="/tai-khoan/ca-nhan" className="flex items-center gap-4 rounded-2xl border border-cvr-line bg-white p-4 shadow-sm transition hover:border-cvr-ink/30">
        <AnhDaiDien url={profile.avatar_url || anhDaiDien(user)} ten={profile.full_name || "T"} className="h-14 w-14 shrink-0 bg-cvr-surface text-xl text-cvr-ink ring-1 ring-cvr-line" />
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-semibold tracking-tight text-cvr-ink">{profile.full_name?.trim() || profile.phone || profile.email}</span>
          {profile.full_name?.trim() && (profile.phone || profile.email) && (
            <span className="block truncate text-sm text-cvr-muted">{profile.phone || profile.email}</span>
          )}
        </span>
      </Link>
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
        {/* Gói hội viên (thay cấp theo tổng nạp + điểm thưởng từ 25/09/2026) */}
        <p className="mt-3 border-t border-cvr-line pt-3 text-sm text-cvr-muted">
          Hội viên:{" "}
          {goiHv ? (
            <>
              <strong className="font-semibold text-cvr-ink">{goiHv.ten_goi}</strong> đến{" "}
              {new Date(goiHv.het_han).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
              {" · "}<Link href="/tai-khoan/hoi-vien" className="font-semibold text-cvr-blue-ink hover:underline">Xem voucher</Link>
            </>
          ) : (
            <>
              <strong className="font-semibold text-cvr-ink">Thành viên thường</strong>
              {(billing.hoiVien?.length ?? 0) > 0 && <>{" · "}<Link href="/tai-khoan/hoi-vien" className="font-semibold text-cvr-blue-ink hover:underline">Xem gói hội viên</Link></>}
            </>
          )}
        </p>
        {freeConChay && (
          // Chương trình = Tên (đúng admin) + Nội dung — khối chung NoiDungChuongTrinh, ô nền xanh nhạt như form đăng tin (22/10/2026)
          <div className="mt-3 rounded-xl border border-cvr-blue/25 bg-cvr-blue/[0.05] px-4 py-3">
            <NoiDungChuongTrinh ct={chuongTrinhTvMoi(billing)} />
            {billing.free.quota > 0 && <p className="mt-1 text-[13px] text-cvr-body">Bạn còn <strong className="font-semibold">{profile.free_quota ?? 0} tin</strong> miễn phí.</p>}
          </div>
        )}
      </section>

      {/* 2. 7 NGÀY QUA */}
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
