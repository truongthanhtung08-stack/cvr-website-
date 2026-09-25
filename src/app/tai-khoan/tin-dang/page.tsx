"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/Ui";
import PhanTrang from "@/components/PhanTrang";
import {
  type ListingRow,
  type ListingStatus,
  purposeLabel,
  listingStatusBadge,
  adminPriceText,
  tierBadge,
  thongTinGoi,
  ngayGon,
} from "@/lib/listingAdmin";
import { bangTheoMucDich, giaDayTin, goiUpNhieuLuot, vnd } from "@/lib/billing";
import { useBilling } from "@/lib/useBilling";
import { tachThue } from "@/lib/thue";

// Tin đăng của THÀNH VIÊN — tin của chính mình (mọi trạng thái, kể cả nháp).
// RLS đảm bảo chỉ thấy tin owner_id = mình.
// Lead = người ĐÃ ĐĂNG NHẬP đã bấm "hiện số" ở tin của mình (bảng listing_leads).
type Lead = { id: string; listing_id: string; viewer_name: string | null; viewer_phone: string | null; created_at: string };

// Số tin mỗi trang. Khách đăng vài trăm tin thì đổ hết ra một trang là máy yếu
// đứng hình và không tài nào tìm lại được tin cũ.
const MOI_TRANG = 10;

