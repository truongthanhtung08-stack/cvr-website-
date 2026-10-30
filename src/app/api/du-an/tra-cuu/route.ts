import { NextResponse } from "next/server";
import { getListings } from "@/lib/listingsDb";
import { getProjects } from "@/lib/contentDb";
import { dongTraCuu } from "@/lib/traCuuDuAn";

// ============================================================================
// DANH BẠ TRA CỨU DỰ ÁN cho "Xem thêm" khối Dự án nổi bật TRANG CHỦ (30/10/2026) — nạp ở trình duyệt MỘT lần khi khách bấm Xem
// thêm, không nhúng sẵn vào HTML trang chủ (giữ trang chủ < 450 KB). Lưu đệm như /api/du-an/ten: 1 giờ — mỗi tháng gần như toàn
// đọc từ CDN, không thêm lượt chạy hàm đáng kể.
// ============================================================================
export const revalidate = 3600;

export async function GET() {
  const [tin, duAn] = await Promise.all([getListings(), getProjects()]);
  return NextResponse.json(dongTraCuu(tin, duAn));
}
