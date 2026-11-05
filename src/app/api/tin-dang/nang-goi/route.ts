import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { viKhaDung, cauThieuTien } from "@/lib/viKhaDung";
import { ghepBillingLuu, giaNangGoi, laChuThat, type BillingData } from "@/lib/billing";
import { goiHienTai, oNangDuoc, tinNangDuoc, type YeuCauNang } from "@/lib/nangGoi";
import { getTier, type TierId } from "@/lib/packages";
import { guiThongBao, maTin, MAU_DA_NHAN_TIN } from "@/lib/thongBao";
import { vnd } from "@/lib/billing";

// ============================================================================
// KHÁCH GỬI / HUỶ YÊU CẦU NÂNG GÓI (chủ dự án chốt 01/11/2026)
// POST { id, tier, days, apKhauTru } → máy chủ TỰ TÍNH giá (giaNangGoi), kiểm ví khả dụng,
// ghi details.nang_cho — tiền tạm giữ (0067), tin vẫn hiện với gói cũ, CHƯA trừ đồng nào.
// POST { id, huy: true } → khách huỷ yêu cầu đang chờ (nhả tạm giữ).
// Duyệt / từ chối: /api/admin/nang-goi. Mỗi tháng vài chục lượt — 3–4 lượt đọc/ghi Supabase mỗi lần,
// không xoá bộ nhớ đệm (tin chưa đổi gì trên web).
// ============================================================================
export const dynamic = "force-dynamic";

const loi = (thongBao: string, code = 400) => NextResponse.json({ ok: false, loi: thongBao }, { status: code });

