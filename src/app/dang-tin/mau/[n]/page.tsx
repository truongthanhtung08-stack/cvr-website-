import type { Metadata, ResolvingMetadata } from "next";
import DangTinPage from "../../page";
import { metaDangTin } from "../../metaDangTin";

// /dang-tin?mau=2..5 → (rewrite next.config) trang này: y hệt /dang-tin, chỉ khác ảnh đại diện khi chia sẻ (mẫu 2..5).
// Dựng sẵn 4 trang lúc build, số khác 404; ?mau lạ không khớp rewrite → ở lại /dang-tin (mẫu 1).
export const dynamicParams = false;
export function generateStaticParams() {
  return ["2", "3", "4", "5"].map((n) => ({ n }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }, parent: ResolvingMetadata): Promise<Metadata> {
  const { n } = await params;
  return metaDangTin(parent, Number(n));
}

export default DangTinPage;
