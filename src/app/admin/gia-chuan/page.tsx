"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/Ui";
import QuyDinhGiaEditor from "@/components/admin/QuyDinhGiaEditor";
import { getTier, type TierId } from "@/lib/packages";
import { tachThue } from "@/lib/thue";
import { TEN_VOUCHER, type CongBo, type LoaiVoucher, type Plan, type UpRow } from "@/lib/billing";
import {
  NHAP_TRONG,
  THU_TU_CAP,
  bangX,
  canhBaoHoiVien,
  canhBaoLogic,
  giaTriVoucherThang,
  hanChuongTrinhGanNhat,
  tinhCongBo,
  tinhHoiVien,
  type BangChuan,
  type ChuongTrinh,
  type GiaChuanNhap,
  type GoiHoiVienChuan,
} from "@/lib/giaChuan";

// ============================================================================
// ADMIN — GIÁ CHUẨN · CHƯƠNG TRÌNH · CÔNG BỐ  (chủ dự án chốt 24/09/2026)
//   1. Giá chuẩn (nguồn Batdongsan) — KHÔNG công bố, khách không đọc được.
//   2. Chương trình: mỗi giai đoạn giảm bao nhiêu % từ giá chuẩn.
//   3. Xem trước giá khách thấy + kiểm tra logic theo hệ số X.
//   4. Bấm "Công bố" → web mới đổi giá. Lưu nháp thì khách không thấy gì.
// Mọi ô giá nhập CHƯA GTGT; dòng nhỏ bên dưới là số khách trả (đã gồm GTGT).
// ============================================================================

const inputCls = "h-9 w-full rounded-lg border border-cvr-line px-2.5 text-sm text-cvr-ink outline-none focus:border-cvr-ink";
const dong = (n: number) => Math.round(n).toLocaleString("vi-VN") + "đ";
const tra = (n: number) => dong(tachThue(n).tongTra);
const tenCap = (t: TierId) => getTier(t).name;
const homNayVN = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

// Ô số tiền: gõ chữ số, tự thêm dấu chấm. KHÔNG dùng type="number" (quy tắc admin).
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

type MucDich = "ban" | "thue" | "hoi-vien" | "quy-dinh";

