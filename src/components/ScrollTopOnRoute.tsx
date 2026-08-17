"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// ════════════════════════════════════════════════════════════════════════════
// VỊ TRÍ CUỘN — cơ chế chuẩn của một website: nhớ vị trí theo TỪNG TRANG trong
// lịch sử, và xử lý khác nhau theo cách người dùng tới trang đó.
//
//   Mở trang mới (bấm link, bấm Tìm)      → về ĐẦU trang
//   Tải lại trang (F5, kéo xuống làm mới)  → về ĐÚNG chỗ đang đọc
//   Bấm Quay lại / Tiến tới của trình duyệt → về ĐÚNG chỗ đã đọc ở trang đó
//
// Vì sao phải tự làm: ta buộc phải đặt scrollRestoration = "manual" (không thì
// mở trang mới sẽ rơi vào giữa trang). Nhưng giá trị này lưu theo mục lịch sử,
// nên F5 và Quay lại cũng dính "manual" → trình duyệt thôi khôi phục. Do đó ta
// tự ghi nhớ và tự cuộn lại.
// ════════════════════════════════════════════════════════════════════════════
const KEY = "cvr_vi_tri_cuon";
const TOI_DA = 30; // nhớ 30 trang gần nhất, tránh phình bộ nhớ phiên

type BanDo = Record<string, number>;

// Địa chỉ hiện tại KÈM tham số lọc — /mua-ban?tinh=Huế khác /mua-ban
const diaChi = () => window.location.pathname + window.location.search;

function docBanDo(): BanDo {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || "{}");
    return v && typeof v === "object" ? (v as BanDo) : {};
  } catch {
    return {};
  }
}

function ghiViTri(url: string, y: number) {
  try {
    const bd = docBanDo();
    bd[url] = y;
    const keys = Object.keys(bd);
    // Quá số trang cho phép → bỏ bớt mục cũ nhất (đứng đầu object)
    if (keys.length > TOI_DA) for (const k of keys.slice(0, keys.length - TOI_DA)) delete bd[k];
    sessionStorage.setItem(KEY, JSON.stringify(bd));
  } catch {
    /* chế độ riêng tư chặn sessionStorage → bỏ qua, không làm hỏng trang */
  }
}

export default function ScrollTopOnRoute() {
  const pathname = usePathname();
  const lanDau = useRef(true);
  const quayLai = useRef(false); // vừa bấm Quay lại / Tiến tới trong web

  // Bắt nút Quay lại / Tiến tới (điều hướng trong web, không tải lại trang)
  useEffect(() => {
    const onPop = () => {
      quayLai.current = true;
      // Cờ chỉ có hiệu lực cho lần đổi trang NGAY SAU ĐÓ. Nếu quay lại mà địa chỉ
      // không đổi (chỉ đổi bộ lọc) thì tự xoá, tránh dính sang cú bấm link kế tiếp.
      window.setTimeout(() => { quayLai.current = false; }, 400);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";

    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    // "reload" = F5 · "back_forward" = mở lại từ lịch sử (tải cả trang)
    const taiLaiTrang = nav?.type === "reload" || nav?.type === "back_forward";
    const dauTien = lanDau.current;
    lanDau.current = false;

    const nenKhoiPhuc = (dauTien && taiLaiTrang) || quayLai.current;
    quayLai.current = false;

    if (nenKhoiPhuc) {
      const y = docBanDo()[diaChi()] ?? 0;
      if (y > 0) {
        // Cuộn lại nhiều nhịp: ngay → khung hình kế → khi ảnh tải xong.
        // Ảnh vào muộn làm trang cao lên, cuộn một nhịp thường bị lệch.
        const ve = () => window.scrollTo(0, y);
        ve();
        requestAnimationFrame(ve);
        const hen1 = window.setTimeout(ve, 120);
        const hen2 = window.setTimeout(ve, 400);
        window.addEventListener("load", ve, { once: true });
        return () => {
          window.clearTimeout(hen1);
          window.clearTimeout(hen2);
          window.removeEventListener("load", ve);
        };
      }
      return; // chưa có vị trí đã lưu → để nguyên, không giật lên đầu
    }

    window.scrollTo({ top: 0 }); // mở trang mới → đầu trang
  }, [pathname]);

  // Ghi nhớ vị trí đang đọc theo nhịp cuộn (gộp bằng rAF cho nhẹ). Ghi liên tục
  // chứ không chỉ lúc rời trang, vì trên điện thoại sự kiện rời trang hay không kịp chạy.
  useEffect(() => {
    let cho = false;
    const luu = () => {
      if (cho) return;
      cho = true;
      requestAnimationFrame(() => {
        cho = false;
        ghiViTri(diaChi(), window.scrollY);
      });
    };
    window.addEventListener("scroll", luu, { passive: true });
    window.addEventListener("pagehide", luu);
    return () => {
      window.removeEventListener("scroll", luu);
      window.removeEventListener("pagehide", luu);
    };
  }, [pathname]);

  return null;
}
