"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { vnd } from "@/lib/billing";
import { THUE_SUAT_GTGT, khoangQuy, tachThue } from "@/lib/thue";
import {
  NCC_DA_BIET,
  TY_LE,
  doanNhom,
  hanNop,
  khoangThang,
  tinhFct,
  type LoaiDichVu,
  type NhomNcc,
} from "@/lib/thueNhaThau";
import { docHoaDonNgoai } from "@/lib/docHoaDonNgoai";

// ============================================================================
// ADMIN — HÓA ĐƠN & BÁO CÁO THUẾ
// ----------------------------------------------------------------------------
// Gom số liệu cả quý rồi bày ra ĐÚNG CHỈ TIÊU của Tờ khai thuế GTGT mẫu 01/GTGT
// để chép thẳng vào eTax, kèm nút tải CSV về chỉnh tay nếu cần.
//
// NGUỒN SỐ LIỆU:
//   · Đầu ra  = bảng `doanh_thu`     — web tự ghi khi tin được duyệt (khách dùng gói)
//   · Đầu vào = bảng `hoa_don_vao`   — hóa đơn GTGT Việt Nam (tải XML hoặc nhập tay)
//   · Đầu vào = bảng `hoa_don_ngoai` — hóa đơn nước ngoài + thuế nhà thầu nộp thay
//
// ⚠️ Hóa đơn nước ngoài (Anthropic/Vercel/Supabase…) KHÔNG nhập ở mục "hóa đơn mua
//    vào" — có mục riêng ở cuối trang. Nhà cung cấp chưa đăng ký thuế tại VN thì
//    mình phải KHAI NỘP THAY (tờ khai 01/NTNN); chứng từ nộp thuế GTGT đó ĐƯỢC
//    KHẤU TRỪ (Nghị định 181/2025/NĐ-CP) nên mục đó tự cộng vào [23] [24] [25].
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
  /** 'tin_dang' = web tự ghi khi duyệt tin · 'doanh_nghiep' = dịch vụ B2B nhập tay */
  nguon: string;
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

type DongNgoai = {
  id: string;
  ky_thang: string;
  ngay_hoa_don: string;
  nha_cung_cap: string;
  so_hoa_don: string | null;
  dien_giai: string | null;
  nhom: NhomNcc;
  loai: LoaiDichVu;
  hop_dong_net: boolean;
  tien_usd: number;
  ty_gia: number;
  tien_vnd: number;
  dt_gtgt: number;
  thue_gtgt: number;
  dt_tndn: number;
  thue_tndn: number;
  da_nop: boolean;
  ngay_nop: string | null;
  chung_tu_nop: string | null;
};

const COT_NGOAI =
  "id,ky_thang,ngay_hoa_don,nha_cung_cap,so_hoa_don,dien_giai,nhom,loai,hop_dong_net," +
  "tien_usd,ty_gia,tien_vnd,dt_gtgt,thue_gtgt,dt_tndn,thue_tndn,da_nop,ngay_nop,chung_tu_nop";

const HOM_NAY = new Date();

