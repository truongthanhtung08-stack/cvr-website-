// Dữ liệu CHUYÊN GIA (môi giới) + SÀN/CÔNG TY BĐS cho mục "Chuyên gia".
// Dữ liệu mẫu — thay bằng dữ liệu thật/Supabase sau. Avatar dùng chữ cái đầu (không cần ảnh).

export type City = "Đà Nẵng" | "Huế";

export type Expert = {
  slug: string;
  name: string;
  role: string;        // chức danh
  city: City;
  company: string;     // sàn/công ty đang cộng tác
  phone: string;
  zalo: string;        // số Zalo (chỉ số)
  years: number;       // số năm kinh nghiệm
  deals: number;       // số giao dịch đã chốt
  rating: number;      // điểm đánh giá (0–5)
  reviews: number;     // số lượt đánh giá
  areas: string[];     // khu vực phụ trách
  specialties: string[]; // phân khúc chuyên
  verified?: boolean;  // đã xác minh bởi Coastal Land
};

export type Agency = {
  slug: string;
  name: string;
  city: City;
  agents: number;      // số chuyên gia
  address: string;
  established: number;  // năm thành lập
};

export const experts: Expert[] = [
  {
    slug: "tran-minh-quan",
    name: "Trần Minh Quân", role: "Trưởng phòng Kinh doanh", city: "Đà Nẵng",
    company: "Coastal Land Đà Nẵng", phone: "0905 123 456", zalo: "0905123456",
    years: 9, deals: 214, rating: 4.9, reviews: 132,
    areas: ["Ngũ Hành Sơn", "Sơn Trà", "Hải Châu"],
    specialties: ["Căn hộ", "Villa / Biệt thự biển"], verified: true,
  },
  {
    slug: "le-thi-hoai-an",
    name: "Lê Thị Hoài An", role: "Chuyên viên tư vấn cao cấp", city: "Đà Nẵng",
    company: "Coastal Land Đà Nẵng", phone: "0905 222 333", zalo: "0905222333",
    years: 6, deals: 138, rating: 4.8, reviews: 96,
    areas: ["Cẩm Lệ", "Liên Chiểu"],
    specialties: ["Đất nền", "Nhà phố"], verified: true,
  },
  {
    slug: "nguyen-hoang-phuc",
    name: "Nguyễn Hoàng Phúc", role: "Chuyên viên đầu tư", city: "Đà Nẵng",
    company: "Sàn Bình Minh Land", phone: "0905 444 555", zalo: "0905444555",
    years: 11, deals: 305, rating: 4.9, reviews: 178,
    areas: ["Sơn Trà", "Ngũ Hành Sơn"],
    specialties: ["Condotel", "Nghỉ dưỡng"], verified: true,
  },
  {
    slug: "pham-quoc-bao",
    name: "Phạm Quốc Bảo", role: "Chuyên viên tư vấn", city: "Đà Nẵng",
    company: "Coastal Land Đà Nẵng", phone: "0905 666 777", zalo: "0905666777",
    years: 4, deals: 72, rating: 4.7, reviews: 51,
    areas: ["Thanh Khê", "Hải Châu"],
    specialties: ["Nhà phố", "Kho, nhà xưởng"],
  },
  {
    slug: "hoang-thi-thu-huong",
    name: "Hoàng Thị Thu Hương", role: "Trưởng nhóm tư vấn", city: "Huế",
    company: "Coastal Land Huế", phone: "0234 356 789", zalo: "0905356789",
    years: 8, deals: 165, rating: 4.8, reviews: 88,
    areas: ["TP Huế", "Hương Thủy"],
    specialties: ["Nhà phố", "Đất nền"], verified: true,
  },
  {
    slug: "dang-van-truong",
    name: "Đặng Văn Trường", role: "Chuyên viên tư vấn", city: "Huế",
    company: "Sàn Cố Đô Land", phone: "0234 378 901", zalo: "0905378901",
    years: 5, deals: 94, rating: 4.7, reviews: 63,
    areas: ["TP Huế", "Phú Vang"],
    specialties: ["Đất nền", "Biệt thự, liền kề"],
  },
];

export const agencies: Agency[] = [
  { slug: "coastal-land-da-nang", name: "Coastal Land — Chi nhánh Đà Nẵng", city: "Đà Nẵng", agents: 18, address: "Quận Hải Châu, Đà Nẵng", established: 2019 },
  { slug: "coastal-land-hue", name: "Coastal Land — Chi nhánh Huế", city: "Huế", agents: 9, address: "TP Huế, Thừa Thiên Huế", established: 2021 },
  { slug: "binh-minh-land", name: "Sàn Bình Minh Land", city: "Đà Nẵng", agents: 24, address: "Quận Ngũ Hành Sơn, Đà Nẵng", established: 2016 },
  { slug: "co-do-land", name: "Sàn Cố Đô Land", city: "Huế", agents: 12, address: "TP Huế, Thừa Thiên Huế", established: 2018 },
];

export function getExpertsByCity(city?: City): Expert[] {
  return city ? experts.filter((e) => e.city === city) : experts;
}
