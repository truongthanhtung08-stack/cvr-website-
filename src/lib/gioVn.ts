// ============================================================================
// GIỜ VIỆT NAM (GMT+7) — MỘT CHỖ CHO TOÀN HỆ THỐNG (chủ dự án 23/10/2026: "ngày giờ tính theo GMT+7, áp dụng toàn hệ thống —
// tin đăng theo ngày, hiển thị, hết hạn; tính theo giờ Mỹ là chết").
//
// Máy chủ Vercel chạy giờ UTC (chậm Việt Nam 7 tiếng): new Date().toISOString().slice(0, 10) lúc 0h–7h sáng VN vẫn ra NGÀY
// HÔM QUA → chương trình bắt đầu "hôm nay" chưa chạy, khuyến mãi hết "hôm qua" vẫn tính, ngày in ra lệch một ngày.
// Mọi "hôm nay" dùng homNayVn(); mọi ngày hiện cho người xem truyền MUI_GIO_VN vào toLocale…String.
// (Mốc thời gian lưu trong CSDL là timestamptz — đúng tuyệt đối, chỉ cách ĐỌC ra ngày mới cần múi giờ.)
// ============================================================================

export const MUI_GIO_VN = "Asia/Ho_Chi_Minh";

/** Hôm nay theo giờ Việt Nam — "YYYY-MM-DD". */
export const homNayVn = (): string => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
