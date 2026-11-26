import type { User } from "@supabase/supabase-js";
import { chuanHoaSdt } from "@/lib/phone";

// SỐ CỦA TÀI KHOẢN — MỘT LUẬT cho Cài đặt, đăng tin (anh 26/11/2026: "số đã xác thực thì phải lưu vào tài khoản"):
//   ① số trong hồ sơ (profiles.phone) → ② số ĐĂNG NHẬP đã xác thực (auth.phone) → ③ số xác minh lúc đăng tin / thêm ở Cài đặt mà
//   đang là số chính của tài khoản khác (không gộp — sdt_lien_he + sdt_lien_he_xac_minh).
export function soCuaTaiKhoan(
  hoSo: { phone?: string | null; sdt_lien_he_xac_minh?: boolean | null } | null | undefined,
  user: User | null | undefined,
): string {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  return (
    chuanHoaSdt(hoSo?.phone ?? "") ||
    (user?.phone && user.phone_confirmed_at ? chuanHoaSdt(`0${user.phone.replace(/^\+?84/, "")}`) : "") ||
    (hoSo?.sdt_lien_he_xac_minh ? chuanHoaSdt(String(meta.sdt_lien_he ?? "")) : "") ||
    // ④ số thêm đã xác thực ghi trong hồ sơ (so_them — số đang là số phụ của tài khoản khác)
    (Array.isArray(meta.so_them) ? chuanHoaSdt(String(meta.so_them[0] ?? "")) : "")
  );
}
