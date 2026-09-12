import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ════════════════════════════════════════════════════════════════════════════
// LÀM MỚI WEB SAU KHI ADMIN SỬA NỘI DUNG
//
// VÌ SAO CẦN: nguyên tắc SẮT của dự án là "sửa trong admin thì web hiện NGAY".
// Trước đây giữ nguyên tắc đó bằng cách đặt `cache: "no-store"` cho mọi lượt đọc
// Supabase — đúng nhưng đắt: KHÔNG lượt khách nào được dùng lại, mỗi người vào
// trang chủ là máy chủ ở Tokyo phải dựng lại trang từ đầu rồi đẩy nguyên trang
// ra cho họ. Đo 12/09/2026: khách chờ 500–600 ms, và Fast Origin Transfer của
// Vercel đã vượt trần miễn phí (16,86 GB / 10 GB) chính vì chuyện đẩy lại này.
//
// Cách làm đúng: cho phép cache, nhưng ADMIN LƯU LÀ XOÁ CACHE NGAY. Người xem
// vẫn thấy thay đổi tức thì, mà khách lạ thì được phục vụ bản dựng sẵn.
//
// Trang /admin/noi-dung (và các trang admin khác) ghi thẳng vào Supabase từ
// TRÌNH DUYỆT, không đi qua máy chủ — nên không có chỗ nào gọi revalidateTag
// được. Route này là mắt xích đó: admin lưu xong thì gọi sang đây một tiếng.
//
// Thẻ đang dùng trong web:
//   · "listings"  — tin đăng      (src/lib/listingsDb.ts, route duyệt tin tự gọi)
//   · "noi-dung"  — nội dung admin: hero, banner, khu vực, giới thiệu, bài viết,
//                   dự án (src/lib/contentDb.ts + src/lib/siteContent.ts)
// ════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

const THE_HOP_LE = ["listings", "noi-dung"] as const;
type The = (typeof THE_HOP_LE)[number];

export async function POST(request: Request) {
  // Chỉ admin — kẻo ai cũng gọi được để ép máy chủ dựng lại trang liên tục.
  const ssr = await createClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, message: "Chưa đăng nhập" }, { status: 401 });
  const { data: me } = await ssr.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin")
    return NextResponse.json({ ok: false, message: "Chỉ quản trị viên" }, { status: 403 });

  const { the } = (await request.json().catch(() => ({}))) as { the?: string };
  // Không nói rõ thẻ nào thì xoá hết — admin sửa gì cũng hiện ngay, không sợ sót.
  const danhSach: The[] = the && (THE_HOP_LE as readonly string[]).includes(the) ? [the as The] : [...THE_HOP_LE];
  // "max" = xoá ở mọi tầng cache kể cả CDN, giống route duyệt tin đang dùng.
  for (const t of danhSach) revalidateTag(t, "max");

  return NextResponse.json({ ok: true, da_lam_moi: danhSach });
}
