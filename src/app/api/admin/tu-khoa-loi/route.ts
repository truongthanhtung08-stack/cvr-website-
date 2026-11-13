import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { docBangTuKhoaLoi, docThuongHieu, type DongKeHoach } from "@/lib/tuKhoaLoiDoc";
import { getListings, getListingsHetHan } from "@/lib/listingsDb";
import { tatCaTrang, tieuDe, lienKetCho, NGUONG_INDEX } from "@/lib/pseo";
import { docSoXinIndex, trangThaiIndex, type TrangThaiIndex } from "@/lib/xinIndex";

// ============================================================================
// TỪ KHOÁ LÕI — API CHỈ DÀNH CHO ADMIN (anh 09/11/2026: "chỉnh bảng – lưu – tải lên là web tự cập nhật")
//   GET                    → bản đang chạy trên web (site_content "tu_khoa_loi")
//   POST multipart "tep"   → đọc HE-THONG-TU-KHOA.xlsx (sheet "Từ khoá lõi", cột "Lên web" = x) theo luật tuKhoaLoiDoc.ts
//                            → ghi site_content → làm mới trang (thẻ "noi-dung", "listings") → trả danh sách đổi / giữ
//                            + sheet "Thương hiệu" (nếu có) → thuongHieu: tên, 2 câu, định nghĩa, cách gõ, kênh, hỏi đáp (12/11/2026)
//   POST ?xemTruoc=1       → chỉ đọc tệp, trả danh sách đổi / giữ, KHÔNG ghi gì
// ============================================================================
export const dynamic = "force-dynamic";

const loi = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

async function chiAdmin() {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return { err: loi("Chưa đăng nhập", 401) };
  const { data: me } = await ssr.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return { err: loi("Chỉ quản trị viên", 403) };
  const admin = createAdminClient();
  if (!admin) return { err: loi("Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ.", 500) };
  return { admin };
}

// BẢNG THEO DÕI TRANG LÕI (anh 12/11/2026: "mở trang thấy rất lộn xộn — cái nào index rồi, chưa index, đủ thông tin, chưa đủ; tôi không
// theo dõi được"): mỗi trang lõi MỘT dòng — tầng tỉnh · loại hình + tỉnh · thành phố — số tin, đủ chuẩn index chưa (cùng cổng với
// sitemap), Đã index / Chưa index (+ ngày đã xin) — cùng luật với Admin → Xin index (src/lib/xinIndex.ts). Chỉ chạy khi anh mở trang này.
// + DÒNG ĐẶC ĐIỂM của bảng (13/11/2026): longtail → trang đích. Trang đã có trên web → số tin, đủ chuẩn, index lấy từ web (một luật
// với sitemap); chưa có trang → số tin trong bảng, trạng thái "Cần mở trang" / "Chưa đủ tin" như cột "Xin index" của bảng.
type DongTD = { trang: string; muc: "ban" | "thue"; tinh: string; tang: string; tuKhoa: string; soTin: number; duChuan: boolean; trongBang: boolean;
  longtail?: string; dacDiem?: string; nhom?: string; google?: number; coTrang?: boolean; ghiChu?: string; chon?: boolean; noiToi?: boolean; thieu?: string[] } & TrangThaiIndex;
