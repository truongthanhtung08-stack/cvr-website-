import { NextResponse } from "next/server";
import { getChuyenGia, timChuyenGia } from "@/lib/chuyenGiaDb";
import { getListings } from "@/lib/listingsDb";
import { corsMiniApp } from "@/lib/goiTuMiniApp";

// ============================================================================
// DANH BẠ CHUYÊN GIA CHO ZALO MINI APP (06/11/2026) — cùng nguồn trang /chuyen-gia của web (src/lib/chuyenGiaDb.ts, gom từ tin thật).
// GET            → danh sách chuyên gia cá nhân (số ĐÃ CHE, không lộ số đầy đủ — cổng lead của chuyenGiaDb giữ nguyên).
// GET ?slug=…    → một chuyên gia + mã các tin của họ (Mini App tự đọc tin theo mã).
// Chi phí: dữ liệu đọc từ bộ nhớ đệm 1 giờ sẵn có (getChuyenGia / getListings); CDN giữ kết quả 1 giờ → vài lượt chạy hàm mỗi giờ.
// ============================================================================
const DEM = { "Cache-Control": "public, max-age=300", "CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };

export function OPTIONS(req: Request) {
  const h = corsMiniApp(req);
  if (h["Access-Control-Allow-Methods"]) h["Access-Control-Allow-Methods"] = "GET, OPTIONS";
  return new NextResponse(null, { status: 204, headers: h });
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  const ds = await getChuyenGia();
  const gon = ({ slug: s, ten, anh, soTin, khuVuc, loaiHinh, sdtChe }: (typeof ds)[number]) => ({ slug: s, ten, anh, soTin, khuVuc, loaiHinh, sdtChe });
  let body: unknown;
  if (slug) {
    const cg = timChuyenGia(ds, slug);
    if (!cg) return NextResponse.json({ ok: false }, { status: 404, headers: { ...corsMiniApp(req) } });
    const tin = (await getListings()).filter((t) => t.maNguoi === cg.maNguoi).map((t) => t.id);
    body = { ok: true, cg: gon(cg), tin };
  } else {
    body = { ok: true, ds: ds.filter((x) => !x.laCongTy).map(gon) };
  }
  return NextResponse.json(body, { headers: { ...DEM, ...corsMiniApp(req) } });
}
