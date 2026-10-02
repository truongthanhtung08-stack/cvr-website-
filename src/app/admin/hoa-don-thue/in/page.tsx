"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { THUE_SUAT_KHAI, khoangQuy } from "@/lib/thue";
import {
  NGUOI_NOP_THUE,
  congSo,
  khoaCt22,
  napSoLieu,
  ngayISO,
  type DongDoanhThu,
  type DongNgoai,
  type DongVao,
} from "@/lib/soLieuThue";
import { COT_TNCN, bangKe051, bangKe052, tongHop05, type DongChiTra } from "@/lib/thueTncn";

// ============================================================================
// IN BÁO CÁO THUẾ — mở từ nút "In báo cáo" ở /admin/hoa-don-thue
// ----------------------------------------------------------------------------
//   ?nam=2026&quy=3  → bộ hồ sơ QUÝ: 01/GTGT · tạm nộp TNDN ·
//                       05/KK-TNCN · bảng kê hóa đơn ra/vào
//   ?nam=2026        → bộ hồ sơ NĂM: tổng hợp GTGT 4 quý · số liệu quyết toán TNDN ·
//                       05/QTT-TNCN + bảng kê 05-1, 05-2
//
// Bố cục chép theo mẫu tờ khai để chủ dự án nhìn bản in mà gõ vào cổng thuế điện
// tử (khai trực tuyến), và lưu làm hồ sơ. Bản in KHÔNG thay tờ khai nộp trên cổng.
// Số liệu tính bằng đúng hàm của trang nhập liệu (src/lib/soLieuThue.ts) → không lệch.
// ============================================================================

export default function TrangIn() {
  return (
    <Suspense fallback={<p className="text-sm text-cvr-muted">Đang tải…</p>}>
      <BoHoSo />
    </Suspense>
  );
}

type Ky = { ra: DongDoanhThu[]; vao: DongVao[]; ngoai: DongNgoai[] };

function BoHoSo() {
  const sp = useSearchParams();
  const nam = Number(sp.get("nam")) || new Date().getFullYear();
  const quy = Number(sp.get("quy")) || 0; // 0 = cả năm

  const [quyData, setQuyData] = useState<(Ky | null)[] | null>(null);
  const [tncn, setTncn] = useState<DongChiTra[]>([]);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const dsQuy = quy ? [quy] : [1, 2, 3, 4];
    void (async () => {
      const kq = await Promise.all(
        dsQuy.map(async (q) => {
          const { tu, den } = khoangQuy(nam, q);
          const { r1, r2, r3 } = await napSoLieu(supabase, tu, den);
          if (r1.error || r2.error) {
            setLoi(r1.error?.message || r2.error?.message || "");
            return null;
          }
          return {
            ra: (r1.data ?? []) as unknown as DongDoanhThu[],
            vao: (r2.data ?? []) as unknown as DongVao[],
            ngoai: r3.error ? [] : ((r3.data ?? []) as unknown as DongNgoai[]),
          };
        }),
      );
      setQuyData(kq);

      const tu = khoangQuy(nam, quy || 1).tu;
      const den = khoangQuy(nam, quy || 4).den;
      const { data } = await supabase
        .from("tncn_chi_tra")
        .select(COT_TNCN)
        .gte("ngay_tra", ngayISO(tu))
        .lte("ngay_tra", ngayISO(den))
        .order("ngay_tra", { ascending: true });
      setTncn((data ?? []) as DongChiTra[]);
    })();
  }, [nam, quy]);

  const ct22 = (q: number) => {
    try {
      return Number(localStorage.getItem(khoaCt22(nam, q))) || 0;
    } catch {
      return 0;
    }
  };

  if (!quyData) return <p className="text-sm text-cvr-muted">Đang gom số liệu…</p>;

  return (
    <div>
      <style>{IN_CSS}</style>
      <div className="khong-in mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-cvr-line bg-white p-4">
        <button onClick={() => window.print()} className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white">
          In / Lưu PDF
        </button>
        <p className="text-sm text-cvr-muted">
          Hộp thoại in: chọn khổ A4, bỏ tích &ldquo;Đầu trang và chân trang&rdquo;. Muốn lưu file thì chọn
          máy in &ldquo;Lưu dưới dạng PDF&rdquo;. Bản in dùng để <strong>chép vào cổng thuế điện tử và lưu hồ sơ</strong> —
          nộp chính thức vẫn là ký số trên cổng.
        </p>
        {loi && <p className="w-full text-sm text-red-700">Lỗi đọc số liệu: {loi}</p>}
      </div>

      <div className="vung-in">
        {quy ? (
          <HoSoQuy nam={nam} quy={quy} ky={quyData[0]} ct22={ct22(quy)} tncn={tncn} />
        ) : (
          <HoSoNam nam={nam} dsKy={quyData} ct22={ct22} tncn={tncn} />
        )}
      </div>
    </div>
  );
}

