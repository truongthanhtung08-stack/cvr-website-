import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanHoaSdt, laSdtVN, tachNhieuSdt } from "@/lib/phone";
import { guiThongBao, MAU_CO_NGUOI_QUAN_TAM } from "@/lib/thongBao";

// ════════════════════════════════════════════════════════════════════════════
// TIN HẾT HẠN — "GỬI YÊU CẦU LIÊN HỆ" ĐI THẲNG TỚI NGƯỜI ĐĂNG (như Batdongsan, 03/10/2026)
//   · Ghi lead vào listing_leads (nguon 'yeu_cau') → người đăng thấy tên + số khách
//     ở /tai-khoan/khach-hang, giống lead xem số.
//   · Báo người đăng: tin khách tự đăng → chủ tài khoản (email, không có thì Zalo);
//     tin admin đăng hộ → số liên hệ ghi trên tin (Zalo).
//   · Ghi thêm customer_requests để admin thấy ở /admin/yeu-cau (tin đăng hộ, người
//     bán không có tài khoản để xem số khách — admin chuyển giúp).
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

  const { data: tin } = await admin.from("listings").select("id,title,owner_id,details").eq("id", listingId).maybeSingle();
  if (!tin) return loi("Không tìm thấy tin.", 404);

  // Chặn trùng 24 giờ: cùng một số gửi nhiều lần cho một tin chỉ ghi và báo một lần.
  const homQua = new Date(Date.now() - 86_400_000).toISOString();
  const { data: daCo } = await admin
    .from("listing_leads").select("id")
    .eq("listing_id", listingId).eq("viewer_phone", sdt).gt("created_at", homQua).limit(1);
  if (daCo?.length) return NextResponse.json({ ok: true });

  await admin.from("listing_leads").insert({ listing_id: listingId, viewer_id: null, viewer_name: ten, viewer_phone: sdt, nguon: "yeu_cau" });

  const maTin = String(tin.id).slice(0, 8).toUpperCase();
  await admin.from("customer_requests").insert({
    user_id: null,
    loai: "khac",
    ten,
    dien_thoai: sdt,
    email: null,
    noi_dung: `Yêu cầu liên hệ lại — tin đã hết hạn "${tin.title}" (Mã tin ${maTin}) · https://coastalland.vn/bat-dong-san/${tin.id}`,
  });

  // NGƯỜI ĐĂNG: chủ tài khoản (khách tự đăng) hoặc người liên hệ ghi trên tin (đăng hộ).
  const lienHe = (tin.details as { contact?: { name?: string; phone?: string } } | null)?.contact;
  const { data: chu } = tin.owner_id
    ? await admin.from("profiles").select("email,phone,full_name,role").eq("id", tin.owner_id).maybeSingle()
    : { data: null };
  const dangHo = !chu || chu.role === "admin";
  const nhan = dangHo
    ? { email: null as string | null, phone: tachNhieuSdt(lienHe?.phone ?? "")[0] ?? null, ten: lienHe?.name || "Quý khách" }
    : { email: chu.email as string | null, phone: chu.phone as string | null, ten: chu.full_name || "Quý khách" };
  if (!nhan.email && !nhan.phone) return NextResponse.json({ ok: true });

  const luc = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
  const { count: tong } = await admin.from("listing_leads").select("id", { count: "exact", head: true }).eq("listing_id", listingId);
  await guiThongBao({
    email: nhan.email,
    phone: nhan.phone,
    tieuDe: "Có khách gửi yêu cầu liên hệ về tin đăng của bạn",
    loiNhan: `Khách ${ten} (${sdt}) muốn được liên hệ lại về bất động sản trong tin đăng của bạn. Tin đã hết hạn — đăng lại tại coastalland.vn/tai-khoan/tin-dang.`,
    cacDong: [
      { nhan: "Tin đăng", giaTri: tin.title },
      { nhan: "Khách", giaTri: `${ten} · ${sdt}` },
      { nhan: "Thời gian", giaTri: luc },
    ],
    znsTemplateId: MAU_CO_NGUOI_QUAN_TAM,
    znsData: { ten_khach_hang: nhan.ten, so_dien_thoai: chuanHoaSdt(nhan.phone ?? ""), ten_tin: tin.title, thoi_gian: luc, so_luot: String(tong ?? 1) },
  });

  return NextResponse.json({ ok: true });
}

function loi(message: string, status: number) {
  return NextResponse.json({ ok: false, loi: message }, { status });
}
