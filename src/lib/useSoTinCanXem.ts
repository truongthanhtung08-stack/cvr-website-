"use client";

import { useEffect, useState } from "react";
import { napSupabase } from "@/lib/supabase/nap";

// ============================================================================
// SỐ TIN CẦN KHÁCH XEM — chấm đỏ ngay trên mục "Tin đăng" (chủ dự án 06/11/2026: "khách vào lại phải nhìn thấy thông báo" ·
// "hiện đúng chỗ nó cần"): tin đang chờ duyệt · bị từ chối (phải sửa) · đang đăng mà còn ≤ 3 ngày là hết hạn.
// Đọc bằng phiên của chính khách (RLS — chỉ tin của mình). 3 lệnh đếm nhẹ mỗi lần đổi trang trong khu tài khoản.
// ============================================================================
export function useSoTinCanXem(userId: string | null | undefined, pathname: string): number {
  const [so, setSo] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let huy = false;
    void napSupabase().then(async (sb) => {
      const sau3Ngay = new Date(Date.now() + 3 * 86_400_000).toISOString();
      const bay = new Date().toISOString();
      const dem = async (q: PromiseLike<{ count: number | null; error: unknown }>) => { const r = await q; return r.error ? 0 : r.count ?? 0; };
      const [cho, tuChoi, sapHet] = await Promise.all([
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "pending")),
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "rejected")),
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "approved").gt("tier_expires_at", bay).lte("tier_expires_at", sau3Ngay)),
      ]);
      if (!huy) setSo(cho + tuChoi + sapHet);
    });
    return () => { huy = true; };
  }, [userId, pathname]);
  return so;
}

/** Chấm đỏ kèm số — dùng chung cho menu khu tài khoản (máy tính) và thanh dưới điện thoại */
export function nhanSoDo(n: number): string {
  return n > 99 ? "99+" : String(n);
}
