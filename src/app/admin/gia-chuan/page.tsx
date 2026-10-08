"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/Ui";
import QuyDinhGiaEditor from "@/components/admin/QuyDinhGiaEditor";
import { ghepQuyDinh } from "@/lib/quyDinhGia";
import { getTier, type TierId } from "@/lib/packages";
import { tachThue } from "@/lib/thue";
import {
  TEN_VOUCHER,
  type BannerTable,
  type CongBo,
  type LoaiVoucher,
  type Plan,
  type PrPkg,
  type UpRow,
} from "@/lib/billing";
import {
  DIEU_CHINH_TRONG,
  NHAP_TRONG,
  THU_TU_CAP,
  apDung,
  canhBaoHoiVien,
  canhBaoLogic,
  giaTriVoucherThang,
  tinhCongBo,
  tinhHoiVien,
  type BangChuan,
  type ChuongTrinh,
  type DieuChinh,
  type GiaChuanNhap,
  type GoiHoiVienChuan,
  type PhanTramCot,
  type QuyDinhTin as QuyDinhTinT,
  laMienPhiTvMoi,
  thieuThongTin,
} from "@/lib/giaChuan";

// ============================================================================
// ADMIN — BẢNG GIÁ (MỘT BẢNG DUY NHẤT — chủ dự án chốt 08/10/2026)
//   Giá chuẩn (nguồn Batdongsan, chưa VAT) → % điều chỉnh TỪNG CỘT → giá công bố.
//   Khuyến mãi (chương trình có thời hạn + miễn phí thành viên mới) ở bảng riêng.
//   Admin không ghi chữ giải thích — chỉ bảng và ô nhập.
// ============================================================================

const inputCls = "h-9 w-full rounded-lg border border-cvr-line px-2.5 text-sm text-cvr-ink outline-none focus:border-cvr-ink";
const dong = (n: number) => Math.round(n).toLocaleString("vi-VN") + "đ";
const tra = (n: number) => dong(tachThue(n).tongTra);
const tenCap = (t: TierId) => getTier(t).name;
const homNayVN = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const tronNghin = (n: number) => Math.round(n / 1000) * 1000;
const tronTram = (n: number) => Math.round(n / 100) * 100;

// Ô số tiền: gõ chữ số, tự thêm dấu chấm. KHÔNG dùng type="number" (quy tắc admin).
// Ô số bắt buộc: trống = chưa nhập (undefined), khác với số 0.
function OSoBatBuoc({ value, onChange }: { value: number | undefined; onChange: (n: number | undefined) => void }) {
  return (
    <input inputMode="numeric" value={value === undefined ? "" : value.toLocaleString("vi-VN")}
      onChange={(e) => { const t = e.target.value.replace(/\D/g, ""); onChange(t ? Number(t) : undefined); }}
      className={inputCls} />
  );
}

function OSo({ value, onChange, className = "" }: { value: number; onChange: (n: number) => void; className?: string }) {
  return (
    <input
      inputMode="numeric"
      value={value ? value.toLocaleString("vi-VN") : ""}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
      className={`${inputCls} ${className}`}
    />
  );
}

// Ô % điều chỉnh (âm = giảm, dương = tăng). TRỐNG = cột CHƯA điều chỉnh → chưa có giá
// công bố, khách không thấy giá mới. Gõ 0 = chủ động giữ đúng giá chuẩn.
function OPhanTram({ value, onChange }: { value?: number; onChange: (n: number | undefined) => void }) {
  const [chu, setChu] = useState(value === undefined ? "" : String(value));
  useEffect(() => setChu(value === undefined ? "" : String(value)), [value]);
  return (
    <div className="flex items-center gap-1">
      <input
        inputMode="decimal"
        value={chu}
        placeholder="—"
        onChange={(e) => {
          const v = e.target.value.replace(/[^\d.,-]/g, "").replace(",", ".");
          setChu(v);
          const n = Number(v);
          if (v === "") onChange(undefined);
          else if (v === "-") return;
          else if (Number.isFinite(n)) onChange(Math.max(-100, Math.min(1000, n)));
        }}
        className={`${inputCls} w-20 text-right`}
      />
      <span className="text-sm text-cvr-muted">%</span>
    </div>
  );
}

// Giá sau % — chỉ có khi cột ĐÃ điều chỉnh (chưa VAT · khách trả gồm VAT).
function GiaCongBo({ gia, pt }: { gia: number; pt?: number }) {
  if (pt === undefined) return <p className="mt-0.5 text-[11px] text-amber-700">Chưa điều chỉnh</p>;
  return (
    <p className="mt-0.5 text-[11px] text-cvr-faint">
      {gia ? <>Công bố {dong(gia)} · gồm VAT <b className="text-cvr-ink">{tra(gia)}</b></> : "Công bố 0đ"}
    </p>
  );
}

type Tab = "gia" | "khuyen-mai" | "quyen-loi" | "quy-dinh";
type Muc = "ban" | "thue" | "hoi-vien" | "du-an" | "pr" | "banner";

