// ════════════════════════════════════════════════════════════════════════════
// XUẤT TỆP XML TỜ KHAI 01/GTGT (Thông tư 80/2021/TT-BTC) — để nộp ở cổng thuế
// (dichvucong.gdt.gov.vn → Khai thuế GTGT phương pháp khấu trừ → Nộp XML → Ký → Nộp).
//
// Cấu trúc chép theo lược đồ chuẩn của ngành thuế, đối chiếu 20/10/2026 với bộ HTKK 5.8.1:
//   InterfaceTemplates/TKhaiThue.xsd (phần chung) + Validate/01_GTGT_TT80_283.xsd (chỉ tiêu)
//   Menu.xml: MaToKhai 842 · VersionXML 2.8.3 · TenToKhai / MoTaBieuMau như dưới.
//   ma_NganhNghe "00" = Hoạt động sản xuất kinh doanh thông thường — mã cổng thuế dùng
//   (đọc từ ô chọn ngành nghề trên dichvucong.gdt.gov.vn 20/10/2026); tieuMucHachToan 1701.
//   Catalogue_CQT_Dia_Ban.xml: 50115 = Thuế cơ sở 4 thành phố Đà Nẵng.
//   Catalogue_Dia_Ban_Xa_Moi.xml: 50115012 = Phường Hòa Xuân · Catalogue_Dia_Ban_Tinh_Moi: 501.
// TTinDVu ghi đúng phần mềm lập tệp là CRM của công ty — không mạo danh HTKK.
// ════════════════════════════════════════════════════════════════════════════

import { NGUOI_NOP_THUE } from "@/lib/soLieuThue";

export type So01Gtgt = {
  ct22: number;
  hangVao: number;
  thueVao: number;
  dtChuaThue: number;
  thueRa: number;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const n = (v: number) => String(Math.round(v));
const dd = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const mm = (d: Date) => `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function xml01Gtgt(nam: number, quy: number, s: So01Gtgt, homNay: Date = new Date()): string {
  const tu = new Date(nam, (quy - 1) * 3, 1);
  const den = new Date(nam, quy * 3, 0);
  const ct36 = s.thueRa - s.thueVao;
  const ketQua = ct36 - s.ct22; // [36] − [22] + [37] − [38] − [39a], ba ô sau bằng 0
  const ct40a = Math.max(0, ketQua);
  const ct41 = Math.max(0, -ketQua);
  const khongPhatSinh = s.dtChuaThue === 0 && s.hangVao === 0;

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
          <maTKhai>842</maTKhai>
          <tenTKhai>TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG Mẫu số 01/GTGT (TT80/2021)</tenTKhai>
          <moTaBMau>TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (Mẫu số 01/GTGT)</moTaBMau>
          <pbanTKhaiXML>2.8.3</pbanTKhaiXML>
          <loaiTKhai>C</loaiTKhai>
          <soLan>0</soLan>
          <KyKKhaiThue>
            <kieuKy>Q</kieuKy>
            <kyKKhai>${quy}/${nam}</kyKKhai>
            <kyKKhaiTuNgay>${dd(tu)}</kyKKhaiTuNgay>
            <kyKKhaiDenNgay>${dd(den)}</kyKKhaiDenNgay>
            <kyKKhaiTuThang>${mm(tu)}</kyKKhaiTuThang>
            <kyKKhaiDenThang>${mm(den)}</kyKKhaiDenThang>
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
          <phuongXa>Phường Hòa Xuân</phuongXa>
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
      <ma_NganhNghe>00</ma_NganhNghe>
      <ten_NganhNghe>Hoạt động sản xuất kinh doanh thông thường</ten_NganhNghe>
      <tieuMucHachToan>1701</tieuMucHachToan>
      <Header>
        <ct09></ct09>
        <ct10></ct10>
        <DiaChiHDSXKDKhacTinhNDTSC>
          <ct11a_phuongXa_ma></ct11a_phuongXa_ma>
          <ct11a_phuongXa_ten></ct11a_phuongXa_ten>
          <ct11b_quanHuyen_ma xsi:nil="true"/>
          <ct11b_quanHuyen_ten xsi:nil="true"/>
          <ct11c_tinhTP_ma></ct11c_tinhTP_ma>
          <ct11c_tinhTP_ten></ct11c_tinhTP_ten>
        </DiaChiHDSXKDKhacTinhNDTSC>
      </Header>
      <ct21>${khongPhatSinh ? "true" : "false"}</ct21>
      <ct22>${n(s.ct22)}</ct22>
      <GiaTriVaThueGTGTHHDVMuaVao>
        <ct23>${n(s.hangVao)}</ct23>
        <ct24>${n(s.thueVao)}</ct24>
      </GiaTriVaThueGTGTHHDVMuaVao>
      <HangHoaDichVuNhapKhau>
        <ct23a>0</ct23a>
        <ct24a>0</ct24a>
      </HangHoaDichVuNhapKhau>
      <ct25>${n(s.thueVao)}</ct25>
      <ct26>0</ct26>
      <HHDVBRaChiuThueGTGT>
        <ct27>${n(s.dtChuaThue)}</ct27>
        <ct28>${n(s.thueRa)}</ct28>
      </HHDVBRaChiuThueGTGT>
      <ct29>0</ct29>
      <HHDVBRaChiuTSuat5>
        <ct30>0</ct30>
        <ct31>0</ct31>
      </HHDVBRaChiuTSuat5>
      <HHDVBRaChiuTSuat10>
        <ct32>${n(s.dtChuaThue)}</ct32>
        <ct33>${n(s.thueRa)}</ct33>
      </HHDVBRaChiuTSuat10>
      <ct32a>0</ct32a>
      <TongDThuVaThueGTGTHHDVBRa>
        <ct34>${n(s.dtChuaThue)}</ct34>
        <ct35>${n(s.thueRa)}</ct35>
      </TongDThuVaThueGTGTHHDVBRa>
      <ct36>${n(ct36)}</ct36>
      <ct37>0</ct37>
      <ct38>0</ct38>
      <ct39a>0</ct39a>
      <ct40a>${n(ct40a)}</ct40a>
      <ct40b>0</ct40b>
      <ct40>${n(ct40a)}</ct40>
      <ct41>${n(ct41)}</ct41>
      <ct42>0</ct42>
      <ct43>${n(ct41)}</ct43>
    </CTieuTKhaiChinh>
  </HSoKhaiThue>
  <CKyDTu/>
</HSoThueDTu>
`;
}

/** Tải tệp XML về máy (tên tệp theo kiểu HTKK: MST-01_GTGT-Q3-2026.xml). */
export function taiXml01Gtgt(nam: number, quy: number, s: So01Gtgt) {
  const blob = new Blob([xml01Gtgt(nam, quy, s)], { type: "application/xml;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${NGUOI_NOP_THUE.mst}-01_GTGT-Q${quy}-${nam}.xml`;
  a.click();
  URL.revokeObjectURL(a.href);
}
