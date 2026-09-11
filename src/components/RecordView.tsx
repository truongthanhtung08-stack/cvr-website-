"use client";

import { useEffect } from "react";
import { recordView } from "@/lib/useRecentlyViewed";
import { createClient } from "@/lib/supabase/client";

// Ghi lại tin vừa xem (đặt trong trang chi tiết BĐS).
export default function RecordView({ id }: { id: string }) {
  useEffect(() => {
    recordView(id); // lịch sử "đã xem" (localStorage) — cho mục "Dành cho bạn"

    // Đếm LƯỢT XEM THẬT vào DB (cột listings.view_count) qua RPC increment_listing_view.
    //
    // MỖI LẦN MỞ TIN LÀ MỘT LƯỢT XEM — khách đóng rồi mở lại, hoặc hôm sau quay
    // lại xem tiếp, đều là lượt xem có thật. Trước đây chặn cứng "một lần mỗi
    // phiên trình duyệt" nên bảng người xem ghi 5 lần mà lượt xem chỉ tăng 1,
    // hai con số nói hai chuyện khác nhau.
    //
    // Vẫn phải có khoảng cách để F5 liên tục không thổi số: 30 PHÚT, đúng mốc mà
    // các công cụ thống kê vẫn dùng để tính một phiên xem mới.
    // Không await — trang không phụ thuộc kết quả; lỗi/thiếu env thì bỏ qua êm.
    try {
      const key = `cl_viewed_${id}`;
      const truoc = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - truoc > 30 * 60_000) {
        sessionStorage.setItem(key, String(Date.now()));
        createClient().rpc("increment_listing_view", { p_listing_id: id });
      }

      // GHI NGƯỜI XEM — thành viên đăng nhập mở tin ra thì người bán biết được
      // ai đang quan tâm, chứ không chỉ biết mỗi nhóm đã bấm "hiện số" (nhóm đó
      // rất nhỏ). Hàm tự đọc phiên đăng nhập ở máy chủ: chưa đăng nhập, tin chưa
      // duyệt, hoặc chính chủ tin đang xem lại thì nó tự bỏ qua.
      //
      // Gọi MỖI LẦN MỞ TIN, không chặn theo phiên như lượt xem ở trên: bảng đếm
      // luôn số lần xem trong ngày — khách quay lại tin nhiều lần là dấu hiệu
      // quan tâm thật, người bán cần thấy điều đó.
      createClient().rpc("ghi_nguoi_xem", { p_listing_id: id });
    } catch {
      /* thiếu env / RPC chưa có → không sao, chỉ là đếm xem */
    }
  }, [id]);
  return null;
}
