// ════════════════════════════════════════════════════════════════════════════
// KÊNH LIÊN HỆ CHÍNH THỨC — KHAI MỘT CHỖ, DÙNG KHẮP WEB
//
// Mọi nút Zalo trên web phải trỏ về ZALO OFFICIAL ACCOUNT, KHÔNG trỏ nick cá nhân.
//
// VÌ SAO (chốt 24/08/2026):
//   · Nick Zalo cá nhân KHÔNG BAO GIỜ có dấu tick — Zalo chỉ cấp tick cho OA.
//     Khách bấm vào nick cá nhân thấy "Kết bạn", không tick → dễ nghĩ là giả mạo.
//   · OA "Coastal Land" đã được Zalo duyệt xác thực → hiện "Quan tâm" kèm tick
//     và dòng "OA này đã được xác thực bởi Zalo".
//   · Chỉ OA mới gửi được ZNS (mã OTP đăng nhập, báo nạp tiền, báo duyệt tin).
//     Dồn khách về OA thì sau này nhắn tin cho họ được.
//
// Số điện thoại vẫn giữ nguyên làm HOTLINE GỌI ĐIỆN — chỉ riêng nút chat Zalo
// là chuyển sang OA.
// ════════════════════════════════════════════════════════════════════════════

/** OA ID của "Coastal Land" (tài khoản đã xác thực). Đổi OA thì sửa đúng dòng này. */
export const ZALO_OA_ID = "1928684637254080247";

/** Link mở thẳng OA — dùng cho mọi nút/liên kết Zalo trên web. */
export const ZALO_OA_URL = `https://zalo.me/${ZALO_OA_ID}`;