export async function POST(request: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Bạn cần đăng nhập.", 401);

  const body = (await request.json().catch(() => ({}))) as { id?: string; tier?: TierId; days?: number; apKhauTru?: boolean; huy?: boolean };
  if (!body.id) return loi("Thiếu mã tin.");

  const admin = createAdminClient();
  if (!admin) return loi("Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ.", 500);

  const { data: tin } = await admin
    .from("listings")
    .select("id,title,owner_id,status,purpose,tier,tier_days,published_at,tier_expires_at,details")
    .eq("id", body.id)
    .single();
  if (!tin) return loi("Không tìm thấy tin.", 404);
  if (tin.owner_id !== user.id) return loi("Tin này không phải của bạn.", 403);
  const details = (tin.details ?? {}) as Record<string, unknown>;

  // ── Huỷ yêu cầu đang chờ ──────────────────────────────────────────────────
  if (body.huy) {
    if (!details.nang_cho) return NextResponse.json({ ok: true });
    const { nang_cho: _bo, ...conLai } = details;
    void _bo;
    const { error } = await admin.from("listings").update({ details: conLai }).eq("id", tin.id);
    if (error) return loi(error.message, 500);
    return NextResponse.json({ ok: true });
  }

  // ── Điều kiện: chính chủ đã tự vào · tin đang hiện, còn hạn · chưa có yêu cầu chờ · gói cao hơn ──
  const { data: hsArr } = await admin.from("profiles").select("tao_ho,vao_chinh_thuc_luc").eq("id", user.id).limit(1);
  if (!laChuThat(hsArr?.[0])) return loi("Tài khoản chưa kích hoạt — chưa nâng gói được.", 403);
  if (details.nang_cho) return loi("Tin này đang có yêu cầu nâng gói chờ duyệt.");
  if (!tinNangDuoc(tin)) return loi("Tin này không Up được (tin chưa hiện hoặc đã hết hạn).");
  const days = Number(body.days);

  const { data: sc } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  const bang = ghepBillingLuu(sc?.[0]?.data as Partial<BillingData> | undefined);
  // UP TIN = CHỌN LẠI GÓI (06/11/2026): gói mới phải có giá cao hơn gói đang chạy (cùng luật bảng phía khách).
  if (!body.tier || !oNangDuoc(tin, bang, body.tier, days)) return loi("Chỉ chọn gói có giá cao hơn gói đang chạy.");
  // Chữ phía khách chưa Duyệt trong Admin = chức năng chưa mở trên web (máy xem thử vẫn chạy với chữ mẫu).
  if (!((bang.congBo?.ban?.nangGoi?.length ?? 0) || (bang.congBo?.thue?.nangGoi?.length ?? 0))) return loi("Chức năng nâng gói chưa mở."); // giá Nâng gói đã Duyệt trong Admin (06/11/2026)

  const { data: hv } = await admin.from("hoi_vien").select("goi").eq("user_id", user.id).gt("het_han", new Date().toISOString()).limit(1);
  const luc = Date.now();
  const gia = giaNangGoi({
    data: bang, purpose: tin.purpose, tierMoi: body.tier, soNgay: days, goiHienTai: goiHienTai(tin),
    hoiVienId: (hv?.[0]?.goi as string | undefined) ?? null, apKhauTru: !!body.apKhauTru, luc,
  });
  if (!gia) return loi("Gói hoặc thời hạn không có trong bảng giá.");

  // ── Ví khả dụng phải đủ (như đăng tin) ────────────────────────────────────
  const vi = await viKhaDung(admin, user.id, String(tin.id));
  if (vi.khaDung < gia.tongTra) {
    return NextResponse.json({ ok: false, thieu: gia.tongTra - vi.khaDung, loi: cauThieuTien(gia.tongTra, vi, "nâng gói") }, { status: 402 });
  }

  const yeuCau: YeuCauNang = {
    tier: body.tier, days, apKhauTru: !!body.apKhauTru, khauTru: gia.khauTru,
    truocThue: gia.truocThue, tongTra: gia.tongTra, gui_luc: new Date(luc).toISOString(),
  };
  // Chỉ ghi khi tin vẫn chưa có yêu cầu (bấm hai lần / hai tab không tạo hai yêu cầu).
  const { data: ghi, error } = await admin
    .from("listings")
    .update({ details: { ...details, nang_cho: yeuCau } })
    .eq("id", tin.id)
    .is("details->nang_cho", null)
    .select("id");
  if (error) return loi(error.message, 500);
  if (!ghi?.length) return loi("Tin này đang có yêu cầu nâng gói chờ duyệt.");

  // BÁO KHÁCH "ĐÃ NHẬN YÊU CẦU UP TIN" (chủ dự án 06/11/2026: "làm thì làm cho triệt để") — email + Zalo. Zalo dùng mẫu 641611
  // "Đã nhận tin đăng chờ duyệt" (đúng nghĩa, không ô tiền); chưa có mẫu ZBS riêng cho nâng gói. Gửi hỏng không làm hỏng yêu cầu.
  try {
    const { data: hsBao } = await admin.from("profiles").select("email,phone,full_name").eq("id", user.id).limit(1);
    const ho = hsBao?.[0] as { email: string | null; phone: string | null; full_name: string | null } | undefined;
    const luc = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
    await guiThongBao({
      email: ho?.email,
      phone: ho?.phone,
      tieuDe: "Coastal Land đã nhận yêu cầu Up tin của bạn",
      loiNhan: "Yêu cầu nâng gói đang chờ kiểm duyệt. Phí đang được tạm giữ trong ví, trừ khi duyệt; nếu không duyệt, tiền tạm giữ được trả lại. Theo dõi tại coastalland.vn/tai-khoan/tin-dang.",
      cacDong: [
        { nhan: "Mã tin", giaTri: maTin(String(tin.id)) },
        { nhan: "Tin đăng", giaTri: tin.title },
        { nhan: "Gói mới", giaTri: `${getTier(body.tier).name} · ${days} ngày` },
        { nhan: "Phí (gồm VAT)", giaTri: vnd(gia.tongTra) },
      ],
      znsTemplateId: MAU_DA_NHAN_TIN,
      znsData: { ten_khach_hang: ho?.full_name || "Quý khách", ma_tin: maTin(String(tin.id)), ten_tin: tin.title, thoi_gian: luc },
    });
  } catch { /* không chặn yêu cầu đã ghi */ }
  return NextResponse.json({ ok: true, yeuCau });
}
