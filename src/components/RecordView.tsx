"use client";

import { useEffect } from "react";
import { recordView } from "@/lib/useRecentlyViewed";
import { createClient } from "@/lib/supabase/client";

// Ghi lại tin vừa xem (đặt trong trang chi tiết BĐS).
export default function RecordView({ id }: { id: string }) {
  useEffect(() => {
    recordView(id); // lịch sử "đã xem" (localStorage) — cho mục "Dành cho bạn"

    // Đếm LƯỢT XEM THẬT vào DB (cột listings.view_count) qua RPC increment_listing_view.
    // Mỗi phiên trình duyệt chỉ tính 1 lần/tin để không thổi phồng con số cho người bán.
    // Không await — trang không phụ thuộc kết quả; lỗi/thiếu env thì bỏ qua êm.
    try {
      const key = `cl_viewed_${id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        createClient().rpc("increment_listing_view", { p_listing_id: id });
      }
    } catch {
      /* thiếu env / RPC chưa có → không sao, chỉ là đếm xem */
    }
  }, [id]);
  return null;
}
