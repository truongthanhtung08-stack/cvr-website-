// ============================================================================
// BẢNG THÔNG SỐ DỰ ÁN — MỘT CẤU TRÚC cho Admin, tệp nạp CSV/Excel và trang dự án (chủ dự án 31/10/2026:
// "admin ghi vào thì hiển thị cho đúng như vậy"). Thứ tự chốt trên trang: Chủ đầu tư → Loại hình (hai ô cố định
// ở phần Thông tin dự án) → 4 dòng chuẩn dưới đây → các dòng khác giữ đúng thứ tự Admin nhập.
// ============================================================================

import { normalizeVi } from "@/lib/filters";

export const THONG_SO_CHUAN = ["Diện tích dự án", "Quy mô", "Loại hình căn hộ", "Số lượng căn hộ"] as const;

// Nhãn hồ sơ cũ viết tự do (Tổng diện tích, Số căn, Sản phẩm…) vẫn nhận đúng dòng chuẩn
const KHOP = [/dien tich/, /^quy mo/, /loai hinh can|loai can|^san pham$/, /so luong|so can/];
const khoa = (nhan: string) => normalizeVi(nhan).replace(/đ/g, "d").trim();
export const viTriChuan = (nhan: string) => KHOP.findIndex((r) => r.test(khoa(nhan)));

// Tên CÙNG NGHĨA ở hồ sơ nạp hàng loạt (Cowork ghi tự do) → tên chuẩn. Chỉ đổi tên đúng nghĩa; nhãn mang thêm ý
// ("Số căn hộ khách sạn", "Số tòa") giữ nguyên chữ (31/10/2026)
const CUNG_NGHIA: Record<string, (typeof THONG_SO_CHUAN)[number]> = {
  "dien tich": "Diện tích dự án", "tong dien tich": "Diện tích dự án", "dien tich du an": "Diện tích dự án", "dien tich dat": "Diện tích dự án",
  "quy mo": "Quy mô", "quy mo du an": "Quy mô",
  "san pham": "Loại hình căn hộ", "loai can": "Loại hình căn hộ", "loai can ho": "Loại hình căn hộ", "loai hinh can ho": "Loại hình căn hộ",
  "so can": "Số lượng căn hộ", "so can ho": "Số lượng căn hộ", "so luong can": "Số lượng căn hộ", "so luong can ho": "Số lượng căn hộ",
};
export const tenChuan = (nhan: string) => CUNG_NGHIA[khoa(nhan)] ?? nhan.trim();

/** 4 dòng chuẩn lên đầu theo thứ tự chốt, còn lại giữ nguyên thứ tự nhập. */
export function xepThongSo<T extends { label: string }>(ds: T[]): T[] {
  return ds.map((s, i) => ({ s, i, h: viTriChuan(s.label) }))
    .sort((a, b) => (a.h < 0 ? 99 : a.h) - (b.h < 0 ? 99 : b.h) || a.i - b.i)
    .map((x) => x.s);
}

/** Form Admin: luôn có đủ 4 dòng chuẩn (trống thì không hiện trên web), xếp đúng như trang dự án. */
export function thongSoChoForm<T extends { label: string; value: string }>(ds: T[]): T[] {
  const thieu = THONG_SO_CHUAN.filter((n, h) => !ds.some((s) => viTriChuan(s.label) === h)).map((label) => ({ label, value: "" }) as T);
  return xepThongSo([...ds, ...thieu]);
}
