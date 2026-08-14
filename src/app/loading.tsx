import PageSkeleton from "@/components/PageSkeleton";

// Khung chờ TRANG CHỦ — hiện ngay khi bấm logo / tab "Trang chủ",
// trong lúc máy chủ đang đọc tin + dự án + tin tức từ Supabase.
export default function Loading() {
  return <PageSkeleton banner="h-[320px] sm:h-[520px]" cards={4} />;
}
