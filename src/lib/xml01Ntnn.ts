// ════════════════════════════════════════════════════════════════════════════
// XUẤT TỆP XML TỜ KHAI 01/NTNN, NCCNN (Thông tư 89/2026/TT-BTC) — khai thay thuế nhà
// thầu / nhà cung cấp nước ngoài, MỖI KỲ MỘT THÁNG (dichvucong.gdt.gov.vn → Nộp XML → Ký → Nộp).
//
// Cấu trúc chép theo lược đồ chuẩn của ngành thuế, đối chiếu 20/10/2026 với bộ HTKK 5.8.1:
//   InterfaceTemplates/TKhaiThue_DBHC.xsd (phần chung — địa chỉ có mã xã, không có huyện)
//   + Validate/01_NTNN_NCCNN_TT89_309.xsd (chỉ tiêu)
//   Project/Menu.xml: MaToKhai 2012 · VersionXML 3.0.9 · áp dụng từ kỳ 01/10/2026
//   (kỳ trước đó dùng 01/NTNN TT80 — mã 838, không phải tệp này).
//   Map.xml Y8: tờ khai tháng → kieuKy "M", kyKKhai "MM/YYYY".
//   Ngành nghề cột (1b): DM_NNKD_NTNN.xml — lấy từ TY_LE[loai].nganh (thueNhaThau.ts).
// Hình thức (không id trên HSoKhaiThue, <CKyDTu/>, ngày lập dd/mm/yyyy, NNT theo tài khoản
// thuế, CQT 50115) theo bài học tờ 01/GTGT quý 3 nộp thành công 20/10/2026.
// TTinDVu ghi đúng phần mềm lập tệp là CRM của công ty — không mạo danh HTKK.
//
// ⚠️ Phần I hay Phần II, tỷ lệ %, cách quy đổi ngược: CHƯA CHỐT (chờ Thuế cơ sở 4).
//    Hàm này không tự chọn — người lập chọn Phần ở trang in, số lấy nguyên từ dòng đã lưu.
// ════════════════════════════════════════════════════════════════════════════

import { NGUOI_NOP_THUE, type DongNgoai } from "@/lib/soLieuThue";
import { TY_LE } from "@/lib/thueNhaThau";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const n = (v: number | string | null | undefined) => String(Math.round(Number(v || 0)));
const pt = (x: number) => String(Math.round(x * 10000) / 100);
const dd = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const NIL = ' xsi:nil="true"/>';

/** Mẫu TT89 áp dụng từ kỳ tháng 10/2026 (Menu.xml HTKK: StartDate 01/10/2026). */
export function laKyNtnnTt89(nam: number, thang: number): boolean {
  return nam * 12 + thang >= 2026 * 12 + 10;
}

/** Một dòng bảng kê (ThueNTNN / ThueNCCNN). `the` = tên thẻ dòng, `stt` từ 1.
 *  Lược đồ: ThueNCCNN bắt buộc thuộc tính `id`, ThueNTNN có `ID` (không bắt buộc). */
