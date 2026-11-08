"use client";

import { useEffect } from "react";

// Đăng ký service worker (public/sw.js) — thứ biến web thành "app cài được":
// mở nhanh hơn, mất mạng vẫn có trang báo tử tế.
//
// CHỈ chạy ở bản thật (production). Ở máy phát triển, service worker giữ lại
// file cũ làm sửa code xong không thấy đổi — đúng cái bẫy đã mất nhiều thời gian.
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    // CHỈ WEB THẬT (anh 08/11/2026: "F5 rất nhiều lần vẫn không có thay đổi"): bản build chạy xem thử (link 192.168.x.x, localhost) cũng là
    // "production" → service worker giữ bản cũ trên điện thoại anh đang kiểm. Ngoài coastalland.vn: gỡ service worker + xoá đệm, không đăng ký.
    if (window.location.hostname !== "coastalland.vn") {
      navigator.serviceWorker.getRegistrations().then((ds) => ds.forEach((r) => r.unregister())).catch(() => {});
      if ("caches" in window) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {});
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        // Có bản mới → nhận việc ngay, người dùng không kẹt ở phiên bản cũ.
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              sw.postMessage("skip-waiting");
            }
          });
        });
      }).catch(() => {
        // Trình duyệt chặn hoặc không hỗ trợ — web vẫn chạy bình thường, bỏ qua.
      });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
