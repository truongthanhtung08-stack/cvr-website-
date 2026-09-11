"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { roleLabel, statusBadge } from "@/lib/adminLabels";
import { conThieuDeLenCap, freeNote, levelOf, levelTiepTheo, tenGoiMienPhi, vnd } from "@/lib/billing";
import { useBilling } from "@/lib/useBilling";
import { PageHeader } from "@/components/Ui";
import DoDangKyMoi from "@/components/DoDangKyMoi";
import NhanTinCuaToi from "@/components/NhanTinCuaToi";

// Tổng quan tài khoản thành viên: ví (số dư · điểm · cấp) + gói dịch vụ +
// lối tắt đăng tin (Mua bán / Cho thuê / Dự án) và quản lý tài khoản.
type TomTatTin = { dangDang: number; choDuyet: number; luotXem: number; quanTam: number };

// TƯƠNG TÁC 7 NGÀY — người trả tiền cần thấy tiền mình bỏ ra đổi lấy cái gì.
// Bốn con số cộng dồn từ đầu không nói được tin đang lên hay đang nguội, cũng
// không cho biết AI vừa hỏi tin — mà đó mới là thứ người bán cần để gọi lại.
type TuongTac = {
  xem7: number;          // lượt xem 7 ngày gần nhất
  xem7Truoc: number;     // 7 ngày liền trước — để biết đang lên hay đang xuống
  quanTam7: number;      // số người bấm xem số trong 7 ngày
  tinTot: { id: string; title: string; luot: number } | null; // tin chạy tốt nhất
  leadMoi: { id: string; ten: string; sdt: string; tin: string; luc: string }[];
};

