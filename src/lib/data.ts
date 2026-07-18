// Dữ liệu mẫu (tạm thời) — sau này thay bằng dữ liệu thật từ Supabase
// Ảnh đặt theo từng phân khúc: villa, căn hộ, nhà phố, đất nền, condotel, đất CN, kho xưởng

import { asset } from "@/lib/asset";
import { specForType, amenityGroups, interiorItems, furnishLevels } from "@/lib/listingSpec";
import { directionOptions } from "@/lib/filters";

// Ảnh dùng chung theo phân khúc (placeholder)
const seg = (name: string) => asset(`/images/segments/${name}.jpg`);
// 👉 Ảnh RIÊNG của từng tin / dự án — bỏ ảnh thật vào public/images/tin/ và public/images/du-an/
//    theo đúng tên file (xem public/images/tin/README.md để biết file nào ứng với tin nào).
const tin = (id: number) => asset(`/images/tin/${id}.jpg`);
const duan = (slug: string) => asset(`/images/du-an/${slug}.jpg`);

export type Listing = {
  id: string;
  title: string;
  price: string;
  pricePerM2?: string;
  area: string;
  beds?: number;
  baths?: number;
  location: string;
  type: string;
  image: string;
  badge?: "VIP" | "Nổi bật" | "Mới";
  // Mục đích tin: "ban" = mua bán (mặc định) · "thue" = cho thuê (giá tính theo tháng).
  // Phân tách rõ với "type" (sản phẩm/loại hình) để logic bán/thuê đúng trên mọi trang.
  purpose?: "ban" | "thue";
  // Tên NGƯỜI ĐĂNG THẬT (details.contact.name — khách hàng, kể cả khi admin đăng giùm).
  // Không có → thẻ tin hiện "Coastal Land".
  agentName?: string;
};

// Lọc tin theo mục đích (mặc định không có purpose = "ban")
export function listingsByPurpose(purpose: "ban" | "thue"): Listing[] {
  return featuredListings.filter((l) => (l.purpose ?? "ban") === purpose);
}

