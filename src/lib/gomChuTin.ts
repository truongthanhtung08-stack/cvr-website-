import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";
import type { DongDoanhNghiep } from "@/lib/hoSoDoanhNghiep";

// ============================================================================
// GẮN CHỦ TIN ĐĂNG HỘ + HỒ SƠ DOANH NGHIỆP (sheet "Doanh nghiệp") — dùng chung cho route /api/admin/gom-tin-dang-ho (admin đăng tin /
// nhập file) và scripts/dang-dot-tin.mjs (Claude nạp đợt). Một đường, ra cùng một kết quả (23/10/2026).
// db = khoá máy chủ (service role).
// ============================================================================
export async function gomChuTin(db: SupabaseClient) {
  // 1) Tin chưa có chủ mà có SĐT liên hệ → gắn vào tài khoản của số đó; số chưa có tài khoản thì tạo tài khoản
  //    đăng hộ (profiles.tao_ho, cùng cách Admin → Tạo khách hàng). Chính chủ đăng nhập bằng số của mình là thấy tin.
  const { data: khongChu } = await db.from("listings").select("id, details").is("owner_id", null).limit(1000);
  const nhom = new Map<string, { ten: string; ids: string[] }>();
  for (const r of khongChu ?? []) {
    const s = chuanHoaSdt(r.details?.contact?.phone ?? "");
    if (!laSdtVN(s)) continue;
    const g = nhom.get(s) ?? { ten: (r.details?.contact?.name ?? "").trim(), ids: [] as string[] };
    g.ids.push(String(r.id));
    nhom.set(s, g);
  }
  let taoTk = 0, ganTin = 0;
  for (const [s, g] of nhom) {
    const so84 = `84${s.slice(1)}`;
    const { data: co } = await db.from("profiles").select("id").or(`phone.eq.${s},phone.eq.${so84},phone.eq.+${so84}`).limit(1);
    let id = co?.[0]?.id as string | undefined;
    if (!id) {
      const { data, error } = await db.auth.admin.createUser({
        email: `${s}@users.coastalland.vn`,
        email_confirm: true,
        password: randomBytes(18).toString("base64url"),
        user_metadata: { full_name: g.ten || "Thành viên", phone: s },
      });
      if (error || !data.user) continue;
      id = data.user.id;
      await db.from("profiles").update({ full_name: g.ten || "Thành viên", phone: s, tao_ho: true }).eq("id", id);
      taoTk++;
    }
    const { error } = await db.from("listings").update({ owner_id: id }).in("id", g.ids).is("owner_id", null);
    if (!error) ganTin += g.ids.length;
  }

  return { taoTk, ganTin };
}

// HỒ SƠ DOANH NGHIỆP từ sheet "Doanh nghiệp" (src/lib/hoSoDoanhNghiep.ts) — chạy SAU gomChuTin để tài khoản theo SĐT
// đã có. Khớp SĐT → vai trò "Công ty / Sàn" + điền ô còn trống. Không đổi tài khoản admin. Cột dn_* có từ 0065.
export async function napDoanhNghiep(db: SupabaseClient, ds: DongDoanhNghiep[]) {
  let capNhat = 0;
  const khongKhop: string[] = [];
  for (const d of ds.filter((x) => !x.loi.length)) {
    const so84 = `84${d.sdt.slice(1)}`;
    const { data: co } = await db.from("profiles").select("*").or(`phone.eq.${d.sdt},phone.eq.${so84},phone.eq.+${so84}`).limit(1);
    const p = co?.[0] as Record<string, unknown> | undefined;
    if (!p) { khongKhop.push(`${d.ten} (${d.sdt})`); continue; }
    if (p.role === "admin") continue;
    const moi: Record<string, string> = {};
    for (const [k, v] of Object.entries(d.hoSo)) if (!String(p[k] ?? "").trim()) moi[k] = v;
    if (p.role !== "company") moi.role = "company";
    if (!Object.keys(moi).length) continue;
    const { error } = await db.from("profiles").update(moi).eq("id", p.id as string);
    if (!error) capNhat++;
  }
  return { capNhat, khongKhop };
}
