"use client";

import dynamic from "next/dynamic";
import { useCompare } from "@/lib/useCompare";

// Thanh SO SÁNH nổi (III.2) — hiện khi đã chọn ≥1 tin. Phần đầy đủ (ảnh tin thật đọc từ Supabase) nằm ở CompareBarNoiDung, chỉ tải
// khi khách đã chọn tin để so sánh (tốc độ điện thoại, đo 22/10/2026): thanh này có ở MỌI trang mà đa số khách không dùng.
const NoiDung = dynamic(() => import("@/components/CompareBarNoiDung"), { ssr: false });

export default function CompareBar() {
  const { count } = useCompare();
  if (count === 0) return null;
  return <NoiDung />;
}
