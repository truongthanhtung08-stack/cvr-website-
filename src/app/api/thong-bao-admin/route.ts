import { NextResponse } from "next/server";

// ============================================================================
// WEBHOOK SUPABASE "DÒNG MỚI" (Database → Webhooks) — KHÔNG GỬI EMAIL NỮA (chủ dự án 31/10/2026).
// ----------------------------------------------------------------------------
// Trước đây mỗi tin / dự án / yêu cầu khách mới gửi ngay một email ở đây, TRÙNG với email việc
// MỖI GIỜ (src/app/api/admin/bao-viec — đã gom đủ ba loại đó). Chủ dự án chốt: giữ email mỗi giờ,
// bỏ đường này. Route vẫn trả 200 để webhook bên Supabase không báo lỗi; tắt hẳn webhook trong
// Supabase → Database → Webhooks lúc nào cũng được.
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.CL_HOOK_SECRET;
  if (!secret || req.headers.get("x-cl-secret") !== secret) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  }
  return NextResponse.json({ boQua: "đã gộp vào email việc mỗi giờ" });
}
