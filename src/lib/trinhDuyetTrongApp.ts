// ============================================================================
// NHẬN RA "TRÌNH DUYỆT TRONG APP" (in-app browser / WebView)
//
// Rất nhiều khách bấm link Coastal Land từ **Zalo** hoặc Facebook. Lúc đó trang
// không chạy trong Chrome/Safari mà chạy trong cái trình duyệt thu nhỏ nằm bên
// trong app đó. Hậu quả thật, chủ dự án đã chụp lại được:
//
//   Bấm "Chọn ảnh từ bộ sưu tập" → hiện bảng "Chọn một thao tác" chỉ có
//   Máy ảnh · File của bạn · Files — KHÔNG có Bộ sưu tập.
//
// Nguyên nhân: WebView của các app này không nối vào bộ chọn ảnh của hệ điều
// hành, nó chỉ chuyển tiếp yêu cầu "chọn tệp" chung chung. Web KHÔNG sửa được
// bằng thuộc tính nào — `accept="image/*"` đã đặt đúng và đã kiểm trên bản chạy
// thật. Cách duy nhất là đưa khách sang trình duyệt thật.
//
// Trên Android mở được thẳng bằng liên kết `intent://` (Chrome). iPhone không
// cho web tự mở app khác, nên chỉ chỉ đúng một thao tác: bấm ••• → Mở trong Safari.
// ============================================================================

export type LoaiTrongApp = "zalo" | "facebook" | "khac" | null;

// Chỉ nhận diện những app người Việt thật sự hay dùng để mở link.
export function trinhDuyetTrongApp(ua = typeof navigator !== "undefined" ? navigator.userAgent : ""): LoaiTrongApp {
  if (!ua) return null;
  const s = ua.toLowerCase();
  if (/zalo/.test(s)) return "zalo";
  // ⛔ ĐỪNG THÊM SAMSUNG INTERNET VÀO ĐÂY.
  // Đã thử 12/09/2026 và bị chủ dự án bác ngay: khối cảnh báo hiện lên cho mọi
  // khách dùng Samsung Internet thành ra một lời phân trần dán giữa màn hình
  // ("trình duyệt của bạn không chọn được ảnh") — thứ tuyệt đối không được in ra
  // giao diện khách. Samsung Internet là trình duyệt THẬT, cứ để nó chạy bình
  // thường. Khối này CHỈ dành cho WebView trong app (Zalo, Facebook) — nơi thật
  // sự không có lối nào khác.
  if (/fban|fbav|fb_iab|instagram|messenger/.test(s)) return "facebook";
  // WebView Android chung (TikTok, Shopee, app nội bộ…): có "; wv)" trong UA.
  if (/;\s*wv\)/.test(s) || /line\//.test(s)) return "khac";
  return null;
}

export function laIOS(ua = typeof navigator !== "undefined" ? navigator.userAgent : ""): boolean {
  return /iphone|ipad|ipod/i.test(ua);
}

// Liên kết mở CHÍNH TRANG ĐANG XEM bằng Chrome trên Android.
// Giữ nguyên đường dẫn + tham số để khách quay lại đúng chỗ đang làm dở, không
// bị đá về trang chủ rồi phải nhập lại từ đầu.
export function duongDanMoChrome(): string {
  if (typeof window === "undefined") return "";
  const u = new URL(window.location.href);
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;end`;
}
