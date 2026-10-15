import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TrangPseo, { metadataPseo } from "@/components/TrangPseo";
import { getListings, getListingsHetHan } from "@/lib/listingsDb";
import { giaiMaDanhSach, trangIndex } from "@/lib/pseo";

// pSEO Template 1 — /cho-thue/<loại>/<tỉnh>[/<phường | mức giá | pháp lý | phòng ngủ>] và /cho-thue/<tỉnh>/<phường>
// Luật lập chỉ mục + tiêu đề: src/lib/pseo.ts.

async function dieuKien(loai: string, duong: string[]) {
  const [con, het] = await Promise.all([getListings().catch(() => []), getListingsHetHan().catch(() => [])]);
  return giaiMaDanhSach("thue", loai, duong, [...con, ...het]);
}

// Dựng sẵn trang đã qua cổng chất lượng; trang khác dựng khi có khách vào.
export async function generateStaticParams() {
  const tin = await getListings().catch(() => []);
  return trangIndex(tin)
    .filter((p) => p.path.startsWith("/cho-thue/"))
    .map((p) => p.path.split("/").slice(2))
    .map(([loai, ...duong]) => ({ loai, duong }));
}

export async function generateMetadata({ params }: { params: Promise<{ loai: string; duong: string[] }> }): Promise<Metadata> {
  const { loai, duong } = await params;
  const dk = await dieuKien(loai, duong);
  if (!dk) return { title: "Không tìm thấy trang", robots: { index: false, follow: true } };
  return metadataPseo(dk);
}

export default async function Page({ params }: { params: Promise<{ loai: string; duong: string[] }> }) {
  const { loai, duong } = await params;
  const dk = await dieuKien(loai, duong);
  if (!dk) notFound();
  return <TrangPseo dk={dk} />;
}
