import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { BILLING_DEFAULT, type BillingData, type UpRow } from "@/lib/billing";
import { KHOA_QUY_DINH_GIA } from "@/lib/quyDinhGia";
import { KHOA_GIA_CHUAN, NHAP_TRONG, DIEU_CHINH_TRONG, chonMienPhi, thieuThongTin, kiemNhap, tinhCongBo, tinhHoiVien, tinhDuAn, tinhPr, tinhBanner, type GiaChuanNhap } from "@/lib/giaChuan";

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

// BẢN ĐÃ DUYỆT (chủ dự án 08/10/2026: "chỉ công bố khi tôi duyệt"). Bấm Công bố = duyệt:
// chụp lại đúng bản nháp lúc đó. Lịch 0h CHỈ tính lại từ bản đã duyệt (để chương trình đã
// duyệt tự bật/tắt đúng ngày) — bản nháp đang sửa dở KHÔNG BAO GIỜ tự lên web.
export const KHOA_DA_DUYET = "gia_chuan_da_duyet";

export async function docNhapGia(admin: SupabaseClient, khoa: string = KHOA_GIA_CHUAN): Promise<GiaChuanNhap | null> {
  const { data } = await admin.from("bi_mat").select("data").eq("key", khoa).limit(1);
  return kiemNhap(data?.[0]?.data);
}

// Chương trình CHỈ có hiệu lực khi chủ dự án bấm Duyệt chương trình đó — không có đường thứ hai.
const chiDaDuyet = (n: GiaChuanNhap): GiaChuanNhap => ({ ...n, chuongTrinh: n.chuongTrinh.filter((c) => c.daDuyet) });

// Bấm Duyệt một chương trình = hiệu lực ngay: khoá chương trình, đưa vào bản đã duyệt và
// tính lại giá trên web TỪ BẢN ĐÃ DUYỆT (giá chuẩn/% đang sửa dở trong nháp không bị kéo theo).
export async function duyetChuongTrinh(admin: SupabaseClient, id: string): Promise<{ loi: string } | { ok: true }> {
  const [nhap, daDuyet] = await Promise.all([docNhapGia(admin), docNhapGia(admin, KHOA_DA_DUYET)]);
  if (!nhap || !daDuyet) return { loi: "Chưa có bảng giá đã công bố." };
  const c = nhap.chuongTrinh.find((x) => x.id === id);
  if (!c) return { loi: "Không tìm thấy chương trình — lưu nháp trước." };
  if (c.daDuyet) return { loi: "Chương trình đã duyệt." };
  const thieu = thieuThongTin(c);
  if (thieu.length) return { loi: `Chưa đủ thông tin: ${thieu.join(", ")}.` };
  const luc = new Date().toISOString();
  const moi = { ...c, daDuyet: luc, daCongBo: luc };
  await admin.from("bi_mat").upsert({ key: KHOA_GIA_CHUAN, data: { ...nhap, chuongTrinh: nhap.chuongTrinh.map((x) => (x.id === id ? moi : x)) }, updated_at: luc });
  await admin.from("bi_mat").upsert({ key: KHOA_DA_DUYET, data: { ...daDuyet, chuongTrinh: [...daDuyet.chuongTrinh.filter((x) => x.id !== id), moi] }, updated_at: luc });
  const kq = await congBoTin(admin, true);
  if ("loi" in kq) return kq;
  if (daDuyet.hoiVien?.length) await congBoHoiVien(admin, true);
  return { ok: true };
}

async function nhapCongBo(admin: SupabaseClient, tuBanDuyet: boolean): Promise<GiaChuanNhap | null> {
  if (tuBanDuyet) return docNhapGia(admin, KHOA_DA_DUYET);
  const goc = (await docNhapGia(admin)) ?? NHAP_TRONG;
  const nhap = chiDaDuyet(goc);
  await admin.from("bi_mat").upsert({ key: KHOA_DA_DUYET, data: nhap, updated_at: new Date().toISOString() });
  return nhap;
}

export async function docBillingLuu(admin: SupabaseClient): Promise<Partial<BillingData>> {
  const { data } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  return (data?.[0]?.data as Partial<BillingData> | undefined) ?? {};
}