function dong(the: string, d: DongNgoai | null, thut: string, stt = 1): string {
  const mo = `${thut}<${the} ${the === "ThueNTNN" ? "ID" : "id"}="ID_${stt}">`;
  if (!d) {
    // Phần không khai: một dòng trống toàn nil — lược đồ bắt buộc có ít nhất một dòng.
    const c = (t: string) => `${thut}  <${t}${NIL}`;
    return [
      mo,
      ...["ct1a", "ct1b_ma", "ct1b", "ct2", "ct3", "ct4", "ct5", "ct6"].map(c),
      `${thut}  <ThueGTGT>`,
      ...["ct7", "ct8", "ct9"].map((t) => `  ${c(t)}`),
      `${thut}  </ThueGTGT>`,
      `${thut}  <ThueTNDN>`,
      ...["ct10", "ct11", "ct12", "ct13"].map((t) => `  ${c(t)}`),
      `${thut}  </ThueTNDN>`,
      c("ct14"),
      `${thut}</${the}>`,
    ].join("\n");
  }
  const ty = TY_LE[d.loai];
  const ngay = d.ngay_hoa_don.slice(0, 10);
  const noiDung = `${d.nha_cung_cap}${d.dien_giai ? ` - ${d.dien_giai}` : ""}`;
  return `${mo}
${thut}  <ct1a>${esc(noiDung)}</ct1a>
${thut}  <ct1b_ma>${ty.nganh.ma}</ct1b_ma>
${thut}  <ct1b>${esc(ty.nganh.ten)}</ct1b>
${thut}  <ct2${NIL}
${thut}  <ct3>${esc(d.so_hoa_don ?? "")}</ct3>
${thut}  <ct4>${ngay}</ct4>
${thut}  <ct5>${n(d.tien_vnd)}</ct5>
${thut}  <ct6>${ngay}</ct6>
${thut}  <ThueGTGT>
${thut}    <ct7>${n(d.dt_gtgt)}</ct7>
${thut}    <ct8>${pt(ty.gtgt)}</ct8>
${thut}    <ct9>${n(d.thue_gtgt)}</ct9>
${thut}  </ThueGTGT>
${thut}  <ThueTNDN>
${thut}    <ct10>${n(d.dt_tndn)}</ct10>
${thut}    <ct11>${pt(ty.tndn)}</ct11>
${thut}    <ct12>0</ct12>
${thut}    <ct13>${n(d.thue_tndn)}</ct13>
${thut}  </ThueTNDN>
${thut}  <ct14>${n(Number(d.thue_gtgt || 0) + Number(d.thue_tndn || 0))}</ct14>
${thut}</${the}>`;
}

/** Bảng kê + 7 ô tổng (tiền tố `muc` = "mucI" hoặc "mucII"). */
function bangKe(the: string, rows: DongNgoai[], muc: string, thut: string): string {
  const tong = (k: "tien_vnd" | "dt_gtgt" | "thue_gtgt" | "dt_tndn" | "thue_tndn") =>
    rows.reduce((s, d) => s + Number(d[k] || 0), 0);
  const ds = rows.length ? rows.map((d, i) => dong(the, d, thut + "  ", i + 1)).join("\n") : dong(the, null, thut + "  ");
  const o = (k: string, v: number) =>
    rows.length ? `${thut}<${muc}_tong_${k}>${n(v)}</${muc}_tong_${k}>` : `${thut}<${muc}_tong_${k}${NIL}`;
  return `${thut}<BK${the}>
${ds}
${thut}</BK${the}>
${o("ct5", tong("tien_vnd"))}
${o("ct7", tong("dt_gtgt"))}
${o("ct9", tong("thue_gtgt"))}
${o("ct10", tong("dt_tndn"))}
${o("ct12", 0)}
${o("ct13", tong("thue_tndn"))}
${o("ct14", tong("thue_gtgt") + tong("thue_tndn"))}`;
}

/**
 * @param rows  Các dòng `hoa_don_ngoai` nhóm 'phai_khai_thay' của tháng.
 * @param phan  1 = Phần I (nhà thầu nước ngoài) · 2 = Phần II (nhà cung cấp nước ngoài).
 */
