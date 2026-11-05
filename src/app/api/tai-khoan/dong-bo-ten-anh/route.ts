import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// ĐỔI TÊN / ẢNH TÀI KHOẢN → TIN CỦA TÀI KHOẢN ĐỔI THEO (chủ dự án 05/11/2026: "tên tài khoản, ảnh đại diện của tài khoản — thể
// hiện ở phần tài khoản và cả phần hiển thị trên tin"). Tin chép tên + ảnh lúc đăng (details.contact) — trước đây đổi trong Cài đặt
// thì tin cũ vẫn hiện tên / ảnh cũ. Nay: tin nào đang hiện ĐÚNG tên / ảnh cũ của tài khoản thì thay bằng cái mới; tin khách tự ghi
// tên liên hệ khác thì GIỮ (quyền của khách).
// Chi phí: chỉ chạy khi khách tự đổi tên / ảnh (hiếm) — một lần đọc + ghi các tin của chính khách, một lần làm mới bộ nhớ đệm tin.
// POST (Bearer) { tenCu?, anhCu? } — giá trị MỚI đọc từ hồ sơ trên máy chủ.
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Tin = { id: string; details: { contact?: { name?: string; avatar?: string } } & Record<string, unknown> | null };

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createAdminClient();
  if (!admin || !token) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: u } = await admin.auth.getUser(token);
  const uid = u?.user?.id;
  if (!uid) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { tenCu?: string | null; anhCu?: string | null };
  const tenCu = (b.tenCu ?? "").trim();
  const anhCu = (b.anhCu ?? "").trim();
  if (!tenCu && !anhCu) return NextResponse.json({ ok: true, soTin: 0 });

  const { data: hs } = await admin.from("profiles").select("full_name,avatar_url").eq("id", uid).maybeSingle();
  const tenMoi = (hs?.full_name ?? "").trim();
  const anhMoi = (hs?.avatar_url ?? "").trim();

  const { data: ds } = await admin.from("listings").select("id,details").eq("owner_id", uid);
  let soTin = 0;
  for (const t of (ds ?? []) as Tin[]) {
    const lh = { ...(t.details?.contact ?? {}) };
    let doi = false;
    if (tenCu && tenMoi && tenMoi !== tenCu && (lh.name ?? "").trim() === tenCu) { lh.name = tenMoi; doi = true; }
    if (anhCu && anhMoi && anhMoi !== anhCu && (lh.avatar ?? "").trim() === anhCu) { lh.avatar = anhMoi; doi = true; }
    if (!doi) continue;
    const { error } = await admin.from("listings").update({ details: { ...(t.details ?? {}), contact: lh } }).eq("id", t.id);
    if (!error) soTin++;
  }
  if (soTin) revalidateTag("listings", "max"); // nội dung tin đổi thật → trang tin hiện tên / ảnh mới
  return NextResponse.json({ ok: true, soTin });
}