export default function GiaChuanPage() {
  const [nhap, setNhap] = useState<GiaChuanNhap>(NHAP_TRONG);
  const [congBo, setCongBo] = useState<CongBo | null>(null);
  const [plansHienTai, setPlansHienTai] = useState<Plan[]>([]);
  const [upHienTai, setUpHienTai] = useState<UpRow[]>([]);
  const [md, setMd] = useState<MucDich>("ban");
  const [loading, setLoading] = useState(true);
  const [dangLam, setDangLam] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [hoiCongBo, setHoiCongBo] = useState(false);
  const [daSua, setDaSua] = useState(false);
  const [hoiVienLuc, setHoiVienLuc] = useState<string | null>(null);

  async function tai() {
    const res = await fetch("/api/admin/gia-chuan", { cache: "no-store" });
    const kq = await res.json().catch(() => ({}));
    if (!res.ok || !kq.ok) {
      setMsg({ ok: false, text: kq.message || "Không tải được giá chuẩn." });
    } else {
      setNhap(kq.nhap);
      setCongBo(kq.congBo);
      setHoiVienLuc(kq.hoiVienLuc ?? null);
      setPlansHienTai(kq.plansHienTai ?? []);
      setUpHienTai(kq.upHienTai ?? []);
      setDaSua(false);
    }
    setLoading(false);
  }
  useEffect(() => { void tai(); }, []);

  const sua = (next: GiaChuanNhap) => { setNhap(next); setDaSua(true); setMsg(null); };
  const mdGia = md === "thue" ? "thue" : "ban"; // tab Gói hội viên không có bảng tin riêng
  const bang = nhap[mdGia];
  const suaBang = (b: BangChuan) => sua({ ...nhap, [mdGia]: b });

  // Xem trước — cùng hàm máy chủ dùng khi bấm Công bố.
  const homNay = homNayVN();
  const xemTruoc = useMemo(
    () => tinhCongBo(nhap, homNay, plansHienTai, upHienTai),
    [nhap, homNay, plansHienTai, upHienTai],
  );
  const heSo = (t: TierId) => getTier(t).heSo;
  const canhBaoChuan = useMemo(() => canhBaoLogic(nhap.ban, nhap.thue, tenCap), [nhap]);
  const canhBaoCongBo = useMemo(() => canhBaoLogic(xemTruoc.ban, xemTruoc.thue, tenCap), [xemTruoc]);
  const hanGan = hanChuongTrinhGanNhat(nhap.chuongTrinh, homNay);

  // Giá CAO NHẤT (chưa VAT) của từng loại dịch vụ mà voucher áp vào — voucher lớn
  // hơn số này thì không bao giờ trừ hết. So với CẢ giá đang chạy trên web lẫn giá
  // sẽ có khi bấm Công bố giá tin: gói hội viên công bố riêng, có thể đi trước.
  const giaCao = (bangs: { plans: Plan[]; up: UpRow[] }[]) => {
    const cao = (ds: number[]) => { const d = ds.filter((n) => n > 0); return d.length ? Math.max(...d) : undefined; };
    const tin = (vip: boolean) => cao(bangs.flatMap((b) =>
      b.plans.filter((p) => (p.tierId === "basic") !== vip).flatMap((p) => p.terms.map((t) => t.price))));
    const iBasic = THU_TU_CAP.indexOf("basic");
    const day = cao(bangs.flatMap((b) => {
      const r = b.up[0]; // dòng đầu = đẩy lẻ 1 lượt
      return r ? [r.values[iBasic]?.gia ?? 0] : [];
    }));
    return { "tin-thuong": tin(false), "tin-vip": tin(true), "day-thuong": day } as Partial<Record<LoaiVoucher, number>>;
  };
  const hoiVienXemTruoc = useMemo(() => tinhHoiVien(nhap.hoiVien ?? [], nhap.chuongTrinh, homNay), [nhap.hoiVien, nhap.chuongTrinh, homNay]);
  const canhBaoHv = useMemo(() => {
    const dangChay = congBo ? [congBo.ban, congBo.thue] : [{ plans: plansHienTai, up: upHienTai }];
    const seCongBo = [xemTruoc.ban, xemTruoc.thue];
    return [...new Set([
      ...canhBaoHoiVien(hoiVienXemTruoc, giaCao(dangChay), "giá đang chạy trên web"),
      ...canhBaoHoiVien(hoiVienXemTruoc, giaCao(seCongBo), "giá sẽ công bố"),
    ])];
  }, [hoiVienXemTruoc, congBo, plansHienTai, upHienTai, xemTruoc]);

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
    setMsg({ ok: true, text: "Đã lưu nháp. Khách chưa thấy gì — bấm Công bố khi đã chốt." });
  }

  async function goi(hanhDong: "cong-bo" | "go-cong-bo" | "cong-bo-hoi-vien" | "go-hoi-vien") {
    setDangLam(hanhDong);
    const res = await fetch("/api/admin/gia-chuan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hanhDong }),
    });
    const kq = await res.json().catch(() => ({}));
    setDangLam("");
    setHoiCongBo(false);
    if (!res.ok || !kq.ok) return setMsg({ ok: false, text: kq.message || "Không thành công." });
    await tai();
    setMsg({
      ok: true,
      text: hanhDong === "cong-bo"
        ? "Đã công bố — khách thấy giá mới ngay."
        : hanhDong === "cong-bo-hoi-vien"
          ? "Đã công bố gói hội viên — khách xem và mua được ngay. Giá đăng tin không đổi."
          : hanhDong === "go-hoi-vien"
            ? "Đã gỡ gói hội viên khỏi web. Gói khách đã mua vẫn chạy đến hết hạn."
            : "Đã gỡ giá công bố — web quay về bảng giá ở trang Giá & khuyến mãi.",
    });
  }

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải giá chuẩn…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Giá & quy định</h1>
          <p className="mt-1 max-w-2xl text-sm text-cvr-muted">
            Giá chuẩn không công bố. Chương trình quyết định giảm bao nhiêu %. Khách chỉ thấy giá sau khi bấm Công bố.
          </p>
          <p className="mt-2 text-xs text-cvr-muted">
            Nháp lưu lúc: <b className="text-cvr-ink">{nhap.capNhat ? new Date(nhap.capNhat).toLocaleString("vi-VN") : "chưa lưu"}</b>
            {" · "}Công bố lần cuối: <b className="text-cvr-ink">{congBo ? new Date(congBo.luc).toLocaleString("vi-VN") : "chưa công bố (web đang dùng bảng giá cũ)"}</b>
            {congBo?.chuongTrinh && <> · Chương trình: <b className="text-cvr-ink">{congBo.chuongTrinh}</b></>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={luuNhap} disabled={!!dangLam}
            className="rounded-lg border border-cvr-ink px-4 py-2.5 text-sm font-semibold text-cvr-ink transition hover:bg-cvr-ink/5 disabled:opacity-60">
            {dangLam === "luu" ? "Đang lưu…" : daSua ? "Lưu nháp *" : "Lưu nháp"}
          </button>
          <button type="button" onClick={() => setHoiCongBo(true)} disabled={!!dangLam || daSua}
            title={daSua ? "Lưu nháp trước rồi mới công bố" : ""}
            className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50">
            Công bố
          </button>
        </div>
      </div>

      {msg && (
        <p className={`rounded-lg px-4 py-2.5 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>
      )}

      {hoiCongBo && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Công bố giá mới cho khách?</p>
          <p className="mt-1">
            Web sẽ đổi giá NGAY theo bảng “Giá khách thấy” bên dưới (cả Bán và Cho thuê). Gói hội viên có nút công bố riêng.
            Tin khách đã gửi trước lúc này vẫn chỉ bị trừ đúng số đã báo lúc gửi.
            {canhBaoCongBo.length > 0 && <b> Đang có {canhBaoCongBo.length} cảnh báo logic giá — xem lại trước khi công bố.</b>}
            {hanGan && <> Chương trình sớm hết hạn nhất: <b>{hanGan.split("-").reverse().join("/")}</b> — tới ngày đó phải công bố lại.</>}
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => goi("cong-bo")} disabled={!!dangLam}
              className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {dangLam === "cong-bo" ? "Đang công bố…" : "Đồng ý, công bố"}
            </button>
            <button type="button" onClick={() => setHoiCongBo(false)} className="rounded-lg px-4 py-2 text-sm text-cvr-ink">Huỷ</button>
          </div>
        </div>
      )}

      {/* Chọn mục đích — giá chuẩn gộp còn 2 bảng: Bán · Cho thuê */}
      <div className="flex gap-2">
        {(["ban", "thue", "hoi-vien", "quy-dinh"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMd(m)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${md === m ? "bg-cvr-ink text-white" : "bg-cvr-mist text-cvr-ink hover:bg-cvr-line"}`}>
            {m === "ban" ? "Bán" : m === "thue" ? "Cho thuê" : m === "hoi-vien" ? "Gói hội viên" : "Quy định & quyền lợi"}
          </button>
        ))}
      </div>

      {md === "quy-dinh" ? (
        <QuyDinhGiaEditor />
      ) : md === "hoi-vien" ? (
        <>
          <BangHoiVien ds={nhap.hoiVien ?? []} onChange={(ds) => sua({ ...nhap, hoiVien: ds })} />
          <DanhSachChuongTrinh ds={nhap.chuongTrinh} onChange={(ds) => sua({ ...nhap, chuongTrinh: ds })} homNay={homNay} />
          <XemTruocHoiVien chuan={nhap.hoiVien ?? []} congBo={hoiVienXemTruoc} canhBao={canhBaoHv} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cvr-line bg-white p-4">
            <p className="text-sm text-cvr-muted">
              Gói hội viên công bố <b className="text-cvr-ink">riêng</b> — không đụng giá đăng tin.
              {" "}Công bố lần cuối: <b className="text-cvr-ink">{hoiVienLuc ? new Date(hoiVienLuc).toLocaleString("vi-VN") : "chưa công bố (khách chưa thấy gói)"}</b>
            </p>
            <div className="flex gap-2">
              {hoiVienLuc && (
                <button type="button" onClick={() => goi("go-hoi-vien")} disabled={!!dangLam}
                  className="rounded-lg px-3 py-2 text-xs text-cvr-muted underline hover:text-red-600 disabled:opacity-60">Gỡ khỏi web</button>
              )}
              <button type="button" onClick={() => goi("cong-bo-hoi-vien")} disabled={!!dangLam || daSua || !hoiVienXemTruoc.length}
                title={daSua ? "Lưu nháp trước rồi mới công bố" : ""}
                className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50">
                {dangLam === "cong-bo-hoi-vien" ? "Đang công bố…" : "Công bố gói hội viên"}
              </button>
            </div>
          </div>
        </>
      ) : (
      <>
      <BangGoiTin bang={bang} onChange={suaBang} tenMucDich={md === "ban" ? "Bán" : "Cho thuê"} />
      <BangDayTin bang={bang} onChange={suaBang} tenMucDich={md === "ban" ? "Bán" : "Cho thuê"} />
      <DanhSachChuongTrinh ds={nhap.chuongTrinh} onChange={(ds) => sua({ ...nhap, chuongTrinh: ds })} homNay={homNay} />

      <Panel
        title={`Giá khách thấy — ${md === "ban" ? "Bán" : "Cho thuê"} (xem trước, đã gồm GTGT)`}
        desc="Tính đúng như máy chủ sẽ tính khi bấm Công bố, theo các chương trình đang chạy hôm nay."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
                <th className="py-2">Gói tin</th><th className="py-2">Thời hạn</th>
                <th className="py-2 text-right">Giá chuẩn</th><th className="py-2 text-right">Khách trả</th><th className="py-2 text-right">Giảm</th>
              </tr>
            </thead>
            <tbody>
              {xemTruoc[mdGia].plans.flatMap((p) => p.terms.map((t, i) => {
                const chuan = bang.plans.find((x) => x.tierId === p.tierId)?.terms.find((x) => x.days === t.days)?.price ?? 0;
                const pt = chuan ? Math.round((1 - t.price / chuan) * 100) : 0;
                return (
                  <tr key={`${p.tierId}-${t.days}`} className="border-b border-cvr-line/60">
                    <td className="py-2 font-semibold text-cvr-ink">{i === 0 ? tenCap(p.tierId) : ""}</td>
                    <td className="py-2">{t.days} ngày</td>
                    <td className="py-2 text-right tabular-nums text-cvr-muted line-through">{chuan ? tra(chuan) : "—"}</td>
                    <td className="py-2 text-right tabular-nums font-semibold text-cvr-ink">{tra(t.price)}</td>
                    <td className="py-2 text-right tabular-nums">{pt > 0 ? `−${pt}%` : "—"}</td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
        {xemTruoc[mdGia].up.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
                  <th className="py-2">Đẩy tin</th>
                  {THU_TU_CAP.map((t) => <th key={t} className="py-2 text-right">{tenCap(t)}</th>)}
                </tr>
              </thead>
              <tbody>
                {xemTruoc[mdGia].up.map((r) => (
                  <tr key={r.label} className="border-b border-cvr-line/60">
                    <td className="py-2">{r.label}</td>
                    {r.values.map((v, i) => <td key={i} className="py-2 text-right tabular-nums">{v.gia ? tra(v.gia) : "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Kiểm tra logic giá theo hệ số X"
        desc="Hệ số X là mức ưu tiên hiển thị (X30 · X15 · X8 · 1x). Hạng cao phải đắt hơn hạng thấp; mua dài không được thiệt hơn mua ngắn."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {(["ban", "thue"] as const).map((m) => (
            <div key={m}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cvr-muted">{m === "ban" ? "Bán" : "Cho thuê"} — giá công bố</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cvr-line text-left text-xs text-cvr-muted">
                    <th className="py-1.5">Hạng</th><th className="py-1.5 text-right">Hệ số</th>
                    <th className="py-1.5 text-right">Giá/ngày</th><th className="py-1.5 text-right">So tin thường</th><th className="py-1.5 text-right">Mỗi đơn vị X</th>
                  </tr>
                </thead>
                <tbody>
                  {bangX(xemTruoc[m].plans, heSo).map((d) => (
                    <tr key={d.tierId} className="border-b border-cvr-line/60">
                      <td className="py-1.5">{tenCap(d.tierId)}</td>
                      <td className="py-1.5 text-right">X{d.heSo}</td>
                      <td className="py-1.5 text-right tabular-nums">{dong(d.giaNgay)}</td>
                      <td className="py-1.5 text-right tabular-nums">{d.soVoiThuong ? `${d.soVoiThuong.toFixed(1)}×` : "—"}</td>
                      <td className="py-1.5 text-right tabular-nums">{d.moiDonViX ? `${d.moiDonViX.toFixed(2)}×` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-cvr-muted">
          “Mỗi đơn vị X” = (giá/ngày so với tin thường) ÷ hệ số X. Batdongsan hiện ở khoảng 2–3×: VIP đắt hơn tin thường tính trên mỗi đơn vị ưu tiên.
        </p>
        <CanhBao ten="Giá chuẩn" ds={canhBaoChuan} />
        <CanhBao ten="Giá công bố" ds={canhBaoCongBo} />
      </Panel>
      </>
      )}

      {congBo && (
        <div className="flex justify-end">
          <button type="button" onClick={() => goi("go-cong-bo")} disabled={!!dangLam}
            className="text-xs text-cvr-muted underline hover:text-red-600 disabled:opacity-60">
            {dangLam === "go-cong-bo" ? "Đang gỡ…" : "Gỡ giá công bố (web quay về bảng giá cũ)"}
          </button>
        </div>
      )}
    </div>
  );
}

function CanhBao({ ten, ds }: { ten: string; ds: string[] }) {
  if (!ds.length) return <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{ten}: đúng thứ tự hệ số X, không có điểm ngược.</p>;
  return (
    <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      <p className="font-semibold">{ten}: {ds.length} điểm cần xem lại</p>
      <ul className="mt-1 list-disc pl-5">{ds.map((x) => <li key={x}>{x}</li>)}</ul>
    </div>
  );
}

// ── Bảng giá chuẩn gói tin: mỗi hạng một bộ thời hạn riêng ──────────────────
function BangGoiTin({ bang, onChange, tenMucDich }: { bang: BangChuan; onChange: (b: BangChuan) => void; tenMucDich: string }) {
  const planCua = (t: TierId) => bang.plans.find((p) => p.tierId === t) ?? { tierId: t, terms: [] };
  const datTerms = (t: TierId, terms: { days: number; price: number }[]) =>
    onChange({ ...bang, plans: [...bang.plans.filter((p) => p.tierId !== t), { tierId: t, terms }] });
  return (
    <Panel title={`Giá chuẩn gói tin — ${tenMucDich}`} desc="Giá CHƯA GTGT. Mỗi hạng có thời hạn riêng như Batdongsan (VIP 7/10/15 ngày, tin thường dài hơn).">
      <div className="space-y-4">
        {THU_TU_CAP.map((t) => {
          const p = planCua(t);
          return (
            <div key={t} className="rounded-xl border border-cvr-line p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-cvr-ink">{tenCap(t)} <span className="text-xs font-normal text-cvr-muted">· X{getTier(t).heSo}</span></p>
                <button type="button" onClick={() => datTerms(t, [...p.terms, { days: 0, price: 0 }])}
                  className="text-xs font-semibold text-cvr-blue">+ Thêm thời hạn</button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {p.terms.map((term, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <label className="w-20 text-xs text-cvr-muted">
                      Số ngày
                      <OSo value={term.days} onChange={(n) => datTerms(t, p.terms.map((x, j) => (j === i ? { ...x, days: n } : x)))} />
                    </label>
                    <label className="flex-1 text-xs text-cvr-muted">
                      Giá chuẩn
                      <OSo value={term.price} onChange={(n) => datTerms(t, p.terms.map((x, j) => (j === i ? { ...x, price: n } : x)))} />
                      <span className="mt-0.5 block text-[11px] text-cvr-faint">{term.price ? `gồm GTGT: ${tra(term.price)}` : ""}</span>
                    </label>
                    <button type="button" aria-label="Xoá thời hạn" onClick={() => datTerms(t, p.terms.filter((_, j) => j !== i))}
                      className="mb-5 text-cvr-muted hover:text-red-600">×</button>
                  </div>
                ))}
                {!p.terms.length && <p className="text-xs text-cvr-muted">Chưa có thời hạn nào — hạng này sẽ không bán.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ── Bảng giá chuẩn đẩy tin: giá MỖI LƯỢT theo bậc số lượt ───────────────────
function BangDayTin({ bang, onChange, tenMucDich }: { bang: BangChuan; onChange: (b: BangChuan) => void; tenMucDich: string }) {
  const bacCua = (t: TierId) => bang.day.find((d) => d.tierId === t)?.bac ?? [];
  const datBac = (t: TierId, bac: { tu: number; gia: number }[]) =>
    onChange({ ...bang, day: [...bang.day.filter((d) => d.tierId !== t), { tierId: t, bac }] });
  const MAC_DINH = [{ tu: 1, gia: 0 }, { tu: 3, gia: 0 }, { tu: 6, gia: 0 }];
  return (
    <Panel title={`Giá chuẩn đẩy tin — ${tenMucDich}`} desc="Giá CHƯA GTGT cho MỖI LƯỢT, theo số lượt mua trong một lần (như Batdongsan: 1–2 · 3–5 · từ 6 lượt). Gói 3/7/13/27 lượt trên web tự tính theo bậc.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
              <th className="py-2">Hạng</th>
              {MAC_DINH.map((b, i) => <th key={i} className="py-2">Mua từ {b.tu} lượt</th>)}
            </tr>
          </thead>
          <tbody>
            {THU_TU_CAP.map((t) => {
              const bac = bacCua(t).length ? bacCua(t) : MAC_DINH;
              return (
                <tr key={t} className="border-b border-cvr-line/60">
                  <td className="py-2 pr-3 font-semibold text-cvr-ink">{tenCap(t)}</td>
                  {bac.map((b, i) => (
                    <td key={i} className="py-2 pr-3">
                      <OSo value={b.gia} onChange={(n) => datBac(t, bac.map((x, j) => (j === i ? { ...x, gia: n } : x)))} />
                      <span className="mt-0.5 block text-[11px] text-cvr-faint">{b.gia ? `gồm GTGT: ${tra(b.gia)}` : ""}</span>
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

// ── Chương trình giảm giá ────────────────────────────────────────────────────
function DanhSachChuongTrinh({ ds, onChange, homNay }: { ds: ChuongTrinh[]; onChange: (ds: ChuongTrinh[]) => void; homNay: string }) {
  const sua = (id: string, p: Partial<ChuongTrinh>) => onChange(ds.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const them = () => onChange([...ds, {
    id: `ct-${Date.now()}`, ten: "", phanTram: 0, tu: homNay, den: "", mucDich: "all", sanPham: "all", tiers: [], bat: true,
  }]);
  return (
    <Panel title="Chương trình giảm giá" desc="Mỗi chương trình giảm % từ giá chuẩn. Nhiều chương trình cùng khớp thì lấy mức giảm lớn nhất. Tên chương trình khách nhìn thấy; % và giá chuẩn thì không.">
      <div className="space-y-3">
        {ds.map((c) => (
          <div key={c.id} className="grid gap-2 rounded-xl border border-cvr-line p-3 sm:grid-cols-6">
            <label className="text-xs text-cvr-muted sm:col-span-2">Tên chương trình
              <input value={c.ten} onChange={(e) => sua(c.id, { ten: e.target.value })} placeholder="Ưu đãi ra mắt" className={inputCls} />
            </label>
            <label className="text-xs text-cvr-muted">% giảm
              <input inputMode="numeric" value={c.phanTram || ""} onChange={(e) => sua(c.id, { phanTram: Math.min(100, Number(e.target.value.replace(/\D/g, "")) || 0) })} className={inputCls} />
            </label>
            <label className="text-xs text-cvr-muted">Từ ngày
              <input type="date" value={c.tu} onChange={(e) => sua(c.id, { tu: e.target.value })} className={inputCls} />
            </label>
            <label className="text-xs text-cvr-muted">Đến hết ngày
              <input type="date" value={c.den} onChange={(e) => sua(c.id, { den: e.target.value })} className={inputCls} />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-cvr-ink">
              <input type="checkbox" checked={c.bat} onChange={(e) => sua(c.id, { bat: e.target.checked })} /> Đang bật
            </label>
            <label className="text-xs text-cvr-muted sm:col-span-2">Áp cho
              <select value={c.mucDich} onChange={(e) => sua(c.id, { mucDich: e.target.value as ChuongTrinh["mucDich"] })} className={inputCls}>
                <option value="all">Bán và Cho thuê</option><option value="ban">Chỉ Bán</option><option value="thue">Chỉ Cho thuê</option>
              </select>
            </label>
            <label className="text-xs text-cvr-muted sm:col-span-2">Sản phẩm
              <select value={c.sanPham} onChange={(e) => sua(c.id, { sanPham: e.target.value as ChuongTrinh["sanPham"] })} className={inputCls}>
                <option value="all">Tất cả (gói tin, đẩy tin, gói hội viên)</option><option value="tin">Chỉ gói tin</option><option value="day">Chỉ đẩy tin</option><option value="hoi-vien">Chỉ gói hội viên</option>
              </select>
            </label>
            <div className="text-xs text-cvr-muted sm:col-span-2">Hạng tin (bỏ trống = mọi hạng)
              <div className="mt-1 flex flex-wrap gap-2">
                {THU_TU_CAP.map((t) => (
                  <label key={t} className="flex items-center gap-1 text-sm text-cvr-ink">
                    <input type="checkbox" checked={c.tiers.includes(t)}
                      onChange={(e) => sua(c.id, { tiers: e.target.checked ? [...c.tiers, t] : c.tiers.filter((x) => x !== t) })} />
                    {tenCap(t)}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end sm:col-span-6">
              <button type="button" onClick={() => onChange(ds.filter((x) => x.id !== c.id))} className="text-xs text-cvr-muted hover:text-red-600">Xoá chương trình</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={them} className="rounded-lg border border-dashed border-cvr-line px-4 py-2 text-sm font-semibold text-cvr-ink hover:border-cvr-ink">
          + Thêm chương trình
        </button>
      </div>
    </Panel>
  );
}

// ── Gói hội viên: giá chuẩn theo tháng + voucher mỗi 30 ngày ─────────────────
const LOAI_VOUCHER: LoaiVoucher[] = ["tin-thuong", "tin-vip", "day-thuong"];

function BangHoiVien({ ds, onChange }: { ds: GoiHoiVienChuan[]; onChange: (ds: GoiHoiVienChuan[]) => void }) {
  const suaGoi = (i: number, g: Partial<GoiHoiVienChuan>) => onChange(ds.map((x, j) => (j === i ? { ...x, ...g } : x)));
  const them = () => onChange([...ds, { id: `goi-${Date.now().toString(36)}`, ten: "", thoiHan: [{ thang: 1, price: 0 }], voucher: [], quyenLoi: [] }]);
  return (
    <Panel title="Giá chuẩn gói hội viên" desc="Giá CHƯA GTGT (Batdongsan cũng niêm yết chưa VAT). Voucher cấp lại mỗi 30 ngày, hạn dùng 30 ngày, tự trừ vào giá khi duyệt tin / đẩy tin. Gói khách đã mua giữ nguyên quyền lợi lúc mua dù sau này sửa ở đây.">
      <div className="space-y-4">
        {ds.map((g, i) => (
          <div key={g.id} className="rounded-xl border border-cvr-line p-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[200px] flex-1 text-xs text-cvr-muted">Tên gói (khách thấy)
                <input value={g.ten} onChange={(e) => suaGoi(i, { ten: e.target.value })} className={inputCls} />
              </label>
              <p className="pb-2 text-xs text-cvr-muted">Voucher mỗi tháng đáng: <b className="text-cvr-ink">{dong(giaTriVoucherThang(g))}</b></p>
              <button type="button" onClick={() => onChange(ds.filter((_, j) => j !== i))} className="pb-2 text-xs text-cvr-muted hover:text-red-600">Xoá gói</button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-cvr-muted">Thời hạn & giá chuẩn</p>
              <button type="button" onClick={() => suaGoi(i, { thoiHan: [...g.thoiHan, { thang: 0, price: 0 }] })} className="text-xs font-semibold text-cvr-blue">+ Thêm thời hạn</button>
            </div>
            <div className="mt-1 grid gap-2 sm:grid-cols-3">
              {g.thoiHan.map((t, k) => (
                <div key={k} className="flex items-end gap-2">
                  <label className="w-20 text-xs text-cvr-muted">Số tháng
                    <OSo value={t.thang} onChange={(n) => suaGoi(i, { thoiHan: g.thoiHan.map((x, j) => (j === k ? { ...x, thang: n } : x)) })} />
                  </label>
                  <label className="flex-1 text-xs text-cvr-muted">Giá chuẩn
                    <OSo value={t.price} onChange={(n) => suaGoi(i, { thoiHan: g.thoiHan.map((x, j) => (j === k ? { ...x, price: n } : x)) })} />
                    <span className="mt-0.5 block text-[11px] text-cvr-faint">{t.price ? `gồm GTGT: ${tra(t.price)}${t.thang > 1 ? ` · ${dong(t.price / t.thang)}/tháng` : ""}` : ""}</span>
                  </label>
                  <button type="button" aria-label="Xoá thời hạn" onClick={() => suaGoi(i, { thoiHan: g.thoiHan.filter((_, j) => j !== k) })} className="mb-5 text-cvr-muted hover:text-red-600">×</button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-cvr-muted">Voucher mỗi 30 ngày</p>
              <button type="button" onClick={() => suaGoi(i, { voucher: [...g.voucher, { loai: "tin-thuong", giam: 0, soLuong: 0 }] })} className="text-xs font-semibold text-cvr-blue">+ Thêm voucher</button>
            </div>
            <div className="mt-1 space-y-2">
              {g.voucher.map((v, k) => (
                <div key={k} className="flex flex-wrap items-end gap-2">
                  <label className="w-44 text-xs text-cvr-muted">Áp cho
                    <select value={v.loai} onChange={(e) => suaGoi(i, { voucher: g.voucher.map((x, j) => (j === k ? { ...x, loai: e.target.value as LoaiVoucher } : x)) })} className={inputCls}>
                      {LOAI_VOUCHER.map((l) => <option key={l} value={l}>{TEN_VOUCHER[l]}</option>)}
                    </select>
                  </label>
                  <label className="w-40 text-xs text-cvr-muted">Giảm mỗi lần
                    <OSo value={v.giam} onChange={(n) => suaGoi(i, { voucher: g.voucher.map((x, j) => (j === k ? { ...x, giam: n } : x)) })} />
                  </label>
                  <label className="w-24 text-xs text-cvr-muted">Số lượng
                    <OSo value={v.soLuong} onChange={(n) => suaGoi(i, { voucher: g.voucher.map((x, j) => (j === k ? { ...x, soLuong: n } : x)) })} />
                  </label>
                  <button type="button" aria-label="Xoá voucher" onClick={() => suaGoi(i, { voucher: g.voucher.filter((_, j) => j !== k) })} className="mb-2 text-cvr-muted hover:text-red-600">×</button>
                </div>
              ))}
              {!g.voucher.length && <p className="text-xs text-cvr-muted">Chưa có voucher nào.</p>}
            </div>

            <label className="mt-3 block text-xs text-cvr-muted">Quyền lợi khác — mỗi dòng một quyền lợi. CHỈ ghi thứ web đã làm thật.
              <textarea rows={2} value={g.quyenLoi.join("\n")}
                onChange={(e) => suaGoi(i, { quyenLoi: e.target.value.split("\n") })}
                onBlur={() => suaGoi(i, { quyenLoi: g.quyenLoi.map((x) => x.trim()).filter(Boolean) })}
                className="mt-1 w-full rounded-lg border border-cvr-line px-2.5 py-2 text-sm text-cvr-ink outline-none focus:border-cvr-ink" />
            </label>
          </div>
        ))}
        <button type="button" onClick={them} className="rounded-lg border border-dashed border-cvr-line px-4 py-2 text-sm font-semibold text-cvr-ink hover:border-cvr-ink">+ Thêm gói</button>
      </div>
    </Panel>
  );
}

function XemTruocHoiVien({ chuan, congBo, canhBao }: {
  chuan: GoiHoiVienChuan[];
  congBo: { id: string; ten: string; thoiHan: { thang: number; price: number }[]; voucher: { giam: number; soLuong: number }[] }[];
  canhBao: string[];
}) {
  return (
    <Panel title="Gói hội viên — giá khách thấy (xem trước, đã gồm GTGT)" desc="“Lời tối đa” = giá trị voucher 30 ngày − giá gói mỗi tháng (chưa VAT), khi khách dùng HẾT voucher. Dùng ít hơn mức hoà vốn là khách lỗ.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
              <th className="py-2">Gói</th><th className="py-2">Thời hạn</th><th className="py-2 text-right">Giá chuẩn</th>
              <th className="py-2 text-right">Khách trả</th><th className="py-2 text-right">Mỗi tháng</th><th className="py-2 text-right">Lời tối đa/tháng</th><th className="py-2 text-right">Hoà vốn</th>
            </tr>
          </thead>
          <tbody>
            {congBo.flatMap((g) => g.thoiHan.map((t, k) => {
              const goc = chuan.find((x) => x.id === g.id)?.thoiHan.find((x) => x.thang === t.thang)?.price ?? 0;
              const thang = t.price / t.thang;
              const gt = giaTriVoucherThang(g);
              return (
                <tr key={`${g.id}-${t.thang}`} className="border-b border-cvr-line/60">
                  <td className="py-2 font-semibold text-cvr-ink">{k === 0 ? g.ten : ""}</td>
                  <td className="py-2">{t.thang} tháng</td>
                  <td className="py-2 text-right tabular-nums text-cvr-muted">{goc && goc !== t.price ? <s>{tra(goc)}</s> : "—"}</td>
                  <td className="py-2 text-right tabular-nums font-semibold text-cvr-ink">{tra(t.price)}</td>
                  <td className="py-2 text-right tabular-nums">{dong(thang)}</td>
                  <td className={`py-2 text-right tabular-nums ${gt - thang > 0 ? "text-green-700" : "text-red-600"}`}>{dong(gt - thang)}</td>
                  <td className="py-2 text-right tabular-nums">{gt ? `dùng ≥ ${Math.ceil((thang / gt) * 100)}%` : "—"}</td>
                </tr>
              );
            }))}
          </tbody>
        </table>
        {!congBo.length && <p className="py-3 text-sm text-cvr-muted">Chưa có gói nào có giá — khách sẽ không thấy mục Gói hội viên.</p>}
      </div>
      <CanhBao ten="Gói hội viên" ds={canhBao} />
    </Panel>
  );
}