export default function BangGiaPage() {
  const [nhap, setNhap] = useState<GiaChuanNhap>(NHAP_TRONG);
  const [congBo, setCongBo] = useState<CongBo | null>(null);
  const [plansHienTai, setPlansHienTai] = useState<Plan[]>([]);
  const [upHienTai, setUpHienTai] = useState<UpRow[]>([]);
  const [tab, setTab] = useState<Tab>("gia");
  const [muc, setMuc] = useState<Muc>("ban");
  const [loading, setLoading] = useState(true);
  const [dangLam, setDangLam] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [hoiCongBo, setHoiCongBo] = useState(false);
  const [daSua, setDaSua] = useState(false);

  async function tai() {
    const res = await fetch("/api/admin/gia-chuan", { cache: "no-store" });
    const kq = await res.json().catch(() => ({}));
    if (!res.ok || !kq.ok) {
      setMsg({ ok: false, text: kq.message || "Không tải được bảng giá." });
    } else {
      const n: GiaChuanNhap = kq.nhap;
      // Miễn phí thành viên mới = một chương trình trong danh sách (lần đầu dựng từ chính sách đang chạy).
      const f = kq.freeHienTai;
      const chuongTrinh: ChuongTrinh[] = n.chuongTrinh.some(laMienPhiTvMoi) || !f ? n.chuongTrinh : [{
        id: "mien-phi-tv-moi", ten: "Miễn phí thành viên mới", phanTram: 100, tu: f.from ?? "", den: f.to ?? "",
        mucDich: "all", sanPham: "tin", tiers: [f.tierId], bat: !!f.active,
        loai: "mien-phi-tv-moi", soNgayTuDangKy: f.days, soTin: f.quota,
      }, ...n.chuongTrinh];
      // Lần đầu: dự án · PR · banner chưa có giá chuẩn → lấy giá đang chạy (giữ nguyên giá khách thấy).
      setNhap({
        ...n,
        chuongTrinh,
        dieuChinh: { ...DIEU_CHINH_TRONG, ...(n.dieuChinh ?? {}) },
        duAn: n.duAn?.length ? n.duAn : kq.duAnHienTai ?? [],
        pr: n.pr?.length ? n.pr : kq.prHienTai ?? [],
        prNotes: n.prNotes ?? kq.prNotesHienTai ?? [],
        banners: n.banners?.length ? n.banners : kq.bannersHienTai ?? [],
        quyDinh: ghepQuyDinh(n.quyDinh ?? kq.quyDinhHienTai),
        quyDinhTin: n.quyDinhTin ?? kq.quyDinhTinHienTai,
      });
      setCongBo(kq.congBo);
      setPlansHienTai(kq.plansHienTai ?? []);
      setUpHienTai(kq.upHienTai ?? []);
      setDaSua(false);
    }
    setLoading(false);
  }
  useEffect(() => { void tai(); }, []);

  const sua = (next: GiaChuanNhap) => { setNhap(next); setDaSua(true); setMsg(null); };
  const dc: DieuChinh = nhap.dieuChinh ?? DIEU_CHINH_TRONG;
  const suaDc = (patch: Partial<DieuChinh>) => sua({ ...nhap, dieuChinh: { ...dc, ...patch } });

  const homNay = homNayVN();
  const xemTruoc = useMemo(() => tinhCongBo(nhap, homNay, plansHienTai, upHienTai), [nhap, homNay, plansHienTai, upHienTai]);
  // Cột CHƯA điều chỉnh (ô % trống) → chưa được công bố.
  const chuaDieuChinh = useMemo(() => {
    const thieu: string[] = [];
    const xet = (ten: string, cot: string[], pt: Partial<Record<string, number>>) => {
      const nhanCot = (c: string) => ((THU_TU_CAP as string[]).includes(c) ? tenCap(c as TierId) : /^\d+$/.test(c) ? `${c} tháng` : c);
      for (const c of cot) if (pt[c] === undefined) thieu.push(`${ten} · ${nhanCot(c)}`);
    };
    for (const md of ["ban", "thue"] as const) {
      const nhan = md === "ban" ? "Tin Bán" : "Tin Cho thuê";
      xet(nhan, nhap[md].plans.filter((p) => p.terms.length).map((p) => p.tierId), dc[md].tin);
      xet(nhan.replace("Tin", "Đẩy tin"), nhap[md].day.filter((d) => d.bac.length).map((d) => d.tierId), dc[md].day);
    }
    xet("Hội viên", [...new Set((nhap.hoiVien ?? []).flatMap((g) => g.thoiHan.map((t) => String(t.thang))))].map((x) => x), dc.hoiVien);
    xet("Dự án", (nhap.duAn ?? []).map((p) => p.tierId), dc.duAn);
    xet("PR", [...new Set((nhap.pr ?? []).map((p) => p.tierId))], dc.pr);
    xet("Banner", (nhap.banners ?? []).map((b) => b.title), dc.banner);
    return thieu;
  }, [nhap, dc]);
  const canhBaoGia = useMemo(() => canhBaoLogic(xemTruoc.ban, xemTruoc.thue, tenCap), [xemTruoc]);
  const hoiVienXemTruoc = useMemo(
    () => tinhHoiVien(nhap.hoiVien ?? [], nhap.chuongTrinh, homNay, dc.hoiVien),
    [nhap.hoiVien, nhap.chuongTrinh, homNay, dc.hoiVien],
  );
  const canhBaoHv = useMemo(() => {
    const cao = (ds: number[]) => { const d = ds.filter((n) => n > 0); return d.length ? Math.max(...d) : undefined; };
    const bangs = [xemTruoc.ban, xemTruoc.thue];
    const tin = (vip: boolean) => cao(bangs.flatMap((b) => b.plans.filter((p) => (p.tierId === "basic") !== vip).flatMap((p) => p.terms.map((t) => t.price))));
    const iBasic = THU_TU_CAP.indexOf("basic");
    const day = cao(bangs.flatMap((b) => (b.up[0] ? [b.up[0].values[iBasic]?.gia ?? 0] : [])));
    return canhBaoHoiVien(hoiVienXemTruoc, { "tin-thuong": tin(false), "tin-vip": tin(true), "day-thuong": day }, "giá sẽ công bố");
  }, [hoiVienXemTruoc, xemTruoc]);

  async function luuNhap() {
    setDangLam("luu");
    const res = await fetch("/api/admin/gia-chuan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nhap }),
    });
    const kq = await res.json().catch(() => ({}));
    setDangLam("");
    if (!res.ok || !kq.ok) return setMsg({ ok: false, text: kq.message || "Lưu nháp không thành công." });
    setNhap({ ...nhap, capNhat: kq.capNhat });
    setDaSua(false);
    setMsg({ ok: true, text: "Đã lưu nháp." });
  }

  // MỘT NÚT CÔNG BỐ: gói tin · đẩy tin · dự án · PR · banner, rồi gói hội viên.
  async function congBoTatCa() {
    setDangLam("cong-bo");
    const goi = async (hanhDong: string) => {
      const res = await fetch("/api/admin/gia-chuan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hanhDong }),
      });
      const kq = await res.json().catch(() => ({}));
      return res.ok && kq.ok ? null : kq.message || "Không thành công.";
    };
    const loi1 = await goi("cong-bo");
    const loi2 = loi1 ? null : (nhap.hoiVien?.length ? await goi("cong-bo-hoi-vien") : null);
    setDangLam("");
    setHoiCongBo(false);
    if (loi1 || loi2) return setMsg({ ok: false, text: (loi1 || loi2) as string });
    await tai();
    setMsg({ ok: true, text: "Đã duyệt — có hiệu lực ngay." });
  }

  // DUYỆT một chương trình = hiệu lực ngay trên web (lưu nháp trước để máy chủ đọc đúng chương trình).
  async function duyetCT(c: ChuongTrinh) {
    if (!window.confirm(`Duyệt “${c.ten || "chương trình"}”? Duyệt xong chương trình có hiệu lực và không sửa được nữa.`)) return;
    setDangLam("duyet");
    const luu = await fetch("/api/admin/gia-chuan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nhap }),
    });
    const kqLuu = await luu.json().catch(() => ({}));
    if (!luu.ok || !kqLuu.ok) { setDangLam(""); return setMsg({ ok: false, text: kqLuu.message || "Lưu nháp không thành công." }); }
    const res = await fetch("/api/admin/gia-chuan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hanhDong: "duyet-chuong-trinh", id: c.id }),
    });
    const kq = await res.json().catch(() => ({}));
    setDangLam("");
    if (!res.ok || !kq.ok) return setMsg({ ok: false, text: kq.message || "Duyệt không thành công." });
    await tai();
    setDaSua(false);
    setMsg({ ok: true, text: `Đã duyệt “${c.ten}”.` });
  }

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải bảng giá…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Bảng giá</h1>
          <p className="mt-1 text-xs text-cvr-muted">
            Nháp: <b className="text-cvr-ink">{nhap.capNhat ? new Date(nhap.capNhat).toLocaleString("vi-VN") : "—"}</b>
            {" · "}Đã duyệt: <b className="text-cvr-ink">{congBo ? new Date(congBo.luc).toLocaleString("vi-VN") : "—"}</b>
          </p>
        </div>
        {(
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={luuNhap} disabled={!!dangLam}
              className="rounded-lg border border-cvr-ink px-4 py-2.5 text-sm font-semibold text-cvr-ink transition hover:bg-cvr-ink/5 disabled:opacity-60">
              {dangLam === "luu" ? "Đang lưu…" : daSua ? "Lưu nháp *" : "Lưu nháp"}
            </button>
            <button type="button" onClick={() => setHoiCongBo(true)} disabled={!!dangLam || daSua || chuaDieuChinh.length > 0}
              title={daSua ? "Lưu nháp trước" : chuaDieuChinh.length ? "Còn cột chưa điều chỉnh %" : ""}
              className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50">
              Duyệt
            </button>
          </div>
        )}
      </div>

      {chuaDieuChinh.length > 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Chưa điều chỉnh {chuaDieuChinh.length} cột: {chuaDieuChinh.join(" · ")}
        </p>
      )}
      {msg && <p className={`rounded-lg px-4 py-2.5 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}

      {hoiCongBo && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Duyệt bảng giá? Duyệt xong có hiệu lực ngay.</p>
          {canhBaoGia.length > 0 && <p className="mt-1">{canhBaoGia.length} cảnh báo logic giá.</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={congBoTatCa} disabled={!!dangLam}
              className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {dangLam === "cong-bo" ? "Đang duyệt…" : "Duyệt"}
            </button>
            <button type="button" onClick={() => setHoiCongBo(false)} className="rounded-lg px-4 py-2 text-sm text-cvr-ink">Huỷ</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-cvr-line pb-3">
        {([["gia", "Bảng giá"], ["khuyen-mai", "Khuyến mãi"], ["quyen-loi", "Quyền lợi gói"], ["quy-dinh", "Quy định tin"]] as const).map(([id, ten]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === id ? "bg-cvr-ink text-white" : "bg-cvr-mist text-cvr-ink hover:bg-cvr-line"}`}>
            {ten}
          </button>
        ))}
      </div>

      {tab === "gia" && (
        <>
          <div className="flex flex-wrap gap-2">
            {([["ban", "Tin Bán"], ["thue", "Tin Cho thuê"], ["hoi-vien", "Hội viên"], ["du-an", "Dự án"], ["pr", "Bài PR"], ["banner", "Banner"]] as const).map(([id, ten]) => (
              <button key={id} type="button" onClick={() => setMuc(id)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${muc === id ? "bg-cvr-blue text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink"}`}>
                {ten}
              </button>
            ))}
          </div>

          {(muc === "ban" || muc === "thue") && (
            <>
              <BangGoiTin
                ten={muc === "ban" ? "Đăng tin Bán" : "Đăng tin Cho thuê"}
                bang={nhap[muc]}
                pt={dc[muc].tin}
                onChange={(b) => sua({ ...nhap, [muc]: b })}
                onPt={(p) => suaDc({ [muc]: { ...dc[muc], tin: p } } as Partial<DieuChinh>)}
              />
              <BangDayTin
                ten={muc === "ban" ? "Đẩy tin Bán" : "Đẩy tin Cho thuê"}
                bang={nhap[muc]}
                pt={dc[muc].day}
                onChange={(b) => sua({ ...nhap, [muc]: b })}
                onPt={(p) => suaDc({ [muc]: { ...dc[muc], day: p } } as Partial<DieuChinh>)}
              />
              <CanhBao ds={canhBaoGia} />
            </>
          )}

          {muc === "hoi-vien" && (
            <>
              <BangHoiVien ds={nhap.hoiVien ?? []} pt={dc.hoiVien} onPt={(p) => suaDc({ hoiVien: p })} onChange={(ds) => sua({ ...nhap, hoiVien: ds })} />
              <XemTruocHoiVien congBo={hoiVienXemTruoc} />
              <CanhBao ds={canhBaoHv} />
            </>
          )}

          {muc === "du-an" && (
            <BangDuAn ds={nhap.duAn ?? []} pt={dc.duAn} onPt={(p) => suaDc({ duAn: p })} onChange={(ds) => sua({ ...nhap, duAn: ds })} />
          )}
          {muc === "pr" && (
            <BangPr ds={nhap.pr ?? []} notes={nhap.prNotes ?? []} pt={dc.pr} onPt={(p) => suaDc({ pr: p })}
              onChange={(ds) => sua({ ...nhap, pr: ds })} onNotes={(n) => sua({ ...nhap, prNotes: n })} />
          )}
          {muc === "banner" && (
            <BangBannerGia ds={nhap.banners ?? []} pt={dc.banner} onPt={(p) => suaDc({ banner: p })} onChange={(ds) => sua({ ...nhap, banners: ds })} />
          )}
        </>
      )}

      {tab === "khuyen-mai" && (
        <>
          <DanhSachChuongTrinh ds={nhap.chuongTrinh} onChange={(ds) => sua({ ...nhap, chuongTrinh: ds })} onDuyet={duyetCT} homNay={homNay} />
        </>
      )}

      {tab === "quyen-loi" && nhap.quyDinh && <QuyDinhGiaEditor value={nhap.quyDinh} onChange={(q) => sua({ ...nhap, quyDinh: q })} />}
      {tab === "quy-dinh" && nhap.quyDinhTin && <QuyDinhTin q={nhap.quyDinhTin} onChange={(q) => sua({ ...nhap, quyDinhTin: q })} />}
    </div>
  );
}

function CanhBao({ ds }: { ds: string[] }) {
  if (!ds.length) return null;
  return (
    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      <ul className="list-disc pl-5">{ds.map((x) => <li key={x}>{x}</li>)}</ul>
    </div>
  );
}

// ── Đăng tin: mỗi hạng = một cột của bảng giá khách xem; % áp cho cả cột ─────
function BangGoiTin({ ten, bang, pt, onChange, onPt }: {
  ten: string; bang: BangChuan; pt: PhanTramCot;
  onChange: (b: BangChuan) => void; onPt: (p: PhanTramCot) => void;
}) {
  const planCua = (t: TierId) => bang.plans.find((p) => p.tierId === t) ?? { tierId: t, terms: [] };
  const datTerms = (t: TierId, terms: { days: number; price: number }[]) =>
    onChange({ ...bang, plans: [...bang.plans.filter((p) => p.tierId !== t), { tierId: t, terms }] });
  return (
    <Panel title={ten}>
      <div className="grid gap-3 lg:grid-cols-2">
        {THU_TU_CAP.map((t) => {
          const p = planCua(t);
          return (
            <div key={t} className="rounded-xl border border-cvr-line p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-semibold text-cvr-ink">{tenCap(t)} <span className="text-xs font-normal text-cvr-muted">X{getTier(t).heSo}</span></p>
                <OPhanTram value={pt[t]} onChange={(n) => onPt({ ...pt, [t]: n })} />
              </div>
              <div className="space-y-2">
                {[...p.terms].map((term, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <label className="w-16 text-xs text-cvr-muted">Ngày
                      <OSo value={term.days} onChange={(n) => datTerms(t, p.terms.map((x, j) => (j === i ? { ...x, days: n } : x)))} />
                    </label>
                    <label className="flex-1 text-xs text-cvr-muted">Giá chuẩn
                      <OSo value={term.price} onChange={(n) => datTerms(t, p.terms.map((x, j) => (j === i ? { ...x, price: n } : x)))} />
                      <GiaCongBo pt={pt[t]} gia={tronNghin(apDung(term.price, pt[t]))} />
                    </label>
                    <button type="button" aria-label="Xoá thời hạn" onClick={() => datTerms(t, p.terms.filter((_, j) => j !== i))}
                      className="mt-5 px-1 text-cvr-muted hover:text-red-600">×</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => datTerms(t, [...p.terms, { days: 0, price: 0 }])}
                className="mt-2 text-xs font-semibold text-cvr-blue">+ Thời hạn</button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ── Đẩy tin: giá MỖI LƯỢT theo bậc số lượt; % áp cho cả cột hạng ────────────
function BangDayTin({ ten, bang, pt, onChange, onPt }: {
  ten: string; bang: BangChuan; pt: PhanTramCot;
  onChange: (b: BangChuan) => void; onPt: (p: PhanTramCot) => void;
}) {
  const MAC_DINH = [{ tu: 1, gia: 0 }, { tu: 3, gia: 0 }, { tu: 6, gia: 0 }];
  const bacCua = (t: TierId) => { const b = bang.day.find((d) => d.tierId === t)?.bac; return b?.length ? b : MAC_DINH; };
  const datBac = (t: TierId, bac: { tu: number; gia: number }[]) =>
    onChange({ ...bang, day: [...bang.day.filter((d) => d.tierId !== t), { tierId: t, bac }] });
  return (
    <Panel title={ten}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
              <th className="py-2">Hạng</th>
              <th className="py-2">% điều chỉnh</th>
              {MAC_DINH.map((b, i) => <th key={i} className="py-2">Mua từ {b.tu} lượt · giá/lượt</th>)}
            </tr>
          </thead>
          <tbody>
            {THU_TU_CAP.map((t) => {
              const bac = bacCua(t);
              return (
                <tr key={t} className="border-b border-cvr-line/60 align-top">
                  <td className="py-2 pr-3 font-semibold text-cvr-ink">{tenCap(t)}</td>
                  <td className="py-2 pr-3"><OPhanTram value={pt[t]} onChange={(n) => onPt({ ...pt, [t]: n })} /></td>
                  {bac.map((b, i) => (
                    <td key={i} className="py-2 pr-3">
                      <OSo value={b.gia} onChange={(n) => datBac(t, bac.map((x, j) => (j === i ? { ...x, gia: n } : x)))} />
                      <GiaCongBo pt={pt[t]} gia={tronTram(apDung(b.gia, pt[t]))} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ── Chương trình khuyến mãi (có thời hạn, áp SAU % điều chỉnh) ──────────────
function DanhSachChuongTrinh({ ds, onChange, onDuyet, homNay }: { ds: ChuongTrinh[]; onChange: (ds: ChuongTrinh[]) => void; onDuyet: (c: ChuongTrinh) => void; homNay: string }) {
  const sua = (id: string, p: Partial<ChuongTrinh>) => onChange(ds.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const them = () => onChange([...ds, {
    id: `ct-${Date.now()}`, ten: "", phanTram: 0, tu: homNay, den: "", mucDich: "all", sanPham: "all", tiers: [], bat: true,
  }]);
  return (
    <Panel title="Chương trình khuyến mãi">
      <div className="space-y-3">
        {ds.map((c) => (
          <div key={c.id}
            className={`grid gap-2 rounded-xl border p-3 sm:grid-cols-6 ${c.daDuyet ? "border-cvr-line bg-cvr-surface/60" : "border-cvr-line"}`}>
          <fieldset disabled={!!c.daDuyet} className="contents">
            <label className="text-xs text-cvr-muted sm:col-span-2">Tên chương trình
              <input value={c.ten} onChange={(e) => sua(c.id, { ten: e.target.value })} className={inputCls} />
            </label>
            {laMienPhiTvMoi(c) ? (
              <label className="text-xs text-cvr-muted">Số ngày ưu đãi từ khi đăng ký
                <OSoBatBuoc value={c.soNgayTuDangKy} onChange={(n) => sua(c.id, { soNgayTuDangKy: n })} />
              </label>
            ) : (
              <label className="text-xs text-cvr-muted">% giảm
                <input inputMode="numeric" value={c.phanTram || ""} onChange={(e) => sua(c.id, { phanTram: Math.min(100, Number(e.target.value.replace(/\D/g, "")) || 0) })} className={inputCls} />
              </label>
            )}
            <label className="text-xs text-cvr-muted">Từ ngày
              <input type="date" value={c.tu} onChange={(e) => sua(c.id, { tu: e.target.value })} className={inputCls} />
            </label>
            <label className="text-xs text-cvr-muted">Đến hết ngày
              <input type="date" value={c.den} onChange={(e) => sua(c.id, { den: e.target.value })} className={inputCls} />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-cvr-ink">
              <input type="checkbox" checked={c.bat} onChange={(e) => sua(c.id, { bat: e.target.checked })} /> Bật
            </label>
            {laMienPhiTvMoi(c) ? (
              <>
                <label className="text-xs text-cvr-muted">Gói tin
                  <select value={c.tiers.length === 1 ? c.tiers[0] : ""} onChange={(e) => sua(c.id, { tiers: e.target.value ? [e.target.value as TierId] : [] })} className={inputCls}>
                    <option value="">—</option>
                    {THU_TU_CAP.map((t) => <option key={t} value={t}>{tenCap(t)}</option>)}
                  </select>
                </label>
                <div className="text-xs text-cvr-muted">Số tin
                  {c.soTin !== 0 && <OSoBatBuoc value={c.soTin} onChange={(n) => sua(c.id, { soTin: n || undefined })} />}
                  <label className="mt-1 flex items-center gap-1 text-cvr-ink">
                    <input type="checkbox" checked={c.soTin === 0} onChange={(e) => sua(c.id, { soTin: e.target.checked ? 0 : undefined })} /> Không giới hạn
                  </label>
                </div>
                <label className="text-xs text-cvr-muted">Số ngày hiển thị mỗi tin
                  <OSoBatBuoc value={c.soNgayHienThi} onChange={(n) => sua(c.id, { soNgayHienThi: n })} />
                </label>
                <label className="text-xs text-cvr-muted">Số ảnh
                  <OSoBatBuoc value={c.soAnh} onChange={(n) => sua(c.id, { soAnh: n })} />
                </label>
                <label className="text-xs text-cvr-muted">Số video
                  <OSoBatBuoc value={c.soVideo} onChange={(n) => sua(c.id, { soVideo: n })} />
                </label>
                <p className="self-end pb-2 text-sm font-medium text-cvr-ink">Thành viên mới</p>
              </>
            ) : (
              <>
                <label className="text-xs text-cvr-muted sm:col-span-2">Mục đích
                  <select value={c.mucDich} onChange={(e) => sua(c.id, { mucDich: e.target.value as ChuongTrinh["mucDich"] })} className={inputCls}>
                    <option value="all">Bán và Cho thuê</option><option value="ban">Bán</option><option value="thue">Cho thuê</option>
                  </select>
                </label>
                <label className="text-xs text-cvr-muted sm:col-span-2">Sản phẩm
                  <select value={c.sanPham} onChange={(e) => sua(c.id, { sanPham: e.target.value as ChuongTrinh["sanPham"] })} className={inputCls}>
                    <option value="all">Tất cả</option><option value="tin">Đăng tin</option><option value="day">Đẩy tin</option><option value="hoi-vien">Hội viên</option>
                  </select>
                </label>
              </>
            )}
            {!laMienPhiTvMoi(c) && <div className="text-xs text-cvr-muted sm:col-span-2">Hạng tin
              <div className="mt-1 flex flex-wrap gap-2">
                {THU_TU_CAP.map((t) => (
                  <label key={t} className="flex items-center gap-1 text-sm text-cvr-ink">
                    <input type="checkbox" checked={c.tiers.includes(t)}
                      onChange={(e) => sua(c.id, { tiers: e.target.checked ? [...c.tiers, t] : c.tiers.filter((x) => x !== t) })} />
                    {tenCap(t)}
                  </label>
                ))}
              </div>
            </div>}
          </fieldset>
            <div className="flex items-center justify-end gap-4 sm:col-span-6">
              {c.daCongBo ? (
                <span className="mr-auto text-xs text-cvr-muted">Đã duyệt {new Date(c.daCongBo).toLocaleString("vi-VN")}</span>
              ) : (
                <>
                  {thieuThongTin(c).length > 0 && <span className="mr-auto text-xs text-amber-700">Thiếu: {thieuThongTin(c).join(" · ")}</span>}
                  <button type="button" onClick={() => onChange(ds.filter((x) => x.id !== c.id))} className="text-xs text-cvr-muted hover:text-red-600">Xoá</button>
                  <button type="button" onClick={() => onDuyet(c)} disabled={thieuThongTin(c).length > 0}
                    className="rounded-lg bg-cvr-ink px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Duyệt</button>
                </>
              )}
            </div>
          </div>
        ))}
        {/* Nút "Tạo mới" nằm NGOÀI fieldset khoá để bấm được */}
        {ds.some((c) => c.daCongBo) && (
          <div className="flex flex-wrap gap-2">
            {ds.filter((c) => c.daCongBo).map((c) => (
              <button key={c.id} type="button"
                onClick={() => {
                  const { daCongBo: _bo, daDuyet: _dd, ...ban } = c;
                  void _bo; void _dd;
                  // Nối tiếp: cùng điều kiện, bắt đầu ngay sau ngày kết thúc của chương trình đang chạy
                  const tu = c.den ? new Date(Date.parse(c.den) + 86400000).toISOString().slice(0, 10) : homNay;
                  onChange([...ds, { ...ban, id: `ct-${Date.now()}`, tu, den: "" }]);
                }}
                className="rounded-lg border border-cvr-line px-3 py-1.5 text-xs font-semibold text-cvr-ink hover:border-cvr-ink">
                Nối tiếp “{c.ten}”
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={them} className="rounded-lg border border-dashed border-cvr-line px-4 py-2 text-sm font-semibold text-cvr-ink hover:border-cvr-ink">
          + Chương trình
        </button>
      </div>
    </Panel>
  );
}

// ── Gói hội viên: giá chuẩn theo tháng; % điều chỉnh theo cột số tháng ──────
const LOAI_VOUCHER: LoaiVoucher[] = ["tin-thuong", "tin-vip", "day-thuong"];

function BangHoiVien({ ds, pt, onPt, onChange }: {
  ds: GoiHoiVienChuan[]; pt: Partial<Record<string, number>>; onPt: (p: Partial<Record<string, number>>) => void; onChange: (ds: GoiHoiVienChuan[]) => void;
}) {
  const suaGoi = (i: number, g: Partial<GoiHoiVienChuan>) => onChange(ds.map((x, j) => (j === i ? { ...x, ...g } : x)));
  const them = () => onChange([...ds, { id: `goi-${Date.now().toString(36)}`, ten: "", thoiHan: [{ thang: 1, price: 0 }], voucher: [], quyenLoi: [] }]);
  const cacThang = [...new Set(ds.flatMap((g) => g.thoiHan.map((t) => t.thang)).filter((n) => n > 0))].sort((a, b) => a - b);
  return (
    <Panel title="Gói hội viên">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        {cacThang.map((th) => (
          <label key={th} className="text-xs text-cvr-muted">% cột {th} tháng
            <OPhanTram value={pt[String(th)]} onChange={(n) => onPt({ ...pt, [String(th)]: n })} />
          </label>
        ))}
      </div>
      <div className="space-y-4">
        {ds.map((g, i) => (
          <div key={g.id} className="rounded-xl border border-cvr-line p-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[200px] flex-1 text-xs text-cvr-muted">Tên gói
                <input value={g.ten} onChange={(e) => suaGoi(i, { ten: e.target.value })} className={inputCls} />
              </label>
              <p className="pb-2 text-xs text-cvr-muted">Voucher/tháng: <b className="text-cvr-ink">{dong(giaTriVoucherThang(g))}</b></p>
              <button type="button" onClick={() => onChange(ds.filter((_, j) => j !== i))} className="pb-2 text-xs text-cvr-muted hover:text-red-600">Xoá gói</button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {g.thoiHan.map((t, k) => (
                <div key={k} className="flex items-start gap-2">
                  <label className="w-16 text-xs text-cvr-muted">Tháng
                    <OSo value={t.thang} onChange={(n) => suaGoi(i, { thoiHan: g.thoiHan.map((x, j) => (j === k ? { ...x, thang: n } : x)) })} />
                  </label>
                  <label className="flex-1 text-xs text-cvr-muted">Giá chuẩn
                    <OSo value={t.price} onChange={(n) => suaGoi(i, { thoiHan: g.thoiHan.map((x, j) => (j === k ? { ...x, price: n } : x)) })} />
                    <GiaCongBo pt={pt[String(t.thang)]} gia={tronNghin(apDung(t.price, pt[String(t.thang)]))} />
                  </label>
                  <button type="button" aria-label="Xoá thời hạn" onClick={() => suaGoi(i, { thoiHan: g.thoiHan.filter((_, j) => j !== k) })} className="mt-5 px-1 text-cvr-muted hover:text-red-600">×</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => suaGoi(i, { thoiHan: [...g.thoiHan, { thang: 0, price: 0 }] })} className="mt-1 text-xs font-semibold text-cvr-blue">+ Thời hạn</button>

            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Voucher mỗi 30 ngày</p>
            <div className="mt-1 space-y-2">
              {g.voucher.map((v, k) => (
                <div key={k} className="flex flex-wrap items-end gap-2">
                  <label className="w-52 text-xs text-cvr-muted">Áp cho
                    <select value={v.loai} onChange={(e) => suaGoi(i, { voucher: g.voucher.map((x, j) => (j === k ? { ...x, loai: e.target.value as LoaiVoucher } : x)) })} className={inputCls}>
                      {LOAI_VOUCHER.map((l) => <option key={l} value={l}>{TEN_VOUCHER[l]}</option>)}
                    </select>
                  </label>
                  <label className="w-36 text-xs text-cvr-muted">Giảm mỗi lần
                    <OSo value={v.giam} onChange={(n) => suaGoi(i, { voucher: g.voucher.map((x, j) => (j === k ? { ...x, giam: n } : x)) })} />
                  </label>
                  <label className="w-24 text-xs text-cvr-muted">Số lượng
                    <OSo value={v.soLuong} onChange={(n) => suaGoi(i, { voucher: g.voucher.map((x, j) => (j === k ? { ...x, soLuong: n } : x)) })} />
                  </label>
                  <button type="button" aria-label="Xoá voucher" onClick={() => suaGoi(i, { voucher: g.voucher.filter((_, j) => j !== k) })} className="mb-2 text-cvr-muted hover:text-red-600">×</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => suaGoi(i, { voucher: [...g.voucher, { loai: "tin-thuong", giam: 0, soLuong: 0 }] })} className="mt-1 text-xs font-semibold text-cvr-blue">+ Voucher</button>

            <label className="mt-3 block text-xs text-cvr-muted">Quyền lợi khác (mỗi dòng một ý)
              <textarea rows={2} value={g.quyenLoi.join("\n")}
                onChange={(e) => suaGoi(i, { quyenLoi: e.target.value.split("\n") })}
                onBlur={() => suaGoi(i, { quyenLoi: g.quyenLoi.map((x) => x.trim()).filter(Boolean) })}
                className="mt-1 w-full rounded-lg border border-cvr-line px-2.5 py-2 text-sm text-cvr-ink outline-none focus:border-cvr-ink" />
            </label>
          </div>
        ))}
        <button type="button" onClick={them} className="rounded-lg border border-dashed border-cvr-line px-4 py-2 text-sm font-semibold text-cvr-ink hover:border-cvr-ink">+ Gói</button>
      </div>
    </Panel>
  );
}

function XemTruocHoiVien({ congBo }: { congBo: { id: string; ten: string; thoiHan: { thang: number; price: number; giaGoc?: number }[]; voucher: { giam: number; soLuong: number }[] }[] }) {
  if (!congBo.length) return null;
  return (
    <Panel title="Hội viên — khách trả (gồm VAT)">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
              <th className="py-2">Gói</th><th className="py-2">Thời hạn</th><th className="py-2 text-right">Khách trả</th>
              <th className="py-2 text-right">Mỗi tháng</th><th className="py-2 text-right">Voucher − giá/tháng</th>
            </tr>
          </thead>
          <tbody>
            {congBo.flatMap((g) => g.thoiHan.map((t, k) => {
              const thang = t.price / t.thang;
              const gt = giaTriVoucherThang(g);
              return (
                <tr key={`${g.id}-${t.thang}`} className="border-b border-cvr-line/60">
                  <td className="py-2 font-semibold text-cvr-ink">{k === 0 ? g.ten : ""}</td>
                  <td className="py-2">{t.thang} tháng</td>
                  <td className="py-2 text-right tabular-nums font-semibold text-cvr-ink">{tra(t.price)}</td>
                  <td className="py-2 text-right tabular-nums">{dong(thang)}</td>
                  <td className={`py-2 text-right tabular-nums ${gt - thang > 0 ? "text-green-700" : "text-red-600"}`}>{dong(gt - thang)}</td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ── Dự án (CVR-PJ): mỗi hạng một cột; % áp cho cả cột ───────────────────────
function BangDuAn({ ds, pt, onPt, onChange }: { ds: Plan[]; pt: PhanTramCot; onPt: (p: PhanTramCot) => void; onChange: (ds: Plan[]) => void }) {
  const suaGia = (tierId: TierId, iTerm: number, price: number) =>
    onChange(ds.map((p) => (p.tierId === tierId ? { ...p, terms: p.terms.map((t, j) => (j === iTerm ? { ...t, price } : t)) } : p)));
  return (
    <Panel title="Gói dự án">
      <div className="grid gap-3 lg:grid-cols-2">
        {ds.map((p) => (
          <div key={p.tierId} className="rounded-xl border border-cvr-line p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-semibold text-cvr-ink">{p.name}</p>
              <OPhanTram value={pt[p.tierId]} onChange={(n) => onPt({ ...pt, [p.tierId]: n })} />
            </div>
            <div className="space-y-2">
              {p.terms.map((t, i) => (
                <label key={i} className="block text-xs text-cvr-muted">{t.days} ngày — giá chuẩn
                  <OSo value={t.price} onChange={(n) => suaGia(p.tierId, i, n)} />
                  <GiaCongBo pt={pt[p.tierId]} gia={tronNghin(apDung(t.price, pt[p.tierId]))} />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Bài PR: mỗi gói theo hạng; % theo hạng ──────────────────────────────────
function BangPr({ ds, notes, pt, onPt, onChange, onNotes }: {
  ds: PrPkg[]; notes: string[]; pt: PhanTramCot; onPt: (p: PhanTramCot) => void;
  onChange: (ds: PrPkg[]) => void; onNotes: (n: string[]) => void;
}) {
  const sua = (i: number, patch: Partial<PrPkg>) => onChange(ds.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <Panel title="Bài PR">
      <div className="space-y-3">
        {ds.map((p, i) => (
          <div key={i} className="grid gap-3 rounded-xl border border-cvr-line p-3 sm:grid-cols-4">
            <label className="text-xs text-cvr-muted">Tên gói
              <input value={p.name} onChange={(e) => sua(i, { name: e.target.value })} className={inputCls} />
            </label>
            <label className="text-xs text-cvr-muted">Hạng
              <select value={p.tierId} onChange={(e) => sua(i, { tierId: e.target.value as TierId })} className={inputCls}>
                {THU_TU_CAP.map((t) => <option key={t} value={t}>{tenCap(t)}</option>)}
              </select>
            </label>
            <label className="text-xs text-cvr-muted">Giá chuẩn / bài
              <OSo value={p.gia} onChange={(n) => sua(i, { gia: n })} />
              <GiaCongBo pt={pt[p.tierId]} gia={tronNghin(apDung(p.gia, pt[p.tierId]))} />
            </label>
            <label className="text-xs text-cvr-muted">% hạng {tenCap(p.tierId)}
              <OPhanTram value={pt[p.tierId]} onChange={(n) => onPt({ ...pt, [p.tierId]: n })} />
            </label>
            <label className="text-xs text-cvr-muted sm:col-span-4">Hiện ở đâu (mỗi dòng một chỗ)
              <textarea rows={2} value={p.displays.join("\n")}
                onChange={(e) => sua(i, { displays: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
                className="mt-1 w-full rounded-lg border border-cvr-line px-2.5 py-2 text-sm text-cvr-ink outline-none focus:border-cvr-ink" />
            </label>
            <div className="flex justify-end sm:col-span-4">
              <button type="button" onClick={() => onChange(ds.filter((_, j) => j !== i))} className="text-xs text-cvr-muted hover:text-red-600">Xoá</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...ds, { tierId: "silver", name: "", gia: 0, displays: [] }])}
          className="rounded-lg border border-dashed border-cvr-line px-4 py-2 text-sm font-semibold text-cvr-ink hover:border-cvr-ink">+ Gói PR</button>
        <label className="block text-xs text-cvr-muted">Điều kiện kèm bảng PR (mỗi dòng một ý)
          <textarea rows={3} value={notes.join("\n")} onChange={(e) => onNotes(e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))}
            className="mt-1 w-full rounded-lg border border-cvr-line px-2.5 py-2 text-sm text-cvr-ink outline-none focus:border-cvr-ink" />
        </label>
      </div>
    </Panel>
  );
}

// ── Banner: mỗi bảng một % ──────────────────────────────────────────────────
function BangBannerGia({ ds, pt, onPt, onChange }: {
  ds: BannerTable[]; pt: Partial<Record<string, number>>; onPt: (p: Partial<Record<string, number>>) => void; onChange: (ds: BannerTable[]) => void;
}) {
  const suaBang = (i: number, patch: Partial<BannerTable>) => onChange(ds.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const suaDong = (iB: number, iD: number, patch: Partial<BannerTable["rows"][number]>) =>
    suaBang(iB, { rows: ds[iB].rows.map((r, j) => (j === iD ? { ...r, ...patch } : r)) });
  return (
    <div className="space-y-4">
      {ds.map((tbl, iB) => (
        <Panel key={iB} title={tbl.title}>
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <label className="min-w-[220px] flex-1 text-xs text-cvr-muted">Tên bảng
              <input value={tbl.title} onChange={(e) => suaBang(iB, { title: e.target.value })} className={inputCls} />
            </label>
            <label className="text-xs text-cvr-muted">% điều chỉnh
              <OPhanTram value={pt[tbl.title]} onChange={(n) => onPt({ ...pt, [tbl.title]: n })} />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
                  <th className="py-2">Gói</th><th className="py-2">{tbl.sizeLabel}</th><th className="py-2">Giá chuẩn / tuần</th><th className="py-2">Vị trí</th><th className="py-2">Ghi chú</th><th />
                </tr>
              </thead>
              <tbody>
                {tbl.rows.map((r, iD) => (
                  <tr key={iD} className="border-b border-cvr-line/60 align-top">
                    <td className="py-2 pr-2"><input value={r.name} onChange={(e) => suaDong(iB, iD, { name: e.target.value })} className={inputCls} /></td>
                    <td className="py-2 pr-2"><input value={r.size} onChange={(e) => suaDong(iB, iD, { size: e.target.value })} className={inputCls} /></td>
                    <td className="py-2 pr-2"><OSo value={r.gia} onChange={(n) => suaDong(iB, iD, { gia: n })} /><GiaCongBo pt={pt[tbl.title]} gia={tronNghin(apDung(r.gia, pt[tbl.title]))} /></td>
                    <td className="py-2 pr-2"><input value={r.pos} onChange={(e) => suaDong(iB, iD, { pos: e.target.value })} className={inputCls} /></td>
                    <td className="py-2 pr-2"><input value={r.note} onChange={(e) => suaDong(iB, iD, { note: e.target.value })} className={inputCls} /></td>
                    <td className="py-2"><button type="button" onClick={() => suaBang(iB, { rows: tbl.rows.filter((_, j) => j !== iD) })} className="px-1 text-cvr-muted hover:text-red-600">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => suaBang(iB, { rows: [...tbl.rows, { name: "", size: "", gia: 0, pos: "", note: "" }] })}
            className="mt-2 text-xs font-semibold text-cvr-blue">+ Vị trí</button>
        </Panel>
      ))}
    </div>
  );
}

// ── Quy định tin: số ảnh/video, cỡ gói đẩy — cũng trong bản nháp, lên web khi Công bố ──
function QuyDinhTin({ q, onChange }: { q: QuyDinhTinT; onChange: (q: QuyDinhTinT) => void }) {
  const [coGoi, setCoGoi] = useState(q.coGoiDay.join(", "));
  return (
    <>
      <Panel title="Ảnh & video mỗi tin">
        <label className="flex items-center gap-3 text-sm text-cvr-ink">
          <input type="checkbox" checked={q.mediaTheoCap} onChange={(e) => onChange({ ...q, mediaTheoCap: e.target.checked })} className="h-4 w-4 accent-cvr-ink" />
          Theo hạng tin
        </label>
        {!q.mediaTheoCap ? (
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="w-32 text-xs text-cvr-muted">Ảnh / tin
              <OSo value={q.anhChung} onChange={(n) => onChange({ ...q, anhChung: Math.max(1, n) })} />
            </label>
            <label className="w-32 text-xs text-cvr-muted">Video / tin
              <OSo value={q.videoChung} onChange={(n) => onChange({ ...q, videoChung: n })} />
            </label>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {THU_TU_CAP.map((t) => (
              <div key={t} className="rounded-lg border border-cvr-line p-2">
                <p className="text-sm font-semibold text-cvr-ink">{tenCap(t)}</p>
                <label className="mt-1 block text-xs text-cvr-muted">Ảnh<OSo value={q.anhTheoCap[t] ?? 0} onChange={(n) => onChange({ ...q, anhTheoCap: { ...q.anhTheoCap, [t]: n } })} /></label>
                <label className="mt-1 block text-xs text-cvr-muted">Video<OSo value={q.videoTheoCap[t] ?? 0} onChange={(n) => onChange({ ...q, videoTheoCap: { ...q.videoTheoCap, [t]: n } })} /></label>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Gói đẩy tin nhiều lượt">
        <label className="block max-w-md text-xs text-cvr-muted">Số lượt mỗi gói (cách nhau dấu phẩy)
          <input
            value={coGoi}
            onChange={(e) => {
              setCoGoi(e.target.value);
              const ds = [...new Set(e.target.value.split(/[,s]+/).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 60))].sort((a, b) => a - b);
              if (ds.length) onChange({ ...q, coGoiDay: ds });
            }}
            className={inputCls}
          />
        </label>
      </Panel>
    </>
  );
}
