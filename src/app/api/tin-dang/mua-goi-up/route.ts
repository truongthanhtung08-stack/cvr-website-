import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BILLING_DEFAULT, bangTheoMucDich, goiUpNhieuLuot, vnd, type BillingData } from "@/lib/billing";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { baoLoi } from "@/lib/baoLoi";
import { getTier, type TierId } from "@/lib/packages";

// ============================================================================
// MUA GÓI UP NHIỀU LƯỢT — trả tiền MỘT LẦN, tiêu dần mỗi ngày
// ----------------------------------------------------------------------------
// Khác "Đẩy tin" (/api/tin-dang/day): ở đó mua lẻ từng lượt, bấm là trừ ví.
// Ở đây mua sỉ 3/7/13/27 lượt rẻ hơn 20–50%, cộng vào kho lượt CỦA TIN rồi mỗi
// ngày tiêu 1 lượt (tự động lúc 8h sáng, hoặc khách tự bấm).
//
// Máy chủ TỰ TRA GIÁ từ bảng admin theo số lượt khách chọn — không nhận số tiền
// từ trình duyệt. Client chỉ gửi "mua gói mấy lượt cho tin nào".
// ============================================================================
export const dynamic = "force-dynamic";

function loi(thongBao: string, code = 400) {
  return NextResponse.json({ ok: false, loi: thongBao }, { status: code });
}

export async function POST(request: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Bạn cần đăng nhập.", 401);

  const { id, soLuot } = (await request.json().catch(() => ({}))) as { id?: string; soLuot?: number };
  if (!id || !soLuot) return loi("Thiếu mã tin hoặc số lượt.");

  const admin = createAdminClient();
  if (!admin) return loi("Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ — chưa mua gói được.", 500);

  const { data: tin, error: loiTin } = await admin
    .from("listings")
    .select("id,title,owner_id,status,purpose,tier,tier_expires_at")
    .eq("id", id)
    .single();
  if (loiTin || !tin) return loi("Không tìm thấy tin.", 404);
  if (tin.owner_id !== user.id) return loi("Tin này không phải của bạn.", 403);
  if (tin.status !== "approved") return loi("Chỉ mua gói đẩy cho tin đang đăng.");

  // Giá theo CẤP ĐANG CÓ HIỆU LỰC — gói VIP hết hạn thì tin đã về mức thường.
  const conHan = !tin.tier_expires_at || new Date(tin.tier_expires_at).getTime() > Date.now();
  const cap = (conHan ? tin.tier : "basic") as TierId;

  const { data: sc } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  const bang: BillingData = bangTheoMucDich({ ...BILLING_DEFAULT, ...((sc?.[0]?.data as Partial<BillingData>) ?? {}) }, tin.purpose);

  // Gói khách chọn phải CÓ THẬT trong bảng giá — không cho gửi số lượt tuỳ ý.
  const goi = goiUpNhieuLuot(bang, cap).find((g) => g.soLuot === Number(soLuot));
  if (!goi) return loi("Gói đẩy này không có trong bảng giá.");

  const tien = tachThue(goi.gia);

  const { data: kq, error: loiMua } = await admin.rpc("mua_goi_up", {
    p_listing: id,
    p_user: user.id,
    p_so_luot: goi.soLuot,
    p_tien: tien.tongTra,
  });

  if (loiMua) {
    if (/VI_KHONG_DU/.test(loiMua.message)) {
      const { data: vi } = await admin.from("profiles").select("balance").eq("id", user.id).limit(1);
      return loi(
        `Ví không đủ: cần ${vnd(tien.tongTra)}, còn ${vnd(Number(vi?.[0]?.balance ?? 0))}. Nạp thêm rồi mua lại.`,
      );
    }
    if (/function .* does not exist|schema cache|PGRST202/i.test(loiMua.message)) {
      return loi("Tính năng gói đẩy chưa được bật trên máy chủ. Vui lòng báo quản trị viên.", 503);
    }
    return loi(loiMua.message, 500);
  }

  const dong = (kq as { so_du: number; con_lai: number }[] | null)?.[0];
  if (!dong) return loi("Không mua được gói đẩy cho tin này.");

  // Ghi sổ doanh thu — loai 'day_tin' để không đụng ràng buộc "mỗi tin một khoản
  // đăng tin". Tiền thu MỘT LẦN ở đây; các lượt tiêu sau KHÔNG ghi thêm đồng nào,
  // nếu không là tính doanh thu hai lần.
  const { data: hs } = await admin
    .from("profiles")
    .select("full_name,email,xuat_hoa_don,hd_ten_cong_ty,hd_mst,hd_dia_chi,hd_email")
    .eq("id", user.id)
    .limit(1);
  const ho = hs?.[0];
  const canHoaDon = Boolean(ho?.xuat_hoa_don);

  const { error: loiSo } = await admin.from("doanh_thu").insert({
    user_id: user.id,
    listing_id: id,
    loai: "day_tin",
    mo_ta: `Gói đẩy tin ${getTier(cap).name} — ${goi.soLuot} lượt — ${tin.title}`,
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
      noi: "mua-goi-up",
      mucDo: "chet",
      tomTat: "Đã trừ tiền gói đẩy nhưng KHÔNG ghi được sổ doanh thu",
      chiTiet: `Tin ${id} — ${loiSo.message}`,
      hauQua: "Tờ khai thuế thiếu một khoản thu, khách cũng không được xuất hóa đơn khoản này.",
      canLam: `Vào /admin/hoa-don-thue → ghi tay khoản ${vnd(tien.tongTra)} (gói đẩy "${tin.title}").`,
      khoa: `mua-goi-up:doanh-thu:${id}:${Date.now()}`,
    });
  }

  return NextResponse.json({ ok: true, daTru: tien.tongTra, soDu: dong.so_du, conLai: dong.con_lai });
}
