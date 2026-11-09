import type { createAdminClient } from "@/lib/supabase/admin";
import { datDaiDien } from "@/lib/daiDien";
import { tuSuaTkKhoa } from "@/lib/gopTaiKhoan";
import { ZALO_ME_URL, emailKyThuat } from "@/lib/zalo";

// ============================================================================
// TÀI KHOẢN THEO ZALO — dùng cho ZALO MINI APP (chủ dự án 06/11/2026: "Zalo Mini App phải tận dụng ngay nền tảng của Zalo —
// đăng nhập bằng Zalo, lấy thông tin đầy đủ theo quy định của nó", cho 100 triệu người dùng Zalo).
// ----------------------------------------------------------------------------
// CÙNG MỘT LUẬT với đăng nhập Zalo trên web (src/app/auth/zalo/callback/route.ts, bước 2–3): cùng Zalo App 114204740698790237
// nên cùng mã người dùng Zalo → cùng tài khoản; tìm theo profiles.zalo_id → email kỹ thuật; tài khoản đã gộp / khoá đời cũ đi
// qua tuSuaTkKhoa; tên + ảnh mặc định theo Zalo (datDaiDien). Web callback chưa gọi file này (đường web đã chạy đúng, không
// đụng — 03/11 "cấm đụng cái đã fix"); sửa luật ở đây thì sửa cả callback cho khớp.
// Số điện thoại KHÔNG lấy ở đây: số bắt buộc khi đăng tin, xác minh bằng mã tới chính số đó (/api/xac-thuc/xac-minh-sdt — luật 06/11).
// Chi phí: mỗi lần đăng nhập 1–2 lượt gọi Zalo qua trạm VN + vài lệnh Supabase; không cron, không xoá cache.
// ============================================================================

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;
export type ZaloMe = { id?: string; name?: string; picture?: { data?: { url?: string } } };

/** Hỏi Zalo id + tên + ảnh bằng access token của khách. Zalo chỉ trả cho IP Việt Nam → qua trạm VN (ZALO_PROXY_URL/KEY). */
export async function hoiZaloMe(accessToken: string, fields = "id,name,picture"): Promise<ZaloMe> {
  const proxyUrl = process.env.ZALO_PROXY_URL;
  const proxyKey = process.env.ZALO_PROXY_KEY;
  if (proxyUrl && proxyKey) {
    const r = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cl-key": proxyKey },
      body: JSON.stringify({ access_token: accessToken, fields }),
      cache: "no-store",
    });
    return (await r.json()) as ZaloMe;
  }
  const u = new URL(ZALO_ME_URL);
  u.searchParams.set("fields", fields);
  const r = await fetch(u.toString(), { headers: { access_token: accessToken }, cache: "no-store" });
  return (await r.json()) as ZaloMe;
}

/** Đổi token Mini App (getPhoneNumber / getLocation) ra số hoặc toạ độ: graph.zalo.me/v2.0/me/info + khoá bí mật Zalo App.
 *  Zalo chỉ trả cho IP Việt Nam → qua trạm VN (loai "sdt" của tools/zalo-proxy-vn/zalo-me.php — trạm gọi đúng me/info, dùng chung cho vị trí).
 *  Trước 09/11/2026 hai đường số + vị trí gọi thẳng từ Vercel (Mỹ) → Zalo từ chối, Mini App báo "Chưa lấy được số từ Zalo". */
export async function hoiZaloInfo(accessToken: string, code: string): Promise<{ error?: number; data?: { number?: string; latitude?: string; longitude?: string } }> {
  const secret = process.env.ZALO_APP_SECRET;
  if (!secret) return { error: -1 };
  const proxyUrl = process.env.ZALO_PROXY_URL;
  const proxyKey = process.env.ZALO_PROXY_KEY;
  const r = proxyUrl && proxyKey
    ? await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cl-key": proxyKey },
        body: JSON.stringify({ loai: "sdt", access_token: accessToken, code, secret_key: secret }),
        cache: "no-store",
      })
    : await fetch("https://graph.zalo.me/v2.0/me/info", { headers: { access_token: accessToken, code, secret_key: secret }, cache: "no-store" });
  return r.json();
}

/** Tìm / tạo tài khoản của người dùng Zalo (đúng luật web callback). Trả id tài khoản khách sẽ vào + email để mở phiên. */
export async function taiKhoanTheoZalo(admin: Admin, me: ZaloMe & { id: string }): Promise<{ uid: string; email: string } | null> {
  let email = emailKyThuat(me.id);
  const anh = me.picture?.data?.url ?? null;

  const moTkKhoa = async (id: string): Promise<string> => {
    const giu = await tuSuaTkKhoa(admin, id);
    if (giu !== id) {
      const { data: giuHs } = await admin.from("profiles").select("zalo_id").eq("id", giu).maybeSingle();
      if (giuHs && !giuHs.zalo_id) {
        await admin.from("profiles").update({ zalo_id: null }).eq("id", id).eq("zalo_id", me.id);
        const { error: loiGan } = await admin.from("profiles").update({ zalo_id: me.id }).eq("id", giu).is("zalo_id", null);
        if (loiGan) await admin.from("profiles").update({ zalo_id: me.id }).eq("id", id).is("zalo_id", null);
      }
    }
    return giu;
  };

  let { data: daGan } = await admin.from("profiles").select("id").eq("zalo_id", me.id).maybeSingle();
  if (!daGan) {
    const { data: theoEmail } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (theoEmail) daGan = theoEmail;
  }
  let uid: string | undefined;
  if (daGan) {
    uid = await moTkKhoa(daGan.id as string);
    const { data: uGan } = await admin.auth.admin.getUserById(uid);
    if (uGan?.user?.email) email = uGan.user.email;
    else {
      const { error } = await admin.auth.admin.updateUserById(uid, { email, email_confirm: true });
      if (error) return null;
    }
  } else {
    const { data: moi, error: loiTao } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: me.name?.trim() || "Người dùng Zalo", avatar_url: anh, provider: "zalo", zalo_id: me.id },
    });
    if (loiTao && !/already/i.test(loiTao.message)) return null;
    uid = moi?.user?.id;
    if (!uid) {
      const { data: theoEmail } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
      uid = theoEmail?.id as string | undefined;
    }
    if (!uid) return null;
    await admin.from("profiles").update({ zalo_id: me.id }).eq("id", uid).is("zalo_id", null);
  }
  // Tên + ảnh mặc định theo Zalo (26/10/2026) — khách tự đặt trong Cài đặt thì datDaiDien giữ của khách.
  await datDaiDien(admin, uid, "zalo", { ten: me.name, anh });
  return { uid, email };
}
