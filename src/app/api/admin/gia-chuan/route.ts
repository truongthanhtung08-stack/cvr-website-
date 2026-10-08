import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ghepBillingLuu, bangUp, goiDuAn, goiPr, ghiChuPr, bangBanner, soLuotTuNhan, ANH_CHUNG_MAC_DINH, VIDEO_CHUNG_MAC_DINH, type BillingData } from "@/lib/billing";
import { KHOA_GIA_CHUAN, NHAP_TRONG, kiemNhap, type GiaChuanNhap } from "@/lib/giaChuan";
import { congBoTin, congBoHoiVien, duyetChuongTrinh } from "@/lib/congBoGia";
import { ghepQuyDinh, KHOA_QUY_DINH_GIA, type QuyDinhGia } from "@/lib/quyDinhGia";

// ============================================================================
// GIÁ CHUẨN — API CHỈ DÀNH CHO ADMIN
//   GET                         → bản nháp (giá chuẩn + chương trình) + giá đang công bố
//   PUT  { nhap }               → lưu nháp. KHÁCH KHÔNG THẤY GÌ.
//   POST { hanhDong: "cong-bo" }   → tính giá công bố từ bản nháp ĐÃ LƯU, ghi ra web
//   POST { hanhDong: "go-cong-bo" } → bỏ giá công bố, web quay về bảng giá cũ
//
// Giá chuẩn nằm ở bảng bi_mat (không ai ngoài máy chủ đọc được). Công bố chỉ
// ghi GIÁ ĐÃ TÍNH SẴN vào site_content "billing" — bảng đó công khai.
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

async function docNhap(admin: NonNullable<ReturnType<typeof createAdminClient>>): Promise<GiaChuanNhap> {
  const { data } = await admin.from("bi_mat").select("data").eq("key", KHOA_GIA_CHUAN).limit(1);
  return kiemNhap(data?.[0]?.data) ?? NHAP_TRONG;
}

async function docBilling(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
  const { data } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  return (data?.[0]?.data as Partial<BillingData> | undefined) ?? {};
}

export async function GET() {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const [nhap, luu, qd] = await Promise.all([
    docNhap(admin), docBilling(admin),
    admin.from("site_content").select("data").eq("key", KHOA_QUY_DINH_GIA).limit(1),
  ]);
  const bang: BillingData = ghepBillingLuu(luu);
  return NextResponse.json({
    quyDinhHienTai: ghepQuyDinh(qd.data?.[0]?.data as Partial<QuyDinhGia> | undefined),
    ok: true,
    nhap,
    congBo: luu.congBo ?? null,
    hoiVienLuc: luu.hoiVienLuc ?? null,
    plansHienTai: bang.plans,
    upHienTai: bangUp(bang),
    // Bản nháp chưa có dự án / PR / banner → trang admin lấy giá đang chạy làm giá chuẩn.
    duAnHienTai: goiDuAn(bang),
    prHienTai: goiPr(bang),
    prNotesHienTai: ghiChuPr(bang),
    bannersHienTai: bangBanner(bang),
    freeHienTai: bang.free,
    quyDinhTinHienTai: {
      mediaTheoCap: bang.mediaTheoCap === true,
      anhChung: bang.anhChung ?? ANH_CHUNG_MAC_DINH,
      videoChung: bang.videoChung ?? VIDEO_CHUNG_MAC_DINH,
      anhTheoCap: Object.fromEntries(bang.plans.filter((p) => p.maxImages !== undefined).map((p) => [p.tierId, p.maxImages])),
      videoTheoCap: Object.fromEntries(bang.plans.filter((p) => p.maxVideos !== undefined).map((p) => [p.tierId, p.maxVideos])),
      coGoiDay: bangUp(bang).map((r) => soLuotTuNhan(r.label)),
    },
  });
}

export async function PUT(request: Request) {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const body = (await request.json().catch(() => ({}))) as { nhap?: unknown };
  const nhap = kiemNhap(body.nhap);
  if (!nhap) return loi("Dữ liệu giá không hợp lệ (có ô trống, số âm hoặc sai định dạng).");
  const cu = await docNhap(admin);
  const moi: GiaChuanNhap = { ...nhap, capNhat: new Date().toISOString(), congBoLuc: cu.congBoLuc };
  const { error } = await admin.from("bi_mat").upsert({ key: KHOA_GIA_CHUAN, data: moi, updated_at: new Date().toISOString() });
  if (error) return loi(`Lỗi lưu: ${error.message}`, 500);
  return NextResponse.json({ ok: true, capNhat: moi.capNhat });
}

export async function POST(request: Request) {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const { hanhDong, id } = (await request.json().catch(() => ({}))) as { hanhDong?: string; id?: string };
  const luu = await docBilling(admin);

  if (hanhDong === "duyet-chuong-trinh") {
    const kq = await duyetChuongTrinh(admin, String(id ?? ""));
    if ("loi" in kq) return loi(kq.loi, 400);
    return NextResponse.json({ ok: true });
  }

  if (hanhDong === "go-cong-bo") {
    const { congBo: _bo, ...conLai } = luu;
    void _bo;
    const { error } = await admin.from("site_content").upsert({ key: "billing", data: conLai });
    if (error) return loi(`Lỗi: ${error.message}`, 500);
    revalidateTag("noi-dung", "max");
    return NextResponse.json({ ok: true });
  }

  // ── GÓI HỘI VIÊN: công bố / gỡ RIÊNG, không đụng giá đăng tin ──────────────
  if (hanhDong === "cong-bo-hoi-vien") {
    // MỘT ĐƯỜNG: cùng hàm với cron tự công bố 0h (src/lib/congBoGia.ts).
    const kq = await congBoHoiVien(admin);
    if ("loi" in kq) return loi(kq.loi, 400);
    return NextResponse.json({ ok: true, ...kq });
  }
  if (hanhDong === "go-hoi-vien") {
    const { hoiVien: _hv, hoiVienLuc: _l, ...conLai } = luu;
    void _hv; void _l;
    const { error } = await admin.from("site_content").upsert({ key: "billing", data: conLai });
    if (error) return loi(`Lỗi: ${error.message}`, 500);
    revalidateTag("noi-dung", "max");
    return NextResponse.json({ ok: true });
  }

  if (hanhDong !== "cong-bo") return loi("Thiếu hành động.");

  // Tính từ bản nháp ĐÃ LƯU trên máy chủ — không nhận giá từ trình duyệt.
  // MỘT ĐƯỜNG: cùng hàm với cron tự công bố 0h (src/lib/congBoGia.ts).
  const kq = await congBoTin(admin);
  if ("loi" in kq) return loi(kq.loi, 400);
  return NextResponse.json({ ok: true, congBo: kq.congBo });
}
