"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/Ui";

// ════════════════════════════════════════════════════════════════════════════
// KHÁCH HÀNG — AI ĐANG QUAN TÂM TIN CỦA TÔI (thay cho trang "Tương tác")
// ----------------------------------------------------------------------------
// Chủ dự án chốt 24/09/2026: người đăng tin phải nắm rõ tin có bao nhiêu lượt
// xem, tương tác, NGÀY GIỜ xem — để quản lý và KIỂM CHỨNG tin mình đăng. Cách
// tổ chức học theo mục "Quản lý khách hàng" của Batdongsan: xem theo KHÁCH hoặc
// theo TIN, mới nhất lên đầu, khách mới làm nổi bật, liên hệ được ngay.
//
// Danh tính chỉ có khi người xem ĐĂNG NHẬP / nhập OTP (không kỹ thuật nào lấy
// được danh tính người ẩn danh). Người chỉ xem → số điện thoại che giữa; người
// đã bấm hỏi số → số đầy đủ + Gọi / Zalo / Chép số.
//
// Nguồn dữ liệu (đều có RLS: chỉ CHỦ TIN đọc được tin của mình):
//   listing_leads (0022) · listing_view_daily (0023) · listing_impression_daily (0030)
//   listing_viewer (0031) · danh_gia_tin (0032) · listing_view_event (0036)
// ════════════════════════════════════════════════════════════════════════════

type Lead = { id: string; listing_id: string; viewer_id: string | null; viewer_name: string | null; viewer_phone: string | null; created_at: string };
type Viewer = { listing_id: string; viewer_id: string; lan_xem: number; viewer_name: string | null; viewer_phone: string | null; lan_cuoi: string };
type DanhGia = { id: string; listing_id: string; sao: number; sai_thong_tin: boolean; khong_lien_lac: boolean; da_ban: boolean; created_at: string };
type SuKien = { id: number; listing_id: string; luc: string; thiet_bi: string | null; nguon: string | null; la_thanh_vien: boolean };
type DongTin = { id: string; title: string; hienThi: number; nguoiXem: number; xem7: number; xem30: number; tong: number; hoiSo: number };

// Một KHÁCH = một người (gom mọi tin họ xem / hỏi số lại với nhau).
type Khach = {
  khoa: string;
  ten: string;
  sdt: string | null;
  daHoiSo: boolean;
  lanXem: number;
  luc: string;                       // tương tác gần nhất
  tin: { id: string; hoiSo: boolean; lanXem: number; luc: string }[];
};

const NGUON: Record<string, string> = {
  google: "Google", zalo: "Zalo", facebook: "Facebook", truc_tiep: "Vào thẳng", trong_web: "Trong web", khac: "Trang khác",
};
const KHOA_DA_XEM = "cl_khach_hang_da_xem"; // mốc lần cuối người bán mở trang — để đánh dấu khách MỚI

