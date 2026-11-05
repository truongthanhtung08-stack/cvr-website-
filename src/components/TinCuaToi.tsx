"use client";

import { useSoMoiTrang } from "@/lib/useSoMoiTrang";
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
import { bangTheoMucDich, bangUp, chuNangGoi, COT_UP, giaDayTin, laChuThat, soLuotTuNhan, vnd } from "@/lib/billing";
import NangGoiTin, { DanhSachGoi, KhoiTongTien, LienKetQuyDinh, useViKhaDung } from "@/components/NangGoiTin";
import { tinNangDuoc, yeuCauNangCuaTin } from "@/lib/nangGoi";
import { getTier } from "@/lib/packages";
import NhanGoi from "@/components/NhanGoi";
import { soNgayConDay } from "@/lib/luotUp";
import BangGiaGoiTin from "@/components/BangGiaGoiTin";
import type { TierId } from "@/lib/packages";
import { useBilling } from "@/lib/useBilling";
import { tachThue } from "@/lib/thue";
import { useKhoaCuon } from "@/lib/khoaCuon";
import { nguoiDungHienTai } from "@/lib/supabase/nguoiDung";
import { tenLoaiHinh } from "@/lib/filters";

// Tin đăng của THÀNH VIÊN — tin của chính mình (mọi trạng thái, kể cả nháp).
// RLS đảm bảo chỉ thấy tin owner_id = mình.
// Lead = người ĐÃ ĐĂNG NHẬP đã bấm "hiện số" ở tin của mình (bảng listing_leads).
type Lead = { id: string; listing_id: string; viewer_name: string | null; viewer_phone: string | null; created_at: string };

// Số tin mỗi trang. Khách đăng vài trăm tin thì đổ hết ra một trang là máy yếu
// đứng hình và không tài nào tìm lại được tin cũ.

// BẢN DEMO (chủ dự án 01/11/2026, chỉ máy xem thử — /demo/tin-cua-toi): tin mẫu + ví mẫu truyền vào, KHÔNG đọc/ghi cơ sở dữ liệu,
// không trừ tiền. Màn thật không truyền demo.
export type DemoTinCuaToi = { rows: ListingRow[]; vi: { khaDung: number; tamGiu: number } };
// Kiểu nút hàng thao tác mỗi tin — một cỡ cho mọi nút (h-9, rounded-lg, chữ 13.5px)
const NUT_PHU = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3.5 text-[13.5px] font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink";
const NUT_CHINH_TIN = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-[13.5px] font-semibold text-white transition active:scale-[0.99] disabled:opacity-50";
const baoDemo = () => window.alert("Bản demo — không ghi gì, không trừ tiền.");

