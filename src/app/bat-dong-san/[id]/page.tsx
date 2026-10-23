import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import KhungAnhPC from "@/components/KhungAnhPC";
import ListingShowcase from "@/components/ListingShowcase";
import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import RecordView from "@/components/RecordView";
import { ContactActions, ContactBarMobile } from "@/components/LienHeReveal";
import YeuCauLienHeLai, { NutYeuCauLienHe } from "@/components/YeuCauLienHeLai";
import KhoiDanhGiaTin from "@/components/KhoiDanhGiaTin";
import ShareButtons from "@/components/ShareButtons";
import PriceHistory from "@/components/PriceHistory";
import {
  chiSoChoTin,
  coDuLichSuGia,
  giaHienTai,
  giaChoLichSu,
  khoCuaMinh,
  tenPhamVi,
  soNhapHopLe,
} from "@/lib/chiSoGia";
import { getChiSoGia } from "@/lib/siteContent";
import { nhanDienTich as nhanDienTichTheoLoai, laTinThue, mauSoCuaLoaiHinh } from "@/lib/listingSpec";
import ProjectNearby from "@/components/ProjectNearby";
import ProjectNav from "@/components/ProjectNav";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { provinceOf, districtOf, pickRelated } from "@/lib/data";
import { giuCum, tenDiaDanh } from "@/lib/chuThuong";
import { getListing, getListings, getListingsHetHan, getListingDetail, tinDaHetHan } from "@/lib/listingsDb";
import { banGocCua, lienKetCho, tinDatChuan, tinhCuaTin, phuongCuaTin, duongDanPhanCap, THANH_PHO } from "@/lib/pseo";
import { rentCategories, saleCategories } from "@/lib/categories";
import { khuVucList } from "@/lib/khuVuc";
import LienKetPseo from "@/components/LienKetPseo";
import { getProject, getProjects } from "@/lib/contentDb";
import { normalizeVi, cungDuAn } from "@/lib/filters";
import { tierFromBadge, getTier } from "@/lib/packages";
import { chuanHoaSdt } from "@/lib/phone";
import MoTaThuGon from "@/components/MoTaThuGon";
import RichContent from "@/components/RichContent";
import { tieuDeGoogle } from "@/lib/thang";

// TRANG QUAN TRỌNG NHẤT CHO SEO (500 tin). Nay đọc tin qua cache theo thẻ "listings"
// (xem listingsDb.ts) nên KHÔNG còn cần force-dynamic: trang được dựng sẵn theo yêu
// cầu (ISR) rồi phục vụ từ edge → nhanh cho Google. Admin duyệt tin gọi
// revalidateTag("listings") → trang tự dựng lại NGAY. Lỗi "static→dynamic" cũ là do
// no-store; đã bỏ no-store nên gỡ được force-dynamic một cách an toàn.
// ⚠️ ĐỪNG thêm lại force-dynamic — sẽ vô hiệu hoá toàn bộ cache vừa dựng.

// Chuyển chuỗi giá VN ("33 tỷ", "7,2 tỷ", "15 triệu") → số VNĐ cho Schema. Không parse được → null.
function parseVnd(s: string): number | null {
  const t = s.toLowerCase().replace(/\./g, "").replace(",", ".");
  const num = parseFloat(t);
  if (Number.isNaN(num)) return null;
  if (t.includes("tỷ")) return Math.round(num * 1e9);
  if (t.includes("triệu") || t.includes("tr")) return Math.round(num * 1e6);
  return null;
}

// Tách TOẠ ĐỘ (lat,lng) từ điểm admin ghim — nhận cả "16.0471,108.2068" lẫn link
// Google Maps dạng "…@16.0471,108.2068,17z". Có toạ độ → khai `geo` cho Schema, giúp
// Google hiểu VỊ TRÍ THẬT của bất động sản (điều kiện cho rich result BĐS + tìm kiếm
// theo bản đồ). Ngoài dải Việt Nam / không parse được → bỏ qua (không bịa toạ độ).
function parseLatLng(s?: string): { lat: number; lng: number } | null {
  if (!s) return null;
  const m = s.match(/(-?\d{1,2}\.\d{3,})[,\s]+(\d{2,3}\.\d{3,})/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (lat < 8 || lat > 24 || lng < 102 || lng > 110) return null; // ngoài Việt Nam → bỏ
  return { lat, lng };
}

// ── TIÊU ĐỀ CHO GOOGLE (thẻ <title>) ────────────────────────────────────────
// Tiêu đề người bán tự viết thường hỏng một trong hai kiểu: DÀI lê thê (đo 34 tin
// đợt 10/09: 17 tin trên 80 ký tự, Google cắt mất phần sau) hoặc THIẾU ĐỊA DANH
// ("Cho thuê nhà Mỹ Gia gói 2 đối diện công viên" — không có Nha Trang lẫn Khánh
// Hoà, mất hẳn từ khoá địa phương). Chỗ này chuẩn hoá lại cho thẻ <title>:
// cắt gọn + ghép địa danh còn thiếu. H1 trên trang vẫn giữ NGUYÊN VĂN của người
// bán — không sửa chữ của khách.
// ── LÀM SẠCH TIÊU ĐỀ TRƯỚC KHI ĐƯA LÊN GOOGLE (chốt 18/09/2026) ─────────────
// Tiêu đề thật đang chạy: "🏡 NẮM CHỦ NHÀ ĐẸP 3 TẦNG – 2 MẶT TIỀN 📍 Sát cầu Hòa
// Xuân 🌿 …". Hai chỗ hỏng khi lên kết quả tìm kiếm:
//   · EMOJI — Google gần như luôn lược bỏ khi hiển thị, nhưng vẫn tính vào độ dài
//     nên đẩy phần chữ có nghĩa ra ngoài chỗ bị cắt.
//   · VIẾT HOA TOÀN BỘ — bị chấm là tiêu đề rao vặt; Google hay tự viết lại tiêu
//     đề, và khi nó tự viết thì mình mất quyền quyết định hiện cái gì.
// ⚠️ CHỈ đụng vào thẻ <title>/<description> gửi Google. NỘI DUNG TIN TRÊN WEB
// (H1, mô tả) GIỮ NGUYÊN VĂN 100% — đúng chốt "tin lấy nguyên, không sửa".
// Viết tắt của ngành phải giữ nguyên chữ hoa — hạ xuống thành "Shr", "Hđmb" là
// sai và trông cẩu thả. Thêm vào đây khi gặp thêm từ mới trong tin thật.
const VIET_TAT = new Set([
  "SHR", "SHCC", "HĐMB", "HDMB", "GPXD", "KDC", "KCN", "TMDV", "QL", "DT", "TT",
  "BĐS", "BDS", "CC", "NĐT", "NDT", "VP", "MT", "MTĐ", "HXH", "TTTM", "CĐT", "CDT",
]);

function lamSachTieuDe(raw: string): string {
  // Bỏ emoji + ký hiệu trang trí, giữ lại chữ, số, dấu câu thường dùng.
  let t = raw
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{20E3}\u{2600}-\u{27BF}]/gu, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s,\-–—:;.·|]+/, "")
    .trim();

  // Đếm tỷ lệ chữ HOA trên tổng số chữ cái. Trên 70% coi như viết hoa cả câu →
  // hạ về kiểu viết hoa đầu mỗi từ, để địa danh và tên riêng vẫn đúng chính tả
  // ("Hòa Xuân", "Đà Nẵng") thay vì thành chữ thường hết.
  const chuCai = t.replace(/[^\p{L}]/gu, "");
  const soHoa = [...chuCai].filter((c) => c === c.toLocaleUpperCase("vi") && c !== c.toLocaleLowerCase("vi")).length;
  if (chuCai.length >= 8 && soHoa / chuCai.length > 0.7) {
    t = t
      .split(" ")
      .map((tu) => {
        // Từ có chữ số (3PN, 100M2, 263,3M²) giữ nguyên — hạ xuống là sai nghĩa.
        if (/\d/.test(tu)) return tu;
        // Viết tắt quen thuộc của ngành: giữ nguyên chữ hoa.
        if (VIET_TAT.has(tu.replace(/[^\p{L}]/gu, "").toUpperCase())) return tu;
        return tu.charAt(0).toLocaleUpperCase("vi") + tu.slice(1).toLocaleLowerCase("vi");
      })
      .join(" ");
  }
  return t;
}

