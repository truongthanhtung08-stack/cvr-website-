// Dữ liệu CHUYÊN GIA (môi giới) + SÀN/CÔNG TY BĐS cho mục "Chuyên gia".
//
// ⚠️ CỐ Ý ĐỂ TRỐNG — ĐỪNG ĐIỀN DỮ LIỆU MẪU VÀO ĐÂY.
// Trước đây chỗ này có 6 "chuyên gia" và 4 "sàn/chi nhánh" bịa, kèm SỐ ĐIỆN THOẠI
// GIẢ bấm gọi được (0905 123 456…) và các con số tự nghĩ ra ("18 chuyên gia",
// "thành lập 2019", "214 giao dịch", "4.9 sao"). Web đã chạy thật, có Google
// Business và quảng cáo → khách gọi vào số không có thật là mất uy tín ngay,
// còn con số về quy mô công ty là thông tin sai sự thật.
//
// Chỉ điền khi có NGƯỜI THẬT đồng ý, hoặc nối thẳng vào Supabase. Danh sách rỗng
// thì các trang tự hiện trạng thái "đang cập nhật" — xem ExpertsBrowser + cong-ty/page.

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

export const experts: Expert[] = [];

export const agencies: Agency[] = [];

export function getExpertsByCity(city?: City): Expert[] {
  return city ? experts.filter((e) => e.city === city) : experts;
}