// Định dạng vị trí: "Phường/Xã, Quận/Huyện, Tỉnh" — khớp danh mục đơn vị hành chính
// (src/lib/locations.ts) để bộ lọc 3 cấp trả đúng kết quả. Giá tham chiếu mặt bằng 2026.
export const featuredListings: Listing[] = [
  // ===== Đà Nẵng (thị trường lõi) =====
  { id: "1", title: "Villa biển 3 tầng mặt tiền Võ Nguyên Giáp, view trực diện Mỹ Khê", price: "33 tỷ", area: "350 m²", beds: 5, baths: 6, location: "Phước Mỹ, Sơn Trà, Đà Nẵng", type: "Villa / Biệt thự biển", image: tin(1), badge: "VIP" },
  { id: "2", title: "Căn hộ The Filmore 2PN view sông Hàn, bàn giao cao cấp", price: "7,2 tỷ", area: "95 m²", beds: 2, baths: 2, location: "Hải Châu I, Hải Châu, Đà Nẵng", type: "Căn hộ / Chung cư", image: tin(2), badge: "Nổi bật" },
  { id: "3", title: "Nhà phố 4 tầng mặt tiền kinh doanh trung tâm Thanh Khê", price: "8,5 tỷ", area: "100 m²", beds: 4, baths: 4, location: "Tam Thuận, Thanh Khê, Đà Nẵng", type: "Nhà phố", image: tin(3) },
  { id: "4", title: "Đất nền KĐT sinh thái Hòa Xuân, sổ đỏ trao tay", price: "4,2 tỷ", pricePerM2: "42 tr/m²", area: "100 m²", location: "Hòa Xuân, Cẩm Lệ, Đà Nẵng", type: "Đất nền", image: tin(4), badge: "Mới" },
  { id: "5", title: "Condotel Wyndham Soleil full nội thất, cam kết lợi nhuận", price: "2,8 tỷ", area: "42 m²", beds: 1, baths: 1, location: "Thọ Quang, Sơn Trà, Đà Nẵng", type: "Condotel", image: tin(5) },
  { id: "6", title: "Nhà xưởng KCN Hòa Khánh 1.500m², sản xuất ngay", price: "Thỏa thuận", area: "1.500 m²", location: "Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng", type: "Nhà xưởng / Kho bãi", image: tin(6) },
  { id: "7", title: "Penthouse 3PN Sun Cosmo Residence view toàn cảnh biển", price: "13,5 tỷ", area: "165 m²", beds: 3, baths: 3, location: "Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng", type: "Căn hộ / Chung cư", image: tin(7), badge: "Nổi bật" },
  { id: "8", title: "Đất công nghiệp KCN Liên Chiểu 5.000m² cho thuê dài hạn", price: "Thỏa thuận", area: "5.000 m²", location: "Hòa Hiệp Bắc, Liên Chiểu, Đà Nẵng", type: "Đất công nghiệp", image: tin(8) },
  { id: "9", title: "Biệt thự sinh thái ven sông Hòa Xuân, sân vườn rộng", price: "12,5 tỷ", area: "220 m²", beds: 4, baths: 4, location: "Hòa Xuân, Cẩm Lệ, Đà Nẵng", type: "Villa / Biệt thự biển", image: tin(9), badge: "VIP" },
  { id: "10", title: "Shophouse khối đế dự án ven biển Ngũ Hành Sơn", price: "9,2 tỷ", area: "95 m²", beds: 3, baths: 3, location: "Hòa Hải, Ngũ Hành Sơn, Đà Nẵng", type: "Nhà phố", image: tin(10) },
  { id: "11", title: "Đất nền ven biển Hòa Hải, pháp lý hoàn chỉnh", price: "6,5 tỷ", pricePerM2: "65 tr/m²", area: "100 m²", location: "Hòa Hải, Ngũ Hành Sơn, Đà Nẵng", type: "Đất nền", image: tin(11) },
  { id: "12", title: "Căn hộ cao cấp 3PN trung tâm Hải Châu, full nội thất", price: "6,8 tỷ", area: "110 m²", beds: 3, baths: 2, location: "Thạch Thang, Hải Châu, Đà Nẵng", type: "Căn hộ / Chung cư", image: tin(12), badge: "VIP" },

  // ===== Huế (thị trường lõi) =====
  { id: "13", title: "Biệt thự nghỉ dưỡng sân vườn ven sông Hương", price: "14,5 tỷ", area: "260 m²", beds: 4, baths: 5, location: "Kim Long, Quận Phú Xuân, Huế", type: "Villa / Biệt thự biển", image: tin(13), badge: "VIP" },
  { id: "14", title: "Nhà vườn cổ kính khu An Cựu, kiến trúc Huế", price: "5,6 tỷ", area: "180 m²", beds: 3, baths: 2, location: "An Cựu, Quận Thuận Hóa, Huế", type: "Nhà phố", image: tin(14) },
  { id: "15", title: "Đất nền KĐT mới Hương Thủy, giá đầu tư", price: "2,1 tỷ", pricePerM2: "21 tr/m²", area: "100 m²", location: "Thủy Dương, Hương Thủy, Huế", type: "Đất nền", image: tin(15), badge: "Mới" },
  { id: "16", title: "Nhà phố mặt tiền trung tâm TP. Huế, tiện kinh doanh", price: "4,3 tỷ", area: "95 m²", beds: 3, baths: 3, location: "Phú Hội, Quận Phú Xuân, Huế", type: "Nhà phố", image: tin(16) },

  // ===== Quảng Nam (cũ) — nay thuộc TP. Đà Nẵng =====
  { id: "17", title: "Đất nền ven sông Cẩm Châu, Hội An – pháp lý đầy đủ", price: "5,4 tỷ", pricePerM2: "54 tr/m²", area: "100 m²", location: "Cẩm Châu, Hội An, Đà Nẵng", type: "Đất nền", image: tin(17), badge: "Mới" },
  { id: "18", title: "Nhà phố 3 tầng trung tâm Tam Kỳ", price: "4,1 tỷ", area: "95 m²", beds: 3, baths: 3, location: "An Mỹ, Tam Kỳ, Đà Nẵng", type: "Nhà phố", image: tin(18) },
  { id: "19", title: "Biệt thự nghỉ dưỡng ven biển Điện Dương, Điện Bàn", price: "9,7 tỷ", area: "200 m²", beds: 4, baths: 4, location: "Điện Dương, Điện Bàn, Đà Nẵng", type: "Villa / Biệt thự biển", image: tin(19), badge: "Nổi bật" },

  // ===== Quảng Ngãi =====
  { id: "20", title: "Đất nền KĐT mới Nghĩa Chánh, TP. Quảng Ngãi", price: "1,9 tỷ", pricePerM2: "19 tr/m²", area: "100 m²", location: "Nghĩa Chánh, TP. Quảng Ngãi, Quảng Ngãi", type: "Đất nền", image: tin(20) },
  { id: "21", title: "Nhà phố mặt tiền Trần Phú, TP. Quảng Ngãi", price: "3,3 tỷ", area: "88 m²", beds: 3, baths: 2, location: "Trần Phú, TP. Quảng Ngãi, Quảng Ngãi", type: "Nhà phố", image: tin(21) },

  // ===== Bình Định (cũ) — nay thuộc tỉnh Gia Lai =====
  { id: "22", title: "Căn hộ biển Quy Nhơn full nội thất, view vịnh", price: "2,7 tỷ", area: "62 m²", beds: 2, baths: 2, location: "Nguyễn Văn Cừ, TP. Quy Nhơn, Gia Lai", type: "Căn hộ / Chung cư", image: tin(22), badge: "Nổi bật" },
  { id: "23", title: "Đất nền KĐT An Nhơn, giá đầu tư hấp dẫn", price: "1,5 tỷ", pricePerM2: "15 tr/m²", area: "100 m²", location: "Bình Định, An Nhơn, Gia Lai", type: "Đất nền", image: tin(23), badge: "Mới" },
  { id: "24", title: "Villa biển trực diện vịnh Quy Nhơn", price: "18,9 tỷ", area: "280 m²", beds: 5, baths: 5, location: "Ghềnh Ráng, TP. Quy Nhơn, Gia Lai", type: "Villa / Biệt thự biển", image: tin(24), badge: "VIP" },

  // ===== CHO THUÊ (purpose: "thue") — giá tính THEO THÁNG, loại hình thuê (Kế hoạch V3) =====
  { id: "25", title: "Cho thuê căn hộ 2PN The Filmore view sông Hàn, full nội thất", price: "18 triệu/tháng", area: "95 m²", beds: 2, baths: 2, location: "Hải Châu I, Hải Châu, Đà Nẵng", type: "Căn hộ chung cư", image: tin(2), badge: "Nổi bật", purpose: "thue" },
  { id: "26", title: "Cho thuê căn hộ dịch vụ 1PN trung tâm Hải Châu, dọn vào ở ngay", price: "9 triệu/tháng", area: "45 m²", beds: 1, baths: 1, location: "Thạch Thang, Hải Châu, Đà Nẵng", type: "Căn hộ dịch vụ", image: tin(12), badge: "Mới", purpose: "thue" },
  { id: "27", title: "Cho thuê nhà riêng 3 tầng khu Mỹ An, gần biển Mỹ Khê", price: "22 triệu/tháng", area: "100 m²", beds: 4, baths: 4, location: "Mỹ An, Ngũ Hành Sơn, Đà Nẵng", type: "Nhà riêng", image: tin(3), purpose: "thue" },
  { id: "28", title: "Cho thuê nhà mặt phố Nguyễn Văn Linh, tiện kinh doanh", price: "40 triệu/tháng", area: "120 m²", beds: 3, baths: 3, location: "Nam Dương, Hải Châu, Đà Nẵng", type: "Nhà mặt phố", image: tin(10), badge: "VIP", purpose: "thue" },
  { id: "29", title: "Cho thuê văn phòng hạng B trung tâm Hải Châu, 120m² sàn thông", price: "28 triệu/tháng", area: "120 m²", location: "Thạch Thang, Hải Châu, Đà Nẵng", type: "Văn phòng", image: tin(7), purpose: "thue" },
  { id: "30", title: "Cho thuê mặt bằng cửa hàng phố biển Mỹ Khê, mặt tiền rộng", price: "45 triệu/tháng", area: "150 m²", location: "Phước Mỹ, Sơn Trà, Đà Nẵng", type: "Mặt bằng / Cửa hàng bán lẻ", image: tin(1), badge: "Nổi bật", purpose: "thue" },
  { id: "31", title: "Cho thuê kho xưởng KCN Hòa Khánh 1.500m², điện 3 pha", price: "Thỏa thuận", area: "1.500 m²", location: "Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng", type: "Thuê đất / Nhà xưởng / Kho bãi", image: tin(6), purpose: "thue" },
  { id: "32", title: "Cho thuê phòng trọ cao cấp gần ĐH Duy Tân, an ninh 24/7", price: "4,5 triệu/tháng", area: "30 m²", beds: 1, baths: 1, location: "Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng", type: "Nhà trọ / Phòng trọ", image: tin(5), purpose: "thue" },
  { id: "33", title: "Cho thuê nhà nguyên căn khu An Cựu, Huế — 3PN đầy đủ nội thất", price: "14 triệu/tháng", area: "180 m²", beds: 3, baths: 2, location: "An Cựu, Quận Thuận Hóa, Huế", type: "Nhà riêng", image: tin(14), purpose: "thue" },
];

