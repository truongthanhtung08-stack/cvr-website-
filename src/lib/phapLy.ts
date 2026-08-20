// ════════════════════════════════════════════════════════════════════════════
// THÔNG TIN PHÁP LÝ CỦA COASTAL LAND — ĐIỀN MỘT CHỖ, HIỆN Ở MỌI NƠI
//
// 👉 KHI CÓ GIẤY ĐĂNG KÝ KINH DOANH: chỉ cần điền vào giữa 2 dấu nháy "" dưới đây.
//    KHÔNG phải sửa file nào khác — footer và trang Quy chế hoạt động tự cập nhật.
//
// ⚠️ Ô nào còn TRỐNG ("") thì dòng đó TỰ ẨN trên web — không bao giờ lộ chữ mẫu,
//    không hiện "đang cập nhật". Điền vào là dòng tự hiện lên.
// ════════════════════════════════════════════════════════════════════════════

// ⚠️ CHỈ ĐƯA LÊN WEB NHỮNG THÔNG TIN BẮT BUỘC PHẢI CÔNG KHAI.
//    Giấy ĐKKD còn nhiều mục KHÔNG được đưa lên: số định danh cá nhân, ngày sinh,
//    vốn điều lệ, điện thoại/email cá nhân của chủ sở hữu. Đừng thêm vào file này.
export const PHAP_LY = {
  // ── ĐÃ CÓ GIẤY ĐKKD (cấp 17/08/2026) ──────────────────────────────────────
  // Tên pháp lý đầy đủ — phải ghi ĐÚNG như trên giấy phép.
  tenCongTy: "CÔNG TY TNHH BẤT ĐỘNG SẢN COASTAL LAND",
  dangKyKinhDoanh:
    "Giấy chứng nhận đăng ký doanh nghiệp số 0402353502 do Phòng Đăng ký kinh doanh — Sở Tài chính thành phố Đà Nẵng cấp ngày 17/08/2026",
  // Mã số doanh nghiệp cũng chính là mã số thuế.
  maSoThue: "0402353502",
  // Người chịu trách nhiệm nội dung — bắt buộc theo luật. Là người đại diện pháp luật.
  chiuTrachNhiemNoiDung: "Ông Trương Thanh Tùng",
  // Địa chỉ trụ sở chính, ghi theo đơn vị hành chính MỚI 2025 (Tỉnh/Thành → Phường/Xã).
  diaChiDayDu: "220 Nguyễn Mậu Tài, phường Hòa Xuân, thành phố Đà Nẵng",

  // ── CÒN THIẾU ─────────────────────────────────────────────────────────────
  // Link xác nhận đã thông báo website với Bộ Công Thương. ĐÃ CÓ ĐKKD → đăng ký
  // được ngay tại online.gov.vn; có link thì dán vào đây, dòng tự hiện ở footer.
  // VD: "http://online.gov.vn/Home/WebDetails/12345"
  boCongThuong: "",
};

// Câu miễn trừ trách nhiệm — sàn/cổng thông tin nào cũng có dòng này.
// Sửa chữ được, nhưng GIỮ NGUYÊN Ý: Coastal Land là cổng thông tin, không môi giới,
// không định giá, không phải một bên trong giao dịch. Bỏ ý này = tự nhận trách nhiệm
// pháp lý cho tin đăng của người khác.
export const MIEN_TRU =
  "Coastal Land là cổng thông tin bất động sản. Thông tin trong tin đăng do người bán, người cho thuê và môi giới cung cấp; chúng tôi kiểm duyệt trước khi hiển thị nhưng không bảo đảm tuyệt đối tính chính xác. Coastal Land không mua bán, không phân phối, không ký gửi, không môi giới, không định giá và không phải một bên trong giao dịch. Trước khi đặt cọc hay thanh toán, quý khách vui lòng tự kiểm tra thực địa và đối chiếu giấy tờ pháp lý.";
