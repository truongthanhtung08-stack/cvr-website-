import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TrangDiemTin, { soVungDiemTin } from "@/components/TrangDiemTin";
import { getPackage } from "@/lib/packages";
import { VUNG_BAO_CAO } from "@/lib/baoCaoThiTruong";

// Mỗi khu vực một trang — cùng mục con menu "Điểm tin thị trường" (anh 14/11/2026). Tiêu đề = H1 của trang.
export const dynamicParams = false;
export function generateStaticParams() {
  return VUNG_BAO_CAO.map((v) => ({ vung: v.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ vung: string }> }): Promise<Metadata> {
  const { vung } = await params;
  const kv = VUNG_BAO_CAO.find((v) => v.id === vung);
  if (!kv) return {};
  const du = (await soVungDiemTin()).some((x) => x.vung.id === kv.id && x.du);
  return {
    title: `Điểm tin thị trường ${kv.ten}`, description: getPackage("bao-cao-thi-truong-bds")!.description, alternates: { canonical: `/diem-tin-thi-truong/${kv.id}` },
    ...(du ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function Page({ params }: { params: Promise<{ vung: string }> }) {
  const { vung } = await params;
  if (!VUNG_BAO_CAO.some((v) => v.id === vung)) notFound();
  return <TrangDiemTin vung={vung} />;
}
