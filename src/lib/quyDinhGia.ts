// ============================================================================
// QUY ĐỊNH & QUYỀN LỢI GÓI — MỘT NGUỒN DUY NHẤT LÀ ADMIN (chủ dự án chốt 25/09/2026)
// ----------------------------------------------------------------------------
// Giá nằm ở billing (/admin/gia-chuan), chữ quy định + quyền lợi nằm ở đây
// (site_content key "quy_dinh_gia"). Trang Bảng giá, trang Tiện ích, trang Gói
// hội viên, bảng giá trong form đăng tin đều đọc từ đây.
// ⛔ KHÔNG DUYỆT = KHÔNG HIỂN THỊ (chủ dự án 09/10/2026, "cấm tuyệt đối"): code KHÔNG có
// chữ mặc định nào. Mục chưa được duyệt trong admin → rỗng → khối đó ẩn trên web.
// ============================================================================
import type { TierId } from "@/lib/packages";

export type QuyenLoiHang = { loiIch: string[]; hienThi: string[] };
// Một dòng bảng so sánh quyền lợi 4 hạng tin (trang Bảng giá + trang Tiện ích).
export type DongQuyenLoi = { ten: string; giaTri: Record<TierId, string> };
export type QuyDinhGia = {
  quyenLoi: Record<TierId, QuyenLoiHang>;
  quyDinhChung: string[];
  dieuKienHoiVien: string[];
  bangQuyenLoi: DongQuyenLoi[];
  quyenLoiDuAn: Record<TierId, string[]>;
  quyDinhGoiTin: string[];
  quyDinhDayTin: string[];
  quyDinhBanner: string[];
};

export const KHOA_QUY_DINH_GIA = "quy_dinh_gia";

const HANG: TierId[] = ["diamond", "gold", "silver", "basic"];
const theoHang = <T,>(lay: (t: TierId) => T) => Object.fromEntries(HANG.map((t) => [t, lay(t)])) as Record<TierId, T>;

// Bản admin đã duyệt; phần nào chưa có thì RỖNG (không lấy chữ nào từ code).
export function ghepQuyDinh(luu: Partial<QuyDinhGia> | null | undefined): QuyDinhGia {
  return {
    quyenLoi: theoHang((t) => ({ loiIch: luu?.quyenLoi?.[t]?.loiIch ?? [], hienThi: luu?.quyenLoi?.[t]?.hienThi ?? [] })),
    quyDinhChung: luu?.quyDinhChung ?? [],
    dieuKienHoiVien: luu?.dieuKienHoiVien ?? [],
    bangQuyenLoi: luu?.bangQuyenLoi ?? [],
    quyenLoiDuAn: theoHang((t) => luu?.quyenLoiDuAn?.[t] ?? []),
    quyDinhGoiTin: luu?.quyDinhGoiTin ?? [],
    quyDinhDayTin: luu?.quyDinhDayTin ?? [],
    quyDinhBanner: luu?.quyDinhBanner ?? [],
  };
}
