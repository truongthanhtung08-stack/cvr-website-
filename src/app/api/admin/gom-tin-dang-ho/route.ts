import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";
import { isVideoUrl } from "@/lib/media";

// ============================================================================
// GOM TIN ĐĂNG HỘ (chủ dự án 09/10/2026) — chạy sau khi admin đăng tin / nhập file:
//   1) Tin chưa có chủ mà có SĐT liên hệ → gắn vào tài khoản của số đó; số chưa có tài
//      khoản thì tạo tài khoản đăng hộ (profiles.tao_ho, cùng cách Admin → Tạo khách hàng).
//      Chính chủ đăng nhập bằng số của mình là thấy tin.
//   2) Tin đăng hộ chưa chọn ảnh đại diện → lấy ảnh hợp khung 4:3 nhất trong 5 ảnh đầu
//      (details.anh_bia). Tin khách tự đăng giữ đúng ảnh khách chọn.
// ============================================================================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const KHO = /^https?:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i;
const banNho = (u: string) => {
  if (!KHO.test(u)) return u;
  const [kho, ...con] = u.replace(KHO, "").split("/");
  return `https://coastalland.vn/anh/${kho}/nho/${con.join("/")}`;
};

async function tyLe(u: string): Promise<number | null> {
  try {
    const res = await fetch(banNho(u));
    if (!res.ok) return null;
    const m = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
    return m.width && m.height ? m.width / m.height : null;
  } catch {
    return null;
  }
}

export async function POST() {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, loi: "Chưa đăng nhập." }, { status: 401 });
  const { data: me } = await ssr.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ ok: false, loi: "Chỉ quản trị viên." }, { status: 403 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ ok: false, loi: "Máy chủ chưa cấu hình đủ." }, { status: 500 });

  // 1) Gắn chủ theo SĐT
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

  // 2) Ảnh đại diện cho tin đăng hộ chưa chọn
  const { data: hoHo } = await db.from("profiles").select("id").eq("tao_ho", true).limit(10000);
  const chuHo = new Set((hoHo ?? []).map((x) => x.id as string));
  const { data: ds } = await db.from("listings").select("id, owner_id, images, details").in("status", ["approved", "draft"]).limit(2000);
  let doiAnh = 0;
  for (const r of ds ?? []) {
    if (r.owner_id && !chuHo.has(r.owner_id)) continue;
    if (r.details?.anh_bia || r.details?.anh_bia_da_xet) continue;
    const anh = ((r.images ?? []) as string[]).filter((u) => !isVideoUrl(u)).slice(0, 5);
    let them: Record<string, unknown> = { anh_bia_da_xet: true };
    if (anh.length >= 2) {
      const tl = await Promise.all(anh.map(tyLe));
      const lech = (x: number | null) => (x ? Math.abs(Math.log(x / (4 / 3))) : 9);
      let tot = 0;
      tl.forEach((x, k) => { if (lech(x) < lech(tl[tot])) tot = k; });
      if (tot > 0 && lech(tl[0]) - lech(tl[tot]) >= Math.log(1.1)) { them = { ...them, anh_bia: anh[tot] }; doiAnh++; }
    }
    await db.from("listings").update({ details: { ...(r.details ?? {}), ...them } }).eq("id", r.id);
  }
  return NextResponse.json({ ok: true, taoTk, ganTin, doiAnh });
}
