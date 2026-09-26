import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guiThongBao, maTin, MAU_DA_NHAN_TIN } from "@/lib/thongBao";

// ============================================================================
// BÁO KHÁCH "ĐÃ NHẬN TIN, ĐANG CHỜ DUYỆT" (mẫu ZBS 641611)
// ----------------------------------------------------------------------------
// Tin do khách tự ghi thẳng vào bảng listings (web + Zalo Mini App), nên sau khi
// gửi xong, trang gọi địa chỉ này. Máy chủ KHÔNG tin lời trang: tự tìm các tin
// "chờ duyệt" của CHÍNH người gọi, tạo trong 15 phút qua, chưa báo lần nào —
// rồi báo từng tin và đánh dấu details.bao_da_nhan để gọi lại không báo trùng.
//
// Người gọi xác định bằng phiên đăng nhập: cookie (web) hoặc
// "Authorization: Bearer <access_token>" (Mini App — gọi chéo tên miền Zalo).
// ============================================================================
export const dynamic = "force-dynamic";

function choPhep(req: Request): Record<string, string> {
  const nguon = req.headers.get("origin") ?? "";
  const hopLe = /^https:\/\/([a-z0-9-]+\.)*(zdn\.vn|zalo\.me|zaloapp\.com|zaloplatforms\.com)$/i.test(nguon) || /^http:\/\/(localhost|192\.168\.\d+\.\d+):\d+$/.test(nguon);
  return hopLe
    ? { "Access-Control-Allow-Origin": nguon, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", Vary: "Origin" }
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

async function xuLy(req: Request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false }, { status: 500 });

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const nguoi = token
    ? (await admin.auth.getUser(token)).data.user
    : (await (await createClient()).auth.getUser()).data.user;
  if (!nguoi) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: ds } = await admin
    .from("listings")
    .select("id,title,details,created_at")
    .eq("owner_id", nguoi.id)
    .eq("status", "pending")
    .gt("created_at", new Date(Date.now() - 15 * 60_000).toISOString())
    .limit(5);
  const canBao = (ds ?? []).filter((t) => !(t.details as Record<string, unknown> | null)?.bao_da_nhan);
  if (!canBao.length) return NextResponse.json({ ok: true, daBao: 0 });

  const { data: hs } = await admin.from("profiles").select("email,phone,full_name").eq("id", nguoi.id).limit(1);
  const ho = hs?.[0] as { email: string | null; phone: string | null; full_name: string | null } | undefined;

  for (const tin of canBao) {
    // Đánh dấu TRƯỚC khi gửi: hai lần gọi sát nhau thì lần sau không gửi trùng.
    await admin
      .from("listings")
      .update({ details: { ...((tin.details as Record<string, unknown>) ?? {}), bao_da_nhan: true } })
      .eq("id", tin.id);
    const luc = new Date(tin.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
    await guiThongBao({
      email: ho?.email,
      phone: ho?.phone,
      tieuDe: "Coastal Land đã nhận tin đăng của bạn",
      loiNhan: "Tin đăng của bạn đã được gửi thành công và đang chờ kiểm duyệt. Chúng tôi sẽ báo kết quả ngay khi hoàn tất. Theo dõi tại coastalland.vn/tai-khoan/tin-dang.",
      cacDong: [
        { nhan: "Mã tin", giaTri: maTin(tin.id) },
        { nhan: "Tiêu đề tin", giaTri: tin.title },
        { nhan: "Thời gian gửi", giaTri: luc },
      ],
      znsTemplateId: MAU_DA_NHAN_TIN,
      znsData: { ten_khach_hang: ho?.full_name || "Quý khách", ma_tin: maTin(tin.id), ten_tin: tin.title, thoi_gian: luc },
    });
  }
  return NextResponse.json({ ok: true, daBao: canBao.length });
}