// NGÂN SÁCH KÝ TỰ CHO THẺ <title> (đo ngày 18/09/2026: tiêu đề tin đang dài 128
// ký tự — Google cắt còn chưa tới một nửa, mất sạch phần địa danh và giá nằm ở đuôi).
// Google hiển thị khoảng 60 ký tự. Layout tự nối thêm " | COASTAL LAND" (15 ký tự),
// nên phần do trang này sinh ra chỉ được khoảng 50.
// Thứ tự ưu tiên khi phải cắt: GIÁ và ĐỊA DANH giữ lại bằng mọi giá (đó mới là từ
// khoá khách gõ), phần chữ người bán tự viết chịu cắt trước.
const NGAN_SACH_TITLE = 50;

// Diện tích vào tiêu đề Google (16/10/2026): hai lô cùng tiêu đề khác diện tích (123 m² / 150 m²) từng bị
// Google coi là trùng tiêu đề — kèm diện tích thì mỗi tin một tiêu đề riêng, người tìm thấy ngay quy mô.
function tieuDeSeo(tieuDe: string, location: string, price: string, area = ""): string {
  const kd = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
  let t = lamSachTieuDe(tieuDe);

  // Ghép những cấp địa danh mà tiêu đề CHƯA nhắc tới (phường/xã, tỉnh/thành).
  // Chỉ lấy cấp CUỐI (tỉnh/thành) khi chỗ không còn rộng — "Đà Nẵng" đáng giá hơn
  // "Phường Hòa Xuân" với người đang tìm kiếm.
  const conThieu = location
    .split(",")
    .map((s) => s.trim())
    .filter((p) => p && !kd(t).includes(kd(p.replace(/^(Phường|Xã|Thị trấn|Đặc khu)\s+/i, ""))));

  const duoi = ` — ${price}${area ? ` · ${area}` : ""}`;
  const chonDiaDanh = (() => {
    if (conThieu.length === 0) return "";
    const dayDu = conThieu.join(", ");
    // Đủ chỗ cho cả chuỗi địa danh (chừa ít nhất 20 ký tự cho phần chữ) thì lấy hết
    if (dayDu.length + duoi.length + 20 <= NGAN_SACH_TITLE) return dayDu;
    return conThieu[conThieu.length - 1]; // chật thì giữ mỗi tỉnh/thành
  })();

  const choConLai = NGAN_SACH_TITLE - duoi.length - (chonDiaDanh ? chonDiaDanh.length + 2 : 0);
  if (t.length > choConLai) {
    const cat = t.slice(0, Math.max(choConLai, 24));
    const khoang = cat.lastIndexOf(" ");
    t = (khoang > 14 ? cat.slice(0, khoang) : cat).replace(/[\s,\-–—:;.]+$/, "");
    // Cắt trúng giữa cụm giá ("… giá 3.6") thì bỏ hẳn cụm đó — giá đầy đủ đã nằm ở đuôi.
    t = t.replace(/\s+(giá|gia|chỉ|chi)(\s+[\d.,]+)?$/i, "").replace(/[\s,\-–—:;.]+$/, "");
  }
  return [t, chonDiaDanh].filter(Boolean).join(", ") + duoi;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const l = await getListing(id); // B2: đọc Supabase, fallback dữ liệu mẫu
  if (!l) return { title: "Không tìm thấy", robots: { index: false, follow: true } };
  // Mô tả cũng dùng bản đã làm sạch — cùng lý do với thẻ <title> ở trên.
  // Google hiển thị khoảng 155 ký tự; bản cũ dài 331 nên câu chốt "Hình thật, liên
  // hệ trực tiếp người đăng" không bao giờ hiện ra. Nay đặt THÔNG TIN QUYẾT ĐỊNH
  // (loại hình, giá, diện tích, địa danh) lên đầu rồi mới tới câu mời.
  const moTaGon = (() => {
    const dau = `${l.type} tại ${l.location}. Giá ${l.price}${l.area ? `, ${l.area}` : ""}${l.beds ? `, ${l.beds} phòng ngủ` : ""}.`;
    const moi = ` Hình thật, liên hệ trực tiếp ${l.purpose === "thue" ? "người cho thuê" : "người bán"} trên Coastal Land.`;
    return (dau + moi).length <= 158 ? dau + moi : dau.slice(0, 158);
  })();
  const desc = moTaGon;
  const tieuDe = tieuDeSeo(l.title, l.location, l.price, l.area !== "—" ? l.area : "");
  // Tin đăng trùng một tin đăng trước → canonical về bản gốc (không tự lập chỉ mục bản trùng)
  const [tinCon, tinHet] = await Promise.all([getListings().catch(() => []), getListingsHetHan().catch(() => [])]);
  const banGoc = banGocCua(l, [...tinCon, ...tinHet]);
  // Tin hết hạn VẪN cho Google lập chỉ mục (chủ dự án 08/10/2026: web còn ít tin, tin hết
  // hạn vẫn hiện và cộng dồn mọi thứ từ Google). Liên hệ đã ẩn ở thân trang.
  return {
    title: tieuDeGoogle(tieuDe),
    description: desc,
    alternates: { canonical: `/bat-dong-san/${banGoc?.id ?? id}` },
    // CHƯA ĐẠT CHUẨN THÌ KHÔNG CHO GOOGLE LẬP CHỈ MỤC (chủ dự án 15/10/2026: "không đủ chất lượng
    // không hiển thị"): dưới 3 ảnh thật hoặc mô tả quá sơ sài. Khách vẫn xem tin bình thường.
    ...(tinDatChuan(l) ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title: tieuDe,
      description: desc,
      url: `/bat-dong-san/${id}`,
      type: "website",
      ...(l.image ? { images: [{ url: l.image, alt: l.title }] } : {}),
    },
  };
}

