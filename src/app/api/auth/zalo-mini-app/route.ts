import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hoiZaloMe, taiKhoanTheoZalo, type ZaloMe } from "@/lib/taiKhoanZalo";
import { moPhienTaiKhoan } from "@/lib/gopTaiKhoan";

// ============================================================================
// ĐĂNG NHẬP BẰNG ZALO TỪ ZALO MINI APP — cùng tài khoản, cùng luật với nút Zalo trên web (chủ dự án 06/11/2026: Mini App
// phải tận dụng nền tảng Zalo, đăng nhập bằng Zalo, lấy thông tin đầy đủ theo quy định của Zalo).
// ----------------------------------------------------------------------------
// Mini App gửi accessToken (getAccessToken, sau khi khách đồng ý chia sẻ tên + ảnh — scope.userInfo). Máy chủ hỏi Zalo
// id + tên + ảnh (graph.zalo.me/v2.0/me, qua trạm VN) → tìm / tạo tài khoản theo mã Zalo (lib/taiKhoanZalo — đúng luật web
// callback: gộp, khoá đời cũ, tên + ảnh Zalo) → trả phiên để Mini App setSession.
// KHÔNG lấy số ở đây (trước 06/11 bắt buộc số + quyền SĐT): khách đăng nhập bằng Zalo là vào; số chỉ bắt buộc khi đăng tin,
// xác minh bằng mã tới chính số đó (/api/xac-thuc/xac-minh-sdt) — luật tài khoản 06/11.
// Khoá bí mật dùng chung Zalo App 114204740698790237 (ZALO_APP_SECRET).
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
  const { accessToken } = (await req.json().catch(() => ({}))) as { accessToken?: string };
  if (!accessToken) return loi("thieu_token");
  const admin = createAdminClient();
  if (!admin) return loi("chua_cau_hinh", 503);

  let me: ZaloMe;
  try {
    me = await hoiZaloMe(accessToken);
    if (!me.id) me = await hoiZaloMe(accessToken, "id"); // chưa được cấp tên + ảnh thì vẫn vào bằng mã Zalo (như web)
  } catch {
    return loi("khong_goi_duoc_zalo", 502);
  }
  if (!me.id) {
    console.error("[zalo-mini-app] khong lay duoc ma Zalo:", JSON.stringify(me).slice(0, 200));
    return loi("zalo_tu_choi", 502);
  }

  const tk = await taiKhoanTheoZalo(admin, { ...me, id: me.id });
  if (!tk) return loi("khong_tao_duoc_tai_khoan", 500);
  const phien = await moPhienTaiKhoan(admin, tk.uid, tk.email);
  if (!phien) return loi("khong_mo_duoc_phien", 500);

  return NextResponse.json({ ok: true, access_token: phien.access_token, refresh_token: phien.refresh_token });
}
