import { NextResponse } from "next/server";
import { suggest, popularSuggestions, type Suggestion } from "@/lib/suggest";
import { goiYNoiLong } from "@/lib/smartSearch";

// ============================================================================
// GET /api/goi-y?q=<chữ khách gõ>&md=ban|thue|duan — GỢI Ý TÌM KIẾM DÙNG CHUNG
// Zalo Mini App gọi để ô tìm kiếm CHUẨN NHƯ WEB (chủ dự án yêu cầu 28/09/2026):
// cùng bộ gợi ý, cùng thứ tự với panel gợi ý của FilterBar trên web:
//   chưa gõ  → Gợi ý phổ biến
//   đã gõ    → "Tìm “…”" · bậc thang (khớp đủ → nới dần) · khu vực/loại hình/dự án/tin khớp
// ============================================================================
export const dynamic = "force-dynamic";

function choPhep(req: Request): Record<string, string> {
  const nguon = req.headers.get("origin") ?? "";
  const hopLe = /^https:\/\/([a-z0-9-]+\.)*(zdn\.vn|zalo\.me|zaloapp\.com|zaloplatforms\.com)$/i.test(nguon) || /^http:\/\/(localhost|192\.168\.\d+\.\d+):\d+$/.test(nguon);
  return hopLe ? { "Access-Control-Allow-Origin": nguon, Vary: "Origin" } : {};
}

const HREF_MUC_DICH: Record<string, string> = { "/mua-ban": "ban", "/cho-thue": "thue", "/du-an": "duan" };

export function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").trim().slice(0, 120);
  const md = u.searchParams.get("md") ?? "ban";
  // Gợi ý "Mục đích" khác tab đang chọn thì bỏ (tab Cho thuê không mời "Nhà đất bán").
  const dungTab = (s: Suggestion) => s.kind !== "Mục đích" || HREF_MUC_DICH[s.href ?? ""] === md;

  let ds: Suggestion[];
  if (!q) ds = popularSuggestions.filter(dungTab);
  else {
    const khop = suggest(q, 12).filter(dungTab).slice(0, 6);
    ds = [
      { label: `Tìm “${q}”`, kind: "Gợi ý", sub: "Dò trong tiêu đề, mô tả và địa chỉ của tin", keyword: q },
      ...goiYNoiLong(q).map((g) => ({ label: g.label, kind: "Gợi ý" as const, sub: g.sub, patch: g.patch })),
      ...(khop.length ? khop : popularSuggestions.filter(dungTab)),
    ];
  }
  return NextResponse.json({ ok: true, goiY: ds }, { headers: choPhep(req) });
}
