import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BILLING_DEFAULT, vnd, type BillingData } from "@/lib/billing";
import { guiThongBao } from "@/lib/thongBao";

// ============================================================================
// ĐỔI ĐIỂM THƯỞNG RA SỐ DƯ VÍ
// ----------------------------------------------------------------------------
// Trước đây trang /tai-khoan/doi-diem bấm nút chỉ hiện chữ "đã gửi yêu cầu" mà
// không ghi đi đâu — khách chờ mãi không được cộng tiền. Route này làm thật.
//
// NGUYÊN TẮC TIỀN:
//   · Tỷ lệ quy đổi và mức tối thiểu lấy từ bảng giá admin (site_content), KHÔNG
//     nhận số tiền từ trình duyệt gửi lên — nhận là ai cũng tự khai tiền.
//   · Trừ điểm và cộng ví nằm trong MỘT lệnh SQL (hàm doi_diem, migration 0029)
//     nên không có chuyện mất điểm mà không được tiền.
// ============================================================================
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Chưa đăng nhập", 401);

  const { diem } = (await request.json().catch(() => ({}))) as { diem?: number };
  const soDiem = Math.floor(Number(diem) || 0);
  if (soDiem <= 0) return loi("Số điểm không hợp lệ", 400);

  const admin = createAdminClient();
  if (!admin) return loi("Máy chủ chưa cấu hình đủ để đổi điểm.", 500);

  // Chính sách điểm: bản chủ dự án đã đặt trong admin, chưa đặt → mức chuẩn
  const { data: sc } = await admin.from("site_content").select("data").eq("key", "billing").limit(1);
  const luu = sc?.[0]?.data as Partial<BillingData> | undefined;
  const bang: BillingData = { ...BILLING_DEFAULT, ...(luu ?? {}) };
  const cfg = bang.points;

  if (!cfg.active) return loi("Chương trình điểm thưởng đang tạm dừng.", 400);
  if (soDiem < cfg.minRedeem) return loi(`Cần tối thiểu ${cfg.minRedeem} điểm mỗi lần đổi.`, 400);

  // SỐ TIỀN DO MÁY CHỦ TÍNH, không lấy từ trình duyệt
  const soTien = soDiem * cfg.redeemRate;
  if (soTien <= 0) return loi("Tỷ lệ quy đổi chưa được cấu hình.", 400);

  const { data: kq, error: loiRpc } = await admin.rpc("doi_diem", {
    p_user: user.id,
    p_diem: soDiem,
    p_tien: soTien,
  });
  if (loiRpc) {
    return /function .* does not exist|schema cache|PGRST202/i.test(loiRpc.message)
      ? loi("Chức năng đổi điểm chưa được bật trên hệ thống. Vui lòng thử lại sau.", 503)
      : loi(loiRpc.message, 500);
  }

  const dong = (kq as { diem_con?: number; so_du?: number }[] | null)?.[0];
  // Không đổi được dòng nào = không đủ điểm (điểm đã đổi ở tab khác chẳng hạn)
  if (!dong) return loi("Số điểm không đủ để đổi.", 400);

  // Báo cho khách — cùng kiểu với thông báo nạp tiền
  const { data: hsArr } = await admin
    .from("profiles")
    .select("email,phone,full_name")
    .eq("id", user.id)
    .limit(1);
  const hs = hsArr?.[0] as { email: string | null; phone: string | null; full_name: string | null } | undefined;
  await guiThongBao({
    email: hs?.email,
    phone: hs?.phone,
    tieuDe: "Đã đổi điểm thưởng vào ví",
    loiNhan: `Coastal Land đã cộng tiền đổi điểm cho ${hs?.full_name || "quý khách"}.`,
    cacDong: [
      { nhan: "Điểm đã đổi", giaTri: `${soDiem} điểm` },
      { nhan: "Số tiền nhận", giaTri: vnd(soTien) },
      { nhan: "Số dư hiện tại", giaTri: vnd(Number(dong.so_du ?? 0)) },
    ],
  });

  return NextResponse.json({
    ok: true,
    diemDaDoi: soDiem,
    soTien,
    diemConLai: Number(dong.diem_con ?? 0),
    soDuMoi: Number(dong.so_du ?? 0),
  });
}

function loi(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}
