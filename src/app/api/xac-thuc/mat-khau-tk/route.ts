import { NextResponse } from "next/server";
import { createClient as taoClient, type User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// ĐỔI MẬT KHẨU KHI ĐÃ ĐĂNG NHẬP — CHUẨN THẾ GIỚI (chủ dự án 05/11/2026: "khách đăng nhập vào mà đổi thì chuẩn là gì"):
//   · Tài khoản vào bằng SỐ / EMAIL (có mật khẩu Coastal Land): mật khẩu hiện tại + mật khẩu mới → đổi xong đăng xuất các máy khác.
//   · Tài khoản vào bằng GMAIL · ZALO · FACEBOOK: KHÔNG có mật khẩu ở Coastal Land — mật khẩu do Google / Zalo / Facebook quản lý,
//     không đổi ở đây (không có "Tạo mật khẩu").
//   GET  (Bearer)                        → { mxh: "google" | "facebook" | "zalo" | null }
//   POST (Bearer) { matKhauCu, matKhauMoi }
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loi = (thongBao: string, status = 400) => NextResponse.json({ ok: false, loi: thongBao }, { status });

// Tài khoản mạng xã hội = vào bằng Zalo (email kỹ thuật zalo_…) hoặc chỉ có cửa Google / Facebook, không có cửa email / số
function mangXaHoi(u: User): "google" | "facebook" | "zalo" | null {
  // Khách đã tự đặt mật khẩu qua Quên mật khẩu (vd tài khoản Gmail / Zalo) → có mật khẩu Coastal Land, được đổi như thường
  if ((u.user_metadata as Record<string, unknown> | undefined)?.co_mat_khau === true) return null;
  if (/^zalo_.+@users\.coastalland\.vn$/i.test(u.email ?? "")) return "zalo";
  const cua = (u.identities ?? []).map((i) => i.provider);
  if (cua.some((p) => p === "email" || p === "phone")) return null;
  if (cua.includes("google")) return "google";
  if (cua.includes("facebook")) return "facebook";
  return null;
}

async function nguoiDung(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createAdminClient();
  if (!admin || !token) return null;
  const { data } = await admin.auth.getUser(token);
  if (!data?.user) return null;
  return { admin, token, user: data.user, mxh: mangXaHoi(data.user) };
}

export async function GET(req: Request) {
  const nd = await nguoiDung(req);
  if (!nd) return loi("Vui lòng đăng nhập lại.", 401);
  return NextResponse.json({ ok: true, mxh: nd.mxh });
}

export async function POST(req: Request) {
  const nd = await nguoiDung(req);
  if (!nd) return loi("Vui lòng đăng nhập lại.", 401);
  if (nd.mxh) return loi("Tài khoản này không dùng mật khẩu Coastal Land.");
  const b = (await req.json().catch(() => ({}))) as { matKhauCu?: string; matKhauMoi?: string };
  const moi = b.matKhauMoi ?? "";
  if (!b.matKhauCu) return loi("Nhập mật khẩu hiện tại.");
  if (moi.length < 6) return loi("Mật khẩu mới cần ít nhất 6 ký tự.");

  // Kiểm mật khẩu hiện tại bằng email của tài khoản (email thật hoặc email kỹ thuật) — không có email thì bằng số
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return loi("Hệ thống chưa sẵn sàng.", 503);
  const sb = taoClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: sai } = nd.user.email
    ? await sb.auth.signInWithPassword({ email: nd.user.email, password: b.matKhauCu })
    : await sb.auth.signInWithPassword({ phone: `+${(nd.user.phone ?? "").replace(/^\+/, "")}`, password: b.matKhauCu });
  if (sai) return loi("Mật khẩu hiện tại chưa đúng.");

  const { error } = await nd.admin.auth.admin.updateUserById(nd.user.id, { password: moi });
  if (error) return loi("Chưa đổi được mật khẩu. Vui lòng thử lại.", 500);
  // Chuẩn: đổi mật khẩu → các máy khác đang đăng nhập bị đăng xuất; máy đang dùng giữ nguyên
  await nd.admin.auth.admin.signOut(nd.token, "others").catch(() => {});
  return NextResponse.json({ ok: true });
}
