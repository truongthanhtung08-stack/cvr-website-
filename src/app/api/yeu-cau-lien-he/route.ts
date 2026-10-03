import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";
import { guiThongBao, MAU_CO_NGUOI_QUAN_TAM } from "@/lib/thongBao";
import { baoAdmin } from "@/lib/baoAdmin";

// ════════════════════════════════════════════════════════════════════════════
// TIN HẾT HẠN — "GỬI YÊU CẦU LIÊN HỆ" (như Batdongsan, 03/10/2026)
// Tin hết hạn ẩn số người bán; người mua để lại tên + số → NGƯỜI ĐĂNG gọi lại.
//   1. Chỉ nhận cho tin ĐÃ HẾT HẠN (tin còn hạn đã có nút Gọi / Zalo).
//   2. Cùng một số gửi lại cho cùng tin trong 24 giờ → bỏ qua (không ghi trùng).
//   3. Ghi lead (listing_leads, nguon 'yeu_cau') → người đăng thấy tên + số khách
//      ở /tai-khoan/khach-hang.
//   4. Báo người đăng:
//      · Tin trong TÀI KHOẢN KHÁCH → báo chủ tài khoản (email kèm tên + số khách;
//        không có email thì Zalo). Tối đa 1 lần / tin / 24 giờ — không để Zalo khoá.
//      · Tin ADMIN ĐĂNG HỘ → người đăng là admin → email hotro@ ngay, kèm tên + số khách.
//        KHÔNG nhắn người bán ngoài (chủ dự án tự chăm khách đăng hộ).
// ════════════════════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { listingId?: string; ten?: string; sdt?: string } | null;
  const listingId = b?.listingId?.trim() ?? "";
  const ten = (b?.ten ?? "").trim().slice(0, 80);
  const sdt = chuanHoaSdt(b?.sdt ?? "");
  if (!listingId || !ten) return loi("Thiếu thông tin.", 400);
  if (!laSdtVN(sdt)) return loi("Số điện thoại chưa đúng.", 400);

  const admin = createAdminClient();
  if (!admin) return loi("Hệ thống chưa sẵn sàng.", 500);

  const { data: tin } = await admin
    .from("listings").select("id,title,owner_id,status,tier_expires_at").eq("id", listingId).maybeSingle();
  if (!tin) return loi("Không tìm thấy tin.", 404);
  const daHetHan = tin.status === "expired" || (tin.tier_expires_at && new Date(tin.tier_expires_at).getTime() <= Date.now());
  if (!daHetHan) return loi("Tin còn hạn — vui lòng liên hệ trực tiếp người đăng.", 400);

  const homQua = new Date(Date.now() - 86_400_000).toISOString();
  const { data: daCo } = await admin
    .from("listing_leads").select("id")
    .eq("listing_id", listingId).eq("viewer_phone", sdt).gt("created_at", homQua).limit(1);
  if (daCo?.length) return NextResponse.json({ ok: true });

  // Lượt yêu cầu ĐẦU TIÊN của tin trong 24 giờ thì mới báo (đếm TRƯỚC khi ghi lượt này).
  const { count: trong24h } = await admin
    .from("listing_leads").select("id", { count: "exact", head: true })
    .eq("listing_id", listingId).eq("nguon", "yeu_cau").gt("created_at", homQua);

  const { error } = await admin
    .from("listing_leads")
    .insert({ listing_id: listingId, viewer_id: null, viewer_name: ten, viewer_phone: sdt, nguon: "yeu_cau" });
  if (error) return loi("Gửi yêu cầu chưa được, vui lòng thử lại.", 500);

  const luc = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
  const maTin = String(tin.id).slice(0, 8).toUpperCase();
  const { data: chu } = tin.owner_id
    ? await admin.from("profiles").select("email,phone,full_name,role").eq("id", tin.owner_id).maybeSingle()
    : { data: null };

  if (!chu || chu.role === "admin") {
    // Tin đăng hộ: người đăng là admin — báo ngay MỌI yêu cầu (email nội bộ, không tốn Zalo).
    await baoAdmin(`Khách yêu cầu liên hệ — tin hết hạn ${maTin}`, [
      {
        tieuDe: tin.title,
        dong: [`Khách: ${ten}`, `Số điện thoại: ${sdt}`, `Lúc: ${luc}`],
        link: `https://coastalland.vn/bat-dong-san/${tin.id}`,
        nhanLink: "Xem tin",
      },
    ]);
    return NextResponse.json({ ok: true });
  }

  if ((trong24h ?? 0) === 0) {
    await guiThongBao({
      email: chu.email,
      phone: chu.phone,
      tieuDe: "Có khách muốn được liên hệ lại về tin đăng của bạn",
      loiNhan: `Khách ${ten} (${sdt}) muốn được liên hệ lại về bất động sản trong tin đăng của bạn. Tin đã hết hạn — đăng lại tại coastalland.vn/tai-khoan/tin-dang. Mọi khách để lại số đều có ở coastalland.vn/tai-khoan/khach-hang.`,
      cacDong: [
        { nhan: "Tin đăng", giaTri: tin.title },
        { nhan: "Khách", giaTri: `${ten} · ${sdt}` },
        { nhan: "Thời gian", giaTri: luc },
      ],
      znsTemplateId: MAU_CO_NGUOI_QUAN_TAM,
      znsData: { ten_khach_hang: chu.full_name || "Quý khách", so_dien_thoai: chuanHoaSdt(chu.phone ?? ""), ten_tin: tin.title, thoi_gian: luc, so_luot: "1" },
    });
  }
  return NextResponse.json({ ok: true });
}

function loi(message: string, status: number) {
  return NextResponse.json({ ok: false, loi: message }, { status });
}
