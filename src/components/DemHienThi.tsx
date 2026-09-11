"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { theoDoiThe } from "@/lib/hienThi";

// ════════════════════════════════════════════════════════════════════════════
// BỘ ĐẾM LƯỢT HIỂN THỊ — MỘT CHỖ, CHẠY KHẮP WEB
// ----------------------------------------------------------------------------
// Đặt trong layout gốc. Thẻ tin nào mang dấu data-tin là được theo dõi, bất kể
// nó nằm ở trang chủ, danh sách Mua bán / Cho thuê, kết quả tìm kiếm, tin liên
// quan, trang khu vực hay trang dự án — không phải đi sửa từng nơi.
//
// Danh sách tin thay đổi liên tục (lọc, phân trang, tải thêm) nên ngoài việc
// quét một lượt lúc mở trang, còn phải NGHE cây trang đổi để bắt thẻ mới xuất
// hiện. Thiếu bước đó thì lọc xong là ngừng đếm mà không ai biết.
// ════════════════════════════════════════════════════════════════════════════
export default function DemHienThi() {
  const pathname = usePathname();

  useEffect(() => {
    const dangTheoDoi = new Map<Element, () => void>();

    const batDau = (el: Element) => {
      if (dangTheoDoi.has(el)) return;
      const id = el.getAttribute("data-tin");
      if (!id) return;
      dangTheoDoi.set(el, theoDoiThe(el, id));
    };

    const quet = () => document.querySelectorAll("[data-tin]").forEach(batDau);

    // Quét lượt đầu sau khi trang vẽ xong.
    const r = requestAnimationFrame(quet);

    // Thẻ mới thêm vào (lọc, đổi trang, tải thêm) → theo dõi luôn.
    const mo = new MutationObserver((ds) => {
      let coThem = false;
      for (const d of ds) {
        for (const n of d.addedNodes) {
          if (n.nodeType !== 1) continue;
          const el = n as Element;
          if (el.hasAttribute?.("data-tin") || el.querySelector?.("[data-tin]")) coThem = true;
        }
        // Thẻ bị gỡ khỏi trang → nhả bộ theo dõi, không để rò rỉ bộ nhớ.
        for (const n of d.removedNodes) {
          if (n.nodeType !== 1) continue;
          for (const [el, don] of dangTheoDoi) {
            if (!el.isConnected) {
              don();
              dangTheoDoi.delete(el);
            }
          }
        }
      }
      if (coThem) quet();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(r);
      mo.disconnect();
      for (const don of dangTheoDoi.values()) don();
      dangTheoDoi.clear();
    };
  }, [pathname]);

  return null;
}
