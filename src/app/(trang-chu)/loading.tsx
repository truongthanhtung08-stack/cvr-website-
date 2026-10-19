import PageSkeleton from "@/components/PageSkeleton";

// Khung chờ TRANG CHỦ — hiện ngay khi bấm logo / tab "Trang chủ",
// trong lúc máy chủ đang đọc tin + dự án + tin tức từ Supabase.
// 20/10/2026: chuyển từ src/app/loading.tsx vào nhóm (trang-chu) — để ở gốc thì nó bọc MỌI trang, trang gửi trước khi biết
// bài/tin có tồn tại → bài, tin đã xoá trả mã 200 "Không tìm thấy" (soft 404). Nay chỉ trang chủ dùng khung này.
// trong lúc máy chủ đang đọc tin + dự án + tin tức từ Supabase.
export default function Loading() {
  return <PageSkeleton banner="h-[320px] sm:h-[520px]" cards={4} />;
}
