import type { SupabaseClient } from "@supabase/supabase-js";
import { tachNhieuSdt } from "@/lib/phone";

// ============================================================================
// TÌM TÀI KHOẢN THEO SỐ ĐIỆN THOẠI — dùng chung cho đăng nhập và màn đăng ký.
// QUY TẮC CHỦ DỰ ÁN CHỐT 27/09/2026: 1 SỐ ĐIỆN THOẠI = 1 TÀI KHOẢN. Khách có 2 số là 2
// tài khoản; muốn chung thì khách TỰ GỘP (nhận mã ở cả số kia).
// Một số thuộc về tài khoản nếu: là SỐ CHÍNH trong hồ sơ (profiles.phone, lưu 0… hoặc
// 84… tuỳ đường tạo), hoặc là số phụ ĐÃ XÁC MINH (có được khi gộp tài khoản / Coastal
// Land duyệt). Số phụ chỉ khai tay mà chưa xác minh KHÔNG tính.
// Chỉ chạy phía máy chủ, với khoá service_role.
// ============================================================================

export type TimThay = { id: string; tu: "ho-so" | "so-phu" } | null | "trung";

export async function timTaiKhoan(admin: SupabaseClient, sdt: string): Promise<TimThay> {
  const so84 = `84${sdt.slice(1)}`;
  const [{ data: hs }, { data: phu }] = await Promise.all([
    admin.from("profiles").select("id,phone_verified").or(`phone.eq.${sdt},phone.eq.${so84},phone.eq.+${so84}`),
    admin.from("sdt_nguoi_dung").select("user_id,da_xac_minh").eq("sdt", sdt).eq("da_xac_minh", true),
  ]);
  const ung = new Map<string, { tu: "ho-so" | "so-phu"; xacMinh: boolean }>();
  for (const h of hs ?? []) {
    // Số trong hồ sơ CHỈ tính khi đã chứng minh là của chủ tài khoản: đã xác minh, hoặc là
    // số tài khoản đó dùng để đăng ký (Supabase Auth đã xác nhận). Số gõ tay vào hồ sơ mà
    // chưa xác minh thì KHÔNG — nếu không, ai có số đó nhận mã là vào được tài khoản người
    // khác (tài khoản quản trị đang ghi một số chưa xác minh, đo 27/09/2026).
    let hopLe = !!h.phone_verified;
    if (!hopLe) {
      const { data: u } = await admin.auth.admin.getUserById(h.id);
      hopLe = (u?.user?.phone ?? "").replace(/^\+/, "") === so84 && !!u?.user?.phone_confirmed_at;
    }
    if (hopLe) ung.set(h.id, { tu: "ho-so", xacMinh: true });
  }
  for (const p of phu ?? []) if (!ung.has(p.user_id)) ung.set(p.user_id, { tu: "so-phu", xacMinh: !!p.da_xac_minh });

  if (ung.size === 0) return null;
  if (ung.size === 1) {
    const [[id, v]] = [...ung];
    return { id, tu: v.tu };
  }
  // Nhiều tài khoản cùng khai số này → chỉ nhận khi đúng MỘT tài khoản đã xác minh nó.
  const daXm = [...ung].filter(([, v]) => v.xacMinh);
  return daXm.length === 1 ? { id: daXm[0][0], tu: daXm[0][1].tu } : "trung";
}

// Số tin ĐĂNG HỘ (chưa có chủ) đang ghi số này — ô liên hệ có thể chứa 2 số.
export async function demTinDangHo(admin: SupabaseClient, sdt: string): Promise<number> {
  const { data } = await admin
    .from("listings")
    .select("details->contact->>phone")
    .is("owner_id", null)
    .eq("status", "approved");
  return (data ?? []).filter((d) => tachNhieuSdt(String((d as { phone?: string }).phone ?? "")).includes(sdt)).length;
}