export default function KhachHangPage() {
  const [tin, setTin] = useState<DongTin[] | null>(null);
  const [tenTin, setTenTin] = useState<Map<string, string>>(new Map());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [danhGia, setDanhGia] = useState<DanhGia[]>([]);
  const [suKien, setSuKien] = useState<SuKien[]>([]);
  const [the, setThe] = useState<"khach" | "tin" | "luot">("khach");
  const [loc, setLoc] = useState<"all" | "hoi-so" | "chi-xem">("all");
  const [tim, setTim] = useState("");
  const [mocCu, setMocCu] = useState<string>("");

  useEffect(() => {
    // Khách nào tương tác SAU lần mở trang trước là khách mới. Đọc mốc cũ rồi
    // ghi mốc mới ngay — lần sau vào, những khách đang thấy hôm nay hết "mới".
    try {
      setMocCu(localStorage.getItem(KHOA_DA_XEM) ?? "");
      localStorage.setItem(KHOA_DA_XEM, new Date().toISOString());
    } catch { /* trình duyệt chặn lưu → không đánh dấu mới, trang vẫn chạy */ }

    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setTin([]);

      const { data: ds } = await supabase
        .from("listings")
        .select("id,title,view_count")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      const list = (ds ?? []) as { id: string; title: string; view_count: number | null }[];
      if (!list.length) return setTin([]);
      const ids = list.map((l) => l.id);
      setTenTin(new Map(list.map((l) => [l.id, l.title])));

      const moc = (lui: number) => {
        const d = new Date();
        d.setDate(d.getDate() - lui);
        return d.toISOString().slice(0, 10);
      };
      const moc7 = moc(7);
      const moc30 = moc(30);

      const [{ data: xem }, { data: ht }, { data: nx }, { data: ld }, { data: dg }, { data: sk }] = await Promise.all([
        supabase.from("listing_view_daily").select("listing_id,ngay,luot").in("listing_id", ids).gte("ngay", moc30),
        supabase.from("listing_impression_daily").select("listing_id,luot").in("listing_id", ids).gte("ngay", moc30),
        supabase.from("listing_viewer").select("listing_id,viewer_id,lan_xem,viewer_name,viewer_phone,lan_cuoi")
          .in("listing_id", ids).order("lan_cuoi", { ascending: false }).limit(500),
        supabase.from("listing_leads").select("id,listing_id,viewer_id,viewer_name,viewer_phone,created_at")
          .in("listing_id", ids).order("created_at", { ascending: false }).limit(500),
        supabase.from("danh_gia_tin").select("id,listing_id,sao,sai_thong_tin,khong_lien_lac,da_ban,created_at")
          .in("listing_id", ids).order("created_at", { ascending: false }).limit(200),
        // Từng lượt xem có giờ (0036) — ghi từ 24/09/2026, trước đó chưa có.
        supabase.from("listing_view_event").select("id,listing_id,luc,thiet_bi,nguon,la_thanh_vien")
          .in("listing_id", ids).order("luc", { ascending: false }).limit(300),
      ]);

      const bay = new Map<string, number>();
      const bamuoi = new Map<string, number>();
      for (const d of (xem ?? []) as { listing_id: string; ngay: string; luot: number }[]) {
        const n = String(d.ngay).slice(0, 10);
        const l = Number(d.luot) || 0;
        bamuoi.set(d.listing_id, (bamuoi.get(d.listing_id) ?? 0) + l);
        if (n >= moc7) bay.set(d.listing_id, (bay.get(d.listing_id) ?? 0) + l);
      }
      const demHt = new Map<string, number>();
      for (const d of (ht ?? []) as { listing_id: string; luot: number }[]) {
        demHt.set(d.listing_id, (demHt.get(d.listing_id) ?? 0) + (Number(d.luot) || 0));
      }

      const dsViewer = (nx ?? []) as Viewer[];
      const dsLead = (ld ?? []) as Lead[];
      setViewers(dsViewer);
      setLeads(dsLead);
      setDanhGia((dg ?? []) as DanhGia[]);
      setSuKien((sk ?? []) as SuKien[]);

      // Số NGƯỜI xem mỗi tin (không phải số dòng theo ngày).
      const nguoiTheoTin = new Map<string, Set<string>>();
      for (const v of dsViewer) {
        if (!nguoiTheoTin.has(v.listing_id)) nguoiTheoTin.set(v.listing_id, new Set());
        nguoiTheoTin.get(v.listing_id)!.add(v.viewer_id);
      }
      const demLead = new Map<string, number>();
      for (const l of dsLead) demLead.set(l.listing_id, (demLead.get(l.listing_id) ?? 0) + 1);

      setTin(
        list
          .map((l) => ({
            id: l.id,
            title: l.title,
            hienThi: demHt.get(l.id) ?? 0,
            nguoiXem: nguoiTheoTin.get(l.id)?.size ?? 0,
            xem7: bay.get(l.id) ?? 0,
            xem30: bamuoi.get(l.id) ?? 0,
            tong: Number(l.view_count ?? 0),
            hoiSo: demLead.get(l.id) ?? 0,
          }))
          .sort((a, b) => b.xem7 - a.xem7 || b.tong - a.tong),
      );
    })();
  }, []);

  // ── GOM THEO TỪNG KHÁCH ───────────────────────────────────────────────────
  // Một người = viewer_id (thành viên); lead cũ không có viewer_id thì gom theo
  // số điện thoại. Người đã hỏi số ở BẤT KỲ tin nào → hiện số đầy đủ.
  const khach = useMemo(() => {
    const m = new Map<string, Khach>();
    const lay = (khoa: string, ten: string | null, sdt: string | null): Khach => {
      let k = m.get(khoa);
      if (!k) {
        k = { khoa, ten: ten || "Thành viên", sdt, daHoiSo: false, lanXem: 0, luc: "", tin: [] };
        m.set(khoa, k);
      }
      if (!k.sdt && sdt) k.sdt = sdt;
      if (k.ten === "Thành viên" && ten) k.ten = ten;
      return k;
    };
    const tinCua = (k: Khach, id: string) => {
      let t = k.tin.find((x) => x.id === id);
      if (!t) { t = { id, hoiSo: false, lanXem: 0, luc: "" }; k.tin.push(t); }
      return t;
    };
    for (const v of viewers) {
      const k = lay(v.viewer_id, v.viewer_name, v.viewer_phone);
      const t = tinCua(k, v.listing_id);
      const n = Number(v.lan_xem) || 0;
      k.lanXem += n; t.lanXem += n;
      if (v.lan_cuoi > k.luc) k.luc = v.lan_cuoi;
      if (v.lan_cuoi > t.luc) t.luc = v.lan_cuoi;
    }
    for (const l of leads) {
      const khoa = l.viewer_id ?? `sdt:${(l.viewer_phone ?? "").replace(/\D/g, "") || l.id}`;
      const k = lay(khoa, l.viewer_name, l.viewer_phone);
      const t = tinCua(k, l.listing_id);
      k.daHoiSo = true; t.hoiSo = true;
      if (l.created_at > k.luc) k.luc = l.created_at;
      if (l.created_at > t.luc) t.luc = l.created_at;
    }
    return [...m.values()].sort((a, b) => (a.luc < b.luc ? 1 : -1));
  }, [viewers, leads]);

  const khachLoc = useMemo(() => {
    const q = tim.trim().toLowerCase();
    const qSo = q.replace(/\D/g, "");
    return khach
      .filter((k) => (loc === "hoi-so" ? k.daHoiSo : loc === "chi-xem" ? !k.daHoiSo : true))
      .filter((k) => !q || k.ten.toLowerCase().includes(q) || (k.daHoiSo && qSo.length >= 3 && (k.sdt ?? "").replace(/\D/g, "").includes(qSo)));
  }, [khach, loc, tim]);

  const tongHienThi = (tin ?? []).reduce((s, t) => s + t.hienThi, 0);
  const tongXem30 = (tin ?? []).reduce((s, t) => s + t.xem30, 0);
  const tongNguoiXem = khach.filter((k) => k.lanXem > 0).length;
  const tongHoiSo = khach.filter((k) => k.daHoiSo).length;
  const soMoi = mocCu ? khach.filter((k) => k.luc > mocCu).length : 0;

  const diemTb = danhGia.length ? danhGia.reduce((s2, d) => s2 + d.sao, 0) / danhGia.length : 0;
  const soSai = danhGia.filter((d) => d.sai_thong_tin).length;
  const soKhongGap = danhGia.filter((d) => d.khong_lien_lac).length;
  const soDaBan = danhGia.filter((d) => d.da_ban).length;

  if (tin === null) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  if (tin.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Khách hàng" />
        <div className="rounded-2xl border border-cvr-line bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-cvr-muted">Đăng tin đầu tiên để bắt đầu theo dõi lượt xem và khách quan tâm.</p>
          <Link href="/dang-tin" className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-cvr-ink px-6 text-sm font-semibold text-white">
            Đăng tin
          </Link>
        </div>
      </div>
    );
  }

  const nutThe = (id: typeof the, nhan: string, so?: number) => (
    <button
      type="button"
      onClick={() => setThe(id)}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${the === id ? "bg-cvr-ink text-white" : "text-cvr-muted hover:text-cvr-ink"}`}
    >
      {nhan}{so ? <span className={`ml-1.5 ${the === id ? "text-white/80" : "text-cvr-faint"}`}>{so}</span> : null}
    </button>
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Khách hàng" />

      {/* ── 30 NGÀY QUA: Hiển thị → Xem tin → Thành viên xem → Hỏi số ────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <O nhan="Lượt hiển thị" so={tongHienThi} />
        <O nhan="Lượt xem tin" so={tongXem30} />
        <O nhan="Thành viên đã xem" so={tongNguoiXem} />
        <O nhan="Khách hỏi số" so={tongHoiSo} accent />
      </section>

      {/* ── BA CÁCH XEM ───────────────────────────────────────────────────────── */}
      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto rounded-full bg-cvr-surface p-1">
        {nutThe("khach", "Khách hàng", khach.length)}
        {nutThe("tin", "Theo tin", tin.length)}
        {nutThe("luot", "Lượt xem")}
      </div>

      {the === "khach" && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {([["all", "Tất cả"], ["hoi-so", "Đã hỏi số"], ["chi-xem", "Chỉ xem tin"]] as const).map(([id, nhan]) => (
                <button key={id} type="button" onClick={() => setLoc(id)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${loc === id ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink"}`}>
                  {nhan}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm tên hoặc số điện thoại…"
              className="h-9 w-full rounded-full border border-cvr-line px-4 text-sm text-cvr-ink outline-none placeholder:text-cvr-faint focus:border-cvr-ink sm:w-64"
            />
          </div>
          {soMoi > 0 && <p className="text-[13px] font-medium text-cvr-blue-ink">{soMoi} khách mới kể từ lần bạn xem trước</p>}

          {khachLoc.length === 0 ? (
            <p className="rounded-2xl border border-cvr-line bg-white p-6 text-center text-sm text-cvr-muted">
              {khach.length === 0 ? "Chưa có thành viên nào xem hay hỏi số tin của bạn." : "Không có khách nào khớp."}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {khachLoc.map((k) => {
                const moi = !!mocCu && k.luc > mocCu;
                const so = k.sdt?.replace(/\s/g, "") ?? "";
                return (
                  <li key={k.khoa} className={`rounded-2xl border bg-white p-4 shadow-sm ${moi ? "border-cvr-blue/40" : "border-cvr-line"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-cvr-ink">
                          {moi && <span className="h-2 w-2 rounded-full bg-cvr-blue" aria-label="Khách mới" />}
                          {k.ten}
                          {k.daHoiSo
                            ? <span className="rounded-full bg-cvr-blue/10 px-2 py-0.5 text-[11px] font-semibold text-cvr-blue-ink">Đã hỏi số</span>
                            : <span className="rounded-full bg-cvr-surface px-2 py-0.5 text-[11px] font-medium text-cvr-muted">Chỉ xem tin</span>}
                        </p>
                        <p className="mt-0.5 text-sm tabular-nums text-cvr-body">
                          {k.sdt ? (k.daHoiSo ? k.sdt : cheSo(k.sdt)) : "Chưa có số điện thoại"}
                          {k.lanXem > 0 && <span className="text-cvr-muted"> · xem {k.lanXem} lần</span>}
                        </p>
                        <p className="mt-0.5 text-[13px] text-cvr-muted">Gần nhất: {ngayGio(k.luc)} · {truocDay(k.luc)}</p>
                      </div>
                      {k.daHoiSo && so && (
                        <div className="flex shrink-0 gap-1.5">
                          <a href={`tel:${so}`} className="rounded-full bg-cvr-ink px-3.5 py-1.5 text-xs font-semibold text-white">Gọi</a>
                          <a href={`https://zalo.me/${so.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                            className="rounded-full border border-cvr-line px-3.5 py-1.5 text-xs font-semibold text-cvr-ink">Zalo</a>
                          <NutChep so={so} />
                        </div>
                      )}
                    </div>
                    {/* Tin khách này đã tương tác — hành động + thời điểm từng tin */}
                    <ul className="mt-3 space-y-1.5 border-t border-cvr-line/70 pt-3">
                      {k.tin.sort((a, b) => (a.luc < b.luc ? 1 : -1)).map((t) => (
                        <li key={t.id} className="flex items-start justify-between gap-3 text-[13px]">
                          <Link href={`/tai-khoan/tin-dang/${t.id}`} className="min-w-0 truncate text-cvr-body hover:text-cvr-ink hover:underline">
                            {tenTin.get(t.id) ?? "Tin đã xoá"}
                          </Link>
                          <span className="shrink-0 text-cvr-muted">
                            {[t.hoiSo ? "hỏi số" : "", t.lanXem ? `xem ${t.lanXem} lần` : ""].filter(Boolean).join(" · ")} · {ngayGio(t.luc)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {the === "tin" && (
        <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
                  <th className="py-2.5">Tin đăng</th>
                  <th className="py-2.5 text-right">Hiển thị 30n</th>
                  <th className="py-2.5 text-right">Xem 7n</th>
                  <th className="py-2.5 text-right">Xem 30n</th>
                  <th className="py-2.5 text-right">Tổng xem</th>
                  <th className="py-2.5 text-right">Thành viên</th>
                  <th className="py-2.5 text-right">Hỏi số</th>
                </tr>
              </thead>
              <tbody>
                {tin.map((t) => (
                  <tr key={t.id} className="border-b border-cvr-line/70 last:border-0">
                    <td className="max-w-[220px] py-3 pr-3">
                      <Link href={`/tai-khoan/tin-dang/${t.id}`} className="line-clamp-2 font-medium text-cvr-ink hover:underline">{t.title}</Link>
                    </td>
                    <td className="py-3 text-right tabular-nums text-cvr-body">{t.hienThi || "—"}</td>
                    <td className="py-3 text-right tabular-nums font-semibold text-cvr-ink">{t.xem7}</td>
                    <td className="py-3 text-right tabular-nums text-cvr-body">{t.xem30}</td>
                    <td className="py-3 text-right tabular-nums text-cvr-body">{t.tong}</td>
                    <td className="py-3 text-right tabular-nums text-cvr-body">{t.nguoiXem || "—"}</td>
                    <td className="py-3 text-right tabular-nums font-semibold text-cvr-blue-ink">{t.hoiSo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {the === "luot" && (
        <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
          {suKien.length === 0 ? (
            <p className="text-sm text-cvr-muted">Chưa có lượt xem nào được ghi giờ. Lượt xem mới sẽ hiện ở đây kèm ngày giờ.</p>
          ) : (
            <ul className="divide-y divide-cvr-line/70">
              {nhomTheoNgay(suKien).map(([ngay, ds]) => (
                <li key={ngay} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cvr-muted">{ngay} · {ds.length} lượt</p>
                  <ul className="mt-2 space-y-1.5">
                    {ds.map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-3 text-[13px]">
                        <span className="w-12 shrink-0 tabular-nums font-semibold text-cvr-ink">{gio(s.luc)}</span>
                        <Link href={`/tai-khoan/tin-dang/${s.listing_id}`} className="min-w-0 flex-1 truncate text-cvr-body hover:underline">
                          {tenTin.get(s.listing_id) ?? "Tin đã xoá"}
                        </Link>
                        <span className="shrink-0 text-cvr-muted">
                          {[s.thiet_bi === "dien_thoai" ? "Điện thoại" : s.thiet_bi === "may_tinh" ? "Máy tính" : "",
                            s.nguon ? NGUON[s.nguon] ?? "" : "",
                            s.la_thanh_vien ? "Thành viên" : "Ẩn danh"].filter(Boolean).join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── KHÁCH ĐÁNH GIÁ TIN ── giữ như trang Tương tác cũ ─────────────────── */}
      {danhGia.length > 0 && (
        <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-cvr-ink">Khách đánh giá tin</h2>
            <p className="text-sm text-cvr-body">
              <span className="text-[#f5a623]">★</span>{" "}
              <strong className="font-semibold text-cvr-ink">{diemTb.toFixed(1)}</strong>
              <span className="text-cvr-muted"> · {danhGia.length} lượt</span>
            </p>
          </div>
          {(soSai > 0 || soKhongGap > 0 || soDaBan > 0) && (
            <p className="mt-2.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {[soSai > 0 ? `${soSai} lượt báo sai thông tin` : "", soKhongGap > 0 ? `${soKhongGap} lượt gọi không liên lạc được` : "", soDaBan > 0 ? `${soDaBan} lượt báo đã bán` : ""]
                .filter(Boolean).join(" · ")}
              . Kiểm tra lại tin để khách không mất lòng tin.
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {danhGia.slice(0, 10).map((d) => (
              <li key={d.id} className="rounded-xl bg-cvr-surface px-3 py-2.5">
                <p className="text-sm font-medium text-cvr-ink">
                  <span className="text-[#f5a623]">{"★".repeat(d.sao)}</span>
                  <span className="text-cvr-line">{"★".repeat(5 - d.sao)}</span>
                  {d.sai_thong_tin && <span className="ml-2 text-[12px] font-normal text-amber-700">sai thông tin</span>}
                  {d.khong_lien_lac && <span className="ml-2 text-[12px] font-normal text-amber-700">không liên lạc được</span>}
                  {d.da_ban && <span className="ml-2 text-[12px] font-normal text-cvr-muted">đã bán</span>}
                </p>
                <p className="truncate text-xs text-cvr-muted">
                  <Link href={`/tai-khoan/tin-dang/${d.listing_id}`} className="hover:underline">{tenTin.get(d.listing_id) ?? "Tin đã xoá"}</Link>
                  {" "}· {truocDay(d.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function NutChep({ so }: { so: string }) {
  const [xong, setXong] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(so); setXong(true); setTimeout(() => setXong(false), 1500); } catch { /* bị chặn → bỏ qua */ }
      }}
      className="rounded-full border border-cvr-line px-3.5 py-1.5 text-xs font-semibold text-cvr-ink"
    >
      {xong ? "Đã chép" : "Chép số"}
    </button>
  );
}

function O({ nhan, so, accent }: { nhan: string; so: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm">
      <p className="text-xs text-cvr-muted">{nhan}</p>
      <p className={`mt-0.5 text-2xl font-semibold tracking-tight tabular-nums ${accent && so > 0 ? "text-cvr-blue-ink" : "text-cvr-ink"}`}>
        {so.toLocaleString("vi-VN")}
      </p>
      <p className="text-[11px] text-cvr-faint">30 ngày qua</p>
    </div>
  );
}

// Giờ Việt Nam cho mọi mốc hiển thị — máy khách ở đâu cũng ra đúng giờ VN.
const VN = { timeZone: "Asia/Ho_Chi_Minh" } as const;
function ngayGio(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("vi-VN", { ...VN, day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("vi-VN", { ...VN, hour: "2-digit", minute: "2-digit" })}`;
}
function gio(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { ...VN, hour: "2-digit", minute: "2-digit" });
}
function nhomTheoNgay(ds: SuKien[]): [string, SuKien[]][] {
  const m = new Map<string, SuKien[]>();
  for (const s of ds) {
    const ngay = new Date(s.luc).toLocaleDateString("vi-VN", { ...VN, weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
    if (!m.has(ngay)) m.set(ngay, []);
    m.get(ngay)!.push(s);
  }
  return [...m.entries()];
}

// "12 phút trước" — khách cần biết lead còn nóng hay đã nguội.
function truocDay(iso: string): string {
  if (!iso) return "";
  const phut = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (phut < 1) return "vừa xong";
  if (phut < 60) return `${phut} phút trước`;
  const g = Math.round(phut / 60);
  if (g < 24) return `${g} giờ trước`;
  const ngay = Math.round(g / 24);
  return ngay < 30 ? `${ngay} ngày trước` : new Date(iso).toLocaleDateString("vi-VN", VN);
}

// Che giữa số: 0912 *** 456 — người chỉ xem tin chưa đồng ý đưa số cho người bán.
function cheSo(sdt: string): string {
  const so = sdt.replace(/\D/g, "");
  if (so.length < 7) return "***";
  return so.slice(0, 4) + " *** " + so.slice(-3);
}
