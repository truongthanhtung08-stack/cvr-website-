// ============================================================================
// ĐƯỜNG DẪN ẢNH ĐÃ TỐI ƯU — dùng cho những chỗ KHÔNG dùng được <Image> của Next
// (bộ xem ảnh toàn màn hình cần tự điều khiển transform để zoom/vuốt).
// ----------------------------------------------------------------------------
// Vì sao cần: ảnh gốc trong kho là JPEG ~1600px. Mở thẳng ảnh gốc trên điện
// thoại vừa nặng vừa lâu → cảm giác "load chậm, giật". Đi qua bộ tối ưu của
// Next trên Vercel thì máy nhận bản AVIF/WebP đúng bề rộng màn hình, nhẹ hơn
// 60–80%, lại được CDN giữ 30 ngày nên lần sau mở là tức thì.
// ============================================================================

// ⚠️ 5/9/2026 — KHÔNG đi qua /_next/image nữa.
// Gói Vercel miễn phí hết hạn mức tối ưu ảnh → mọi /_next/image trả về
// "402 Payment required". Ảnh trong trang dùng <Image unoptimized> nên vẫn hiện,
// nhưng BỘ XEM ẢNH TOÀN MÀN HÌNH gọi hàm này nên bấm vào ảnh là vỡ — đúng lỗi
// chủ dự án gặp cả buổi 5/9. Nay trả thẳng đường dẫn ảnh (đã đi qua /anh/… của
// chính mình, xem src/lib/asset.ts). Bật lại chỉ khi lên gói Vercel trả phí.
export function anhToiUu(src: string, _beRong = 1080, _chatLuong = 75): string {
  return src;
}

// Bề rộng cần tải theo màn hình thật (tính cả màn hình nét cao (retina),
// chặn trần 2048 để không tải ảnh quá to trên điện thoại đời mới).
export function beRongManHinh(): number {
  if (typeof window === "undefined") return 1080;
  return Math.min(2048, Math.round(window.innerWidth * Math.min(2, window.devicePixelRatio || 1)));
}
