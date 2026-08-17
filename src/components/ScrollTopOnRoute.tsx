"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// ════════════════════════════════════════════════════════════════════════════
// VỊ TRÍ CUỘN — cơ chế chuẩn của một website
//
//   Mở trang mới (bấm tab, bấm mục menu, bấm thẻ tin, bấm Tìm)
//        → về ĐẦU TRANG THẬT (y = 0), tức chỗ THẤY LOGO. Header là loại dính
//          (sticky) nên ở y = 0 luôn hiện đầy đủ logo + menu.
//   Địa chỉ có neo (#ket-qua, #goi-vip…)
//        → KHÔNG ép về đầu, để trang cuộn tới đúng neo đó (đây là chủ ý:
//          bấm Tìm ở trang chủ phải nhảy thẳng tới khối kết quả).
//   Tải lại trang (F5, kéo xuống làm mới)
//        → về ĐÚNG chỗ đang đọc.
//   Quay lại / Tiến tới (cả tải lại trang lẫn điều hướng trong web)
//        → về ĐÚNG chỗ đã đọc ở trang đó.
//
// Vì sao phải tự làm: ta buộc phải đặt scrollRestoration = "manual" (không thì
// mở trang mới sẽ rơi vào giữa trang). Nhưng giá trị này lưu theo mục lịch sử
// nên F5 và Quay lại cũng dính "manual" → trình duyệt thôi khôi phục. Do đó ta
// tự ghi nhớ và tự cuộn lại.
// ════════════════════════════════════════════════════════════════════════════
const KEY = "cvr_vi_tri_cuon";
const TOI_DA = 30; // nhớ 30 trang gần nhất, tránh phình bộ nhớ phiên

type BanDo = Record<string, number>;

// Địa chỉ hiện tại KÈM tham số lọc — /mua-ban?tinh=Huế khác /mua-ban
const diaChi = () => window.location.pathname + window.location.search;

// Trang đang bị khoá cuộn (đang mở bộ xem ảnh / menu toàn màn hình): lúc đó
// body ở position:fixed và scrollY = 0 → KHÔNG được ghi đè vị trí thật đã lưu.
const dangKhoaCuon = () => document.body.style.position === "fixed";

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
  const quayLai = useRef(false); // vừa bấm Quay lại / Tiến tới

  useEffect(() => {
    const onPop = () => { quayLai.current = true; };
    // Người dùng CHẠM/BẤM/GÕ PHÍM = chủ động mở trang mới → huỷ cờ quay lại.
    // Bảo đảm bấm tab hay mục menu LUÔN về đầu trang (chỗ thấy logo), không bao
    // giờ bị cờ còn sót lại làm nhảy vào giữa trang.
    const huyCo = () => { quayLai.current = false; };
    window.addEventListener("popstate", onPop);
    window.addEventListener("pointerdown", huyCo, true);
    window.addEventListener("keydown", huyCo, true);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pointerdown", huyCo, true);
      window.removeEventListener("keydown", huyCo, true);
    };
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
      if (y <= 0) return; // chưa có vị trí đã lưu → để nguyên, không giật lên đầu

      // Cuộn lại nhiều nhịp: ngay → khung hình kế → khi ảnh tải xong. Ảnh vào
      // muộn làm trang cao lên, cuộn một nhịp thường bị lệch vài trăm pixel.
      let con = true;
      const ve = () => { if (con) window.scrollTo(0, y); };
      // Người dùng tự cuộn/chạm trong lúc đang khôi phục → DỪNG NGAY, không
      // được giật họ về chỗ cũ (đây là lỗi kinh điển của cách làm nhiều nhịp).
      const dung = () => { con = false; };
      const optsThuDong = { passive: true } as const;
      window.addEventListener("wheel", dung, optsThuDong);
      window.addEventListener("touchstart", dung, optsThuDong);
      window.addEventListener("keydown", dung);

      ve();
      requestAnimationFrame(ve);
      const hen1 = window.setTimeout(ve, 120);
      const hen2 = window.setTimeout(ve, 400);
      window.addEventListener("load", ve, { once: true });

      return () => {
        con = false;
        window.clearTimeout(hen1);
        window.clearTimeout(hen2);
        window.removeEventListener("load", ve);
        window.removeEventListener("wheel", dung);
        window.removeEventListener("touchstart", dung);
        window.removeEventListener("keydown", dung);
      };
    }

    // Địa chỉ có NEO (#ket-qua…) → để trang cuộn tới neo, không ép về đầu.
    if (window.location.hash) return;

    window.scrollTo({ top: 0 }); // mở trang mới → đầu trang thật (thấy logo)
  }, [pathname]);

  // Ghi nhớ vị trí đang đọc theo nhịp cuộn (gộp bằng rAF cho nhẹ). Ghi liên tục
  // chứ không chỉ lúc rời trang, vì trên điện thoại sự kiện rời trang hay không kịp chạy.
  useEffect(() => {
    let cho = false;
    const luu = () => {
      if (cho || dangKhoaCuon()) return;
      cho = true;
      requestAnimationFrame(() => {
        cho = false;
        if (!dangKhoaCuon()) ghiViTri(diaChi(), window.scrollY);
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
