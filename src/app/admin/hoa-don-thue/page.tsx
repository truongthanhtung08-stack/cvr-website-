"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { vnd } from "@/lib/billing";
import { THUE_SUAT_GTGT, khoangQuy } from "@/lib/thue";

// ============================================================================
// ADMIN — HÓA ĐƠN & BÁO CÁO THUẾ
// ----------------------------------------------------------------------------
// Gom số liệu cả quý rồi bày ra ĐÚNG CHỈ TIÊU của Tờ khai thuế GTGT mẫu 01/GTGT
// để chép thẳng vào eTax, kèm nút tải CSV về chỉnh tay nếu cần.
//
// NGUỒN SỐ LIỆU:
//   · Đầu ra  = bảng `doanh_thu`   — web tự ghi khi tin được duyệt (khách dùng gói)
//   · Đầu vào = bảng `hoa_don_vao` — nhập tay ở ngay trang này (hóa đơn mua vào)
//
// ⚠️ Hóa đơn nước ngoài (Vercel/Supabase/Anthropic) KHÔNG có thuế GTGT Việt Nam
//    → nhập tiền thuế = 0 và bỏ tick "được khấu trừ". Chúng chỉ là chi phí TNDN.
//
// ⚠️ Thuế suất 8% theo Nghị quyết 204/2025/QH15 áp dụng đến hết 31/12/2026.
//    Kỳ có thuế suất giảm thường phải nộp kèm phụ lục giảm thuế GTGT — kiểm tra
//    lại trên eTax trước khi nộp, đừng chép mù các con số dưới đây.
// ============================================================================

type DongDoanhThu = {
  id: string;
  ngay_ghi_nhan: string;
  mo_ta: string;
  tien_hang: number;
  tien_thue: number;
  tong_tra: number;
  hoa_don_loai: string;
  hoa_don_so: string | null;
  hoa_don_trang_thai: string;
  ten_nguoi_mua: string | null;
  mst_nguoi_mua: string | null;
};

type DongVao = {
  id: string;
  ngay_hoa_don: string;
  so_hoa_don: string | null;
  nha_cung_cap: string;
  mst: string | null;
  dien_giai: string | null;
  tien_hang: number;
  tien_thue: number;
  duoc_khau_tru: boolean;
};

const HOM_NAY = new Date();

