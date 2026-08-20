import PageSkeleton from "@/components/PageSkeleton";

// Khung chờ TRANG CHỦ — hiện ngay khi bấm logo / tab "Trang chủ",
// trong lúc máy chủ đang đọc tin + dự án + tin tức từ Supabase.
export default function Loading() {
  // Khung chờ để TRÙNG tỷ lệ Hero thật (2:1) — lệch thì trang "nhảy" một nhịp khi ảnh thật vào chỗ.
  return <PageSkeleton banner="aspect-[2/1]" cards={4} />;
}
