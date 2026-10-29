import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingBrowser from "@/components/ListingBrowser";
import { ketQuaTrangDau } from "@/lib/ketQuaDau";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import LienKetPseo from "@/components/LienKetPseo";
import HoiDapPseo, { hoiDapPseo, giaTheoNhom, GiaTheoNhomPseo } from "@/components/HoiDapPseo";
import { ListingListJsonLd } from "@/components/ListJsonLd";
import { goiNheTin, goiNheBaiViet } from "@/lib/goiNhe";
import { getListings, getListingsHetHan } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";
import { TRANG_DONG_BANG, TRANG_GIU_THEM, boLocCua, giuSoCu, duongDan, duongDanPhanCap, khop, lienKetCho, moTa, soLieuTrang, tatCaTrang, thangHienTai, tieuDe, type DieuKien } from "@/lib/pseo";
import { tieuDeGoogle } from "@/lib/thang";
import { trangGiaNhaDat } from "@/lib/giaNhaDat";

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
  const description = moTa(dk, tin.filter((l) => khop(l, dk)));
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
  const soLieu = soLieuTrang(items, dk.muc, !giuSoCu(path));
  // Trang 1 máy chủ dựng sẵn (lib/ketQuaDau, 21/10/2026): HTML có tin thật khách nhìn thấy — thay khung chờ + danh sách ẩn cũ
  const ketQuaDau = boLoc ? await ketQuaTrangDau(dk.muc, { initialFilters: boLoc }) : undefined;
  return (
    <>
      <ListingListJsonLd items={items} heading={heading} path={path} />
      <Header />
      <main className="flex-1 bg-white">
        {/* Đường dẫn phân cấp: CHỈ cho Google (JSON-LD) — không hiện trên màn hình (chủ dự án 17/10/2026: dòng này nằm
            trên ô tìm làm rối; điện thoại đã có thanh "← Quay lại"). SEO không mất: Google đọc từ dữ liệu cấu trúc. */}
        <BreadcrumbJsonLd items={duongDanPhanCap(dk)} />
        {boLoc ? (
          <ListingBrowser purpose={dk.muc} heading={heading} soLieu={soLieu} nguon={dk.muc} ketQuaDau={ketQuaDau} initialFilters={boLoc} articles={goiNheBaiViet(articles)} />
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
        {/* Trang đang lên Google (TRANG_DONG_BANG): giữ đúng bản cũ — khối giá cũ, 3 câu hỏi đáp cũ */}
        {/* Trang "giữ cũ + thêm mới" (TRANG_GIU_THEM): khối giá cũ giữ nguyên ở trên, khối theo phường + quận cũ thêm ở dưới */}
        {TRANG_GIU_THEM.has(path) && <GiaTheoNhomPseo g={giaTheoNhom(dk, items)} coTrangGia={trangGiaNhaDat(dk.tinh, listings).index} cu />}
        <GiaTheoNhomPseo g={giaTheoNhom(dk, items)} coTrangGia={trangGiaNhaDat(dk.tinh, listings).index} cu={TRANG_DONG_BANG.has(path)} id={TRANG_GIU_THEM.has(path) ? "gia-theo-khu-vuc" : undefined} />
        <HoiDapPseo hoiDap={hoiDapPseo(dk, items, TRANG_DONG_BANG.has(path))} />
        <LienKetPseo nhom={lienKetCho(dk, listings)} cau={tieuDe(dk)} kieuGoogle />
      </main>
      <Footer />
    </>
  );
}
