import { NextResponse } from "next/server";
import { getListings } from "@/lib/listingsDb";
import { getProjects } from "@/lib/contentDb";
import { dungDsDuAn } from "@/lib/duAnTenMayChu";
import { goiYThat } from "@/lib/goiYThat";
import { boTuGoTiep, diaDanhTuTin, goTiep } from "@/lib/goTiep";
import { gopGoiYTong } from "@/lib/goiYTong";
import { dongTraCuu } from "@/lib/traCuuDuAn";
import { normalizeVi } from "@/lib/filters";

// ============================================================================
// GET /api/goi-y/that?q=<câu khách gõ>&md=ban|thue — GỢI Ý THEO DỮ LIỆU THẬT cho mọi ô tìm (21/10/2026, lib/goiYThat).
// Chi phí (tính trước khi làm, CLAUDE.md 0C1): ô tìm chỉ gọi khi khách NGỪNG GÕ ~0,3 giây, không gọi mỗi phím; cùng câu thì
// CDN trả lại bản đệm (s-maxage 1 giờ) — tin đọc từ bộ nhớ đệm "listings", không đọc Supabase mỗi lần. Mỗi lần chạy vài
// chục ms CPU; vài nghìn lượt/tháng vẫn nằm gọn trong gói Vercel Pro.
// ============================================================================
// NGUỒN GỢI Ý DỰNG MỘT LẦN CHO MỖI BẢN DỮ LIỆU (chủ dự án 01/11/2026: "gợi ý ra nhanh hơn, đang chậm so với tốc độ gõ"): danh bạ dự án,
// bộ từ gõ tiếp nhớ theo đúng mảng tin / dự án của bộ nhớ đệm — tin đổi thật thì mảng mới, tự dựng lại; mỗi phím gõ không dựng lại.
type Tin = Awaited<ReturnType<typeof getListings>>;
type DuAn = Awaited<ReturnType<typeof getProjects>>;
const nhoNguon = new WeakMap<Tin, { duAn: DuAn; nguon: ReturnType<typeof dungNguon> }>();
function dungNguon(tin: Tin, duAn: DuAn) {
  // GÕ TIẾP KIỂU GOOGLE (01/11/2026): điền trọn chữ cuối đang gõ dở theo bộ từ của web + địa danh đang có tin, rồi mới dựng gợi ý
  // cho từng cách hiểu — chữ dở không bao giờ bị chép nguyên vào câu gợi ý
  const dsDuAn = dungDsDuAn(tin, duAn);
  // BỘ LỌC TỔNG ĐỦ 3 MỤC (chủ dự án duyệt 01/11/2026 — lib/goiYTong): tab đang đứng trước, 2 mục kia theo số kết quả thật
  const traCuu = dongTraCuu(tin, duAn);
  const dsLoc = traCuu.map((d) => ({ slug: d.slug, ten: d.ten, chuDauTu: d.chuDauTu, loaiHinh: d.loaiHinh, tinhTrang: d.tinhTrang, diaChiTim: `${d.diaChi} · ${d.diaChiCu} · ${d.tinh}`, tinh: d.tinh }));
  // Bộ từ gõ tiếp: cụm cố định + loại hình + địa danh đang có tin + TÊN DỰ ÁN, CHỦ ĐẦU TƯ thật (dự án nhiều tin trước) — gõ "sun" đoán ra dự án
  const tenDuAn = [...traCuu].sort((a, b) => b.ban + b.thue - (a.ban + a.thue)).flatMap((d) => [d.ten, d.chuDauTu].filter(Boolean));
  const boTu = boTuGoTiep([...diaDanhTuTin(tin.filter((l) => !l.banSao).map((l) => l.location)), ...tenDuAn]);
  return { dsDuAn, dsLoc, boTu };
}
function nguonGoiY(tin: Tin, duAn: DuAn) {
  const co = nhoNguon.get(tin);
  if (co && co.duAn === duAn) return co.nguon;
  const nguon = dungNguon(tin, duAn);
  nhoNguon.set(tin, { duAn, nguon });
  return nguon;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").trim().slice(0, 160);
  const mdGoc = u.searchParams.get("md");
  const tab = mdGoc === "thue" ? "thue" : mdGoc === "duan" ? "duan" : "ban";
  const md = tab === "thue" ? "thue" : "ban";
  if (q.length < 2) return NextResponse.json([]);
  const [tin, duAn] = await Promise.all([getListings(), getProjects()]);
  const { dsDuAn, dsLoc, boTu } = nguonGoiY(tin, duAn);
  const ds: ReturnType<typeof goiYThat> = [];
  const cacCau = goTiep(q, boTu);
  const laSo = /\d$/.test(q.trim());
  cacCau.forEach((cau, i) => {
    let them = 0;
    for (const d of gopGoiYTong(cau, tab, goiYThat(cau, md, tin, dsDuAn), tin, dsLoc)) {
      if (i > 0 && !laSo && them >= 1) break; // cách đoán thứ 2, 3: một dòng (dòng đầu của tab), không trộn cả nhóm
      if (!ds.some((x) => normalizeVi(x.nhan) === normalizeVi(d.nhan))) { ds.push(d); them++; }
    }
  });
  ds.splice(8);
  return NextResponse.json(ds, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
