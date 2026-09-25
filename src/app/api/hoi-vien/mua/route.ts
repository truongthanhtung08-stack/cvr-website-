import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { vnd, type BillingData } from "@/lib/billing";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { baoLoi } from "@/lib/baoLoi";

// ============================================================================
// MUA GÓI HỘI VIÊN — trừ ví + tạo gói + cấp voucher kỳ đầu + ghi sổ doanh thu
// ----------------------------------------------------------------------------
// Giá lấy từ bảng ĐÃ CÔNG BỐ (site_content billing.hoiVien), máy chủ tự tính —
// không nhận số tiền từ trình duyệt. Khoá hồ sơ, kiểm "chưa có gói đang chạy",
// kiểm đủ tiền, trừ ví và tạo gói nằm TRONG MỘT hàm CSDL (tao_hoi_vien, 0040):
// bấm hai lần hay mở hai tab cũng chỉ mua được một gói.
// Luật theo Batdongsan: 1 gói tại một thời điểm, không huỷ, voucher mỗi 30 ngày.
// ============================================================================
export const dynamic = "force-dynamic";

function loi(thongBao: string, code = 400) {
  return NextResponse.json({ ok: false, loi: thongBao }, { status: code });
}

export async function POST(request: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Bạn cần đăng nhập.", 401);

  const { goi: maGoi, thang } = (await request.json().catch(() => ({}))) as { goi?: string; thang?: number };
  if (!maGoi || !Number.isInteger(thang)) return loi("Thiếu gói hoặc thời hạn.");

  const admin = createAdminClient();
  if (!admin) return loi("Máy chủ chưa cấu hình đủ.", 500);

  const { data: sc } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  const bang = (sc?.[0]?.data as Partial<BillingData> | undefined) ?? {};
  const goi = (bang.hoiVien ?? []).find((g) => g.id === maGoi);
  const ky = goi?.thoiHan.find((t) => t.thang === thang);
  if (!goi || !ky || !(ky.price > 0)) return loi("Gói này hiện không bán.", 404);

  const tien = tachThue(ky.price);

  const { data: kq, error } = await admin.rpc("tao_hoi_vien", {
    p_user: user.id,
    p_goi: goi.id,
    p_ten_goi: goi.ten,
    p_so_thang: ky.thang,
    p_voucher: goi.voucher,
    p_quyen_loi: goi.quyenLoi,
    p_tong_tra: tien.tongTra,
  });
  if (error) {
    if (/DANG_CO_GOI/.test(error.message)) return loi("Bạn đang có một gói hội viên còn hạn — mỗi tài khoản dùng một gói tại một thời điểm.");
    if (/VI_KHONG_DU/.test(error.message)) {
      const { data: vi } = await admin.from("profiles").select("balance").eq("id", user.id).limit(1);
      return loi(`Ví không đủ: cần ${vnd(tien.tongTra)}, còn ${vnd(Number(vi?.[0]?.balance ?? 0))}. Nạp thêm rồi mua lại.`);
    }
    return loi(error.message, 500);
  }
  const d = (kq as { hoi_vien_id: number; so_du: number; het_han: string }[] | null)?.[0];

  // Ghi sổ doanh thu (căn cứ tờ khai thuế). Hỏng thì KHÔNG huỷ gói — tiền đã
  // trừ, gói đã chạy — nhưng phải báo ngay để ghi tay.
  const { data: hs } = await admin
    .from("profiles")
    .select("full_name,email,xuat_hoa_don,hd_ten_cong_ty,hd_mst,hd_dia_chi,hd_email")
    .eq("id", user.id)
    .limit(1);
  const ho = hs?.[0];
  const canHoaDon = Boolean(ho?.xuat_hoa_don);
  const { error: loiSo } = await admin.from("doanh_thu").insert({
    user_id: user.id,
    loai: "hoi_vien",
    mo_ta: `${goi.ten} — ${ky.thang} tháng`,
    tien_hang: tien.tienHang,
    tien_thue: tien.tienThue,
    thue_suat: THUE_SUAT_GTGT,
    tong_tra: tien.tongTra,
    yeu_cau_hoa_don: canHoaDon,
    hoa_don_loai: canHoaDon ? "rieng" : "tong",
    ten_nguoi_mua: canHoaDon ? ho?.hd_ten_cong_ty : ho?.full_name,
    mst_nguoi_mua: canHoaDon ? ho?.hd_mst : null,
    dia_chi_nguoi_mua: canHoaDon ? ho?.hd_dia_chi : null,
    email_nguoi_mua: (canHoaDon ? ho?.hd_email : null) || ho?.email,
  });
  if (loiSo) {
    await baoLoi({
      noi: "mua-hoi-vien",
      mucDo: "chet",
      tomTat: "Đã trừ tiền mua gói hội viên nhưng KHÔNG ghi được sổ doanh thu",
      chiTiet: `Gói ${d?.hoi_vien_id} — ${loiSo.message}`,
      hauQua: "Tờ khai thuế thiếu một khoản thu, khách cũng không được xuất hóa đơn khoản này.",
      canLam: `Vào /admin/hoa-don-thue → ghi tay khoản ${vnd(tien.tongTra)} (${goi.ten} ${ky.thang} tháng).`,
      khoa: `mua-hoi-vien:doanh-thu:${d?.hoi_vien_id}`,
    });
  }

  return NextResponse.json({ ok: true, daTru: tien.tongTra, soDu: d?.so_du, hetHan: d?.het_han });
}
