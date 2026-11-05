"use client";

import { useEffect, useState } from "react";
import { napSupabase } from "@/lib/supabase/nap";

// ============================================================================
// CHẤM ĐỎ "VIỆC CẦN KHÁCH XEM" — đúng mục của nó (chủ dự án 06/11/2026: "khách vào lại phải nhìn thấy thông báo" · "hiện đúng
// chỗ nó cần" · "không chỉ là tin mà còn cả số dư… những cái cần như vậy"):
//   /tai-khoan/tin-dang   tin chờ duyệt · bị từ chối (phải sửa) · đang đăng còn ≤ 3 ngày là hết hạn
//   /tai-khoan/nap-tien   tin đang chờ nạp tiền mới gửi duyệt được (up_cho)
//   /tai-khoan/hoi-vien   gói hội viên còn ≤ 7 ngày là hết hạn
//   /tai-khoan/khach-hang người quan tâm MỚI từ lần khách mở mục Khách hàng gần nhất (mốc lưu trong máy khách)
// Đọc bằng phiên của chính khách (RLS — chỉ dữ liệu của mình). Vài lệnh đếm nhẹ mỗi lần đổi trang trong khu tài khoản.
// ============================================================================
const KHOA_XEM_KHACH = "cl-xem-khach-hang-luc";

export function useSoViecKhach(userId: string | null | undefined, pathname: string): Record<string, number> {
  const [so, setSo] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!userId) return;
    // Đang mở mục Khách hàng = đã xem → ghi mốc, chấm đỏ mục này về 0
    if (pathname.startsWith("/tai-khoan/khach-hang")) { try { localStorage.setItem(KHOA_XEM_KHACH, new Date().toISOString()); } catch {} }
    let huy = false;
    void napSupabase().then(async (sb) => {
      const bay = new Date();
      const sau = (ngay: number) => new Date(bay.getTime() + ngay * 86_400_000).toISOString();
      const dem = async (q: PromiseLike<{ count: number | null; error: unknown }>) => { const r = await q; return r.error ? 0 : r.count ?? 0; };
      let moc = "";
      try { moc = localStorage.getItem(KHOA_XEM_KHACH) || ""; } catch {}
      const { data: tinCua } = await sb.from("listings").select("id").eq("owner_id", userId).neq("status", "deleted").limit(1000);
      const ids = (tinCua ?? []).map((t) => t.id as string);
      const [cho, tuChoi, sapHet, choNap, hoiVien, quanTam] = await Promise.all([
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "pending")),
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "rejected")),
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "approved").gt("tier_expires_at", bay.toISOString()).lte("tier_expires_at", sau(3))),
        dem(sb.from("up_cho").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("trang_thai", "cho")),
        dem(sb.from("hoi_vien").select("id", { count: "exact", head: true }).eq("user_id", userId).gt("het_han", bay.toISOString()).lte("het_han", sau(7))),
        ids.length && moc
          ? dem(sb.from("listing_leads").select("id", { count: "exact", head: true }).in("listing_id", ids).gt("created_at", moc))
          : Promise.resolve(0),
      ]);
      if (!huy) setSo({
        "/tai-khoan/tin-dang": cho + tuChoi + sapHet,
        "/tai-khoan/nap-tien": choNap,
        "/tai-khoan/hoi-vien": hoiVien,
        "/tai-khoan/khach-hang": pathname.startsWith("/tai-khoan/khach-hang") ? 0 : quanTam,
      });
    });
    return () => { huy = true; };
  }, [userId, pathname]);
  return so;
}

/** Chấm đỏ kèm số — dùng chung cho menu khu tài khoản (máy tính) và thanh dưới điện thoại */
export function nhanSoDo(n: number): string {
  return n > 99 ? "99+" : String(n);
}
