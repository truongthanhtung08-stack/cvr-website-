"use client";

import { useMemo, useState } from "react";

// ============================================================================
// CÔNG CỤ TÍNH LÃI VAY MUA NHÀ — đặc tả docs/CONG-CU-TINH-LAI-VAY.md (15/10/2026)
// Học Techcombank (giá trị BĐS, tỷ lệ vay, thời hạn, lãi suất, ngày giải ngân, bảng trả nợ)
// + đúng cách vay mua nhà ở VN: lãi ưu đãi vài năm đầu rồi thả nổi; hai cách trả.
// Tính trên máy khách — không gọi máy chủ.
// ============================================================================

type CachTra = "giam-dan" | "deu";
type Ky = { ky: number; thang: string; duNo: number; goc: number; lai: number; tong: number };

const dong = (n: number) => Math.round(n).toLocaleString("vi-VN");
const soTu = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;
const thapPhan = (s: string) => Number(s.replace(",", ".")) || 0;

function lichTra(soVay: number, soKy: number, laiUuDai: number, kyUuDai: number, laiSau: number, cach: CachTra, batDau: Date): Ky[] {
  const ds: Ky[] = [];
  if (soVay <= 0 || soKy <= 0) return ds;
  let duNo = soVay;
  let khoanDeu = 0;
  for (let k = 1; k <= soKy; k++) {
    const i = (k <= kyUuDai ? laiUuDai : laiSau) / 100 / 12;
    const lai = duNo * i;
    let goc: number;
    if (cach === "giam-dan") {
      goc = soVay / soKy;
    } else {
      // Tính lại khoản trả đều ở kỳ đầu và lúc đổi lãi suất (hết ưu đãi)
      if (k === 1 || k === kyUuDai + 1) {
        const con = soKy - k + 1;
        khoanDeu = i === 0 ? duNo / con : (duNo * i) / (1 - Math.pow(1 + i, -con));
      }
      goc = khoanDeu - lai;
    }
    if (k === soKy) goc = duNo; // kỳ cuối trả hết gốc còn lại
    const t = new Date(batDau.getFullYear(), batDau.getMonth() + k, 1);
    ds.push({ ky: k, thang: `${t.getMonth() + 1}/${t.getFullYear()}`, duNo, goc, lai, tong: goc + lai });
    duNo -= goc;
  }
  return ds;
}

