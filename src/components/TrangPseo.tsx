import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingBrowser from "@/components/ListingBrowser";
import ListingShowcase from "@/components/ListingShowcase";
import { ketQuaTrangDau } from "@/lib/ketQuaDau";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import LienKetPseo from "@/components/LienKetPseo";
import HoiDapPseo, { hoiDapPseo, giaTheoNhom, GiaTheoNhomPseo } from "@/components/HoiDapPseo";
import { ListingListJsonLd } from "@/components/ListJsonLd";
import { goiNheTin, goiNheBaiViet } from "@/lib/goiNhe";
import { tierRank } from "@/lib/packages";
import type { Listing } from "@/lib/data";
import { getListings, getListingsHetHan, getTinXetTrang } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";
import { TRANG_DONG_BANG, TRANG_GIU_THEM, TRANG_TOP, danhDauGiaRe, tinTuongTuTrang, boLocCua, giuSoCu, duongDan, duongDanPhanCap, khop, lienKetCho, moTa, soLieuTrang, tatCaTrang, thangHienTai, tieuDe, titleGoogle, cauTuKhoa, type DieuKien } from "@/lib/pseo";
import { tieuDeGoogle } from "@/lib/thang";
import { trangGiaNhaDat } from "@/lib/giaNhaDat";
import { giaMoiM2 } from "@/lib/chiSoGia";

// ============================================================================
// TEMPLATE 1 — DYNAMIC LISTING (pSEO). Dùng chung cho mọi trục: loại × tỉnh, phường,
// mức giá, pháp lý, phòng ngủ, kiệt/hẻm, đường, hướng.
// Khối: breadcrumb → H1 có tháng → thanh lọc + danh sách tin thật + bản đồ (ListingBrowser
// đang chạy, chỉ nhận đúng tin khớp điều kiện) → liên kết nội bộ.
// ============================================================================

