// ============================================================================
// TRƯỜNG BẮT BUỘC CỦA DỰ ÁN — MỘT NGUỒN cho mọi thẻ dự án (trang chủ, /du-an, Xem thêm, Dự án tương tự) và trang chi tiết
// (chủ dự án 31/10/2026: "tên dự án, loại hình… các trường bắt buộc từ 1 nguồn").
// Trường bắt buộc: tên · địa chỉ · loại hình · tình trạng · chủ đầu tư. Hồ sơ chưa có → web ghi "<Trường> đang cập nhật".
// contentDb điền sẵn chữ thay thế khi cột trống ("Đang cập nhật", "Dự án bất động sản") — các chữ đó KHÔNG phải admin ghi.
// ============================================================================

const CHU_THAY_THE = new Set(["", "Đang cập nhật", "Dự án bất động sản"]);

/** Giá trị admin thật sự ghi; chữ thay thế → "" */
export const giaTriThat = (v?: string | null) => (v && !CHU_THAY_THE.has(v.trim()) ? v.trim() : "");

export type TruongBatBuoc = { ten: string; diaChi: string; loaiHinh: string; tinhTrang: string; chuDauTu: string };

export function truongBatBuoc(p: { name: string; location?: string; type?: string; status?: string; developer?: string }): TruongBatBuoc {
  return {
    ten: p.name,
    diaChi: giaTriThat(p.location),
    loaiHinh: giaTriThat(p.type),
    tinhTrang: giaTriThat(p.status),
    chuDauTu: giaTriThat(p.developer),
  };
}

/** Tên trường khi báo thiếu (màn nạp dự án hàng loạt chặn đúng các trường này — anh 31/10/2026, D42) */
export const TEN_TRUONG: Record<keyof TruongBatBuoc, string> = {
  ten: "tên dự án",
  diaChi: "địa chỉ (gồm vị trí / toạ độ)",
  loaiHinh: "loại hình",
  tinhTrang: "tình trạng",
  chuDauTu: "chủ đầu tư",
};

/** Chữ hiện khi trường trống — một cách ghi cho mọi nơi */
export const CHUA_CO: Record<keyof TruongBatBuoc, string> = {
  ten: "Tên dự án đang cập nhật",
  diaChi: "Địa chỉ đang cập nhật",
  loaiHinh: "Loại hình đang cập nhật",
  tinhTrang: "Tình trạng đang cập nhật",
  chuDauTu: "Chủ đầu tư đang cập nhật",
};

/** Loại hình trên THẺ: gom về MỘT dòng (chủ dự án 31/10/2026) — ngắn thì giữ nguyên; dài (> 30 ký tự, quá một dòng thẻ) thì lấy
 *  LOẠI HÌNH CHÍNH = vế đầu trước dấu , ; : ( — vd "Tổ hợp Căn hộ cao cấp, Khách sạn 5 sao, TMDV" → "Tổ hợp Căn hộ cao cấp".
 *  Trang chi tiết vẫn ghi đủ. */
export function loaiHinhThe(loaiHinh: string): string {
  const v = giaTriThat(loaiHinh);
  if (v.length <= 30) return v;
  return v.split(/[,;:(]/)[0].replace(/\s+gồm\s*$/i, "").trim() || v;
}
