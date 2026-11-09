import { datTuKhoaLoi } from "@/lib/pseo";

// CHỮ LÕI TỪ ADMIN (anh 09/11/2026: "chỉnh bảng – lưu – tải lên Admin là web tự cập nhật, không cần Push").
// Đọc site_content "tu_khoa_loi" (Admin → Từ khoá lõi ghi) → nạp vào pseo.ts. Cache thẻ "noi-dung" như mọi khối nội dung Admin:
// không gọi lại Supabase mỗi lượt xem, Admin tải tệp mới → revalidateTag("noi-dung") → trang dựng lại với chữ mới.
// Gọi ở getListings (listingsDb.ts) — mọi trang có tiêu đề pSEO đều lấy tin qua đó trước khi ghép chữ.
export async function napTuKhoaLoi(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return;
  try {
    const res = await fetch(`${url}/rest/v1/site_content?key=eq.tu_khoa_loi&select=data&limit=1`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      next: { tags: ["noi-dung"], revalidate: false },
    });
    if (!res.ok) return;
    const trang = ((await res.json()) as { data?: { trang?: Record<string, { loi?: string }> } }[])[0]?.data?.trang;
    if (trang && typeof trang === "object") datTuKhoaLoi(trang);
  } catch {
    /* lỗi mạng → giữ bản đang có */
  }
}