export default function AdminThuePage() {
  const [nam, setNam] = useState(HOM_NAY.getFullYear());
  const [quy, setQuy] = useState(Math.floor(HOM_NAY.getMonth() / 3) + 1);
  const [ra, setRa] = useState<DongDoanhThu[] | null>(null);
  const [vao, setVao] = useState<DongVao[] | null>(null);
  const [loi, setLoi] = useState("");

  const { tu, den } = useMemo(() => khoangQuy(nam, quy), [nam, quy]);

  const nap = useCallback(async () => {
    setLoi("");
    const supabase = createClient();

    const r1 = await supabase
      .from("doanh_thu")
      .select("id,ngay_ghi_nhan,mo_ta,tien_hang,tien_thue,tong_tra,hoa_don_loai,hoa_don_so,hoa_don_trang_thai,ten_nguoi_mua,mst_nguoi_mua")
      .gte("ngay_ghi_nhan", tu.toISOString())
      .lte("ngay_ghi_nhan", den.toISOString())
      .order("ngay_ghi_nhan", { ascending: true });

    const r2 = await supabase
      .from("hoa_don_vao")
      .select("id,ngay_hoa_don,so_hoa_don,nha_cung_cap,mst,dien_giai,tien_hang,tien_thue,duoc_khau_tru")
      .gte("ngay_hoa_don", ngayISO(tu))
      .lte("ngay_hoa_don", ngayISO(den))
      .order("ngay_hoa_don", { ascending: true });

    // Chưa chạy migration 0017 → bảng chưa tồn tại. Báo bằng tiếng người.
    if (r1.error || r2.error) {
      const msg = r1.error?.message || r2.error?.message || "";
      setLoi(
        /does not exist|schema cache/i.test(msg)
          ? "Chưa có bảng dữ liệu. Vào Supabase → SQL Editor → chạy file supabase/migrations/0017_goi_tin_va_doanh_thu.sql rồi tải lại trang."
          : msg,
      );
      setRa([]);
      setVao([]);
      return;
    }
    setRa((r1.data ?? []) as DongDoanhThu[]);
    setVao((r2.data ?? []) as DongVao[]);
  }, [tu, den]);

  useEffect(() => {
    void nap();
  }, [nap]);

  // ── Cộng sổ ───────────────────────────────────────────────────────────────
  const t = useMemo(() => {
    const dsRa = ra ?? [];
    const dsVao = vao ?? [];
    const dtChuaThue = dsRa.reduce((s, d) => s + Number(d.tien_hang || 0), 0);
    const thueRa = dsRa.reduce((s, d) => s + Number(d.tien_thue || 0), 0);
    const khauTru = dsVao.filter((d) => d.duoc_khau_tru);
    const hangVao = khauTru.reduce((s, d) => s + Number(d.tien_hang || 0), 0);
    const thueVao = khauTru.reduce((s, d) => s + Number(d.tien_thue || 0), 0);
    // Chi phí tính thuế TNDN gồm CẢ hóa đơn không được khấu trừ GTGT (vd nước ngoài)
    const tongChiPhi = dsVao.reduce((s, d) => s + Number(d.tien_hang || 0), 0);
    const phaiNop = thueRa - thueVao;
    const loiNhuan = dtChuaThue - tongChiPhi;
    return {
      dtChuaThue,
      thueRa,
      hangVao,
      thueVao,
      tongChiPhi,
      phaiNop,
      loiNhuan,
      // Doanh thu ≤ 3 tỷ/năm → 15% (Luật Thuế TNDN 67/2025/QH15)
      tamNopTndn: Math.max(0, Math.round(loiNhuan * 0.15)),
      soGiaoDich: dsRa.length,
    };
  }, [ra, vao]);

  const nhan = `Quý ${quy}/${nam}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Hóa đơn &amp; báo cáo thuế</h1>
        <p className="mt-1 text-sm text-cvr-muted">
          Số liệu gom theo quý, bày đúng chỉ tiêu Tờ khai 01/GTGT để chép vào eTax.
        </p>
        {/* Thông tin khai thuế — theo Thông báo của Phòng ĐKKD, Sở Tài chính TP Đà Nẵng.
            Để ở admin, KHÔNG đưa ra trang công khai. */}
        <p className="mt-2 text-xs text-cvr-muted">
          Người nộp thuế: <strong className="font-semibold text-cvr-ink">CÔNG TY TNHH BẤT ĐỘNG SẢN COASTAL LAND</strong>
          {" · "}MST <strong className="font-semibold text-cvr-ink">0402353502</strong>
          {" · "}Cơ quan thuế quản lý trực tiếp:{" "}
          <strong className="font-semibold text-cvr-ink">Thuế cơ sở 4 thành phố Đà Nẵng</strong>
        </p>
      </div>

      {/* Chọn kỳ */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cvr-body">Quý</span>
          <select value={quy} onChange={(e) => setQuy(Number(e.target.value))} className={inp}>
            {[1, 2, 3, 4].map((q) => (
              <option key={q} value={q}>Quý {q}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cvr-body">Năm</span>
          <select value={nam} onChange={(e) => setNam(Number(e.target.value))} className={inp}>
            {[HOM_NAY.getFullYear() - 1, HOM_NAY.getFullYear(), HOM_NAY.getFullYear() + 1].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <p className="pb-2 text-sm text-cvr-muted">
          {tu.toLocaleDateString("vi-VN")} – {den.toLocaleDateString("vi-VN")}
        </p>
      </div>

      {loi && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{loi}</div>
      )}

      {/* ── TỜ KHAI 01/GTGT ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-cvr-ink">Tờ khai thuế GTGT — mẫu 01/GTGT · {nhan}</h2>
          <button onClick={() => taiCsv(`to-khai-01GTGT-Q${quy}-${nam}.csv`, csvToKhai(t, nhan))} className={btnPhu}>
            Tải CSV
          </button>
        </div>

        <table className="mt-4 w-full border-collapse text-sm">
          <tbody>
            <ChiTieu ma="23" ten="Giá trị hàng hóa, dịch vụ mua vào" tien={t.hangVao} />
            <ChiTieu ma="24" ten="Thuế GTGT của hàng hóa, dịch vụ mua vào" tien={t.thueVao} />
            <ChiTieu ma="25" ten="Tổng số thuế GTGT được khấu trừ kỳ này" tien={t.thueVao} dam />
            <ChiTieu
              ma="32"
              ten={`Doanh thu hàng hóa, dịch vụ bán ra chịu thuế (thuế suất ${(THUE_SUAT_GTGT * 100).toFixed(0)}%)`}
              tien={t.dtChuaThue}
            />
            <ChiTieu ma="33" ten="Thuế GTGT của hàng hóa, dịch vụ bán ra" tien={t.thueRa} />
            <ChiTieu ma="34" ten="Tổng doanh thu hàng hóa, dịch vụ bán ra chịu thuế" tien={t.dtChuaThue} dam />
            <ChiTieu ma="35" ten="Tổng số thuế GTGT của hàng hóa, dịch vụ bán ra" tien={t.thueRa} dam />
            <ChiTieu ma="36" ten="Thuế GTGT phát sinh trong kỳ  ([35] − [25])" tien={t.phaiNop} dam />
            <tr className="border-t-2 border-cvr-ink">
              <td className="py-3 pr-3 text-sm font-semibold text-cvr-ink" colSpan={2}>
                {t.phaiNop >= 0 ? "[40] THUẾ GTGT CÒN PHẢI NỘP" : "[43] THUẾ GTGT CÒN ĐƯỢC KHẤU TRỪ CHUYỂN KỲ SAU"}
              </td>
              <td className="py-3 text-right text-base font-bold text-cvr-ink">{vnd(Math.abs(t.phaiNop))}</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-4 rounded-lg bg-cvr-surface px-3 py-2.5 text-xs leading-relaxed text-cvr-muted">
          Thuế suất {(THUE_SUAT_GTGT * 100).toFixed(0)}% theo Nghị quyết 204/2025/QH15 (áp dụng đến hết 31/12/2026).
          Kỳ áp dụng thuế suất giảm thường phải nộp kèm <strong>phụ lục giảm thuế GTGT</strong> — kiểm tra lại
          trên eTax trước khi nộp. Đây là số liệu tổng hợp, không thay thế tờ khai chính thức.
        </p>
      </div>

      {/* ── TẠM NỘP TNDN ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-cvr-ink">Tạm nộp thuế TNDN · {nhan}</h2>
        <table className="mt-4 w-full border-collapse text-sm">
          <tbody>
            <ChiTieu ma="" ten="Doanh thu chưa thuế trong kỳ" tien={t.dtChuaThue} />
            <ChiTieu ma="" ten="Chi phí có hóa đơn trong kỳ" tien={t.tongChiPhi} />
            <ChiTieu ma="" ten="Lợi nhuận trước thuế" tien={t.loiNhuan} dam />
            <tr className="border-t-2 border-cvr-ink">
              <td className="py-3 pr-3 text-sm font-semibold text-cvr-ink" colSpan={2}>TẠM NỘP TNDN (15%)</td>
              <td className="py-3 text-right text-base font-bold text-cvr-ink">{vnd(t.tamNopTndn)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4 rounded-lg bg-cvr-surface px-3 py-2.5 text-xs leading-relaxed text-cvr-muted">
          Thuế suất 15% áp dụng cho doanh nghiệp có tổng doanh thu năm không quá 3 tỷ đồng
          (Luật Thuế TNDN 67/2025/QH15). Đây là số <strong>tạm nộp quý</strong> — quyết toán năm
          làm lại theo sổ sách đầy đủ, gồm cả chi phí chưa có trong bảng này (lương, khấu hao…).
        </p>
      </div>

      {/* ── BẢNG KÊ ĐẦU RA ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-cvr-ink">
            Bảng kê hóa đơn đầu ra — {t.soGiaoDich} giao dịch
          </h2>
          <button onClick={() => taiCsv(`bang-ke-dau-ra-Q${quy}-${nam}.csv`, csvDauRa(ra ?? []))} className={btnPhu}>
            Tải CSV
          </button>
        </div>
        {!ra ? (
          <p className="mt-3 text-sm text-cvr-muted">Đang tải…</p>
        ) : ra.length === 0 ? (
          <p className="mt-3 text-sm text-cvr-muted">Chưa có giao dịch nào trong kỳ này.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
                  <th className="py-2 pr-3 font-medium">Ngày</th>
                  <th className="py-2 pr-3 font-medium">Nội dung</th>
                  <th className="py-2 pr-3 font-medium">Người mua</th>
                  <th className="py-2 pr-3 text-right font-medium">Tiền hàng</th>
                  <th className="py-2 pr-3 text-right font-medium">Thuế GTGT</th>
                  <th className="py-2 font-medium">Hóa đơn</th>
                </tr>
              </thead>
              <tbody>
                {ra.map((d) => (
                  <tr key={d.id} className="border-b border-cvr-line/60">
                    <td className="py-2 pr-3 whitespace-nowrap text-cvr-body">{ngayVn(d.ngay_ghi_nhan)}</td>
                    <td className="py-2 pr-3 text-cvr-body">{d.mo_ta}</td>
                    <td className="py-2 pr-3 text-cvr-body">
                      {d.mst_nguoi_mua ? `${d.ten_nguoi_mua ?? ""} · ${d.mst_nguoi_mua}` : "Khách lẻ không lấy hóa đơn"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-cvr-ink">{vnd(d.tien_hang)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-cvr-ink">{vnd(d.tien_thue)}</td>
                    <td className="py-2 text-xs text-cvr-muted">
                      {d.hoa_don_so
                        ? d.hoa_don_so
                        : d.hoa_don_loai === "rieng"
                          ? "Chờ xuất riêng"
                          : "Gom hóa đơn tổng"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── HÓA ĐƠN CHỜ PHÁT HÀNH ───────────────────────────────────────── */}
      <KhoiXuatHoaDon onSaved={nap} />

      {/* ── HÓA ĐƠN MUA VÀO ─────────────────────────────────────────────── */}
      <KhoiHoaDonVao rows={vao} onSaved={nap} />
    </div>
  );
}

// ── Nhập hóa đơn mua vào ────────────────────────────────────────────────────
function KhoiHoaDonVao({ rows, onSaved }: { rows: DongVao[] | null; onSaved: () => void }) {
  const [mo, setMo] = useState(false);
  const [f, setF] = useState({
    ngay_hoa_don: ngayISO(new Date()),
    so_hoa_don: "",
    nha_cung_cap: "",
    mst: "",
    dien_giai: "",
    tien_hang: "",
    tien_thue: "",
    duoc_khau_tru: true,
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function luu(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nha_cung_cap.trim()) return setNotice("Chưa điền nhà cung cấp.");
    setSaving(true);
    setNotice("");
    const supabase = createClient();
    const { error } = await supabase.from("hoa_don_vao").insert({
      ngay_hoa_don: f.ngay_hoa_don,
      so_hoa_don: f.so_hoa_don.trim() || null,
      nha_cung_cap: f.nha_cung_cap.trim(),
      mst: f.mst.trim() || null,
      dien_giai: f.dien_giai.trim() || null,
      tien_hang: Math.round(Number(f.tien_hang) || 0),
      tien_thue: Math.round(Number(f.tien_thue) || 0),
      duoc_khau_tru: f.duoc_khau_tru,
    });
    setSaving(false);
    if (error) return setNotice("Lưu thất bại: " + error.message);
    setF({ ...f, so_hoa_don: "", nha_cung_cap: "", mst: "", dien_giai: "", tien_hang: "", tien_thue: "" });
    setNotice("Đã lưu ✓");
    onSaved();
  }

  const tong = (rows ?? []).reduce((s, d) => s + Number(d.tien_thue || 0), 0);

  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-cvr-ink">
          Hóa đơn mua vào — thuế được khấu trừ {vnd(tong)}
        </h2>
        <button onClick={() => setMo((v) => !v)} className={btnPhu}>
          {mo ? "Đóng" : "+ Nhập tay"}
        </button>
      </div>

      <KhoiTaiXml onSaved={onSaved} />

      {mo && (
        <form onSubmit={luu} className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-cvr-surface p-4 sm:grid-cols-3">
          <L label="Ngày hóa đơn">
            <input type="date" value={f.ngay_hoa_don} onChange={(e) => setF({ ...f, ngay_hoa_don: e.target.value })} className={inp} />
          </L>
          <L label="Số hóa đơn">
            <input value={f.so_hoa_don} onChange={(e) => setF({ ...f, so_hoa_don: e.target.value })} className={inp} />
          </L>
          <L label="Nhà cung cấp *">
            <input value={f.nha_cung_cap} onChange={(e) => setF({ ...f, nha_cung_cap: e.target.value })} className={inp} placeholder="PA Vietnam / Vercel…" />
          </L>
          <L label="Mã số thuế">
            <input value={f.mst} onChange={(e) => setF({ ...f, mst: e.target.value })} className={inp} />
          </L>
          <L label="Tiền hàng (chưa thuế)">
            <input value={f.tien_hang} onChange={(e) => setF({ ...f, tien_hang: e.target.value })} className={inp} inputMode="numeric" placeholder="5000000" />
          </L>
          <L label="Tiền thuế GTGT">
            <input value={f.tien_thue} onChange={(e) => setF({ ...f, tien_thue: e.target.value })} className={inp} inputMode="numeric" placeholder="400000" />
          </L>
          <L label="Diễn giải">
            <input value={f.dien_giai} onChange={(e) => setF({ ...f, dien_giai: e.target.value })} className={inp} placeholder="Gia hạn tên miền coastalland.vn" />
          </L>
          <label className="flex items-end gap-2 pb-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={f.duoc_khau_tru}
              onChange={(e) => setF({ ...f, duoc_khau_tru: e.target.checked })}
              className="h-4 w-4 accent-cvr-ink"
            />
            <span className="text-sm text-cvr-body">
              Được khấu trừ GTGT <span className="text-cvr-muted">(bỏ tick với hóa đơn nước ngoài — Vercel, Supabase, Anthropic…)</span>
            </span>
          </label>
          <div className="sm:col-span-3">
            {notice && <p className="mb-2 text-sm text-cvr-body">{notice}</p>}
            <button type="submit" disabled={saving} className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60">
              {saving ? "Đang lưu…" : "Lưu hóa đơn"}
            </button>
          </div>
        </form>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
                <th className="py-2 pr-3 font-medium">Ngày</th>
                <th className="py-2 pr-3 font-medium">Nhà cung cấp</th>
                <th className="py-2 pr-3 font-medium">Diễn giải</th>
                <th className="py-2 pr-3 text-right font-medium">Tiền hàng</th>
                <th className="py-2 pr-3 text-right font-medium">Thuế</th>
                <th className="py-2 font-medium">Khấu trừ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-cvr-line/60">
                  <td className="py-2 pr-3 whitespace-nowrap text-cvr-body">{d.ngay_hoa_don}</td>
                  <td className="py-2 pr-3 text-cvr-body">{d.nha_cung_cap}</td>
                  <td className="py-2 pr-3 text-cvr-muted">{d.dien_giai ?? ""}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-cvr-ink">{vnd(d.tien_hang)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-cvr-ink">{vnd(d.tien_thue)}</td>
                  <td className="py-2 text-xs text-cvr-muted">{d.duoc_khau_tru ? "Có" : "Không"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── HÓA ĐƠN CHỜ PHÁT HÀNH → XUẤT FILE → KÝ BẰNG USB TOKEN BÊN VIETTEL ──────
// Vì chữ ký số là USB token (không phải cloud), máy chủ web KHÔNG tự ký được —
// phải có người cắm USB. Nên luồng là: web gom sẵn số liệu → xuất file → chủ dự
// án nhập vào phần mềm Viettel, cắm USB, ký → Viettel tự gửi hóa đơn cho khách.
//
// Chia đúng 2 nhóm theo NĐ 123/2020 Điều 9 khoản 4:
//   · RIÊNG — khách có khai công ty + MST → mỗi giao dịch một hóa đơn
//   · TỔNG  — khách không lấy hóa đơn → gom cả ngày thành MỘT hóa đơn tổng,
//             các dòng chi tiết trong file chính là bảng kê đính kèm
//
// Ký xong bên Viettel thì bấm "Đánh dấu đã phát hành" để sổ khớp với thực tế.
// 👉 Sau này mua ký số cloud thì chỉ cần thêm bước gọi API, phần gom số liệu
//    này giữ nguyên, không phải viết lại.
type ChoXuat = {
  id: string;
  ngay_ghi_nhan: string;
  mo_ta: string;
  tien_hang: number;
  tien_thue: number;
  tong_tra: number;
  hoa_don_loai: string;
  ten_nguoi_mua: string | null;
  mst_nguoi_mua: string | null;
  dia_chi_nguoi_mua: string | null;
  email_nguoi_mua: string | null;
};

function KhoiXuatHoaDon({ onSaved }: { onSaved: () => void }) {
  const [ngay, setNgay] = useState(ngayISO(new Date()));
  const [rows, setRows] = useState<ChoXuat[] | null>(null);
  const [soHoaDon, setSoHoaDon] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [notice, setNotice] = useState("");

  const nap = useCallback(async () => {
    const supabase = createClient();
    const tu = new Date(`${ngay}T00:00:00`);
    const den = new Date(`${ngay}T23:59:59.999`);
    const { data, error } = await supabase
      .from("doanh_thu")
      .select("id,ngay_ghi_nhan,mo_ta,tien_hang,tien_thue,tong_tra,hoa_don_loai,ten_nguoi_mua,mst_nguoi_mua,dia_chi_nguoi_mua,email_nguoi_mua")
      .eq("hoa_don_trang_thai", "chua_xuat")
      .gte("ngay_ghi_nhan", tu.toISOString())
      .lte("ngay_ghi_nhan", den.toISOString())
      .order("ngay_ghi_nhan", { ascending: true });
    setRows(error ? [] : ((data ?? []) as ChoXuat[]));
  }, [ngay]);

  useEffect(() => {
    void nap();
  }, [nap]);

  const rieng = (rows ?? []).filter((d) => d.hoa_don_loai === "rieng");
  const tong = (rows ?? []).filter((d) => d.hoa_don_loai !== "rieng");
  const tienTong = tong.reduce((s, d) => s + d.tien_hang, 0);
  const thueTong = tong.reduce((s, d) => s + d.tien_thue, 0);
  // Số tờ hóa đơn thực sự phải ký: mỗi khách yêu cầu riêng 1 tờ + 1 tờ tổng
  const soTo = rieng.length + (tong.length > 0 ? 1 : 0);

  async function danhDauDaXuat() {
    if (!rows || rows.length === 0) return;
    setDangLuu(true);
    setNotice("");
    const supabase = createClient();
    const { error } = await supabase
      .from("doanh_thu")
      .update({
        hoa_don_trang_thai: "da_xuat",
        hoa_don_ngay: new Date().toISOString(),
        hoa_don_so: soHoaDon.trim() || null,
      })
      .in("id", rows.map((d) => d.id));
    setDangLuu(false);
    if (error) return setNotice("Lỗi: " + error.message);
    setNotice(`Đã đánh dấu ${rows.length} giao dịch là đã phát hành hóa đơn ✓`);
    setSoHoaDon("");
    void nap();
    onSaved();
  }

  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-cvr-ink">Hóa đơn chờ phát hành</h2>
      <p className="mt-1 text-sm text-cvr-muted">
        Xuất file rồi nhập vào phần mềm Viettel, cắm USB token ký. Viettel sẽ tự gửi hóa đơn về email khách.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cvr-body">Ngày</span>
          <input type="date" value={ngay} onChange={(e) => setNgay(e.target.value)} className={inp} />
        </label>
        <button
          onClick={() => taiCsv(`hoa-don-${ngay}.csv`, csvHoaDon(rieng, tong, ngay))}
          disabled={!rows || rows.length === 0}
          className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-40"
        >
          Tải file hóa đơn
        </button>
      </div>

      {!rows ? (
        <p className="mt-4 text-sm text-cvr-muted">Đang tải…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 rounded-lg bg-cvr-surface px-3 py-2.5 text-sm text-cvr-muted">
          Ngày này không có giao dịch nào chờ phát hành hóa đơn.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ONho nhan="Số tờ phải ký" giaTri={String(soTo)} />
            <ONho nhan="Hóa đơn riêng (khách yêu cầu)" giaTri={`${rieng.length} tờ`} />
            <ONho nhan="Gom vào hóa đơn tổng" giaTri={`${tong.length} giao dịch`} />
          </div>

          {tong.length > 0 && (
            <p className="mt-3 rounded-lg bg-cvr-surface px-3 py-2.5 text-sm text-cvr-body">
              <strong className="font-semibold text-cvr-ink">Hóa đơn tổng:</strong> tiền hàng {vnd(tienTong)} · thuế{" "}
              {vnd(thueTong)} · tổng {vnd(tienTong + thueTong)} — người mua ghi{" "}
              <em>&ldquo;Khách lẻ không lấy hóa đơn&rdquo;</em>, đính kèm bảng kê chi tiết trong file.
            </p>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
                  <th className="py-2 pr-3 font-medium">Loại</th>
                  <th className="py-2 pr-3 font-medium">Nội dung</th>
                  <th className="py-2 pr-3 font-medium">Người mua</th>
                  <th className="py-2 pr-3 text-right font-medium">Tiền hàng</th>
                  <th className="py-2 text-right font-medium">Thuế</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b border-cvr-line/60">
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.hoa_don_loai === "rieng" ? "bg-amber-50 text-amber-800" : "bg-cvr-surface text-cvr-muted"}`}>
                        {d.hoa_don_loai === "rieng" ? "Riêng" : "Tổng"}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-cvr-body">{d.mo_ta}</td>
                    <td className="py-2 pr-3 text-cvr-body">
                      {d.mst_nguoi_mua ? `${d.ten_nguoi_mua ?? ""} · ${d.mst_nguoi_mua}` : "Khách lẻ không lấy hóa đơn"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-cvr-ink">{vnd(d.tien_hang)}</td>
                    <td className="py-2 text-right tabular-nums text-cvr-ink">{vnd(d.tien_thue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl bg-cvr-surface p-4">
            <p className="text-sm font-medium text-cvr-ink">Ký xong bên Viettel rồi thì bấm đây</p>
            <p className="mt-1 text-xs text-cvr-muted">
              Đánh dấu {rows.length} giao dịch trên là đã phát hành, để không bị xuất trùng lần sau.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-cvr-body">Số hóa đơn (tuỳ chọn)</span>
                <input value={soHoaDon} onChange={(e) => setSoHoaDon(e.target.value)} className={inp} placeholder="C26TAA/0000123" />
              </label>
              <button onClick={danhDauDaXuat} disabled={dangLuu} className={btnPhu}>
                {dangLuu ? "Đang lưu…" : "Đánh dấu đã phát hành"}
              </button>
            </div>
            {notice && <p className="mt-2 text-sm text-cvr-body">{notice}</p>}
          </div>
        </>
      )}
    </div>
  );
}

