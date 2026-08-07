"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Mở BẤT KỲ trang mới nào → luôn bắt đầu từ dòng đầu tiên của trang,
// không giữ lại vị trí cuộn của trang trước.
export default function ScrollTopOnRoute() {
  const pathname = usePathname();

  useEffect(() => {
    // Tắt cơ chế nhớ vị trí cuộn của trình duyệt (nguyên nhân mở trang mới mà
    // vẫn nằm giữa trang).
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}