// ── BỘ HỒ SƠ QUÝ ────────────────────────────────────────────────────────────

function HoSoQuy({ nam, quy, ky, ct22, tncn }: { nam: number; quy: number; ky: Ky | null; ct22: number; tncn: DongChiTra[] }) {
  const t = useMemo(() => congSo(ky?.ra ?? [], ky?.vao ?? [], ky?.ngoai ?? []), [ky]);
  const kyThue = `Quý ${quy} năm ${nam}`;
  const th = useMemo(() => tongHop05(tncn), [tncn]);
  return (
    <>
      <ToKhaiGtgt kyThue={kyThue} t={t} ct22={ct22} />
      <TamNopTndn kyThue={kyThue} t={t} />
      <ToKhai05 kyThue={kyThue} th={th} mau="05/KK-TNCN" />
      <BangKeRaVao kyThue={kyThue} ky={ky} />
    </>
  );
}

// ── BỘ HỒ SƠ NĂM ────────────────────────────────────────────────────────────

function HoSoNam({ nam, dsKy, ct22, tncn }: { nam: number; dsKy: (Ky | null)[]; ct22: (q: number) => number; tncn: DongChiTra[] }) {
  const dsT = dsKy.map((k) => congSo(k?.ra ?? [], k?.vao ?? [], k?.ngoai ?? []));
  const ca = congSo(
    dsKy.flatMap((k) => k?.ra ?? []),
    dsKy.flatMap((k) => k?.vao ?? []),
    dsKy.flatMap((k) => k?.ngoai ?? []),
  );
  const tamNop4Quy = dsT.reduce((s, t) => s + t.tamNopTndn, 0);
  const thueNam = Math.max(0, Math.round(ca.loiNhuan * 0.15));
  const th = tongHop05(tncn);
  const bk1 = bangKe051(tncn);
  const bk2 = bangKe052(tncn);

  return (
    <>
      <Trang>
        <TieuDe ten={`TỔNG HỢP THUẾ GTGT NĂM ${nam}`} phu="Đối chiếu bốn tờ khai 01/GTGT đã nộp trong năm" />
        <ThongTinNnt kyThue={`Năm ${nam}`} />
        <table className="bang">
          <thead>
            <tr>
              <th>Kỳ</th>
              <th>[34] Doanh thu</th>
              <th>[35] Thuế đầu ra</th>
              <th>[25] Thuế được khấu trừ</th>
              <th>[22] Kỳ trước chuyển sang</th>
              <th>[40] Phải nộp</th>
              <th>[43] Chuyển kỳ sau</th>
            </tr>
          </thead>
          <tbody>
            {dsT.map((t, i) => {
              const con = t.phaiNop - ct22(i + 1);
              return (
                <tr key={i}>
                  <td>Quý {i + 1}</td>
                  <td className="so">{so(t.dtChuaThue)}</td>
                  <td className="so">{so(t.thueRa)}</td>
                  <td className="so">{so(t.thueVao)}</td>
                  <td className="so">{so(ct22(i + 1))}</td>
                  <td className="so">{so(Math.max(0, con))}</td>
                  <td className="so">{so(Math.max(0, -con))}</td>
                </tr>
              );
            })}
            <tr className="dam">
              <td>Cả năm</td>
              <td className="so">{so(ca.dtChuaThue)}</td>
              <td className="so">{so(ca.thueRa)}</td>
              <td className="so">{so(ca.thueVao)}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <GhiChu>
          Cột [22] lấy theo số đã nhập ở từng quý trên trang Hóa đơn &amp; thuế (máy này). Quý nào để trống là 0.
        </GhiChu>
      </Trang>

      <Trang>
        <TieuDe ten={`SỐ LIỆU QUYẾT TOÁN THUẾ TNDN NĂM ${nam}`} phu="Dùng để lập tờ khai 03/TNDN và phụ lục 03-1A/TNDN — hạn 31/3 năm sau" />
        <ThongTinNnt kyThue={`Năm ${nam}`} />
        <table className="bang">
          <tbody>
            <Dong ma="" ten="Doanh thu bán hàng và cung cấp dịch vụ (chưa thuế GTGT)" tien={ca.dtChuaThue} />
            <Dong ma="" ten="Chi phí có hóa đơn trên sổ web (trong nước + nước ngoài + thuế nhà thầu TNDN)" tien={ca.tongChiPhi} />
            <Dong ma="" ten="Lợi nhuận trước thuế theo sổ web" tien={ca.loiNhuan} dam />
            <Dong ma="" ten="Thuế TNDN 15% (doanh thu năm ≤ 3 tỷ — Luật 67/2025/QH15)" tien={thueNam} dam />
            <Dong ma="" ten="Tạm nộp 4 quý theo sổ web" tien={tamNop4Quy} />
            <Dong ma="" ten="Mức tối thiểu phải tạm nộp (80% thuế cả năm)" tien={Math.round(thueNam * 0.8)} />
            <Dong
              ma=""
              ten={tamNop4Quy >= thueNam * 0.8 ? "Đã đủ mức 80% ✓" : "THIẾU so với mức 80% — nộp bù trước hạn quyết toán"}
              tien={Math.max(0, Math.round(thueNam * 0.8) - tamNop4Quy)}
              dam
            />
          </tbody>
        </table>
        <GhiChu>
          Sổ web CHƯA có lương, bảo hiểm phần công ty đóng, khấu hao, chi phí không có hóa đơn trên web — kế toán
          bổ sung khi lập báo cáo tài chính. &ldquo;Tạm nộp&rdquo; ở đây là số web tính; số đã nộp thật xem trên cổng
          thuế (Tra cứu nghĩa vụ thuế).
        </GhiChu>
      </Trang>

      <ToKhai05 kyThue={`Năm ${nam}`} th={th} mau="05/QTT-TNCN" />

      <Trang>
        <TieuDe ten="BẢNG KÊ 05-1/BK-QTT-TNCN" phu="Thu nhập chịu thuế và thuế TNCN đã khấu trừ của cá nhân cư trú có hợp đồng lao động từ 3 tháng trở lên" />
        <ThongTinNnt kyThue={`Năm ${nam}`} />
        {bk1.length === 0 ? (
          <p className="text-sm">Không có cá nhân thuộc diện này.</p>
        ) : (
          <table className="bang nho">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ tên</th>
                <th>MST / CCCD</th>
                <th>Tổng TNCT</th>
                <th>Giảm trừ bản thân</th>
                <th>Giảm trừ NPT</th>
                <th>Bảo hiểm</th>
                <th>TN tính thuế</th>
                <th>Đã khấu trừ</th>
                <th>Phải nộp cả năm</th>
                <th>Nộp thêm (+) / thừa (−)</th>
              </tr>
            </thead>
            <tbody>
              {bk1.map((d, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{d.ho_ten}</td>
                  <td>{d.ma_so ?? ""}</td>
                  <td className="so">{so(d.thuNhap)}</td>
                  <td className="so">{so(d.giamTruBanThan)}</td>
                  <td className="so">{so(d.giamTruNpt)}</td>
                  <td className="so">{so(d.baoHiem)}</td>
                  <td className="so">{so(d.thuNhapTinhThue)}</td>
                  <td className="so">{so(d.daKhauTru)}</td>
                  <td className="so">{so(d.phaiNop)}</td>
                  <td className="so">{so(d.chenhLech)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <GhiChu>
          Cột &ldquo;Phải nộp cả năm&rdquo; chỉ đúng cho người ỦY QUYỀN công ty quyết toán (mẫu 08/UQ-QTT-TNCN, chỉ có thu
          nhập ở công ty). Giảm trừ bản thân tính đủ 12 tháng; người phụ thuộc tính theo số tháng đã nhập.
        </GhiChu>
      </Trang>

      <Trang>
        <TieuDe ten="BẢNG KÊ 05-2/BK-QTT-TNCN" phu="Thu nhập chịu thuế và thuế TNCN đã khấu trừ của cá nhân không ký HĐLĐ / HĐ dưới 3 tháng / không cư trú" />
        <ThongTinNnt kyThue={`Năm ${nam}`} />
        {bk2.length === 0 ? (
          <p className="text-sm">Không có cá nhân thuộc diện này.</p>
        ) : (
          <table className="bang">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ tên</th>
                <th>MST / CCCD</th>
                <th>Cư trú</th>
                <th>Tổng TNCT</th>
                <th>TNCT thuộc diện khấu trừ</th>
                <th>Thuế đã khấu trừ</th>
              </tr>
            </thead>
            <tbody>
              {bk2.map((d, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{d.ho_ten}</td>
                  <td>{d.ma_so ?? ""}</td>
                  <td>{d.khongCuTru ? "Không" : "Có"}</td>
                  <td className="so">{so(d.thuNhap)}</td>
                  <td className="so">{so(d.thuocDien)}</td>
                  <td className="so">{so(d.daKhauTru)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Trang>
    </>
  );
}

// ── CÁC MẪU ─────────────────────────────────────────────────────────────────

type T = ReturnType<typeof congSo>;

function ToKhaiGtgt({ kyThue, t, ct22 }: { kyThue: string; t: T; ct22: number }) {
  const ketQua = t.phaiNop - ct22; // [36] − [22] (+[37] −[38] −[39a] = 0)
  const khongPhatSinh = t.dtChuaThue === 0 && t.hangVao === 0;
  return (
    <Trang>
      <TieuDe ten="TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG" phu="(Áp dụng đối với người nộp thuế tính thuế theo phương pháp khấu trừ có hoạt động sản xuất kinh doanh) — Mẫu số 01/GTGT" />
      <ThongTinNnt kyThue={kyThue} />
      <table className="bang">
        <thead>
          <tr>
            <th>STT</th>
            <th>Chỉ tiêu</th>
            <th>Giá trị HHDV (chưa có thuế GTGT)</th>
            <th>Thuế GTGT</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>A</td><td>Không phát sinh hoạt động mua, bán trong kỳ (đánh dấu &ldquo;X&rdquo;) <b>[21]</b></td><td colSpan={2} className="giua">{khongPhatSinh ? "X" : ""}</td></tr>
          <tr><td>B</td><td>Thuế GTGT còn được khấu trừ kỳ trước chuyển sang <b>[22]</b></td><td></td><td className="so">{so(ct22)}</td></tr>
          <tr className="nhom"><td>C</td><td colSpan={3}>Kê khai thuế GTGT phải nộp Ngân sách nhà nước</td></tr>
          <tr className="nhom"><td>I</td><td colSpan={3}>Hàng hoá, dịch vụ mua vào trong kỳ</td></tr>
          <tr><td>1</td><td>Giá trị và thuế GTGT của hàng hoá, dịch vụ mua vào <b>[23] [24]</b></td><td className="so">{so(t.hangVao)}</td><td className="so">{so(t.thueVao)}</td></tr>
          <tr><td></td><td>Trong đó: hàng hoá, dịch vụ nhập khẩu <b>[23a] [24a]</b></td><td className="so">0</td><td className="so">0</td></tr>
          <tr><td>2</td><td>Thuế GTGT của hàng hoá, dịch vụ mua vào được khấu trừ kỳ này <b>[25]</b></td><td></td><td className="so">{so(t.thueVao)}</td></tr>
          <tr className="nhom"><td>II</td><td colSpan={3}>Hàng hoá, dịch vụ bán ra trong kỳ</td></tr>
          <tr><td>1</td><td>Hàng hóa, dịch vụ bán ra không chịu thuế GTGT <b>[26]</b></td><td className="so">0</td><td></td></tr>
          <tr><td>2</td><td>Hàng hóa, dịch vụ bán ra chịu thuế GTGT <b>[27]</b>=[29]+[30]+[32]+[32a]; <b>[28]</b>=[31]+[33]</td><td className="so">{so(t.dtChuaThue)}</td><td className="so">{so(t.thueRa)}</td></tr>
          <tr><td>a</td><td>Hàng hoá, dịch vụ bán ra chịu thuế suất 0% <b>[29]</b></td><td className="so">0</td><td></td></tr>
          <tr><td>b</td><td>Hàng hoá, dịch vụ bán ra chịu thuế suất 5% <b>[30] [31]</b></td><td className="so">0</td><td className="so">0</td></tr>
          <tr><td>c</td><td>Hàng hoá, dịch vụ bán ra chịu thuế suất 10% <b>[32] [33]</b></td><td className="so">{so(t.dtChuaThue)}</td><td className="so">{so(t.thueRa)}</td></tr>
          <tr><td>d</td><td>Hàng hoá, dịch vụ bán ra không phải kê khai, tính nộp thuế GTGT <b>[32a]</b></td><td className="so">0</td><td></td></tr>
          <tr><td>3</td><td>Tổng doanh thu và thuế GTGT của HHDV bán ra <b>[34]</b>=[26]+[27]; <b>[35]</b>=[28]</td><td className="so">{so(t.dtChuaThue)}</td><td className="so">{so(t.thueRa)}</td></tr>
          <tr><td>III</td><td>Thuế GTGT phát sinh trong kỳ <b>[36]</b>=[35]−[25]</td><td></td><td className="so">{so(t.phaiNop)}</td></tr>
          <tr className="nhom"><td>IV</td><td colSpan={3}>Điều chỉnh tăng, giảm thuế GTGT còn được khấu trừ của các kỳ trước</td></tr>
          <tr><td>1</td><td>Điều chỉnh giảm <b>[37]</b></td><td></td><td className="so">0</td></tr>
          <tr><td>2</td><td>Điều chỉnh tăng <b>[38]</b></td><td></td><td className="so">0</td></tr>
          <tr><td>V</td><td>Thuế GTGT đã nộp ở địa phương khác của hoạt động kinh doanh xây dựng, lắp đặt, bán hàng, bất động sản ngoại tỉnh <b>[39a]</b></td><td></td><td className="so">0</td></tr>
          <tr className="nhom"><td>VI</td><td colSpan={3}>Xác định nghĩa vụ thuế GTGT phải nộp trong kỳ</td></tr>
          <tr><td>1</td><td>Thuế GTGT phải nộp của hoạt động sản xuất kinh doanh trong kỳ <b>[40a]</b>=([36]−[22]+[37]−[38]−[39a]) ≥ 0</td><td></td><td className="so">{so(Math.max(0, ketQua))}</td></tr>
          <tr><td>2</td><td>Thuế GTGT mua vào của dự án đầu tư được bù trừ <b>[40b]</b></td><td></td><td className="so">0</td></tr>
          <tr className="dam"><td>3</td><td>Thuế GTGT còn phải nộp trong kỳ <b>[40]</b>=[40a]−[40b]</td><td></td><td className="so">{so(Math.max(0, ketQua))}</td></tr>
          <tr><td>4</td><td>Thuế GTGT chưa khấu trừ hết kỳ này <b>[41]</b>=([36]−[22]+[37]−[38]−[39a]) &lt; 0</td><td></td><td className="so">{so(Math.max(0, -ketQua))}</td></tr>
          <tr><td>4.1</td><td>Thuế GTGT đề nghị hoàn <b>[42]</b></td><td></td><td className="so">0</td></tr>
          <tr className="dam"><td>4.2</td><td>Thuế GTGT còn được khấu trừ chuyển kỳ sau <b>[43]</b>=[41]−[42]</td><td></td><td className="so">{so(Math.max(0, -ketQua))}</td></tr>
        </tbody>
      </table>
      <GhiChu>
        Trong [23] [24] đã gồm {so(t.thueVaoNgoai)} đ thuế GTGT nộp thay nhà thầu nước ngoài (đã nộp Kho bạc — Nghị định
        181/2025/NĐ-CP). Khai thuế suất {(THUE_SUAT_KHAI * 100).toFixed(0)}% — dịch vụ đăng tin bất động sản không thuộc
        diện giảm thuế (Nghị định 174/2025/NĐ-CP loại trừ kinh doanh bất động sản, dịch vụ công nghệ thông tin).
        {t.chenhLechThue !== 0 ? ` Hóa đơn trong kỳ ghi thuế ${so(t.thueTrenHoaDon)} đ — lệch ${so(t.chenhLechThue)} đ so với số khai, phải lập hóa đơn điều chỉnh.` : ""}
      </GhiChu>
      <ChuKy />
    </Trang>
  );
}

function TamNopTndn({ kyThue, t }: { kyThue: string; t: T }) {
  return (
    <Trang>
      <TieuDe ten="BẢNG TÍNH THUẾ TNDN TẠM NỘP" phu="Tạm nộp theo quý KHÔNG phải nộp tờ khai — chỉ lập giấy nộp tiền trên cổng thuế, cùng hạn tờ khai GTGT quý" />
      <ThongTinNnt kyThue={kyThue} />
      <table className="bang">
        <tbody>
          <Dong ma="1" ten="Doanh thu chưa thuế GTGT trong kỳ" tien={t.dtChuaThue} />
          <Dong ma="2" ten="Chi phí có hóa đơn trong kỳ" tien={t.tongChiPhi} />
          <Dong ma="3" ten="Lợi nhuận trước thuế (1 − 2)" tien={t.loiNhuan} dam />
          <Dong ma="4" ten="Thuế suất" chu="15%" />
          <Dong ma="5" ten="SỐ THUẾ TNDN TẠM NỘP (3 × 15%, không âm)" tien={t.tamNopTndn} dam />
        </tbody>
      </table>
      <GhiChu>
        Thuế suất 15% cho doanh nghiệp có tổng doanh thu năm không quá 3 tỷ đồng (Luật Thuế TNDN 67/2025/QH15). Tổng
        tạm nộp 4 quý phải đạt ít nhất 80% số thuế quyết toán năm, thiếu thì tính tiền chậm nộp phần thiếu.
      </GhiChu>
    </Trang>
  );
}

function ToKhai05({ kyThue, th, mau }: { kyThue: string; th: ReturnType<typeof tongHop05>; mau: "05/KK-TNCN" | "05/QTT-TNCN" }) {
  const quyetToan = mau === "05/QTT-TNCN";
  return (
    <Trang>
      <TieuDe
        ten={quyetToan ? "TỜ KHAI QUYẾT TOÁN THUẾ THU NHẬP CÁ NHÂN" : "TỜ KHAI KHẤU TRỪ THUẾ THU NHẬP CÁ NHÂN"}
        phu={`(Dành cho tổ chức, cá nhân trả thu nhập chịu thuế từ tiền lương, tiền công) — Mẫu số ${mau}`}
      />
      <ThongTinNnt kyThue={kyThue} />
      {th.c21 === 0 && (
        <p className="mb-2 text-sm">
          <b>Kỳ này không trả thu nhập cho cá nhân nào.</b>{" "}
          {quyetToan ? "Năm không trả thu nhập thì không phải quyết toán." : "Không phải nộp tờ khai quý này."}
        </p>
      )}
      {th.c21 > 0 && th.c34 === 0 && !quyetToan && (
        <p className="mb-2 text-sm"><b>Quý có trả thu nhập nhưng không khấu trừ đồng thuế nào → không phải nộp tờ khai 05/KK quý này.</b></p>
      )}
      <table className="bang">
        <thead>
          <tr>
            <th>STT</th>
            <th>Chỉ tiêu</th>
            <th>Mã chỉ tiêu</th>
            <th>Đơn vị tính</th>
            <th>Số người / Số tiền</th>
          </tr>
        </thead>
        <tbody>
          <Dong05 stt="1" ten="Tổng số người lao động" ma="21" dv="Người" gt={th.c21} />
          <Dong05 stt="" ten="Trong đó: Cá nhân cư trú có hợp đồng lao động" ma="22" dv="Người" gt={th.c22} />
          <Dong05 stt="2" ten="Tổng số cá nhân đã khấu trừ thuế [23]=[24]+[25]" ma="23" dv="Người" gt={th.c23} />
          <Dong05 stt="2.1" ten="Cá nhân cư trú" ma="24" dv="Người" gt={th.c24} />
          <Dong05 stt="2.2" ten="Cá nhân không cư trú" ma="25" dv="Người" gt={th.c25} />
          <Dong05 stt="3" ten="Tổng thu nhập chịu thuế (TNCT) trả cho cá nhân [26]=[27]+[28]+[29]" ma="26" dv="VNĐ" gt={th.c26} tien />
          <Dong05 stt="3.1" ten="Cá nhân cư trú có hợp đồng lao động" ma="27" dv="VNĐ" gt={th.c27} tien />
          <Dong05 stt="3.2" ten="Cá nhân cư trú không có hợp đồng lao động" ma="28" dv="VNĐ" gt={th.c28} tien />
          <Dong05 stt="3.3" ten="Cá nhân không cư trú" ma="29" dv="VNĐ" gt={th.c29} tien />
          <Dong05 stt="4" ten="Tổng TNCT trả cho cá nhân thuộc diện phải khấu trừ thuế [30]=[31]+[32]+[33]" ma="30" dv="VNĐ" gt={th.c30} tien />
          <Dong05 stt="4.1" ten="Cá nhân cư trú có hợp đồng lao động" ma="31" dv="VNĐ" gt={th.c31} tien />
          <Dong05 stt="4.2" ten="Cá nhân cư trú không có hợp đồng lao động" ma="32" dv="VNĐ" gt={th.c32} tien />
          <Dong05 stt="4.3" ten="Cá nhân không cư trú" ma="33" dv="VNĐ" gt={th.c33} tien />
          <Dong05 stt="5" ten="Tổng số thuế thu nhập cá nhân (TNCN) đã khấu trừ [34]=[35]+[36]+[37]" ma="34" dv="VNĐ" gt={th.c34} tien dam />
          <Dong05 stt="5.1" ten="Cá nhân cư trú có hợp đồng lao động" ma="35" dv="VNĐ" gt={th.c35} tien />
          <Dong05 stt="5.2" ten="Cá nhân cư trú không có hợp đồng lao động" ma="36" dv="VNĐ" gt={th.c36} tien />
          <Dong05 stt="5.3" ten="Cá nhân không cư trú" ma="37" dv="VNĐ" gt={th.c37} tien />
        </tbody>
      </table>
      <GhiChu>
        Mã chỉ tiêu theo mẫu {mau} (Thông tư 80/2021/TT-BTC). Từ 01/7/2026 mẫu có thể được cập nhật theo Thông tư
        89/2026/TT-BTC — khi khai trên cổng, đối chiếu tên chỉ tiêu chứ không chỉ mã số.
        {quyetToan ? " Quyết toán nộp kèm bảng kê 05-1 và 05-2 ở các trang sau." : ""}
      </GhiChu>
      <ChuKy />
    </Trang>
  );
}

function BangKeRaVao({ kyThue, ky }: { kyThue: string; ky: Ky | null }) {
  const ra = ky?.ra ?? [];
  const vao = ky?.vao ?? [];
  const ngoai = (ky?.ngoai ?? []).filter((d) => d.nhom === "phai_khai_thay" && d.da_nop);
  return (
    <Trang>
      <TieuDe ten="BẢNG KÊ HÓA ĐƠN BÁN RA VÀ MUA VÀO" phu="Lưu hồ sơ kèm tờ khai — không bắt buộc nộp lên cơ quan thuế" />
      <ThongTinNnt kyThue={kyThue} />
      <p className="muc">1. Hàng hóa, dịch vụ bán ra ({ra.length} giao dịch)</p>
      <table className="bang nho">
        <thead>
          <tr><th>STT</th><th>Ngày</th><th>Số hóa đơn</th><th>Người mua</th><th>MST</th><th>Nội dung</th><th>Tiền hàng</th><th>Thuế ghi trên hóa đơn</th></tr>
        </thead>
        <tbody>
          {ra.map((d, i) => (
            <tr key={d.id}>
              <td>{i + 1}</td>
              <td>{ngay(d.ngay_ghi_nhan)}</td>
              <td>{d.hoa_don_so ?? (d.hoa_don_loai === "tong" ? "HĐ tổng" : "Chưa xuất")}</td>
              <td>{d.mst_nguoi_mua ? d.ten_nguoi_mua : "Khách lẻ"}</td>
              <td>{d.mst_nguoi_mua ?? ""}</td>
              <td>{d.mo_ta}</td>
              <td className="so">{so(d.tien_hang)}</td>
              <td className="so">{so(d.tien_thue)}</td>
            </tr>
          ))}
          <tr className="dam">
            <td colSpan={6}>Tổng</td>
            <td className="so">{so(ra.reduce((s, d) => s + Number(d.tien_hang || 0), 0))}</td>
            <td className="so">{so(ra.reduce((s, d) => s + Number(d.tien_thue || 0), 0))}</td>
          </tr>
        </tbody>
      </table>

      <p className="muc">2. Hàng hóa, dịch vụ mua vào ({vao.length + ngoai.length} chứng từ)</p>
      <table className="bang nho">
        <thead>
          <tr><th>STT</th><th>Ngày</th><th>Số hóa đơn</th><th>Người bán</th><th>MST</th><th>Diễn giải</th><th>Tiền hàng</th><th>Thuế GTGT</th><th>Khấu trừ</th></tr>
        </thead>
        <tbody>
          {vao.map((d, i) => (
            <tr key={d.id}>
              <td>{i + 1}</td>
              <td>{ngay(d.ngay_hoa_don)}</td>
              <td>{d.so_hoa_don ?? ""}</td>
              <td>{d.nha_cung_cap}</td>
              <td>{d.mst ?? ""}</td>
              <td>{d.dien_giai ?? ""}</td>
              <td className="so">{so(d.tien_hang)}</td>
              <td className="so">{so(d.tien_thue)}</td>
              <td className="giua">{d.duoc_khau_tru ? "Có" : "Không"}</td>
            </tr>
          ))}
          {ngoai.map((d, i) => (
            <tr key={d.id}>
              <td>{vao.length + i + 1}</td>
              <td>{ngay(d.ngay_nop ?? d.ngay_hoa_don)}</td>
              <td>{d.chung_tu_nop ?? ""}</td>
              <td>{d.nha_cung_cap} (thuế nộp thay)</td>
              <td></td>
              <td>{d.dien_giai ?? ""}</td>
              <td className="so">{so(d.dt_gtgt)}</td>
              <td className="so">{so(d.thue_gtgt)}</td>
              <td className="giua">Có</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Trang>
  );
}

// ── Khung chung ─────────────────────────────────────────────────────────────

function Trang({ children }: { children: React.ReactNode }) {
  return <section className="trang">{children}</section>;
}

function TieuDe({ ten, phu }: { ten: string; phu: string }) {
  return (
    <div className="tieu-de">
      <p className="quoc-hieu">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p className="tieu-ngu">Độc lập - Tự do - Hạnh phúc</p>
      <h1>{ten}</h1>
      <p className="phu">{phu}</p>
    </div>
  );
}

function ThongTinNnt({ kyThue }: { kyThue: string }) {
  return (
    <div className="nnt">
      <p><b>[01]</b> Kỳ tính thuế: <b>{kyThue}</b></p>
      <p><b>[02]</b> Lần đầu: [X] &nbsp;&nbsp; <b>[03]</b> Bổ sung lần thứ: [&nbsp;&nbsp;]</p>
      <p><b>[04]</b> Tên người nộp thuế: <b>{NGUOI_NOP_THUE.ten}</b></p>
      <p><b>[05]</b> Mã số thuế: <b>{NGUOI_NOP_THUE.mst}</b> &nbsp;·&nbsp; Cơ quan thuế quản lý: {NGUOI_NOP_THUE.coQuanThue}</p>
      <p className="dv">Đơn vị tiền: đồng Việt Nam</p>
    </div>
  );
}

function ChuKy() {
  return (
    <div className="chu-ky">
      <p>Tôi cam đoan số liệu khai trên là đúng và chịu trách nhiệm trước pháp luật về những số liệu đã khai.</p>
      <div className="ky">
        <p>Đà Nẵng, ngày ...... tháng ...... năm ......</p>
        <p><b>NGƯỜI NỘP THUẾ hoặc</b></p>
        <p><b>ĐẠI DIỆN HỢP PHÁP CỦA NGƯỜI NỘP THUẾ</b></p>
        <p className="nghieng">(Chữ ký, ghi rõ họ tên; chức vụ và đóng dấu (nếu có) / Ký điện tử)</p>
      </div>
    </div>
  );
}

function GhiChu({ children }: { children: React.ReactNode }) {
  return <p className="ghi-chu">Ghi chú: {children}</p>;
}

function Dong({ ma, ten, tien, chu, dam }: { ma: string; ten: string; tien?: number; chu?: string; dam?: boolean }) {
  return (
    <tr className={dam ? "dam" : ""}>
      <td style={{ width: "2.5rem" }}>{ma}</td>
      <td>{ten}</td>
      <td className="so" style={{ width: "11rem" }}>{chu ?? so(tien ?? 0)}</td>
    </tr>
  );
}

function Dong05({ stt, ten, ma, dv, gt, tien, dam }: { stt: string; ten: string; ma: string; dv: string; gt: number; tien?: boolean; dam?: boolean }) {
  return (
    <tr className={dam ? "dam" : ""}>
      <td>{stt}</td>
      <td>{ten}</td>
      <td className="giua">[{ma}]</td>
      <td className="giua">{dv}</td>
      <td className="so">{tien ? so(gt) : gt}</td>
    </tr>
  );
}

function so(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString("vi-VN");
}
function ngay(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

// Mẫu in: nền trắng chữ đen bất kể giao diện, khổ A4, mỗi mẫu một trang mới.
// Khi in, ẩn MỌI THỨ ngoài vùng tờ khai (thanh điều hướng admin, nút bấm).
const IN_CSS = `
.vung-in { color: #000; }
.trang { background: #fff; color: #000; padding: 12mm 14mm; margin: 0 auto 24px; max-width: 210mm;
  box-shadow: 0 1px 4px rgba(0,0,0,.15); font-family: "Times New Roman", Times, serif; font-size: 12px; line-height: 1.35; }
.tieu-de { text-align: center; margin-bottom: 10px; }
.quoc-hieu { font-weight: 700; }
.tieu-ngu { font-weight: 700; text-decoration: underline; margin-bottom: 10px; }
.tieu-de h1 { font-size: 15px; font-weight: 700; margin: 6px 0 2px; }
.tieu-de .phu { font-style: italic; font-size: 11.5px; }
.nnt { margin: 10px 0; }
.nnt .dv { text-align: right; font-style: italic; }
.muc { font-weight: 700; margin: 12px 0 4px; }
.bang { width: 100%; border-collapse: collapse; }
.bang th, .bang td { border: 1px solid #000; padding: 2px 5px; vertical-align: top; }
.bang th { font-weight: 700; text-align: center; }
.bang.nho { font-size: 10.5px; }
.bang .so { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.bang .giua { text-align: center; }
.bang tr.dam td { font-weight: 700; }
.bang tr.nhom td { font-weight: 700; }
.ghi-chu { margin-top: 8px; font-size: 11px; font-style: italic; }
.chu-ky { margin-top: 14px; }
.chu-ky .ky { margin-left: auto; width: 60%; text-align: center; margin-top: 6px; min-height: 80px; }
.chu-ky .nghieng { font-style: italic; font-size: 11px; }
@media print {
  @page { size: A4; margin: 0; }
  body * { visibility: hidden !important; }
  .vung-in, .vung-in * { visibility: visible !important; }
  .vung-in { position: absolute; left: 0; top: 0; width: 100%; }
  .trang { box-shadow: none; margin: 0; max-width: none; page-break-after: always; break-after: page; }
  .khong-in { display: none !important; }
  html, body { background: #fff !important; }
}
`;