// File cho phần mềm Viettel. Cột đặt theo nghiệp vụ chuẩn; khi có mẫu import
// chính thức của Viettel thì chỉnh lại tên cột cho khớp, dữ liệu giữ nguyên.
function csvHoaDon(rieng: ChoXuat[], tong: ChoXuat[], ngay: string): string {
  const q = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const d = ngay.split("-").reverse().join("/");
  const dong: string[] = [
    ["Loai hoa don", "Ngay", "Ten nguoi mua", "MST", "Dia chi", "Email", "Noi dung", "Tien hang", "Thue GTGT", "Tong cong"].join(","),
  ];

  for (const r of rieng) {
    dong.push([
      q("HOA DON RIENG"), q(d), q(r.ten_nguoi_mua), q(r.mst_nguoi_mua), q(r.dia_chi_nguoi_mua),
      q(r.email_nguoi_mua), q(r.mo_ta), r.tien_hang, r.tien_thue, r.tong_tra,
    ].join(","));
  }

  if (tong.length > 0) {
    const th = tong.reduce((s, r) => s + r.tien_hang, 0);
    const tt = tong.reduce((s, r) => s + r.tien_thue, 0);
    dong.push("");
    dong.push(q(`HOA DON TONG NGAY ${d} - gom ${tong.length} giao dich`));
    dong.push([
      q("HOA DON TONG"), q(d), q("Khach le khong lay hoa don"), "", "", "",
      q(`Dich vu dang tin ngay ${d}`), th, tt, th + tt,
    ].join(","));
    dong.push("");
    dong.push(q("BANG KE CHI TIET DINH KEM HOA DON TONG"));
    dong.push(["STT", "Noi dung", "Tien hang", "Thue GTGT", "Tong cong"].map(q).join(","));
    tong.forEach((r, i) => {
      dong.push([i + 1, q(r.mo_ta), r.tien_hang, r.tien_thue, r.tong_tra].join(","));
    });
  }

  return dong.join("\n");
}

