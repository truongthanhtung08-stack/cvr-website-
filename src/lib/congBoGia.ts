import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { ghepBillingLuu, bangUp, type BillingData } from "@/lib/billing";
import { KHOA_GIA_CHUAN, NHAP_TRONG, kiemNhap, tinhCongBo, tinhHoiVien, type GiaChuanNhap } from "@/lib/giaChuan";

// ============================================================================
// CÔNG BỐ GIÁ — MỘT ĐƯỜNG DUY NHẤT (chủ dự án chốt 01/10/2026)
// ----------------------------------------------------------------------------
// Giá gói tin · gói đẩy tin · gói hội viên · khuyến mãi % CHỈ sửa ở /admin/gia-chuan
// rồi bấm Công bố. Hàm này dùng chung cho:
//   · nút Công bố của admin (/api/admin/gia-chuan)
//   · cron 0h giờ VN (/api/gia-chuan/tu-cong-bo) — chương trình khuyến mãi có ngày
//     bắt đầu / kết thúc thì giá tự đổi ĐÚNG NGÀY, không phụ thuộc admin nhớ bấm lại.
// Công bố xong: mọi nơi đọc site_content "billing" (Báo giá, form đăng tin, Đăng lại,
// Tiện ích, duyệt tin trừ tiền, đẩy tin, hội viên, CSDL so_ngay_hien_thi) đổi theo.
// ============================================================================

export const homNayVn = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

export async function docNhapGia(admin: SupabaseClient): Promise<GiaChuanNhap> {
  const { data } = await admin.from("bi_mat").select("data").eq("key", KHOA_GIA_CHUAN).limit(1);
  return kiemNhap(data?.[0]?.data) ?? NHAP_TRONG;
}

export async function docBillingLuu(admin: SupabaseClient): Promise<Partial<BillingData>> {
  const { data } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  return (data?.[0]?.data as Partial<BillingData> | undefined) ?? {};
}

/** Công bố giá gói tin + đẩy tin từ bản nháp ĐÃ LƯU. Trả lỗi (chuỗi) hoặc null. */
export async function congBoTin(admin: SupabaseClient): Promise<{ loi: string } | { congBo: BillingData["congBo"] }> {
  const [nhap, luu] = await Promise.all([docNhapGia(admin), docBillingLuu(admin)]);
  if (!nhap.ban.plans.length || !nhap.thue.plans.length) {
    return { loi: "Bản nháp chưa có đủ giá chuẩn cho cả Bán và Cho thuê — lưu nháp trước rồi mới công bố." };
  }
  const bang: BillingData = ghepBillingLuu(luu);
  const congBo = tinhCongBo(nhap, homNayVn(), bang.plans, bangUp(bang));
  const { error } = await admin.from("site_content").upsert({ key: "billing", data: { ...luu, congBo } });
  if (error) return { loi: `Lỗi công bố: ${error.message}` };
  await admin.from("bi_mat").upsert({
    key: KHOA_GIA_CHUAN,
    data: { ...nhap, congBoLuc: congBo.luc },
    updated_at: new Date().toISOString(),
  });
  revalidateTag("noi-dung", "max");
  return { congBo };
}

/** Công bố giá gói hội viên từ bản nháp ĐÃ LƯU. */
export async function congBoHoiVien(admin: SupabaseClient): Promise<{ loi: string } | { hoiVien: BillingData["hoiVien"]; hoiVienLuc: string }> {
  const [nhap, luu] = await Promise.all([docNhapGia(admin), docBillingLuu(admin)]);
  const hoiVien = tinhHoiVien(nhap.hoiVien ?? [], nhap.chuongTrinh, homNayVn());
  if (!hoiVien.length) return { loi: "Bản nháp chưa có gói hội viên nào có giá — lưu nháp trước rồi mới công bố." };
  const hoiVienLuc = new Date().toISOString();
  const { error } = await admin.from("site_content").upsert({ key: "billing", data: { ...luu, hoiVien, hoiVienLuc } });
  if (error) return { loi: `Lỗi công bố: ${error.message}` };
  revalidateTag("noi-dung", "max");
  return { hoiVien, hoiVienLuc };
}
