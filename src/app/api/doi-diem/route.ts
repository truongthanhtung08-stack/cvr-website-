import { NextResponse } from "next/server";

// ĐÃ KHOÁ 25/09/2026. Điểm thưởng bỏ, thay bằng Gói hội viên (voucher trừ thẳng
// vào giá). Hàm cũ cộng tiền đổi từ điểm vào CHÍNH SỐ DƯ VÍ — tiền tặng lẫn với
// tiền khách nạp thật thì doanh thu và hoá đơn sai. Không mở lại kiểu đó: ưu đãi
// nào sau này cũng phải trừ vào giá lúc thu, hoặc nằm ở tài khoản khuyến mãi RIÊNG.
export async function POST() {
  return NextResponse.json({ ok: false, loi: "Điểm thưởng đã được thay bằng Gói hội viên." }, { status: 410 });
}