export default function TinCuaToi({ demo }: { demo?: DemoTinCuaToi } = {}) {
  // Giá đẩy tin lấy từ bảng admin đang lưu — chủ dự án đổi giá là nút đổi theo.
  const { billing } = useBilling();
  const [napXong, setNapXong] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc địa chỉ trang một lần khi mở
    if (new URLSearchParams(window.location.search).get("nap") === "thanh-cong") setNapXong(true);
  }, []);
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [leadsByListing, setLeadsByListing] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | ListingStatus>("all");
  // Mục đang chọn phải nằm trong tầm mắt của dòng cuộn ngang.
  const hangLoc = useRef<HTMLDivElement>(null);
  useEffect(() => {
    hangLoc.current?.querySelector(`[data-loc="${tab}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [tab]);
  // ── NÂNG GÓI (chủ dự án 01/11/2026) ── chỉ chính chủ đã tự vào; trên web chỉ hiện khi chữ phía khách đã Duyệt trong Admin
  // (máy xem thử chạy với chữ mẫu). Từ trang nạp tiền quay về (?nang=<id>&tier=&days=) → mở lại đúng tin, đúng gói đã chọn.
  const [laChu, setLaChu] = useState(false);
  const [nangCho, setNangCho] = useState<{ r: ListingRow; chon: { tier: TierId; days: number } | null } | null>(null);
  const moNangGoi = billing.nangGoi?.bat === true; // CHỈ khi anh đã tích "Bật trên web" + Duyệt trong Admin (06/11/2026) — trước xét nhầm "có chữ sửa tay"
  const chuNang = chuNangGoi(billing);
  const [tuKhoa, setTuKhoa] = useState("");
  const [trang, setTrang] = useState(1);
  const MOI_TRANG = useSoMoiTrang(); // PC 15 · điện thoại 10 — quy định chung mọi danh sách (22/10/2026; trước 10)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bản demo: nạp tin mẫu một lần khi mở
    if (demo) { setRows(demo.rows); setLaChu(true); setLoading(false); return; }
    const supabase = createClient();
    (async () => {
      const user = await nguoiDungHienTai(supabase);
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", user.id)
        .neq("status", "deleted") // tin đã xoá nằm ở mục Đã xoá của admin (0066)
        .order("created_at", { ascending: false });
      const list = (data ?? []) as ListingRow[];
      setRows(list);
      setLoading(false);
      const { data: hs } = await supabase.from("profiles").select("tao_ho,vao_chinh_thuc_luc").eq("id", user.id).limit(1);
      setLaChu(laChuThat(hs?.[0]));
      const q = new URLSearchParams(window.location.search), maNang = q.get("nang");
      const tinNang = maNang ? list.find((x) => x.id === maNang) : undefined;
      if (tinNang) setNangCho({ r: tinNang, chon: q.get("tier") ? { tier: q.get("tier") as TierId, days: Number(q.get("days")) } : null });
      // ĐẨY TIN SAU KHI NẠP (chủ dự án 05/11/2026: nạp xong máy tự làm, khách không phải bấm lại): ví thiếu lúc đẩy → nạp →
      // về đây kèm ?day=<tin>&luot=<số lượt khách đã chọn> → máy tự đẩy / mua đúng gói đó (vẫn trừ đúng giá bảng giá ở máy chủ).
      const maDay = q.get("day");
      const tinDay = maDay ? list.find((x) => x.id === maDay && x.status === "approved") : undefined;
      if (tinDay) {
        tuDay.current = true;
        setMuaCho({ r: tinDay, conDay: soNgayConDay(tinDay.tier_expires_at, tinDay.bump_lich, false), cap: thongTinGoi(tinDay).cap, coLe: true });
        setLuotChon(Math.max(1, Number(q.get("luot")) || 1));
      }
      if (maDay) { q.delete("day"); q.delete("luot"); window.history.replaceState(window.history.state, "", `${window.location.pathname}${q.toString() ? `?${q}` : ""}`); }

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
    if (demo) return baoDemo();
    if (!window.confirm(`Xoá tin nháp "${r.title || "(chưa có tiêu đề)"}"?`)) return;
    const { error } = await createClient().rpc("xoa_tin", { p_ids: [r.id] }); // vào mục Đã xoá của admin (0066)
    if (!error) setRows((rows) => rows.filter((x) => x.id !== r.id));
  }

  // ── ĐẨY TIN (UP) ──────────────────────────────────────────────────────────
  // Hỏi xác nhận kèm SỐ TIỀN trước khi trừ: đây là tiền thật, không được trừ
  // chỉ vì một cú bấm nhầm. Máy chủ mới là nơi tính giá và chặn quá 1 lượt/ngày;
  // ở đây chỉ hiển thị và khoá nút trong lúc gọi.
  const [dangDay, setDangDay] = useState<string | null>(null);
  async function handleDay(r: ListingRow, daChon = false) {
    const goi = thongTinGoi(r);
    const kho = Number(r.bump_credits ?? 0);
    // Không còn lượt trong kho → mở bảng đẩy (cùng mẫu Nâng gói: bảng giá · Tổng tiền · ví · Nạp thêm); còn lượt → hỏi như cũ.
    if (kho === 0 && !daChon) {
      setMuaCho({ r, conDay: soNgayConDay(r.tier_expires_at, r.bump_lich, false), cap: goi.cap, coLe: true });
      setLuotChon(1);
      return;
    }
    const gia = giaDayTin(bangTheoMucDich(billing, r.purpose), goi.cap);
    const phaiTra = tachThue(gia).tongTra;
    // Còn lượt trong kho thì KHÔNG mất thêm tiền — phải nói rõ, đừng doạ khách
    // bằng con số tiền khi họ đã trả từ lúc mua gói.
    const loiNhac = kho > 0
      ? `Dùng 1 lượt trong gói đã mua (còn ${kho} lượt). Không mất thêm tiền.`
      : `Phí: ${vnd(phaiTra)} (đã gồm thuế GTGT) — trừ thẳng vào ví.`;
    if (!daChon && !window.confirm(
      `Đẩy tin "${r.title || "(chưa có tiêu đề)"}" lên đầu danh sách?\n\n` +
      `${loiNhac}`
    )) return;
    if (demo) return baoDemo();

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

  // Hạ tin · Tự đăng lại: đã bỏ nút ở Tin của tôi (chủ dự án 01/11/2026); đường máy chủ /api/tin-dang/thao-tac giữ nguyên.


  // ── MUA GÓI UP NHIỀU LƯỢT ── nay mua trong bảng Đẩy tin (mở từ nút Đẩy tin, có cả dòng 1 lượt).
  const [, setDangMua] = useState<string | null>(null);


  // Hộp "Mua gói đẩy": bảng giá đẩy tin của đúng loại tin, bấm ô là chọn gói.
  // coLe: mở từ nút Đẩy tin → bảng có cả dòng 1 lượt (đẩy lẻ); mở từ Mua gói đẩy → chỉ gói nhiều lượt như cũ.
  const [muaCho, setMuaCho] = useState<{ r: ListingRow; conDay: number; cap: TierId; coLe?: boolean } | null>(null);
  const [luotChon, setLuotChon] = useState<number | null>(null);
  const tuDay = useRef(false); // về từ trang nạp với ?day= → tự xác nhận đúng gói khách đã chọn
  const viDay = useViKhaDung(demo?.vi);
  // Về từ trang nạp (?day=) → tự xác nhận đúng gói đẩy khách đã chọn, một lần.
  useEffect(() => {
    if (!tuDay.current || !muaCho || !luotChon) return;
    tuDay.current = false;
    void xacNhanMuaGoi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muaCho, luotChon]);

  async function xacNhanMuaGoi() {
    if (!muaCho || !luotChon) return;
    const r = muaCho.r;
    if (luotChon === 1) { setMuaCho(null); return handleDay(r, true); }
    const g = { soLuot: luotChon };
    setMuaCho(null);
    if (demo) return baoDemo();
    setDangMua(r.id);
    try {
      const res = await fetch("/api/tin-dang/mua-goi-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, soLuot: g.soLuot }),
      });
      const kq = await res.json().catch(() => ({}));
      if (!res.ok || !kq.ok) { window.alert(kq.loi || "Mua gói không thành công."); return; }
      setRows((rows) => rows.map((x) => (x.id === r.id ? { ...x, bump_credits: kq.conLai, ...(kq.bumpedAt ? { bumped_at: kq.bumpedAt } : {}) } : x)));
      window.alert(`Đã mua ${g.soLuot} lượt. Trừ ${vnd(kq.daTru)}, số dư còn ${vnd(kq.soDu)}.\n` +
        (kq.bumpedAt
          ? `Đã đẩy lần đầu ngay bây giờ. Còn ${kq.conLai} lượt, tự đẩy mỗi sáng.`
          : `Hôm nay tin đã được đẩy rồi — lượt đầu chạy sáng mai. Còn ${kq.conLai} lượt.`));
    } finally {
      setDangMua(null);
    }
  }

  // ── UP TIN = GIA HẠN (chốt 25/09/2026): chọn hạng + thời hạn như đăng mới,
  // ngày đăng và hạn tính lại TỪ HÔM NAY, ngày còn dư của gói cũ bỏ.
  const [upCho, setUpCho] = useState<ListingRow | null>(null);
  const [upChon, setUpChon] = useState<{ tier: string; soNgay: number } | null>(null);
  useKhoaCuon(!!muaCho || !!upCho || !!nangCho, () => { setMuaCho(null); setUpCho(null); setNangCho(null); });
  const [dangUp, setDangUp] = useState(false);
  // Tin đang có yêu cầu "Up khi nạp đủ tiền" (bảng up_cho, 0044)
  const [choUp, setChoUp] = useState<Set<string>>(new Set());
  useEffect(() => {
    const sb = createClient();
    (async () => {
      const user = await nguoiDungHienTai(sb);
      if (!user) return;
      if (demo) return;
      const { data } = await sb.from("up_cho").select("listing_id").eq("user_id", user.id).eq("trang_thai", "cho");
      setChoUp(new Set(((data ?? []) as { listing_id: string }[]).map((x) => x.listing_id)));
    })();
  }, []);
  // ĐĂNG LẠI NHANH: chọn sẵn GÓI LẦN TRƯỚC (hạng + số ngày) nếu bảng giá hiện hành còn
  // bán đúng gói đó — khách chỉ bấm Xác nhận; muốn đổi thì chọn gói khác.
  function goiLanTruoc(r: ListingRow): { tier: string; soNgay: number } | null {
    const plan = r.details?.plan as { tier?: string; days?: number } | undefined;
    const soNgay = Number(r.tier_days ?? (plan?.tier === r.tier ? plan?.days : 0)) || 0;
    const coBan = bangTheoMucDich(billing, r.purpose).plans
      .find((p) => p.tierId === r.tier)?.terms.some((t) => t.days === soNgay);
    return coBan ? { tier: r.tier, soNgay } : null;
  }
  async function xacNhanUp() {
    if (!upCho || !upChon) return;
    if (demo) return baoDemo();
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
          `${kq.loi}\n\nNạp thêm ${vnd(kq.viThieu)} — tiền vào ví là tin tự gửi đăng lại đúng gói bạn vừa chọn, không phải bấm lại.\n\nĐi tới trang nạp tiền?`,
        );
        setUpCho(null);
        setUpChon(null);
        if (di) window.location.href = `/tai-khoan/nap-tien?can=${kq.viThieu}&ve=${encodeURIComponent("/tai-khoan/tin-dang")}`;
        return;
      }
      if (!res.ok || !kq.ok) { window.alert(kq.loi || "Đăng lại không thành công."); return; }
      setChoUp((ds) => { const m = new Set(ds); m.delete(upCho.id); return m; });
      setRows((ds) => ds.map((x) => (x.id === upCho.id
        ? { ...x, status: "pending", tier_expires_at: null, details: { ...(x.details ?? {}), plan: { tier: upChon.tier, days: upChon.soNgay } } }
        : x)));
      window.alert(
        "Đã gửi đăng lại — tin chờ kiểm duyệt như tin mới.\n" +
        (kq.mienPhi ? "Miễn phí theo chương trình thành viên mới." : `Phí ${vnd(kq.phaiTra)} trừ vào ví lúc tin được duyệt.`) +
        "\nDuyệt xong tin hiển thị lại, ngày đăng và thời hạn tính từ lúc duyệt.",
      );
      setUpCho(null);
      setUpChon(null);
    } finally {
      setDangUp(false);
    }
  }

  async function huyNang(r: ListingRow) {
    if (demo) {
      const { nang_cho: _x, ...dt } = (r.details ?? {}) as Record<string, unknown>;
      void _x;
      return setRows((ds) => ds.map((x) => (x.id === r.id ? { ...x, details: dt as ListingRow["details"] } : x)));
    }
    if (!window.confirm("Huỷ yêu cầu nâng gói? Tiền tạm giữ trả lại ví khả dụng.")) return;
    const res = await fetch("/api/tin-dang/nang-goi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, huy: true }) });
    const kq = await res.json().catch(() => ({}));
    if (!kq.ok) return window.alert(kq.loi || "Chưa huỷ được.");
    const { nang_cho: _bo, ...details } = (r.details ?? {}) as Record<string, unknown>;
    void _bo;
    setRows((ds) => ds.map((x) => (x.id === r.id ? { ...x, details: details as ListingRow["details"] } : x)));
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
  if (count("hidden") > 0) tabs.push({ key: "hidden", label: `Đã hạ (${count("hidden")})` });

  return (
    <div className="space-y-4">
      <PageHeader title="Tin đã đăng">
        <Link href="/dang-tin" className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          + Đăng tin mới
        </Link>
      </PageHeader>

      {/* Nộp tiền từ gói tin xong → PayOS trả về đây (?nap=thanh-cong, 26/10/2026) — dùng đúng câu đã có ở trang nạp tiền */}
      {napXong && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Thanh toán thành công.
        </p>
      )}

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
              {/* Chờ hiển thị (hẹn ngày đăng) và Đã hạ (khách tự hạ) — nhãn như Batdongsan */}
              {r.status === "approved" && r.published_at && new Date(r.published_at).getTime() > Date.now()
                ? <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">Chờ hiển thị · lên {ngayGon(r.published_at)}</span>
                : r.status === "hidden" && r.details?.ha_boi === "khach"
                  ? <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">Đã hạ</span>
                  : listingStatusBadge(r.status)}
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
              {purposeLabel(r.purpose)}{r.type ? ` · ${tenLoaiHinh(r.type)}` : ""} · {adminPriceText(r.price_vnd, r.purpose)}
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
                {!goi.daDuyet && (() => {
                  // HẸN NGÀY ĐĂNG (plan.batDau) → ngày giờ cụ thể như khung Xem trước (06/11/2026): 00:00 giờ VN ngày hẹn → + số ngày gói
                  const hen = (r.details as { plan?: { batDau?: string } } | null)?.plan?.batDau;
                  if (!hen || goi.soNgay == null) return " · chờ duyệt mới bắt đầu tính";
                  const tu = Date.parse(`${hen}T00:00:00+07:00`);
                  const f = (t: number) => new Date(t).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
                  return ` · Hiệu lực: ${f(tu)} · Hết hạn: ${f(tu + goi.soNgay * 86_400_000)}`;
                })()}
                {goi.daDuyet && r.published_at && ` · Đăng ${ngayGon(r.published_at)}`}
                {goi.daDuyet && goi.hetHan && (
                  goi.conLai != null && goi.conLai <= 0
                    ? <span className="font-medium text-amber-700"> · Đã hết hạn {ngayGon(r.tier_expires_at)} — tin ngừng hiển thị, bấm Đăng lại để hiện lại</span>
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

            {/* HÀNG NÚT MỖI TIN (chủ dự án 01/11/2026): bỏ Thống kê (đã có ở mục Khách hàng), Tự đăng lại, Hạ tin — đường máy chủ giữ nguyên
                (/api/tin-dang/thao-tac, trang /tai-khoan/tin-dang/<id>). Nút phụ (Sửa · Xem) bên trái; nút chính Up tin · Đẩy tin bên phải —
                cùng cỡ h-9, bo rounded-lg như nút chính của web (btn-dangtin). Điện thoại: hai nút chính chia đôi một hàng riêng. */}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cvr-line pt-3">
              <Link href={`/dang-tin?id=${r.id}`} className={NUT_PHU}>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Sửa
              </Link>
              {r.status === "approved" && (
                <Link href={`/bat-dong-san/${r.id}`} target="_blank" className={NUT_PHU}>Xem ↗</Link>
              )}
              {(r.status === "expired" || (r.status === "hidden" && r.details?.ha_boi === "khach")) && (
                <button type="button" onClick={() => { setUpCho(r); setUpChon(goiLanTruoc(r)); }} className={`btn-dangtin ${NUT_CHINH_TIN}`}>
                  Đăng lại
                </button>
              )}
              {r.status === "draft" && (
                <button type="button" onClick={() => handleDelete(r)} className={`${NUT_PHU} border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 hover:text-red-700`}>
                  Xoá
                </button>
              )}
              {/* Yêu cầu nâng gói đang chờ duyệt → hiện yêu cầu + huỷ, thay cho nút Up tin */}
              {moNangGoi && laChu && yeuCauNangCuaTin(r) && (
                <span className="flex h-9 items-center gap-1 rounded-lg border border-cvr-line bg-cvr-surface pl-3 pr-1 text-[13.5px] text-cvr-body sm:ml-auto">
                  Chờ duyệt nâng lên {getTier(yeuCauNangCuaTin(r)!.tier).name}
                  <button type="button" onClick={() => huyNang(r)} className="h-7 rounded-md px-2.5 text-[13px] font-semibold text-cvr-ink hover:bg-white">Huỷ yêu cầu</button>
                </span>
              )}
              {/* Up tin + Đẩy tin CHỈ hiện khi anh đã Duyệt "Cài đặt Up tin – Nâng gói" trong Admin (moNangGoi — 06/11/2026) */}
              {moNangGoi && r.status === "approved" && !(r.published_at && Date.parse(r.published_at) > Date.now()) && (
                <div className={`grid w-full gap-2 sm:flex sm:w-auto ${yeuCauNangCuaTin(r) ? "" : "sm:ml-auto"} ${moNangGoi && laChu && tinNangDuoc(r as Parameters<typeof tinNangDuoc>[0]) ? "grid-cols-2" : "grid-cols-1"}`}>
                  {moNangGoi && laChu && tinNangDuoc(r as Parameters<typeof tinNangDuoc>[0]) && (
                    <button type="button" onClick={() => setNangCho({ r, chon: null })} className={`btn-dangtin ${NUT_CHINH_TIN}`}>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5 5 5M7 17l5-5 5 5" /></svg>
                      {chuNang.nutNang}
                    </button>
                  )}
                  <button type="button" disabled={dangDay === r.id} onClick={() => handleDay(r)} className={`btn-dangtin ${NUT_CHINH_TIN}`}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    {dangDay === r.id ? "Đang đẩy…" : Number(r.bump_credits ?? 0) > 0 ? `${chuNang.nutDay} · còn ${r.bump_credits} lượt` : chuNang.nutDay}
                  </button>
                </div>
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
      {muaCho && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setMuaCho(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-cvr-muted">{muaCho.coLe ? chuNang.nutDay : "Mua gói đẩy tin"}</p>
            <h3 className="mt-0.5 line-clamp-2 text-base font-semibold text-cvr-ink">{muaCho.r.title || "(chưa có tiêu đề)"}</h3>
            {/* DANH SÁCH GÓI ĐẨY (chủ dự án 01/11/2026): mỗi gói một dòng — tên loại tin · số lượt · giá khách trả (gồm VAT); gói vượt
                số lượt còn đẩy được trong thời hạn tin thì mờ. Giá + luật như cũ (bảng Đẩy tin đã công bố). */}
            <DanhSachGoi
              muc={bangUp(bangTheoMucDich(billing, muaCho.r.purpose)).map((x) => {
                const n = soLuotTuNhan(x.label), g = x.values[COT_UP.indexOf(muaCho.cap)]?.gia ?? 0;
                return {
                  khoa: String(n),
                  ten: <NhanGoi id={muaCho.cap} heSo={false} />,
                  phu: `${n} lượt`,
                  gia: tachThue(g).tongTra,
                  mo: g <= 0 || n > muaCho.conDay,
                  dangChon: luotChon === n,
                  onChon: () => setLuotChon(luotChon === n ? null : n),
                };
              })}
            />
            <p className="mt-2 text-[12.5px] text-cvr-muted">Giá đã gồm 8% VAT</p>
            {muaCho.coLe && (
              <LienKetQuyDinh chu={chuNang.lienKetQuyDinh} className="mt-2" />
            )}
            {muaCho.coLe && luotChon && (() => {
              const dong = bangUp(bangTheoMucDich(billing, muaCho.r.purpose)).find((x) => soLuotTuNhan(x.label) === luotChon);
              const t = tachThue(dong?.values[COT_UP.indexOf(muaCho.cap)]?.gia ?? 0);
              return (
                <KhoiTongTien
                  moTa={`${getTier(muaCho.cap).name} · ${luotChon} lượt`}
                  tongTra={t.tongTra}
                  vi={viDay}
                  napHref={`/tai-khoan/nap-tien?can=${Math.max(0, t.tongTra - (viDay?.khaDung ?? 0))}&ve=${encodeURIComponent(`/tai-khoan/tin-dang?day=${muaCho.r.id}&luot=${luotChon}`)}`}
                  dong={[{ nhan: "Phí đẩy tin", giaTri: vnd(t.tienHang) }, { nhan: "VAT 8%", giaTri: vnd(t.tienThue) }]}
                />
              );
            })()}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setMuaCho(null)} className="h-11 flex-1 rounded-lg border border-cvr-line bg-white text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">Huỷ</button>
              <button type="button" onClick={xacNhanMuaGoi} disabled={!luotChon}
                className="btn-dangtin h-11 flex-[2] rounded-lg text-sm font-semibold text-white disabled:opacity-50">
                {luotChon === 1 && muaCho.coLe ? `${chuNang.nutDay} — trừ vào ví` : luotChon ? `Mua gói ${luotChon} lượt — trừ vào ví` : "Chọn gói đẩy"}
              </button>
            </div>
          </div>
        </div>
      )}
      {nangCho && (
        <NangGoiTin
          r={nangCho.r}
          billing={billing}
          demoVi={demo?.vi}
          chonDau={nangCho.chon}
          onDong={() => setNangCho(null)}
          onDaGui={(details) => {
            setRows((ds) => ds.map((x) => (x.id === nangCho.r.id ? { ...x, details: details as ListingRow["details"] } : x)));
            setNangCho(null);
            window.alert("Đã gửi yêu cầu nâng gói. Tin vẫn hiện với gói hiện tại; khi được duyệt, phí trừ vào ví và gói mới chạy từ lúc duyệt.");
          }}
        />
      )}
      {upCho && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => !dangUp && setUpCho(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-cvr-muted">Đăng lại tin</p>
            <h3 className="mt-0.5 line-clamp-2 text-base font-semibold text-cvr-ink">{upCho.title || "(chưa có tiêu đề)"}</h3>
            {/* CÙNG MỘT bảng giá kiểu Batdongsan với form đăng tin + trang Báo giá — bấm ô là chọn gói */}
            <div className="mt-4">
              <BangGiaGoiTin
                plans={bangTheoMucDich(billing, upCho.purpose).plans}
                chon={{ tier: (upChon?.tier ?? "") as TierId | "", days: upChon?.soNgay ?? 0 }}
                onChon={(t, d) => setUpChon({ tier: t, soNgay: d })}
              />
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setUpCho(null)} disabled={dangUp} className="h-11 flex-1 rounded-lg border border-cvr-line bg-white text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">Huỷ</button>
              <button type="button" onClick={xacNhanUp} disabled={!upChon || dangUp}
                className="btn-dangtin h-11 flex-[2] rounded-lg text-sm font-semibold text-white disabled:opacity-50">
                {dangUp ? "Đang đăng lại…" : upChon ? "Xác nhận đăng lại" : "Chọn hạng và thời hạn"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
