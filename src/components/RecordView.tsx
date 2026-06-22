"use client";

import { useEffect } from "react";
import { recordView } from "@/lib/useRecentlyViewed";

// Ghi lại tin vừa xem (đặt trong trang chi tiết BĐS).
export default function RecordView({ id }: { id: string }) {
  useEffect(() => {
    recordView(id);
  }, [id]);
  return null;
}