export default function AdminThuePage() {
  const [nam, setNam] = useState(HOM_NAY.getFullYear());
  const [quy, setQuy] = useState(Math.floor(HOM_NAY.getMonth() / 3) + 1);
  const [ra, setRa] = useState<DongDoanhThu[] | null>(null);
  const [vao, setVao] = useState<DongVao[] | null>(null);
  const [ngoai, setNgoai] = useState<DongNgoai[] | null>(null);
  const [loi, setLoi] = useState("");

  const { tu, den } = useMemo(() => khoangQuy(nam, quy), [nam, quy]);

  const nap = useCallback(async () => {
    setLoi("");
    const supabase = createClient();

    const r1 = await supabase
      .from("doanh_thu")
      .select("id,ngay_ghi_nhan,mo_ta,tien_hang,tien_thue,tong_tra,hoa_don_loai,hoa_don_so,hoa_don_trang_thai,ten_nguoi_mua,mst_nguoi_mua,nguon")
      .gte("ngay_ghi_nhan", tu.toISOString())
      .lte("ngay_ghi_nhan", den.toISOString())
      .order("ngay_ghi_nhan", { ascending: true });

    const r2 = await supabase
      .from("hoa_don_vao")
      .select("id,ngay_hoa_don,so_hoa_don,nha_cung_cap,mst,dien_giai,tien_hang,tien_thue,duoc_khau_tru")
      .gte("ngay_hoa_don", ngayISO(tu))
      .lte("ngay_hoa_don", ngayISO(den))
      .order("ngay_hoa_don", { ascending: true });

    // Hóa đơn nước ngoài của CẢ QUÝ — thuế GTGT nộp thay đã nộp thì cộng vào khấu trừ.
    const r3 = await supabase
      .from("hoa_don_ngoai")
      .select(COT_NGOAI)
      .gte("ky_thang", ngayISO(tu))
      .lte("ky_thang", ngayISO(den))
      .order("ngay_hoa_don", { ascending: true });

    // Bảng 0018 có thể chưa chạy — không để nó chặn cả trang, chỉ coi như chưa có dòng nào.
    setNgoai(r3.error ? [] : ((r3.data ?? []) as unknown as DongNgoai[]));

    // Chưa chạy migration → bảng/cột chưa tồn tại. Báo bằng tiếng người, và nói
    // rõ CHẠY FILE NÀO — thiếu cột `nguon` (0019) báo khác thiếu cả bảng (0017).
    if (r1.error || r2.error) {
      const msg = r1.error?.message || r2.error?.message || "";
      setLoi(
        /nguon/i.test(msg)
          ? "Thiếu cột phân nguồn doanh thu. Vào Supabase → SQL Editor → chạy file supabase/migrations/0019_doanh_thu_doanh_nghiep.sql rồi tải lại trang."
          : /does not exist|schema cache/i.test(msg)
            ? "Chưa có bảng dữ liệu. Vào Supabase → SQL Editor → chạy lần lượt các file trong supabase/migrations/ (0017, 0018, 0019) rồi tải lại trang."
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
    const dsNgoai = ngoai ?? [];
    const dtChuaThue = dsRa.reduce((s, d) => s + Number(d.tien_hang || 0), 0);
    const thueRa = dsRa.reduce((s, d) => s + Number(d.tien_thue || 0), 0);

    // Tách hai nguồn doanh thu để báo cáo nhìn ra ngay mảng nào đang chạy.
    // Dòng cũ chưa có cột `nguon` thì mặc định là tin đăng.
    const laDoanhNghiep = (d: DongDoanhThu) => d.nguon === "doanh_nghiep";
    const cong = (ds: DongDoanhThu[], k: "tien_hang" | "tien_thue") =>
      ds.reduce((s, d) => s + Number(d[k] || 0), 0);
    const raTin = dsRa.filter((d) => !laDoanhNghiep(d));
    const raDn = dsRa.filter(laDoanhNghiep);
    const khauTru = dsVao.filter((d) => d.duoc_khau_tru);

    // Thuế nhà thầu chỉ được khấu trừ khi ĐÃ NỘP Kho bạc — Nghị định 181/2025 đòi
    // chứng từ nộp thuế. Chưa nộp thì chưa cộng, tránh khai khống chỉ tiêu [24].
    const ngoaiDaNop = dsNgoai.filter((d) => d.nhom === "phai_khai_thay" && d.da_nop);
    const hangVaoNgoai = ngoaiDaNop.reduce((s, d) => s + Number(d.dt_gtgt || 0), 0);
    const thueVaoNgoai = ngoaiDaNop.reduce((s, d) => s + Number(d.thue_gtgt || 0), 0);

    const hangVao = khauTru.reduce((s, d) => s + Number(d.tien_hang || 0), 0) + hangVaoNgoai;
    const thueVao = khauTru.reduce((s, d) => s + Number(d.tien_thue || 0), 0) + thueVaoNgoai;
    // Chi phí tính thuế TNDN gồm CẢ hóa đơn không được khấu trừ GTGT, tiền trả nhà
    // cung cấp nước ngoài, và thuế TNDN nộp thay (mình chịu → là chi phí của mình).
    const tongChiPhi =
      dsVao.reduce((s, d) => s + Number(d.tien_hang || 0), 0) +
      dsNgoai.reduce((s, d) => s + Number(d.tien_vnd || 0) + (d.da_nop ? Number(d.thue_tndn || 0) : 0), 0);
    const phaiNop = thueRa - thueVao;
    const loiNhuan = dtChuaThue - tongChiPhi;
    return {
      dtChuaThue,
      thueRa,
      hangVao,
      thueVao,
      thueVaoNgoai,
      tongChiPhi,
      phaiNop,
      loiNhuan,
      // Doanh thu ≤ 3 tỷ/năm → 15% (Luật Thuế TNDN 67/2025/QH15)
      tamNopTndn: Math.max(0, Math.round(loiNhuan * 0.15)),
      soGiaoDich: dsRa.length,
      // Cơ cấu doanh thu — LUÔN hiện đủ hai dòng kể cả khi bằng 0, để nhìn ra
      // ngay là mảng đó chưa phát sinh chứ không phải bị quên nhập.
      dtTinDang: cong(raTin, "tien_hang"),
      thueTinDang: cong(raTin, "tien_thue"),
      soTinDang: raTin.length,
      dtDoanhNghiep: cong(raDn, "tien_hang"),
      thueDoanhNghiep: cong(raDn, "tien_thue"),
      soDoanhNghiep: raDn.length,
    };
  }, [ra, vao, ngoai]);

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

      {/* ── CƠ CẤU DOANH THU ────────────────────────────────────────────── */}
      <KhoiCoCauDoanhThu t={t} nhan={nhan} onSaved={nap} />

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

        {t.thueVaoNgoai > 0 && (
          <p className="mt-4 rounded-lg border border-cvr-line bg-cvr-surface px-3 py-2.5 text-xs leading-relaxed text-cvr-body">
            Trong chỉ tiêu [24] và [25] ở trên đã có{" "}
            <strong className="font-semibold text-cvr-ink">{vnd(t.thueVaoNgoai)}</strong> thuế GTGT nộp thay nhà
            thầu nước ngoài (đã nộp Kho bạc) — chứng từ nộp thuế thay là căn cứ khấu trừ hợp lệ theo Nghị định
            181/2025/NĐ-CP. Chi tiết ở mục &ldquo;Hóa đơn nước ngoài&rdquo; cuối trang.
          </p>
        )}

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

      {/* ── HÓA ĐƠN NƯỚC NGOÀI & THUẾ NHÀ THẦU ──────────────────────────── */}
      <KhoiThueNhaThau onSaved={nap} />
    </div>
  );
}

// ── CƠ CẤU DOANH THU: TIN ĐĂNG + DỊCH VỤ DOANH NGHIỆP ─────────────────────
// Hai dòng LUÔN hiện kể cả khi bằng 0 — chủ dự án chốt 28/08/2026. Nhìn thấy
// dòng 0 thì biết mảng đó chưa phát sinh; giấu đi thì không phân biệt được
// "chưa có" với "quên nhập", mà quên nhập doanh thu là khai thiếu thuế.
//
// Doanh thu tin đăng do web tự ghi lúc duyệt tin, KHÔNG nhập tay.
// Doanh thu doanh nghiệp (banner, bài PR, hợp đồng dịch vụ) thì web không biết,
// phải nhập ở đây. Nhập xong nó đi tiếp vào đúng luồng cũ: hiện ở mục "Hóa đơn
// chờ phát hành" cuối ngày, và cộng vào chỉ tiêu [32] [33] của tờ khai quý.
function KhoiCoCauDoanhThu({
  t,
  nhan,
  onSaved,
}: {
  t: {
    dtTinDang: number; thueTinDang: number; soTinDang: number;
    dtDoanhNghiep: number; thueDoanhNghiep: number; soDoanhNghiep: number;
    dtChuaThue: number; thueRa: number;
  };
  nhan: string;
  onSaved: () => void;
}) {
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-cvr-ink">Cơ cấu doanh thu · {nhan}</h2>
      <p className="mt-1 text-sm text-cvr-muted">
        Tổng hai dòng dưới đây chính là chỉ tiêu [32] của tờ khai GTGT.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
              <th className="py-2 pr-3 font-medium">Nguồn doanh thu</th>
              <th className="py-2 pr-3 font-medium">Cách ghi nhận</th>
              <th className="py-2 pr-3 text-right font-medium">Số giao dịch</th>
              <th className="py-2 pr-3 text-right font-medium">Tiền hàng</th>
              <th className="py-2 text-right font-medium">Thuế GTGT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-cvr-line/60">
              <td className="py-2.5 pr-3 font-medium text-cvr-ink">Bán gói tin đăng</td>
              <td className="py-2.5 pr-3 text-cvr-muted">Web tự ghi khi duyệt tin</td>
              <td className="py-2.5 pr-3 text-right tabular-nums text-cvr-body">{t.soTinDang}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums text-cvr-ink">{vnd(t.dtTinDang)}</td>
              <td className="py-2.5 text-right tabular-nums text-cvr-ink">{vnd(t.thueTinDang)}</td>
            </tr>
            <tr className="border-b border-cvr-line/60">
              <td className="py-2.5 pr-3 font-medium text-cvr-ink">Dịch vụ doanh nghiệp</td>
              <td className="py-2.5 pr-3 text-cvr-muted">Nhập tay ở dưới</td>
              <td className="py-2.5 pr-3 text-right tabular-nums text-cvr-body">{t.soDoanhNghiep}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums text-cvr-ink">{vnd(t.dtDoanhNghiep)}</td>
              <td className="py-2.5 text-right tabular-nums text-cvr-ink">{vnd(t.thueDoanhNghiep)}</td>
            </tr>
            <tr className="border-t-2 border-cvr-ink">
              <td className="py-3 pr-3 font-semibold text-cvr-ink" colSpan={3}>TỔNG DOANH THU</td>
              <td className="py-3 pr-3 text-right text-base font-bold tabular-nums text-cvr-ink">{vnd(t.dtChuaThue)}</td>
              <td className="py-3 text-right text-base font-bold tabular-nums text-cvr-ink">{vnd(t.thueRa)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <FormDoanhThuDoanhNghiep onSaved={onSaved} />
    </div>
  );
}

// Nhập doanh thu ngoài tin đăng. Khách doanh nghiệp LUÔN lấy hóa đơn nên mặc
// định xuất hóa đơn RIÊNG, không gom vào hóa đơn tổng cuối ngày.
function FormDoanhThuDoanhNghiep({ onSaved }: { onSaved: () => void }) {
  const [mo, setMo] = useState(false);
  const [f, setF] = useState({
    ngay: ngayISO(new Date()),
    mo_ta: "",
    ten_nguoi_mua: "",
    mst_nguoi_mua: "",
    dia_chi_nguoi_mua: "",
    email_nguoi_mua: "",
    tien_hang: "",
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const tach = tachThue(Number(f.tien_hang) || 0);

  async function luu(e: React.FormEvent) {
    e.preventDefault();
    if (!f.mo_ta.trim()) return setNotice("Chưa điền nội dung dịch vụ.");
    if (!f.ten_nguoi_mua.trim()) return setNotice("Chưa điền tên công ty mua.");
    if (!(Number(f.tien_hang) > 0)) return setNotice("Chưa điền tiền hàng chưa thuế.");

    setSaving(true);
    setNotice("");
    const { error } = await createClient().from("doanh_thu").insert({
      nguon: "doanh_nghiep",
      mo_ta: f.mo_ta.trim(),
      tien_hang: tach.tienHang,
      tien_thue: tach.tienThue,
      thue_suat: tach.thueSuat,
      tong_tra: tach.tongTra,
      ngay_ghi_nhan: new Date(`${f.ngay}T12:00:00`).toISOString(),
      // Khách doanh nghiệp luôn cần hóa đơn đứng tên họ.
      yeu_cau_hoa_don: true,
      hoa_don_loai: "rieng",
      hoa_don_trang_thai: "chua_xuat",
      ten_nguoi_mua: f.ten_nguoi_mua.trim(),
      mst_nguoi_mua: f.mst_nguoi_mua.trim() || null,
      dia_chi_nguoi_mua: f.dia_chi_nguoi_mua.trim() || null,
      email_nguoi_mua: f.email_nguoi_mua.trim() || null,
    });
    setSaving(false);
    if (error) {
      return setNotice(
        /nguon/i.test(error.message)
          ? "Thiếu cột phân nguồn — chạy file supabase/migrations/0019_doanh_thu_doanh_nghiep.sql trong Supabase rồi thử lại."
          : "Lưu thất bại: " + error.message,
      );
    }
    setF({ ...f, mo_ta: "", ten_nguoi_mua: "", mst_nguoi_mua: "", dia_chi_nguoi_mua: "", email_nguoi_mua: "", tien_hang: "" });
    setNotice("Đã ghi nhận ✓ Giao dịch này giờ nằm ở mục “Hóa đơn chờ phát hành”.");
    onSaved();
  }

  return (
    <div className="mt-5">
      <button onClick={() => setMo((v) => !v)} className={btnPhu}>
        {mo ? "Đóng" : "+ Ghi doanh thu dịch vụ doanh nghiệp"}
      </button>

      {mo && (
        <form onSubmit={luu} className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-cvr-surface p-4 sm:grid-cols-3">
          <L label="Ngày ghi nhận">
            <input type="date" value={f.ngay} onChange={(e) => setF({ ...f, ngay: e.target.value })} className={inp} />
          </L>
          <L label="Nội dung dịch vụ *">
            <input value={f.mo_ta} onChange={(e) => setF({ ...f, mo_ta: e.target.value })} className={inp} placeholder="Banner trang chủ tháng 9/2026" />
          </L>
          <L label="Tiền hàng chưa thuế *">
            <input value={f.tien_hang} onChange={(e) => setF({ ...f, tien_hang: e.target.value })} className={inp} inputMode="numeric" placeholder="10000000" />
          </L>

          <L label="Tên công ty mua *">
            <input value={f.ten_nguoi_mua} onChange={(e) => setF({ ...f, ten_nguoi_mua: e.target.value })} className={inp} />
          </L>
          <L label="Mã số thuế người mua">
            <input value={f.mst_nguoi_mua} onChange={(e) => setF({ ...f, mst_nguoi_mua: e.target.value })} className={inp} />
          </L>
          <L label="Email nhận hóa đơn">
            <input value={f.email_nguoi_mua} onChange={(e) => setF({ ...f, email_nguoi_mua: e.target.value })} className={inp} />
          </L>

          <L label="Địa chỉ người mua">
            <input value={f.dia_chi_nguoi_mua} onChange={(e) => setF({ ...f, dia_chi_nguoi_mua: e.target.value })} className={inp} />
          </L>

          <div className="rounded-lg border border-cvr-line bg-white p-3 text-sm sm:col-span-2">
            <div className="flex flex-wrap justify-between gap-x-6">
              <span className="text-cvr-muted">Tiền hàng</span>
              <span className="tabular-nums text-cvr-ink">{vnd(tach.tienHang)}</span>
            </div>
            <div className="mt-1 flex flex-wrap justify-between gap-x-6">
              <span className="text-cvr-muted">Thuế GTGT {(tach.thueSuat * 100).toFixed(0)}%</span>
              <span className="tabular-nums text-cvr-ink">{vnd(tach.tienThue)}</span>
            </div>
            <div className="mt-1 flex flex-wrap justify-between gap-x-6 border-t border-cvr-line pt-1">
              <span className="font-medium text-cvr-ink">Khách phải trả</span>
              <span className="tabular-nums font-semibold text-cvr-ink">{vnd(tach.tongTra)}</span>
            </div>
          </div>

          <div className="sm:col-span-3">
            {notice && <p className="mb-2 text-sm text-cvr-body">{notice}</p>}
            <button type="submit" disabled={saving} className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60">
              {saving ? "Đang lưu…" : "Ghi nhận doanh thu"}
            </button>
          </div>
        </form>
      )}
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
              Được khấu trừ GTGT{" "}
              <span className="text-cvr-muted">
                (bỏ tick khi hóa đơn không đủ điều kiện khấu trừ — vd trả tiền mặt khoản từ 5 triệu)
              </span>
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
        ⚠️ Hóa đơn nước ngoài (Anthropic, Vercel, Supabase…) <strong>không có bản XML</strong> — đừng nhập ở
        đây. Chúng đi qua mục <strong>&ldquo;Hóa đơn nước ngoài &amp; thuế nhà thầu&rdquo;</strong> cuối trang,
        khai nộp thay xong sẽ tự cộng vào phần được khấu trừ.
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

// ── HÓA ĐƠN NƯỚC NGOÀI & THUẾ NHÀ THẦU (FCT) ───────────────────────────────
// Khai theo THÁNG, hạn nộp ngày 20 tháng sau — nên mục này có bộ chọn tháng
// riêng, không dùng chung bộ chọn quý ở đầu trang. Thuế GTGT nộp thay của cả 3
// tháng trong quý sẽ tự cộng vào chỉ tiêu [24] [25] của tờ khai 01/GTGT quý đó.
//
// Tỷ giá: dùng TỶ GIÁ TRUNG TÂM do Ngân hàng Nhà nước công bố, lấy tại thời điểm
// quyết toán — chủ dự án chốt 28/08/2026. Nhập một lần ở đầu mục, áp cho cả tháng.
// Bấm "Lấy tỷ giá NHNN" thì máy chủ tự đọc sbv.gov.vn (route /api/ty-gia);
// hỏng thì vẫn gõ tay được, không chặn việc.
function KhoiThueNhaThau({ onSaved }: { onSaved: () => void }) {
  const [nam, setNam] = useState(HOM_NAY.getFullYear());
  const [thang, setThang] = useState(HOM_NAY.getMonth() + 1); // mặc định tháng hiện tại
  const [tyGia, setTyGia] = useState("");
  const [ngayTyGia, setNgayTyGia] = useState("");
  const [dangLayTyGia, setDangLayTyGia] = useState(false);
  const [rows, setRows] = useState<DongNgoai[] | null>(null);
  const [loi, setLoi] = useState("");

  async function layTyGia() {
    setDangLayTyGia(true);
    setNgayTyGia("");
    try {
      const r = await fetch("/api/ty-gia", { cache: "no-store" });
      const j = await r.json();
      if (j.ok) {
        setTyGia(String(j.tyGia));
        setNgayTyGia(j.ngay ? `NHNN áp dụng cho ngày ${j.ngay}` : "Đã lấy từ sbv.gov.vn");
      } else {
        setNgayTyGia(j.message ?? "Không lấy được — nhập tay giúp.");
      }
    } catch {
      setNgayTyGia("Không nối được sbv.gov.vn — nhập tay giúp.");
    }
    setDangLayTyGia(false);
  }

  const kyThang = `${nam}-${String(thang).padStart(2, "0")}-01`;
  const { tu, den } = useMemo(() => khoangThang(nam, thang), [nam, thang]);

  const nap = useCallback(async () => {
    setLoi("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("hoa_don_ngoai")
      .select(COT_NGOAI)
      .eq("ky_thang", `${nam}-${String(thang).padStart(2, "0")}-01`)
      .order("ngay_hoa_don", { ascending: true });

    if (error) {
      setLoi(
        /does not exist|schema cache/i.test(error.message)
          ? "Chưa có bảng dữ liệu. Vào Supabase → SQL Editor → chạy file supabase/migrations/0018_thue_nha_thau.sql rồi tải lại trang."
          : error.message,
      );
      setRows([]);
      return;
    }
    const ds = (data ?? []) as unknown as DongNgoai[];
    setRows(ds);
    // Nhớ lại tỷ giá đã dùng cho tháng này để khỏi phải tra lại.
    const cu = ds.find((d) => Number(d.ty_gia) > 0);
    if (cu) setTyGia(String(Math.round(Number(cu.ty_gia))));
  }, [nam, thang]);

  useEffect(() => {
    void nap();
  }, [nap]);

  const t = useMemo(() => {
    const ds = rows ?? [];
    const phaiKhai = ds.filter((d) => d.nhom === "phai_khai_thay");
    return {
      tienVnd: ds.reduce((s, d) => s + Number(d.tien_vnd || 0), 0),
      thueGtgt: phaiKhai.reduce((s, d) => s + Number(d.thue_gtgt || 0), 0),
      thueTndn: phaiKhai.reduce((s, d) => s + Number(d.thue_tndn || 0), 0),
      daNop: phaiKhai.filter((d) => d.da_nop).length,
      chuaNop: phaiKhai.filter((d) => !d.da_nop).length,
    };
  }, [rows]);

  const han = hanNop(nam, thang);
  const treHan = !!rows && t.chuaNop > 0 && HOM_NAY > han;

  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-cvr-ink">Hóa đơn nước ngoài &amp; thuế nhà thầu</h2>
      <p className="mt-1 text-sm text-cvr-muted">
        Nhà cung cấp chưa đăng ký thuế tại Việt Nam thì mình phải khai nộp thay (tờ khai 01/NTNN).
        Nộp xong bấm &ldquo;đã nộp&rdquo; — thuế GTGT sẽ tự cộng vào chỉ tiêu [24] [25] của tờ khai quý.
      </p>

      {/* Chọn kỳ + tỷ giá */}
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-cvr-surface p-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cvr-body">Tháng phát sinh</span>
          <select value={thang} onChange={(e) => setThang(Number(e.target.value))} className={inp}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>Tháng {m}</option>
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
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cvr-body">Tỷ giá NHNN (1 USD = ? đ)</span>
          <input
            value={tyGia}
            onChange={(e) => { setTyGia(e.target.value); setNgayTyGia(""); }}
            className={inp}
            inputMode="numeric"
            placeholder="25611"
          />
        </label>
        <button onClick={layTyGia} disabled={dangLayTyGia} className={btnPhu + " mb-0.5"}>
          {dangLayTyGia ? "Đang lấy…" : "Lấy tỷ giá NHNN"}
        </button>
        <p className={`pb-2 text-sm ${treHan ? "font-semibold text-amber-700" : "text-cvr-muted"}`}>
          Hạn nộp {han.toLocaleDateString("vi-VN")}
          {treHan ? " — ĐÃ QUÁ HẠN" : ""}
        </p>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-cvr-muted">
        {ngayTyGia && <strong className="text-cvr-ink">{ngayTyGia}. </strong>}
        Dùng <strong>tỷ giá trung tâm do Ngân hàng Nhà nước công bố</strong>, lấy tại thời điểm quyết toán —
        xem tại{" "}
        <a href="https://sbv.gov.vn/vi/t%E1%BB%B7-gi%C3%A1" target="_blank" rel="noopener noreferrer" className="underline">
          sbv.gov.vn
        </a>
        . Tỷ giá được lưu cứng vào từng dòng lúc bấm lưu, sau này NHNN đổi tỷ giá thì số cũ không bị tính lại.
      </p>

      {loi && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{loi}</div>
      )}

      {/* Tổng của tháng */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ONho nhan="Tiền trả nhà cung cấp" giaTri={vnd(t.tienVnd)} />
        <ONho nhan="Thuế GTGT nộp thay (được khấu trừ)" giaTri={vnd(t.thueGtgt)} />
        <ONho nhan="Thuế TNDN nộp thay (chi phí)" giaTri={vnd(t.thueTndn)} />
      </div>

      <KhoiTaiPdfNgoai tyGia={tyGia} onSaved={() => { void nap(); onSaved(); }} />

      <FormNgoai kyThang={kyThang} tyGia={tyGia} tu={tu} den={den} onSaved={() => { void nap(); onSaved(); }} />

      {rows && rows.length > 0 && (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
                  <th className="py-2 pr-3 font-medium">Ngày</th>
                  <th className="py-2 pr-3 font-medium">Nhà cung cấp</th>
                  <th className="py-2 pr-3 text-right font-medium">USD</th>
                  <th className="py-2 pr-3 text-right font-medium">Tiền VNĐ</th>
                  <th className="py-2 pr-3 text-right font-medium">Thuế GTGT</th>
                  <th className="py-2 pr-3 text-right font-medium">Thuế TNDN</th>
                  <th className="py-2 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b border-cvr-line/60">
                    <td className="py-2 pr-3 whitespace-nowrap text-cvr-body">{d.ngay_hoa_don}</td>
                    <td className="py-2 pr-3 text-cvr-body">
                      {d.nha_cung_cap}
                      {d.dien_giai ? <span className="block text-xs text-cvr-muted">{d.dien_giai}</span> : null}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-cvr-ink">
                      {Number(d.tien_usd).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-cvr-ink">{vnd(d.tien_vnd)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-cvr-ink">{vnd(d.thue_gtgt)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-cvr-ink">{vnd(d.thue_tndn)}</td>
                    <td className="py-2 text-xs">
                      {d.nhom === "da_dang_ky" ? (
                        <span className="text-cvr-muted">Đã đăng ký tại VN — không khai thay</span>
                      ) : d.da_nop ? (
                        <span className="text-green-700">Đã nộp {d.ngay_nop ?? ""}</span>
                      ) : (
                        <span className="text-amber-700">Chờ nộp</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => taiCsv(`to-khai-01NTNN-T${thang}-${nam}.csv`, csvNtnn(rows, thang, nam))}
              className={btnPhu}
            >
              Tải CSV tờ khai 01/NTNN
            </button>
          </div>

          <KhoiDanhDauNop rows={rows} onSaved={() => { void nap(); onSaved(); }} />
        </>
      )}

      {rows && rows.length === 0 && !loi && (
        <p className="mt-4 rounded-lg bg-cvr-surface px-3 py-2.5 text-sm text-cvr-muted">
          Tháng này chưa có hóa đơn nước ngoài nào.
        </p>
      )}

      <p className="mt-4 rounded-lg bg-cvr-surface px-3 py-2.5 text-xs leading-relaxed text-cvr-muted">
        Tỷ lệ áp dụng: dịch vụ <strong>GTGT 5%</strong> (Thông tư 69/2025/TT-BTC) ·{" "}
        <strong>TNDN 5%</strong>, bản quyền/license <strong>TNDN 10%</strong> (Nghị định 320/2025/NĐ-CP).
        Hợp đồng NET (trả thẻ, nhà cung cấp nhận đủ) phải quy đổi ngược theo Thông tư 20/2026/TT-BTC.
        Thuế GTGT nộp thay được khấu trừ theo Nghị định 181/2025/NĐ-CP — <strong>bắt buộc</strong> thanh toán
        bằng thẻ đứng tên công ty với khoản từ 5 triệu đồng, và điền đủ tên công ty + MST vào phần Billing
        của nhà cung cấp.
      </p>
    </div>
  );
}

// ── TẢI FILE PDF HÓA ĐƠN NƯỚC NGOÀI → TỰ ĐỌC → SOÁT → LƯU ─────────────────
// Anthropic, Vercel, Supabase đều phát hành qua Stripe nên nhãn chữ giống nhau,
// đọc được cả ba bằng một bộ quy tắc (xem lib/docHoaDonNgoai.ts). Google và
// Facebook cũng tải lên được — hệ thống tự xếp Nhóm 1 và không tính thuế nhà thầu.
//
// LUÔN cho soát trước khi lưu, KHÔNG ghi thẳng: số này đi vào tờ khai thuế, máy
// đọc nhầm một chữ số là sai số nộp Kho bạc. Ô nào máy không chắc thì để trống
// và hiện cảnh báo màu hổ phách ngay dưới dòng đó.
//
// File đọc NGAY TRONG TRÌNH DUYỆT, không gửi lên máy chủ.
//
// Kỳ khai lấy theo NGÀY TRÊN TỪNG HÓA ĐƠN, không theo tháng đang chọn ở trên —
// tải một lúc hóa đơn nhiều tháng thì mỗi tờ tự về đúng kỳ của nó.
type DongNhap = {
  ten: string;
  ngay_hoa_don: string;
  nha_cung_cap: string;
  so_hoa_don: string;
  tien: string;
  tienTe: string;
  nhom: NhomNcc;
  loai: LoaiDichVu;
  hop_dong_net: boolean;
  canhBao: string[];
};

function KhoiTaiPdfNgoai({ tyGia, onSaved }: { tyGia: string; onSaved: () => void }) {
  const [dangDoc, setDangDoc] = useState(false);
  const [tienDo, setTienDo] = useState("");
  const [rows, setRows] = useState<DongNhap[] | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [notice, setNotice] = useState("");

  async function chonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // cho phép chọn lại đúng file đó
    if (files.length === 0) return;

    setDangDoc(true);
    setNotice("");
    const ra: DongNhap[] = [];

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setTienDo(`Đang đọc ${i + 1}/${files.length} — ${f.name}`);
        try {
          const tap = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
          let chu = "";
          for (let p = 1; p <= tap.numPages; p++) {
            const trang = await tap.getPage(p);
            const noiDung = await trang.getTextContent();
            chu += " " + noiDung.items.map((m) => ("str" in m ? m.str : "")).join(" ");
          }
          const hd = docHoaDonNgoai(chu);
          ra.push({
            ten: f.name,
            ngay_hoa_don: hd.ngay_hoa_don ?? "",
            nha_cung_cap: hd.nha_cung_cap,
            so_hoa_don: hd.so_hoa_don ?? "",
            tien: hd.tien > 0 ? String(hd.tien) : "",
            tienTe: hd.tienTe,
            // Hóa đơn tự khai đã đăng ký thuế VN thì tin hóa đơn, không tin danh sách đoán tên.
            nhom: hd.daDangKyVn ? "da_dang_ky" : doanNhom(hd.nha_cung_cap),
            loai: "dich_vu",
            hop_dong_net: true,
            canhBao: hd.canhBao,
          });
        } catch (err) {
          ra.push({
            ten: f.name, ngay_hoa_don: "", nha_cung_cap: "", so_hoa_don: "", tien: "",
            tienTe: "USD", nhom: "phai_khai_thay", loai: "dich_vu", hop_dong_net: true,
            canhBao: ["Không mở được file này: " + String(err)],
          });
        }
      }
    } catch (err) {
      setNotice("Không nạp được bộ đọc PDF: " + String(err));
    }

    setRows([...(rows ?? []), ...ra]);
    setTienDo("");
    setDangDoc(false);
  }

  function sua(i: number, thay: Partial<DongNhap>) {
    setRows((cu) => (cu ?? []).map((d, k) => (k === i ? { ...d, ...thay } : d)));
  }

  /** Quy ra VNĐ: hóa đơn ghi VNĐ thì giữ nguyên, ghi USD thì nhân tỷ giá. */
  function raVnd(d: DongNhap): number {
    const so = Number(d.tien) || 0;
    if (d.tienTe === "VND") return Math.round(so);
    return Math.round(so * (Number(tyGia) || 0));
  }

  async function luuHet() {
    const ds = rows ?? [];
    if (ds.length === 0) return;
    const thieuTyGia = ds.some((d) => d.tienTe !== "VND") && !(Number(tyGia) > 0);
    if (thieuTyGia) return setNotice("Chưa nhập tỷ giá NHNN ở trên — bấm “Lấy tỷ giá NHNN”.");

    setDangLuu(true);
    setNotice("");
    const supabase = createClient();
    let luu = 0;
    const hong: string[] = [];

    for (const d of ds) {
      const vnd_ = raVnd(d);
      if (!d.ngay_hoa_don || !d.nha_cung_cap.trim() || !(vnd_ > 0)) {
        hong.push(`${d.ten}: còn thiếu ngày, nhà cung cấp hoặc số tiền`);
        continue;
      }
      const kq = d.nhom === "da_dang_ky"
        ? { dtGtgt: 0, thueGtgt: 0, dtTndn: 0, thueTndn: 0 }
        : tinhFct(vnd_, d.loai, d.hop_dong_net);

      const { error } = await supabase.from("hoa_don_ngoai").insert({
        ky_thang: d.ngay_hoa_don.slice(0, 7) + "-01", // kỳ khai = tháng của chính hóa đơn
        ngay_hoa_don: d.ngay_hoa_don,
        nha_cung_cap: d.nha_cung_cap.trim(),
        so_hoa_don: d.so_hoa_don.trim() || null,
        dien_giai: null,
        nhom: d.nhom,
        loai: d.loai,
        hop_dong_net: d.hop_dong_net,
        tien_usd: d.tienTe === "VND" ? 0 : Number(d.tien) || 0,
        ty_gia: d.tienTe === "VND" ? 1 : Number(tyGia) || 0,
        tien_vnd: vnd_,
        dt_gtgt: kq.dtGtgt,
        thue_gtgt: kq.thueGtgt,
        dt_tndn: kq.dtTndn,
        thue_tndn: kq.thueTndn,
      });
      if (error) {
        hong.push(
          /duplicate key|uq_hoa_don_ngoai_so/i.test(error.message)
            ? `${d.ten}: đã có trong sổ, bỏ qua`
            : `${d.ten}: ${error.message}`,
        );
      } else {
        luu++;
      }
    }

    setDangLuu(false);
    setRows(null);
    setNotice(
      `Đã lưu ${luu}/${ds.length} hóa đơn.` +
        (hong.length ? " Không lưu được: " + hong.join(" · ") : "") +
        " Hóa đơn thuộc tháng khác đã tự về đúng kỳ của nó — đổi tháng ở trên để xem.",
    );
    onSaved();
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-cvr-line bg-cvr-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-cvr-ink">Tải hóa đơn nước ngoài (file PDF)</p>
          <p className="mt-0.5 text-xs text-cvr-muted">
            Chọn nhiều file cùng lúc — hệ thống tự đọc nhà cung cấp, số hóa đơn, ngày, số tiền rồi
            tính sẵn thuế. Đọc ngay trên máy anh, file không gửi đi đâu.
          </p>
        </div>
        <label className={btnPhu + " cursor-pointer whitespace-nowrap"}>
          {dangDoc ? "Đang đọc…" : "Chọn file PDF"}
          <input type="file" accept=".pdf,application/pdf" multiple onChange={chonFile} className="hidden" disabled={dangDoc} />
        </label>
      </div>

      {tienDo && <p className="mt-2 text-xs text-cvr-body">{tienDo}</p>}
      {notice && <p className="mt-2 text-sm text-cvr-body">{notice}</p>}

      {rows && rows.length > 0 && (
        <div className="mt-4 border-t border-cvr-line pt-4">
          <p className="text-sm font-medium text-cvr-ink">
            Soát lại {rows.length} hóa đơn rồi mới lưu
          </p>

          <div className="mt-3 space-y-3">
            {rows.map((d, i) => {
              const vnd_ = raVnd(d);
              const kq = d.nhom === "da_dang_ky"
                ? { thueGtgt: 0, thueTndn: 0, tongNop: 0 }
                : tinhFct(vnd_, d.loai, d.hop_dong_net);
              return (
                <div key={i} className="rounded-lg border border-cvr-line bg-white p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-cvr-muted">{d.ten}</span>
                    <button
                      onClick={() => setRows((cu) => (cu ?? []).filter((_, k) => k !== i))}
                      className="text-xs text-cvr-muted underline hover:text-cvr-ink"
                    >
                      Bỏ dòng này
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <L label="Ngày hóa đơn">
                      <input type="date" value={d.ngay_hoa_don} onChange={(e) => sua(i, { ngay_hoa_don: e.target.value })} className={inp} />
                    </L>
                    <L label="Nhà cung cấp">
                      <input
                        value={d.nha_cung_cap}
                        onChange={(e) => sua(i, { nha_cung_cap: e.target.value, nhom: doanNhom(e.target.value) })}
                        className={inp}
                      />
                    </L>
                    <L label="Số hóa đơn">
                      <input value={d.so_hoa_don} onChange={(e) => sua(i, { so_hoa_don: e.target.value })} className={inp} />
                    </L>
                    <L label={`Số tiền (${d.tienTe})`}>
                      <input value={d.tien} onChange={(e) => sua(i, { tien: e.target.value })} className={inp} inputMode="decimal" />
                    </L>
                    <L label="Nhóm nhà cung cấp">
                      <select value={d.nhom} onChange={(e) => sua(i, { nhom: e.target.value as NhomNcc })} className={inp}>
                        <option value="phai_khai_thay">Chưa đăng ký tại VN — khai nộp thay</option>
                        <option value="da_dang_ky">Đã đăng ký tại VN — không khai thay</option>
                      </select>
                    </L>
                    <L label="Bản chất khoản chi">
                      <select value={d.loai} onChange={(e) => sua(i, { loai: e.target.value as LoaiDichVu })} className={inp}>
                        {(Object.keys(TY_LE) as LoaiDichVu[]).map((k) => (
                          <option key={k} value={k}>{TY_LE[k].nhan}</option>
                        ))}
                      </select>
                    </L>
                    <div className="sm:col-span-2 sm:pt-6">
                      <p className="text-sm text-cvr-body">
                        Quy đổi <strong className="text-cvr-ink">{vnd(vnd_)}</strong>
                        {d.nhom === "da_dang_ky" ? (
                          <span className="text-cvr-muted"> · không khai nộp thay</span>
                        ) : (
                          <>
                            {" · GTGT "}<strong className="text-cvr-ink">{vnd(kq.thueGtgt)}</strong>
                            {" · TNDN "}<strong className="text-cvr-ink">{vnd(kq.thueTndn)}</strong>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {d.canhBao.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {d.canhBao.map((c, k) => (
                        <li key={k} className="text-xs text-amber-700">⚠️ {c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={luuHet}
              disabled={dangLuu}
              className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
            >
              {dangLuu ? "Đang lưu…" : `Lưu ${rows.length} hóa đơn`}
            </button>
            <button onClick={() => setRows(null)} className={btnPhu}>Bỏ hết</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Form thêm hóa đơn nước ngoài — tính thuế ngay khi gõ để thấy trước số phải nộp.
function FormNgoai({
  kyThang,
  tyGia,
  tu,
  den,
  onSaved,
}: {
  kyThang: string;
  tyGia: string;
  tu: Date;
  den: Date;
  onSaved: () => void;
}) {
  const [mo, setMo] = useState(false);
  const [f, setF] = useState({
    ngay_hoa_don: ngayISO(new Date()),
    nha_cung_cap: "",
    so_hoa_don: "",
    dien_giai: "",
    tien_usd: "",
    loai: "dich_vu" as LoaiDichVu,
    nhom: "phai_khai_thay" as NhomNcc,
    hop_dong_net: true,
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  // Nhóm tự đoán theo tên nhà cung cấp, nhưng chọn tay thì giữ lựa chọn của người dùng.
  const [tuDoanNhom, setTuDoanNhom] = useState(true);
  const nhom = tuDoanNhom ? doanNhom(f.nha_cung_cap) : f.nhom;

  const tienVnd = Math.round((Number(f.tien_usd) || 0) * (Number(tyGia) || 0));
  const kq = nhom === "da_dang_ky"
    ? { dtGtgt: 0, thueGtgt: 0, dtTndn: 0, thueTndn: 0, tongNop: 0 }
    : tinhFct(tienVnd, f.loai, f.hop_dong_net);

  async function luu(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nha_cung_cap.trim()) return setNotice("Chưa điền nhà cung cấp.");
    if (!(Number(tyGia) > 0)) return setNotice("Chưa nhập tỷ giá NHNN ở trên.");
    if (!(Number(f.tien_usd) > 0)) return setNotice("Chưa nhập số tiền USD.");

    const ngay = new Date(`${f.ngay_hoa_don}T12:00:00`);
    if (ngay < tu || ngay > den) {
      return setNotice("Ngày hóa đơn không nằm trong tháng đang chọn — đổi tháng ở trên hoặc sửa lại ngày.");
    }

    setSaving(true);
    setNotice("");
    const { error } = await createClient().from("hoa_don_ngoai").insert({
      ky_thang: kyThang,
      ngay_hoa_don: f.ngay_hoa_don,
      nha_cung_cap: f.nha_cung_cap.trim(),
      so_hoa_don: f.so_hoa_don.trim() || null,
      dien_giai: f.dien_giai.trim() || null,
      nhom,
      loai: f.loai,
      hop_dong_net: f.hop_dong_net,
      tien_usd: Number(f.tien_usd),
      ty_gia: Number(tyGia),
      tien_vnd: tienVnd,
      dt_gtgt: kq.dtGtgt,
      thue_gtgt: kq.thueGtgt,
      dt_tndn: kq.dtTndn,
      thue_tndn: kq.thueTndn,
    });
    setSaving(false);
    if (error) {
      return setNotice(
        /duplicate key|uq_hoa_don_ngoai_so/i.test(error.message)
          ? "Hóa đơn này đã có trong sổ (trùng nhà cung cấp + số hóa đơn)."
          : "Lưu thất bại: " + error.message,
      );
    }
    setF({ ...f, nha_cung_cap: "", so_hoa_don: "", dien_giai: "", tien_usd: "" });
    setTuDoanNhom(true);
    setNotice("Đã lưu ✓");
    onSaved();
  }

  return (
    <div className="mt-4">
      <button onClick={() => setMo((v) => !v)} className={btnPhu}>
        {mo ? "Đóng" : "+ Thêm hóa đơn nước ngoài"}
      </button>

      {mo && (
        <form onSubmit={luu} className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-cvr-surface p-4 sm:grid-cols-3">
          <L label="Ngày hóa đơn">
            <input type="date" value={f.ngay_hoa_don} onChange={(e) => setF({ ...f, ngay_hoa_don: e.target.value })} className={inp} />
          </L>
          <L label="Nhà cung cấp *">
            <input
              list="ds-ncc-ngoai"
              value={f.nha_cung_cap}
              onChange={(e) => { setF({ ...f, nha_cung_cap: e.target.value }); setTuDoanNhom(true); }}
              className={inp}
              placeholder="Anthropic / Vercel / Supabase…"
            />
            <datalist id="ds-ncc-ngoai">
              {NCC_DA_BIET.map((n) => <option key={n.khoa} value={n.ten} />)}
            </datalist>
          </L>
          <L label="Số hóa đơn">
            <input value={f.so_hoa_don} onChange={(e) => setF({ ...f, so_hoa_don: e.target.value })} className={inp} placeholder="INV-2026-0001" />
          </L>

          <L label="Số tiền (USD) *">
            <input value={f.tien_usd} onChange={(e) => setF({ ...f, tien_usd: e.target.value })} className={inp} inputMode="decimal" placeholder="100" />
          </L>
          <L label="Bản chất khoản chi">
            <select value={f.loai} onChange={(e) => setF({ ...f, loai: e.target.value as LoaiDichVu })} className={inp}>
              {(Object.keys(TY_LE) as LoaiDichVu[]).map((k) => (
                <option key={k} value={k}>{TY_LE[k].nhan}</option>
              ))}
            </select>
          </L>
          <L label="Nhóm nhà cung cấp">
            <select
              value={nhom}
              onChange={(e) => { setTuDoanNhom(false); setF({ ...f, nhom: e.target.value as NhomNcc }); }}
              className={inp}
            >
              <option value="phai_khai_thay">Chưa đăng ký tại VN — phải khai nộp thay</option>
              <option value="da_dang_ky">Đã đăng ký thuế tại VN (MST đầu 80) — không khai thay</option>
            </select>
          </L>

          <L label="Diễn giải">
            <input value={f.dien_giai} onChange={(e) => setF({ ...f, dien_giai: e.target.value })} className={inp} placeholder="Claude API tháng 8/2026" />
          </L>
          <label className="flex items-end gap-2 pb-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={f.hop_dong_net}
              onChange={(e) => setF({ ...f, hop_dong_net: e.target.checked })}
              className="h-4 w-4 accent-cvr-ink"
            />
            <span className="text-sm text-cvr-body">
              Hợp đồng NET{" "}
              <span className="text-cvr-muted">
                (trả thẻ, nhà cung cấp nhận đủ số tiền — mình chịu thuế, phải quy đổi ngược)
              </span>
            </span>
          </label>

          {/* Xem trước số thuế — thấy ngay trước khi lưu */}
          <div className="rounded-lg border border-cvr-line bg-white p-3 text-sm sm:col-span-3">
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-1">
              <span className="text-cvr-muted">Tiền quy đổi</span>
              <span className="tabular-nums font-medium text-cvr-ink">{vnd(tienVnd)}</span>
            </div>
            {nhom === "da_dang_ky" ? (
              <p className="mt-1 text-xs text-cvr-muted">
                Nhà cung cấp đã đăng ký thuế tại VN — không khai nộp thay, toàn bộ tính vào chi phí TNDN.
              </p>
            ) : (
              <>
                <div className="mt-1 flex flex-wrap justify-between gap-x-6 gap-y-1">
                  <span className="text-cvr-muted">Thuế GTGT nộp thay (được khấu trừ)</span>
                  <span className="tabular-nums font-medium text-cvr-ink">{vnd(kq.thueGtgt)}</span>
                </div>
                <div className="mt-1 flex flex-wrap justify-between gap-x-6 gap-y-1">
                  <span className="text-cvr-muted">Thuế TNDN nộp thay (chi phí)</span>
                  <span className="tabular-nums font-medium text-cvr-ink">{vnd(kq.thueTndn)}</span>
                </div>
                <div className="mt-1 flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-cvr-line pt-1">
                  <span className="font-medium text-cvr-ink">Tổng nộp Kho bạc</span>
                  <span className="tabular-nums font-semibold text-cvr-ink">{vnd(kq.tongNop)}</span>
                </div>
              </>
            )}
          </div>

          <div className="sm:col-span-3">
            {notice && <p className="mb-2 text-sm text-cvr-body">{notice}</p>}
            <button type="submit" disabled={saving} className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60">
              {saving ? "Đang lưu…" : "Lưu hóa đơn"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// Nộp xong Kho bạc thì đánh dấu — CHƯA đánh dấu thì chưa được cộng vào khấu trừ,
// vì Nghị định 181/2025 đòi phải có chứng từ nộp thuế thật.
function KhoiDanhDauNop({ rows, onSaved }: { rows: DongNgoai[]; onSaved: () => void }) {
  const [ngayNop, setNgayNop] = useState(ngayISO(new Date()));
  const [chungTu, setChungTu] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [notice, setNotice] = useState("");

  const choNop = rows.filter((d) => d.nhom === "phai_khai_thay" && !d.da_nop);
  if (choNop.length === 0) return null;

  const tongNop = choNop.reduce((s, d) => s + Number(d.thue_gtgt || 0) + Number(d.thue_tndn || 0), 0);

  async function danhDau() {
    setDangLuu(true);
    setNotice("");
    const { error } = await createClient()
      .from("hoa_don_ngoai")
      .update({ da_nop: true, ngay_nop: ngayNop, chung_tu_nop: chungTu.trim() || null })
      .in("id", choNop.map((d) => d.id));
    setDangLuu(false);
    if (error) return setNotice("Lỗi: " + error.message);
    setChungTu("");
    setNotice(`Đã đánh dấu ${choNop.length} hóa đơn là đã nộp — thuế GTGT nay được cộng vào khấu trừ ✓`);
    onSaved();
  }

  return (
    <div className="mt-5 rounded-xl bg-cvr-surface p-4">
      <p className="text-sm font-medium text-cvr-ink">Nộp Kho bạc xong rồi thì bấm đây</p>
      <p className="mt-1 text-xs text-cvr-muted">
        {choNop.length} hóa đơn đang chờ, tổng phải nộp <strong className="text-cvr-ink">{vnd(tongNop)}</strong>.
        Nộp bằng mã số thuế nộp thay (MST chính kèm đuôi -999) trên thuedientu.gdt.gov.vn.
        Chưa đánh dấu thì thuế GTGT chưa được cộng vào chỉ tiêu [24] [25].
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cvr-body">Ngày nộp</span>
          <input type="date" value={ngayNop} onChange={(e) => setNgayNop(e.target.value)} className={inp} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cvr-body">Số chứng từ nộp (tuỳ chọn)</span>
          <input value={chungTu} onChange={(e) => setChungTu(e.target.value)} className={inp} placeholder="Giấy nộp tiền số…" />
        </label>
        <button onClick={danhDau} disabled={dangLuu} className={btnPhu}>
          {dangLuu ? "Đang lưu…" : "Đánh dấu đã nộp"}
        </button>
      </div>
      {notice && <p className="mt-2 text-sm text-cvr-body">{notice}</p>}
    </div>
  );
}

function csvNtnn(rows: DongNgoai[], thang: number, nam: number): string {
  const phaiKhai = rows.filter((d) => d.nhom === "phai_khai_thay");
  const c = (k: keyof DongNgoai) => phaiKhai.reduce((s, d) => s + Number(d[k] || 0), 0);
  return [
    ["Chi tieu", "Noi dung", "So tien"].map(o).join(","),
    ["", o(`To khai thue nha thau 01/NTNN - Thang ${thang}/${nam}`), ""].join(","),
    "",
    ["Ngay HD", "Nha cung cap", "So HD", "Dien giai", "USD", "Ty gia NHNN", "Tien VND", "DT tinh GTGT", "Thue GTGT", "DT tinh TNDN", "Thue TNDN"].map(o).join(","),
    ...phaiKhai.map((d) =>
      [
        o(d.ngay_hoa_don), o(d.nha_cung_cap), o(d.so_hoa_don), o(d.dien_giai),
        d.tien_usd, d.ty_gia, d.tien_vnd, d.dt_gtgt, d.thue_gtgt, d.dt_tndn, d.thue_tndn,
      ].join(","),
    ),
    "",
    [o("TONG CONG"), "", "", "", "", "", c("tien_vnd"), c("dt_gtgt"), c("thue_gtgt"), c("dt_tndn"), c("thue_tndn")].join(","),
    "",
    [o("Thue GTGT nop thay - dua vao chi tieu [24] va [25] cua to khai 01/GTGT"), "", c("thue_gtgt")].join(","),
    [o("Tong phai nop Kho bac"), "", c("thue_gtgt") + c("thue_tndn")].join(","),
  ].join("\n");
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