export type Area = {
  name: string;
  count: string;
  image: string;
  href: string;
};

// Khu vực trọng điểm: DUYÊN HẢI MIỀN TRUNG + TÂY NGUYÊN (8 tỉnh/thành sau sát nhập 2025).
// 5 mục ĐẦU = bộ hiển thị trang chủ (Đà Nẵng lõi + Huế, Khánh Hòa, Quảng Ngãi, Gia Lai);
// các mục sau hiện khi bấm "Xem tất cả".
export const areas: Area[] = [
  { name: "Đà Nẵng", count: "1.240 tin", image: tin(1), href: "/mua-ban?tinh=Đà Nẵng" },
  { name: "Huế", count: "586 tin", image: tin(13), href: "/mua-ban?tinh=Huế" },
  { name: "Khánh Hòa", count: "212 tin", image: tin(5), href: "/mua-ban?tinh=Khánh Hòa" },
  { name: "Quảng Ngãi", count: "256 tin", image: tin(20), href: "/mua-ban?tinh=Quảng Ngãi" },
  { name: "Gia Lai", count: "298 tin", image: tin(24), href: "/mua-ban?tinh=Gia Lai" },
  { name: "Đắk Lắk", count: "164 tin", image: tin(9), href: "/mua-ban?tinh=Đắk Lắk" },
  { name: "Quảng Trị", count: "138 tin", image: tin(3), href: "/mua-ban?tinh=Quảng Trị" },
  { name: "Lâm Đồng", count: "180 tin", image: tin(19), href: "/mua-ban?tinh=Lâm Đồng" },
];

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
  content?: string[];
};

