// ĐIỀU HƯỚNG QUANH ĐĂNG NHẬP — dùng chung cho mọi form đăng nhập / đăng ký.
// Lối đi đã chốt 25/09/2026: Website → Đăng nhập → Khu quản lý → Quay lại về website.
//
// Mọi lần chuyển trang sau đăng nhập đều THAY trang (location.replace), không
// chồng lịch sử: bấm back cứng của điện thoại sẽ không rơi lại vào trang đăng
// nhập (đã đăng nhập rồi mà còn thấy form đăng nhập là "chạy lung tung").

// Đích sau khi đăng nhập: ?next= (chỉ nhận đường dẫn TRONG web, chặn link ra
// ngoài kiểu //trang-la.com) — không có thì về mặc định.
export function dichSauDangNhap(macDinh = "/tai-khoan"): string {
  const next = new URLSearchParams(window.location.search).get("next") ?? "";
  return next.startsWith("/") && !next.startsWith("//") ? next : macDinh;
}

// Trang web khách đang xem trước khi vào khu quản lý (BackBar ghi lại).
export function trangWebTruocDo(): string {
  try {
    return sessionStorage.getItem("cl_trang_web") || "/";
  } catch {
    return "/";
  }
}
