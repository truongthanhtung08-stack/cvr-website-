// ════════════════════════════════════════════════════════════════════════════
// MỞ APP BẢN ĐỒ TRÊN MÁY KHÁCH — chỉ đường / xem vị trí
//
// VÌ SAO CẦN FILE RIÊNG: hầu như khách nào cũng đã cài sẵn app bản đồ, nên bấm
// nút là phải nhảy thẳng vào APP chứ không phải mở một tab trình duyệt rồi bắt
// khách bấm thêm lần nữa. Cách mở khác nhau theo máy:
//
//   · ANDROID — link https://www.google.com/maps/... được Google Maps đăng ký sẵn
//     (App Links) nên hệ điều hành tự chuyển vào app Google Maps.
//
//   · IPHONE / IPAD — Safari hay giữ link https lại trong tab. Nên đi ba nấc:
//       1. comgooglemaps://  → mở app Google Maps nếu khách có cài
//       2. maps.apple.com    → 1,2 giây sau chưa rời trang tức là chưa cài
//                              Google Maps → mở BẢN ĐỒ APPLE, máy nào cũng có sẵn
//       3. (Apple Maps là app hệ thống nên luôn mở được, không cần nấc thứ tư)
//
// LƯU Ý: dùng window.location.href chứ KHÔNG dùng window.open — trên iOS,
// window.open bị coi là cửa sổ mới nên không kích hoạt được app.
//
// TOÀN BỘ LINK NÀY MIỄN PHÍ — chỉ là đường dẫn thường, không gọi API Google,
// không tính tiền, không cần khoá.
// ════════════════════════════════════════════════════════════════════════════

function laIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPad đời mới báo user agent giống máy Mac, phân biệt bằng cảm ứng
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// Thử mở app Google Maps; 1,2 giây chưa rời trang thì chuyển sang bản đồ dự phòng
function moTheoMay(appGoogle: string, duPhong: string, webAndroid: string) {
  if (typeof window === "undefined") return;
  if (!laIOS()) {
    window.location.href = webAndroid;
    return;
  }
  const hen = setTimeout(() => {
    window.location.href = duPhong;
  }, 1200);
  // Rời trang được = app đã mở → huỷ dự phòng cho khỏi mở thừa
  const huy = () => clearTimeout(hen);
  window.addEventListener("pagehide", huy, { once: true });
  window.addEventListener("blur", huy, { once: true });
  window.location.href = appGoogle;
}

/** CHỈ ĐƯỜNG tới `diemDen` (toạ độ "lat,lng" hoặc địa chỉ chữ). `diemDi` bỏ trống
 *  thì app bản đồ tự lấy vị trí máy khách làm điểm xuất phát. */
export function chiDuong(diemDen: string, diemDi?: string) {
  const den = encodeURIComponent(diemDen);
  const di = diemDi ? encodeURIComponent(diemDi) : "";
  const web = `https://www.google.com/maps/dir/?api=1&destination=${den}` + (di ? `&origin=${di}` : "");
  const appGoogle = `comgooglemaps://?daddr=${den}` + (di ? `&saddr=${di}` : "") + "&directionsmode=driving";
  // Bản đồ Apple: dirflg=d là đi ô tô
  const apple = `https://maps.apple.com/?daddr=${den}` + (di ? `&saddr=${di}` : "") + "&dirflg=d";
  moTheoMay(appGoogle, apple, web);
}

/** XEM một vị trí trên app bản đồ (không chỉ đường) — để soi ảnh vệ tinh, tên
 *  đường, tiện ích quanh đó. */
export function xemTrenBanDo(viTri: string) {
  const q = encodeURIComponent(viTri);
  moTheoMay(
    `comgooglemaps://?q=${q}`,
    `https://maps.apple.com/?q=${q}`,
    `https://www.google.com/maps/search/?api=1&query=${q}`,
  );
}
