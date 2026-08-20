import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  COOKIE_NEXT,
  COOKIE_STATE,
  COOKIE_VERIFIER,
  ZALO_ME_URL,
  ZALO_TOKEN_URL,
  emailKyThuat,
  zaloConfig,
} from "@/lib/zalo";

// BƯỚC 2 của đăng nhập Zalo — đường dẫn này khai trong Zalo Developers:
//   https://coastalland.vn/auth/zalo/callback
//
// Việc phải làm:
//   1. Đối chiếu state (chống giả mạo) rồi đổi code lấy access_token của Zalo
//   2. Hỏi Zalo tên + ảnh đại diện của khách
//   3. Tạo (hoặc tìm lại) tài khoản Supabase tương ứng, rồi mở phiên đăng nhập
//
// Zalo KHÔNG trả email, nên mỗi khách được gán một email kỹ thuật theo ID Zalo.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const loi = (ma: string) => NextResponse.redirect(`${origin}/dang-nhap?error=${ma}`);

  const { appId, secret, serviceKey, daCauHinh } = zaloConfig();
  if (!daCauHinh || !appId || !secret || !serviceKey) return loi("zalo_chua_cau_hinh");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code) return loi("zalo_thieu_ma");

  // Lấy lại 3 cookie đã cất ở bước 1
  const cookieHeader = request.headers.get("cookie") ?? "";
  const doc = (ten: string) =>
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${ten}=`))
      ?.slice(ten.length + 1);

  const verifier = doc(COOKIE_VERIFIER);
  const stateLuu = doc(COOKIE_STATE);
  const next = decodeURIComponent(doc(COOKIE_NEXT) ?? "/tai-khoan");
  if (!verifier || !stateLuu || stateLuu !== state) return loi("zalo_sai_phien");

  try {
    // ── 1. Đổi code lấy access_token ────────────────────────────────────────
    const tokenRes = await fetch(ZALO_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        secret_key: secret,
      },
      body: new URLSearchParams({
        code,
        app_id: appId,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      cache: "no-store",
    });
    const token = (await tokenRes.json()) as { access_token?: string; error?: number };
    if (!token.access_token) return loi("zalo_doi_ma_that_bai");

    // ── 2. Hỏi Zalo thông tin khách ─────────────────────────────────────────
    // App Zalo mới tạo thường CHƯA được cấp quyền đọc tên + ảnh (phải đăng ký ở
    // mục "Đăng ký sử dụng API"), nhưng ID thì luôn có. Nên: xin đủ trước, hỏng
    // thì lùi về xin mỗi ID — đủ để đăng nhập, tên/ảnh bổ sung sau cũng được.
    type ZaloMe = { id?: string; name?: string; picture?: { data?: { url?: string } } };
    // Tài liệu Zalo có 2 kiểu gửi mã truy cập: qua HEADER hoặc qua THAM SỐ URL,
    // tuỳ phiên bản. Gửi cả hai cho chắc — thừa một chỗ không sao, thiếu là hỏng.
    const hoiZalo = async (fields: string): Promise<ZaloMe> => {
      const u = new URL(ZALO_ME_URL);
      u.searchParams.set("fields", fields);
      u.searchParams.set("access_token", token.access_token!);
      const r = await fetch(u.toString(), {
        headers: { access_token: token.access_token! },
        cache: "no-store",
      });
      return (await r.json()) as ZaloMe;
    };

    let me = await hoiZalo("id,name,picture");
    if (!me.id) {
      console.error("[zalo] xin id,name,picture that bai:", JSON.stringify(me));
      me = await hoiZalo("id"); // lùi về mức tối thiểu
    }
    if (!me.id) {
      console.error("[zalo] xin moi id cung that bai:", JSON.stringify(me));
      // TẠM THỜI: đưa nguyên câu trả lời của Zalo ra màn hình để dò lỗi.
      // Gỡ đoạn ?chi_tiet= này khi đăng nhập Zalo đã chạy ổn định.
      const chiTiet = encodeURIComponent(JSON.stringify(me).slice(0, 160));
      return NextResponse.redirect(
        `${origin}/dang-nhap?error=zalo_khong_lay_duoc_thong_tin&chi_tiet=${chiTiet}`,
      );
    }

    const email = emailKyThuat(me.id);
    const hoTen = me.name?.trim() || "Người dùng Zalo";
    const anh = me.picture?.data?.url ?? null;

    // ── 3. Tạo/tìm tài khoản Supabase rồi mở phiên ──────────────────────────
    const { createClient: createAdmin } = await import("@supabase/supabase-js");
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Chưa có thì tạo; đã có thì bỏ qua lỗi trùng email.
    const { error: loiTao } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: hoTen, avatar_url: anh, provider: "zalo", zalo_id: me.id },
    });
    if (loiTao && !/already/i.test(loiTao.message)) return loi("zalo_tao_tai_khoan_that_bai");

    // Sinh liên kết đăng nhập một lần rồi tự đổi thành phiên (cookie) ngay tại đây
    const { data: link, error: loiLink } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const hash = link?.properties?.hashed_token;
    if (loiLink || !hash) return loi("zalo_tao_phien_that_bai");

    // Supabase đổi tên loại mã theo phiên bản: bản mới dùng "email", bản cũ dùng
    // "magiclink". Thử lần lượt cả hai để không phụ thuộc phiên bản.
    const supabase = await createClient();
    let loiXacThuc = (await supabase.auth.verifyOtp({ type: "email", token_hash: hash })).error;
    if (loiXacThuc) {
      console.error("[zalo] verifyOtp type=email that bai:", loiXacThuc.message);
      loiXacThuc = (await supabase.auth.verifyOtp({ type: "magiclink", token_hash: hash })).error;
    }
    if (loiXacThuc) {
      console.error("[zalo] verifyOtp type=magiclink cung that bai:", loiXacThuc.message);
      return loi("zalo_mo_phien_that_bai");
    }

    // Về đúng nơi theo vai trò (giống luồng Google)
    let dest = next;
    if (dest === "/tai-khoan") {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase.from("profiles").select("role").eq("id", user.id).single()
        : { data: null };
      if (profile?.role === "admin") dest = "/admin";
    }

    const res = NextResponse.redirect(`${origin}${dest}`);
    // Dọn cookie tạm
    for (const c of [COOKIE_VERIFIER, COOKIE_STATE, COOKIE_NEXT]) {
      res.cookies.set(c, "", { path: "/", maxAge: 0 });
    }
    return res;
  } catch {
    return loi("zalo_loi_ket_noi");
  }
}
