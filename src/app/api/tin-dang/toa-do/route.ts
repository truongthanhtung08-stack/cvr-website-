import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProjects } from "@/lib/contentDb";
import { timToaDo } from "@/lib/timToaDo";
import { chuoiDiaChiBanDo, vanTayDiaChi, KHOA_TOA_DO, type ToaDoLuu } from "@/lib/diaChiBanDo";

// ============================================================================
// TRA SẴN TOẠ ĐỘ MỖI TIN / DỰ ÁN cho bản đồ nhiều tin (Mua bán · Cho thuê · Dự án → Bản đồ) — xem src/lib/diaChiBanDo.ts.
// Cùng hàm timToaDo với bản đồ trang tin → nhãn giá trên bản đồ nhiều tin nằm đúng chỗ dấu đỏ ở trang tin.
//
// CHI PHÍ (CLAUDE.md 0C1, tính 23/10/2026): cron mỗi giờ = 720 lần/tháng.
//   · Không có tin mới / không ai sửa địa chỉ: 3 lượt đọc Supabase, < 1 giây, không gọi OpenStreetMap, không ghi gì.
//   · Có tin mới: mỗi tin 1–4 lượt OpenStreetMap (miễn phí, giãn 1,1 giây/lượt), ghi MỘT dòng site_content cuối lượt.
//   · Lần đầu (~160 tin + dự án): tra dần trong vài lượt chạy, mỗi lượt tối đa 4 phút.
// Không ghi bảng listings, không xoá bộ nhớ đệm trang → không làm trang dựng lại. Nằm trong gói Vercel $20 + Supabase Pro.
// ============================================================================

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const NGAN_SACH_MS = 240_000;
const tron = (x: number) => Math.round(x * 1e6) / 1e6;

type TinDong = { id: string; ward: string | null; district: string | null; province: string | null; soDuong: string | null; ghim: string | null };

export async function GET(request: Request) {
  const khoaCron = process.env.CRON_SECRET;
  if (khoaCron && request.headers.get("authorization") !== `Bearer ${khoaCron}`) {
    return NextResponse.json({ ok: false, loi: "Không có quyền" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, loi: "Thiếu khoá máy chủ" }, { status: 500 });
  const batDau = Date.now();

  const [{ data: tin, error }, { data: luu }, duAn] = await Promise.all([
    admin
      .from("listings")
      .select("id,ward,district,province,soDuong:details->>addressDetail,ghim:details->>mapPin")
      .eq("status", "approved")
      .limit(10000),
    admin.from("site_content").select("data").eq("key", KHOA_TOA_DO).limit(1),
    getProjects().catch(() => []),
  ]);
  if (error) return NextResponse.json({ ok: false, loi: error.message }, { status: 500 });

  const cu: ToaDoLuu["ds"] = (luu?.[0]?.data as ToaDoLuu | undefined)?.ds ?? {};
  // Việc cần có toạ độ: tin chưa ghim tay (ghim tay thì bản đồ dùng thẳng điểm ghim) + dự án.
  const viec: [string, string][] = [];
  for (const t of (tin ?? []) as TinDong[]) {
    if (t.ghim?.trim()) continue;
    const q = chuoiDiaChiBanDo(t.soDuong, t.ward, t.district, t.province);
    if (q) viec.push([`tin:${t.id}`, q]);
  }
  for (const p of duAn) if (p.location && p.location !== "Đang cập nhật") viec.push([`du-an:${p.slug}`, p.location]);

  const moi: ToaDoLuu["ds"] = {};
  let traMoi = 0;
  let conLai = 0;
  for (const [ma, q] of viec) {
    const vt = vanTayDiaChi(q);
    if (cu[ma]?.[3] === vt) {
      moi[ma] = cu[ma];
      continue;
    }
    if (Date.now() - batDau > NGAN_SACH_MS) {
      conLai++; // lượt sau tra tiếp
      continue;
    }
    const kq = await timToaDo(q);
    if (kq) {
      moi[ma] = [tron(kq.lat), tron(kq.lng), kq.mucDo, vt];
      traMoi++;
    }
  }

  // Chỉ ghi khi có đổi (tin mới tra được, hoặc tin đã hết hiển thị bị bỏ khỏi danh sách).
  const doi = traMoi > 0 || Object.keys(cu).some((k) => !(k in moi));
  if (doi) {
    const { error: loiGhi } = await admin
      .from("site_content")
      .upsert({ key: KHOA_TOA_DO, data: { ds: moi, luc: new Date().toISOString() } satisfies ToaDoLuu });
    if (loiGhi) return NextResponse.json({ ok: false, loi: loiGhi.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, tong: viec.length, traMoi, conLai, daGhi: doi, giay: Math.round((Date.now() - batDau) / 1000) });
}