async function theoDoi(admin: NonNullable<ReturnType<typeof createAdminClient>>, bang: Record<string, unknown>, keHoach: DongKeHoach[] = []) {
  const [con, het, so] = await Promise.all([getListings().catch(() => []), getListingsHetHan().catch(() => []), docSoXinIndex(admin)]);
  const tin = [...con, ...het]; // cùng bộ tin xét trang với sitemap (getTinXetTrang)
  const gSet = new Set(so.google?.ds ?? []);
  const dong = new Map<string, DongTD>();
  const moiTrang = tatCaTrang(tin);
  // LIÊN KẾT NỘI BỘ (anh 13/11/2026: "liên kết nội bộ chuẩn xác, ổn định"): trang nào được ít nhất một trang pSEO khác dẫn tới
  // bằng đúng khối liên kết đang vẽ trên web (lienKetChoDu). Trang tỉnh luôn có link từ chân trang + menu.
  const noiToi = new Set<string>();
  // = hợp của lienKetChoDu (khối theo tin còn hạn + phần thêm theo cả tin hết hạn). Chạy HAI lượt, mỗi lượt cùng một bộ tin để
  // tatCaTrang dùng lại bản tính sẵn (gọi xen kẽ hai bộ tin thì mỗi lần tính lại cả web — trước đo > 80 giây).
  const trangCon = [...tatCaTrang(con).values()];
  for (const p of trangCon) for (const g of lienKetCho(p.dk, con)) for (const l of g.links) if (l.href !== p.path) noiToi.add(l.href);
  for (const p of moiTrang.values()) for (const g of lienKetCho(p.dk, tin)) for (const l of g.links) if (l.href !== p.path) noiToi.add(l.href);
  tatCaTrang(tin); // để các bước dưới dùng bản tính sẵn của cả bộ tin
  // THIẾU GÌ — mỗi dòng một câu ngắn: chưa có trang / thiếu tin / chưa có link nội bộ / chưa xin index / đã xin, chờ Google
  const thieuCua = (d: DongTD): string[] => {
    const t: string[] = [];
    if (!d.trang) { t.push(d.soTin >= NGUONG_INDEX ? "Chưa có trang (đủ tin — cần mở)" : `Chưa có trang · thiếu ${Math.max(1, NGUONG_INDEX - d.soTin)} tin`); return t; }
    const tinh = d.trang.split("/").length <= 3; // trang tỉnh: luôn mở, không qua cổng pSEO
    if (!d.duChuan && !tinh) t.push(d.soTin < NGUONG_INDEX ? `Thiếu ${NGUONG_INDEX - d.soTin} tin` : "Trùng bộ tin với trang khác (Google chỉ cần một trang)");
    // khối liên kết chỉ dẫn tới trang đủ chuẩn → trang chưa đủ chuẩn không có link là đúng luật, chỉ báo khi trang đã đủ chuẩn
    if (!tinh && d.duChuan && !noiToi.has(d.trang)) t.push("Chưa có liên kết nội bộ trỏ tới");
    if (!d.daIndex) t.push(d.xin ? `Đã xin ${d.xin.split("-").reverse().slice(0, 2).join("/")}, chờ Google` : d.duChuan || tinh ? "Chưa xin index" : "Chưa index");
    return t;
  };
  for (const k of keHoach) {
    const duong = k.trang.replace(/\s*\(chưa có\)$/, "");
    const p = duong.startsWith("/") ? moiTrang.get(duong) : undefined;
    const khoa = `dd|${k.muc}|${k.longtail}`;
    if (dong.has(khoa)) continue;
    dong.set(khoa, { trang: p ? duong : "", muc: k.muc, tinh: k.noi, tang: "Đặc điểm", tuKhoa: k.loi, longtail: k.longtail, dacDiem: k.dacDiem, nhom: k.nhom, google: k.google,
      soTin: p ? p.n : k.soTin, duChuan: p ? p.index : false, trongBang: true, coTrang: !!p, ghiChu: p ? "" : k.xin, chon: !!k.chon, ...(p ? trangThaiIndex(duong, so, gSet) : { daIndex: false, xin: null }) });
  }
  for (const p of moiTrang.values()) {
    const d = p.dk;
    if (d.phuong || d.duong || d.huong || d.phapLy || d.kiet || d.phongNgu || d.giaDuoi) continue;
    if (d.thanhPho && d.cat) continue; // thành phố: chỉ tầng nhà đất
    const tang = d.thanhPho ? "Thành phố" : d.cat ? "Loại hình + tỉnh" : "Tỉnh";
    dong.set(p.path, { trang: p.path, muc: d.muc, tinh: d.tinh.name, tang, tuKhoa: tieuDe(d), soTin: p.n, duChuan: p.index, trongBang: p.path in bang, ...trangThaiIndex(p.path, so, gSet) });
  }
  for (const t of Object.keys(bang)) if (!dong.has(t)) {
    const muc = t.startsWith("/cho-thue") ? "thue" : "ban";
    dong.set(t, { trang: t, muc, tinh: "", tang: t.split("/").length > 3 ? "Loại hình + tỉnh" : "Tỉnh", tuKhoa: "", soTin: 0, duChuan: false, trongBang: true, ...trangThaiIndex(t, so, gSet) });
  }
  for (const d of dong.values()) { d.noiToi = !!d.trang && (d.trang.split("/").length <= 3 || noiToi.has(d.trang)); d.thieu = thieuCua(d); }
  return { nguong: NGUONG_INDEX, dong: [...dong.values()].sort((a, b) => a.muc.localeCompare(b.muc) || a.tinh.localeCompare(b.tinh) || a.tang.localeCompare(b.tang) || b.soTin - a.soTin) };
}

export async function GET() {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const { data } = await admin.from("site_content").select("data").eq("key", "tu_khoa_loi").limit(1);
  const hienTai = (data?.[0]?.data ?? null) as { trang?: Record<string, unknown>; keHoach?: DongKeHoach[] } | null;
  const { keHoach, ...gon } = hienTai ?? {};
  return NextResponse.json({ ok: true, hienTai: hienTai ? gon : null, theoDoi: await theoDoi(admin, hienTai?.trang ?? {}, keHoach ?? []) });
}

export async function POST(req: Request) {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const form = await req.formData().catch(() => null);
  const tep = form?.get("tep");
  if (!(tep instanceof File)) return loi("Chưa chọn tệp .xlsx");
  if (tep.size > 10 * 1024 * 1024) return loi("Tệp lớn hơn 10 MB");
  let kq;
  let th: ReturnType<typeof docThuongHieu>;
  try {
    const buf = Buffer.from(await tep.arrayBuffer());
    kq = docBangTuKhoaLoi(buf);
    th = docThuongHieu(buf);
  } catch (e) {
    return loi(e instanceof Error ? e.message : "Không đọc được tệp");
  }
  if (th.loi) return loi(th.loi);
  if (new URL(req.url).searchParams.get("xemTruoc")) return NextResponse.json({ ok: true, xemTruoc: true, ...kq, thuongHieu: th.thuongHieu });
  // Không có sheet Thương hiệu trong tệp → giữ bản thương hiệu đã nạp lần trước (không xoá mất)
  const { data: cu } = await admin.from("site_content").select("data").eq("key", "tu_khoa_loi").limit(1);
  const thuongHieu = th.thuongHieu ?? (cu?.[0]?.data as { thuongHieu?: unknown } | undefined)?.thuongHieu ?? null;
  const data = { trang: kq.trang, doi: kq.doi, giu: kq.giu, soDong: kq.soDong, keHoach: kq.keHoach, tenTep: tep.name, capNhat: new Date().toISOString(), thuongHieu };
  const { error } = await admin.from("site_content").upsert({ key: "tu_khoa_loi", data });
  if (error) return loi(`Không lưu được: ${error.message}`, 500);
  // Tiêu đề, H1, mô tả trang lõi + trang con đổi theo → làm mới trang đọc nội dung Admin + trang danh sách
  revalidateTag("noi-dung", "max");
  revalidateTag("listings", "max");
  return NextResponse.json({ ok: true, ...kq, thuongHieu });
}
