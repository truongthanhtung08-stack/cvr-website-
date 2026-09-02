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
//   · IPHONE / IPAD — Safari hay giữ link https lại trong tab. Nên đi BA NẤC:
//       1. comgooglemaps://  → mở app Google Maps nếu khách có cài (đa số có)
//       2. maps.apple.com    → 1,2 giây sau chưa rời trang tức là chưa cài Google
//                              Maps → mở BẢN ĐỒ APPLE (app hệ thống, gần như luôn có)
//       3. google.com/maps   → thêm 1,2 giây nữa vẫn chưa rời trang tức là máy
//                              KHÔNG CÓ app bản đồ nào (hiếm — khách đã xoá cả
//                              Apple Maps) → lúc đó mới mở bản web
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

// Đi lần lượt qua các nấc, nấc nào mở được app thì dừng ở đó.
// Rời trang (pagehide/blur) = app đã bật → huỷ mọi nấc sau cho khỏi mở thừa.
function moTheoMay(appGoogle: string, appApple: string, web: string) {
  if (typeof window === "undefined") return;
  // Android: link https đã được Google Maps đăng ký nên hệ điều hành tự mở app;
  // máy không có app nào thì chính link đó mở bản web. Một nấc là đủ.
  if (!laIOS()) {
    window.location.href = web;
    return;
  }

  const hen: ReturnType<typeof setTimeout>[] = [];
  const huy = () => hen.forEach(clearTimeout);
  window.addEventListener("pagehide", huy, { once: true });
  window.addEventListener("blur", huy, { once: true });

  // Nấc 2 — chưa cài Google Maps → Bản đồ Apple
  hen.push(setTimeout(() => { window.location.href = appApple; }, 1200));
  // Nấc 3 — không có app bản đồ nào (hiếm) → mở bản web
  hen.push(setTimeout(() => { window.location.href = web; }, 2600));
  // Nấc 1 — app Google Maps
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