export default function TinhLaiVay() {
  const homNay = new Date();
  const [giaTri, setGiaTri] = useState("");
  const [tyLe, setTyLe] = useState(70);
  const [soVayNhap, setSoVayNhap] = useState("2.000.000.000");
  const [nam, setNam] = useState("20");
  const [laiUuDai, setLaiUuDai] = useState("7,5");
  const [thangUuDai, setThangUuDai] = useState("24");
  const [laiSau, setLaiSau] = useState("10,5");
  const [cach, setCach] = useState<CachTra>("giam-dan");
  const [giaiNgan, setGiaiNgan] = useState(`${homNay.getFullYear()}-${String(homNay.getMonth() + 1).padStart(2, "0")}`);
  const [moNam, setMoNam] = useState<number | null>(1);

  const giaTriSo = soTu(giaTri);
  const soVay = giaTriSo > 0 ? Math.round((giaTriSo * tyLe) / 100) : soTu(soVayNhap);
  const soKy = Math.min(35, Math.max(1, Math.round(thapPhan(nam)))) * 12;
  const kyUuDai = Math.min(soKy, Math.max(0, Math.round(thapPhan(thangUuDai))));

  const lich = useMemo(() => {
    const [y, m] = giaiNgan.split("-").map(Number);
    return lichTra(soVay, soKy, thapPhan(laiUuDai), kyUuDai, thapPhan(laiSau), cach, new Date(y || new Date().getFullYear(), (m || 1) - 1, 1));
  }, [soVay, soKy, laiUuDai, kyUuDai, laiSau, cach, giaiNgan]);

  const tongLai = lich.reduce((s, k) => s + k.lai, 0);
  const caoNhat = lich.reduce<Ky | null>((a, k) => (!a || k.tong > a.tong + 0.5 ? k : a), null);
  const theoNam = useMemo(() => {
    const g: Ky[][] = [];
    lich.forEach((k, idx) => { (g[Math.floor(idx / 12)] ??= []).push(k); });
    return g;
  }, [lich]);

  const o = "h-11 w-full rounded-lg border border-cvr-line bg-white px-3 text-[15px] text-cvr-ink outline-none transition focus:border-cvr-ink";
  const nhan = "mb-1.5 block text-[13px] font-medium text-cvr-body";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={nhan}>Giá trị bất động sản (đồng)</span>
          <input inputMode="numeric" className={o} value={giaTri} placeholder="Không bắt buộc"
            onChange={(e) => setGiaTri(soTu(e.target.value) ? dong(soTu(e.target.value)) : "")} />
        </label>
        {giaTriSo > 0 ? (
          <label className="block">
            <span className={nhan}>Tỷ lệ vay: {tyLe}% · Số tiền vay {dong(soVay)} đ</span>
            <input type="range" min={10} max={100} step={5} value={tyLe} onChange={(e) => setTyLe(Number(e.target.value))} className="mt-3 w-full accent-[var(--color-cvr-blue,#0071e3)]" />
          </label>
        ) : (
          <label className="block">
            <span className={nhan}>Số tiền vay (đồng)</span>
            <input inputMode="numeric" className={o} value={soVayNhap} onChange={(e) => setSoVayNhap(soTu(e.target.value) ? dong(soTu(e.target.value)) : "")} />
          </label>
        )}
        <label className="block">
          <span className={nhan}>Thời hạn vay (năm)</span>
          <input inputMode="numeric" className={o} value={nam} onChange={(e) => setNam(e.target.value.replace(/[^\d]/g, ""))} />
        </label>
        <label className="block">
          <span className={nhan}>Tháng giải ngân</span>
          <input type="month" className={o} value={giaiNgan} onChange={(e) => setGiaiNgan(e.target.value)} />
        </label>
        <label className="block">
          <span className={nhan}>Lãi suất ưu đãi (%/năm)</span>
          <input inputMode="decimal" className={o} value={laiUuDai} onChange={(e) => setLaiUuDai(e.target.value)} />
        </label>
        <label className="block">
          <span className={nhan}>Thời gian ưu đãi (tháng)</span>
          <input inputMode="numeric" className={o} value={thangUuDai} onChange={(e) => setThangUuDai(e.target.value.replace(/[^\d]/g, ""))} />
        </label>
        <label className="block">
          <span className={nhan}>Lãi suất sau ưu đãi (%/năm)</span>
          <input inputMode="decimal" className={o} value={laiSau} onChange={(e) => setLaiSau(e.target.value)} />
        </label>
        <div>
          <span className={nhan}>Cách trả</span>
          <div className="grid grid-cols-2 gap-2">
            {([["giam-dan", "Dư nợ giảm dần"], ["deu", "Trả đều hằng tháng"]] as const).map(([v, t]) => (
              <button key={v} type="button" onClick={() => setCach(v)}
                className={`h-11 rounded-lg border text-sm font-medium transition ${cach === v ? "border-cvr-ink bg-cvr-ink text-white" : "border-cvr-line bg-white text-cvr-body hover:border-cvr-ink"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {lich.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Trả tháng đầu", `${dong(lich[0].tong)} đ`],
              ["Trả cao nhất", caoNhat ? `${dong(caoNhat.tong)} đ · kỳ ${caoNhat.ky}` : "—"],
              ["Tổng lãi phải trả", `${dong(tongLai)} đ`],
              ["Tổng gốc + lãi", `${dong(soVay + tongLai)} đ`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-cvr-line bg-white p-4">
                <p className="text-xs text-cvr-muted">{k}</p>
                <p className="mt-1 text-[17px] font-semibold tracking-tight text-cvr-ink">{v}</p>
              </div>
            ))}
            {giaTriSo > 0 && (
              <div className="col-span-2 rounded-xl border border-cvr-line bg-white p-4 lg:col-span-4">
                <p className="text-xs text-cvr-muted">Vốn tự có</p>
                <p className="mt-1 text-[17px] font-semibold tracking-tight text-cvr-ink">{dong(giaTriSo - soVay)} đ</p>
              </div>
            )}
          </div>

          <p className="text-[13px] text-cvr-muted">Kết quả để tham khảo, tính theo lãi suất năm chia 12 tháng; số tiền thực tế theo hợp đồng với ngân hàng.</p>

          <div className="overflow-hidden rounded-xl border border-cvr-line bg-white">
            {theoNam.map((nhom, i) => (
              <div key={i} className="border-b border-cvr-line last:border-0">
                <button type="button" onClick={() => setMoNam(moNam === i + 1 ? null : i + 1)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-cvr-ink hover:bg-cvr-surface">
                  <span>Năm {i + 1}</span>
                  <span className="font-normal text-cvr-muted">{dong(nhom.reduce((s, k) => s + k.tong, 0))} đ</span>
                </button>
                {moNam === i + 1 && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-right text-[13px]">
                      <thead className="bg-cvr-surface text-cvr-muted">
                        <tr>
                          {["Kỳ", "Tháng", "Dư nợ đầu kỳ", "Gốc", "Lãi", "Tổng phải trả"].map((h) => <th key={h} className="px-3 py-2 font-medium first:text-left">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {nhom.map((k) => (
                          <tr key={k.ky} className="border-t border-cvr-line/60 text-cvr-body">
                            <td className="px-3 py-2 text-left">{k.ky}</td>
                            <td className="px-3 py-2">{k.thang}</td>
                            <td className="px-3 py-2">{dong(k.duNo)}</td>
                            <td className="px-3 py-2">{dong(k.goc)}</td>
                            <td className="px-3 py-2">{dong(k.lai)}</td>
                            <td className="px-3 py-2 font-medium text-cvr-ink">{dong(k.tong)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
