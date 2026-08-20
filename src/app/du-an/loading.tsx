import PageSkeleton from "@/components/PageSkeleton";

// Khung chờ trang Dự án — có banner đầu trang như trang thật.
export default function Loading() {
  return <PageSkeleton banner="h-[190px] sm:h-[400px]" cards={8} />;
}
