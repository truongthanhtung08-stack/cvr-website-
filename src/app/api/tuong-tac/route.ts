import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guiThongBao, MAU_CO_NGUOI_QUAN_TAM } from "@/lib/thongBao";
import { chuanHoaSdt } from "@/lib/phone";

// ============================================================================
// THÍCH · BÌNH LUẬN TỪNG ẢNH / VIDEO CỦA TIN (chủ dự án 10/10/2026, bảng 0061).
//   GET  ?listingId=…   → số thích + bình luận theo từng ảnh, và ảnh nào mình đã thích
//   POST { listingId, anhSo, loai: "thich" | "bo_thich" | "binh_luan", noiDung? }
// Phải đăng nhập mới thích / bình luận. Có tương tác đầu tiên trong ngày → báo người đăng tin
// (tối đa 1 lần/ngày/tin, như "có người quan tâm" khi xem số).
// ============================================================================
export const dynamic = "force-dynamic";

type Dong = { anh_so: number; loai: string; noi_dung: string | null; created_at: string; user_id: string };

export async function GET(req: Request) {
  const listingId = new URL(req.url).searchParams.get("listingId") ?? "";
  const db = createAdminClient();
  if (!db || !listingId) return NextResponse.json({ ok: false }, { status: 400 });
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  const { data, error } = await db.from("tuong_tac_tin").select("anh_so, loai, noi_dung, created_at, user_id").eq("listing_id", listingId).order("created_at").limit(2000);
  if (error) return NextResponse.json({ ok: true, thich: {}, binhLuan: {}, cuaToi: [] }); // bảng chưa có (chưa chạy 0061)
  const ds = (data ?? []) as Dong[];
  const ids = [...new Set(ds.filter((d) => d.loai === "binh_luan").map((d) => d.user_id))];
  const { data: ten } = ids.length ? await db.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const tenCua = new Map((ten ?? []).map((p) => [p.id as string, (p.full_name as string) || "Thành viên"]));
  const thich: Record<number, number> = {};
  const binhLuan: Record<number, { ten: string; noiDung: string; luc: string }[]> = {};
  const cuaToi: number[] = [];
  for (const d of ds) {
    if (d.loai === "thich") {
      thich[d.anh_so] = (thich[d.anh_so] ?? 0) + 1;
      if (user && d.user_id === user.id) cuaToi.push(d.anh_so);
    } else {
      (binhLuan[d.anh_so] ??= []).push({ ten: tenCua.get(d.user_id) ?? "Thành viên", noiDung: d.noi_dung ?? "", luc: d.created_at });
    }
  }
  return NextResponse.json({ ok: true, thich, binhLuan, cuaToi });
}

export async function POST(req: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, canDangNhap: true, loi: "Đăng nhập để thích hoặc bình luận." }, { status: 401 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ ok: false, loi: "Máy chủ chưa cấu hình đủ." }, { status: 500 });
  const b = (await req.json().catch(() => ({}))) as { listingId?: string; anhSo?: number; loai?: string; noiDung?: string };
  const listingId = String(b.listingId ?? "");
  const anhSo = Number.isInteger(b.anhSo) ? Number(b.anhSo) : -1;
  if (!listingId) return NextResponse.json({ ok: false, loi: "Thiếu tin." }, { status: 400 });

  if (b.loai === "bo_thich") {
    await db.from("tuong_tac_tin").delete().eq("listing_id", listingId).eq("anh_so", anhSo).eq("user_id", user.id).eq("loai", "thich");
    return NextResponse.json({ ok: true });
  }
  if (b.loai === "thich") {
    const { error } = await db.from("tuong_tac_tin").insert({ listing_id: listingId, anh_so: anhSo, user_id: user.id, loai: "thich" });
    if (error && !/duplicate|unique/i.test(error.message)) return NextResponse.json({ ok: false, loi: "Chưa thích được, thử lại sau." }, { status: 500 });
  } else if (b.loai === "binh_luan") {
    const noiDung = (b.noiDung ?? "").trim().slice(0, 1000);
    if (!noiDung) return NextResponse.json({ ok: false, loi: "Chưa nhập bình luận." }, { status: 400 });
    const { error } = await db.from("tuong_tac_tin").insert({ listing_id: listingId, anh_so: anhSo, user_id: user.id, loai: "binh_luan", noi_dung: noiDung });
    if (error) return NextResponse.json({ ok: false, loi: "Chưa gửi được bình luận, thử lại sau." }, { status: 500 });
  } else {
    return NextResponse.json({ ok: false, loi: "Thao tác không hợp lệ." }, { status: 400 });
  }
  await baoNguoiDang(db, listingId, user.id).catch(() => {});
  return NextResponse.json({ ok: true });
}

// Báo người đăng: tương tác ĐẦU TIÊN của tin trong ngày (giờ VN), không báo khi chính chủ tự bấm.
async function baoNguoiDang(db: NonNullable<ReturnType<typeof createAdminClient>>, listingId: string, nguoiBam: string) {
  const { data: tin } = await db.from("listings").select("id,title,owner_id").eq("id", listingId).maybeSingle();
  if (!tin?.owner_id || tin.owner_id === nguoiBam) return;
  const dauNgayVN = new Date(new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10) + "T00:00:00+07:00").toISOString();
  const { count: homNay } = await db.from("tuong_tac_tin").select("id", { count: "exact", head: true }).eq("listing_id", listingId).neq("user_id", tin.owner_id).gte("created_at", dauNgayVN);
  if ((homNay ?? 0) !== 1) return;
  const { count: tong } = await db.from("tuong_tac_tin").select("id", { count: "exact", head: true }).eq("listing_id", listingId).neq("user_id", tin.owner_id);
  const { data: chu } = await db.from("profiles").select("email,phone,full_name").eq("id", tin.owner_id).maybeSingle();
  if (!chu) return;
  const luc = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
  await guiThongBao({
    email: chu.email,
    phone: chu.phone,
    tieuDe: "Tin đăng của bạn vừa có người quan tâm",
    loiNhan: "Một khách hàng vừa thích hoặc bình luận trên tin đăng của bạn. Xem chi tiết tại coastalland.vn/tai-khoan/khach-hang.",
    cacDong: [
      { nhan: "Tin đăng", giaTri: tin.title },
      { nhan: "Thời gian", giaTri: luc },
      { nhan: "Tổng lượt thích, bình luận", giaTri: String(tong ?? 1) },
    ],
    znsTemplateId: MAU_CO_NGUOI_QUAN_TAM,
    znsData: { ten_khach_hang: chu.full_name || "Quý khách", so_dien_thoai: chuanHoaSdt(chu.phone ?? ""), ten_tin: tin.title, thoi_gian: luc, so_luot: String(tong ?? 1) },
  });
}
