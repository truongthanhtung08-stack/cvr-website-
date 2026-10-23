import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gomChuTin } from "@/lib/gomChuTin";
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

  // 1) Gắn chủ theo SĐT — src/lib/gomChuTin.ts (dùng chung với scripts/dang-dot-tin.mjs — gắn chủ + sheet Doanh nghiệp)
  const { taoTk, ganTin } = await gomChuTin(db);

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
