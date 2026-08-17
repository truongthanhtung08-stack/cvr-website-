"use client";

import { useEffect, useState } from "react";
import type { Listing } from "@/lib/data";
import { getListingsByIds } from "@/lib/listingsDb";

// Tra TIN THẬT từ Supabase theo danh sách id lưu trong máy (localStorage).
// Dùng cho "Tin đã lưu" (/tin-luu) và "So sánh" (/so-sanh, thanh so sánh nổi).
// Trước đây 2 mục này tra trong dữ liệu mẫu nên tin thật lưu xong lại không hiện.
export function useListingsByIds(ids: string[]): { items: Listing[]; loading: boolean } {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  // Chuỗi hoá để useEffect không chạy lại mỗi lần mảng ids được tạo mới.
  const key = ids.join(",");

  useEffect(() => {
    if (!key) {
      setItems([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    getListingsByIds(key.split(",")).then((rows) => {
      if (!alive) return;
      setItems(rows);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [key]);

  return { items, loading };
}
