"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// ============================================================================
// BẤM LINK TỚI MỘT MỤC ĐANG GẬP (<details>) LÀ MỤC ĐÓ TỰ MỞ — cả web, một chỗ (chủ dự án 22/10/2026: "bấm vào ra không đúng
// từ menu"): menu Báo giá "Quy định chung", "Xem bảng quyền lợi đầy đủ"… trước đây tới nơi chỉ thấy dòng tiêu đề đang gập.
// Chạy khi: mở trang có #neo · đổi #neo · bấm link #neo trùng neo đang có · chuyển trang trong web tới trang có #neo.
// Neo là chính <details> hoặc khối bọc ngoài có <details> là con trực tiếp.
// ============================================================================
function mo(neo: string) {
  if (!neo) return;
  let el: HTMLElement | null = null;
  try { el = document.getElementById(decodeURIComponent(neo)); } catch { return; }
  const d = (el?.tagName === "DETAILS" ? el : el?.querySelector(":scope > details")) as HTMLDetailsElement | null;
  if (d && !d.open) d.open = true;
}

export default function MoMucTheoNeo() {
  const duong = usePathname();
  useEffect(() => {
    const t = setTimeout(() => mo(location.hash.slice(1)), 0);
    return () => clearTimeout(t);
  }, [duong]);
  useEffect(() => {
    const doiNeo = () => mo(location.hash.slice(1));
    const bam = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (a && a.pathname === location.pathname) mo(a.hash.slice(1));
    };
    addEventListener("hashchange", doiNeo);
    document.addEventListener("click", bam, true);
    return () => { removeEventListener("hashchange", doiNeo); document.removeEventListener("click", bam, true); };
  }, []);
  return null;
}
