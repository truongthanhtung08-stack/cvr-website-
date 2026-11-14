import type { Metadata } from "next";
import TrangDiemTin from "@/components/TrangDiemTin";
import { getPackage } from "@/lib/packages";

// Điểm tin thị trường — menu riêng (anh 14/11/2026). Tiêu đề, mô tả giữ đúng chữ trang cũ /tien-ich/bao-cao-thi-truong-bds.
const p = getPackage("bao-cao-thi-truong-bds")!;
export const metadata: Metadata = { title: p.title, description: p.description, alternates: { canonical: "/diem-tin-thi-truong" } };

export default function Page() {
  return <TrangDiemTin />;
}
