import { NextResponse } from "next/server";
import { getListingsHetHan } from "@/lib/listingsDb";

// TIN ĐÃ HẾT HẠN cho danh sách nạp ở trình duyệt (ô "Xem thêm" trang chủ, tin tương tự…):
// những chỗ đó không nhận tin hết hạn từ máy chủ nên tự gọi đây khi mở danh sách.
// Cùng nguồn getListingsHetHan (cache thẻ "listings") với trang Mua bán / Cho thuê.
export async function GET() {
  return NextResponse.json(await getListingsHetHan());
}