export default function MyListingsPage() {
  // Giá đẩy tin lấy từ bảng admin đang lưu — chủ dự án đổi giá là nút đổi theo.
  const { billing } = useBilling();
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [leadsByListing, setLeadsByListing] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | ListingStatus>("all");
  // Mục đang chọn phải nằm trong tầm mắt của dòng cuộn ngang.
  const hangLoc = useRef<HTMLDivElement>(null);
  useEffect(() => {
    hangLoc.current?.querySelector(`[data-loc="${tab}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [tab]);
  const [tuKhoa, setTuKhoa] = useState("");
  const [trang, setTrang] = useState(1);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      const list = (data ?? []) as ListingRow[];
      setRows(list);
      setLoading(false);

      // Lead cho MỌI tin của mình trong một lần gọi (RLS chỉ cho chủ tin đọc).
      const ids = list.map((r) => r.id);
      if (ids.length) {
        const { data: leads } = await supabase
          .from("listing_leads")
          .select("id,listing_id,viewer_name,viewer_phone,created_at")
          .in("listing_id", ids)
          .order("created_at", { ascending: false });
        const grouped: Record<string, Lead[]> = {};
        for (const ld of (leads ?? []) as Lead[]) (grouped[ld.listing_id] ??= []).push(ld);
        setLeadsByListing(grouped);
      }
    })();
  }, []);

  // Xoá tin NHÁP của chính mình (hỏi xác nhận trước; RLS chỉ cho xoá tin mình)
  async function handleDelete(r: ListingRow) {
    if (!window.confirm(`Xoá tin nháp "${r.title || "(chưa có tiêu đề)"}"?`)) return;
    const { error } = await createClient().from("listings").delete().eq("id", r.id);
    if (!error) setRows((rows) => rows.filter((x) => x.id !== r.id));
  }

  // ── ĐẨY TIN (UP) ──────────────────────────────────────────────────────────
  // Hỏi xác nhận kèm SỐ TIỀN trước khi trừ: đây là tiền thật, không được trừ
  // chỉ vì một cú bấm nhầm. Máy chủ mới là nơi tính giá và chặn quá 1 lượt/ngày;
  // ở đây chỉ hiển thị và khoá nút trong lúc gọi.
  const [dangDay, setDangDay] = useState<string | null>(null);
  async function handleDay(r: ListingRow) {
    const goi = thongTinGoi(r);
    const kho = Number(r.bump_credits ?? 0);
    const gia = giaDayTin(bangTheoMucDich(billing, r.purpose), goi.cap);
    const phaiTra = tachThue(gia).tongTra;
    // Còn lượt trong kho thì KHÔNG mất thêm tiền — phải nói rõ, đừng doạ khách
    // bằng con số tiền khi họ đã trả từ lúc mua gói.
    const loiNhac = kho > 0
      ? `Dùng 1 lượt trong gói đã mua (còn ${kho} lượt). Không mất thêm tiền.`
      : `Phí: ${vnd(phaiTra)} (đã gồm thuế GTGT) — trừ thẳng vào ví.`;
    if (!window.confirm(
      `Đẩy tin "${r.title || "(chưa có tiêu đề)"}" lên đầu danh sách?\n\n` +
      `${loiNhac}\n` +
      `Mỗi tin đẩy được 1 lần mỗi ngày. Ngày đăng của tin KHÔNG bị sửa.`
    )) return;

    setDangDay(r.id);
    try {
      const res = await fetch("/api/tin-dang/day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id }),
      });
      const kq = await res.json().catch(() => ({}));
      if (!res.ok || !kq.ok) {
        window.alert(kq.loi || "Đẩy tin không thành công.");
        return;
      }
      // Cập nhật ngay tại chỗ để khách thấy kết quả, khỏi tải lại trang.
      setRows((rows) => rows.map((x) => (x.id === r.id
        ? { ...x, bumped_at: kq.bumpedAt, ...(kq.dungLuot ? { bump_credits: kq.conLai } : {}) }
        : x)));
      window.alert(kq.dungLuot
        ? `Đã đẩy tin lên đầu bằng gói đã mua. Còn ${kq.conLai} lượt.`
        : `Đã đẩy tin lên đầu. Trừ ${vnd(kq.daTru)}, số dư còn ${vnd(kq.soDu)}.`);
    } finally {
      setDangDay(null);
    }
  }

  // ── MUA GÓI UP NHIỀU LƯỢT ─────────────────────────────────────────────────
  // Mua sỉ rẻ hơn đẩy lẻ 20–50%. Bày thẳng đơn giá mỗi lượt để khách thấy được
  // cái lợi, khỏi phải tự chia.
  const [dangMua, setDangMua] = useState<string | null>(null);
  async function handleMuaGoi(r: ListingRow) {
    const goi = thongTinGoi(r);
    const dsGoi = goiUpNhieuLuot(bangTheoMucDich(billing, r.purpose), goi.cap);
    if (!dsGoi.length) { window.alert("Chưa có gói đẩy nào cho cấp tin này."); return; }

    const giaLe = tachThue(giaDayTin(bangTheoMucDich(billing, r.purpose), goi.cap)).tongTra;
    const dong = dsGoi.map((g, i) => {
      const tra = tachThue(g.gia).tongTra;
      const moiLuot = Math.round(tra / g.soLuot);
      const re = giaLe > 0 ? Math.round((1 - moiLuot / giaLe) * 100) : 0;
      return `${i + 1}. ${g.soLuot} lượt — ${vnd(tra)}  (${vnd(moiLuot)}/lượt${re > 0 ? `, rẻ hơn ${re}%` : ""})`;
    });
    const chon = window.prompt(
      `Mua gói đẩy cho tin "${r.title || "(chưa có tiêu đề)"}" (${goi.tenGoi})\n` +
      `Đẩy lẻ hiện là ${vnd(giaLe)}/lượt.\n\n${dong.join("\n")}\n\n` +
      `Gõ số thứ tự gói muốn mua (1–${dsGoi.length}), hoặc để trống để thoát:`
    );
    const i = Number(chon) - 1;
    if (!chon || !dsGoi[i]) return;
    const g = dsGoi[i];
    if (!window.confirm(
      `Mua ${g.soLuot} lượt đẩy — ${vnd(tachThue(g.gia).tongTra)} (đã gồm thuế GTGT), trừ thẳng vào ví.\n\n` +
      `Sau khi mua, hệ thống tự đẩy tin mỗi ngày 1 lần vào đầu giờ sáng cho tới khi hết lượt.`
    )) return;

    setDangMua(r.id);
    try {
      const res = await fetch("/api/tin-dang/mua-goi-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, soLuot: g.soLuot }),
      });
      const kq = await res.json().catch(() => ({}));
      if (!res.ok || !kq.ok) { window.alert(kq.loi || "Mua gói không thành công."); return; }
      setRows((rows) => rows.map((x) => (x.id === r.id ? { ...x, bump_credits: kq.conLai } : x)));
      window.alert(`Đã mua ${g.soLuot} lượt. Trừ ${vnd(kq.daTru)}, số dư còn ${vnd(kq.soDu)}.\nTin có ${kq.conLai} lượt trong kho.`);
    } finally {
      setDangMua(null);
    }
  }

  // ── UP TIN = GIA HẠN (chốt 25/09/2026): chọn hạng + thời hạn như đăng mới,
  // ngày đăng và hạn tính lại TỪ HÔM NAY, ngày còn dư của gói cũ bỏ.
  const [upCho, setUpCho] = useState<ListingRow | null>(null);
  const [upChon, setUpChon] = useState<{ tier: string; soNgay: number } | null>(null);
  const [dangUp, setDangUp] = useState(false);
  // Tin đang có yêu cầu "Up khi nạp đủ tiền" (bảng up_cho, 0044)
  const [choUp, setChoUp] = useState<Set<string>>(new Set());
  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from("up_cho").select("listing_id").eq("user_id", user.id).eq("trang_thai", "cho");
      setChoUp(new Set(((data ?? []) as { listing_id: string }[]).map((x) => x.listing_id)));
    })();
  }, []);
  async function xacNhanUp() {
    if (!upCho || !upChon) return;
    setDangUp(true);
    try {
      const res = await fetch("/api/tin-dang/up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: upCho.id, tier: upChon.tier, soNgay: upChon.soNgay }),
      });
      const kq = await res.json().catch(() => ({}));
      // VÍ THIẾU → yêu cầu Up đã được ghi (up_cho). Nạp đủ là máy tự Up đúng gói
      // + thời hạn vừa chọn, khách không phải quay lại bấm.
      if (res.status === 402 && kq.viThieu) {
        if (kq.choUp) setChoUp((ds) => new Set(ds).add(upCho.id));
        const di = window.confirm(
          `${kq.loi}\n\nNạp thêm ${vnd(kq.viThieu)} — tiền vào ví là tin tự Up đúng gói bạn vừa chọn, không phải bấm lại.\n\nĐi tới trang nạp tiền?`,
        );
        setUpCho(null);
        setUpChon(null);
        if (di) window.location.href = `/tai-khoan/nap-tien?can=${kq.viThieu}`;
        return;
      }
      if (!res.ok || !kq.ok) { window.alert(kq.loi || "Up tin không thành công."); return; }
      setChoUp((ds) => { const m = new Set(ds); m.delete(upCho.id); return m; });
      const bayGio = new Date().toISOString();
      setRows((ds) => ds.map((x) => (x.id === upCho.id
        ? { ...x, status: "approved", tier: upChon.tier as ListingRow["tier"], published_at: bayGio, bumped_at: bayGio, tier_expires_at: kq.hetHan }
        : x)));
      window.alert(kq.mienPhi
        ? "Đã Up tin — miễn phí theo chương trình thành viên mới."
        : `Đã Up tin. Trừ ${vnd(kq.daTru)}, số dư còn ${vnd(kq.soDu)}.`);
      setUpCho(null);
      setUpChon(null);
    } finally {
      setDangUp(false);
    }
  }

  const count = (s: ListingStatus) => rows.filter((r) => r.status === s).length;

  // Lọc theo mục đang chọn + ô tìm trong tin của mình (tiêu đề / địa chỉ).
  const filtered = useMemo(() => {
    const t = tuKhoa.trim().toLowerCase();
    return rows
      .filter((r) => (tab === "all" ? true : r.status === tab))
      .filter((r) =>
        !t
          ? true
          : `${r.title ?? ""} ${r.details?.addressDetail ?? ""} ${r.ward ?? ""} ${r.district ?? ""} ${r.province ?? ""}`
              .toLowerCase()
              .includes(t),
      );
  }, [rows, tab, tuKhoa]);

  // PHÂN TRANG — số trang luôn nằm trong khoảng hợp lệ kể cả khi vừa đổi mục
  // lọc làm danh sách ngắn lại (trước đây đứng ở "trang 5" mà mục mới chỉ có
  // 2 trang thì màn hình trắng trơn).
  const tongTrang = Math.max(1, Math.ceil(filtered.length / MOI_TRANG));
  const trangHienTai = Math.min(trang, tongTrang);
  const tinTrongTrang = filtered.slice((trangHienTai - 1) * MOI_TRANG, trangHienTai * MOI_TRANG);

  function doiTrang(p: number) {
    setTrang(Math.min(Math.max(1, p), tongTrang));
    document.getElementById("dau-danh-sach")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Đổi mục lọc / gõ tìm → quay về trang 1
  function chonTab(k: "all" | ListingStatus) { setTab(k); setTrang(1); }

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-cvr-line bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight text-cvr-ink">Chưa có tin đăng</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-cvr-muted">
          Đăng tin đầu tiên của bạn — có thể lưu nháp và hoàn thiện dần.
        </p>
        <Link href="/dang-tin" className="mt-4 inline-block rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          + Đăng tin mới
        </Link>
      </div>
    );
  }

  const tabs: { key: "all" | ListingStatus; label: string }[] = [
    { key: "all", label: `Tất cả (${rows.length})` },
    { key: "approved", label: `Đang đăng (${count("approved")})` },
    { key: "pending", label: `Chờ duyệt (${count("pending")})` },
    { key: "draft", label: `Nháp (${count("draft")})` },
  ];
  // Chỉ hiện mục "Bị từ chối" khi thật sự có — không ai cần một mục luôn bằng 0.
  if (count("rejected") > 0) tabs.push({ key: "rejected", label: `Bị từ chối (${count("rejected")})` });
  if (count("expired") > 0) tabs.push({ key: "expired", label: `Hết hạn (${count("expired")})` });

  return (
    <div className="space-y-4">
      <PageHeader title="Tin đã đăng">
        <Link href="/dang-tin" className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          + Đăng tin mới
        </Link>
      </PageHeader>

      {/* Thanh lọc: mục trạng thái bên trái, ô tìm bên phải. Ô tìm chỉ tìm trong
          tin của CHÍNH MÌNH — có vài trăm tin thì cuộn tay không nổi. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* MỘT DÒNG CUỘN NGANG, KHÔNG XUỐNG HÀNG. Sáu mục trạng thái mà để tự
            xuống hàng thì trên điện thoại chiếm ba dòng, đẩy danh sách tin xuống
            dưới màn hình. Mục đang chọn tự trượt vào giữa tầm mắt. */}
        <div ref={hangLoc} className="no-scrollbar -mx-1 flex max-w-full gap-2 overflow-x-auto px-1 py-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              data-loc={t.key}
              onClick={() => chonTab(t.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                tab === t.key ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={tuKhoa}
          onChange={(e) => { setTuKhoa(e.target.value); setTrang(1); }}
          placeholder="Tìm trong tin của tôi…"
          className="h-9 w-full rounded-full border border-cvr-line px-4 text-sm text-cvr-ink outline-none transition placeholder:text-cvr-faint focus:border-cvr-ink sm:w-64"
        />
      </div>

      <div id="dau-danh-sach" className="space-y-3 scroll-mt-32">
        {tinTrongTrang.map((r) => {
          const leads = leadsByListing[r.id] ?? [];
          const goi = thongTinGoi(r);
          return (
          <article key={r.id} className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm">
            {/* TIÊU ĐỀ HIỆN ĐỦ, KHÔNG CẮT.
                Trước đây tiêu đề nằm cùng HÀNG với cụm nút (Xem · Sửa · Xoá) và
                bị `truncate` → tin nào cũng cụt giữa chừng, khách không phân biệt
                nổi tin nào với tin nào. Nay tiêu đề chiếm trọn một dòng riêng và
                tự xuống dòng; cụm nút tụt xuống dưới. */}
            <div className="flex flex-wrap items-center gap-2">
              {listingStatusBadge(r.status)}
              {/* HUY HIỆU CẤP — chỉ hiện khi tin thực sự ở cấp VIP. Tin thường
                  không cần huy hiệu, đúng như ngoài trang kết quả. */}
              {goi.cap !== "basic" && tierBadge(goi.cap)}
              <span className="text-xs text-cvr-faint">{r.view_count} lượt xem</span>
              {choUp.has(r.id) && (
                <Link href="/tai-khoan/nap-tien" className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  Chờ nạp tiền để Up
                </Link>
              )}
              {leads.length > 0 && (
                <span className="text-xs font-semibold text-cvr-blue-ink">· {leads.length} người quan tâm</span>
              )}
            </div>
            <h3 className="mt-1.5 break-words text-[15px] font-semibold leading-snug text-cvr-ink">
              {r.title || "(chưa có tiêu đề)"}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-cvr-muted">
              {purposeLabel(r.purpose)}{r.type ? ` · ${r.type}` : ""} · {adminPriceText(r.price_vnd, r.purpose)}
              {r.area_m2 != null ? ` · ${r.area_m2} m²` : ""}
              {r.province ? ` · ${r.province}` : ""}
            </p>

            {/* GÓI ĐANG DÙNG — phần khách trả tiền, nên nói đủ: gói nào, mua bao
                nhiêu ngày, đăng hôm nào, chạy đến hôm nào và còn mấy ngày.
                Tin nháp chưa chọn gói thì không bịa ra dòng này. */}
            {(goi.daDuyet || goi.soNgay != null) && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-cvr-body">
                <span className="font-semibold text-cvr-ink">{goi.tenGoi}</span>
                {goi.soNgay != null && ` · ${goi.soNgay} ngày`}
                {!goi.daDuyet && " · chờ duyệt mới bắt đầu tính"}
                {goi.daDuyet && r.published_at && ` · Đăng ${ngayGon(r.published_at)}`}
                {goi.daDuyet && goi.hetHan && (
                  goi.conLai != null && goi.conLai <= 0
                    ? <span className="font-medium text-amber-700"> · Đã hết hạn {ngayGon(r.tier_expires_at)} — tin ngừng hiển thị, Up tin để hiện lại</span>
                    : <> · Hiển thị đến {ngayGon(r.tier_expires_at)}
                        <span className={goi.conLai != null && goi.conLai <= 3 ? "font-semibold text-amber-700" : ""}>
                          {` (còn ${goi.conLai} ngày)`}
                        </span>
                      </>
                )}
                {goi.daDuyet && !goi.hetHan && goi.cap === "basic" && " · không giới hạn thời gian"}
                {/* Đã bỏ tiền đẩy thì phải thấy lần đẩy gần nhất, không thì
                    khách không biết mình đã đẩy hôm nay chưa. */}
                {r.bumped_at && ` · Đẩy lần cuối ${ngayGon(r.bumped_at)}`}
              </p>
            )}

            {/* Tin bị từ chối: nói thẳng lý do ngay tại đây. Chỉ báo qua email thì
                khách mất thư là chịu, vào trang này chỉ thấy chữ "Bị từ chối" trơ trọi. */}
            {r.status === "rejected" && r.details?.ly_do_tu_choi && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-800">
                <span className="font-semibold">Lý do chưa duyệt:</span> {r.details.ly_do_tu_choi}
                <span className="block text-red-700/80">Sửa lại rồi gửi duyệt lại — tin chưa duyệt thì chưa bị trừ tiền.</span>
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cvr-line pt-3">
              <Link
                href={`/dang-tin?id=${r.id}`}
                className="flex h-9 items-center gap-1.5 rounded-full bg-cvr-ink px-4 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Sửa
              </Link>
              {r.status === "approved" && (
                <Link
                  href={`/bat-dong-san/${r.id}`}
                  target="_blank"
                  className="flex h-9 items-center gap-1.5 rounded-full border border-cvr-line px-4 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
                >
                  Xem ↗
                </Link>
              )}
              {/* THỐNG KÊ — lượt xem theo ngày + danh sách ai đã bấm xem số.
                  Trước đây danh sách người quan tâm bung ngay trong thẻ, tin nào
                  cũng bung là danh sách dài dằng dặc; nay có trang riêng. */}
              <Link
                href={`/tai-khoan/tin-dang/${r.id}`}
                className="flex h-9 items-center gap-1.5 rounded-full border border-cvr-line bg-cvr-surface px-4 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
              >
                Thống kê
              </Link>
              {/* ĐẨY TIN — chỉ có nghĩa với tin đang đăng. Nhãn nói luôn giá để
                  khách không phải bấm thử mới biết mất bao nhiêu. */}
              {r.status === "approved" && (
                <button
                  type="button"
                  disabled={dangDay === r.id}
                  onClick={() => handleDay(r)}
                  className="flex h-9 items-center gap-1.5 rounded-full border border-cvr-blue/30 bg-cvr-blue/[0.06] px-4 text-sm font-semibold text-cvr-blue-ink transition hover:border-cvr-blue disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  {dangDay === r.id
                    ? "Đang đẩy…"
                    : Number(r.bump_credits ?? 0) > 0
                      ? `Đẩy tin · còn ${r.bump_credits} lượt`
                      : `Đẩy tin · ${vnd(tachThue(giaDayTin(bangTheoMucDich(billing, r.purpose), goi.cap)).tongTra)}`}
                </button>
              )}
              {/* MUA GÓI — rẻ hơn đẩy lẻ 20–50%, và hệ thống tự đẩy giúp mỗi sáng. */}
              {r.status === "approved" && (
                <button
                  type="button"
                  disabled={dangMua === r.id}
                  onClick={() => handleMuaGoi(r)}
                  className="flex h-9 items-center rounded-full border border-cvr-line px-4 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-50"
                >
                  {dangMua === r.id ? "Đang mua…" : "Mua gói đẩy"}
                </button>
              )}
              {/* UP TIN — gia hạn gói, ngày tính lại từ hôm nay (tin đang đăng hoặc hết hạn) */}
              {(r.status === "approved" || r.status === "expired") && (
                <button
                  type="button"
                  onClick={() => { setUpCho(r); setUpChon(null); }}
                  className={`flex h-9 items-center rounded-full px-4 text-sm font-semibold transition ${r.status === "expired" ? "bg-cvr-blue text-white hover:bg-cvr-blue-ink" : "border border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"}`}
                >
                  Up tin
                </button>
              )}
              {r.status === "draft" && (
                <button
                  type="button"
                  onClick={() => handleDelete(r)}
                  className="ml-auto flex h-9 items-center rounded-full border border-red-200 px-4 text-sm font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50"
                >
                  Xoá
                </button>
              )}
            </div>

          </article>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-cvr-muted">
            {tuKhoa.trim() ? `Không có tin nào khớp “${tuKhoa.trim()}”.` : "Không có tin nào ở mục này."}
          </p>
        )}
      </div>

      {tongTrang > 1 && (
        <PhanTrang hienTai={trangHienTai} tong={tongTrang} doiTrang={doiTrang} ghiChu={`${filtered.length} tin`} className="pt-1" />
      )}
      {upCho && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => !dangUp && setUpCho(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-cvr-muted">Up tin</p>
            <h3 className="mt-0.5 line-clamp-2 text-base font-semibold text-cvr-ink">{upCho.title || "(chưa có tiêu đề)"}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-cvr-muted">
              Ngày đăng và hạn hiển thị tính lại từ hôm nay; ngày còn lại của gói cũ không cộng dồn.
              Miễn phí thành viên mới và voucher hội viên tự áp khi xác nhận.
            </p>
            <div className="mt-4 space-y-3">
              {bangTheoMucDich(billing, upCho.purpose).plans.map((p) => (
                <div key={p.tierId}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cvr-muted">{p.name}</p>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {[...p.terms].sort((a, b) => a.days - b.days).map((t) => {
                      const chon = upChon?.tier === p.tierId && upChon.soNgay === t.days;
                      return (
                        <button key={t.days} type="button" onClick={() => setUpChon({ tier: p.tierId, soNgay: t.days })}
                          className={`rounded-xl border px-2 py-2 text-center transition ${chon ? "border-cvr-ink bg-cvr-ink text-white" : "border-cvr-line hover:border-cvr-ink"}`}>
                          <span className="block text-sm font-semibold">{t.days} ngày</span>
                          <span className={`block text-xs tabular-nums ${chon ? "text-white" : "text-cvr-muted"}`}>{vnd(tachThue(t.price).tongTra)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setUpCho(null)} disabled={dangUp} className="h-11 flex-1 rounded-full border border-cvr-line text-sm font-medium text-cvr-body">Huỷ</button>
              <button type="button" onClick={xacNhanUp} disabled={!upChon || dangUp}
                className="h-11 flex-[2] rounded-full bg-cvr-ink text-sm font-semibold text-white disabled:opacity-50">
                {dangUp ? "Đang Up…" : upChon ? "Xác nhận Up tin" : "Chọn hạng và thời hạn"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
