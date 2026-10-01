import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { docVe } from "@/lib/veXemSo";

// ============================================================================
// POST /api/danh-gia — ĐÁNH GIÁ TIN (chủ dự án chốt 01/10/2026)
// Ai đọc tin cũng đánh giá được, KHÔNG cần bấm xem số người đăng. Chỉ cần xác định
// được người đánh giá (chống dìm tin):
//   · Đã đăng nhập  → header Authorization: Bearer <access_token>
//   · Chưa đăng nhập → { ve } — vé xác minh số (ký HMAC, cấp khi nhập đúng mã Zalo)
// Mỗi người 1 đánh giá / tin; đánh giá lại thì ghi đè.
// Body: { listingId, sao 1–5, sai?, khongGap?, daBan?, ve? }
// ============================================================================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loi = (thongBao: string, status = 400, them: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, loi: thongBao, ...them }, { status });

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as {
    listingId?: string; sao?: number; sai?: boolean; khongGap?: boolean; daBan?: boolean; ve?: string;
  };
  const listingId = (b.listingId ?? "").trim();
  const sao = Math.round(Number(b.sao));
  if (!listingId || !(sao >= 1 && sao <= 5)) return loi("Dữ liệu đánh giá chưa đúng.");

  const admin = createAdminClient();
  if (!admin) return loi("Hệ thống chưa sẵn sàng.", 503);

  // Ai đang đánh giá?
  let nguoiId: string | null = null;
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (token) {
    const { data } = await admin.auth.getUser(token);
    nguoiId = data?.user?.id ?? null;
  }
  const nguoiSdt = nguoiId ? null : docVe(b.ve);
  if (!nguoiId && !nguoiSdt) return loi("Xác minh số điện thoại để gửi đánh giá.", 401, { canXacMinh: true });

  const { data: tin } = await admin.from("listings").select("id,owner_id,status").eq("id", listingId).maybeSingle();
  if (!tin || tin.status !== "approved") return loi("Tin không còn hiển thị.", 404);
  if (nguoiId && tin.owner_id === nguoiId) return loi("Bạn không tự đánh giá tin của mình.", 403);

  // Mỗi người 1 đánh giá / tin: xoá cái cũ (nếu có) rồi ghi cái mới.
  const xoa = admin.from("danh_gia_tin").delete().eq("listing_id", listingId);
  await (nguoiId ? xoa.eq("nguoi_id", nguoiId) : xoa.is("nguoi_id", null).eq("nguoi_sdt", nguoiSdt!));
  const { error } = await admin.from("danh_gia_tin").insert({
    listing_id: listingId,
    nguoi_id: nguoiId,
    nguoi_sdt: nguoiSdt,
    sao,
    sai_thong_tin: !!b.sai,
    khong_lien_lac: !!b.khongGap,
    da_ban: !!b.daBan,
  });
  if (error) return loi("Chưa gửi được đánh giá. Vui lòng thử lại.", 500);
  return NextResponse.json({ ok: true });
}
