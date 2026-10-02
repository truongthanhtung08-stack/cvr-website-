import { baoThanhToan } from "@/lib/baoThanhToan";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { viKhaDung, cauThieuTien } from "@/lib/viKhaDung";
import { ghepBillingLuu, bangTheoMucDich, goiUpNhieuLuot, vnd, type BillingData } from "@/lib/billing";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { baoLoi } from "@/lib/baoLoi";
import { getTier, type TierId } from "@/lib/packages";
import { soNgayConDay } from "@/lib/luotUp";

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
    .select("id,title,owner_id,status,purpose,tier,tier_expires_at,bump_credits,bump_lich")
    .eq("id", id)
    .single();
  if (loiTin || !tin) return loi("Không tìm thấy tin.", 404);
  if (tin.owner_id !== user.id) return loi("Tin này không phải của bạn.", 403);
  if (tin.status !== "approved") return loi("Chỉ mua gói đẩy cho tin đang đăng.");

  // Giá theo CẤP ĐANG CÓ HIỆU LỰC — gói VIP hết hạn thì tin đã về mức thường.
  const conHan = !tin.tier_expires_at || new Date(tin.tier_expires_at).getTime() > Date.now();
  const cap = (conHan ? tin.tier : "basic") as TierId;

  const { data: sc } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  const bang: BillingData = bangTheoMucDich(ghepBillingLuu(sc?.[0]?.data as Partial<BillingData> | undefined), tin.purpose);

  // Gói khách chọn phải CÓ THẬT trong bảng giá — không cho gửi số lượt tuỳ ý.
  const goi = goiUpNhieuLuot(bang, cap).find((g) => g.soLuot === Number(soLuot));
  if (!goi) return loi("Gói đẩy này không có trong bảng giá.");

  // MỖI TIN MỘT GÓI MỘT LÚC (chuẩn Batdongsan): còn lượt thì dùng hết mới mua gói mới.
  if (Number(tin.bump_credits ?? 0) > 0) {
    return loi(`Tin đang có gói đẩy (còn ${tin.bump_credits} lượt). Dùng hết lượt mới mua được gói mới.`);
  }

  // LƯỢT GẮN VỚI KỲ HIỂN THỊ (luotUp.ts): không bán quá số ngày tin còn đẩy được.
  const homNay = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  const { data: daDay } = await admin.from("listing_bumps").select("listing_id").eq("listing_id", id).eq("ngay", homNay).limit(1);
  const conDay = soNgayConDay(tin.tier_expires_at, tin.bump_lich, Boolean(daDay?.length));
  if (goi.soLuot > conDay) {
    return loi(conDay > 0
      ? `Tin còn đẩy được tối đa ${conDay} lượt trong thời hạn hiển thị — chọn gói nhỏ hơn.`
      : "Tin không còn ngày nào để đẩy thêm trong thời hạn hiển thị.");
  }

  const tien = tachThue(goi.gia);

  const { data: kq, error: loiMua } = await admin.rpc("mua_goi_up", {
    p_listing: id,
    p_user: user.id,
    p_so_luot: goi.soLuot,
    p_tien: tien.tongTra,
  });

  if (loiMua) {
    if (/VI_KHONG_DU/.test(loiMua.message)) {
      return loi(cauThieuTien(tien.tongTra, await viKhaDung(admin, user.id), "mua gói đẩy tin"));
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

  await baoThanhToan(admin, user.id, { dichVu: `Gói đẩy tin ${getTier(cap).name} ${goi.soLuot} lượt — ${tin.title}`, soTien: tien.tongTra, soDu: dong.so_du });

  // LẦN ĐẨY ĐẦU CHẠY NGAY khi mua (chuẩn Batdongsan); các lượt sau tự đẩy mỗi sáng.
  // Hôm nay tin đã đẩy rồi thì hàm trả rỗng, không tiêu lượt — lượt đầu chạy sáng mai.
  const { data: dayNgay } = await admin.rpc("day_tin_bang_luot", { p_listing: id, p_user: user.id });
  const d = (dayNgay as { con_lai: number; moc_day: string }[] | null)?.[0];
  if (d) revalidateTag("listings", "max");
  return NextResponse.json({ ok: true, daTru: tien.tongTra, soDu: dong.so_du, conLai: d?.con_lai ?? dong.con_lai, bumpedAt: d?.moc_day ?? null });
}
