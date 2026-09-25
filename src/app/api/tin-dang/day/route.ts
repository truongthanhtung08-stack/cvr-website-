import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ghepBillingLuu, bangTheoMucDich, giaDayTin, vnd, type BillingData } from "@/lib/billing";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { baoLoi } from "@/lib/baoLoi";
import { getTier, type TierId } from "@/lib/packages";

// ============================================================================
// ĐẨY TIN (UP) — TRỪ VÍ + GHI SỔ + ĐƯA TIN LÊN ĐẦU
// ----------------------------------------------------------------------------
// Cơ chế (tài liệu "Cơ chế hiển thị và thuật toán BĐS", mục 4): đẩy tin để tin
// khỏi trôi mất giữa dòng tin mới. Tài liệu mô tả cách SỬA THẲNG ngày đăng cho
// tin trông như mới — Coastal Land KHÔNG làm vậy. Ta ghi cột riêng `bumped_at`:
// ngày đăng thật giữ nguyên, người mua đọc được sự thật, người bán vẫn mua được
// chỗ đứng. Thẻ tin ghi "Làm mới X phút trước", không giả thành "Đăng X phút trước".
//
// GIÁ: lấy từ bảng Đẩy tin trong admin (dòng đầu "Đẩy 1 lượt", theo cấp tin), máy chủ
// TỰ TÍNH — không nhận số tiền từ trình duyệt.
//
// MỖI TIN 1 LƯỢT/NGÀY: chặn bằng unique index trong CSDL (0034), không chỉ bằng
// giao diện — bấm hai lần, hai tab hay gọi thẳng API đều không lách được.
//
// TRỪ TIỀN + GHI NHẬT KÝ + ĐẨY nằm TRONG MỘT hàm CSDL (`day_tin`) nên không có
// cảnh trừ tiền xong mà tin không lên, hay tin lên mà quên trừ tiền.
// ============================================================================
export const dynamic = "force-dynamic";

function loi(thongBao: string, code = 400) {
  return NextResponse.json({ ok: false, loi: thongBao }, { status: code });
}

