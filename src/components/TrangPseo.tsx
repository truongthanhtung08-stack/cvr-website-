import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingBrowser from "@/components/ListingBrowser";
import KhungChoDanhMuc from "@/components/KhungChoDanhMuc";
import Breadcrumb from "@/components/Breadcrumb";
import LienKetPseo from "@/components/LienKetPseo";
import { ListingListJsonLd } from "@/components/ListJsonLd";
import { goiNheTin, goiNheBaiViet } from "@/lib/goiNhe";
import { getListings, getListingsHetHan } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";
import { boLocCua, duongDan, duongDanPhanCap, khop, lienKetCho, moTa, soLieuTrang, tatCaTrang, thangHienTai, tieuDe, type DieuKien } from "@/lib/pseo";
import { preload } from "react-dom";
import { tieuDeGoogle } from "@/lib/thang";

// ============================================================================
// TEMPLATE 1 — DYNAMIC LISTING (pSEO). Dùng chung cho mọi trục: loại × tỉnh, phường,
// mức giá, pháp lý, phòng ngủ, kiệt/hẻm, đường, hướng.
// Khối: breadcrumb → H1 có tháng → thanh lọc + danh sách tin thật + bản đồ (ListingBrowser
// đang chạy, chỉ nhận đúng tin khớp điều kiện) → liên kết nội bộ.
// ============================================================================

export async function metadataPseo(dk: DieuKien): Promise<Metadata> {
  const tin = await getListings().catch(() => []);
  const trang = tatCaTrang(tin).get(duongDan(dk));
  const title = `${tieuDe(dk)} ${thangHienTai()}`;
  const description = moTa(dk);
  const path = duongDan(dk);
  return {
    title: tieuDeGoogle(title),
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website" },
    ...(trang?.index ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function TrangPseo({ dk }: { dk: DieuKien }) {
  const [listings, articles, hetHan] = await Promise.all([getListings(), getArticles(), getListingsHetHan()]);
  const items = listings.filter((l) => khop(l, dk));
  const itemsHetHan = hetHan.filter((l) => khop(l, dk));
  const heading = `${tieuDe(dk)} ${thangHienTai()}`;
  const path = duongDan(dk);
  // Trục có ô lọc tương ứng (tỉnh, phường, loại hình, giá, phòng ngủ, pháp lý, hướng): danh sách
  // dùng chung dữ liệu /api/danh-sach + MỞ SẴN bộ lọc (file pSEO: "Preset filter bar"), khách nới
  // lọc được như trang thường. Trục đường / kiệt: không có ô lọc → nhận đúng danh sách tin khớp.
  const boLoc = boLocCua(dk);
  if (boLoc) preload(`/api/danh-sach/${dk.muc}`, { as: "fetch", crossOrigin: "anonymous" });
  const soLieu = soLieuTrang(items, dk.muc);
  const khung = <KhungChoDanhMuc heading={heading} moTa={[soLieu, moTa(dk)].filter(Boolean).join(" — ")} items={[...items, ...itemsHetHan]} />;
  return (
    <>
      <ListingListJsonLd items={items} heading={heading} path={path} />
      <Header />
      <main className="flex-1 bg-white">
        <Breadcrumb items={duongDanPhanCap(dk)} />
        <Suspense fallback={khung}>
          {boLoc ? (
            <ListingBrowser purpose={dk.muc} heading={heading} soLieu={soLieu} nguon={dk.muc} choTai={khung} initialFilters={boLoc} articles={goiNheBaiViet(articles)} />
          ) : (
            <ListingBrowser
              purpose={dk.muc}
              heading={heading}
              soLieu={soLieu}
              items={goiNheTin(items)}
              itemsHetHan={goiNheTin(itemsHetHan)}
              articles={goiNheBaiViet(articles)}
            />
          )}
        </Suspense>
        <LienKetPseo nhom={lienKetCho(dk, listings)} />
      </main>
      <Footer />
    </>
  );
}
