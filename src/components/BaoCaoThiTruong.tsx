"use client";
// ĐIỂM TIN THỊ TRƯỜNG COASTAL LAND — một trang, 3 vùng, báo cáo QUÝ ĐÃ KẾT THÚC (anh 13/11/2026). Số = bảng Cowork lọc (cơ sở số liệu
// DKRA, thị trường sơ cấp) nạp ở Admin — xem src/lib/baoCaoThiTruong.ts. Bố cục 3 chương như DKRA. Biểu đồ SVG ngay trong trang.
// Phần chưa có số: trang công khai ẩn; Admin xem trước (xemThu) hiện ô viền vàng để biết còn thiếu gì.
import { createContext, useContext, useState } from "react";
import { loiEmail, loiSdt } from "@/lib/kiemNhap";
import { napSupabase } from "@/lib/supabase/nap";
import { TEN_PHAN_KHUC, diemNhan, duBaoTuSo, nhanDinhTuSo, quySau, tenQuy, type SoPhanKhuc, type SoVung } from "@/lib/baoCaoThiTruong";

const XANH = ["#0066cc", "#2997ff", "#86b7ef", "#c4dcf7", "#e3eefb", "#f0f5fc"];
const VANG = "#b89254";
const vn = (n?: number, d = 1) => (n == null ? "—" : n.toLocaleString("vi-VN", { maximumFractionDigits: d }));
const XemThu = createContext(false);

function OCho({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  if (!useContext(XemThu)) return null;
  return (
    <div className="rounded-xl border border-dashed border-cvr-gold-soft bg-[#fbf6ec] p-4 text-sm leading-relaxed text-cvr-body">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cvr-gold-ink">{tieuDe}</p>
      {children}
    </div>
  );
}
function Doi({ v }: { v?: number }) {
  if (v == null) return null;
  return <p className={`text-[13px] ${v >= 0 ? "text-[#1f8a4c]" : "text-[#c0392b]"}`}>{v >= 0 ? "▲ Tăng" : "▼ Giảm"} {vn(Math.abs(v))}% Q-o-Q</p>;
}
function The({ nhan, giaTri, donVi, chinh, phu }: { nhan: string; giaTri: string; donVi?: string; chinh?: boolean; phu?: React.ReactNode }) {
  return (
    <div className={`rounded-xl p-4 ${chinh ? "bg-cvr-ink text-white" : "bg-cvr-surface"}`}>
      <p className={`text-[13px] ${chinh ? "text-white/70" : "text-cvr-muted"}`}>{nhan}</p>
      <p className={`mt-0.5 text-[28px] font-bold leading-tight tabular-nums ${chinh ? "text-white" : "text-cvr-ink"}`}>
        {giaTri}{donVi && <span className={`ml-1 text-[13px] font-medium ${chinh ? "text-white/70" : "text-cvr-muted"}`}>{donVi}</span>}
      </p>
      {phu}
    </div>
  );
}
function KhungBieuDo({ tieuDe, dvt, children }: { tieuDe: string; dvt: string; children: React.ReactNode }) {
  return (
    <figure className="min-w-0 rounded-xl border border-cvr-line p-4">
      <figcaption><p className="text-sm font-semibold text-cvr-ink">{tieuDe}</p><p className="mb-2 text-xs text-cvr-muted">{dvt}</p></figcaption>
      {children}
    </figure>
  );
}
const chu = { fontSize: 11, fill: "#6e6e73" } as const;
const chuSo = { fontSize: 11, fill: "#1d1d1f", fontWeight: 600 } as const;
const ChuGiai = ({ ds }: { ds: [string, string][] }) => (
  <div className="mt-1 flex flex-wrap gap-3 text-xs text-cvr-muted">{ds.map(([m, t]) => <span key={t} className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: m }} />{t}</span>)}</div>
);

