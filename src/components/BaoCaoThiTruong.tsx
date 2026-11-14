"use client";
// ĐIỂM TIN THỊ TRƯỜNG COASTAL LAND — một trang, 3 vùng, báo cáo QUÝ ĐÃ KẾT THÚC (anh 13/11/2026). Số = bảng Cowork lọc (cơ sở số liệu
// DKRA, thị trường sơ cấp) nạp ở Admin — xem src/lib/baoCaoThiTruong.ts. Bố cục 3 chương như DKRA. Biểu đồ SVG ngay trong trang.
// Phần chưa có số: trang công khai ẩn; Admin xem trước (xemThu) hiện ô viền vàng để biết còn thiếu gì.
import { createContext, useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { docToaDo, type DiemHaTang } from "@/lib/baoCaoThiTruong";
import { loiEmail, loiSdt } from "@/lib/kiemNhap";
import { napSupabase } from "@/lib/supabase/nap";
import { TEN_PHAN_KHUC, diemNhan, duBaoTuSo, nhanDinhTuSo, quySau, tenQuy, type SoPhanKhuc, type SoVung } from "@/lib/baoCaoThiTruong";

const XANH = ["#0066cc", "#2997ff", "#86b7ef", "#c4dcf7", "#e3eefb", "#f0f5fc"];
const VANG = "#b89254";
const vn = (n?: number, d = 1) => (n == null ? "—" : n.toLocaleString("vi-VN", { maximumFractionDigits: d }));
const XemThu = createContext(false);
// Bản đồ hạ tầng: thư viện bản đồ chỉ tải khi trang có công trình kèm toạ độ (khung giữ chỗ cùng cỡ để trang không nhảy)
const BanDoHaTang = dynamic(() => import("@/components/BanDoHaTang"), { ssr: false, loading: () => <div className="h-[260px] w-full rounded-xl bg-cvr-surface sm:h-[320px]" /> });

function OCho({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  if (!useContext(XemThu)) return null;
  return (
    <div className="rounded-xl border border-dashed border-cvr-gold-soft bg-[#fbf6ec] p-4 text-sm leading-relaxed text-cvr-body">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cvr-gold-ink">{tieuDe}</p>
      {children}
    </div>
  );
}
function Doi({ v, nam }: { v?: number; nam?: number }) {
  const dong = (x: number, nhan: string) => (
    <p className={`text-[13px] ${x >= 0 ? "text-[#1f8a4c]" : "text-[#c0392b]"}`}>{x >= 0 ? "▲" : "▼"} {vn(Math.abs(x))}% {nhan}</p>
  );
  if (v == null && nam == null) return null;
  return <div className="mt-0.5 grid gap-0.5">{v != null && dong(v, "Q-o-Q")}{nam != null && dong(nam, "Y-o-Y")}</div>;
}
function The({ nhan, giaTri, donVi, chinh, phu }: { nhan: string; giaTri: string; donVi?: string; chinh?: boolean; phu?: React.ReactNode }) {
  return (
    <div className={`rounded-xl p-4 ${chinh ? "bg-cvr-ink text-white" : "bg-cvr-surface"}`}>
      <p className={`text-[12.5px] ${chinh ? "text-white/70" : "text-cvr-muted"}`}>{nhan}</p>
      <p className={`mt-1 text-[26px] font-bold leading-tight tabular-nums ${chinh ? "text-white" : "text-cvr-ink"}`}>
        {giaTri}{donVi && <span className={`ml-1 text-[13px] font-medium ${chinh ? "text-white/70" : "text-cvr-muted"}`}>{donVi}</span>}
      </p>
      {phu}
    </div>
  );
}
function KhungBieuDo({ tieuDe, dvt, children }: { tieuDe: string; dvt: string; children: React.ReactNode }) {
  return (
    <figure className="min-w-0 rounded-xl border border-cvr-line p-4 [break-inside:avoid]">
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

// Căn hộ theo hạng (A · B · C): cột nguồn cung · tiêu thụ, dưới mỗi nhóm ghi giá trung bình (như DKRA)
function TheoHang({ d, dvGia }: { d: SoPhanKhuc["theoHang"]; dvGia: string }) {
  const max = Math.max(1, ...d.map((x) => Math.max(x.nguonCung ?? 0, x.tieuThu ?? 0))) * 1.2, H = 105, y0 = 125, nhom = 440 / d.length, bw = Math.min(30, nhom / 4);
  const Y = (v: number) => y0 - (v / max) * H;
  return (
    <svg viewBox="0 0 440 182" className="h-auto w-full" role="img" aria-label="Nguồn cung và tiêu thụ theo hạng căn hộ">
      <line x1={0} x2={440} y1={y0} y2={y0} stroke="#d2d2d7" />
      {d.map((x, i) => { const c = i * nhom + nhom / 2; return (
        <g key={x.hang}>
          {x.nguonCung != null && <><rect x={c - bw - 2} y={Y(x.nguonCung)} width={bw} height={y0 - Y(x.nguonCung)} rx={3} fill={XANH[0]} /><text x={c - bw / 2 - 2} y={Y(x.nguonCung) - 5} textAnchor="middle" {...chuSo}>{vn(x.nguonCung, 0)}</text></>}
          {x.tieuThu != null && <><rect x={c + 2} y={Y(x.tieuThu)} width={bw} height={y0 - Y(x.tieuThu)} rx={3} fill={VANG} /><text x={c + bw / 2 + 2} y={Y(x.tieuThu) - 5} textAnchor="middle" {...chuSo}>{vn(x.tieuThu, 0)}</text></>}
          <text x={c} y={y0 + 17} textAnchor="middle" {...chuSo}>{x.hang}</text>
          {x.giaTB != null && <text x={c} y={y0 + 33} textAnchor="middle" {...chu}>{vn(x.giaTB)} {dvGia}</text>}
          {x.tyLe != null && <text x={c} y={y0 + 48} textAnchor="middle" {...chu}>Tiêu thụ {vn(x.tyLe, 0)}%</text>}
        </g>); })}
    </svg>
  );
}
// Giá thứ cấp theo phường — lấy từ Lịch sử giá trên web: thanh ngang = giá phổ biến, bên phải là biến động so với quý trước
function GiaThuCap({ d }: { d: SoPhanKhuc["thuCap"] }) {
  const max = Math.max(1, ...d.map((x) => x.gia)), W = 210;
  return (
    <svg viewBox={`0 0 440 ${14 + d.length * 30}`} className="h-auto w-full" role="img" aria-label="Giá thứ cấp theo khu vực">
      {d.map((x, i) => { const y = 8 + i * 30; return (
        <g key={x.kv}>
          <text x={0} y={y + 13} {...chu}>{x.kv.replace(/^(Phường|Xã)\s*/, "")}</text>
          <rect x={130} y={y + 2} width={(x.gia / max) * W} height={16} rx={3} fill={XANH[1]} />
          <text x={136 + (x.gia / max) * W} y={y + 14} {...chuSo}>{vn(x.gia)}</text>
          {x.doi != null && <text x={440} y={y + 14} textAnchor="end" style={{ fontSize: 11, fontWeight: 600, fill: x.doi >= 0 ? "#1f8a4c" : "#c0392b" }}>{x.doi >= 0 ? "▲" : "▼"} {vn(Math.abs(x.doi))}%</text>}
        </g>); })}
    </svg>
  );
}

function PhanKhuc({ p, v }: { p: SoPhanKhuc; v: SoVung }) {
  const nd = v.nhanDinh[p.phanKhuc]?.length ? v.nhanDinh[p.phanKhuc] : nhanDinhTuSo(p);
  return (
    <section className="border-t border-cvr-line pb-6 pt-6 first-of-type:border-t-0 first-of-type:pt-0 print:break-before-page print:first-of-type:break-before-auto print:border-t-0 print:pt-0">
      <h3 className="mb-4 text-[19px] font-semibold tracking-tight text-cvr-ink [break-after:avoid]">{TEN_PHAN_KHUC[p.phanKhuc]}</h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 print:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1 print:[&>*:last-child:nth-child(odd)]:col-span-1">
        <The nhan="Thị trường sơ cấp" giaTri={vn(p.soDuAn, 0)} donVi="dự án" chinh />
        <The nhan="Nguồn cung sơ cấp" giaTri={vn(p.nguonCung, 0)} donVi={p.donVi} phu={<Doi v={p.doiCung} nam={p.doiCungNam} />} />
        <The nhan="Tiêu thụ sơ cấp" giaTri={vn(p.tieuThu, 0)} donVi={p.donVi} phu={<Doi v={p.doiTieuThu} nam={p.doiTieuThuNam} />} />
        <The nhan="Tỷ lệ tiêu thụ" giaTri={p.tyLe == null ? "—" : `${vn(p.tyLe)}%`} />
        {p.giaTB != null && <The nhan="Giá sơ cấp trung bình" giaTri={vn(p.giaTB)} donVi={p.donViGia} phu={<Doi v={p.bdSoCap} nam={p.doiGiaNam} />} />}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 print:grid-cols-2 lg:[&>*:last-child:nth-child(odd)]:col-span-2 print:[&>*:last-child:nth-child(odd)]:col-span-1">
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
        {p.theoHang.length ? (
          <KhungBieuDo tieuDe="Nguồn cung và tiêu thụ theo hạng căn hộ" dvt={`Đvt: ${p.donVi} · giá trung bình ${p.donViGia}`}>
            <TheoHang d={p.theoHang} dvGia={p.donViGia} /><ChuGiai ds={[[XANH[0], "Nguồn cung"], [VANG, "Tiêu thụ"]]} />
          </KhungBieuDo>
        ) : p.phanKhuc === "Căn hộ" ? <OCho tieuDe="Thiếu số liệu">Nguồn cung, tiêu thụ, giá theo hạng A · B · C (cột hang).</OCho> : null}
        {p.thuCap.length ? (
          <KhungBieuDo tieuDe="Giá thứ cấp một số khu vực" dvt={`Đvt: ${p.donViThuCap} · biến động Q-o-Q`}>
            <GiaThuCap d={p.thuCap} />
          </KhungBieuDo>
        ) : <OCho tieuDe="Giá thứ cấp">Lấy từ Lịch sử giá trên web khi phường đã có dãy giá quý này.</OCho>}
        {p.duAn.length ? (
          <KhungBieuDo tieuDe="Dự án chào bán trong quý" dvt="Chủ đầu tư · sản phẩm · giá công bố">
            <ul className="grid gap-2 text-sm">{p.duAn.slice(0, 8).map((d) => (
              <li key={d.ten}><b className="text-cvr-ink">{d.ten}</b>{d.chuDauTu ? ` · ${d.chuDauTu}` : ""}
                <span className="block text-xs text-cvr-muted">{[d.soDangChao != null && `${vn(d.soDangChao, 0)} ${p.donVi} đang chào`, d.giaTB != null && `giá ${vn(d.giaTB)} ${d.donViGia}`, d.chinhSach].filter(Boolean).join(" · ")}</span></li>))}</ul>
          </KhungBieuDo>
        ) : <OCho tieuDe="Dự án chào bán trong quý">Chưa có số liệu.</OCho>}
      </div>
      {nd.length > 0 && (
        <div className="mt-5 rounded-xl bg-cvr-surface p-4 [break-inside:avoid]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cvr-ink">Nhận định thị trường</p>
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
    <header className="mb-5 flex items-baseline gap-2.5 border-b border-cvr-line pb-3 [break-after:avoid]">
      <span className="text-[22px] font-bold leading-none text-cvr-gold tabular-nums sm:text-[26px]">{so}</span>
      <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-cvr-ink sm:text-[26px]">{ten}</h2>
    </header>
  );
}

export default function BaoCaoThiTruong({ vung, xemThu = false, vungDau }: { vung: SoVung[]; xemThu?: boolean; vungDau?: string }) {
  // KHU VỰC NÀO ĐỦ SỐ THÌ HIỆN (anh 13/11/2026) — trang công khai chỉ có tab khu vực đủ số; Admin xem trước hiện đủ 3 khu vực
  const coSo = xemThu ? vung : vung.filter((x) => x.du);
  const [chon, setChonGoc] = useState(vungDau ?? (coSo.find((x) => x.du) ?? coSo[0] ?? vung[0]).vung.id);
  // Trang công khai: mỗi khu vực một địa chỉ /diem-tin-thi-truong/<khu vực> (anh 14/11/2026) — bấm tab đổi địa chỉ theo, bấm menu sang trang khác thì tab theo
  useEffect(() => { if (vungDau) setChonGoc(vungDau); }, [vungDau]);
  const setChon = (id: string) => {
    setChonGoc(id);
    if (!xemThu && location.pathname.startsWith("/diem-tin-thi-truong")) history.pushState(null, "", `/diem-tin-thi-truong/${id}`);
  };
  // MENU "Điểm tin thị trường" → mục con khu vực (…#da-nang): mở đúng tab. Đọc # lúc mở trang + lúc bấm mục menu khi đang ở trang này
  // (chuyển trang trong Next không phát sự kiện hashchange nên bắt cú bấm liên kết có #<khu vực>).
  useEffect(() => {
    const ids = coSo.map((x) => x.vung.id);
    const theoHash = (h: string) => { const id = h.replace(/^#/, ""); if (ids.includes(id)) { setChonGoc(id); if (!xemThu && location.pathname.startsWith("/diem-tin-thi-truong")) history.replaceState(null, "", `/diem-tin-thi-truong/${id}`); return true; } return false; };
    theoHash(location.hash);
    const bam = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (a && a.pathname === location.pathname && theoHash(a.hash)) requestAnimationFrame(() => document.querySelector(".bao-cao")?.scrollIntoView({ block: "start" }));
    };
    document.addEventListener("click", bam, true);
    return () => document.removeEventListener("click", bam, true);
  }, [coSo.map((x) => x.vung.id).join()]); // eslint-disable-line react-hooks/exhaustive-deps -- so theo danh sách khu vực
  if (!coSo.length) return <p className="text-base text-cvr-muted">Báo cáo đang được cập nhật.</p>;
  const v = coSo.find((x) => x.vung.id === chon) ?? coSo[0];
  const chuaCo = !v.phanKhuc.length && !xemThu;
  const q = tenQuy(v.quy), qSau = tenQuy(quySau(v.quy));
  const dn = diemNhan(v);
  // CHƯƠNG NÀO CÓ SỐ MỚI HIỆN (anh 13/11/2026: "cái nào có số liệu thì hiện") — đánh số lại theo chương đang hiện
  const chuong = [
    { id: "kinh-te", ten: `Kinh tế – Xã hội ${q}`, co: xemThu || !!(v.kinhTe.length || v.chinhSach.length || v.haTang.length) },
    { id: "dien-bien", ten: `Diễn biến thị trường ${q}`, co: xemThu || v.phanKhuc.length > 0 },
    { id: "du-bao", ten: `Dự báo thị trường ${qSau}`, co: v.phanKhuc.length > 0 },
  ].filter((c) => c.co).map((c, i) => ({ ...c, so: String(i + 1).padStart(2, "0") + "." }));
  const soCua = (id: string) => chuong.find((c) => c.id === id);
  const diemHaTang: DiemHaTang[] = v.haTang.flatMap((h, i) => { const t = docToaDo(h.toaDo); return t ? [{ so: i + 1, ten: h.ten, ...t }] : []; });
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
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-cvr-ink sm:text-[32px]">Điểm tin thị trường {v.vung.ten}</h1>
          <p className="mt-2 text-base text-cvr-muted">Báo cáo khu vực này đang được cập nhật.</p>
        </div>
      ) : (<>
      <div className="mt-6 border-b border-cvr-line pb-5">
        <p className="text-[13px] font-semibold tracking-[0.18em] text-cvr-ink">COASTAL <span className="text-cvr-gold">LAND</span> · ĐIỂM TIN THỊ TRƯỜNG</p>
        <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-cvr-ink sm:text-[32px]">Điểm tin thị trường {v.vung.ten}</h1>
        <p className="mt-1 text-sm font-medium text-cvr-muted">Quý {q.replace(/^Q/, "")}</p>
        {dn.length > 0 && (
          <div className="mt-4 rounded-2xl bg-cvr-surface p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cvr-gold-ink">Điểm nhấn quý</p>
            <ul className="mt-2 grid max-w-[80ch] list-disc gap-1.5 pl-5 text-[15px] text-cvr-ink marker:text-cvr-gold">{dn.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        )}
        <nav aria-label="Mục lục" className="mt-4 grid gap-1 text-sm sm:grid-cols-3">
          {chuong.map((c) => <a key={c.id} href={`#${c.id}`} className="text-cvr-ink"><b className="text-cvr-gold">{c.so}</b> {c.ten}</a>)}
        </nav>
      </div>

      {soCua("kinh-te") && <section id="kinh-te" className="scroll-mt-24 pt-9 pb-2">
        <TieuDeChuong so={soCua("kinh-te")!.so} ten={soCua("kinh-te")!.ten} />
        <h3 className="mb-2.5 text-[17px] font-semibold text-cvr-ink">Chỉ số kinh tế</h3>
        {v.kinhTe.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">{v.kinhTe.map((k) => (
            <div key={k.tinh + k.chiSo} className="rounded-xl bg-cvr-surface p-4">
              <p className="text-sm font-semibold text-cvr-ink">{k.chiSo} <span className="font-normal text-cvr-muted">· {k.tinh}</span></p>
              <p className="mt-1 text-[26px] font-bold leading-tight tabular-nums text-cvr-ink">{k.giaTri}<span className="ml-1 text-[13px] font-medium text-cvr-muted">{k.donVi}</span></p>
              {k.caNuoc && <p className="text-[13px] text-cvr-muted">Cả nước: {k.caNuoc}</p>}
              {k.soCungKy && <p className="text-[13px] text-cvr-body">{k.soCungKy} Y-o-Y</p>}
              <p className="mt-1 text-[11px] text-cvr-faint">{k.ky}</p>
            </div>))}</div>
        ) : <OCho tieuDe="Chưa có số liệu">GRDP · FDI · CPI · du lịch.</OCho>}
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2 print:grid-cols-2">
          <div>
            <h3 className="mb-2.5 text-[17px] font-semibold text-cvr-ink">Chính sách – Pháp lý</h3>
            {v.chinhSach.length ? <ol className="grid gap-3 text-sm">{v.chinhSach.map((b) => (
              <li key={b.soHieu} className="rounded-xl border border-cvr-line p-3"><b className="text-cvr-ink">{b.soHieu}</b> <span className="text-cvr-muted">· {b.ngay}{b.coQuan ? ` · ${b.coQuan}` : ""}</span>
                <span className="block text-cvr-body">{b.noiDung}{b.hieuLuc ? ` Hiệu lực ${b.hieuLuc}.` : ""}</span></li>))}</ol>
              : <OCho tieuDe="Chưa có số liệu">Văn bản ban hành trong quý.</OCho>}
          </div>
          <div>
            <h3 className="mb-2.5 text-[17px] font-semibold text-cvr-ink">Hạ tầng giao thông</h3>
            {v.haTang.length ? (<>
              {diemHaTang.length > 0 && <div className="mb-3"><BanDoHaTang diem={diemHaTang} /></div>}
              <ol className="grid gap-3 text-sm">{v.haTang.map((h, i) => (
                <li key={h.ten} className="flex gap-3 rounded-xl border border-cvr-line p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cvr-ink text-xs font-semibold text-white">{i + 1}</span>
                  <span><b className="text-cvr-ink">{h.ten}</b> <span className="text-cvr-muted">· {h.moc}{h.ngay ? ` ${h.ngay}` : ""}{h.von ? ` · ${h.von}` : ""}</span>
                  <span className="block text-cvr-body">{h.noiDung}</span></span></li>))}</ol>
            </>) : <OCho tieuDe="Chưa có số liệu">Công trình khởi công, thông xe, khánh thành trong quý (kèm toạ độ để hiện trên bản đồ).</OCho>}
          </div>
        </div>
      </section>}

      {soCua("dien-bien") && <section id="dien-bien" className="scroll-mt-24 pt-9 pb-2 print:break-before-page print:pt-0">
        <TieuDeChuong so={soCua("dien-bien")!.so} ten={soCua("dien-bien")!.ten} />
        {v.phanKhuc.length ? v.phanKhuc.map((p) => <PhanKhuc key={p.phanKhuc} p={p} v={v} />)
          : <OCho tieuDe="Chưa có số liệu">Nguồn cung, tiêu thụ, giá sơ cấp theo phân khúc.</OCho>}
      </section>}

      {soCua("du-bao") && <section id="du-bao" className="scroll-mt-24 pt-9 pb-2 [break-inside:avoid]">
        <TieuDeChuong so={soCua("du-bao")!.so} ten={soCua("du-bao")!.ten} />
        <div className="grid gap-4">{v.phanKhuc.map((p) => {
          const cuaAnh = v.duBao.filter((d) => !d.phanKhuc || d.phanKhuc === p.phanKhuc || TEN_PHAN_KHUC[p.phanKhuc].includes(d.phanKhuc)).map((d) => d.noiDung);
          const ds = cuaAnh.length ? cuaAnh : duBaoTuSo(p, []);
          return ds.length ? (
            <div key={p.phanKhuc}>
              <p className="mb-1 font-semibold text-cvr-ink">{TEN_PHAN_KHUC[p.phanKhuc]}</p>
              <ul className="grid max-w-[72ch] list-disc gap-1.5 pl-5 text-[15px] leading-relaxed text-cvr-body marker:text-cvr-gold">{ds.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ) : null; })}</div>
      </section>}

      <footer className="mt-4 grid max-w-[80ch] gap-1.5 border-t border-cvr-line pt-4 text-[13px] text-cvr-muted">
        <p className="font-semibold text-cvr-ink">Nguồn</p>
        {/* Nguồn: Coastal Land (anh 14/11/2026: không ghi tên đơn vị khác) */}
        <p>Coastal Land tổng hợp và báo cáo. Q-o-Q: so với quý trước · Y-o-Y: so với cùng kỳ năm trước.</p>
      </footer>
      </>)}
    </div>
    </XemThu.Provider>
  );
}