export const articles: Article[] = [
  { slug: "toan-canh-bds-da-nang-2026", title: "Toàn cảnh thị trường BĐS Đà Nẵng nửa cuối 2026", excerpt: "Phân tích xu hướng giá, nguồn cung và phân khúc tiềm năng tại Đà Nẵng – Huế trong giai đoạn cuối năm.", date: "12/06/2026", category: "Phân tích thị trường", image: seg("canho1") },
  { slug: "kinh-nghiem-phap-ly-dat-nen", title: "Kinh nghiệm kiểm tra pháp lý đất nền trước khi mua", excerpt: "5 bước thẩm định sổ đỏ, quy hoạch và tranh chấp giúp người mua tránh rủi ro khi xuống tiền.", date: "08/06/2026", category: "Cẩm nang", image: seg("datnen1") },
  { slug: "bds-nghi-duong-ven-bien-len-ngoi", title: "Bất động sản nghỉ dưỡng ven biển Miền Trung lên ngôi", excerpt: "Vì sao villa biển và condotel tại Đà Nẵng đang thu hút mạnh dòng tiền của nhà đầu tư phía Bắc?", date: "03/06/2026", category: "Đầu tư", image: seg("condotel1") },
  { slug: "co-hoi-can-ho-ven-song-han", title: "Cơ hội căn hộ ven sông Hàn cho người mua ở thực", excerpt: "Nguồn cung căn hộ trung tâm Đà Nẵng dồi dào, nhiều chính sách thanh toán linh hoạt cho người mua ở thực.", date: "01/06/2026", category: "Đầu tư", image: seg("canho2") },
  { slug: "thu-tuc-sang-ten-so-do-2026", title: "Hướng dẫn thủ tục sang tên sổ đỏ mới nhất 2026", excerpt: "Quy trình, hồ sơ và các khoản thuế phí cần biết khi sang tên quyền sử dụng đất tại Việt Nam.", date: "28/05/2026", category: "Cẩm nang", image: seg("nhapho1") },
  { slug: "ha-tang-giao-thong-mien-trung", title: "Hạ tầng giao thông kéo giá đất khu Tây Đà Nẵng", excerpt: "Loạt dự án cầu, đường vành đai mở ra dư địa tăng giá cho bất động sản vùng ven.", date: "22/05/2026", category: "Phân tích thị trường", image: seg("datnen2") },
  { slug: "vay-mua-nha-lai-suat-2026", title: "So sánh lãi suất vay mua nhà các ngân hàng 2026", excerpt: "Cập nhật lãi suất ưu đãi, thời gian vay và mẹo tối ưu dòng tiền khi vay mua bất động sản.", date: "18/05/2026", category: "Tài chính", image: seg("villa1") },
  { slug: "condotel-phap-ly-can-luu-y", title: "Đầu tư condotel: pháp lý và bài toán dòng tiền", excerpt: "Những điểm cần kiểm tra về pháp lý, cam kết lợi nhuận và đơn vị vận hành trước khi xuống tiền.", date: "12/05/2026", category: "Đầu tư", image: seg("condotel2") },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

// Tỉnh/thành = phần cuối chuỗi địa chỉ ("Hòa Hải, Ngũ Hành Sơn, Đà Nẵng" → "Đà Nẵng").
export function provinceOf(location: string): string {
  return location.split(",").pop()?.trim() ?? "";
}

// Quận/huyện = phần áp cuối ("Hòa Hải, Ngũ Hành Sơn, Đà Nẵng" → "Ngũ Hành Sơn").
export function districtOf(location: string): string {
  const parts = location.split(",").map((s) => s.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : "";
}

// Phân khúc = từ khoá loại hình chuẩn hoá, suy từ chuỗi type (khớp giữa dự án ↔ tin).
// Trả "" nếu không nhận ra (không tính là cùng phân khúc).
const SEGMENT_KEYWORDS = [
  "Căn hộ", "Condotel", "Villa", "Biệt thự", "Shophouse", "Nhà phố",
  "Nhà riêng", "Đất nền", "Đất công nghiệp", "Nhà xưởng", "Kho", "Đất",
];
export function segmentOf(type: string): string {
  return SEGMENT_KEYWORDS.find((k) => type.includes(k)) ?? "";
}

// Chọn N mục "liên quan" theo ĐIỂM relevance (cao → thấp), giữ thứ tự gốc khi bằng điểm,
// luôn trả đủ N nếu pool đủ (điểm 0 vẫn được lấy để lấp). Dùng chung cho BĐS/dự án/tin tức.
export function pickRelated<T>(pool: T[], score: (x: T) => number, n: number): T[] {
  return pool
    .map((x, i) => ({ x, s: score(x), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map((e) => e.x);
}

// Nội dung bài viết — dùng content nếu có, không thì sinh đoạn mẫu chuyên nghiệp
export function articleContent(a: Article): string[] {
  if (a.content?.length) return a.content;
  return [
    `${a.excerpt}`,
    `Theo ghi nhận của Coastal Land, thị trường bất động sản Duyên hải miền Trung tiếp tục cho thấy sự phân hoá rõ rệt giữa các phân khúc. Người mua ngày càng quan tâm đến tính pháp lý minh bạch, vị trí kết nối hạ tầng và tiềm năng khai thác dòng tiền dài hạn.`,
    `Các chuyên gia khuyến nghị nhà đầu tư và người mua ở thực nên kiểm chứng thông tin thực địa, đối chiếu quy hoạch và lựa chọn đơn vị môi giới uy tín để giảm thiểu rủi ro. Coastal Land cam kết cung cấp thông tin khách quan, kiểm chứng từng tin đăng trước khi công bố.`,
    `Để cập nhật phân tích thị trường mới nhất cũng như danh mục bất động sản phù hợp, quý khách có thể theo dõi chuyên mục Tin tức hoặc liên hệ trực tiếp đội ngũ chuyên viên của Coastal Land.`,
  ];
}

// ===== Chi tiết BĐS (suy ra từ dữ liệu cơ bản — nội dung đầy đủ kiểu Homedy) =====

// Lấy BĐS theo id
export function getListingById(id: string): Listing | undefined {
  return featuredListings.find((l) => l.id === id);
}

// Tóm tắt ngắn 2 dòng cho card (kiểu Homedy) — suy từ dữ liệu cơ bản
export function listingSummary(l: Listing): string {
  const place = l.location.split(",").slice(0, 2).map((s) => s.trim()).join(", ");
  const beds = l.beds ? ` • ${l.beds} PN` : "";
  return `${l.type} tại ${place}. Diện tích ${l.area}${beds}, pháp lý rõ ràng, kết nối tiện ích.`;
}

export type ListingDetail = {
  code: string;
  postedDate: string;
  gallery: string[];
  description: string[];
  features: { label: string; value: string }[];
  specs: { label: string; value: string }[];
  furnish: string;
  interior: string[];
  amenityGroups: { group: string; items: { name: string; active: boolean }[] }[];
  legal: string;
  direction: string;
  agent: { name: string; role: string; phone: string; zalo: string };
  mapQuery: string;
};

const directions = directionOptions;

// Dựng nội dung chi tiết đầy đủ từ một tin (đủ "dung lượng" mô tả, thư viện ảnh, tiện ích, môi giới)
export function buildListingDetail(l: Listing): ListingDetail {
  const idx = parseInt(l.id, 10) || 1;
  // Thư viện 6 ảnh THẬT: ảnh chính + các BĐS cùng loại hình (đồng bộ, chuyên nghiệp)
  const sameType = featuredListings.filter((x) => x.type === l.type && x.id !== l.id).map((x) => x.image);
  const others = featuredListings.filter((x) => x.type !== l.type).map((x) => x.image);
  const gallery = Array.from(new Set([l.image, ...sameType, ...others])).slice(0, 6);

  const dir = directions[idx % directions.length];
  const floors = l.type.includes("Đất") ? "—" : `${2 + (idx % 4)} tầng`;

  const description = [
    `${l.title} toạ lạc tại ${l.location} — một trong những vị trí được săn đón bậc nhất khu vực nhờ kết nối giao thông thuận tiện, gần trục đường chính, trường học, bệnh viện và trung tâm thương mại. Bất động sản phù hợp cho cả nhu cầu ở thực lẫn đầu tư sinh lời dài hạn.`,
    `Diện tích ${l.area}${l.beds ? `, thiết kế ${l.beds} phòng ngủ và ${l.baths ?? l.beds} phòng vệ sinh` : ""}, bố cục thông minh, tối ưu công năng và đón sáng tự nhiên. Hướng nhà ${dir} thoáng đãng, hợp phong thuỷ với đa số gia chủ. ${floors !== "—" ? `Công trình ${floors}, kết cấu vững chắc, vật liệu hoàn thiện cao cấp.` : "Đất vuông vức, mặt tiền rộng, sẵn sàng xây dựng hoặc tách thửa."}`,
    `Pháp lý minh bạch, sổ đỏ/sổ hồng chính chủ, hỗ trợ công chứng sang tên nhanh chóng. Coastal Land cam kết thông tin khách quan, kiểm chứng thực địa trước khi đăng tin. Mức giá ${l.price}${l.pricePerM2 ? ` (~${l.pricePerM2})` : ""} còn thương lượng cho khách thiện chí.`,
    `Liên hệ ngay để được tư vấn chi tiết, xem nhà thực tế và nhận thêm hình ảnh, video, hồ sơ pháp lý đầy đủ. Đội ngũ chuyên viên Coastal Land đồng hành cùng bạn từ khâu chọn lọc đến khi hoàn tất giao dịch.`,
  ];

  const features = [
    { label: "Mức giá", value: l.price },
    { label: "Diện tích", value: l.area },
    ...(l.pricePerM2 ? [{ label: "Giá / m²", value: l.pricePerM2 }] : []),
    ...(l.beds ? [{ label: "Phòng ngủ", value: `${l.beds} PN` }] : []),
    ...(l.baths ? [{ label: "Phòng tắm", value: `${l.baths} WC` }] : []),
    { label: "Hướng nhà", value: dir },
    { label: "Số tầng", value: floors },
    { label: "Loại hình", value: l.type },
  ];

  const furnish = furnishLevels[idx % furnishLevels.length];

  // Thuộc tính theo loại hình — để sẵn đủ trường, suy giá trị hợp lý (chưa có thì "Đang cập nhật")
  const specs = specForType(l.type).fields.map((f) => {
    let value = "Đang cập nhật";
    switch (f.key) {
      case "beds": value = l.beds ? `${l.beds}` : value; break;
      case "baths": value = l.baths ? `${l.baths}` : value; break;
      case "floors": value = floors !== "—" ? floors.replace(" tầng", "") : value; break;
      case "direction": case "balcony": value = dir; break;
      case "furnish": value = furnish; break;
      case "frontage": value = `${4 + (idx % 6)} m`; break;
      case "roadWidth": value = `${5 + (idx % 8)} m`; break;
      case "floor": value = `Tầng ${5 + (idx % 25)}`; break;
      case "block": value = `Block ${["A", "B", "C", "D"][idx % 4]}`; break;
      case "loaiCanho": value = ["Chung cư", "Duplex", "Penthouse", "Studio"][idx % 4]; break;
      case "landType": value = "Đất ở đô thị"; break;
      case "view": value = ["Biển", "Thành phố", "Hồ bơi", "Sông / núi"][idx % 4]; break;
      case "profit": value = "8%/năm"; break;
      case "operator": value = "Đơn vị quốc tế"; break;
      case "pccc": value = "Đã có"; break;
      case "power": value = "560 KVA"; break;
      case "term": value = "Lâu dài"; break;
      case "blocks": value = `Lô ${["A", "B", "C"][idx % 3]}${10 + (idx % 30)}`; break;
    }
    return { label: f.label + (f.unit ? ` (${f.unit})` : ""), value };
  });

  // Nội thất: chọn một tập con theo mức nội thất (mức cao → nhiều món hơn)
  const furnishCount = furnish === "Bàn giao thô" ? 0 : furnish === "Nội thất cơ bản" ? 6 : furnish === "Nội thất đầy đủ" ? 11 : interiorItems.length;
  const interior = interiorItems.slice(0, furnishCount);

  // Tiện ích: đánh dấu mục "có" (active) trên toàn bộ danh mục để hiển thị chuyên nghiệp
  const activeSet = new Set<string>();
  amenityGroups.forEach((g) => g.items.forEach((it, i) => { if ((idx + i) % 3 !== 0) activeSet.add(it); }));
  const grouped = amenityGroups.map((g) => ({
    group: g.group,
    items: g.items.map((name) => ({ name, active: activeSet.has(name) })),
  }));

  const agents = [
    { name: "Trương Thanh Tùng", role: "Chuyên viên cấp cao", phone: "0905 000 111", zalo: "0905000111" },
    { name: "Nguyễn Thị Hương", role: "Chuyên viên tư vấn", phone: "0905 222 333", zalo: "0905222333" },
    { name: "Lê Hoàng Nam", role: "Chuyên viên dự án", phone: "0905 444 555", zalo: "0905444555" },
  ];

  return {
    code: `CVR-${l.id.padStart(5, "0")}`,
    postedDate: "12/06/2026",
    gallery,
    description,
    features,
    specs,
    furnish,
    interior,
    amenityGroups: grouped,
    legal: "Sổ đỏ / Sổ hồng chính chủ",
    direction: dir,
    agent: agents[idx % agents.length],
    mapQuery: `${l.location}, Việt Nam`,
  };
}

export type Project = {
  slug: string;
  name: string;
  location: string;
  priceFrom: string;
  type: string;
  status: string;
  image: string;
  // Nội dung chi tiết riêng từng dự án (sát thực thị trường — số liệu tham khảo)
  developer: string;
  scale: { label: string; value: string }[];
  amenities: string[];
  overview: string[];
  photos?: string[]; // ảnh thật của dự án (cho thư viện ảnh) — nếu có sẽ ưu tiên
};

// ⚠️ Số liệu dự án mang tính tham khảo cho mẫu giao diện — cần đối chiếu công bố
//    chính thức của chủ đầu tư trước khi dùng cho mục đích giao dịch.
export const projects: Project[] = [
  {
    slug: "sun-cosmo-residence", name: "Sun Cosmo Residence",
    location: "Hòa Hải, Ngũ Hành Sơn, Đà Nẵng", priceFrom: "Từ 3,2 tỷ",
    type: "Căn hộ cao cấp ven sông", status: "Đang mở bán", image: duan("sun-cosmo-residence"),
    developer: "Sun Property (Sun Group)",
    scale: [
      { label: "Giá tham khảo", value: "Từ ~52 triệu/m²" },
      { label: "Loại hình", value: "Căn hộ 1–3PN, shophouse khối đế" },
      { label: "Quy mô", value: "Tổ hợp căn hộ cao tầng ven sông Cổ Cò" },
      { label: "Mật độ xây dựng", value: "Thấp, ưu tiên cảnh quan" },
      { label: "Pháp lý", value: "Sổ hồng lâu dài" },
      { label: "Bàn giao (dự kiến)", value: "2026" },
    ],
    amenities: ["Bể bơi ven sông", "Công viên ánh sáng", "Phòng gym & yoga", "Khu BBQ", "Shophouse khối đế", "An ninh 24/7", "Gần biển Mỹ Khê ~1,5km", "Bãi đỗ xe nhiều tầng"],
    overview: [
      "Sun Cosmo Residence là tổ hợp căn hộ cao cấp do Sun Property (Sun Group) phát triển, toạ lạc ven sông Cổ Cò, quận Ngũ Hành Sơn — khu vực phát triển năng động bậc nhất phía Đông Nam Đà Nẵng, cách bãi biển Mỹ Khê khoảng 1,5km.",
      "Dự án sở hữu tầm view sông và biển, thiết kế căn hộ tối ưu đón sáng và gió tự nhiên, hệ tiện ích nội khu đồng bộ: bể bơi, công viên, gym, khối đế shophouse thương mại. Vị trí kết nối nhanh về trung tâm qua cầu Trần Thị Lý và trục Võ Văn Kiệt.",
      "Phù hợp cho cả an cư và đầu tư cho thuê nhờ lượng khách du lịch lớn quanh năm. Coastal Land cung cấp thông tin khách quan, hỗ trợ pháp lý và chính sách vay đến 70% giá trị căn hộ.",
    ],
  },
  {
    slug: "the-filmore-da-nang", name: "The Filmore Đà Nẵng",
    location: "Hải Châu I, Hải Châu, Đà Nẵng", priceFrom: "Từ 5,8 tỷ",
    type: "Căn hộ hạng sang bên sông Hàn", status: "Sắp bàn giao", image: duan("the-filmore-da-nang"),
    developer: "Filmore Development",
    scale: [
      { label: "Giá tham khảo", value: "Từ ~75 triệu/m²" },
      { label: "Loại hình", value: "Căn hộ hạng sang số lượng giới hạn" },
      { label: "Quy mô", value: "Toà căn hộ cao tầng bên sông Hàn" },
      { label: "Mật độ căn/sàn", value: "Ít căn mỗi tầng, riêng tư" },
      { label: "Pháp lý", value: "Sổ hồng lâu dài" },
      { label: "Bàn giao (dự kiến)", value: "2025–2026" },
    ],
    amenities: ["View 360° sông Hàn – biển", "Sky lounge tầng cao", "Hồ bơi tràn bờ", "Dịch vụ chuẩn khách sạn", "Hầm đỗ xe", "Phòng gym & spa", "Sảnh đón sang trọng", "An ninh nhiều lớp"],
    overview: [
      "The Filmore Đà Nẵng là dự án căn hộ hạng sang do Filmore Development phát triển, nằm trên đường Như Nguyệt ven sông Hàn, quận Hải Châu — vị trí trung tâm hiếm có với tầm nhìn trực diện dòng sông và thành phố.",
      "Dự án định vị phân khúc siêu sang với số lượng căn giới hạn, mỗi tầng ít căn nhằm tối đa sự riêng tư, đi kèm hệ tiện ích đẳng cấp: sky lounge, hồ bơi tràn bờ, dịch vụ vận hành chuẩn khách sạn 5 sao.",
      "Đây là lựa chọn cho khách hàng tìm kiếm không gian sống trung tâm, giá trị tài sản bền vững và khả năng cho thuê cao. Coastal Land hỗ trợ xem nhà mẫu, tư vấn pháp lý và phương án tài chính.",
    ],
  },
  {
    slug: "khu-do-thi-fpt-city", name: "Khu đô thị FPT City Đà Nẵng",
    location: "Hòa Hải, Ngũ Hành Sơn, Đà Nẵng", priceFrom: "Từ 4,5 tỷ",
    type: "Khu đô thị · Nhà phố · Biệt thự", status: "Đang mở bán", image: duan("khu-do-thi-fpt-city"),
    developer: "Tập đoàn FPT",
    scale: [
      { label: "Giá đất tham khảo", value: "Từ ~40 triệu/m²" },
      { label: "Loại hình", value: "Đất nền, nhà phố, biệt thự" },
      { label: "Quy mô", value: "Khu đô thị quy mô lớn ~181 ha" },
      { label: "Điểm nhấn", value: "Liền kề ĐH FPT & FPT Complex" },
      { label: "Pháp lý", value: "Sổ đỏ từng nền" },
      { label: "Hạ tầng", value: "Đã hoàn thiện, dân cư hiện hữu" },
    ],
    amenities: ["Đại học FPT liền kề", "Hồ điều hoà & công viên", "Gần biển Non Nước", "Trục Võ Chí Công", "Khu thể thao", "Đường nội khu rộng", "Hệ thống chiếu sáng", "Gần TTHC quận"],
    overview: [
      "FPT City Đà Nẵng là khu đô thị quy mô lớn do Tập đoàn FPT phát triển tại quận Ngũ Hành Sơn, nổi bật với hệ sinh thái giáo dục – công nghệ khi liền kề Đại học FPT và FPT Complex, nơi tập trung hàng nghìn chuyên gia, kỹ sư.",
      "Khu đô thị cung cấp đa dạng sản phẩm: đất nền, nhà phố, biệt thự với hạ tầng đã hoàn thiện và cộng đồng dân cư hiện hữu — yếu tố quan trọng đảm bảo thanh khoản và nhu cầu thuê thực.",
      "Vị trí gần biển Non Nước, kết nối trung tâm qua trục Võ Chí Công, phù hợp cho gia đình an cư lẫn nhà đầu tư khai thác cho thuê chuyên gia. Coastal Land hỗ trợ chọn nền/căn và thủ tục sang tên.",
    ],
  },
  {
    slug: "aria-da-nang-hotel-resort", name: "Aria Đà Nẵng Hotel & Resort",
    location: "Thọ Quang, Sơn Trà, Đà Nẵng", priceFrom: "Từ 2,9 tỷ",
    type: "Condotel · Khách sạn nghỉ dưỡng ven biển", status: "Đang mở bán", image: duan("aria-da-nang-hotel-resort"),
    developer: "Coastal Land phân phối",
    scale: [
      { label: "Giá tham khảo", value: "Từ 2,9 tỷ/căn" },
      { label: "Loại hình", value: "Condotel, căn hộ nghỉ dưỡng" },
      { label: "Vị trí", value: "Mặt tiền biển bán đảo Sơn Trà" },
      { label: "Khai thác", value: "Đơn vị vận hành chuyên nghiệp" },
      { label: "Pháp lý", value: "Sở hữu theo quy định condotel" },
      { label: "Tình trạng", value: "Đang mở bán" },
    ],
    amenities: ["Mặt tiền biển", "Hồ bơi & bãi tắm riêng", "Nhà hàng – bar", "Spa & gym", "Dịch vụ phòng 24/7", "Khu hội nghị", "Gần cảng du thuyền", "Đưa đón sân bay"],
    overview: [
      "Aria Đà Nẵng Hotel & Resort là dự án condotel – khách sạn nghỉ dưỡng nằm trên cung đường biển Võ Nguyên Giáp, khu vực bán đảo Sơn Trà — một trong những toạ độ du lịch sôi động nhất Đà Nẵng.",
      "Sản phẩm hướng đến nhà đầu tư khai thác dòng tiền cho thuê nghỉ dưỡng, với mặt tiền biển, hệ tiện ích resort và đơn vị vận hành chuyên nghiệp giúp tối ưu công suất phòng quanh năm.",
      "Coastal Land tư vấn minh bạch về pháp lý condotel, chính sách cam kết/chia sẻ lợi nhuận và tiềm năng tăng giá theo hạ tầng du lịch khu vực.",
    ],
  },
  {
    slug: "khu-do-thi-sinh-thai-hoa-xuan", name: "Khu đô thị sinh thái Hòa Xuân",
    location: "Hòa Xuân, Cẩm Lệ, Đà Nẵng", priceFrom: "Từ 4,0 tỷ",
    type: "Khu đô thị sinh thái · Nhà phố · Biệt thự", status: "Đang mở bán", image: duan("khu-do-thi-sinh-thai-hoa-xuan"),
    developer: "Sun Group",
    scale: [
      { label: "Giá tham khảo", value: "Từ ~40 triệu/m²" },
      { label: "Loại hình", value: "Đất nền, nhà phố, biệt thự" },
      { label: "Quy mô", value: "Khu đô thị sinh thái ven sông" },
      { label: "Điểm nhấn", value: "Cạnh SVĐ Hoà Xuân" },
      { label: "Pháp lý", value: "Sổ đỏ từng nền" },
      { label: "Hạ tầng", value: "Hoàn thiện, nhiều cư dân" },
    ],
    amenities: ["Ven sông Cẩm Lệ", "Công viên & mảng xanh", "Sân vận động Hoà Xuân", "Trường học liền kề", "Chợ & TTTM", "Đường lớn nội khu", "Gần cầu Hoà Xuân", "Khu dân trí cao"],
    overview: [
      "Khu đô thị sinh thái Hòa Xuân là khu dân cư quy hoạch bài bản do Sun Group phát triển tại quận Cẩm Lệ, nổi bật với hệ thống sông – hồ – công viên tạo nên môi trường sống trong lành ngay trong lòng thành phố.",
      "Khu đô thị có hạ tầng hoàn thiện, cộng đồng cư dân đông đúc, gần Sân vận động Hoà Xuân và các tiện ích giáo dục – thương mại, đảm bảo nhu cầu ở thực và khả năng tăng giá ổn định.",
      "Sản phẩm đa dạng từ đất nền đến nhà phố, biệt thự, phù hợp nhiều nhu cầu. Coastal Land hỗ trợ lựa chọn vị trí lô, kiểm tra quy hoạch và thủ tục công chứng.",
    ],
  },
  {
    slug: "casamia-hoi-an", name: "Casamia Hội An",
    location: "Cẩm Châu, Hội An, Đà Nẵng", priceFrom: "Từ 6,5 tỷ",
    type: "Biệt thự sinh thái ven sông", status: "Sắp mở bán", image: duan("casamia-hoi-an"),
    developer: "Đạt Phương Group",
    scale: [
      { label: "Giá tham khảo", value: "Từ 6,5 tỷ/căn" },
      { label: "Loại hình", value: "Biệt thự, nhà phố sinh thái" },
      { label: "Vị trí", value: "Ven sông, gần phố cổ Hội An" },
      { label: "Điểm nhấn", value: "Không gian sinh thái sông nước" },
      { label: "Pháp lý", value: "Sổ hồng lâu dài" },
      { label: "Tình trạng", value: "Sắp mở bán" },
    ],
    amenities: ["Ven sông Cẩm Châu", "Cách phố cổ ~2km", "Bến thuyền nội khu", "Công viên sinh thái", "Clubhouse", "Gần biển An Bàng", "Cảnh quan cây xanh", "An ninh khép kín"],
    overview: [
      "Casamia Hội An là khu biệt thự – nhà phố sinh thái do Đạt Phương Group phát triển, lấy cảm hứng từ không gian sông nước đặc trưng của Hội An, toạ lạc ven sông thuộc phường Cẩm Châu, cách phố cổ khoảng 2km.",
      "Dự án đề cao yếu tố nghỉ dưỡng – sinh thái với hệ thống kênh, cây xanh, bến thuyền và tiện ích nội khu, phù hợp second-home và khai thác lưu trú du lịch tại đô thị di sản.",
      "Với nguồn cầu du lịch ổn định của Hội An, sản phẩm có tiềm năng cho thuê và tăng giá tốt. Coastal Land cung cấp thông tin pháp lý và tiến độ minh bạch.",
    ],
  },
  {
    slug: "flc-quy-nhon-beach-golf", name: "FLC Quy Nhơn Beach & Golf Resort",
    location: "Nhơn Lý, TP. Quy Nhơn, Gia Lai", priceFrom: "Từ 2,5 tỷ",
    type: "Biệt thự biển · Condotel · Sân golf", status: "Đang mở bán", image: duan("flc-quy-nhon-beach-golf"),
    developer: "Tập đoàn FLC",
    scale: [
      { label: "Giá tham khảo", value: "Từ 2,5 tỷ/sản phẩm" },
      { label: "Loại hình", value: "Biệt thự biển, condotel, shophouse" },
      { label: "Quy mô", value: "Quần thể nghỉ dưỡng ven biển" },
      { label: "Điểm nhấn", value: "Sân golf links bên biển" },
      { label: "Vị trí", value: "Khu Nhơn Lý – gần Kỳ Co, Eo Gió" },
      { label: "Tình trạng", value: "Đang mở bán" },
    ],
    amenities: ["Bãi biển riêng", "Sân golf 18 hố", "Gần Kỳ Co – Eo Gió", "Hồ bơi & spa", "Quần thể nhà hàng", "Khu vui chơi", "Đơn vị vận hành resort", "Hạ tầng đồng bộ"],
    overview: [
      "FLC Quy Nhơn Beach & Golf Resort là quần thể du lịch – nghỉ dưỡng – thể thao do Tập đoàn FLC phát triển tại khu vực Nhơn Lý, TP. Quy Nhơn, liền kề các thắng cảnh nổi tiếng Kỳ Co và Eo Gió.",
      "Quần thể gồm biệt thự biển, condotel, shophouse cùng sân golf links bên biển và hệ tiện ích nghỉ dưỡng quy mô lớn, hướng đến dòng khách du lịch đang tăng mạnh tại Quy Nhơn (Gia Lai).",
      "Sản phẩm phù hợp đầu tư khai thác cho thuê và sở hữu kỳ nghỉ. Coastal Land tư vấn pháp lý, chính sách bán hàng và tiềm năng khu vực.",
    ],
  },
  {
    slug: "khu-do-thi-an-cuu-city", name: "Khu đô thị An Cựu City",
    location: "An Cựu, Quận Thuận Hóa, Huế", priceFrom: "Từ 3,1 tỷ",
    type: "Khu đô thị · Nhà phố · Shophouse", status: "Đang mở bán", image: duan("khu-do-thi-an-cuu-city"),
    developer: "Tập đoàn IMG",
    scale: [
      { label: "Giá tham khảo", value: "Từ 3,1 tỷ/căn" },
      { label: "Loại hình", value: "Nhà phố, shophouse, đất nền" },
      { label: "Quy mô", value: "Khu đô thị khép kín phía Nam TP. Huế" },
      { label: "Điểm nhấn", value: "Hạ tầng & tiện ích hoàn thiện" },
      { label: "Pháp lý", value: "Sổ đỏ/sổ hồng" },
      { label: "Hạ tầng", value: "Dân cư hiện hữu sầm uất" },
    ],
    amenities: ["Trung tâm thương mại", "Trường học liền kề", "Công viên nội khu", "Gần ga & QL1A", "Shophouse kinh doanh", "An ninh khép kín", "Đường nội khu rộng", "Gần trung tâm TP. Huế"],
    overview: [
      "An Cựu City là khu đô thị khép kín do Tập đoàn IMG phát triển tại phía Nam thành phố Huế, một trong những khu dân cư hiện đại và sầm uất bậc nhất cố đô với hạ tầng, tiện ích đã hoàn thiện.",
      "Khu đô thị quy tụ trung tâm thương mại, trường học, công viên và tuyến shophouse kinh doanh nhộn nhịp, mang lại giá trị khai thác thương mại và nhu cầu ở thực cao.",
      "Vị trí kết nối thuận tiện về trung tâm Huế và Quốc lộ 1A. Coastal Land hỗ trợ chọn sản phẩm nhà phố/shophouse phù hợp mục tiêu ở hoặc kinh doanh.",
    ],
  },
  {
    slug: "vinhomes-skylake-dream", name: "Vinhomes Skylake — Dream Apartment",
    location: "Phạm Hùng, Nam Từ Liêm, Hà Nội", priceFrom: "Từ 3,5 tỷ",
    type: "Căn hộ cao cấp", status: "Đang mở bán", image: asset("/images/duan-vinhomes-2.jpg"),
    developer: "Vinhomes (Tập đoàn Vingroup)",
    photos: [asset("/images/duan-vinhomes-2.jpg"), asset("/images/duan-vinhomes.jpg")],
    scale: [
      { label: "Giá tham khảo", value: "Từ ~60 triệu/m²" },
      { label: "Loại hình", value: "Căn hộ 1–3PN, duplex, penthouse" },
      { label: "Quy mô", value: "Tổ hợp căn hộ cao tầng khu Mễ Trì" },
      { label: "Điểm nhấn", value: "View hồ điều hoà, tiện ích all-in-one" },
      { label: "Pháp lý", value: "Sổ hồng lâu dài" },
      { label: "Bàn giao (dự kiến)", value: "Bàn giao full nội thất" },
    ],
    amenities: ["Bể bơi bốn mùa", "Công viên & hồ điều hoà", "Trung tâm thương mại Vincom", "Vinschool liền kề", "Phòng gym & spa", "An ninh nhiều lớp", "Hầm đỗ xe thông minh", "Gần tuyến Metro & vành đai 3"],
    overview: [
      "Vinhomes Skylake — Dream Apartment là tổ hợp căn hộ cao cấp do Vinhomes (Tập đoàn Vingroup) phát triển tại khu Mễ Trì, Nam Từ Liêm, Hà Nội — trung tâm hành chính mới phía Tây Thủ đô.",
      "Dự án sở hữu hệ tiện ích all-in-one đẳng cấp: bể bơi bốn mùa, công viên hồ điều hoà, TTTM Vincom, hệ thống Vinschool – Vinmec, cùng thiết kế căn hộ tối ưu công năng và đón sáng tự nhiên.",
      "Vị trí kết nối nhanh qua đại lộ Phạm Hùng, vành đai 3 và tuyến Metro, thuận tiện cho cả an cư lẫn đầu tư cho thuê. Coastal Land hỗ trợ tư vấn pháp lý, chính sách bán hàng và phương án tài chính.",
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export type ProjectDetail = {
  gallery: string[];
  overview: string[];
  scale: { label: string; value: string }[];
  amenities: string[];
  developer: string;
  handover: string;
  mapQuery: string;
};

export function buildProjectDetail(p: Project): ProjectDetail {
  // Thư viện ảnh: ưu tiên ảnh THẬT của dự án (photos), sau đó bổ sung từ dự án khác
  const gallery = Array.from(
    new Set([...(p.photos ?? [p.image]), ...projects.filter((x) => x.slug !== p.slug).map((x) => x.image)]),
  ).slice(0, 6);
  const handover = p.scale.find((s) => s.label.includes("Bàn giao"))?.value ?? p.status;

  return {
    gallery,
    overview: p.overview,
    scale: p.scale,
    amenities: p.amenities,
    developer: p.developer,
    handover,
    mapQuery: `${p.location}, Việt Nam`,
  };
}

