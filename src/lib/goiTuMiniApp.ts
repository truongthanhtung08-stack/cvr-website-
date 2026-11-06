import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// API DÙNG CHUNG WEB + ZALO MINI APP (06/11/2026) — cùng cách đã chạy ở /api/tin-dang/da-nhan.
// Người gọi: cookie (web) hoặc "Authorization: Bearer <access_token>" (Mini App gọi chéo tên miền Zalo).
// CORS chỉ mở cho tên miền Zalo + máy thử trong mạng nhà. Không đổi luật tiền / luật tin của route nào.
// ============================================================================

export function corsMiniApp(req: Request): Record<string, string> {
  const nguon = req.headers.get("origin") ?? "";
  const hopLe = /^https:\/\/([a-z0-9-]+\.)*(zdn\.vn|zalo\.me|zaloapp\.com|zaloplatforms\.com)$/i.test(nguon) || /^http:\/\/(localhost|192\.168\.\d+\.\d+):\d+$/.test(nguon);
  return hopLe
    ? { "Access-Control-Allow-Origin": nguon, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", Vary: "Origin" }
    : {};
}

export async function nguoiGoi(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (token) return (await createAdminClient()?.auth.getUser(token))?.data.user ?? null;
  return (await (await createClient()).auth.getUser()).data.user;
}

/** Bọc hàm xử lý POST: gắn CORS Mini App vào kết quả; kèm OPTIONS cho lượt hỏi trước của trình duyệt. */
export function postMiniApp(xuLy: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    const res = await xuLy(req);
    for (const [k, v] of Object.entries(corsMiniApp(req))) res.headers.set(k, v);
    return res;
  };
}
export const optionsMiniApp = (req: Request) => new NextResponse(null, { status: 204, headers: corsMiniApp(req) });
