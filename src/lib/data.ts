// Dữ liệu mẫu (tạm thời) — sau này thay bằng dữ liệu thật từ Supabase
// Ảnh đặt theo từng phân khúc: villa, căn hộ, nhà phố, đất nền, condotel, đất CN, kho xưởng

const seg = (name: string) => `/images/segments/${name}.jpg`;

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
};

export const featuredListings: Listing[] = [
  // ===== Đà Nẵng =====
  { id: "1", title: "Villa biển 3 tầng view trực diện Mỹ Khê", price: "28,5 tỷ", area: "320 m²", beds: 5, baths: 6, location: "Sơn Trà, Đà Nẵng", type: "Villa / Biệt thự biển", image: seg("villa1"), badge: "VIP" },
  { id: "2", title: "Căn hộ cao cấp 2PN view sông Hàn", price: "4,2 tỷ", area: "78 m²", beds: 2, baths: 2, location: "Hải Châu, Đà Nẵng", type: "Căn hộ / Chung cư", image: seg("canho1"), badge: "Nổi bật" },
  { id: "3", title: "Nhà phố 4 tầng mặt tiền kinh doanh", price: "9,8 tỷ", area: "120 m²", beds: 4, baths: 4, location: "Thanh Khê, Đà Nẵng", type: "Nhà phố", image: seg("nhapho1") },
  { id: "4", title: "Đất nền dự án ven biển, sổ đỏ trao tay", price: "3,6 tỷ", pricePerM2: "36 tr/m²", area: "100 m²", location: "Ngũ Hành Sơn, Đà Nẵng", type: "Đất nền", image: seg("datnen1"), badge: "Mới" },
  { id: "5", title: "Condotel full nội thất, cam kết lợi nhuận", price: "2,9 tỷ", area: "45 m²", beds: 1, baths: 1, location: "Sơn Trà, Đà Nẵng", type: "Condotel", image: seg("condotel1") },
  { id: "6", title: "Nhà xưởng KCN Hòa Khánh, sản xuất ngay", price: "Thỏa thuận", area: "1.500 m²", location: "Liên Chiểu, Đà Nẵng", type: "Nhà xưởng / Kho bãi", image: seg("kho1") },
  { id: "7", title: "Penthouse 3PN view toàn cảnh thành phố", price: "12,5 tỷ", area: "180 m²", beds: 3, baths: 3, location: "Hải Châu, Đà Nẵng", type: "Căn hộ / Chung cư", image: seg("canho2"), badge: "Nổi bật" },
  { id: "8", title: "Đất công nghiệp KCN Liên Chiểu cho thuê dài hạn", price: "Thỏa thuận", area: "5.000 m²", location: "Liên Chiểu, Đà Nẵng", type: "Đất công nghiệp", image: seg("datcn2") },
  { id: "9", title: "Biệt thự sinh thái ven sông Hòa Xuân", price: "11,2 tỷ", area: "210 m²", beds: 4, baths: 4, location: "Cẩm Lệ, Đà Nẵng", type: "Villa / Biệt thự biển", image: seg("villa2"), badge: "VIP" },
  { id: "10", title: "Shophouse khối đế dự án Ngũ Hành Sơn", price: "8,9 tỷ", area: "95 m²", beds: 3, baths: 3, location: "Ngũ Hành Sơn, Đà Nẵng", type: "Nhà phố", image: seg("nhapho2") },
  { id: "11", title: "Kho bãi logistics 2.000m² gần cảng", price: "Thỏa thuận", area: "2.000 m²", location: "Cẩm Lệ, Đà Nẵng", type: "Nhà xưởng / Kho bãi", image: seg("kho2") },
  { id: "12", title: "Căn hộ The Filmore hạng sang, bàn giao 2026", price: "6,8 tỷ", area: "92 m²", beds: 2, baths: 2, location: "Hải Châu, Đà Nẵng", type: "Căn hộ / Chung cư", image: seg("canho1"), badge: "VIP" },

  // ===== Thừa Thiên Huế =====
  { id: "13", title: "Biệt thự nghỉ dưỡng sân vườn ven sông Hương", price: "15,3 tỷ", area: "260 m²", beds: 4, baths: 5, location: "TP. Huế, Thừa Thiên Huế", type: "Villa / Biệt thự biển", image: seg("villa1"), badge: "VIP" },
  { id: "14", title: "Nhà vườn cổ kính khu An Cựu", price: "5,6 tỷ", area: "180 m²", beds: 3, baths: 2, location: "An Cựu, Thừa Thiên Huế", type: "Nhà phố", image: seg("nhapho1") },
  { id: "15", title: "Đất nền khu đô thị mới Hương Thủy", price: "2,1 tỷ", pricePerM2: "21 tr/m²", area: "100 m²", location: "Hương Thủy, Thừa Thiên Huế", type: "Đất nền", image: seg("datnen2"), badge: "Mới" },

  // ===== Quảng Nam =====
  { id: "16", title: "Đất nền ven sông Hội An, pháp lý đầy đủ", price: "5,4 tỷ", pricePerM2: "54 tr/m²", area: "100 m²", location: "Hội An, Quảng Nam", type: "Đất nền", image: seg("datnen1"), badge: "Mới" },
  { id: "17", title: "Nhà phố 3 tầng trung tâm Tam Kỳ", price: "4,1 tỷ", area: "95 m²", beds: 3, baths: 3, location: "Tam Kỳ, Quảng Nam", type: "Nhà phố", image: seg("nhapho2") },
  { id: "18", title: "Biệt thự nghỉ dưỡng ven biển Điện Bàn", price: "9,7 tỷ", area: "200 m²", beds: 4, baths: 4, location: "Điện Bàn, Quảng Nam", type: "Villa / Biệt thự biển", image: seg("villa2"), badge: "Nổi bật" },

  // ===== Quảng Ngãi =====
  { id: "19", title: "Đất nền khu đô thị mới Quảng Ngãi", price: "1,9 tỷ", pricePerM2: "19 tr/m²", area: "100 m²", location: "TP. Quảng Ngãi, Quảng Ngãi", type: "Đất nền", image: seg("datnen2") },
  { id: "20", title: "Nhà phố mặt tiền trung tâm Quảng Ngãi", price: "3,3 tỷ", area: "88 m²", beds: 3, baths: 2, location: "TP. Quảng Ngãi, Quảng Ngãi", type: "Nhà phố", image: seg("nhapho1") },

  // ===== Bình Định =====
  { id: "21", title: "Căn hộ biển Quy Nhơn, full nội thất", price: "2,7 tỷ", area: "62 m²", beds: 2, baths: 2, location: "TP. Quy Nhơn, Bình Định", type: "Căn hộ / Chung cư", image: seg("canho2"), badge: "Nổi bật" },
  { id: "22", title: "Đất nền khu đô thị An Nhơn, giá đầu tư", price: "1,5 tỷ", pricePerM2: "15 tr/m²", area: "100 m²", location: "An Nhơn, Bình Định", type: "Đất nền", image: seg("datnen1"), badge: "Mới" },
  { id: "23", title: "Condotel biển Quy Nhơn cam kết lợi nhuận", price: "2,4 tỷ", area: "48 m²", beds: 1, baths: 1, location: "TP. Quy Nhơn, Bình Định", type: "Condotel", image: seg("condotel2") },
  { id: "24", title: "Villa biển trực diện vịnh Quy Nhơn", price: "18,9 tỷ", area: "280 m²", beds: 5, baths: 5, location: "TP. Quy Nhơn, Bình Định", type: "Villa / Biệt thự biển", image: seg("villa1"), badge: "VIP" },
];

