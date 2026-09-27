import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";
import { timTaiKhoan, demTinDangHo } from "@/lib/taiKhoanTheoSdt";

// ============================================================================
// POST /api/xac-thuc/kiem-tai-khoan — { sdt? , email? }
// Màn ĐĂNG KÝ hỏi ngay khi khách gõ xong số / email (chủ dự án yêu cầu 27/09/2026):
//   · đã có tài khoản  → mời đăng nhập, không để khách tạo tài khoản thứ hai
//   · số chưa có tài khoản nhưng có TIN ĐĂNG HỘ → báo "đăng ký xong, tin tự về"
// Chỉ trả có/không + số tin — không trả tên, email hay bất kỳ thông tin nào khác.
// ============================================================================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { sdt?: string; email?: string };
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false });

  const email = (b.email ?? "").trim().toLowerCase();
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ ok: true, coTaiKhoan: false });
    const { data } = await admin.from("profiles").select("id").ilike("email", email.replace(/[%_\\]/g, "\\$&")).limit(1);
    return NextResponse.json({ ok: true, coTaiKhoan: !!data?.length });
  }

  const sdt = chuanHoaSdt(b.sdt ?? "");
  if (!laSdtVN(sdt)) return NextResponse.json({ ok: true, coTaiKhoan: false });
  const tim = await timTaiKhoan(admin, sdt);
  if (tim) return NextResponse.json({ ok: true, coTaiKhoan: true });
  return NextResponse.json({ ok: true, coTaiKhoan: false, soTin: await demTinDangHo(admin, sdt) });
}
