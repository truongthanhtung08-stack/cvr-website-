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
const KHOA_XEM_KHACH = "xem_khach_hang_luc";

// DÙNG CHUNG MỌI NƠI (chủ dự án 06/11/2026: "tài khoản dùng chung hết nên bất kỳ ở đâu cũng thấy khi đăng nhập vào, cả trên
// mobile"): đầu trang (ảnh đại diện), thanh dưới điện thoại, cột trái khu tài khoản. Ba chỗ cùng gọi → MỘT lượt đếm mỗi lần đổi
// trang (bộ nhớ chung theo tài khoản + trang), không đếm ba lần.
let boNho: { khoa: string; hua: Promise<Record<string, number>> } | null = null;

export function useSoViecKhach(userId: string | null | undefined, pathname: string): Record<string, number> {
  const [so, setSo] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!userId) return;
    let huy = false;
    const khoa = `${userId}|${pathname}`;
    if (!boNho || boNho.khoa !== khoa) boNho = { khoa, hua: demViec(userId, pathname) };
    void boNho.hua.then((kq) => { if (!huy) setSo(kq); }, () => {});
    return () => { huy = true; };
  }, [userId, pathname]);
  return so;
}

/** Tổng chấm đỏ (ảnh đại diện đầu trang, nút Tài khoản thanh dưới) */
export function tongSoViec(so: Record<string, number>): number {
  return Object.values(so).reduce((a, b) => a + b, 0);
}

async function demViec(userId: string, pathname: string): Promise<Record<string, number>> {
  return napSupabase().then(async (sb) => {
      const bay = new Date();
      const sau = (ngay: number) => new Date(bay.getTime() + ngay * 86_400_000).toISOString();
      const dem = async (q: PromiseLike<{ count: number | null; error: unknown }>) => { const r = await q; return r.error ? 0 : r.count ?? 0; };
      // MỐC "ĐÃ XEM KHÁCH HÀNG" NẰM TRÊN TÀI KHOẢN (user_metadata), không trong từng máy — một tài khoản thì máy nào, cách đăng
      // nhập nào cũng thấy giống nhau (chủ dự án 06/11/2026). Đang mở mục Khách hàng = đã xem → ghi mốc mới lên tài khoản.
      const { data: { user: u } } = await sb.auth.getUser();
      let moc = String((u?.user_metadata as Record<string, unknown> | undefined)?.[KHOA_XEM_KHACH] ?? "");
      if (pathname.startsWith("/tai-khoan/khach-hang")) {
        moc = new Date().toISOString();
        await sb.auth.updateUser({ data: { [KHOA_XEM_KHACH]: moc } }).then(() => {}, () => {});
      }
      if (!moc) moc = new Date(Date.now() - 7 * 86_400_000).toISOString(); // chưa mở lần nào → người quan tâm 7 ngày gần nhất
      const { data: tinCua } = await sb.from("listings").select("id").eq("owner_id", userId).neq("status", "deleted").limit(1000);
      const ids = (tinCua ?? []).map((t) => t.id as string);
      const [cho, tuChoi, sapHet, choNap, hoiVien, quanTam] = await Promise.all([
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "pending")),
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "rejected")),
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "approved").gt("tier_expires_at", bay.toISOString()).lte("tier_expires_at", sau(3))),
        dem(sb.from("up_cho").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("trang_thai", "cho")),
        dem(sb.from("hoi_vien").select("id", { count: "exact", head: true }).eq("user_id", userId).gt("het_han", bay.toISOString()).lte("het_han", sau(7))),
        ids.length
          ? dem(sb.from("listing_leads").select("id", { count: "exact", head: true }).in("listing_id", ids).gt("created_at", moc))
          : Promise.resolve(0),
      ]);
      return {
        "/tai-khoan/tin-dang": cho + tuChoi + sapHet,
        "/tai-khoan/nap-tien": choNap,
        "/tai-khoan/hoi-vien": hoiVien,
        "/tai-khoan/khach-hang": pathname.startsWith("/tai-khoan/khach-hang") ? 0 : quanTam,
      };
  });
}

/** Chấm đỏ kèm số — dùng chung cho menu khu tài khoản (máy tính) và thanh dưới điện thoại */
export function nhanSoDo(n: number): string {
  return n > 99 ? "99+" : String(n);
}
