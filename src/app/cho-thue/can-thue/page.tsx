import type { Metadata } from "next";
import DanhSachTinTim from "@/components/DanhSachTinTim";

// Mục riêng tin người cần thuê (05/11/2026). Không xin Google lập chỉ mục: trang Cho thuê, trang pSEO giữ nguyên là trang đích.
export const metadata: Metadata = {
  title: "Người cần thuê nhà đất",
  alternates: { canonical: "/cho-thue/can-thue" },
  robots: { index: false, follow: true },
};

export default function CanThuePage() {
  return <DanhSachTinTim muc="can-thue" tieuDe="Người cần thuê nhà đất" />;
}