/** Công bố giá gói tin + đẩy tin từ bản nháp ĐÃ LƯU. Trả lỗi (chuỗi) hoặc null. */
export async function congBoTin(admin: SupabaseClient, tuBanDuyet = false): Promise<{ loi: string } | { congBo: BillingData["congBo"] }> {
  const [nhap, luu] = await Promise.all([nhapCongBo(admin, tuBanDuyet), docBillingLuu(admin)]);
  if (!nhap) return { loi: "Chưa có bản giá đã duyệt." };
  if (!nhap.ban.plans.length || !nhap.thue.plans.length) {
    return { loi: "Bản nháp chưa có đủ giá chuẩn cho cả Bán và Cho thuê — lưu nháp trước rồi mới công bố." };
  }
  // ⛔ CHỈ BẢN ĐÃ DUYỆT (09/10/2026): billing ghi lại TỪ ĐẦU theo bản duyệt — không giữ
  // mục cũ nào (cấp theo nạp, điểm, ghi chú cũ…) và không lấy số mặc định nào trong code.
  const qt = nhap.quyDinhTin;
  // Cỡ gói đẩy theo bản đã duyệt (chỉ nhãn — giá tính lại ngay dưới).
  const upNhan: UpRow[] = (qt?.coGoiDay ?? []).map((n) => ({ label: `Đẩy ${n} lượt`, values: [] }));
  const plans = BILLING_DEFAULT.plans;
  const congBo = tinhCongBo(nhap, homNayVn(), plans, upNhan);
  // MỘT BẢNG GIÁ (08/10/2026): dự án · PR · banner cũng đi từ giá chuẩn + % cột.
  const dc = nhap.dieuChinh ?? DIEU_CHINH_TRONG;
  const them: Partial<BillingData> = {
    ...(qt ? {
      mediaTheoCap: qt.mediaTheoCap,
      anhChung: qt.anhChung,
      videoChung: qt.videoChung,
      plans: plans.map((p) => ({ ...p, maxImages: qt.anhTheoCap[p.tierId], maxVideos: qt.videoTheoCap[p.tierId] })),
      up: congBo.ban.up,
    } : {}),
    ...(nhap.duAn?.length ? { projectPlans: tinhDuAn(nhap.duAn, dc.duAn) } : {}),
    ...(nhap.pr?.length ? { pr: tinhPr(nhap.pr, dc.pr) } : {}),
    ...(nhap.prNotes ? { prNotes: nhap.prNotes } : {}),
    ...(nhap.banners?.length ? { banners: tinhBanner(nhap.banners, dc.banner) } : {}),
  };
  // Chương trình miễn phí thành viên mới (trong danh sách khuyến mãi) → khối "free" web đang dùng.
  const mp = chonMienPhi(nhap.chuongTrinh, homNayVn());
  if (mp) {
    Object.assign(them, {
      free: {
        ...BILLING_DEFAULT.free,
        active: mp.bat,
        from: mp.tu,
        to: mp.den,
        days: mp.soNgayTuDangKy ?? 0,
        quota: mp.soTin ?? 0,
        tierId: mp.tiers[0],
        hienThi: mp.soNgayHienThi,
        soAnh: mp.soAnh,
        soVideo: mp.soVideo,
        audience: "new" as const,
      },
    });
  }
  const giu: Partial<BillingData> = {
    // Gói hội viên công bố riêng (congBoHoiVien) — cũng chỉ từ bản đã duyệt.
    ...(luu.hoiVien ? { hoiVien: luu.hoiVien, hoiVienLuc: luu.hoiVienLuc } : {}),
    ...(luu.topupAmounts ? { topupAmounts: luu.topupAmounts } : {}),
  };
  const { error } = await admin.from("site_content").upsert({ key: "billing", data: { ...giu, plans, free: BILLING_DEFAULT.free, ...them, congBo } });
  if (error) return { loi: `Lỗi công bố: ${error.message}` };
  if (nhap.quyDinh) await admin.from("site_content").upsert({ key: KHOA_QUY_DINH_GIA, data: nhap.quyDinh });
  if (!tuBanDuyet) {
    const nhapLuu = await docNhapGia(admin);
    if (nhapLuu) await admin.from("bi_mat").upsert({ key: KHOA_GIA_CHUAN, data: { ...nhapLuu, congBoLuc: congBo.luc }, updated_at: new Date().toISOString() });
  }
  revalidateTag("noi-dung", "max");
  return { congBo };
}

/** Công bố giá gói hội viên từ bản nháp ĐÃ LƯU. */
export async function congBoHoiVien(admin: SupabaseClient, tuBanDuyet = false): Promise<{ loi: string } | { hoiVien: BillingData["hoiVien"]; hoiVienLuc: string }> {
  const [nhap, luu] = await Promise.all([tuBanDuyet ? docNhapGia(admin, KHOA_DA_DUYET) : docNhapGia(admin).then((n) => n && chiDaDuyet(n)), docBillingLuu(admin)]);
  if (!nhap) return { loi: "Chưa có bản giá đã duyệt." };
  const hoiVien = tinhHoiVien(nhap.hoiVien ?? [], nhap.chuongTrinh, homNayVn(), nhap.dieuChinh?.hoiVien);
  if (!hoiVien.length) return { loi: "Bản nháp chưa có gói hội viên nào có giá — lưu nháp trước rồi mới công bố." };
  const hoiVienLuc = new Date().toISOString();
  const { error } = await admin.from("site_content").upsert({ key: "billing", data: { ...luu, hoiVien, hoiVienLuc } });
  if (error) return { loi: `Lỗi công bố: ${error.message}` };
  revalidateTag("noi-dung", "max");
  return { hoiVien, hoiVienLuc };
}
