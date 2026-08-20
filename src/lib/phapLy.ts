// ════════════════════════════════════════════════════════════════════════════
// THÔNG TIN PHÁP LÝ CỦA COASTAL LAND — ĐIỀN MỘT CHỖ, HIỆN Ở MỌI NƠI
//
// 👉 KHI CÓ GIẤY ĐĂNG KÝ KINH DOANH: chỉ cần điền vào giữa 2 dấu nháy "" dưới đây.
//    KHÔNG phải sửa file nào khác — footer và trang Quy chế hoạt động tự cập nhật.
//
// ⚠️ Ô nào còn TRỐNG ("") thì dòng đó TỰ ẨN trên web — không bao giờ lộ chữ mẫu,
//    không hiện "đang cập nhật". Điền vào là dòng tự hiện lên.
// ════════════════════════════════════════════════════════════════════════════

// ⚠️ CHỈ ĐƯA LÊN WEB THÔNG TIN CỦA PHÁP NHÂN — KHÔNG ĐƯA THÔNG TIN CÁ NHÂN.
//    Cấm đưa lên: HỌ TÊN người đại diện/chủ sở hữu, số định danh cá nhân, ngày sinh,
//    vốn điều lệ, điện thoại/email cá nhân. Đừng thêm mấy mục đó vào file này.
export const PHAP_LY = {
  // ── ĐÃ CÓ GIẤY ĐKKD (cấp 17/08/2026) ──────────────────────────────────────
  // Dùng TÊN VIẾT TẮT theo yêu cầu chủ dự án — đây là mục "Tên công ty viết tắt"
  // ghi trên giấy ĐKKD, hoàn toàn hợp lệ. KHÔNG dùng tên tiếng Việt đầy đủ
  // ("CÔNG TY TNHH BẤT ĐỘNG SẢN COASTAL LAND") trên web.
  tenCongTy: "COASTAL LAND",
  // Mã số doanh nghiệp — cũng chính là mã số thuế. CHỈ GHI MỘT LẦN trên web.
  maSoThue: "0402353502",
  ngayCap: "17/08/2026",
  noiCap: "Sở Tài chính thành phố Đà Nẵng",
  // Người chịu trách nhiệm nội dung — CỐ Ý ĐỂ TRỐNG theo yêu cầu chủ dự án:
  // không đưa TÊN CÁ NHÂN lên web, chỉ để pháp nhân (công ty) chịu trách nhiệm.
  // Để trống thì dòng này tự ẩn ở footer và trang Quy chế. Đừng tự điền lại.
  chiuTrachNhiemNoiDung: "",
  // Địa chỉ trụ sở chính, ghi theo đơn vị hành chính MỚI 2025 (Tỉnh/Thành → Phường/Xã).
  diaChiDayDu: "220 Nguyễn Mậu Tài, phường Hòa Xuân, thành phố Đà Nẵng",

  // ── CÒN THIẾU ─────────────────────────────────────────────────────────────
  // Link xác nhận đã thông báo website với Bộ Công Thương. ĐÃ CÓ ĐKKD → đăng ký
  // được ngay tại online.gov.vn; có link thì dán vào đây, dòng tự hiện ở footer.
  // VD: "http://online.gov.vn/Home/WebDetails/12345"
  boCongThuong: "",
};

// MỘT câu giấy phép gọn — viết như các website doanh nghiệp khác vẫn ghi.
// Trước đây mã số 0402353502 bị lặp 2 lần (câu "Giấy chứng nhận…" + dòng "Mã số thuế").
// Kết quả: "Mã số doanh nghiệp: 0402353502 do Sở Tài chính thành phố Đà Nẵng cấp ngày 17/08/2026"
// \u00A0 = dấu cách KHÔNG cho xuống dòng: giữ "nghiệp: 0402353502" và "ngày 17/08/2026"
// dính liền, không bị trình duyệt cắt đôi khi màn hẹp.
export const DONG_GIAY_PHEP = PHAP_LY.maSoThue
  ? `Mã số doanh nghiệp:\u00A0${PHAP_LY.maSoThue}` +
    (PHAP_LY.noiCap ? ` do ${PHAP_LY.noiCap} cấp` : "") +
    (PHAP_LY.ngayCap ? ` ngày\u00A0${PHAP_LY.ngayCap}` : "")
  : "";

// Câu miễn trừ trách nhiệm — sàn/cổng thông tin nào cũng có dòng này.
// Sửa chữ được, nhưng GIỮ NGUYÊN Ý: Coastal Land là cổng thông tin, không môi giới,
// không định giá, không phải một bên trong giao dịch. Bỏ ý này = tự nhận trách nhiệm
// pháp lý cho tin đăng của người khác.
export const MIEN_TRU =
  "Coastal Land là cổng thông tin bất động sản. Thông tin trong tin đăng do người bán, người cho thuê và môi giới cung cấp; chúng tôi kiểm duyệt trước khi hiển thị nhưng không bảo đảm tuyệt đối tính chính xác. Coastal Land không mua bán, không phân phối, không ký gửi, không môi giới, không định giá và không phải một bên trong giao dịch. Trước khi đặt cọc hay thanh toán, quý khách vui lòng tự kiểm tra thực địa và đối chiếu giấy tờ pháp lý.";
