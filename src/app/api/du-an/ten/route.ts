import { NextResponse } from "next/server";
import { getListings } from "@/lib/listingsDb";
import { getProjects } from "@/lib/contentDb";
import { dungDsDuAn } from "@/lib/duAnTenMayChu";

// ============================================================================
// DANH MỤC TÊN DỰ ÁN CHO Ô TÌM (21/10/2026) — bảng Dự án + trường "Dự án" của tin đăng còn hạn, gộp tên trùng.
// Nạp ở trình duyệt MỘT lần khi khách bắt đầu tìm (lib/duAnTen). Lưu đệm như /api/danh-sach: 1 giờ + xoá khi tin/dự án đổi
// thật (thẻ "listings" của getListings) — mỗi tháng gần như toàn đọc từ CDN, không thêm lượt chạy hàm đáng kể.
// ============================================================================
export const revalidate = 3600;

export async function GET() {
  const [tin, duAn] = await Promise.all([getListings(), getProjects()]);
  return NextResponse.json(dungDsDuAn(tin, duAn));
}
