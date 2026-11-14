import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { docSheet } from "@/lib/tuKhoaLoiDoc";
import { bangLichSuTuBaoCao, docBangBaoCao, type BaoCaoNhap } from "@/lib/baoCaoThiTruong";
import { docBangChiSo, soNhapHopLe, type ChiSoGiaData, type ChiSoKhuVuc } from "@/lib/chiSoGia";
import { chuanTen } from "@/lib/locations";

// ============================================================================
// ĐIỂM TIN THỊ TRƯỜNG — API CHỈ DÀNH CHO ADMIN (anh 13/11/2026: "Cowork lọc xong nhập vào là lên số liệu và biểu đồ")
//   GET                          → bản đang chạy trên web (site_content "bao_cao_tt")
//   POST multipart "tep"         → đọc MAU-BAO-CAO-THI-TRUONG.xlsx của Cowork (6 sheet) → ghi site_content → làm mới trang
//   POST multipart ?xemTruoc=1   → chỉ đọc tệp, trả dữ liệu + lỗi để Admin xem trước cả báo cáo, KHÔNG ghi gì
//   PATCH JSON { quyBaoCao?, pdf?, nhanDinh? } → đổi quý đang hiện, đường dẫn PDF, nhận định anh đã sửa (giữ nguyên số đã nạp)
// ============================================================================
export const dynamic = "force-dynamic";

const KHOA = "bao_cao_tt";
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
type Admin = NonNullable<ReturnType<typeof createAdminClient>>;
async function banDangChay(admin: Admin): Promise<BaoCaoNhap | null> {
  const { data } = await admin.from("site_content").select("data").eq("key", KHOA).limit(1);
  return (data?.[0]?.data as BaoCaoNhap | undefined) ?? null;
}
async function ghi(admin: Admin, bang: BaoCaoNhap) {
  const { error } = await admin.from("site_content").upsert({ key: KHOA, data: bang });
  if (error) return loi("Không lưu được: " + error.message, 500);
  revalidateTag("noi-dung", "max"); // trang /diem-tin-thi-truong đọc site_content qua thẻ "noi-dung"
  return null;
}

// MỘT LẦN LỌC, HAI CHỖ DÙNG (anh 13/11/2026): giá sơ cấp theo phường / dự án trong báo cáo → BỔ SUNG Lịch sử giá (site_content
// "chi_so_gia"). Chỉ THÊM quý dãy đó còn thiếu — quý đã có số (Cowork lọc riêng cho Lịch sử giá) giữ nguyên, không đè.
const khoaDay = (x: ChiSoKhuVuc) =>
  [chuanTen(x.tinh), chuanTen(x.khuVuc ?? ""), chuanTen(x.loaiHinh ?? ""), x.mucDich ?? "ban", x.viTri ?? "", chuanTen(x.duAn ?? ""), chuanTen(x.duong ?? ""), chuanTen(x.loaiCon ?? "")].join("|");
function gopLichSu(cu: ChiSoKhuVuc[], moi: ChiSoKhuVuc[]) {
  const ds = cu.map((x) => ({ ...x, moc: [...x.moc] }));
  let them = 0, dayMoi = 0;
  for (const m of moi) {
    const c = ds.find((x) => khoaDay(x) === khoaDay(m));
    if (!c) { ds.push(m); dayMoi++; them += m.moc.length; continue; }
    for (const q of m.moc) if (!c.moc.some((x) => x.quy === q.quy)) { c.moc.push(q); them++; }
    c.moc.sort((a, b) => a.quy.localeCompare(b.quy));
  }
  return { items: ds, them, dayMoi };
}
async function boSungLichSu(admin: Admin, bang: BaoCaoNhap, ghiThat: boolean) {
  const { items: moi, loi: loiLs } = docBangChiSo(bangLichSuTuBaoCao(bang));
  const { data } = await admin.from("site_content").select("data").eq("key", "chi_so_gia").limit(1);
  const cu = (data?.[0]?.data as ChiSoGiaData | undefined)?.items ?? [];
  // Chỉ gộp vào dãy còn hiệu lực (sau đợt làm mới 03/10); dãy cũ trước mốc giữ nguyên, không đụng
  const hopLe = soNhapHopLe(cu), conLai = cu.filter((x) => !hopLe.includes(x));
  const g = gopLichSu(hopLe, moi);
  if (ghiThat && g.them) {
    const { error } = await admin.from("site_content").upsert({ key: "chi_so_gia", data: { items: [...conLai, ...g.items] } });
    if (error) return { them: 0, dayMoi: 0, loi: ["Lịch sử giá: " + error.message] };
    revalidateTag("noi-dung", "max");
  }
  return { them: g.them, dayMoi: g.dayMoi, loi: loiLs.slice(0, 10).map((x) => `Lịch sử giá dòng ${x.dong}: ${x.ly}`) };
}

export async function GET() {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  return NextResponse.json({ ok: true, bang: await banDangChay(admin) });
}

export async function POST(req: Request) {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const form = await req.formData().catch(() => null);
  const tep = form?.get("tep");
  if (!(tep instanceof File)) return loi("Chưa chọn tệp .xlsx");
  if (tep.size > 10 * 1024 * 1024) return loi("Tệp lớn hơn 10 MB");
  let kq;
  try {
    const buf = Buffer.from(await tep.arrayBuffer());
    kq = docBangBaoCao((ten) => { try { return docSheet(buf, ten); } catch { return null; } });
  } catch (e) {
    return loi(e instanceof Error ? e.message : "Không đọc được tệp");
  }
  if (!kq.bang.thiTruong.length) return loi("Sheet THI-TRUONG chưa có dòng số liệu nào. " + kq.loi.slice(0, 3).join(" · "));
  if (new URL(req.url).searchParams.get("xemTruoc")) return NextResponse.json({ ok: true, xemTruoc: true, ...kq, lichSu: await boSungLichSu(admin, kq.bang, false) });
  // Nạp tệp mới thay phần số liệu; giữ đường dẫn PDF + nhận định anh đã sửa của lần trước
  const cu = await banDangChay(admin);
  const bang: BaoCaoNhap = { ...kq.bang, pdf: cu?.pdf ?? {}, nhanDinh: cu?.nhanDinh ?? {} };
  const hong = await ghi(admin, bang);
  if (hong) return hong;
  return NextResponse.json({ ok: true, ...kq, bang, lichSu: await boSungLichSu(admin, bang, true) });
}

export async function PATCH(req: Request) {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const body = (await req.json().catch(() => null)) as Partial<Pick<BaoCaoNhap, "quyBaoCao" | "pdf" | "nhanDinh">> | null;
  if (!body) return loi("Thiếu dữ liệu");
  const cu = await banDangChay(admin);
  if (!cu) return loi("Chưa nạp bảng số liệu");
  const bang: BaoCaoNhap = {
    ...cu,
    ...(body.quyBaoCao ? { quyBaoCao: body.quyBaoCao } : {}),
    ...(body.pdf ? { pdf: { ...(cu.pdf ?? {}), ...body.pdf } } : {}),
    ...(body.nhanDinh ? { nhanDinh: { ...(cu.nhanDinh ?? {}), ...body.nhanDinh } } : {}),
  };
  const hong = await ghi(admin, bang);
  if (hong) return hong;
  return NextResponse.json({ ok: true, bang });
}
