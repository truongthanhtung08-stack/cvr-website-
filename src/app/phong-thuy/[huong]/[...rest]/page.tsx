import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TrangPseo, { metadataPseo } from "@/components/TrangPseo";
import { getListings } from "@/lib/listingsDb";
import { giaiMaHuong, trangIndex } from "@/lib/pseo";

// pSEO trục 6 — /phong-thuy/huong-<hướng>/<loại>/<tỉnh> · /phong-thuy/huong-<hướng>/<tỉnh>

export async function generateStaticParams() {
  const tin = await getListings().catch(() => []);
  return trangIndex(tin)
    .filter((p) => p.path.startsWith("/phong-thuy/"))
    .map((p) => p.path.split("/").slice(2))
    .map(([huong, ...rest]) => ({ huong, rest }));
}

export async function generateMetadata({ params }: { params: Promise<{ huong: string; rest: string[] }> }): Promise<Metadata> {
  const { huong, rest } = await params;
  const dk = giaiMaHuong(huong, rest);
  if (!dk) return { title: "Không tìm thấy trang", robots: { index: false, follow: true } };
  return metadataPseo(dk);
}

export default async function Page({ params }: { params: Promise<{ huong: string; rest: string[] }> }) {
  const { huong, rest } = await params;
  const dk = giaiMaHuong(huong, rest);
  if (!dk) notFound();
  return <TrangPseo dk={dk} />;
}
