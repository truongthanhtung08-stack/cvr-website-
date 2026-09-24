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
        // Kèm THIẾT BỊ + NGUỒN để người đăng tin thấy từng lượt xem ra sao
        // (0036). Không gửi gì định danh người xem — ẩn danh vẫn là ẩn danh.
        // Supabase chưa chạy 0036 thì hàm chưa nhận 3 tham số → lỗi PGRST202;
        // khi đó gửi lại kiểu cũ để KHÔNG MẤT lượt xem nào trong lúc chuyển.
        const sb = createClient();
        sb.rpc("increment_listing_view", { p_listing_id: id, p_thiet_bi: thietBi(), p_nguon: nguonDen() })
          .then(({ error }) => { if (error) sb.rpc("increment_listing_view", { p_listing_id: id }); });
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

// Điện thoại hay máy tính — chỉ để người đăng tin biết khách xem bằng gì.
function thietBi(): "dien_thoai" | "may_tinh" {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "dien_thoai" : "may_tinh";
}

// Khách tới tin này từ đâu. Ưu tiên utm_source (link mình tự rải có gắn nhãn),
// sau đó tới trang giới thiệu (referrer), cuối cùng là trình duyệt nhúng trong
// app Zalo/Facebook (mở link trong app thì referrer thường trống).
function nguonDen(): "google" | "zalo" | "facebook" | "khac" | "truc_tiep" | "trong_web" {
  const utm = new URLSearchParams(location.search).get("utm_source")?.toLowerCase() ?? "";
  const ua = navigator.userAgent;
  const ref = document.referrer;
  let host = "";
  try { host = ref ? new URL(ref).hostname : ""; } catch { /* referrer lạ → bỏ qua */ }
  if (/google/.test(utm) || /(^|\.)google\./.test(host)) return "google";
  if (/zalo/.test(utm) || /zalo/.test(host) || /Zalo/i.test(ua)) return "zalo";
  if (/facebook|fb/.test(utm) || /facebook\.|fb\.|messenger\./.test(host) || /FBAN|FBAV|FB_IAB/.test(ua)) return "facebook";
  if (host && host === location.hostname) return "trong_web";
  if (!host) return "truc_tiep";
  return "khac";
}