// Nguồn cung (cột) và tiêu thụ (đường) theo quý — quý báo cáo tô đậm
function CungTieuThu({ d }: { d: SoPhanKhuc["theoQuy"] }) {
  const max = Math.max(1, ...d.map((x) => Math.max(x.nguonCung ?? 0, x.tieuThu ?? 0))) * 1.18, H = 120, y0 = 140, bw = 40, gap = (440 - d.length * bw) / (d.length + 1);
  const X = (i: number) => gap + i * (bw + gap) + bw / 2, Y = (v: number) => y0 - (v / max) * H;
  const diem = d.map((x, i) => (x.tieuThu != null ? [X(i), Y(x.tieuThu)] : null)).filter(Boolean) as number[][];
  return (
    <svg viewBox="0 0 440 165" className="h-auto w-full" role="img" aria-label="Nguồn cung và tiêu thụ sơ cấp theo quý">
      <line x1={0} x2={440} y1={y0} y2={y0} stroke="#d2d2d7" />
      {d.map((x, i) => x.nguonCung != null && (
        <g key={x.quy}><rect x={X(i) - bw / 2} y={Y(x.nguonCung)} width={bw} height={y0 - Y(x.nguonCung)} rx={3} fill={i === d.length - 1 ? XANH[0] : XANH[3]} />
          <text x={X(i)} y={Y(x.nguonCung) - 6} textAnchor="middle" {...chuSo}>{vn(x.nguonCung, 0)}</text></g>))}
      {diem.length > 1 && <polyline points={diem.map((p) => p.join(",")).join(" ")} fill="none" stroke={VANG} strokeWidth={2} strokeDasharray="4 3" />}
      {d.map((x, i) => x.tieuThu != null && <rect key={"t" + x.quy} x={X(i) - 4} y={Y(x.tieuThu) - 4} width={8} height={8} transform={`rotate(45 ${X(i)} ${Y(x.tieuThu)})`} fill={VANG} />)}
      {d.map((x, i) => <text key={"q" + x.quy} x={X(i)} y={y0 + 16} textAnchor="middle" {...chu}>{tenQuy(x.quy)}</text>)}
    </svg>
  );
}
function VongTyTrong({ d }: { d: [string, number][] }) {
  const tong = d.reduce((s, x) => s + x[1], 0), cx = 80, cy = 80, r = 64, ri = 38;
  let a = -Math.PI / 2;
  const p = (rr: number, an: number) => [cx + rr * Math.cos(an), cy + rr * Math.sin(an)];
  return (
    <svg viewBox={`0 0 440 ${Math.max(160, 30 + d.length * 24)}`} className="h-auto w-full" role="img" aria-label="Tỷ trọng nguồn cung sơ cấp theo khu vực">
      {d.length === 1 ? <circle cx={cx} cy={cy} r={(r + ri) / 2} fill="none" stroke={XANH[0]} strokeWidth={r - ri} /> : d.map(([k, v], i) => {
        const g = (v / tong) * Math.PI * 2, a2 = a + g, L = g > Math.PI ? 1 : 0;
        const [x1, y1] = p(r, a), [x2, y2] = p(r, a2), [x3, y3] = p(ri, a2), [x4, y4] = p(ri, a); a = a2;
        return <path key={k} d={`M${x1} ${y1}A${r} ${r} 0 ${L} 1 ${x2} ${y2}L${x3} ${y3}A${ri} ${ri} 0 ${L} 0 ${x4} ${y4}Z`} fill={XANH[i % 6]} stroke="#fff" strokeWidth={1.5} />;
      })}
      {d.map(([k, v], i) => (
        <g key={k}><rect x={180} y={18 + i * 24} width={10} height={10} rx={2} fill={XANH[i % 6]} />
          <text x={196} y={27 + i * 24} {...chu}>{k}</text><text x={436} y={27 + i * 24} textAnchor="end" {...chuSo}>{vn((v / tong) * 100, 1)}%</text></g>))}
    </svg>
  );
}
// Giá sơ cấp theo khu vực: cột thấp nhất · cao nhất, hình thoi vàng = trung bình (như DKRA)
function GiaKhuVuc({ d }: { d: SoPhanKhuc["giaKhuVuc"] }) {
  const max = Math.max(1, ...d.map((x) => Math.max(x.cao ?? 0, x.tb ?? 0, x.thap ?? 0))) * 1.2, H = 110, y0 = 130, nhom = 440 / d.length, bw = Math.min(18, nhom / 4);
  const Y = (v: number) => y0 - (v / max) * H;
  return (
    <svg viewBox="0 0 440 175" className="h-auto w-full" role="img" aria-label="Giá sơ cấp theo khu vực">
      <line x1={0} x2={440} y1={y0} y2={y0} stroke="#d2d2d7" />
      {d.map((x, i) => { const c = i * nhom + nhom / 2; return (
        <g key={x.kv}>
          {x.thap != null && <><rect x={c - bw - 1} y={Y(x.thap)} width={bw} height={y0 - Y(x.thap)} rx={2} fill={XANH[3]} /><text x={c - bw - 4} y={Y(x.thap) + 10} textAnchor="end" {...chu}>{vn(x.thap)}</text></>}
          {x.cao != null && <><rect x={c + 1} y={Y(x.cao)} width={bw} height={y0 - Y(x.cao)} rx={2} fill={XANH[0]} /><text x={c + bw / 2 + 1} y={Y(x.cao) - 4} textAnchor="middle" {...chuSo}>{vn(x.cao)}</text></>}
          {x.tb != null && <rect x={c - 5} y={Y(x.tb) - 5} width={10} height={10} transform={`rotate(45 ${c} ${Y(x.tb)})`} fill={VANG} />}
          <text x={c} y={y0 + 16} textAnchor="middle" {...chu}>{x.kv.replace(/^(Phường|Xã|P\.|X\.)\s*/, "")}</text>
        </g>); })}
    </svg>
  );
}

