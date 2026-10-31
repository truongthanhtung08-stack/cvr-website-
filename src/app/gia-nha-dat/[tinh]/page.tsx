import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { GiaTheoNhomPseo } from "@/components/HoiDapPseo";
import { getTinXetTrang } from "@/lib/listingsDb";
import { khuVucTrongDiem, slugKhuVuc, timKhuVuc } from "@/lib/khuVuc";
import { trangGiaNhaDat } from "@/lib/giaNhaDat";
import { tieuDeGoogle } from "@/lib/thang";

// ============================================================================
// /gia-nha-dat/<tỉnh> — "Giá nhà đất Đà Nẵng tháng 10/2026" (kế hoạch SEO mục 5b-D3, chủ dự án duyệt 27/10/2026).
// Gom khối giá theo khu vực của mọi loại hình đủ tin trong tỉnh (bán trước, thuê sau). Số liệu, cổng: src/lib/giaNhaDat.ts.
// ============================================================================

export function generateStaticParams() {
  return khuVucTrongDiem.map((t) => ({ tinh: slugKhuVuc(t) }));
}

export async function generateMetadata({ params }: { params: Promise<{ tinh: string }> }): Promise<Metadata> {
  const { tinh } = await params;
  const kv = timKhuVuc(tinh);
  if (!kv) return { title: "Không tìm thấy", robots: { index: false, follow: true } };
  const t = trangGiaNhaDat(kv, await getTinXetTrang());
  const path = `/gia-nha-dat/${kv.slug}`;
  return {
    title: tieuDeGoogle(t.tieuDe),
    description: t.moTa,
    alternates: { canonical: path },
    openGraph: { title: t.tieuDe, description: t.moTa, url: path, type: "website" },
    ...(t.index ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function GiaNhaDatTinh({ params }: { params: Promise<{ tinh: string }> }) {
  const { tinh } = await params;
  const kv = timKhuVuc(tinh);
  if (!kv) notFound();
  const t = trangGiaNhaDat(kv, await getTinXetTrang()) /* cổng đếm cả tin hết hạn (29/10/2026) */;
  if (!t.ban.length && !t.thue.length) notFound();
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <BreadcrumbJsonLd items={[{ name: "Nhà đất bán", href: "/mua-ban" }, { name: kv.name, href: `/mua-ban/${kv.slug}` }, { name: "Giá nhà đất", href: `/gia-nha-dat/${kv.slug}` }]} />
        <div className="mx-auto max-w-7xl px-4 pb-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <h1 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">{t.tieuDe}</h1>
          {/* Dưới H1 bỏ cụm "Giá nhà đất … tháng …:" (đã là H1) — chỉ giữ phần số: "Căn hộ chung cư từ … , nhà từ …" */}
          <p className="mt-2 max-w-[980px] text-[15px] leading-relaxed text-cvr-muted">{((s) => s.charAt(0).toUpperCase() + s.slice(1))(t.moTa.replace(/^[^:]*:\s*/, ""))}</p>
        </div>
        {t.ban.map((x) => <GiaTheoNhomPseo key={`ban-${x.dk.cat!.slug}`} g={x.g} lienKet={x.lienKet} />)}
        {t.thue.map((x) => <GiaTheoNhomPseo key={`thue-${x.dk.cat!.slug}`} g={x.g} lienKet={x.lienKet} />)}
        <div className="mx-auto max-w-7xl px-4 pb-footer sm:px-6 lg:px-8">
          <Link href={`/mua-ban/${kv.slug}`} className="text-[15px] font-medium text-cvr-ink underline underline-offset-4">Xem nhà đất bán {kv.name}</Link>
          <span className="mx-2 text-cvr-faint">·</span>
          <Link href={`/cho-thue/${kv.slug}`} className="text-[15px] font-medium text-cvr-ink underline underline-offset-4">Xem nhà đất cho thuê {kv.name}</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