/** Ngày hẹn đăng còn ở tương lai (đọc đồng hồ máy chủ lúc dựng trang). */
function chuaToiNgay(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [dGoc, hetHan] = await Promise.all([getListingDetail(id), tinDaHetHan(id)]); // DỮ LIỆU THẬT: ảnh, đặc điểm, tiện ích, người đăng
  if (!dGoc) notFound();
  // Tin HẸN NGÀY ĐĂNG chưa tới ngày ("Chờ hiển thị") — chưa công khai.
  if (dGoc.listing.postedAt && chuaToiNgay(dGoc.listing.postedAt)) notFound();
  // TIN HẾT HẠN: liên hệ tạm ẩn — kể cả số người đăng TỰ GHI trong mô tả ("Liên hệ 0905…").
  // Che ngay ở dữ liệu (trước khi gửi xuống trình duyệt) để số không lọt vào mã trang.
  // Đúng dạng SĐT Việt Nam (0/+84 + 3/5/7/8/9 + 8 số, cho phép cách/chấm/gạch) — không chạm giá tiền.
  const cheSo = (s: string) => s.replace(/(?<![\d.,])(?:\+?84[\s.\-]?|0)[35789](?:[\s.\-]?\d){8}(?!\d)/g, "••••");
  // TIN CÒN HẠN: số trong mô tả ẩn đuôi như Batdongsan "0905 042 ***" — đủ số chỉ ở nút Hiện số
  // (chủ dự án 09/10/2026). Che ngay ở dữ liệu để số đủ không lọt vào mã trang.
  const anDuoi = (s: string) => s.replace(/(?<![\d.,])((?:\+?84[\s.\-]?|0)[35789](?:[\s.\-]?\d){8})(?!\d)/g, (so) => {
    const c = so.replace(/\D/g, "").replace(/^84/, "0");
    return `${c.slice(0, 4)} ${c.slice(4, 7)} ∗∗∗`; // ∗ (U+2217): dấu * thường bị khung mô tả hiểu là chữ đậm nên mất
  });
  const che = hetHan ? cheSo : anDuoi;
  const d = {
    ...dGoc,
    descriptionParas: dGoc.descriptionParas.map(che),
    listing: { ...dGoc.listing, ...(dGoc.listing.desc ? { desc: che(dGoc.listing.desc) } : {}) },
  };
  const l = d.listing;
  // Tiêu đề có thể xuống dòng (15/10/2026): trang tin hiện đúng chỗ xuống dòng; mọi chỗ khác dùng một dòng.
  const tieuDe1Dong = l.title.replace(/\s+/g, " ").trim();
  // Hạng CVR của tin (đồng bộ với thẻ tin V.7). Không có huy hiệu → tin thường.
  const tier = l.badge ? getTier(tierFromBadge(l.badge)) : null;

  // Liên hệ: LUÔN là NGƯỜI ĐĂNG (thành viên) — tin thuộc về thành viên, Coastal Land
  // chỉ là cổng thông tin, KHÔNG đứng tên/không môi giới. Người đăng chưa nhập liên hệ
  // riêng → tên chung "Người đăng tin" + số hotline THẬT để nút gọi/Zalo còn hoạt động.
  // Người đăng CHƯA nhập liên hệ → KHÔNG hiện số nào cả (trước đây đổ về số mẫu
  // "0905 000 111", sau đó là hotline Coastal Land). Thà không có nút gọi còn hơn
  // đưa khách một số KHÔNG phải của người bán — Coastal Land không đứng ra giao dịch.
  const contact = d.contact;
  // TIN THUỘC DỰ ÁN — hiện TÊN dự án ở khối Đặc điểm. Dự án đã tạo trong admin thì
  // bấm sang được trang dự án; chưa tạo thì vẫn hiện tên (chủ dự án cập nhật sau),
  // không để tên dự án rơi mất như trước.
  // Tìm trang dự án: theo MÃ (chọn trong danh sách) hoặc theo TÊN khách tự ghi trùng một dự án đã có.
  // Tin gắn dự án trong admin chỉ lưu mã → tên lấy từ trang dự án (trước đây mất hẳn dòng "Dự án").
  // Mã lệch chút ít với dự án đã có ("golden-bay" ↔ "goldenbay") vẫn về đúng trang dự án thật (cungDuAn, 21/10/2026).
  const duAn = (d.projectSlug ? await getProject(d.projectSlug) : null)
    ?? (d.projectSlug || d.projectName
      ? (await getProjects()).find((p) => cungDuAn(p.slug, d.projectSlug) || cungDuAn(p.name, d.projectName) || cungDuAn(p.name, d.projectSlug)) ?? null
      : null);
  // Có hồ sơ dự án thì dùng TÊN TRONG HỒ SƠ (một tên chuẩn cho mọi tin — tin khách ghi lệch "Đá Nẵng Golden Bay" vẫn hiện đúng tên)
  const tenDuAn = duAn?.name || d.projectName || "";
  const slugDuAnTin = duAn?.slug ?? d.projectSlug ?? "";
  // CỔNG SĐT: full số CHỈ hiện khi khách đăng nhập (bấm → RPC reveal_contact ghi lead).
  // Server chỉ phát chuỗi CHE — số 10 chữ số, CHỈ che 3 số cuối (chủ dự án chốt 01/10/2026):
  // "0905 374 •••". Số đủ không nằm trong HTML, mỗi lượt xem số vẫn ghi thành lead cho người bán.
  const phoneDigits = contact ? chuanHoaSdt(contact.phone) : "";
  const phoneMask = phoneDigits ? `${phoneDigits.slice(0, 4)} ${phoneDigits.slice(4, 7)} ***` : "Xem số";

  // Schema.org RealEstateListing (IV.2) — dữ liệu chuẩn cho Google.
  const priceVnd = parseVnd(l.price);
  const areaNum = parseFloat(l.area.replace(",", "."));
  // TOẠ ĐỘ để khai `geo` (ưu tiên điểm admin ghim; không có thì thử chuỗi bản đồ).
  const geo = parseLatLng(l.mapPin ?? d.mapQuery);
  const tinhTP = provinceOf(l.location);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: tieuDe1Dong,
    description: `${tieuDe1Dong} tại ${l.location}. Diện tích ${l.area}, giá ${l.price}.`,
    // URL tuyệt đối + ngày đăng: Google nối đúng schema với trang + có tín hiệu độ tươi.
    url: `https://coastalland.vn/bat-dong-san/${l.id}`,
    image: d.images,
    ...(l.postedAt ? { datePosted: l.postedAt } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: l.location,
      ...(tinhTP ? { addressRegion: tinhTP } : {}),
      addressCountry: "VN",
    },
    ...(geo ? { geo: { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lng } } : {}),
    ...(l.beds ? { numberOfRooms: l.beds } : {}),
    ...(Number.isNaN(areaNum) ? {} : { floorSize: { "@type": "QuantitativeValue", value: areaNum, unitCode: "MTK" } }),
    ...(priceVnd == null ? {} : { offers: { "@type": "Offer", priceCurrency: "VND", price: priceVnd, availability: "https://schema.org/InStock" } }),
  };

  // Mục đích tin → breadcrumb + tin liên quan cùng mục đích (bán/thuê)
  const purpose = l.purpose ?? "ban";

  // NHÃN DIỆN TÍCH theo loại hình — căn hộ / nhà phố mà ghi "Diện tích đất" là sai.
  // Nhãn diện tích lấy chung một chỗ với form đăng tin để hai bên không lệch nhau
  const nhanDienTich = nhanDienTichTheoLoai(l.type).replace(" (m²)", "");
  const nhanGia = purpose === "thue" ? "Giá thuê" : "Mức giá";

  // Tin tương tự — thứ tự ưu tiên đúng như đã chốt:
  //   1) BẮT BUỘC cùng MỤC ĐÍCH (bán↔bán, thuê↔thuê)
  //   2) cùng DỰ ÁN (+8) → 3) cùng QUẬN/HUYỆN (+4) → 4) cùng TỈNH (+2)
  //   5) cùng LOẠI HÌNH (+1)
  // Lấy HẾT (không giới hạn): slider hiện 8 tin đầu, "Xem thêm" đổ ra danh sách theo trang.
  const curProvince = provinceOf(l.location);
  const curDistrict = districtOf(l.location);
  const all = await getListings(); // B2: tin tương tự cũng lấy từ Supabase

  // Hai nguồn đưa chung vào bộ chọn 4 bậc: kho tự tính từ tin trên web + số Cowork nhập.
  const nhapTay = await getChiSoGia();
  // LỊCH SỬ GIÁ CẢ HAI MỤC ĐÍCH (chủ dự án 21/10/2026, như Batdongsan): cùng khu vực + loại hình, nút Mua bán · Cho thuê.
  // Mỗi mục đích một dãy riêng theo đúng bộ chọn 4 bậc của tin (chiSoChoTin) — không trộn số bán với số thuê.
  const mucTin: "ban" | "thue" = laTinThue(l.purpose) ? "thue" : "ban";
  const noiCua = (cs: ReturnType<typeof chiSoChoTin>) =>
    cs?.duAn && cs.duAn === l.projectSlug && d.projectName ? d.projectName : cs ? tenPhamVi(cs) : "";
  // Loại hình ghép ("Đất nền / Đất nền dự án") → lấy tên chung đứng đầu cho tiêu đề gọn: "đất nền"
  const tenLoai = l.type.split(" / ")[0].toLowerCase();
  const dayTheoMuc = async (muc: "ban" | "thue") => {
    const items = [...(await khoCuaMinh(l.diaGioi?.province ?? "", l.type, muc)), ...soNhapHopLe(nhapTay?.items)];
    const tinMuc = { ...l, purpose: muc };
    const chiSo = chiSoChoTin(tinMuc, { items }, { duAn: d.projectName, diaChi: d.addressDetail });
    // Chưa đủ 2 kỳ để vẽ → giá khu vực hiện tại từ BĐS đang rao trên web (23/10/2026)
    const hienTai = coDuLichSuGia(chiSo) ? null : giaHienTai(l, all, muc);
    return {
      chiSo,
      hienTai,
      capNhat: new Date().toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }),
      // Bảng so sánh khu vực / dự án lân cận: TẠM KHÔNG LÀM (chủ dự án 21/10/2026: chưa đủ cơ sở số liệu)
      lanCan: [],
      // Chưa có số: tên nơi theo dự án của tin, không có dự án thì theo phường, tỉnh của tin
      tieuDe: `Lịch sử giá ${muc === "thue" ? "thuê" : "bán"} ${tenLoai} tại ${(hienTai?.phamVi) || noiCua(chiSo) || d.projectName || l.location}`,
    };
  };
  const [giaBan, giaThue] = await Promise.all([dayTheoMuc("ban"), dayTheoMuc("thue")]);
  const samePurpose = all.filter((x) => x.id !== l.id && (x.purpose ?? "ban") === purpose);
  // HỆ SỐ X (tài liệu: "khuếch đại phân phối"): trong khối "Có thể bạn quan tâm",
  // VIP được ưu tiên NỔI hơn — Diamond > Gold > Silver. Cộng < 1 nên CHỈ sắp VIP
  // trước khi ĐỒNG độ liên quan, KHÔNG kéo tin VIP kém liên quan vượt tin khớp hơn
  // (giữ minh bạch: độ liên quan vẫn quyết định chính).
  const vipBoost = (badge?: string) =>
    badge === "VIP" ? 0.9 : badge === "Nổi bật" ? 0.6 : badge === "Mới" ? 0.3 : 0;
  const relatedFill = pickRelated(
    samePurpose,
    (x) =>
      // Tin cùng dự án LÊN ĐẦU "Bất động sản tương tự" (chủ dự án 22/10/2026), kể cả mã dự án ghi lệch chút ít; tin khác dự án sau
      (l.projectSlug && cungDuAn(x.projectSlug, l.projectSlug) ? 8 : 0) +
      (curDistrict && districtOf(x.location) === curDistrict ? 4 : 0) +
      (provinceOf(x.location) === curProvince ? 2 : 0) +
      (x.type === l.type ? 1 : 0) +
      vipBoost(x.badge),
    samePurpose.length,
  );

  // HTML NHẸ (SEO 15/10/2026): khối "tin tương tự" chỉ chở 8 tin bản nhẹ (bỏ mô tả + vùng tìm kiếm)
  // cho slide + danh sách mã; "Xem thêm" tự nạp dữ liệu đầy đủ. Trước đây chở đủ hơn 120 tin → trang 526KB.
  const relatedNhe = relatedFill.slice(0, 8).map(({ desc: _d, searchText: _s, ...the }) => the);
  const relatedIds = relatedFill.map((x) => x.id);

  const lienKetTin = (() => {
    const muc = laTinThue(l.purpose) ? "thue" : "ban";
    const tinh = khuVucList.find((k) => normalizeVi(k.name) === normalizeVi(tinhCuaTin(l)));
    if (!tinh) return [];
    const cat = (muc === "thue" ? rentCategories : saleCategories).find((c) => c.types.includes(l.type));
    return lienKetCho({ muc, tinh, ...(cat ? { cat } : {}) }, all).filter((g) => g.tieuDe === "Tìm kiếm theo từ khoá");
  })();

  // ĐƯỜNG DẪN CẤP (chuẩn thống nhất 17/10/2026, KE-HOACH-AIRBNB mục 2a bước 6): Nhà đất bán › tỉnh ›
  // loại hình › thành phố lớn hoặc phường › tin. HIỆN trên trang và KHỚP dữ liệu Google (MASTER mục 9) —
  // trước đây chỉ khai cho Google 2 cấp, trên trang không hiện. Dùng chung hàm dựng cấp của trang pSEO.
  const duongDanCap = (() => {
    const muc = laTinThue(l.purpose) ? "thue" : "ban";
    const tinh = khuVucList.find((k) => normalizeVi(k.name) === normalizeVi(tinhCuaTin(l)));
    if (!tinh) return [{ name: muc === "thue" ? "Nhà đất cho thuê" : "Nhà đất bán", href: muc === "thue" ? "/cho-thue" : "/mua-ban" }];
    const cat = (muc === "thue" ? rentCategories : saleCategories).find((c) => c.types.includes(l.type));
    const phuong = phuongCuaTin(l);
    const thanhPho = phuong ? THANH_PHO.find((t) => normalizeVi(t.tinh) === normalizeVi(tinh.name) && t.phuong.some((p) => normalizeVi(p) === normalizeVi(phuong))) : undefined;
    return duongDanPhanCap({ muc, tinh, ...(cat ? { cat } : {}), ...(thanhPho ? { thanhPho } : phuong ? { phuong } : {}) });
  })();

  // MENU DÍNH theo mục — cuộn tới đâu sáng mục đó (giống trang dự án).
  // Chỉ liệt kê mục THẬT SỰ có nội dung để không bấm vào chỗ trống.
  const nav = [
    ...(d.descriptionParas.length > 0 ? [{ id: "mo-ta", label: "Mô tả" }] : []),
    { id: "dac-diem", label: "Đặc điểm" },
    ...(d.interior.length > 0 ? [{ id: "noi-that", label: "Nội thất" }] : []),
    ...(d.amenityGroups.some((g) => g.items.some((it) => it.active)) ? [{ id: "tien-ich", label: "Tiện ích" }] : []),
    ...(priceVnd != null ? [{ id: "lich-su-gia", label: "Lịch sử giá" }] : []),
    { id: "vi-tri", label: "Vị trí" },
  ];

  return (
    <>
      <Header />
      {/* Tin hết hạn không đếm lượt xem — tin không còn đăng nữa. */}
      {!hetHan && <RecordView id={l.id} />}
      {/* Schema.org RealEstateListing — dữ liệu chuẩn cho Google (IV.2) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Đường dẫn cấp: CHỈ dữ liệu cho Google (JSON-LD), không hiện dòng chữ trên trang — chủ dự án 18/10/2026 */}
      <BreadcrumbJsonLd items={[...duongDanCap, { name: tieuDe1Dong, href: `/bat-dong-san/${l.id}` }]} />
      <main className="flex-1 bg-white">
        {/* MOBILE: pt-0 → ảnh tin nằm SÁT mép dưới header (không chừa khoảng trắng) */}
        <div className="mx-auto max-w-7xl px-4 pt-0 pb-footer sm:px-6 sm:pt-0 lg:px-8">

          <HomeExpandProvider>
          {/* TIN HẾT HẠN — CẤU TRÚC NHƯ BATDONGSAN (đo trang thật 03/10/2026, tin 45242191).
              Batdongsan làm HAI KIỂU:
              · MÁY TÍNH: thông báo + "Xem nội dung tin" → BĐS dành cho bạn (gợi ý LÊN TRƯỚC)
                → "Nội dung tin đăng".
              · ĐIỆN THOẠI: dải mảnh "Tin đã hết hạn…" → TOÀN BỘ tin như thường → khung
                "Gửi yêu cầu liên hệ" (thay số) → BĐS dành cho bạn ở CUỐI.
              Cả hai: số trong mô tả đã che, không hiện số người đăng. */}
          {hetHan && (
            <div className="-mx-4 mb-0 flex items-start gap-2.5 bg-[#f1ecf8] px-4 py-3 text-[13.5px] leading-relaxed text-cvr-ink sm:mx-0 lg:hidden">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#6b4fa0]" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
              <p>
                <b>Tin đã hết hạn hiển thị{l.hetHanLuc ? ` ngày ${new Date(l.hetHanLuc).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}` : ""}.</b>
              </p>
            </div>
          )}
          {hetHan && (
            <div className="hidden lg:block">
              <div className="mt-4 rounded-2xl border border-cvr-line bg-cvr-surface px-5 py-5 text-center sm:mt-6">
                <p className="text-[17px] font-semibold tracking-tight text-cvr-ink">Tin đăng này đã hết hạn trên Coastal Land.</p>
                <p className="mt-1.5 text-sm leading-relaxed text-cvr-muted">
                  Bạn có thể tham khảo những gợi ý dưới đây hoặc dùng công cụ tìm kiếm để tìm những tin đăng mới nhất.
                </p>
                <a href="#noi-dung-tin" className="mt-4 inline-flex h-10 items-center rounded-full border border-cvr-line bg-white px-5 text-sm font-semibold text-cvr-ink transition hover:border-cvr-ink">
                  Xem nội dung tin
                </a>
              </div>
              <ListingShowcase
                items={relatedNhe} idsDayDu={relatedIds}
                sectionKey="bds-tuong-tu"
                purpose={purpose === "thue" || purpose === "can-thue" ? "thue" : "ban"}
                title="Bất động sản dành cho bạn"
                heading="Bất động sản dành cho bạn"
                relevance
                emptyNote="Chưa có bất động sản tương tự."
              />
            </div>
          )}
          {/* Toàn bộ nội dung tin — ẩn khi bấm "Xem thêm" ở mục BĐS tương tự */}
          <HomeCollapsible>
          {hetHan && (
            <h2 id="noi-dung-tin" className="mb-4 mt-8 hidden scroll-mt-14 text-[19px] font-semibold tracking-tight text-cvr-ink sm:text-[22px] lg:block">
              Nội dung tin đăng
            </h2>
          )}

          {/* Thư viện ảnh THẬT — MOBILE tràn viền sát 2 mép + sát header (không khoảng trống) */}
          {/* Điện thoại: Gallery đã chốt. Máy tính: khung slide kiểu Batdongsan nằm trong cột trái (KhungAnhPC, 18/10/2026) */}
          <div className="-mx-4 mb-5 sm:hidden">
            <Gallery images={d.images} videos={d.videos} alt={tieuDe1Dong} listingId={l.id} banDo={{ diaChi: [d.addressDetail, l.location].filter(Boolean).join(", "), q: l.mapPin ?? d.mapQuery }} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
            {/* Cột chính */}
            <div className="reveal is-visible cards-stagger lg:col-span-2 [&>section:first-of-type]:mt-5">
              {/* !animate-none: hiệu ứng trượt của cột giữ transform → video "Xem full" / bộ xem lớn (fixed) bị nhốt trong cột */}
              <div className="hidden !animate-none sm:block">
                <KhungAnhPC images={d.images} videos={d.videos} alt={tieuDe1Dong} banDo={{ diaChi: [d.addressDetail, l.location].filter(Boolean).join(", "), q: l.mapPin ?? d.mapQuery }} />
              </div>
              {/* ═══ TỔNG QUAN TIN ═══ mở tin ra là thấy ngay, theo đúng thứ tự mắt
                  người đọc: tin có đáng tin không → là cái gì → ở đâu → bao nhiêu
                  tiền → rộng bao nhiêu → thông số → thao tác. */}
              <div className="mb-6">
                {/* Hàng nhận diện: hạng tin + mã tin — cho khách cảm giác tin có hồ
                    sơ, có mã tra cứu. Trước đây mã tin nằm tít dưới cột phải, trên
                    điện thoại gần như không ai nhìn thấy. */}
                {/* GỌN (chủ dự án 21/10/2026): dòng 1 hạng tin + Chia sẻ · dòng 2 mã tin · ngày đăng · hết hạn
                    trên MỘT dòng (trước điện thoại xếp 3 dòng riêng) */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {tier ? (
                      <span className="inline-block shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: tier.accent }}>
                        {tier.name}
                      </span>
                    ) : (
                      <span className="inline-block shrink-0 whitespace-nowrap rounded bg-cvr-surface px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cvr-muted ring-1 ring-cvr-line">
                        {getTier("basic").name}
                      </span>
                    )}
                    <span className="whitespace-nowrap text-[12px] font-medium text-cvr-faint">Mã tin: {l.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  {/* CHIA SẺ — đặt ngay đầu tin, ngang tầm mắt, không chiếm thêm
                      dòng nào. Nút Lưu / So sánh bỏ đi vì đã có sẵn trên từng thẻ
                      tin ngoài trang chủ và trang Mua bán / Cho thuê. */}
                  <ShareButtons title={tieuDe1Dong} />
                </div>
                {/* Mã tin · NGÀY ĐĂNG THẬT · NGÀY KẾT THÚC (chủ dự án chốt 01/10/2026, như Batdongsan) — mỗi mục không
                    ngắt giữa chừng; màn hẹp chỉ xuống dòng giữa các mục */}
                {/* dấu · nằm CUỐI mục trước → màn hẹp có xuống dòng thì dấu không đứng đầu dòng */}
                <p className="mt-2 flex flex-wrap gap-x-1 text-[12px] font-medium leading-relaxed text-cvr-faint">
                  {/* "Mã tin" cạnh hạng tin (dòng trên); "Hiệu lực · Hết hạn" chung MỘT dòng (chủ dự án 21/10/2026:
                      "Hiệu lực" = ngày tin lên web) */}
                  {(() => {
                    // Điện thoại năm 2 số (21/10/26) để chữ to trong Zalo / Facebook vẫn nằm MỘT dòng; máy tính năm đủ
                    const ngay = (s: string) => {
                      const d4 = new Date(s).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });
                      return <><span className="sm:hidden">{d4.slice(0, 6) + d4.slice(8)}</span><span className="hidden sm:inline">{d4}</span></>;
                    };
                    return [
                      l.postedAt && <>Hiệu lực: {ngay(l.postedAt)}</>,
                      l.hetHanLuc && <>Hết hạn: {ngay(l.hetHanLuc)}</>,
                    ];
                  })().filter(Boolean).map((m, i, a) => (
                    <span key={i} className="whitespace-nowrap">{m}{i < a.length - 1 ? " ·" : ""}</span>
                  ))}
                </p>

                {/* Tiêu đề — 21px trên điện thoại: đọc thoải mái mà vẫn thấy được
                    giá ngay bên dưới trong cùng một màn hình. */}
                {/* TIN HẾT HẠN (chốt 25/09/2026, theo Batdongsan): link cũ vẫn mở,
                    nói thẳng tin đã hết hạn, ẩn số người đăng, gợi ý tin tương tự bên dưới. */}
                <h1 className="mt-3 whitespace-pre-line break-words text-[21px] font-semibold leading-[1.3] tracking-tight text-cvr-ink sm:text-[28px]">{giuCum(l.title, [...tenDiaDanh(l), tenDuAn])}</h1>
                {/* DỰ ÁN = VỊ TRÍ, NHÃN GỌN NGAY DƯỚI TIÊU ĐỀ (chủ dự án 22/10/2026: "để chỗ này đã hợp lý chưa — xem lại bố cục,
                    giao diện"): đọc từ lớn tới nhỏ — dự án → đường, phường → địa chỉ cũ; nhãn có viền nhìn là biết bấm được (sang
                    trang dự án), không còn dòng chữ xanh dài lẫn với địa chỉ. Khối Đặc điểm không có dòng "Dự án". */}
                {/* 23/10/2026 (chủ dự án: "phần ghi tên dự án và liên kết dưới tiêu đề — giao diện và liên kết cho chuyên nghiệp"):
                    một dòng gọn: biểu tượng toà nhà · TÊN dự án đậm (tên trong hồ sơ) · mũi tên; bỏ khung viền nền xám; thẳng hàng
                    với dòng địa chỉ ngay dưới ("2 cái dự án và vị trí lệch rất khó chịu"). Bấm sang trang dự án. Tên dài xuống dòng. */}
                {tenDuAn && (() => {
                  const ten = tenDuAn.replace(/^dự án\s+/i, "");
                  // CÙNG KHUÔN dòng địa chỉ bên dưới (biểu tượng 16px · cách 6px · chữ 14/15px) → hai dòng thẳng hàng biểu tượng lẫn chữ
                  const noi = (
                    <>
                      <svg className="mt-[2px] h-4 w-4 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 9h4a1 1 0 011 1v11M3 21h18M8 8h3M8 12h3M8 16h3" /></svg>
                      <span className="min-w-0 break-words font-semibold text-cvr-ink group-hover:underline">{ten}</span>
                      {slugDuAnTin && <svg className="mt-[5px] h-3.5 w-3.5 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}
                    </>
                  );
                  const cls = "group mt-2 flex max-w-full items-start gap-1.5 text-[14px] leading-relaxed sm:text-[15px]";
                  return slugDuAnTin
                    ? <Link href={`/du-an/${slugDuAnTin}`} className={cls}>{noi}</Link>
                    : <p className={cls}>{noi}</p>;
                })()}

                {/* ĐỊA CHỈ HAI DÒNG — người đăng nhập theo hệ nào cũng vậy:
                    · dòng trên: địa chỉ theo hệ MỚI (tên đang dùng hiện nay)
                    · dòng dưới: "Địa chỉ cũ: …"
                    Suy không ra tới cấp phường thì giữ nguyên chuỗi khách đã nhập —
                    thà giữ đúng cái họ ghi còn hơn hiện một địa chỉ nửa vời. */}
                {(() => {
                  // l.location đã là địa chỉ theo hệ MỚI (quy đổi ở listingsDb cho
                  // MỌI tin, kể cả tin đăng từ trước); l.locationCu là cách gọi cũ.
                  const tren = l.location;
                  const duoi = l.locationCu && l.locationCu !== tren ? l.locationCu : "";
                  return (
                    <>
                      <p className="mt-2 flex items-start gap-1.5 text-[14px] leading-relaxed text-cvr-muted sm:text-[15px]">
                        <svg className="mt-[2px] h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="min-w-0">{d.addressDetail ? d.addressDetail + ", " : ""}{tren}</span>
                      </p>
                      {duoi && (
                        <p className="mt-1 pl-[22px] text-[13px] text-cvr-faint">Địa chỉ cũ: {duoi}</p>
                      )}
                    </>
                  );
                })()}

                {/* KHỐI THÔNG TIN CHÍNH — mọi ô cùng bề ngang nên nội dung dài ngắn
                    khác nhau vẫn cân, không ô nào đẩy lệch ô nào. */}
                <div className="mt-5 rounded-2xl border border-cvr-line bg-white p-4">
                  {/* ĐIỆN THOẠI (chủ dự án 20/10/2026): mọi ô (giá, diện tích, PN, đường vào…) chảy chung MỘT
                      lưới 2 cột, khoảng cách đều, không còn ô trống lẻ; giá trị dài tự xuống dòng theo từ,
                      không ngắt giữa chữ. Máy tính giữ nguyên hai lưới 4 cột như cũ (sm:). */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:block">
                  {/* Bốn ô CÙNG BỀ NGANG — giá dài mấy cũng chỉ xuống dòng trong ô của
                      nó, không đẩy lệch các ô còn lại. Giá cùng màu, cùng cỡ các ô khác —
                      tin đã mở thì không bôi đỏ (chủ dự án 20/10/2026). */}
                  <div className="contents sm:grid sm:grid-cols-4 sm:gap-x-4 sm:gap-y-3">
                    <div className="min-w-0">
                      <p className="text-[12px] leading-[18px] text-cvr-muted">{nhanGia}</p>
                      <p className="mt-1 break-words text-[16px] font-semibold leading-[22px] text-cvr-ink">{l.price}</p>
                    </div>
                    {/* Tin thuê: tiền đặt cọc, kỳ thanh toán ngay sau giá thuê — cùng nhóm tiền (21/10/2026) */}
                    {d.tienDau.map((f) => (
                      <div key={f.label} className="min-w-0">
                        <p className="text-[12px] leading-[18px] text-cvr-muted">{f.label}</p>
                        <p className="mt-1 break-words text-[16px] font-semibold leading-[22px] text-cvr-ink">{f.value}</p>
                      </div>
                    ))}
                    <div className="min-w-0">
                      <p className="text-[12px] leading-[18px] text-cvr-muted">{nhanDienTich}</p>
                      <p className="mt-1 break-words text-[16px] font-semibold leading-[22px] text-cvr-ink">{l.area}</p>
                    </div>
                    {d.builtArea && (
                      <div className="min-w-0">
                        <p className="text-[12px] leading-[18px] text-cvr-muted">Diện tích sử dụng</p>
                        <p className="mt-1 break-words text-[16px] font-semibold leading-[22px] text-cvr-ink">{d.builtArea}</p>
                      </div>
                    )}
                    {l.pricePerM2 && (
                      <div className="min-w-0">
                        <p className="text-[12px] leading-[18px] text-cvr-muted">Giá / m²</p>
                        <p className="mt-1 break-words text-[16px] font-semibold leading-[22px] text-cvr-ink">{l.pricePerM2}</p>
                      </div>
                    )}
                    {/* Tin thuê: giá điện, giá nước, phí dịch vụ cuối hàng tiền */}
                    {d.tienSau.map((f) => (
                      <div key={f.label} className="min-w-0">
                        <p className="text-[12px] leading-[18px] text-cvr-muted">{f.label}</p>
                        <p className="mt-1 break-words text-[16px] font-semibold leading-[22px] text-cvr-ink">{f.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* THÔNG TIN CHÍNH — phòng ngủ/phòng tắm (nếu loại hình có) cộng
                      với bộ mục chính riêng của từng loại hình: đất thì chiều ngang ·
                      chiều dài · đường vào · loại đất; căn hộ thì tầng số… Chỉ hiện
                      mục ĐÃ CÓ dữ liệu, lưới tự xuống hàng nên không xén, không chồng. */}
                  {(l.beds || l.baths || d.direction || d.furnish || d.specsChinh.length > 0) && (
                    <div className="contents sm:mt-4 sm:grid sm:grid-cols-4 sm:gap-x-4 sm:gap-y-3 sm:border-t sm:border-cvr-line sm:pt-4">
                      {l.beds ? <MiniStat label="Phòng ngủ" value={l.beds + " PN"} /> : null}
                      {l.baths ? <MiniStat label="Phòng tắm" value={l.baths + " WC"} /> : null}
                      {d.specsChinh.map((f) => <MiniStat key={f.label} label={f.label} value={f.value} />)}
                      {d.direction && <MiniStat label="Hướng" value={d.direction} />}
                      {d.furnish && <MiniStat label="Nội thất" value={d.furnish} />}
                    </div>
                  )}
                  </div>
                </div>

                {/* Khối "Thuộc dự án" dưới giá ĐÃ BỎ (chủ dự án 22/10/2026: trùng dòng "Dự án" trong Đặc điểm bất động sản).
                    Tin → trang dự án đi qua dòng "Dự án" đó (bấm được khi có mã dự án). */}


              </div>

              {/* Menu dính — sáng theo mục đang xem, bấm để cuộn mượt (như trang dự án) */}
              <ProjectNav items={nav} />

              {/* Mô tả — chỉ hiện khi người đăng có viết (không bịa) */}
              {d.descriptionParas.length > 0 && (
                <Section id="mo-ta" title="Thông tin mô tả">
                  <MoTaThuGon>
                    <div className="space-y-3 text-[15px] leading-relaxed text-cvr-body">
                      <RichContent paragraphs={d.descriptionParas} title={tieuDe1Dong} wysiwyg />
                    </div>
                  </MoTaThuGon>
                </Section>
              )}

              {/* LINK CHÈN DƯỚI TIN — quyền lợi CVR Diamond, chỉ hiện khi tin còn hạng Diamond */}
              {tier?.id === "diamond" && d.linkChen && (
                <p className="-mt-2 mb-6 text-[15px]">
                  <span className="text-cvr-muted">Xem thêm: </span>
                  <a href={d.linkChen} target="_blank" rel="nofollow noopener noreferrer" className="break-all font-medium text-cvr-blue-ink underline">
                    {d.linkChen.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                </p>
              )}

              {/* Đặc điểm bất động sản — chỉ những gì đã nhập */}
              <Section id="dac-diem" title="Đặc điểm bất động sản">
                {/* KHÔNG LẶP LẠI mục đã nằm ở khối "Thông tin chính" phía trên
                    (giá · diện tích · phòng ngủ · phòng tắm · hướng · nội thất và
                    bộ mục chính của loại hình). Ở đây chỉ còn phần đặc điểm. */}
                <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  <Row label="Loại hình" value={l.type} />
                  {/* Dòng "Dự án" đã chuyển lên ngay dưới địa chỉ đầu tin (22/10/2026 — dự án là vị trí, không phải đặc điểm). */}
                  {d.specs.map((f) => <Row key={f.label} label={f.label} value={f.value} />)}
                  {/* Trống thì ẩn — không phơi "Chưa cập nhật" lên trang công khai (20/10/2026); thiếu thì VIỆC Cowork bổ sung */}
                  {d.legal && <Row label="Tình trạng pháp lý" value={d.legal} />}
                </div>
              </Section>

              {/* Nội thất — chỉ khi người đăng tick */}
              {d.interior.length > 0 && (
                <Section id="noi-that" title="Nội thất bàn giao">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {d.interior.map((a) => (
                      <span key={a} className="flex items-center gap-2 rounded-lg border border-cvr-line bg-white px-3 py-2.5 text-[13px] text-cvr-body">
                        <svg className="h-4 w-4 shrink-0 text-cvr-gold-ink" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {a}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Tiện ích — chỉ khi có mục được tick */}
              {d.amenityGroups.some((g) => g.items.some((it) => it.active)) && (
                <Section id="tien-ich" title="Tiện ích">
                  <div className="space-y-5">
                    {d.amenityGroups.map((g) => {
                      const active = g.items.filter((it) => it.active);
                      if (active.length === 0) return null;
                      return (
                        <div key={g.group}>
                          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-cvr-faint">{g.group}</p>
                          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                            {active.map((it) => (
                              <span key={it.name} className="flex items-center gap-2 rounded-lg border border-cvr-line bg-white px-3 py-2.5 text-[13px] text-cvr-body">
                                <svg className="h-4 w-4 shrink-0 text-cvr-gold-ink" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                {it.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* LỊCH SỬ GIÁ — có số thật thì vẽ; chưa đủ thì hiện "Dữ liệu sẽ được cập nhật" (chủ dự án 21/10/2026, thay quy định ẩn hẳn khối cũ). (cũ: ẨN HẲN cả khối (kể
                  cả tiêu đề). Tuyệt đối không chế số cho đủ hình, cũng không để
                  lại một dòng "chưa có dữ liệu" nói hộ điểm yếu của mình. */}
              {/* TÊN KHỐI THEO PHẠM VI CỦA CHÍNH CON SỐ LỚN (chỉ số) — dựng ở dayTheoMuc, đổi theo nút Mua bán / Cho thuê.
                  Đề "tại Phường Hòa Xuân" mà số là giá toàn Đà Nẵng thì người xem hiểu sai hẳn. */}
              {priceVnd != null && (
                <Section id="lich-su-gia">
                  <PriceHistory ban={giaBan} thue={giaThue} macDinh={mucTin} loaiHinh={tenLoai} giaTin={giaChoLichSu(l)} mauSo={mauSoCuaLoaiHinh(l.type)} />
                </Section>
              )}

              {/* Vị trí — dùng CHUNG khối bản đồ với trang dự án: xem & zoom ngay
                  trên trang · nút chỉ đường từ vị trí người xem · nút mở app / web
                  Google Maps · tiện ích xung quanh (bấm ra Google Maps).
                  Vị trí lấy theo điểm admin GHIM (details.mapPin); chưa ghim thì
                  tự tìm theo địa chỉ tin. */}
              <Section id="vi-tri" title="Vị trí trên bản đồ">
                {/* Địa chỉ dưới bản đồ ghi ĐỦ như đầu trang: số nhà, tên đường + phường, tỉnh (trước chỉ phường, tỉnh — 22/10/2026) */}
                <ProjectNearby mapQuery={d.mapQuery} address={[d.addressDetail, l.location].filter(Boolean).join(", ")} places={[]} zoom={d.mapZoom} />
              </Section>

              {/* ĐÁNH GIÁ TIN — ai đọc tin cũng đánh giá được, không cần xem số người đăng;
                  bấm gửi mới xác minh (đã đăng nhập / đã xác minh số thì gửi luôn). */}
              {/* Điện thoại: cách khối Vị trí đúng bằng khoảng giữa các khối khác (20/10/2026) */}
              <div className="mt-5 lg:mt-0"><KhoiDanhGiaTin listingId={l.id} /></div>
            </div>

            {/* Cột phụ — môi giới (dính khi cuộn) */}
            <aside className="lg:col-span-1">
              {/* Khung liên hệ DÍNH CỐ ĐỊNH khi cuộn — nếu nội dung cao hơn màn hình
                  thì tự cuộn BÊN TRONG khung, không bao giờ trôi khỏi tầm nhìn. */}
              <div className="no-scrollbar sticky top-20 max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto">
                {/* Điện thoại: ẨN — thanh liên hệ dính đáy màn đã có tên viết tắt, Zalo, Hiện số (chủ dự án 21/10/2026:
                    khối này trùng, thừa). Máy tính không có thanh đáy → giữ khối này ở cột phải. */}
                <div className="hidden rounded-2xl border border-cvr-line bg-white p-5 shadow-sm lg:block lg:rounded-none">
                  {/* Khối liên hệ (chủ dự án 21/10/2026): ẢNH ĐẠI DIỆN · TÊN NGƯỜI ĐĂNG · SỐ ĐIỆN THOẠI · ZALO — không nhãn,
                      không chữ nào dưới tên. ⚠️ Coastal Land là CỔNG THÔNG TIN, KHÔNG môi giới — tin thuộc về thành viên. */}
                  {contact ? (
                    <>
                      <div className="flex items-center gap-3.5">
                        {contact.avatar ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={contact.avatar} alt={contact.name} className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-cvr-line" />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-[17px] font-semibold text-cvr-ink ring-1 ring-cvr-line">
                            {(() => { const w = contact.name.trim().split(/\s+/).filter(Boolean); return ((w[0]?.[0] ?? "N") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); })()}
                          </div>
                        )}
                        <p className="min-w-0 break-words text-[17px] font-semibold leading-snug text-cvr-ink">{contact.name}</p>
                      </div>
                      {hetHan
                        ? <div className="mt-4"><YeuCauLienHeLai listingId={l.id} /></div>
                        : <ContactActions listingId={l.id} phoneMask={phoneMask} />}
                    </>
                  ) : (
                    <p className="text-sm leading-relaxed text-cvr-muted">
                      Tin này chưa có thông tin liên hệ.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-cvr-line bg-white p-5 text-[14px] shadow-sm lg:rounded-none">
                  {/* ⚠️ Thủ tục công chứng / sang tên là việc của MÔI GIỚI và hai
                      bên giao dịch — KHÔNG phải của Coastal Land. Ô này chỉ nêu
                      thông tin pháp lý + mức độ xác thực, không "cam kết". */}
                  {/* Câu chữ chủ dự án duyệt nguyên văn 21/10/2026 — không tự sửa. */}
                  <p className="font-semibold text-cvr-ink">Xác thực thông tin</p>
                  <ul className="mt-2.5 space-y-2 leading-relaxed text-cvr-body">
                    {/* Pháp lý ghi ĐÚNG giấy tờ khách ghi trên tin (Hợp đồng mua bán / Sổ đỏ / Sổ hồng…).
                        Không ghi, hoặc ghi "Thoả thuận" → bỏ hẳn dòng này (chủ dự án 21/10/2026). */}
                    {d.legal && !/th(ỏa|oả)\s*thuận/i.test(d.legal.normalize("NFC")) && (
                      <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> <span className="min-w-0 whitespace-pre-line break-words">Pháp lý: {d.legal}</span></li>
                    )}
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Đúng đặc điểm, địa chỉ, hình ảnh</li>
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Trong khoảng giá thị trường</li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>

          </HomeCollapsible>

          {/* BĐS tương tự — slide 8 tin · "Xem thêm" → danh sách theo trang (8 tin/trang),
              giữ ĐÚNG thứ tự ưu tiên tương tự; nội dung tin phía trên ẩn đi.
              Tiêu đề do chính khối tự dựng (ẩn khi mở danh sách → không lặp chữ,
              không chừa khoảng trống trên đầu). */}
          {/* Tin hết hạn: máy tính đã đưa gợi ý lên đầu trang; ĐIỆN THOẠI để ở cuối như Batdongsan. */}
          {hetHan && (
            <div className="lg:hidden">
              <ListingShowcase
                items={relatedNhe} idsDayDu={relatedIds}
                sectionKey="bds-danh-cho-ban-mb"
                purpose={purpose === "thue" || purpose === "can-thue" ? "thue" : "ban"}
                title="Bất động sản dành cho bạn"
                heading="Bất động sản dành cho bạn"
                relevance
                emptyNote="Chưa có bất động sản tương tự."
              />
            </div>
          )}
          {!hetHan && (
          <ListingShowcase
            items={relatedNhe} idsDayDu={relatedIds}
            sectionKey="bds-tuong-tu"
            purpose={purpose === "thue" || purpose === "can-thue" ? "thue" : "ban"}
            title="Bất động sản tương tự"
            heading="Bất động sản tương tự"
            relevance
            emptyNote="Chưa có bất động sản tương tự."
          />
          )}
          </HomeExpandProvider>
        </div>

        {/* Thanh liên hệ DÍNH (mobile) — Gọi / Zalo bám đáy màn hình (III.4).
            Tin chưa có liên hệ thì KHÔNG hiện thanh này (không có số để gọi). */}
        {contact && (
        <div data-do-cao="lienhe-h" className="an-khi-go-phim fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-cvr-line bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
          {hetHan ? <NutYeuCauLienHe /> : <ContactBarMobile listingId={l.id} phoneMask={phoneMask} avatar={contact.avatar} ten={contact.name} />}
        </div>
        )}
        {/* LIÊN KẾT VỀ TRANG pSEO (15/10/2026): trang tin dẫn về các trang "loại hình × tỉnh",
            phường, giá… đã đạt chuẩn — chữ trên link là đúng cụm từ khoá người tìm gõ. */}
        {/* Kiểu Google "Mọi người cũng tìm kiếm" như các trang pSEO (chủ dự án 18/10/2026) — in đậm phần khác loại hình + tỉnh của tin */}
        <div className="-mt-6 lg:-mt-10">{/* kéo lên bù phần đệm cuối khung trên (pb-footer) — khỏi hở trắng trước khối này */}
        <LienKetPseo nhom={lienKetTin} cau={`${laTinThue(l.purpose) ? "Cho thuê" : "Bán"} ${l.type} ${tinhCuaTin(l)}`} kieuGoogle />
        </div>
      </main>
      <Footer />
      {/* Chỗ trống cuối trang để thanh Gọi · Nhắn Zalo (dính đáy) không che dòng
          pháp lý cuối footer — cùng cơ chế với chỗ trống của tab bar ở các trang khác. */}
      {contact && <div className="footer-safe" aria-hidden />}
    </>
  );
}

function Section({ id, title, children }: { id?: string; title?: string; children: React.ReactNode }) {
  return (
    // scroll-mt-14 (56px) = CHỈ chừa thanh menu mục (~45px) + 11px — header + thanh quay lại đã do <html>
    // scroll-padding-top lo (globals.css). Trước đây scroll-mt-28 tính header hai lần → bấm menu xong tiêu đề
    // nằm cách thanh ~80px (chủ dự án 22/10/2026: "bấm chọn không hiện nội dung ngay đầu trang").
    // empty:hidden — khối bên trong không có gì để hiện (vd Lịch sử giá chưa đủ số) thì KHÔNG vẽ khung xám trống (22/10/2026).
    <section id={id} className="mt-5 scroll-mt-14 rounded-2xl bg-cvr-surface p-4 empty:hidden sm:p-5">
      {/* Không truyền title: khối tự dựng tiêu đề (Lịch sử giá đổi theo Mua bán / Cho thuê) */}
      {title && <h2 className="mb-4 text-[19px] font-semibold tracking-tight text-cvr-ink sm:text-[22px]">{title}</h2>}
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-cvr-line py-3 text-[15px]">
      <span className="shrink-0 whitespace-nowrap text-cvr-muted">{label}</span>
      {/* Giữ chỗ xuống dòng khách gõ, ngắt cả từ quá dài — không tràn khung. */}
      <span className="min-w-0 whitespace-pre-line break-words text-right font-medium text-cvr-ink">{value}</span>
    </div>
  );
}

// Thông số phụ trong khối giá — nhãn nhỏ mờ ở trên, giá trị đậm ở dưới.
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] leading-[18px] text-cvr-muted">{label}</p>
      {/* break-words chứ KHÔNG truncate: giá trị dài phải xuống dòng, không được
          cắt cụt bằng dấu "…" — người xem cần đọc đủ số liệu. whitespace-pre-line: giữ đúng
          chỗ xuống dòng khách tự ghi (ô "Khác — tự ghi", chủ dự án 15/10/2026). */}
      <p className="mt-1 whitespace-pre-line break-words text-[16px] font-semibold leading-[22px] text-cvr-ink">{value}</p>
    </div>
  );
}
