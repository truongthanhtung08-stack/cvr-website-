import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BILLING_DEFAULT, bangUp, type BillingData } from "@/lib/billing";
import { KHOA_GIA_CHUAN, NHAP_TRONG, kiemNhap, tinhCongBo, type GiaChuanNhap } from "@/lib/giaChuan";

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
  const [nhap, luu] = await Promise.all([docNhap(admin), docBilling(admin)]);
  const bang: BillingData = { ...BILLING_DEFAULT, ...luu };
  return NextResponse.json({
    ok: true,
    nhap,
    congBo: luu.congBo ?? null,
    plansHienTai: bang.plans,
    upHienTai: bangUp(bang),
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
  const { hanhDong } = (await request.json().catch(() => ({}))) as { hanhDong?: string };
  const luu = await docBilling(admin);

  if (hanhDong === "go-cong-bo") {
    const { congBo: _bo, ...conLai } = luu;
    void _bo;
    const { error } = await admin.from("site_content").upsert({ key: "billing", data: conLai });
    if (error) return loi(`Lỗi: ${error.message}`, 500);
    revalidateTag("noi-dung", "max");
    return NextResponse.json({ ok: true });
  }

  if (hanhDong !== "cong-bo") return loi("Thiếu hành động.");

  // Tính từ bản nháp ĐÃ LƯU trên máy chủ — không nhận giá từ trình duyệt.
  const nhap = await docNhap(admin);
  if (!nhap.ban.plans.length || !nhap.thue.plans.length) {
    return loi("Bản nháp chưa có đủ giá chuẩn cho cả Bán và Cho thuê — lưu nháp trước rồi mới công bố.");
  }
  const bang: BillingData = { ...BILLING_DEFAULT, ...luu };
  // Theo giờ Việt Nam: chương trình "đến hết ngày 17/10" phải còn tác dụng tới 23:59 giờ VN.
  const homNay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const congBo = tinhCongBo(nhap, homNay, bang.plans, bangUp(bang));

  const { error } = await admin.from("site_content").upsert({ key: "billing", data: { ...luu, congBo } });
  if (error) return loi(`Lỗi công bố: ${error.message}`, 500);
  await admin.from("bi_mat").upsert({
    key: KHOA_GIA_CHUAN,
    data: { ...nhap, congBoLuc: congBo.luc },
    updated_at: new Date().toISOString(),
  });
  revalidateTag("noi-dung", "max");
  return NextResponse.json({ ok: true, congBo });
}
