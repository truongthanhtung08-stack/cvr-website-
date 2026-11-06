"use client";

import { useEffect, useState } from "react";
import { napSupabase } from "@/lib/supabase/nap";

// ============================================================================
// CHẤM ĐỎ "VIỆC CẦN KHÁCH XEM" — đúng mục của nó (chủ dự án 06/11/2026: "khách vào lại phải nhìn thấy thông báo" · "hiện đúng
// chỗ nó cần" · "không chỉ là tin mà còn cả số dư… những cái cần như vậy"):
//   /tai-khoan/tin-dang   tin chờ duyệt · bị từ chối (phải sửa) · đang đăng còn ≤ 3 ngày là hết hạn · Admin ẩn
//                         + tin vừa duyệt / Up được duyệt · Up bị từ chối (báo một lần, mở mục là tắt)
//   /tai-khoan/nap-tien   tin đang chờ nạp tiền mới gửi duyệt được (up_cho — gồm tự đăng lại mà ví thiếu)
//                         + nạp tiền thành công (báo một lần, mở mục là tắt)
//   /tai-khoan/hoi-vien   gói hội viên còn ≤ 7 ngày là hết hạn
//   /tai-khoan/khach-hang người quan tâm MỚI từ lần khách mở mục Khách hàng gần nhất (mốc lưu trong máy khách)
// Đọc bằng phiên của chính khách (RLS — chỉ dữ liệu của mình). Vài lệnh đếm nhẹ mỗi lần đổi trang trong khu tài khoản.
// ============================================================================
const KHOA_XEM_KHACH = "xem_khach_hang_luc";
const KHOA_XEM_TIN = "xem_tin_dang_luc"; // mốc đã xem mục Tin đăng (tin vừa duyệt · Up bị từ chối)
const KHOA_XEM_NAP = "xem_tong_nap"; // tổng đã nạp khách đã thấy (nạp tiền thành công)

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
      // TIN BÁO MỘT LẦN (chủ dự án 06/11/2026: "khách vào là hết, theo chuẩn") — khác các việc phải làm ở trên (từ chối, chờ nạp…
      // tắt khi khách xử lý xong): tin vừa duyệt / Up được duyệt · Up bị từ chối → tắt khi khách mở mục Tin đăng; nạp tiền thành
      // công → tắt khi khách mở mục Ví. Mốc đã xem nằm trên tài khoản như mốc Khách hàng.
      const md = (u?.user_metadata ?? {}) as Record<string, unknown>;
      let mocTin = String(md[KHOA_XEM_TIN] ?? "");
      if (pathname.startsWith("/tai-khoan/tin-dang")) {
        mocTin = new Date().toISOString();
        await sb.auth.updateUser({ data: { [KHOA_XEM_TIN]: mocTin } }).then(() => {}, () => {});
      }
      if (!mocTin) mocTin = new Date(Date.now() - 7 * 86_400_000).toISOString();
      // Nạp tiền: so TỔNG ĐÃ NẠP (profiles.total_topup — hàm cong_vi cộng mỗi lần tiền vào ví) với số khách đã thấy.
      // Không đụng luồng tiền, không thêm bảng. Chưa có mốc → lấy số hiện tại làm mốc (không báo các lần nạp cũ).
      const { data: hs } = await sb.from("profiles").select("total_topup").eq("id", userId).maybeSingle();
      const tongNap = Number((hs as { total_topup?: number } | null)?.total_topup ?? 0);
      const daThayNap = md[KHOA_XEM_NAP] == null ? null : Number(md[KHOA_XEM_NAP]);
      if (daThayNap === null || pathname.startsWith("/tai-khoan/nap-tien")) {
        if (daThayNap !== tongNap) await sb.auth.updateUser({ data: { [KHOA_XEM_NAP]: tongNap } }).then(() => {}, () => {});
      }
      const napMoi = daThayNap !== null && !pathname.startsWith("/tai-khoan/nap-tien") && tongNap > daThayNap ? 1 : 0;
      const { data: tinCua } = await sb.from("listings").select("id").eq("owner_id", userId).neq("status", "deleted").limit(1000);
      const ids = (tinCua ?? []).map((t) => t.id as string);
      const [cho, tuChoi, sapHet, choNap, hoiVien, quanTam, biAn, vuaDuyet, upTuChoi] = await Promise.all([
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "pending")),
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "rejected")),
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "approved").gt("tier_expires_at", bay.toISOString()).lte("tier_expires_at", sau(3))),
        // Chỉ yêu cầu chờ nạp của TIN CÒN (không đếm tin đã xoá) và trong 7 ngày (quá 7 ngày máy tự huỷ — xuLyUpCho) —
        // trước đây tin xoá rồi chấm đỏ vẫn treo mãi (chủ dự án 06/11/2026: "báo xong thì phải tắt")
        ids.length
          ? dem(sb.from("up_cho").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("trang_thai", "cho")
              .in("listing_id", ids).gt("tao_luc", sau(-7)))
          : Promise.resolve(0),
        dem(sb.from("hoi_vien").select("id", { count: "exact", head: true }).eq("user_id", userId).gt("het_han", bay.toISOString()).lte("het_han", sau(7))),
        ids.length
          ? dem(sb.from("listing_leads").select("id", { count: "exact", head: true }).in("listing_id", ids).gt("created_at", moc))
          : Promise.resolve(0),
        // Tin bị ADMIN ẩn (không phải khách tự hạ) — chỉ báo trong trang tài khoản khách, không email / Zalo (chủ dự án 06/11/2026);
        // Admin hiện lại thì chấm tự tắt
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "hidden")
          .or("details->>ha_boi.is.null,details->>ha_boi.neq.khach")),
        // Tin vừa được duyệt (kể cả Up được duyệt — mốc đăng mới) từ lần khách mở Tin đăng gần nhất; tin hẹn giờ chưa tới giờ không tính
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "approved")
          .gt("published_at", mocTin).lte("published_at", bay.toISOString())),
        // Up bị từ chối (dấu details.nang_tu_choi — api/admin/nang-goi) từ lần khách mở Tin đăng gần nhất
        dem(sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId).neq("status", "deleted")
          .gt("details->nang_tu_choi->>luc", mocTin)),
      ]);
      const onTin = pathname.startsWith("/tai-khoan/tin-dang");
      return {
        "/tai-khoan/tin-dang": cho + tuChoi + sapHet + biAn + (onTin ? 0 : vuaDuyet + upTuChoi),
        "/tai-khoan/nap-tien": choNap + napMoi,
        "/tai-khoan/hoi-vien": hoiVien,
        "/tai-khoan/khach-hang": pathname.startsWith("/tai-khoan/khach-hang") ? 0 : quanTam,
      };
  });
}

/** Chấm đỏ kèm số — dùng chung cho menu khu tài khoản (máy tính) và thanh dưới điện thoại */
export function nhanSoDo(n: number): string {
  return n > 99 ? "99+" : String(n);
}