export function xml01Ntnn(nam: number, thang: number, rows: DongNgoai[], phan: 1 | 2, homNay: Date = new Date()): string {
  const tu = new Date(nam, thang - 1, 1);
  const den = new Date(nam, thang, 0);
  const ky = `${String(thang).padStart(2, "0")}/${nam}`;
  const phanII =
    phan === 2
      ? `      <ThueNCCNN_CNKCT>
${bangKe("ThueNCCNN", rows, "mucI", "        ")}
        <BKThueCNKCT${NIL}
        <mucII_tong_ct5${NIL}
        <mucII_tong_ct7${NIL}
        <mucII_tong_ct9${NIL}
        <mucII_tong_ct10${NIL}
        <mucII_tong_ct12${NIL}
        <mucII_tong_ct13${NIL}
        <mucII_tong_ct14${NIL}
      </ThueNCCNN_CNKCT>`
      : `      <ThueNCCNN_CNKCT${NIL}`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<HSoThueDTu xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <HSoKhaiThue>
    <TTinChung>
      <TTinDVu>
        <maDVu>CRM_COASTALLAND</maDVu>
        <tenDVu>CRM bao cao thue Coastal Land</tenDVu>
        <pbanDVu>1.0.0</pbanDVu>
        <ttinNhaCCapDVu>${esc(NGUOI_NOP_THUE.ten)} - ${NGUOI_NOP_THUE.mst}</ttinNhaCCapDVu>
      </TTinDVu>
      <TTinTKhaiThue>
        <TKhaiThue>
          <maTKhai>2012</maTKhai>
          <tenTKhai>TỜ KHAI THUẾ NHÀ THẦU NƯỚC NGOÀI; NHÀ CUNG CẤP NƯỚC NGOÀI, CÁ NHÂN KHÔNG CƯ TRÚ CÓ HOẠT ĐỘNG KINH DOANH TRỂN NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ, NỀN TẢNG SỐ KHÁC - MẪU SỐ 01/NTNN, NCCNN</tenTKhai>
          <moTaBMau>(Kèm theo Thông tư số 89/2026/TT-BTC ngày 30 tháng 6 năm 2026 của Bộ trưởng Bộ Tài chính)</moTaBMau>
          <pbanTKhaiXML>3.0.9</pbanTKhaiXML>
          <loaiTKhai>C</loaiTKhai>
          <soLan>0</soLan>
          <KyKKhaiThue>
            <kieuKy>M</kieuKy>
            <kyKKhai>${ky}</kyKKhai>
            <kyKKhaiTuNgay>${dd(tu)}</kyKKhaiTuNgay>
            <kyKKhaiDenNgay>${dd(den)}</kyKKhaiDenNgay>
            <kyKKhaiTuThang>${ky}</kyKKhaiTuThang>
            <kyKKhaiDenThang>${ky}</kyKKhaiDenThang>
          </KyKKhaiThue>
          <maCQTNoiNop>50115</maCQTNoiNop>
          <tenCQTNoiNop>${esc(NGUOI_NOP_THUE.coQuanThue)}</tenCQTNoiNop>
          <ngayLapTKhai>${dd(homNay)}</ngayLapTKhai>
          <nguoiKy></nguoiKy>
          <ngayKy>${iso(homNay)}</ngayKy>
          <nganhNgheKD></nganhNgheKD>
        </TKhaiThue>
        <NNT>
          <mst>${NGUOI_NOP_THUE.mst}</mst>
          <tenNNT>${esc(NGUOI_NOP_THUE.ten)}</tenNNT>
          <dchiNNT>220 Nguyễn Mậu Tài</dchiNNT>
          <tenXaNNT>Phường Hòa Xuân</tenXaNNT>
          <maXaNNT>50115012</maXaNNT>
          <maHuyenNNT></maHuyenNNT>
          <tenHuyenNNT></tenHuyenNNT>
          <maTinhNNT>501</maTinhNNT>
          <tenTinhNNT>TP Đà Nẵng</tenTinhNNT>
          <dthoaiNNT>0905374123</dthoaiNNT>
          <faxNNT></faxNNT>
          <emailNNT>truongthanhtung08@gmail.com</emailNNT>
        </NNT>
      </TTinTKhaiThue>
    </TTinChung>
    <CTieuTKhaiChinh>
      <nopThayNTNN>${phan === 1}</nopThayNTNN>
      <nopThayNCCNN>${phan === 2}</nopThayNCCNN>
${bangKe("ThueNTNN", phan === 1 ? rows : [], "mucI", "      ")}
${phanII}
    </CTieuTKhaiChinh>
  </HSoKhaiThue>
  <CKyDTu/>
</HSoThueDTu>
`;
}

/** Tải tệp XML về máy (tên tệp theo kiểu HTKK: MST-01_NTNN_NCCNN-T09-2026.xml). */
export function taiXml01Ntnn(nam: number, thang: number, rows: DongNgoai[], phan: 1 | 2) {
  const blob = new Blob([xml01Ntnn(nam, thang, rows, phan)], { type: "application/xml;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${NGUOI_NOP_THUE.mst}-01_NTNN_NCCNN-T${String(thang).padStart(2, "0")}-${nam}.xml`;
  a.click();
  URL.revokeObjectURL(a.href);
}