function PhanKhuc({ p, v }: { p: SoPhanKhuc; v: SoVung }) {
  const nd = v.nhanDinh[p.phanKhuc]?.length ? v.nhanDinh[p.phanKhuc] : nhanDinhTuSo(p);
  return (
    <section className="border-t border-cvr-line py-6 [break-inside:avoid-page]">
      <h3 className="mb-3 text-xl font-semibold text-cvr-ink">{TEN_PHAN_KHUC[p.phanKhuc]}</h3>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <The nhan="Thị trường sơ cấp" giaTri={vn(p.soDuAn, 0)} donVi="dự án" chinh />
        <The nhan="Nguồn cung sơ cấp" giaTri={vn(p.nguonCung, 0)} donVi={p.donVi} phu={<Doi v={p.doiCung} />} />
        <The nhan="Tiêu thụ sơ cấp" giaTri={vn(p.tieuThu, 0)} donVi={p.donVi} phu={<Doi v={p.doiTieuThu} />} />
        <The nhan="Tỷ lệ tiêu thụ" giaTri={p.tyLe == null ? "—" : `${vn(p.tyLe)}%`} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {p.theoQuy.filter((x) => x.nguonCung != null).length >= 2 ? (
          <KhungBieuDo tieuDe="Nguồn cung và tiêu thụ sơ cấp theo quý" dvt={`Đvt: ${p.donVi}`}>
            <CungTieuThu d={p.theoQuy} /><ChuGiai ds={[[XANH[0], "Nguồn cung"], [VANG, "Tiêu thụ"]]} />
          </KhungBieuDo>
        ) : <OCho tieuDe="Thiếu số liệu">Cần nguồn cung, tiêu thụ ít nhất 2 quý để vẽ biểu đồ theo quý.</OCho>}
        {p.tyTrong.length ? <KhungBieuDo tieuDe="Tỷ trọng nguồn cung sơ cấp theo khu vực" dvt="Đvt: %"><VongTyTrong d={p.tyTrong} /></KhungBieuDo>
          : <OCho tieuDe="Thiếu số liệu">Nguồn cung theo khu vực.</OCho>}
        {p.giaKhuVuc.length ? (
          <KhungBieuDo tieuDe="Giá bán sơ cấp một số khu vực nổi bật" dvt={`Đvt: ${p.donViGia}`}>
            <GiaKhuVuc d={p.giaKhuVuc} /><ChuGiai ds={[[XANH[3], "Thấp nhất"], [XANH[0], "Cao nhất"], [VANG, "Trung bình"]]} />
          </KhungBieuDo>
        ) : <OCho tieuDe="Thiếu số liệu">Giá sơ cấp thấp – trung bình – cao theo khu vực.</OCho>}
        {p.duAn.length ? (
          <KhungBieuDo tieuDe="Dự án chào bán trong quý" dvt="Chủ đầu tư · sản phẩm · giá công bố">
            <ul className="grid gap-2 text-sm">{p.duAn.slice(0, 8).map((d) => (
              <li key={d.ten}><b className="text-cvr-ink">{d.ten}</b>{d.chuDauTu ? ` · ${d.chuDauTu}` : ""}
                <span className="block text-xs text-cvr-muted">{[d.soDangChao != null && `${vn(d.soDangChao, 0)} ${p.donVi} đang chào`, d.giaTB != null && `giá ${vn(d.giaTB)} ${d.donViGia}`, d.chinhSach].filter(Boolean).join(" · ")}</span></li>))}</ul>
          </KhungBieuDo>
        ) : <OCho tieuDe="Dự án chào bán trong quý">Chưa có số liệu.</OCho>}
      </div>
      {nd.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-cvr-ink">Nhận định thị trường</p>
          <ul className="grid max-w-[72ch] list-disc gap-1.5 pl-5 text-[15px] leading-relaxed text-cvr-body marker:text-cvr-gold">{nd.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

// TẢI BẢN PDF (anh 13/11/2026: "muốn tải thì nhập email, số điện thoại"): bấm → bảng nhập Email + Số điện thoại → lưu khách vào
// customer_requests (Admin → Yêu cầu khách hàng, cùng chỗ form nhận báo giá) → tải: có tệp PDF ở Admin thì mở tệp, chưa có thì
// "Lưu thành PDF" chỉ phần báo cáo (@media print). Đã nhập một lần trên máy này thì lần sau tải ngay.
const KHOA_DA_NHAP = "cvr-diem-tin-da-nhap";
function NutTaiPdf({ pdf, noiDung }: { pdf?: string; noiDung: string }) {
  const [mo, setMo] = useState(false);
  const [email, setEmail] = useState("");
  const [sdt, setSdt] = useState("");
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const tai = () => { if (pdf) window.open(pdf, "_blank", "noopener"); else window.print(); };
  const bam = () => {
    let da = false;
    try { da = !!localStorage.getItem(KHOA_DA_NHAP); } catch { /* trình duyệt chặn bộ nhớ */ }
    if (da) tai(); else setMo(true);
  };
  const gui = async () => {
    setLoi("");
    if (loiEmail(email, true)) return setLoi(loiEmail(email, true));
    if (loiSdt(sdt)) return setLoi(loiSdt(sdt));
    setDangGui(true);
    try {
      const supabase = await napSupabase();
      const { error } = await supabase.from("customer_requests").insert({ loai: "khac", ten: "Khách tải Điểm tin thị trường", dien_thoai: sdt.trim(), email: email.trim(), noi_dung: noiDung });
      if (error) throw error;
      try { localStorage.setItem(KHOA_DA_NHAP, "1"); } catch { /* bỏ qua */ }
      setMo(false);
      tai();
    } catch {
      setLoi("Chưa gửi được, vui lòng thử lại.");
    }
    setDangGui(false);
  };
  const o = "h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-base text-cvr-ink outline-none placeholder-cvr-faint focus:border-cvr-line focus:bg-white sm:text-sm";
  return (
    <>
      <button type="button" onClick={bam} className="press flex h-9 items-center justify-center gap-1.5 rounded-lg bg-cvr-gold px-4 text-[13px] font-semibold text-white sm:h-auto">
        <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
        Tải bản PDF
      </button>
      {mo && (
        <div role="dialog" aria-modal="true" aria-label="Tải bản PDF" className="fixed inset-0 z-[150] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setMo(false); }}>
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-semibold text-cvr-ink">Tải bản PDF</p>
              <button type="button" aria-label="Đóng" onClick={() => setMo(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-cvr-muted hover:bg-cvr-surface">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid gap-2">
              <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" aria-label="Email" className={o} />
              <input type="tel" inputMode="tel" autoComplete="tel" value={sdt} onChange={(e) => setSdt(e.target.value)} placeholder="Số điện thoại *" aria-label="Số điện thoại" className={o} />
            </div>
            {loi && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loi}</p>}
            <button type="button" onClick={gui} disabled={dangGui} className="btn-dangtin mt-3 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white disabled:opacity-50">
              {dangGui ? "Đang gửi…" : "Tải bản PDF"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function TieuDeChuong({ so, ten }: { so: string; ten: string }) {
  return (
    <header className="mb-4 flex items-baseline gap-3">
      <span className="text-[28px] font-bold leading-none text-cvr-gold tabular-nums">{so}</span>
      <h2 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-[28px]">{ten}</h2>
    </header>
  );
}

export default function BaoCaoThiTruong({ vung, xemThu = false }: { vung: SoVung[]; xemThu?: boolean }) {
  // LUÔN ĐỦ 3 TAB KHU VỰC (anh 13/11/2026: "sao thấy có 1 cái") — khu vực chưa có số thì bấm vào ghi "đang được cập nhật"
  const coSo = vung;
  const [chon, setChon] = useState((vung.find((x) => x.phanKhuc.length) ?? vung[0]).vung.id);
  const v = coSo.find((x) => x.vung.id === chon) ?? coSo[0];
  const chuaCo = !v.phanKhuc.length && !xemThu;
  const q = tenQuy(v.quy), qSau = tenQuy(quySau(v.quy));
  const dn = diemNhan(v);
  const nguon = [...new Set(v.phanKhuc.flatMap((p) => p.nguon))];
  return (
    <XemThu.Provider value={xemThu}>
    <div className="bao-cao">
      {/* MENU 3 KHU VỰC (anh 13/11/2026: "cấu trúc hiển thị rõ hơn, CTA, màu khi bấm vào mỗi tab") */}
      <div className="grid grid-cols-1 gap-2 print:hidden sm:grid-cols-[1fr_auto]">
        <div role="tablist" aria-label="Chọn khu vực" className="grid gap-1 rounded-xl bg-cvr-surface p-1" style={{ gridTemplateColumns: `repeat(${coSo.length}, minmax(0, 1fr))` }}>
          {coSo.map((x) => { const on = x.vung.id === v.vung.id; return (
            <button key={x.vung.id} type="button" role="tab" aria-selected={on} onClick={() => setChon(x.vung.id)}
              className={`press grid min-w-0 rounded-lg px-2.5 py-1.5 text-left transition ${on ? "bg-cvr-ink shadow-[0_4px_14px_rgba(0,0,0,0.18)]" : "hover:bg-white"}`}>
              <span className={`text-[13.5px] font-bold leading-tight ${on ? "text-white" : "text-cvr-ink"}`}>{x.vung.nut}</span>
              <span className={`truncate text-[11px] leading-snug ${on ? "text-white/70" : "text-cvr-muted"}`}>{x.vung.phu}</span>
            </button>); })}
        </div>
        {/* TẢI BẢN PDF luôn có (anh 13/11/2026: "muốn tải thì tải như lúc trước"): Admin đã có tệp PDF → tải tệp đó; chưa có → hộp
            "Lưu thành PDF" của trình duyệt, chỉ in phần báo cáo (.bao-cao, xem @media print ở globals.css) */}
        {!chuaCo && <NutTaiPdf pdf={v.pdf} noiDung={`Tải Điểm tin thị trường ${v.vung.ten} — ${tenQuy(v.quy)}`} />}
      </div>

      {chuaCo ? (
        <div className="mt-6">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-cvr-ink sm:text-4xl">Điểm tin thị trường {v.vung.ten}</h1>
          <p className="mt-2 text-base text-cvr-muted">Báo cáo khu vực này đang được cập nhật.</p>
        </div>
      ) : (<>
      <div className="mt-6 border-b border-cvr-line pb-5">
        <p className="text-[13px] font-semibold tracking-[0.18em] text-cvr-ink">COASTAL <span className="text-cvr-gold">LAND</span> · ĐIỂM TIN THỊ TRƯỜNG</p>
        <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-cvr-ink sm:text-4xl">Điểm tin thị trường {v.vung.ten}</h1>
        <p className="mt-1 text-sm font-medium text-cvr-muted">Quý {q.replace(/^Q/, "")}</p>
        {dn.length > 0 && (
          <div className="mt-4 rounded-2xl bg-cvr-surface p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cvr-gold-ink">Điểm nhấn quý</p>
            <ul className="mt-2 grid max-w-[80ch] list-disc gap-1.5 pl-5 text-[15px] text-cvr-ink marker:text-cvr-gold">{dn.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        )}
        <nav aria-label="Mục lục" className="mt-4 grid gap-1 text-sm sm:grid-cols-3">
          <a href="#kinh-te" className="text-cvr-ink"><b className="text-cvr-gold">01.</b> Kinh tế – Xã hội {q}</a>
          <a href="#dien-bien" className="text-cvr-ink"><b className="text-cvr-gold">02.</b> Diễn biến thị trường {q}</a>
          <a href="#du-bao" className="text-cvr-ink"><b className="text-cvr-gold">03.</b> Dự báo thị trường {qSau}</a>
        </nav>
      </div>

      <section id="kinh-te" className="scroll-mt-24 py-7">
        <TieuDeChuong so="01." ten={`Kinh tế – Xã hội ${q}`} />
        <h3 className="mb-2 text-lg font-semibold text-cvr-ink">Chỉ số kinh tế</h3>
        {v.kinhTe.length ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">{v.kinhTe.map((k) => (
            <div key={k.tinh + k.chiSo} className="rounded-xl bg-cvr-surface p-4">
              <p className="text-sm font-semibold text-cvr-ink">{k.chiSo} <span className="font-normal text-cvr-muted">· {k.tinh}</span></p>
              <p className="mt-1 text-[26px] font-bold tabular-nums text-cvr-blue-ink">{k.giaTri}<span className="ml-1 text-[13px] font-medium text-cvr-muted">{k.donVi}</span></p>
              {k.caNuoc && <p className="text-[13px] text-cvr-muted">Cả nước: {k.caNuoc}</p>}
              {k.soCungKy && <p className="text-[13px] text-cvr-body">{k.soCungKy} Y-o-Y</p>}
              <p className="mt-1 text-[11px] text-cvr-faint">{k.ky} · Nguồn: {k.nguon}</p>
            </div>))}</div>
        ) : <OCho tieuDe="Chưa có số liệu">GRDP · FDI · CPI · du lịch.</OCho>}
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-cvr-ink">Chính sách – Pháp lý</h3>
            {v.chinhSach.length ? <ol className="grid gap-3 text-sm">{v.chinhSach.map((b) => (
              <li key={b.soHieu} className="rounded-xl border border-cvr-line p-3"><b className="text-cvr-ink">{b.soHieu}</b> <span className="text-cvr-muted">· {b.ngay}{b.coQuan ? ` · ${b.coQuan}` : ""}</span>
                <span className="block text-cvr-body">{b.noiDung}{b.hieuLuc ? ` Hiệu lực ${b.hieuLuc}.` : ""}</span></li>))}</ol>
              : <OCho tieuDe="Chưa có số liệu">Văn bản ban hành trong quý.</OCho>}
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold text-cvr-ink">Hạ tầng giao thông</h3>
            {v.haTang.length ? <ol className="grid gap-3 text-sm">{v.haTang.map((h) => (
              <li key={h.ten} className="rounded-xl border border-cvr-line p-3"><b className="text-cvr-ink">{h.ten}</b> <span className="text-cvr-muted">· {h.moc}{h.ngay ? ` ${h.ngay}` : ""}{h.von ? ` · ${h.von}` : ""}</span>
                <span className="block text-cvr-body">{h.noiDung}</span></li>))}</ol>
              : <OCho tieuDe="Chưa có số liệu">Công trình khởi công, thông xe, khánh thành trong quý.</OCho>}
          </div>
        </div>
      </section>

      <section id="dien-bien" className="scroll-mt-24 py-7">
        <TieuDeChuong so="02." ten={`Diễn biến thị trường ${q}`} />
        {v.phanKhuc.length ? v.phanKhuc.map((p) => <PhanKhuc key={p.phanKhuc} p={p} v={v} />)
          : <OCho tieuDe="Chưa có số liệu">Nguồn cung, tiêu thụ, giá sơ cấp theo phân khúc.</OCho>}
      </section>

      <section id="du-bao" className="scroll-mt-24 py-7">
        <TieuDeChuong so="03." ten={`Dự báo thị trường ${qSau}`} />
        <div className="grid gap-4">{v.phanKhuc.map((p) => {
          const cuaAnh = v.duBao.filter((d) => !d.phanKhuc || d.phanKhuc === p.phanKhuc || TEN_PHAN_KHUC[p.phanKhuc].includes(d.phanKhuc)).map((d) => d.noiDung);
          const ds = cuaAnh.length ? cuaAnh : duBaoTuSo(p, []);
          return ds.length ? (
            <div key={p.phanKhuc}>
              <p className="mb-1 font-semibold text-cvr-ink">{TEN_PHAN_KHUC[p.phanKhuc]}</p>
              <ul className="grid max-w-[72ch] list-disc gap-1.5 pl-5 text-[15px] leading-relaxed text-cvr-body marker:text-cvr-gold">{ds.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ) : null; })}</div>
      </section>

      <footer className="mt-4 grid max-w-[80ch] gap-1.5 border-t border-cvr-line pt-4 text-[13px] text-cvr-muted">
        <p className="font-semibold text-cvr-ink">Nguồn</p>
        <p>Coastal Land tổng hợp{nguon.length ? ` từ ${nguon.join("; ")}` : ""}. Q-o-Q: so với quý trước · Y-o-Y: so với cùng kỳ năm trước.</p>
      </footer>
      </>)}
    </div>
    </XemThu.Provider>
  );
}