export async function metadataPseo(dk: DieuKien): Promise<Metadata> {
  const [tin, tinXet] = await Promise.all([getListings().catch(() => []), getTinXetTrang()]);
  const trang = tatCaTrang(tinXet).get(duongDan(dk)); // cổng đếm cả tin hết hạn (29/10/2026)
  // Một câu một đặc điểm (anh 21/11/2026): trang giá rẻ không thêm "tháng" — "Nhà đất Đà Nẵng giá rẻ"
  const path = duongDan(dk);
  // TITLE THEO CÔNG THỨC (anh 26/11/2026, tệp "Phân tích từ khóa và cấu trúc pSEO" + KE-HOACH-TU-KHOA sheet plan final):
  // {Mua Bán | Cho Thuê} {Loại hình} {Khu vực} {Giá Rẻ} T{MM}/{YYYY} — giữ phần đầu; thêm "Giá Rẻ" khi phần đầu < 45 ký tự và trang không
  // có bộ lọc riêng; thêm tháng khi cả câu ≤ 52 ký tự. H1 giữ nguyên. Trang đang top / giữ bản cũ (giuSoCu): title như cũ.
  const title = titleGoogle(dk); // một chỗ dùng chung với Admin → Xin index (pseo.ts)
  const description = cauTuKhoa(path) ?? moTa(dk, tin.filter((l) => khop(l, dk)));
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
  if (dk.giaRe) danhDauGiaRe([...listings, ...hetHan]); // mốc trung bình trên cả bộ tin — cùng mốc với sitemap (pseo.ts)
  const heading = dk.giaRe || dk.dacDiem ? tieuDe(dk) : `${tieuDe(dk)} ${thangHienTai()}`;
  const path = duongDan(dk);
  // MỌI TRANG pSEO MỘT CẤU TRÚC (anh 26/11/2026: "cả ngàn trang pSEO, không riêng giá rẻ"; "không trang nào mỏng"; giá rẻ là một trong
  // nhiều đặc điểm). Danh sách theo mức chính xác: ① đúng 100% câu của trang → ② cùng loại hình + nơi (bỏ đặc điểm / giá / phòng ngủ /
  // pháp lý / hướng) → ③ cùng loại hình cả tỉnh → ④ cùng mục đích cả tỉnh. Mỗi mức VIP → Basic → mới nhất (giá rẻ: rẻ → cao);
  // tin còn hạn hết các mức rồi mới đến tin hết hạn (cùng thứ tự mức). Trang đang top / giữ bản cũ (giuSoCu): như cũ.
  const items = listings.filter((l) => khop(l, dk)); // đúng 100% — ItemList cho Google + số liệu trang
  const giaSapXep = (l: Listing) => (dk.muc === "ban" ? giaMoiM2(l) : l.priceVnd) ?? Infinity;
  const ngay = (l: Listing) => Date.parse(l.bumpedAt ?? l.postedAt ?? "") || 0;
  const phu = (a: Listing, b: Listing) => (dk.giaRe ? giaSapXep(a) - giaSapXep(b) : ngay(b) - ngay(a));
  const MUC: DieuKien[] = [
    dk,
    { muc: dk.muc, tinh: dk.tinh, cat: dk.cat, phuong: dk.phuong, thanhPho: dk.thanhPho },
    { muc: dk.muc, tinh: dk.tinh, cat: dk.cat },
    { muc: dk.muc, tinh: dk.tinh },
  ];
  const mucCua = (l: Listing) => { const i = MUC.findIndex((m) => khop(l, m)); return i < 0 ? 9 : i; };
  const theoMuc = (ds: Listing[], vip: boolean) => ds.map((l) => ({ l, m: mucCua(l) })).filter((x) => x.m < 9)
    .sort((a, b) => a.m - b.m || (vip ? tierRank(a.l.badge) - tierRank(b.l.badge) : 0) || phu(a.l, b.l)).map((x) => x.l);
  const motCauTruc = !giuSoCu(path);
  const danhSach = motCauTruc ? theoMuc(listings, true) : items;
  const danhSachHetHan = motCauTruc ? theoMuc(hetHan, false) : [];
  // MỌI trục hiện kết quả qua CÙNG bộ lọc của web (pseo.ts boLocCua, anh 26/11/2026): 100% → chính xác → tương đối → liên quan,
  // mỗi mức VIP → còn hạn → hết hạn → ngày đăng. Đặc điểm / kiệt / đường đi qua ô từ khoá.
  const boLoc = boLocCua(dk);
  const quaTuKhoa = !!(dk.giaRe || dk.dacDiem || dk.kiet || dk.duong);
  const soLieu = soLieuTrang(items, dk.muc, !giuSoCu(path));
  // Trang 1 máy chủ dựng sẵn (lib/ketQuaDau, 21/10/2026): HTML có tin thật khách nhìn thấy — thay khung chờ + danh sách ẩn cũ
  const ketQuaDau = await ketQuaTrangDau(dk.muc, { initialFilters: boLoc });
  // Trang ít tin (< 8 — dưới một dải thẻ): thêm "Bất động sản tương tự" dưới danh sách (anh 18/11/2026). Trang đang top / đóng băng giữ nguyên.
  // Trang đặc điểm: bộ lọc đã xếp sẵn tin liên quan trong danh sách → không thêm khối riêng (khỏi lặp tin).
  // HTML nhẹ như trang tin: 8 thẻ bỏ mô tả, "Xem thêm" tự nạp theo mã.
  const tuongTu = !motCauTruc && !quaTuKhoa && items.length < 8 && !TRANG_TOP.has(path) && !TRANG_DONG_BANG.has(path) ? tinTuongTuTrang(listings, dk, items) : [];
  const tuongTuNhe = tuongTu.slice(0, 8).map(({ desc: _d, searchText: _s, ...the }) => the);
  return (
    <>
      <ListingListJsonLd items={items} heading={heading} path={path} />
      <Header />
      <main className="flex-1 bg-white">
        {/* Đường dẫn phân cấp: CHỈ cho Google (JSON-LD) — không hiện trên màn hình (chủ dự án 17/10/2026: dòng này nằm
            trên ô tìm làm rối; điện thoại đã có thanh "← Quay lại"). SEO không mất: Google đọc từ dữ liệu cấu trúc. */}
        <BreadcrumbJsonLd items={duongDanPhanCap(dk)} />
        {motCauTruc ? (
          // giữ đúng thứ tự máy chủ đã xếp (mức chính xác · VIP → Basic → mới / rẻ · còn hạn rồi hết hạn)
          <ListingBrowser purpose={dk.muc} heading={heading} soLieu={soLieu} cauTim={cauTuKhoa(path)} items={goiNheTin(danhSach)} itemsHetHan={goiNheTin(danhSachHetHan)} sapXepDau="lien-quan" articles={goiNheBaiViet(articles)} />
        ) : (
          <ListingBrowser purpose={dk.muc} heading={heading} soLieu={soLieu} cauTim={cauTuKhoa(path)} nguon={dk.muc} ketQuaDau={ketQuaDau} initialFilters={boLoc} articles={goiNheBaiViet(articles)} />
        )}
        {tuongTu.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
            <ListingShowcase
              items={tuongTuNhe} idsDayDu={tuongTu.map((l) => l.id)}
              sectionKey="bds-tuong-tu-pseo"
              purpose={dk.muc}
              title="Bất động sản tương tự"
              heading="Bất động sản tương tự"
              relevance
            />
          </div>
        )}
        {/* Trang đang lên Google (TRANG_DONG_BANG): giữ đúng bản cũ — khối giá cũ, 3 câu hỏi đáp cũ */}
        {/* Trang "giữ cũ + thêm mới" (TRANG_GIU_THEM): khối giá cũ giữ nguyên ở trên, khối theo phường + quận cũ thêm ở dưới */}
        {TRANG_GIU_THEM.has(path) && <GiaTheoNhomPseo g={giaTheoNhom(dk, items)} coTrangGia={trangGiaNhaDat(dk.tinh, [...listings, ...hetHan]).index} cu />}
        <GiaTheoNhomPseo g={giaTheoNhom(dk, items)} coTrangGia={trangGiaNhaDat(dk.tinh, [...listings, ...hetHan]).index} cu={TRANG_DONG_BANG.has(path)} id={TRANG_GIU_THEM.has(path) ? "gia-theo-khu-vuc" : undefined} />
        <HoiDapPseo hoiDap={hoiDapPseo(dk, items, TRANG_DONG_BANG.has(path))} />
        <LienKetPseo nhom={lienKetCho(dk, [...listings, ...hetHan])} cau={tieuDe(dk)} kieuGoogle />
      </main>
      <Footer />
    </>
  );
}