export type Area = {
  name: string;
  count: string;
  image: string;
  href: string;
};

export const areas: Area[] = [
  { name: "Đà Nẵng", count: "1.240 tin", image: seg("condotel1"), href: "/mua-ban?tinh=Đà Nẵng" },
  { name: "Thừa Thiên Huế", count: "586 tin", image: seg("villa2"), href: "/mua-ban?tinh=Thừa Thiên Huế" },
  { name: "Quảng Nam", count: "412 tin", image: seg("datnen1"), href: "/mua-ban?tinh=Quảng Nam" },
  { name: "Bình Định", count: "298 tin", image: seg("condotel2"), href: "/mua-ban?tinh=Bình Định" },
];

export type Article = {
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
};

export const articles: Article[] = [
  { title: "Toàn cảnh thị trường BĐS Đà Nẵng nửa cuối 2026", excerpt: "Phân tích xu hướng giá, nguồn cung và phân khúc tiềm năng tại Đà Nẵng – Huế trong giai đoạn cuối năm.", date: "12/06/2026", category: "Phân tích thị trường", image: seg("canho1") },
  { title: "Kinh nghiệm kiểm tra pháp lý đất nền trước khi mua", excerpt: "5 bước thẩm định sổ đỏ, quy hoạch và tranh chấp giúp người mua tránh rủi ro khi xuống tiền.", date: "08/06/2026", category: "Cẩm nang", image: seg("datnen1") },
  { title: "Bất động sản nghỉ dưỡng ven biển Miền Trung lên ngôi", excerpt: "Vì sao villa biển và condotel tại Đà Nẵng đang thu hút mạnh dòng tiền của nhà đầu tư phía Bắc?", date: "03/06/2026", category: "Đầu tư", image: seg("condotel1") },
];

