import PageSkeleton from "@/components/PageSkeleton";

// Khung chờ trang Dự án — có banner đầu trang như trang thật.
export default function Loading() {
  // Trùng tỷ lệ banner Dự án thật (3:1)
  return <PageSkeleton banner="aspect-[3/1]" cards={8} />;
}