export default function AccountOverviewPage() {
  const { profile, loading } = useProfile();
  // Giá · điểm · cấp thành viên lấy từ bản admin đã lưu (không phải giá cứng trong code)
  const { billing, loading: billingLoading } = useBilling();

  // SỐ LIỆU THẬT CỦA TIN — trang tổng quan mà chỉ có mấy cái nút thì khách vào
  // vẫn phải bấm tiếp mới biết tin mình sống chết ra sao. RLS chỉ trả tin của
  // chính mình nên không cần lọc lại ở giao diện.
  const [tomTat, setTomTat] = useState<TomTatTin | null>(null);
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("listings")
        .select("id,status,view_count")
        .eq("owner_id", user.id);
      const list = (data ?? []) as { id: string; status: string; view_count: number | null }[];
      let quanTam = 0;
      if (list.length) {
        const { count } = await supabase
          .from("listing_leads")
          .select("id", { count: "exact", head: true })
          .in("listing_id", list.map((l) => l.id));
        quanTam = count ?? 0;
      }
      setTomTat({
        dangDang: list.filter((l) => l.status === "approved").length,
        choDuyet: list.filter((l) => l.status === "pending").length,
        luotXem: list.reduce((s, l) => s + (l.view_count ?? 0), 0),
        quanTam,
      });
    })();
  }, []);


  // ── TƯƠNG TÁC 7 NGÀY ──────────────────────────────────────────────────────
  // Dữ liệu đã có sẵn trong CSDL từ lâu (listing_view_daily 0023, listing_leads
  // 0022) nhưng khách phải bấm vào TỪNG TIN mới thấy. Gom về tổng quan: mở tài
  // khoản là biết ngay tuần này tin đang lên hay đang nguội, và AI vừa hỏi tin.
  const [tuongTac, setTuongTac] = useState<TuongTac | null>(null);
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tinCuaToi } = await supabase
        .from("listings")
        .select("id,title")
        .eq("owner_id", user.id);
      const ds = (tinCuaToi ?? []) as { id: string; title: string }[];
      if (!ds.length) return;                      // chưa có tin nào → không hiện khối
      const ids = ds.map((l) => l.id);
      const tenTin = new Map(ds.map((l) => [l.id, l.title]));

      const ngay = (lui: number) => {
        const d = new Date();
        d.setDate(d.getDate() - lui);
        return d.toISOString().slice(0, 10);
      };
      const moc7 = ngay(7);
      const moc14 = ngay(14);

      // Lượt xem 14 ngày: 7 ngày này so với 7 ngày liền trước.
      // Bảng theo ngày là migration 0023 — chưa chạy thì phần biểu đồ bỏ trống,
      // KHÔNG làm hỏng cả khối.
      const { data: xem } = await supabase
        .from("listing_view_daily")
        .select("listing_id,ngay,luot")
        .in("listing_id", ids)
        .gte("ngay", moc14);

      let xem7 = 0;
      let xem7Truoc = 0;
      const theoTin = new Map<string, number>();
      for (const d of (xem ?? []) as { listing_id: string; ngay: string; luot: number }[]) {
        const n = String(d.ngay).slice(0, 10);
        const l = Number(d.luot) || 0;
        if (n >= moc7) {
          xem7 += l;
          theoTin.set(d.listing_id, (theoTin.get(d.listing_id) ?? 0) + l);
        } else xem7Truoc += l;
      }

      // Tin chạy tốt nhất tuần này
      let tinTot: TuongTac["tinTot"] = null;
      for (const [id, luot] of theoTin) {
        if (!tinTot || luot > tinTot.luot) tinTot = { id, title: tenTin.get(id) ?? "", luot };
      }

      // AI VỪA QUAN TÂM — tên + số điện thoại để người bán gọi lại được ngay.
      // Đây là thứ giá trị nhất với người trả tiền, trước nay nằm im trong CSDL.
      const { data: leads } = await supabase
        .from("listing_leads")
        .select("id,listing_id,viewer_name,viewer_phone,created_at")
        .in("listing_id", ids)
        .order("created_at", { ascending: false })
        .limit(50);

      const dsLead = (leads ?? []) as {
        id: string; listing_id: string; viewer_name: string | null;
        viewer_phone: string | null; created_at: string;
      }[];

      setTuongTac({
        xem7,
        xem7Truoc,
        quanTam7: dsLead.filter((l) => l.created_at.slice(0, 10) >= moc7).length,
        tinTot,
        leadMoi: dsLead.slice(0, 3).map((l) => ({
          id: l.id,
          ten: l.viewer_name || "Khách",
          sdt: l.viewer_phone || "",
          tin: tenTin.get(l.listing_id) ?? "",
          luc: l.created_at,
        })),
      });
    })();
  }, []);

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
      {/* Đếm "đăng ký thành công" cho Google Ads — chỉ tính tài khoản vừa tạo */}
      <DoDangKyMoi />
      <PageHeader title="Tổng quan" />

      {/* Môi giới được đăng tin hộ: mời nhận tin mang số điện thoại của mình về
          tài khoản — đặt ngay đầu trang vì đó là việc cần làm trước tiên. */}
      <NhanTinCuaToi />

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
        {/* Báo giá nằm NGAY chỗ quyết định đăng tin — khách cần biết tốn bao
            nhiêu trước khi bấm, chứ không phải đi tìm trong menu. */}
        <Link
          href="/bao-gia-dang-tin"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cvr-blue-ink transition hover:underline"
        >
          Xem báo giá đăng tin &amp; gói VIP →
        </Link>
      </div>

      {/* 2. TIN CỦA TÔI — gom hết lối vào quản lý tin về MỘT chỗ. Trước đây
             "Tin đã đăng"/"Tin đã lưu" nằm lẫn trong ô Trạng thái tài khoản. */}
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-cvr-ink">Tin của tôi</h2>
          <Link href="/tai-khoan/tin-dang" className="text-sm font-semibold text-cvr-blue-ink transition hover:underline">
            Xem tất cả →
          </Link>
        </div>

        {/* Bốn con số nói ngay tình trạng tin, khỏi phải bấm vào từng trang */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SoNho nhan="Đang đăng" so={tomTat?.dangDang} href="/tai-khoan/tin-dang" />
          <SoNho nhan="Chờ duyệt" so={tomTat?.choDuyet} href="/tai-khoan/tin-dang" />
          <SoNho nhan="Lượt xem" so={tomTat?.luotXem} href="/tai-khoan/tuong-tac" />
          <SoNho nhan="Người quan tâm" so={tomTat?.quanTam} href="/tai-khoan/tuong-tac" accent />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <LoiTat href="/tai-khoan/tin-dang" title="Tin đã đăng" desc="Xem · sửa · thống kê" />
          <LoiTat href="/tin-luu" title="Tin đã lưu" desc="Bất động sản đã lưu" />
          <LoiTat href="/tai-khoan/du-an" title="Dự án của tôi" desc={duocDangDuAn ? "Quản lý dự án đã đăng" : "Cần duyệt hồ sơ"} />
        </div>
      </div>

      {/* 2B. TUẦN QUA — chỉ hiện khi đã có tin và đã có người xem.
             Chưa có gì thì ẩn hẳn, không bày khối rỗng ra cho khách nhìn. */}
      {tuongTac && (tuongTac.xem7 > 0 || tuongTac.leadMoi.length > 0) && (
        <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-cvr-ink">Tuần qua</h2>
            <Link href="/tai-khoan/tuong-tac" className="text-sm font-semibold text-cvr-blue-ink transition hover:underline">
              Xem chi tiết →
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-cvr-surface p-3">
              <p className="text-xs text-cvr-muted">Lượt xem 7 ngày</p>
              <p className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-xl font-semibold tracking-tight text-cvr-ink">{tuongTac.xem7}</span>
                {/* So với 7 ngày liền trước — biết tin đang lên hay đang nguội.
                    Tuần trước bằng 0 thì không có gì để so, đừng hiện +∞%. */}
                {tuongTac.xem7Truoc > 0 && (
                  <span
                    className={`text-xs font-semibold ${
                      tuongTac.xem7 >= tuongTac.xem7Truoc ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tuongTac.xem7 >= tuongTac.xem7Truoc ? "▲" : "▼"}{" "}
                    {Math.abs(Math.round(((tuongTac.xem7 - tuongTac.xem7Truoc) / tuongTac.xem7Truoc) * 100))}%
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-xl bg-cvr-surface p-3">
              <p className="text-xs text-cvr-muted">Người hỏi số</p>
              <p className="mt-0.5 text-xl font-semibold tracking-tight text-cvr-blue-ink">{tuongTac.quanTam7}</p>
            </div>
          </div>

          {tuongTac.tinTot && tuongTac.tinTot.luot > 0 && (
            <p className="mt-3 truncate text-sm text-cvr-body">
              Tin được xem nhiều nhất:{" "}
              <Link
                href={`/tai-khoan/tin-dang/${tuongTac.tinTot.id}`}
                className="font-semibold text-cvr-ink hover:underline"
              >
                {tuongTac.tinTot.title}
              </Link>{" "}
              <span className="text-cvr-muted">· {tuongTac.tinTot.luot} lượt</span>
            </p>
          )}

          {/* AI VỪA HỎI SỐ — thứ giá trị nhất với người bán: gọi lại được ngay.
              Trước nay nằm im trong cơ sở dữ liệu, phải bấm vào từng tin mới thấy. */}
          {tuongTac.leadMoi.length > 0 && (
            <div className="mt-4 border-t border-cvr-line pt-3">
              <p className="text-sm font-semibold text-cvr-ink">Khách vừa hỏi số</p>
              <ul className="mt-2 space-y-2">
                {tuongTac.leadMoi.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl bg-cvr-surface px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-cvr-ink">{l.ten}</p>
                      <p className="truncate text-xs text-cvr-muted">
                        {l.tin} · {truocDay(l.luc)}
                      </p>
                    </div>
                    {l.sdt && (
                      <a
                        href={`tel:${l.sdt.replace(/\s/g, "")}`}
                        className="shrink-0 rounded-full bg-cvr-ink px-3.5 py-1.5 text-xs font-semibold text-white"
                      >
                        Gọi lại
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
          <Link href="/tai-khoan/hoa-don" className="rounded-lg border border-cvr-line px-5 py-2.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            Hóa đơn của tôi
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

// Con số nhỏ trong khối "Tin của tôi". Chưa tải xong thì để dấu "—", không để
// số 0 nhấp nháy rồi nhảy sang số thật (khách tưởng mất tin).
// Con số phải BẤM ĐƯỢC. Thấy "3 người quan tâm" mà không vào xem được là ai thì
// con số đó chỉ để ngắm, không giúp bán được gì (chủ dự án chốt 11/9/2026).
function SoNho({ nhan, so, href, accent }: { nhan: string; so?: number; href?: string; accent?: boolean }) {
  const ruot = (
    <>
      <p className="text-xs text-cvr-muted">{nhan}</p>
      <p className={`mt-0.5 text-xl font-semibold tracking-tight ${accent && (so ?? 0) > 0 ? "text-cvr-blue-ink" : "text-cvr-ink"}`}>
        {so == null ? "—" : so}
      </p>
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-xl bg-cvr-surface p-3 transition hover:bg-cvr-line/40 active:scale-[0.98]">
      {ruot}
    </Link>
  ) : (
    <div className="rounded-xl bg-cvr-surface p-3">{ruot}</div>
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

// "12 phút trước" dễ hình dung hơn "11/9/2026 14:03" — khách cần biết lead này
// còn nóng hay đã nguội để quyết gọi ngay hay để sau.
function truocDay(iso: string): string {
  const phut = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (phut < 1) return "vừa xong";
  if (phut < 60) return phut + " phút trước";
  const gio = Math.round(phut / 60);
  if (gio < 24) return gio + " giờ trước";
  const ngay = Math.round(gio / 24);
  return ngay < 30 ? ngay + " ngày trước" : new Date(iso).toLocaleDateString("vi-VN");
}
