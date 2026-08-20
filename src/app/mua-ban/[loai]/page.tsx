import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingBrowser from "@/components/ListingBrowser";
import Breadcrumb from "@/components/Breadcrumb";
import KhuVucLinks from "@/components/KhuVucLinks";
import { ListingListJsonLd } from "@/components/ListJsonLd";
import { getListings } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";
import { findCategory, saleCategories } from "@/lib/categories";
import { demTinTheoKhuVuc, khuVucTrongDiem, moTaKhuVuc, slugKhuVuc, tieuDeKhuVuc, timKhuVuc } from "@/lib/khuVuc";
import { normalizeVi } from "@/lib/filters";

// ============================================================================
// /mua-ban/<slug> phục vụ HAI loại trang, phân biệt bằng chính slug:
//   · slug là LOẠI HÌNH (can-ho-chung-cu, nha-rieng…) → trang danh mục loại hình
//   · slug là KHU VỰC   (da-nang, hue, quang-ngai…)   → nhà đất bán theo tỉnh
// Gộp vào một route để đường dẫn ngắn, sạch: /mua-ban/da-nang (chứ không phải
// /mua-ban/khu-vuc/da-nang) — đúng cách Batdongsan/Homedy làm; ngắn thì khách
// nhớ được và Google cũng chuộng hơn.
//
// Đây là nhóm từ khoá ĐÔNG NHẤT của ngành ("nhà đất Đà Nẵng", "bán nhà Huế"),
// trước đây web hoàn toàn không có cửa vào từ nhóm này.
// ============================================================================

export function generateStaticParams() {
  return [
    ...saleCategories.map((c) => ({ loai: c.slug })),
    // Chỉ dựng sẵn khu vực TRỌNG ĐIỂM; tỉnh khác vẫn vào được (dựng khi có khách).
    ...khuVucTrongDiem.map((t) => ({ loai: slugKhuVuc(t) })),
  ];
}

const tinhCua = (location: string) => location.split(",").pop()?.trim() ?? "";

export async function generateMetadata({ params }: { params: Promise<{ loai: string }> }): Promise<Metadata> {
  const { loai } = await params;

  const c = findCategory(saleCategories, loai);
  if (c) {
    return {
      title: c.title,
      description: c.desc,
      alternates: { canonical: `/mua-ban/${c.slug}` },
      openGraph: { title: c.title, description: c.desc, url: `/mua-ban/${c.slug}`, type: "website" },
    };
  }

  const kv = timKhuVuc(loai);
  if (!kv) return { title: "Không tìm thấy danh mục", robots: { index: false, follow: true } };

  // CHỐNG TRANG MỎNG: khu vực chưa có tin nào thì vẫn xem được nhưng KHÔNG cho
  // Google lập chỉ mục. Mở hàng loạt trang rỗng là cách nhanh nhất để cả tên
  // miền bị đánh giá thấp. Có tin là tự được index, không phải sửa code.
  const listings = await getListings().catch(() => []);
  const soTin = demTinTheoKhuVuc(listings.filter((l) => (l.purpose ?? "ban") === "ban"), kv.name);

  const title = tieuDeKhuVuc("ban", kv.name);
  const description = moTaKhuVuc("ban", kv.name, soTin);
  return {
    title,
    description,
    alternates: { canonical: `/mua-ban/${kv.slug}` },
    openGraph: { title, description, url: `/mua-ban/${kv.slug}`, type: "website" },
    ...(soTin === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function DanhMucMuaBanPage({ params }: { params: Promise<{ loai: string }> }) {
  const { loai } = await params;
  const c = findCategory(saleCategories, loai);
  const kv = c ? null : timKhuVuc(loai);
  if (!c && !kv) notFound();

  const [listings, articles] = await Promise.all([getListings(), getArticles()]);
  const tinBan = listings.filter((l) => (l.purpose ?? "ban") === "ban");

  // Số tin từng tỉnh — cho khối liên kết khu vực cuối trang
  const demTheoTinh = (() => {
    const m = new Map<string, number>();
    for (const l of tinBan) {
      const t = tinhCua(l.location);
      if (t) m.set(t, (m.get(t) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  })();

  // ── TRANG KHU VỰC ─────────────────────────────────────────────────────────
  if (kv) {
    const tinTrongTinh = tinBan.filter((l) => normalizeVi(tinhCua(l.location)) === normalizeVi(kv.name));
    return (
      <>
        <ListingListJsonLd items={tinTrongTinh} heading={tieuDeKhuVuc("ban", kv.name)} path={`/mua-ban/${kv.slug}`} />
        <Header />
        <main className="flex-1 bg-white">
          <Breadcrumb
            items={[
              { name: "Nhà đất bán", href: "/mua-ban" },
              { name: kv.name, href: `/mua-ban/${kv.slug}` },
            ]}
          />
          <Suspense fallback={<div className="mx-auto h-[104px] max-w-7xl px-4 sm:px-6 lg:px-8" />}>
            <ListingBrowser
              purpose="ban"
              heading={`Nhà đất bán tại ${kv.name}`}
              items={listings}
              articles={articles}
              initialProvince={kv.name}
            />
          </Suspense>
          <KhuVucLinks base="/mua-ban" demTheoTinh={demTheoTinh} tinhDangXem={kv.name} />
        </main>
        <Footer />
      </>
    );
  }

  // ── TRANG DANH MỤC LOẠI HÌNH (giữ nguyên như cũ, thêm khối khu vực cuối) ───
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <Breadcrumb
          items={[
            { name: "Nhà đất bán", href: "/mua-ban" },
            { name: c!.label, href: `/mua-ban/${c!.slug}` },
          ]}
        />
        <Suspense fallback={<div className="mx-auto h-[104px] max-w-7xl px-4 sm:px-6 lg:px-8" />}>
          <ListingBrowser
            purpose="ban"
            heading={c!.h1}
            items={listings}
            articles={articles}
            initialTypes={c!.types}
          />
        </Suspense>
        <KhuVucLinks base="/mua-ban" demTheoTinh={demTheoTinh} />
      </main>
      <Footer />
    </>
  );
}
