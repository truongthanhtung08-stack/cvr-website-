import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";
import { timTaiKhoan } from "@/lib/taiKhoanTheoSdt";

// ============================================================================
// ADMIN TẠO TÀI KHOẢN HỘ KHÁCH (03/10/2026) — gắn profiles.tao_ho = true.
// Số khách để CHƯA XÁC NHẬN: chính chủ đăng ký / đăng nhập bằng mã Zalo gửi tới số đó là
// hệ thống tự gộp vào tài khoản này, xác nhận số và ghi "ngày chính thức vào" (0058) —
// chương trình thành viên mới tính từ ngày đó. Mật khẩu ngẫu nhiên, không ai biết;
// khách vào bằng mã Zalo hoặc "Quên mật khẩu".
// ============================================================================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Chưa đăng nhập.", 401);
  const { data: me } = await ssr.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return loi("Chỉ quản trị viên.", 403);

  const b = (await req.json().catch(() => ({}))) as { hoTen?: string; sdt?: string; email?: string };
  const hoTen = (b.hoTen ?? "").trim();
  const sdt = chuanHoaSdt(b.sdt ?? "");
  const email = (b.email ?? "").trim().toLowerCase();
  if (!hoTen) return loi("Chưa nhập họ tên.");
  if (!laSdtVN(sdt)) return loi("Số điện thoại chưa đúng.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return loi("Email chưa đúng.");

  const db = createAdminClient();
  if (!db) return loi("Máy chủ chưa cấu hình đủ.", 500);

  // Một số một tài khoản: số đã có tài khoản (đã xác nhận, hoặc đang ghi ở hồ sơ khác) thì không tạo thêm.
  if (await timTaiKhoan(db, sdt)) return loi("Số này đã có tài khoản.");
  const so84 = `84${sdt.slice(1)}`;
  const { data: trung } = await db.from("profiles").select("id").or(`phone.eq.${sdt},phone.eq.${so84},phone.eq.+${so84}`).limit(1);
  if (trung?.length) return loi("Số này đang ghi ở một tài khoản khác.");

  const { data, error } = await db.auth.admin.createUser({
    // Không có email thật → email nội bộ (không gửi thư tới địa chỉ này).
    email: email || `${sdt}@users.coastalland.vn`,
    email_confirm: true,
    password: randomBytes(18).toString("base64url"),
    user_metadata: { full_name: hoTen, phone: sdt },
  });
  if (error || !data.user) {
    return loi(/already|exists|duplicate/i.test(error?.message ?? "") ? "Email này đã có tài khoản." : "Không tạo được tài khoản.", 400);
  }
  await db.from("profiles").update({ full_name: hoTen, phone: sdt, tao_ho: true }).eq("id", data.user.id);
  return NextResponse.json({ ok: true, id: data.user.id });
}

function loi(message: string, status = 400) {
  return NextResponse.json({ ok: false, loi: message }, { status });
}
