"use client";

import { useEffect, useState } from "react";

// NÚT ĐANG CHỌN Ở KHỐI TIN TRANG CHỦ ("Tất cả" · "Mua bán" · "Cho thuê") — dùng chung cho thanh dưới (anh 08/11/2026: "bấm vào Cho thuê,
// Mua bán thì nút Home như thế nào!"): đang xem riêng Mua bán / Cho thuê thì KHÔNG phải trang chủ tổng → nút Home không xanh; bấm Home
// về "Tất cả" → Home xanh lại. FeaturedListings báo, MobileTabBar nghe.
const SU_KIEN = "cl-tab-trang-chu";
let hienTai = "Tất cả";

export function baoTabTrangChu(tab: string) {
  if (hienTai === tab) return;
  hienTai = tab;
  window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: tab }));
}

export function useTabTrangChu(): string {
  const [tab, setTab] = useState(hienTai);
  useEffect(() => {
    const nghe = (e: Event) => setTab((e as CustomEvent<string>).detail);
    window.addEventListener(SU_KIEN, nghe);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ một lần với giá trị đã có trước khi gắn nghe
    setTab(hienTai);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);
  return tab;
}
