// ============================================================================
// ĐƯỜNG DẪN ẢNH ĐÃ TỐI ƯU — dùng cho những chỗ KHÔNG dùng được <Image> của Next
// (bộ xem ảnh toàn màn hình cần tự điều khiển transform để zoom/vuốt).
// ----------------------------------------------------------------------------
// Vì sao cần: ảnh gốc trong kho là JPEG ~1600px. Mở thẳng ảnh gốc trên điện
// thoại vừa nặng vừa lâu → cảm giác "load chậm, giật". Đi qua bộ tối ưu của
// Next trên Vercel thì máy nhận bản AVIF/WebP đúng bề rộng màn hình, nhẹ hơn
// 60–80%, lại được CDN giữ 30 ngày nên lần sau mở là tức thì.
// ============================================================================

// Bề rộng Next cho phép (khớp deviceSizes mặc định) — chọn mức gần nhất trở lên
const BE_RONG = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

export function anhToiUu(src: string, beRong = 1080, chatLuong = 75): string {
  if (!src) return src;
  // Ảnh data:/blob: hoặc SVG → giữ nguyên, bộ tối ưu không xử lý
  if (/^(data:|blob:)/i.test(src) || /\.svg($|\?)/i.test(src)) return src;

  const w = BE_RONG.find((x) => x >= beRong) ?? BE_RONG[BE_RONG.length - 1];
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${chatLuong}`;
}

// Bề rộng cần tải theo màn hình thật (tính cả màn hình nét cao (retina),
// chặn trần 2048 để không tải ảnh quá to trên điện thoại đời mới).
export function beRongManHinh(): number {
  if (typeof window === "undefined") return 1080;
  return Math.min(2048, Math.round(window.innerWidth * Math.min(2, window.devicePixelRatio || 1)));
}
