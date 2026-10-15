import { tachNhieuSdt } from "@/lib/phone";

// ============================================================================
// KIỂM ĐỊNH DẠNG Ô NHẬP — MỘT CHUẨN CHO TOÀN WEB (chủ dự án 15/10/2026: "email không thể để định
// dạng sai được, áp dụng dạng chuẩn cho toàn website"). Trả về câu báo lỗi, rỗng = hợp lệ.
// Ô KHÔNG bắt buộc mà để trống thì hợp lệ; đã gõ thì phải đúng định dạng.
// ============================================================================

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;

export function loiEmail(v: string, batBuoc = false): string {
  const t = (v ?? "").trim();
  if (!t) return batBuoc ? "Chưa nhập email." : "";
  return EMAIL.test(t) ? "" : "Email chưa đúng định dạng (VD: ten@gmail.com).";
}

// Số điện thoại Việt Nam: di động 10 số hoặc số bàn 11 số, bắt đầu bằng 0 (nhận cả +84, dấu chấm,
// khoảng trắng). Ô ghi 2 số ("0905… / 0918…") thì từng số đều phải đúng.
export function loiSdt(v: string, batBuoc = true): string {
  const t = (v ?? "").trim();
  if (!t) return batBuoc ? "Chưa nhập số điện thoại." : "";
  const ds = tachNhieuSdt(t);
  const soChuSo = t.replace(/\D/g, "").length;
  // Có chữ số thừa không thuộc số nào (gõ thiếu / thừa một số) → báo sai.
  const daDung = ds.reduce((n, s) => n + s.length, 0);
  if (!ds.length || soChuSo - daDung > 2) return "Số điện thoại chưa đúng (VD: 0905123456).";
  return "";
}
