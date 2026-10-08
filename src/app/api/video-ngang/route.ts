import { NextResponse } from "next/server";

// ============================================================================
// GET /api/video-ngang?id=<mã YouTube> → { ngang: boolean }
// YouTube không cho biết video ngang hay dọc. Cách đo được (08/10/2026):
// youtube.com/shorts/<mã> trả 200 nếu là Shorts (video DỌC), 303 nếu là video
// thường (NGANG). Trình duyệt không tự hỏi được (chặn CORS) nên hỏi qua máy chủ.
// Dùng để: video YouTube ngang bấm toàn màn hình thì tự xoay ngang.
// ============================================================================
export const runtime = "nodejs";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[\w-]{6,20}$/.test(id)) return NextResponse.json({ ngang: false }, { status: 400 });
  try {
    const r = await fetch(`https://www.youtube.com/shorts/${id}`, { method: "HEAD", redirect: "manual", next: { revalidate: 86400 } });
    return NextResponse.json(
      { ngang: r.status !== 200 },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch {
    return NextResponse.json({ ngang: false });
  }
}
