// ════════════════════════════════════════════════════════════════════════════
// SỐ LIỆU THUẾ THEO KỲ — MỘT CHỖ CỘNG SỔ DUY NHẤT
//
// Trang nhập liệu (/admin/hoa-don-thue) và trang in báo cáo (/admin/hoa-don-thue/in)
// cùng gọi hàm ở đây, để số trên màn hình và số trên giấy KHÔNG BAO GIỜ lệch nhau.
// ════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoaiDichVu, NhomNcc } from "@/lib/thueNhaThau";

export type DongDoanhThu = {
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

export type DongVao = {
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

export type DongNgoai = {
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

export const COT_DOANH_THU =
  "id,ngay_ghi_nhan,mo_ta,tien_hang,tien_thue,tong_tra,hoa_don_loai,hoa_don_so,hoa_don_trang_thai,ten_nguoi_mua,mst_nguoi_mua,nguon";
export const COT_VAO = "id,ngay_hoa_don,so_hoa_don,nha_cung_cap,mst,dien_giai,tien_hang,tien_thue,duoc_khau_tru";
export const COT_NGOAI =
  "id,ky_thang,ngay_hoa_don,nha_cung_cap,so_hoa_don,dien_giai,nhom,loai,hop_dong_net," +
  "tien_usd,ty_gia,tien_vnd,dt_gtgt,thue_gtgt,dt_tndn,thue_tndn,da_nop,ngay_nop,chung_tu_nop";

export function ngayISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Đọc ba nguồn số liệu của một khoảng thời gian (quý hoặc cả năm). */
export async function napSoLieu(supabase: SupabaseClient, tu: Date, den: Date) {
  const [r1, r2, r3] = await Promise.all([
    supabase
      .from("doanh_thu")
      .select(COT_DOANH_THU)
      .gte("ngay_ghi_nhan", tu.toISOString())
      .lte("ngay_ghi_nhan", den.toISOString())
      .order("ngay_ghi_nhan", { ascending: true }),
    supabase
      .from("hoa_don_vao")
      .select(COT_VAO)
      .gte("ngay_hoa_don", ngayISO(tu))
      .lte("ngay_hoa_don", ngayISO(den))
      .order("ngay_hoa_don", { ascending: true }),
    supabase
      .from("hoa_don_ngoai")
      .select(COT_NGOAI)
      .gte("ky_thang", ngayISO(tu))
      .lte("ky_thang", ngayISO(den))
      .order("ngay_hoa_don", { ascending: true }),
  ]);
  return { r1, r2, r3 };
}

export type SoLieuKy = ReturnType<typeof congSo>;

/** Cộng sổ một kỳ: ra chỉ tiêu tờ khai 01/GTGT và số tạm nộp TNDN. */
export function congSo(dsRa: DongDoanhThu[], dsVao: DongVao[], dsNgoai: DongNgoai[]) {
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
}

/** Khóa nhớ chỉ tiêu [22] của từng quý (trên máy đang dùng). */
export function khoaCt22(nam: number, quy: number): string {
  return `thue-ct22-${nam}-Q${quy}`;
}

/** Người nộp thuế — in lên đầu mọi tờ khai. Theo Thông báo của Phòng ĐKKD TP Đà Nẵng. */
export const NGUOI_NOP_THUE = {
  ten: "CÔNG TY TNHH BẤT ĐỘNG SẢN COASTAL LAND",
  mst: "0402353502",
  coQuanThue: "Thuế cơ sở 4 thành phố Đà Nẵng",
};
