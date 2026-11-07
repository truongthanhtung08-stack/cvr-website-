import { NextResponse } from "next/server";
import { getListings } from "@/lib/listingsDb";
import { getProjects } from "@/lib/contentDb";
import { boTuGoTiep, coChuRac, diaDanhTuTin, goTiep, goiYGoTiep, goiYGoTiepDuAn, timDuAnTrongCau } from "@/lib/goTiep";
import { dongTraCuu } from "@/lib/traCuuDuAn";
import { docMucDich } from "@/lib/smartSearch";

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
  const traCuu = dongTraCuu(tin, duAn);
  const dsLoc = traCuu.map((d) => ({ slug: d.slug, ten: d.ten, chuDauTu: d.chuDauTu, loaiHinh: d.loaiHinh, tinhTrang: d.tinhTrang, diaChiTim: `${d.diaChi} · ${d.diaChiCu} · ${d.tinh}`, tinh: d.tinh }));
  // Bộ từ gõ tiếp: cụm cố định + loại hình + địa danh đang có tin + TÊN DỰ ÁN, CHỦ ĐẦU TƯ thật (dự án nhiều tin trước) — gõ "sun" đoán ra dự án
  const tenDuAn = [...traCuu].sort((a, b) => b.ban + b.thue - (a.ban + a.thue)).flatMap((d) => [d.ten, d.chuDauTu].filter(Boolean));
  const boTu = boTuGoTiep([...diaDanhTuTin(tin.filter((l) => !l.banSao).map((l) => l.location)), ...tenDuAn]);
  return { dsLoc, boTu };
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
  // TRANG CON ĐÃ CÓ MỤC ĐÍCH (chủ dự án 01/11/2026: "trang con đã có mục đích rồi, cần gì đến mục đích"): ô tìm trang Mua bán / Cho thuê
  // / Dự án bỏ qua chữ mục đích khách gõ (mua, bán, cho thuê, thuê, dự án), chỉ đọc loại hình + nơi chốn + nội dung, gợi ý ĐÚNG mục của
  // trang. Bộ lọc tổng (trang chủ) mới đọc mục đích.
  const trangCon = u.searchParams.get("tc") === "1";
  const mdGoc = u.searchParams.get("md");
  const qGoc = (u.searchParams.get("q") ?? "").trim().slice(0, 160);
  // Trang Cho thuê: giá "tỷ" là giá bán, không áp cho thuê — bỏ cụm giá đó, giữ loại hình · nơi · đặc điểm (01/11/2026)
  // Trang Mua bán: giá THEO THÁNG ("15 triệu một tháng") là giá thuê — bỏ cụm đó tương tự
  const boGiaTy = (s: string) => (mdGoc === "thue"
    ? s.replace(/(giá\s+)?(dưới|trên|khoảng|từ)?\s*\d+([.,]\d+)?\s*(tỷ|ty)(?=\s|$)/gi, " ")
    : mdGoc === "ban" ? s.replace(/(giá\s+)?(dưới|trên|khoảng|từ)?\s*\d+([.,]\d+)?\s*(triệu|tr)\s*(\/|một|1|mỗi)?\s*tháng/gi, " ") : s);
  const q = trangCon ? boGiaTy(qGoc).replace(/(^|\s)(cần\s+)?(mua|(?<!mở\s)bán(?!\s+giao)|cho\s+thuê|thuê|dự\s+án)(?=\s|$)/gi, " ").replace(/\s+/g, " ").trim() : qGoc;
  const tab = mdGoc === "thue" ? "thue" : mdGoc === "duan" ? "duan" : "ban";
  const md = tab === "thue" ? "thue" : "ban";
  if (q.length < 2) return NextResponse.json([]);
  // khoảng trắng cuối = khách đã gõ xong chữ (goTiep đọc dấu cách cuối)
  const qDoc = /\s$/.test(u.searchParams.get("q") ?? "") ? q + " " : q;
  const [tin, duAn] = await Promise.all([getListings(), getProjects()]);
  const { dsLoc, boTu } = nguonGoiY(tin, duAn);
  // gõ bậy (chữ không phải tiếng Việt, không có trong dữ liệu web) → không gợi ý gì (chủ dự án 01/11/2026)
  if (coChuRac(qDoc, tin, boTu)) return NextResponse.json([]);
  // GỢI Ý KIỂU GOOGLE ở cả 4 ô (lib/goTiep, 01/11/2026): giữ nguyên chữ khách gõ, điền tiếp theo dữ liệu thật / nội dung tin.
  const cache = { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } };
  const motChu = q.split(/\s+/).length <= 1;
  const hoan = goTiep(qDoc, boTu)[0] ?? q;
  // TRANG CON: đúng mục của trang
  //   chữ đang gõ dở thành chữ MỤC ĐÍCH ("cho" → cho thuê) ở trang con → bỏ, đợi khách gõ tiếp (trang con đã có mục)
  if (trangCon) return NextResponse.json((tab === "duan" ? goiYGoTiepDuAn(qDoc, dsLoc, boTu, motChu ? 4 : 6) : goiYGoTiep(qDoc, md, tin, boTu, motChu ? 4 : 6, dsLoc))
    // chỉ bỏ dòng có ĐÚNG CHỮ mục đích (mua / bán / thuê) — "10 triệu/tháng", "sang nhượng" vẫn là câu tìm của trang Cho thuê
    .filter((d) => d.href.startsWith("/du-an/") || !/(^|\s)(cần\s+)?(mua|(?<!mở\s)bán(?!\s+giao)|cho\s+thuê|thuê)(\s|$)/i.test(d.nhan)), cache); // "mở bán", "bàn giao" không phải chữ mục đích
  // TRANG TỔNG (chủ dự án 01/11/2026: "bấm vào từng tab, gợi ý — tìm ra kết quả tab đó"): gợi ý ĐÚNG TAB đang đứng; câu nói rõ
  // mục đích khác (bán/mua · thuê · "dự án" · giá tỷ/triệu) → gợi ý mục đó, tab tự chuyển theo (TimTrangChu.mucDichCau).
  // đang gõ dở chữ "dự" / "dự án" một mình → Dự án; còn lại hàm chung quyết ("mua căn hộ dự án X" là Mua bán)
  const noiDuAn = /^(dự|du)(\s+(án|an)?)?$/i.test(qGoc.normalize("NFC").trim());
  // MỘT HÀM ĐỌC MỤC ĐÍCH dùng chung với ô trang tổng (smartSearch.docMucDich) — gõ ra mục đích = bấm nút Mua bán · Cho thuê · Dự án
  // trên ô tìm (chủ dự án 01/11/2026); gõ tên dự án (kể cả gõ đầu tên) → Dự án
  const mucCau = noiDuAn ? "duan" : docMucDich(hoan, (nq) => !!timDuAnTrongCau(nq, dsLoc));
  const mucTim = mucCau ?? tab;
  // CÂU CHUNG CHUNG (không nói mua / bán / thuê / dự án) ở trang tổng, tab Mua bán hoặc Cho thuê → gợi ý CẢ HAI mục (anh 07/11/2026:
  // "ra cả 2"), mục có nhiều dòng khớp dữ liệu hơn đứng trước, xen kẽ từng dòng — không tự gán "bán"
  if (!mucCau && tab !== "duan") { // trang tổng: câu chung chung luôn ra cả hai mục (cơ chế chung)
    const ban = goiYGoTiep(qDoc, "ban", tin, boTu, 3, dsLoc);
    const thue = goiYGoTiep(qDoc, "thue", tin, boTu, 3, dsLoc);
    const [a, b] = thue.length > ban.length ? [thue, ban] : [ban, thue];
    const xen = Array.from({ length: Math.max(a.length, b.length) }, (_, i) => [a[i], b[i]]).flat().filter(Boolean);
    return NextResponse.json(xen.slice(0, 6), cache);
  }
  return NextResponse.json(mucTim === "duan" ? goiYGoTiepDuAn(qDoc, dsLoc, boTu, motChu ? 4 : 6) : goiYGoTiep(qDoc, mucTim, tin, boTu, motChu ? 4 : 6, dsLoc), cache);
}
