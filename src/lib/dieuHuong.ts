// ĐIỀU HƯỚNG QUANH ĐĂNG NHẬP — dùng chung cho mọi form đăng nhập / đăng ký.
// Lối đi đã chốt 25/09/2026: Website → Đăng nhập → Khu quản lý → Quay lại về website.
//
// Mọi lần chuyển trang sau đăng nhập đều THAY trang (location.replace), không
// chồng lịch sử: bấm back cứng của điện thoại sẽ không rơi lại vào trang đăng
// nhập (đã đăng nhập rồi mà còn thấy form đăng nhập là "chạy lung tung").

// Đích sau khi đăng nhập: ?next= (chỉ nhận đường dẫn TRONG web, chặn link ra
// ngoài kiểu //trang-la.com). Không có ?next mà form đăng nhập đang nằm NGAY TRONG một trang khác (vd /dang-tin
// chưa đăng nhập — chủ dự án 22/10/2026) → về đúng trang đó. Còn lại về mặc định (trang quản lý của khách).
export function dichSauDangNhap(macDinh = "/tai-khoan"): string {
  const next = new URLSearchParams(window.location.search).get("next") ?? "";
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  const duong = window.location.pathname;
  if (!/^\/(dang-nhap|dang-ky|quen-mat-khau|auth)(\/|$)/.test(duong)) return duong + window.location.search;
  return macDinh;
}

// "?next=…" mang sang trang đăng nhập / đăng ký kế tiếp (số điện thoại, Đăng ký) — MỘT logic với dichSauDangNhap.
export function thamSoNext(): string {
  const n = dichSauDangNhap("");
  return n ? `?next=${encodeURIComponent(n)}` : "";
}

// Trang web khách đang xem trước khi vào khu quản lý (BackBar ghi lại).
export function trangWebTruocDo(): string {
  try {
    return sessionStorage.getItem("cl_trang_web") || "/";
  } catch {
    return "/";
  }
}