// ── TẢI FILE XML HÓA ĐƠN → TỰ ĐỌC → TỰ CỘNG VÀO KHẤU TRỪ ───────────────────
// Hóa đơn điện tử Việt Nam LUÔN có bản XML kèm bản PDF — XML mới là bản gốc hợp
// pháp và có cấu trúc chuẩn, nên đọc được chính xác 100%, không phải nhập tay.
// (PDF thì mỗi nhà cung cấp trình bày một kiểu, đọc máy rất dễ sai — không dùng.)
//
// Đọc ngay tại trình duyệt bằng DOMParser, không gửi file lên máy chủ.
// Trùng số hóa đơn thì bỏ qua, tải lại cùng một file nhiều lần cũng không nhân đôi.
function KhoiTaiXml({ onSaved }: { onSaved: () => void }) {
  const [dangDoc, setDangDoc] = useState(false);
  const [kq, setKq] = useState<{ ten: string; ok: boolean; ghiChu: string }[] | null>(null);

  async function chonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setDangDoc(true);
    setKq(null);
    const supabase = createClient();
    const ra: { ten: string; ok: boolean; ghiChu: string }[] = [];

    for (const f of files) {
      try {
        const hd = docHoaDonXml(await f.text());
        if (!hd) {
          ra.push({ ten: f.name, ok: false, ghiChu: "Không đọc được — file này có đúng là XML hóa đơn không?" });
          continue;
        }
        // Đã có số hóa đơn này của cùng nhà cung cấp → bỏ qua, không cộng hai lần.
        const { data: daCo } = await supabase
          .from("hoa_don_vao")
          .select("id")
          .eq("so_hoa_don", hd.so_hoa_don)
          .eq("nha_cung_cap", hd.nha_cung_cap)
          .limit(1);
        if (daCo && daCo.length > 0) {
          ra.push({ ten: f.name, ok: false, ghiChu: `Đã có trong sổ (số ${hd.so_hoa_don}) — bỏ qua` });
          continue;
        }

        const { error } = await supabase.from("hoa_don_vao").insert({
          ngay_hoa_don: hd.ngay_hoa_don,
          so_hoa_don: hd.so_hoa_don,
          nha_cung_cap: hd.nha_cung_cap,
          mst: hd.mst,
          dien_giai: hd.dien_giai,
          tien_hang: hd.tien_hang,
          tien_thue: hd.tien_thue,
          duoc_khau_tru: true, // hóa đơn GTGT Việt Nam → khấu trừ được
        });
        ra.push(
          error
            ? { ten: f.name, ok: false, ghiChu: error.message }
            : { ten: f.name, ok: true, ghiChu: `${hd.nha_cung_cap} · thuế ${vnd(hd.tien_thue)}` },
        );
      } catch (err) {
        ra.push({ ten: f.name, ok: false, ghiChu: String(err) });
      }
    }

    setKq(ra);
    setDangDoc(false);
    e.target.value = ""; // cho phép chọn lại đúng file đó
    onSaved();
  }

  const soThem = (kq ?? []).filter((k) => k.ok).length;

  return (
    <div className="mt-4 rounded-xl border border-dashed border-cvr-line bg-cvr-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-cvr-ink">Tải hóa đơn đầu vào (file XML)</p>
          <p className="mt-0.5 text-xs text-cvr-muted">
            Chọn nhiều file cùng lúc — hệ thống tự đọc nhà cung cấp, số hóa đơn, tiền hàng, tiền thuế
            rồi cộng thẳng vào phần được khấu trừ.
          </p>
        </div>
        <label className={btnPhu + " cursor-pointer"}>
          {dangDoc ? "Đang đọc…" : "Chọn file XML"}
          <input type="file" accept=".xml,text/xml,application/xml" multiple onChange={chonFile} className="hidden" disabled={dangDoc} />
        </label>
      </div>

      {kq && (
        <div className="mt-3 border-t border-cvr-line pt-3">
          <p className="text-sm font-medium text-cvr-ink">Đã thêm {soThem}/{kq.length} hóa đơn</p>
          <ul className="mt-1.5 space-y-1">
            {kq.map((k, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className={k.ok ? "text-green-700" : "text-amber-700"}>{k.ok ? "✓" : "○"}</span>
                <span className="font-medium text-cvr-body">{k.ten}</span>
                <span className="text-cvr-muted">{k.ghiChu}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-cvr-muted">
        ⚠️ Hóa đơn nước ngoài (Vercel, Supabase, Anthropic…) <strong>không có bản XML</strong> và không
        có thuế GTGT Việt Nam — nhập tay với tiền thuế = 0 và bỏ tick &ldquo;được khấu trừ&rdquo;.
        Chúng chỉ tính vào chi phí thuế TNDN.
      </p>
    </div>
  );
}

// Đọc XML hóa đơn điện tử theo chuẩn của Tổng cục Thuế.
// Tìm thẻ theo TÊN CỤC BỘ ở bất kỳ đâu trong cây — mỗi nhà cung cấp lồng thẻ một
// kiểu và hay kèm namespace, nên không dò theo đường dẫn cứng.
function docHoaDonXml(xml: string): {
  ngay_hoa_don: string;
  so_hoa_don: string;
  nha_cung_cap: string;
  mst: string | null;
  dien_giai: string | null;
  tien_hang: number;
  tien_thue: number;
} | null {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) return null;

  const tim = (goc: Element | Document, ten: string): Element | null => {
    const all = goc.getElementsByTagName("*");
    for (let i = 0; i < all.length; i++) if (all[i].localName === ten) return all[i];
    return null;
  };
  const chu = (goc: Element | Document, ten: string): string => tim(goc, ten)?.textContent?.trim() ?? "";
  const so = (goc: Element | Document, ten: string): number => {
    const v = chu(goc, ten).replace(/[^\d.-]/g, "");
    return v ? Math.round(Number(v)) : 0;
  };

  const soHd = chu(doc, "SHDon");
  const nBan = tim(doc, "NBan");
  const tenNb = nBan ? chu(nBan, "Ten") : "";
  if (!soHd || !tenNb) return null; // thiếu 2 thứ này thì không phải hóa đơn hợp lệ

  // NLap có thể là "2026-08-20" hoặc kèm giờ — cắt lấy phần ngày.
  const ngay = (chu(doc, "NLap") || "").slice(0, 10);

  return {
    ngay_hoa_don: /^\d{4}-\d{2}-\d{2}$/.test(ngay) ? ngay : ngayISO(new Date()),
    so_hoa_don: soHd,
    nha_cung_cap: tenNb,
    mst: (nBan ? chu(nBan, "MST") : "") || null,
    dien_giai: chu(doc, "THDon") || null, // tên hàng hóa/dịch vụ tổng quát nếu có
    tien_hang: so(doc, "TgTCThue"), // tổng tiền chưa thuế
    tien_thue: so(doc, "TgTThue"),  // tổng tiền thuế GTGT
  };
}

// ── Phụ trợ ─────────────────────────────────────────────────────────────────
const inp = "h-10 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink";
const btnPhu = "rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink";

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cvr-body">{label}</span>
      {children}
    </label>
  );
}

function ONho({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="rounded-xl border border-cvr-line p-3">
      <div className="text-xs uppercase tracking-wide text-cvr-muted">{nhan}</div>
      <div className="mt-1 text-lg font-semibold text-cvr-ink">{giaTri}</div>
    </div>
  );
}

function ChiTieu({ ma, ten, tien, dam }: { ma: string; ten: string; tien: number; dam?: boolean }) {
  return (
    <tr className="border-b border-cvr-line/60">
      <td className="w-12 py-2.5 pr-2 text-sm tabular-nums text-cvr-muted">{ma ? `[${ma}]` : ""}</td>
      <td className={`py-2.5 pr-3 text-sm ${dam ? "font-semibold text-cvr-ink" : "text-cvr-body"}`}>{ten}</td>
      <td className={`py-2.5 text-right text-sm tabular-nums ${dam ? "font-semibold text-cvr-ink" : "text-cvr-ink"}`}>{vnd(tien)}</td>
    </tr>
  );
}

function ngayISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function ngayVn(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

// CSV có BOM để Excel tiếng Việt không bị vỡ dấu.
function taiCsv(ten: string, noiDung: string) {
  const blob = new Blob(["﻿" + noiDung], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = ten;
  a.click();
  URL.revokeObjectURL(a.href);
}
function o(v: string | number | null): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}
function csvToKhai(t: { hangVao: number; thueVao: number; dtChuaThue: number; thueRa: number; phaiNop: number }, nhan: string): string {
  return [
    ["Chi tieu", "Noi dung", "So tien"].join(","),
    ["", o(`To khai thue GTGT 01/GTGT - ${nhan}`), ""].join(","),
    ["23", o("Gia tri hang hoa, dich vu mua vao"), t.hangVao].join(","),
    ["24", o("Thue GTGT cua hang hoa, dich vu mua vao"), t.thueVao].join(","),
    ["25", o("Tong so thue GTGT duoc khau tru ky nay"), t.thueVao].join(","),
    ["32", o("Doanh thu hang hoa, dich vu ban ra chiu thue"), t.dtChuaThue].join(","),
    ["33", o("Thue GTGT cua hang hoa, dich vu ban ra"), t.thueRa].join(","),
    ["34", o("Tong doanh thu ban ra chiu thue"), t.dtChuaThue].join(","),
    ["35", o("Tong so thue GTGT cua hang hoa, dich vu ban ra"), t.thueRa].join(","),
    ["36", o("Thue GTGT phat sinh trong ky"), t.phaiNop].join(","),
    [t.phaiNop >= 0 ? "40" : "43", o(t.phaiNop >= 0 ? "Thue GTGT con phai nop" : "Thue GTGT con duoc khau tru chuyen ky sau"), Math.abs(t.phaiNop)].join(","),
  ].join("\n");
}
function csvDauRa(rows: DongDoanhThu[]): string {
  return [
    ["Ngay", "Noi dung", "Ten nguoi mua", "MST nguoi mua", "Tien hang", "Tien thue", "Tong", "So hoa don"].join(","),
    ...rows.map((d) =>
      [
        o(ngayVn(d.ngay_ghi_nhan)),
        o(d.mo_ta),
        o(d.ten_nguoi_mua ?? "Khach le khong lay hoa don"),
        o(d.mst_nguoi_mua),
        d.tien_hang,
        d.tien_thue,
        d.tong_tra,
        o(d.hoa_don_so),
      ].join(","),
    ),
  ].join("\n");
}
