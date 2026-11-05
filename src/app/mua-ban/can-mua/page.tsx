import type { Metadata } from "next";
import DanhSachTinTim from "@/components/DanhSachTinTim";

// Mục riêng tin người cần mua (05/11/2026). Không xin Google lập chỉ mục: trang Mua bán, trang pSEO giữ nguyên là trang đích.
export const metadata: Metadata = {
  title: "Người cần mua nhà đất",
  alternates: { canonical: "/mua-ban/can-mua" },
  robots: { index: false, follow: true },
};

export default function CanMuaPage() {
  return <DanhSachTinTim muc="mua" tieuDe="Người cần mua nhà đất" />;
}