export type Project = {
  name: string;
  location: string;
  priceFrom: string;
  type: string;
  status: string;
  image: string;
};

export const projects: Project[] = [
  { name: "Sun Cosmo Residence", location: "Ngũ Hành Sơn, Đà Nẵng", priceFrom: "Từ 3,2 tỷ", type: "Căn hộ cao cấp", status: "Đang mở bán", image: seg("canho1") },
  { name: "The Filmore Đà Nẵng", location: "Hải Châu, Đà Nẵng", priceFrom: "Từ 5,8 tỷ", type: "Căn hộ hạng sang", status: "Sắp bàn giao", image: seg("canho2") },
  { name: "Khu đô thị FPT City", location: "Ngũ Hành Sơn, Đà Nẵng", priceFrom: "Từ 4,5 tỷ", type: "Nhà phố · Biệt thự", status: "Đang mở bán", image: seg("nhapho2") },
  { name: "Aria Đà Nẵng Hotel & Resort", location: "Sơn Trà, Đà Nẵng", priceFrom: "Từ 2,9 tỷ", type: "Condotel nghỉ dưỡng", status: "Đang mở bán", image: seg("condotel1") },
  { name: "Khu đô thị sinh thái Hòa Xuân", location: "Cẩm Lệ, Đà Nẵng", priceFrom: "Từ 4,0 tỷ", type: "Nhà phố · Biệt thự", status: "Đang mở bán", image: seg("villa2") },
  { name: "Casamia Hội An", location: "Hội An, Quảng Nam", priceFrom: "Từ 6,5 tỷ", type: "Biệt thự sinh thái", status: "Sắp mở bán", image: seg("villa1") },
  { name: "FLC Quy Nhơn Beach & Golf", location: "TP. Quy Nhơn, Bình Định", priceFrom: "Từ 2,5 tỷ", type: "Condotel · Biệt thự biển", status: "Đang mở bán", image: seg("condotel2") },
  { name: "Khu đô thị An Cựu City", location: "TP. Huế, Thừa Thiên Huế", priceFrom: "Từ 3,1 tỷ", type: "Nhà phố · Shophouse", status: "Đang mở bán", image: seg("nhapho1") },
];
