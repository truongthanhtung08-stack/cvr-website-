import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guiThongBao, soDienThoaiZalo } from "@/lib/thongBao";
import { vnd } from "@/lib/billing";

// ============================================================================
// BÁO KHÁCH: HÓA ĐƠN ĐÃ PHÁT HÀNH
// ----------------------------------------------------------------------------
// VNPT có gửi email kèm PDF + XML cho khách, nhưng email hóa đơn ở Việt Nam rất
// hay rơi vào spam. Mất hóa đơn thì khách không kê khai được, gọi điện phàn nàn,
// mình phải gửi tay từng người.
//
// Nên dựng BA LỚP, hỏng lớp nào vẫn còn lớp khác:
//   1. VNPT gửi email kèm file gốc      — có thể vào spam
//   2. Route này nhắn Zalo + email      — báo "đã có hóa đơn, vào xem"
//   3. Trang /tai-khoan/hoa-don         — luôn xem được, không phụ thuộc ai
//
// CHỈ báo cho khách có hóa đơn RIÊNG (khách đã khai công ty + MST). Khách gộp
// vào hóa đơn tổng thì tờ hóa đơn không mang tên họ — nhắn cho họ chỉ gây rối.
//
// Zalo chỉ chạy khi đã có mẫu ZNS được Zalo duyệt, cắm vào biến môi trường
// ZNS_TEMPLATE_HOA_DON. Chưa có thì tự bỏ qua kênh Zalo, email vẫn gửi.
// ============================================================================
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // ── Chỉ admin gọi được ────────────────────────────────────────────────────
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, message: "Chưa đăng nhập" }, { status: 401 });

  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Chỉ quản trị viên dùng được" }, { status: 403 });
  }

  let ids: string[] = [];
  try {
    const body = await request.json();
    ids = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];
  } catch {
    // body hỏng → coi như không có id nào
  }
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, message: "Không có giao dịch nào để báo." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("doanh_thu")
    .select("id,user_id,mo_ta,tong_tra,hoa_don_so,hoa_don_loai,ten_nguoi_mua,email_nguoi_mua")
    .in("id", ids)
    .eq("hoa_don_loai", "rieng");

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  const ds = data ?? [];
  if (ds.length === 0) {
    return NextResponse.json({ ok: true, soDaBao: 0, message: "Không có hóa đơn riêng nào — không cần báo ai." });
  }

  // Số điện thoại nằm ở profiles, doanh_thu không lưu. Lấy một lượt cho cả nhóm.
  const userIds = [...new Set(ds.map((d) => d.user_id).filter(Boolean))] as string[];
  const dienThoai = new Map<string, string | null>();
  if (userIds.length > 0) {
    const { data: hs } = await admin.from("profiles").select("id,phone").in("id", userIds);
    for (const h of hs ?? []) dienThoai.set(h.id, h.phone);
  }

  const znsTemplateId = process.env.ZNS_TEMPLATE_HOA_DON || undefined;
  const ketQua: { id: string; email: string | null; daGuiEmail: boolean; daGuiZalo: boolean }[] = [];

  for (const d of ds) {
    const phone = d.user_id ? dienThoai.get(d.user_id) ?? null : null;
    const soHd = d.hoa_don_so || "(chờ cập nhật số)";

    const kq = await guiThongBao({
      email: d.email_nguoi_mua,
      phone: soDienThoaiZalo(phone) ? phone : null,
      tieuDe: "Hóa đơn điện tử đã phát hành",
      loiNhan:
        `Coastal Land đã phát hành hóa đơn cho giao dịch của quý khách. ` +
        `Bản gốc (PDF và XML) được gửi từ hệ thống hóa đơn điện tử VNPT — ` +
        `nếu không thấy trong hộp thư, vui lòng kiểm tra mục Spam. ` +
        `Quý khách cũng có thể xem lại bất cứ lúc nào tại coastalland.vn/tai-khoan/hoa-don`,
      cacDong: [
        { nhan: "Số hóa đơn", giaTri: soHd },
        { nhan: "Nội dung", giaTri: d.mo_ta },
        { nhan: "Tổng thanh toán", giaTri: vnd(Number(d.tong_tra || 0)) },
      ],
      znsTemplateId,
      znsData: znsTemplateId
        ? { so_hoa_don: soHd, so_tien: vnd(Number(d.tong_tra || 0)) }
        : undefined,
    });

    ketQua.push({
      id: d.id,
      email: d.email_nguoi_mua,
      daGuiEmail: kq.some((k) => k.kenh === "email" && k.daGui),
      daGuiZalo: kq.some((k) => k.kenh === "zalo" && k.daGui),
    });
  }

  return NextResponse.json({
    ok: true,
    soDaBao: ketQua.length,
    soGuiEmailThanhCong: ketQua.filter((k) => k.daGuiEmail).length,
    soGuiZaloThanhCong: ketQua.filter((k) => k.daGuiZalo).length,
    chiTiet: ketQua,
  });
}
