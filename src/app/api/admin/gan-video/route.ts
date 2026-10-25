import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { docVideoKenh, viecGanVideo } from "@/lib/videoKenh";

// GẮN VIDEO TỪ KÊNH YOUTUBE (chủ dự án 25/10/2026) — chỉ chạy khi admin bấm nút ở Admin → Tin đăng.
// Có tin được gắn thì mới xoá cache "listings" (không gắn gì thì không đụng cache — không tốn ISR).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, loi: "Chưa đăng nhập." }, { status: 401 });
  const { data: me } = await ssr.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ ok: false, loi: "Chỉ quản trị viên." }, { status: 403 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ ok: false, loi: "Máy chủ chưa cấu hình đủ." }, { status: 500 });

  const video = await docVideoKenh();
  if (!video.length) return NextResponse.json({ ok: false, loi: "Không đọc được kênh YouTube, thử lại sau ít phút." });
  const { data: tins, error } = await db.from("listings").select("id, title, created_at, images, details").not("details->>maAnh", "is", null).limit(5000);
  if (error) return NextResponse.json({ ok: false, loi: error.message });

  const daGan: { ma: string; title: string }[] = [];
  for (const { t, ma, images } of viecGanVideo(video, tins ?? [])) {
    const { error: e } = await db.from("listings").update({ images }).eq("id", t.id);
    if (e) return NextResponse.json({ ok: false, loi: `Gắn được ${daGan.length} tin thì lỗi: ${e.message}`, daGan });
    daGan.push({ ma, title: t.title ?? "" });
  }
  if (daGan.length) revalidateTag("listings", "max");
  return NextResponse.json({ ok: true, daGan });
}
