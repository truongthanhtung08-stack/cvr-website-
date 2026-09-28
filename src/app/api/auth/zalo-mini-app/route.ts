import { NextResponse } from "next/server";
import { createClient as taoClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { zaloConfig } from "@/lib/zalo";

// ============================================================================
// ĐĂNG NHẬP 1 CHẠM TỪ ZALO MINI APP — bằng SỐ ĐIỆN THOẠI ZALO của khách
// ----------------------------------------------------------------------------
// Mini App gửi lên: accessToken (getAccessToken) + maSdt (token của getPhoneNumber).
// Máy chủ đổi maSdt ra số thật qua graph.zalo.me/v2.0/me/info — Zalo CHỈ cho gọi từ
// IP Việt Nam nên đi qua trạm trung chuyển (tools/zalo-proxy-vn, biến ZALO_PROXY_URL/KEY).
// Có số → tìm tài khoản theo số (chung tài khoản với web), chưa có thì tạo; số đã được
// Zalo xác thực nên đánh dấu phone_verified. Trả phiên đăng nhập để Mini App setSession.
//
// CHỈ CHẠY KHI ĐỦ HAI ĐIỀU KIỆN (chưa đủ thì trả lỗi, Mini App tự lùi về đăng nhập OTP):
//   1) Zalo đã duyệt Mini App + cấp quyền số điện thoại (scope.userPhonenumber)
//   2) Có trạm Việt Nam (máy chủ VNPT) — Vercel ở Mỹ gọi thẳng sẽ bị -501
// Khoá bí mật = khoá của Zalo App chứa Mini App (ZALO_APP_SECRET, dùng chung với đăng nhập web).
// ============================================================================
export const dynamic = "force-dynamic";

function choPhep(req: Request): Record<string, string> {
  const nguon = req.headers.get("origin") ?? "";
  const hopLe = /^https:\/\/([a-z0-9-]+\.)*(zdn\.vn|zalo\.me|zaloapp\.com|zaloplatforms\.com)$/i.test(nguon) || /^http:\/\/(localhost|192\.168\.\d+\.\d+):\d+$/.test(nguon);
  return hopLe
    ? { "Access-Control-Allow-Origin": nguon, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : {};
}

export function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: choPhep(req) });
}

export async function POST(req: Request) {
  const res = await xuLy(req);
  for (const [k, v] of Object.entries(choPhep(req))) res.headers.set(k, v);
  return res;
}

const loi = (ma: string, status = 400) => NextResponse.json({ ok: false, loi: ma }, { status });

async function xuLy(req: Request) {
  const { accessToken, maSdt, ten } = (await req.json().catch(() => ({}))) as { accessToken?: string; maSdt?: string; ten?: string };
  if (!accessToken || !maSdt) return loi("thieu_token");

  const { secret } = zaloConfig();
  const admin = createAdminClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!secret || !admin || !url || !anon) return loi("chua_cau_hinh", 503);

  // ── 1. Đổi mã ra số thật (qua trạm VN nếu có) ──────────────────────────────
  type KetQua = { data?: { number?: string }; error?: number; message?: string };
  let kq: KetQua;
  try {
    const proxyUrl = process.env.ZALO_PROXY_URL;
    const proxyKey = process.env.ZALO_PROXY_KEY;
    const r = proxyUrl && proxyKey
      ? await fetch(proxyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-cl-key": proxyKey },
          body: JSON.stringify({ loai: "sdt", access_token: accessToken, code: maSdt, secret_key: secret }),
          cache: "no-store",
        })
      : await fetch("https://graph.zalo.me/v2.0/me/info", {
          headers: { access_token: accessToken, code: maSdt, secret_key: secret },
          cache: "no-store",
        });
    kq = (await r.json()) as KetQua;
  } catch {
    return loi("khong_goi_duoc_zalo", 502);
  }
  const so84 = (kq.data?.number ?? "").replace(/\D/g, "");
  if (!/^84\d{9}$/.test(so84)) {
    console.error("[zalo-mini-app] doi ma sdt that bai:", JSON.stringify(kq).slice(0, 200));
    return loi("zalo_tu_choi", 502);
  }
  const sdt = `0${so84.slice(2)}`; // 0905123456 — cùng dạng web lưu ở profiles.phone
  const emailKt = `sdt_${sdt}@users.coastalland.vn`; // email kỹ thuật (thongBao bỏ qua đuôi này)

  // ── 2. Tìm tài khoản theo số (web lưu 0…, Supabase lưu 84…) — chưa có thì tạo ──
  const { data: hs } = await admin
    .from("profiles")
    .select("id,email")
    .or(`phone.eq.${sdt},phone.eq.${so84},phone.eq.+${so84}`)
    .limit(1);
  let userId = hs?.[0]?.id as string | undefined;
  let email = (hs?.[0]?.email as string | null) ?? null;

  if (!userId) {
    const { data: moi, error } = await admin.auth.admin.createUser({
      email: emailKt,
      email_confirm: true,
      phone: so84,
      phone_confirm: true,
      user_metadata: { full_name: (ten ?? "").trim() || null, phone: sdt, provider: "zalo-mini-app" },
    });
    if (error || !moi.user) {
      // Số đã có trong Supabase Auth mà hồ sơ chưa ghi số → không dò được tài khoản; để khách dùng OTP.
      console.error("[zalo-mini-app] tao tai khoan that bai:", error?.message);
      return loi("khong_tao_duoc_tai_khoan", 409);
    }
    userId = moi.user.id;
    email = emailKt;
  }
  // Số do Zalo xác thực → đúng là của khách: ghi số + đánh dấu đã xác minh (khách tự nhận tin cũ theo số).
  await admin.from("profiles").update({ phone: sdt, phone_verified: true }).eq("id", userId);

  // Tài khoản chỉ có số (không email) → gắn email kỹ thuật để mở được phiên bằng liên kết một lần.
  if (!email) {
    const { error } = await admin.auth.admin.updateUserById(userId, { email: emailKt, email_confirm: true });
    if (error) return loi("khong_mo_duoc_phien", 500);
    email = emailKt;
  }

  // ── 3. Mở phiên: sinh liên kết một lần rồi tự đổi thành phiên, trả cho Mini App ──
  const { data: link, error: loiLink } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hash = link?.properties?.hashed_token;
  if (loiLink || !hash) return loi("khong_mo_duoc_phien", 500);
  const sb = taoClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  let { data: phien, error: loiPhien } = await sb.auth.verifyOtp({ type: "email", token_hash: hash });
  if (loiPhien) ({ data: phien, error: loiPhien } = await sb.auth.verifyOtp({ type: "magiclink", token_hash: hash }));
  if (loiPhien || !phien.session) return loi("khong_mo_duoc_phien", 500);

  // Tin Coastal Land đăng hộ mang số này tự về tài khoản (chung quy tắc web, 28/09/2026).
  await sb.rpc("tu_nhan_tin_theo_sdt").then(() => {}, () => {});

  return NextResponse.json({
    ok: true,
    access_token: phien.session.access_token,
    refresh_token: phien.session.refresh_token,
  });
}