export async function POST(request: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Bạn cần đăng nhập.", 401);

  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  if (!id) return loi("Thiếu mã tin.");

  const admin = createAdminClient();
  if (!admin) return loi("Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ — chưa đẩy tin được.", 500);

  // ── 1. Tin phải là của chính người bấm, và đang đăng ──────────────────────
  const { data: tin, error: loiTin } = await admin
    .from("listings")
    .select("id,title,owner_id,status,purpose,tier,tier_expires_at,bump_credits")
    .eq("id", id)
    .single();
  if (loiTin || !tin) return loi("Không tìm thấy tin.", 404);
  if (tin.owner_id !== user.id) return loi("Tin này không phải của bạn.", 403);
  if (tin.status !== "approved") return loi("Chỉ đẩy được tin đang đăng.");

  // ── CÒN LƯỢT TRONG KHO thì TIÊU LƯỢT, KHÔNG thu tiền lần nữa ─────────────
  // Khách đã trả tiền lúc mua gói Up 3/7/13/27 lần. Thu thêm ở đây là thu hai lần.
  if (Number(tin.bump_credits ?? 0) > 0) {
    const { data: kqLuot, error: loiLuot } = await admin.rpc("day_tin_bang_luot", {
      p_listing: id,
      p_user: user.id,
    });
    if (loiLuot && !/function .* does not exist|schema cache|PGRST202/i.test(loiLuot.message)) {
      return loi(loiLuot.message, 500);
    }
    if (!loiLuot) {
      const d = (kqLuot as { con_lai: number; moc_day: string }[] | null)?.[0];
      if (!d) return loi("Hôm nay tin này đã được đẩy rồi — mỗi tin đẩy 1 lần mỗi ngày.");
      revalidateTag("listings", "max"); // tin vừa lên đầu → hiện NGAY
      return NextResponse.json({ ok: true, daTru: 0, dungLuot: true, conLai: d.con_lai, bumpedAt: d.moc_day });
    }
    // Chưa chạy migration 0035 → rơi xuống đường mua lẻ bên dưới.
  }

  // ── 2. Giá theo CẤP ĐANG CÓ HIỆU LỰC ──────────────────────────────────────
  // Gói VIP hết hạn thì tin đã tụt về mức thường — phải tính giá đẩy của tin
  // thường, không thu giá Diamond cho một tin đang hiển thị như tin thường.
  const conHan = !tin.tier_expires_at || new Date(tin.tier_expires_at).getTime() > Date.now();
  const cap = (conHan ? tin.tier : "basic") as TierId;

  const { data: sc } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  const bang: BillingData = bangTheoMucDich(ghepBillingLuu(sc?.[0]?.data as Partial<BillingData> | undefined), tin.purpose);
  let tien = tachThue(giaDayTin(bang, cap));

  // VOUCHER GÓI HỘI VIÊN "đẩy tin thường" (0040) — chỉ cho lượt đẩy lẻ của tin
  // thường, như Batdongsan. Lần đẩy không thành thì hoàn voucher (hoanVoucher).
  let voucher: { id: number; giam: number } | null = null;
  if (cap === "basic" && tien.tienHang > 0) {
    const { data: vc } = await admin.rpc("dung_voucher", { p_user: user.id, p_loai: "day-thuong" });
    const v = (vc as { id: number; giam: number }[] | null)?.[0];
    if (v) {
      voucher = { id: v.id, giam: Math.min(Number(v.giam), tien.tienHang) };
      tien = tachThue(tien.tienHang - voucher.giam);
    }
  }
  const hoanVoucher = async () => {
    if (voucher) await admin.rpc("hoan_voucher", { p_id: voucher.id });
  };

  // ── 3. Đẩy: trừ ví + ghi nhật ký + đặt mốc đẩy, trong MỘT giao dịch ───────
  const { data: kq, error: loiDay } = await admin.rpc("day_tin", {
    p_listing: id,
    p_user: user.id,
    p_tien: tien.tongTra,
  });

  if (loiDay) {
    await hoanVoucher();
    if (/VI_KHONG_DU/.test(loiDay.message)) {
      const { data: vi } = await admin.from("profiles").select("balance").eq("id", user.id).limit(1);
      const soDu = Number(vi?.[0]?.balance ?? 0);
      return loi(
        `Ví không đủ: cần ${vnd(tien.tongTra)}, còn ${vnd(soDu)}. Nạp thêm rồi đẩy lại.`,
      );
    }
    // Chưa chạy migration 0034 → nói thẳng, đừng để khách bấm mãi không hiểu vì sao.
    if (/function .* does not exist|schema cache|PGRST202/i.test(loiDay.message)) {
      return loi("Tính năng đẩy tin chưa được bật trên máy chủ. Vui lòng báo quản trị viên.", 503);
    }
    return loi(loiDay.message, 500);
  }

  // Không trả dòng nào = đã đẩy trong hôm nay rồi (unique index chặn).
  const dong = (kq as { so_du: number; moc_day: string }[] | null)?.[0];
  if (!dong) {
    await hoanVoucher();
    return loi("Hôm nay tin này đã được đẩy rồi — mỗi tin đẩy 1 lần mỗi ngày.");
  }

  // ── 4. Ghi sổ doanh thu (căn cứ lập tờ khai thuế) ─────────────────────────
  // Ghi sổ hỏng thì KHÔNG dừng: tiền đã trừ, tin đã lên đầu. Nhưng phải gào lên
  // ngay — tiền vào túi mình mà không có trong sổ là sai tờ khai.
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
    mo_ta: `Đẩy tin ${getTier(cap).name} — ${tin.title}${voucher ? ` (voucher hội viên −${vnd(voucher.giam)})` : ""}`,
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
      noi: "day-tin",
      mucDo: "chet",
      tomTat: "Đã trừ tiền đẩy tin nhưng KHÔNG ghi được sổ doanh thu",
      chiTiet: `Tin ${id} — ${loiSo.message}`,
      hauQua: "Tờ khai thuế thiếu một khoản thu, khách cũng không được xuất hóa đơn khoản này.",
      canLam: `Vào /admin/hoa-don-thue → ghi tay khoản ${vnd(tien.tongTra)} (đẩy tin "${tin.title}").`,
      khoa: `day-tin:doanh-thu:${id}:${new Date().toISOString().slice(0, 10)}`,
    });
  }

  revalidateTag("listings", "max"); // tin vừa lên đầu → xoá cache để hiện NGAY

  return NextResponse.json({
    ok: true,
    daTru: tien.tongTra,
    soDu: dong.so_du,
    bumpedAt: dong.moc_day,
  });
}
