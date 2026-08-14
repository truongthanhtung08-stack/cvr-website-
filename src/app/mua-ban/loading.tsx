import PageSkeleton from "@/components/PageSkeleton";

// Khung chờ trang Nhà đất bán — không có banner, vào thẳng thanh lọc + lưới tin.
export default function Loading() {
  return <PageSkeleton banner="" cards={8} />;
}
