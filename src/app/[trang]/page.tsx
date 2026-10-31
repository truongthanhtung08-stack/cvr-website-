import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TrangPseo, { metadataPseo } from "@/components/TrangPseo";
import { getListings, getListingsHetHan } from "@/lib/listingsDb";
import { giaiMaDuong, trangIndex } from "@/lib/pseo";

// pSEO trục 4 — /ban-nha-duong-<đường>-<tỉnh> (đúng mẫu URL của file pSEO, bỏ cấp quận).
// Route gốc chỉ nhận đường dẫn bắt đầu bằng "ban-nha-duong-"; mọi đường khác → 404.

async function dieuKien(trang: string) {
  if (!trang.startsWith("ban-nha-duong-")) return null;
  const [con, het] = await Promise.all([getListings().catch(() => []), getListingsHetHan().catch(() => [])]);
  return giaiMaDuong(trang, [...con, ...het]);
}

export async function generateStaticParams() {
  const tin = await getListings().catch(() => []);
  return trangIndex(tin)
    .filter((p) => p.path.startsWith("/ban-nha-duong-"))
    .map((p) => ({ trang: p.path.slice(1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ trang: string }> }): Promise<Metadata> {
  const dk = await dieuKien((await params).trang);
  if (!dk) return { title: "Không tìm thấy trang", robots: { index: false, follow: true } };
  return metadataPseo(dk);
}

export default async function Page({ params }: { params: Promise<{ trang: string }> }) {
  const dk = await dieuKien((await params).trang);
  if (!dk) notFound();
  return <TrangPseo dk={dk} />;
}
