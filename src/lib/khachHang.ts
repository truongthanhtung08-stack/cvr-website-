// MỘT NGƯỜI = MỘT SỐ ĐIỆN THOẠI. Cùng một người vừa xem tin (thành viên) vừa hỏi
// số qua OTP thì gộp làm một, không đếm thành hai khách. Không có số thì theo
// tài khoản. Dùng chung cho Tổng quan và trang Khách hàng để hai nơi ra cùng số.
export function khoaKhach(viewerId: string | null, sdt: string | null, duPhong: string): string {
  const so = (sdt ?? "").replace(/\D/g, "").replace(/^84/, "0");
  return so.length >= 9 ? `sdt:${so}` : viewerId ?? `id:${duPhong}`;
}
