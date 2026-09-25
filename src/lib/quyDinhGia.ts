// ============================================================================
// QUY ĐỊNH & QUYỀN LỢI GÓI — MỘT NGUỒN DUY NHẤT LÀ ADMIN (chủ dự án chốt 25/09/2026)
// ----------------------------------------------------------------------------
// Giá nằm ở billing (/admin/gia-chuan), chữ quy định + quyền lợi nằm ở đây
// (site_content key "quy_dinh_gia"). Trang Bảng giá, trang Tiện ích, trang Gói
// hội viên đều đọc từ đây — không trang nào tự viết chữ quy định riêng.
//
// MÃ THAY THẾ trong chữ (máy tự điền theo cơ chế đang chạy ở packages.ts, để đổi
// hệ số X một chỗ là mọi câu tự đúng theo):
//   {X}          hệ số tiếp cận của hạng đó   (X30 · X15 · X8 · Cơ sở (1x))
//   {VI_TRI}     vị trí hiển thị của hạng đó
//   {NHAN_DIEN}  đặc điểm nhận diện thẻ tin của hạng đó
//   {SUAT_GHIM}  số suất đảm bảo trên Trang chủ của hạng đó
// Mặc định dưới đây = đúng chữ trang Bảng giá đang chạy trước khi chuyển về admin.
// ============================================================================
import { getTier, SUAT_GHIM, type TierId } from "@/lib/packages";

export type QuyenLoiHang = { loiIch: string[]; hienThi: string[] };
export type QuyDinhGia = {
  quyenLoi: Record<TierId, QuyenLoiHang>;
  quyDinhChung: string[];
  dieuKienHoiVien: string[];
};

export const KHOA_QUY_DINH_GIA = "quy_dinh_gia";

export const QUY_DINH_MAC_DINH: QuyDinhGia = {
  quyenLoi: {
    diamond: {
      loiIch: [
        "Hệ số tiếp cận {X} so với tin thường.",
        "Được ưu tiên nạp vào “Bất động sản nổi bật” và “Có thể bạn quan tâm”.",
        "Tiếp cận nhiều khách hàng nhất.",
      ],
      hienThi: [
        "{VI_TRI}.",
        "Đảm bảo {SUAT_GHIM} suất hàng đầu trên Trang chủ.",
        "Đứng trên CVR Gold.",
        "{NHAN_DIEN}.",
        "Chèn 1 link bất kỳ dưới tin đăng.",
      ],
    },
    gold: {
      loiIch: [
        "Hệ số tiếp cận {X} so với tin thường.",
        "Được ưu tiên nạp vào “Bất động sản nổi bật”.",
        "Tiếp cận nhiều khách hàng.",
      ],
      hienThi: ["{VI_TRI}.", "Đứng trên CVR Silver.", "{NHAN_DIEN}."],
    },
    silver: {
      loiIch: ["Hệ số tiếp cận {X} so với tin thường.", "Tiếp cận khách hàng tốt."],
      hienThi: ["{VI_TRI}.", "Đứng trên CVR Basic.", "{NHAN_DIEN}."],
    },
    basic: {
      loiIch: ["Mức hiển thị {X}.", "Chi phí thấp nhất."],
      hienThi: ["{VI_TRI}.", "{NHAN_DIEN}."],
    },
  },
  quyDinhChung: [
    "Toàn bộ giá trong bảng đã bao gồm thuế GTGT 8% — đúng bằng số tiền trừ vào ví khi tin được duyệt và lên sóng.",
    "(*) Ưu tiên hiển thị sớm: các tin VIP (CVR Diamond, CVR Gold và CVR Silver) được ưu tiên hiển thị và kiểm duyệt trước.",
    "(**) Không hiển thị quảng cáo: ở trang chi tiết tin đăng, trên cả giao diện desktop và mobile sẽ không xuất hiện banner quảng cáo — người xem tập trung tối đa vào nội dung tin.",
    "(***) Nhân đôi hiển thị: chức năng đặc biệt của CVR Diamond — khi tạo tin, khách hàng được tặng kèm một Tin thường hiển thị đồng thời ở trang kết quả tìm kiếm; khi Đẩy tin CVR Diamond, tin thường đi kèm cũng được đẩy miễn phí.",
    "Việc hiển thị tin đăng trên Sàn dựa trên các tiêu chí gồm nhưng không giới hạn ở: loại gói dịch vụ (tin thường, CVR Silver, CVR Gold, CVR Diamond), thời điểm đăng tin và các tiêu chí kỹ thuật khác theo quy định của Sàn tại từng thời điểm.",
  ],
  dieuKienHoiVien: [
    "Voucher cấp lại mỗi 30 ngày trong thời hạn gói, hạn dùng 30 ngày, tự trừ khi tin được duyệt hoặc đẩy tin.",
    "Mỗi tài khoản dùng một gói tại một thời điểm. Gói đã mua không huỷ được; hạ tin đã dùng voucher không hoàn voucher.",
    "Giá đã gồm thuế GTGT, thanh toán bằng số dư ví.",
  ],
};

// Điền mã thay thế theo cơ chế đang chạy.
export function dienMa(dong: string, tier?: TierId): string {
  if (!tier) return dong;
  const t = getTier(tier);
  const suat = tier === "diamond" || tier === "gold" ? String(SUAT_GHIM[tier]) : "";
  return dong
    .replaceAll("{X}", t.heSoText)
    .replaceAll("{VI_TRI}", t.viTri)
    .replaceAll("{NHAN_DIEN}", t.nhanDien)
    .replaceAll("{SUAT_GHIM}", suat);
}

// Ghép bản admin đã lưu với mặc định — thiếu phần nào thì lấy mặc định phần đó.
export function ghepQuyDinh(luu: Partial<QuyDinhGia> | null | undefined): QuyDinhGia {
  const m = QUY_DINH_MAC_DINH;
  if (!luu) return m;
  const hang = (t: TierId): QuyenLoiHang => ({
    loiIch: luu.quyenLoi?.[t]?.loiIch ?? m.quyenLoi[t].loiIch,
    hienThi: luu.quyenLoi?.[t]?.hienThi ?? m.quyenLoi[t].hienThi,
  });
  return {
    quyenLoi: { diamond: hang("diamond"), gold: hang("gold"), silver: hang("silver"), basic: hang("basic") },
    quyDinhChung: luu.quyDinhChung ?? m.quyDinhChung,
    dieuKienHoiVien: luu.dieuKienHoiVien ?? m.dieuKienHoiVien,
  };
}
