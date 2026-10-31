import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { baoLoi } from "@/lib/baoLoi";

// ============================================================================
// TỰ ĐỘNG ĐẨY TIN VÀO KHUNG GIỜ VÀNG — chạy mỗi sáng
// ----------------------------------------------------------------------------
// Khách mua gói Up 27 lần không phải để mỗi sáng nhớ vào bấm. Tài liệu cơ chế
// cũng ghi: gói đẩy định kỳ thì hệ thống tự làm mới "theo các khung giờ vàng có
// lượng truy cập cao nhất trong ngày".
//
// KHUNG GIỜ VÀNG — chủ dự án chốt 17/09/2026: ĐẦU GIỜ SÁNG (khoảng 8h), ưu tiên
// NGÀY CUỐI TUẦN. Nên:
//   · cron chạy 8h sáng giờ VN (vercel.json để 1h UTC)
//   · tin đặt lịch 'cuoi_tuan' chỉ được đẩy vào Thứ 7 / Chủ nhật — dồn lượt vào
//     ngày đông người xem thay vì rải đều rồi hết lượt đúng lúc cần nhất.
//
// KHÔNG THU THÊM ĐỒNG NÀO: tiền đã thu lúc khách mua gói. Ở đây chỉ tiêu lượt
// trong kho. Hàm CSDL vẫn chặn 1 lượt/ngày nên khách bấm tay buổi tối rồi sáng
// sau cron chạy cũng không tiêu hai lượt trong cùng một ngày.
//
// Bảo mật: Vercel Cron tự gắn "Authorization: Bearer $CRON_SECRET".
// ============================================================================
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const khoaCron = process.env.CRON_SECRET;
  if (khoaCron && request.headers.get("authorization") !== `Bearer ${khoaCron}`) {
    return NextResponse.json({ ok: false, message: "Không có quyền" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Thiếu SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  // Thứ mấy THEO GIỜ VIỆT NAM — máy chủ Vercel chạy giờ UTC, lấy thẳng new Date()
  // là 8h sáng VN vẫn còn đang là hôm trước bên UTC, tính nhầm ngày cuối tuần.
  const gioVn = new Date(Date.now() + 7 * 3_600_000);
  const thu = gioVn.getUTCDay(); // 0 = CN, 6 = Thứ 7
  const laCuoiTuan = thu === 0 || thu === 6;

  // Tin còn lượt + bật tự động. Tin đặt lịch 'cuoi_tuan' chỉ lấy vào T7/CN.
  let truyVan = admin
    .from("listings")
    .select("id,owner_id,title,bump_lich")
    .eq("status", "approved")
    .eq("bump_auto", true)
    .gt("bump_credits", 0);
  if (!laCuoiTuan) truyVan = truyVan.eq("bump_lich", "hang_ngay");

  const { data: ds, error: loiDs } = await truyVan;
  if (loiDs) {
    return NextResponse.json({ ok: false, message: loiDs.message }, { status: 500 });
  }

  let daDay = 0;
  let boQua = 0;          // đã đẩy tay hôm nay rồi → không tiêu thêm lượt
  const hong: string[] = [];

  for (const tin of ds ?? []) {
    const { data, error } = await admin.rpc("day_tin_bang_luot", {
      p_listing: tin.id,
      p_user: tin.owner_id,
    });
    if (error) {
      hong.push(`${tin.id}: ${error.message}`);
      continue;
    }
    if ((data as unknown[] | null)?.length) daDay++;
    else boQua++;
  }

  if (daDay > 0) revalidateTag("listings", "max"); // các tin vừa lên đầu → hiện NGAY

  // Hỏng vài tin thì vẫn chạy tiếp cho tin còn lại, nhưng phải báo — khách đã
  // trả tiền cho lượt đẩy, im lặng nuốt lỗi là ăn tiền mà không giao hàng.
  if (hong.length) {
    await baoLoi({
      noi: "day-tu-dong",
      mucDo: "nang",
      tomTat: `Tự đẩy tin: ${hong.length} tin không đẩy được`,
      chiTiet: hong.slice(0, 10).join(" · "),
      hauQua: "Khách đã mua lượt đẩy nhưng hôm nay tin không được đẩy.",
      canLam: "Kiểm tra hàm day_tin_bang_luot và migration 0035.",
      khoa: `day-tu-dong:${gioVn.toISOString().slice(0, 10)}`,
    });
  }

  return NextResponse.json({
    ok: true,
    ngay: gioVn.toISOString().slice(0, 10),
    cuoiTuan: laCuoiTuan,
    xet: ds?.length ?? 0,
    daDay,
    boQua,
    hong: hong.length,
  });
}
