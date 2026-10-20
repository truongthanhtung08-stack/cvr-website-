import { NextResponse } from "next/server";
import { getListings } from "@/lib/listingsDb";
import { getProjects } from "@/lib/contentDb";
import { dungDsDuAn } from "@/lib/duAnTenMayChu";
import { goiYThat } from "@/lib/goiYThat";

// ============================================================================
// GET /api/goi-y/that?q=<câu khách gõ>&md=ban|thue — GỢI Ý THEO DỮ LIỆU THẬT cho mọi ô tìm (21/10/2026, lib/goiYThat).
// Chi phí (tính trước khi làm, CLAUDE.md 0C1): ô tìm chỉ gọi khi khách NGỪNG GÕ ~0,3 giây, không gọi mỗi phím; cùng câu thì
// CDN trả lại bản đệm (s-maxage 1 giờ) — tin đọc từ bộ nhớ đệm "listings", không đọc Supabase mỗi lần. Mỗi lần chạy vài
// chục ms CPU; vài nghìn lượt/tháng vẫn nằm gọn trong gói Vercel Pro.
// ============================================================================
export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").trim().slice(0, 160);
  const md = u.searchParams.get("md") === "thue" ? "thue" : "ban";
  if (q.length < 2) return NextResponse.json([]);
  const [tin, duAn] = await Promise.all([getListings(), getProjects()]);
  const ds = goiYThat(q, md, tin, dungDsDuAn(tin, duAn));
  return NextResponse.json(ds, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
