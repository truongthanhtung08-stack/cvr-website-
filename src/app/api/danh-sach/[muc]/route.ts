import { NextResponse } from "next/server";
import { getListings, getListingsHetHan } from "@/lib/listingsDb";
import { goiNheTin, goiNheHetHan } from "@/lib/goiNhe";

// ============================================================================
// DỮ LIỆU TIN CHO TRANG DANH SÁCH — nạp MỘT lần ở trình duyệt (SEO, 15/10/2026)
// ----------------------------------------------------------------------------
// Trước đây mỗi trang /mua-ban, /mua-ban/<tỉnh>, /mua-ban/<loại>… nhét TOÀN BỘ dữ liệu tin
// vào HTML (780–830KB/trang). Google đọc ít trang mỗi lượt → 202 trang "đã phát hiện – chưa
// lập chỉ mục". Giờ HTML chỉ còn khung + danh sách link tin; dữ liệu cho bộ lọc nạp từ đây.
// Cùng một địa chỉ cho mọi trang cùng mục đích → CDN và trình duyệt dùng lại, không tải lại.
// Cache theo thẻ "listings" (1 giờ + xoá ngay khi tin đổi thật) — đúng quy tắc chi phí Vercel.
// ============================================================================

export const revalidate = 3600;

export function generateStaticParams() {
  return [{ muc: "ban" }, { muc: "thue" }];
}

export async function GET(_req: Request, { params }: { params: Promise<{ muc: string }> }) {
  const { muc } = await params;
  if (muc !== "ban" && muc !== "thue") return NextResponse.json({ loi: "muc" }, { status: 404 });
  const [tin, hetHan] = await Promise.all([getListings(), getListingsHetHan()]);
  return NextResponse.json({
    tin: goiNheTin(tin.filter((l) => ((l.purpose ?? "ban") === "thue" ? "thue" : "ban") === muc)),
    hetHan: goiNheHetHan(hetHan, muc),
  });
}
