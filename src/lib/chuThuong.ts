import type { Listing } from "@/lib/data";

// ============================================================================
// CHỮ HOA → CHỮ THƯỜNG (chủ dự án 09/10/2026): khách gõ TOÀN CHỮ HOA thì web tự đưa về chữ
// thường, viết hoa đầu đoạn. Xét TỪNG CÂU / TỪNG DÒNG (khách hay viết hoa một đoạn rồi viết
// thường đoạn sau):
//   · đoạn ≥ 6 chữ cái mà ≥ 60% là chữ hoa → chuyển về chữ thường, hoa chữ đầu đoạn
//   · đoạn viết thường bình thường, hay chỉ nhấn 1–2 từ in hoa → GIỮ NGUYÊN
// Giữ hoa: tên địa danh của chính tin + chữ viết tắt nghề BĐS.
// Tiêu đề Diamond · Gold vẫn IN HOA theo quy định hạng (CSS) — hàm này dùng cho phần còn lại.
// ============================================================================

const VIET_TAT = ["PN", "WC", "MT", "HXH", "KDC", "KĐT", "KCN", "TP", "CK", "VIP", "BĐS", "SĐT", "SHR", "HĐMB", "QSDĐ", "CHCC", "VND", "LH", "ĐN"];

export function chuThuong(s: string, giuTen: string[] = []): string {
  const laHoa = (doan: string) => {
    const chu = [...doan].filter((c) => c.toLowerCase() !== c.toUpperCase());
    return chu.length >= 6 && chu.filter((c) => c === c.toUpperCase()).length / chu.length >= 0.6;
  };
  const doi = (doan: string) => doan.toLocaleLowerCase("vi").replace(/\p{L}/u, (c) => c.toLocaleUpperCase("vi"));
  // Tách giữ nguyên dấu ngắt (. ! ? xuống dòng - : •) để ghép lại đúng như khách viết
  const phan = s.split(/([.!?]+\s+|\n+|\s[-–:•]\s)/);
  let t = phan.map((p, i) => (i % 2 === 0 && laHoa(p) ? doi(p) : p)).join("");
  if (t === s) return s;
  for (const v of VIET_TAT) {
    t = t.replace(new RegExp(`(?<!\\p{L})${v.toLocaleLowerCase("vi")}(?!\\p{L})`, "gu"), v);
  }
  for (const ten of giuTen.filter((x) => x.length > 1)) {
    t = t.split(ten.toLocaleLowerCase("vi")).join(ten);
  }
  return t;
}

// ============================================================================
// GIỮ CỤM TỪ KHÔNG BỊ NGẮT DÒNG (chủ dự án 23/10/2026: "1 dòng không đủ thì xuống dòng khác theo chuẩn quy định tiêu đề theo
// cấp, xuống dòng thì không cắt cụm từ, ví dụ Nha Trang"). Dấu cách trong tên địa danh / dự án / số + đơn vị đổi thành dấu
// cách không ngắt (U+00A0) → trình duyệt đưa cả cụm xuống dòng cùng nhau. Chỉ đổi cách HIỂN THỊ, không đổi chữ.
// Tên lấy theo chính tin (địa chỉ, dự án) + các địa danh hay gặp — không nạp bảng địa danh lớn (giữ trang nhẹ).
// ============================================================================
const DIA_DANH_CHUNG = [
  "Đà Nẵng", "Nha Trang", "Quy Nhơn", "Hồ Chí Minh", "Hà Nội", "Phan Thiết", "Hội An", "Sơn Trà", "Ngũ Hành Sơn", "Hải Châu",
  "Thanh Khê", "Liên Chiểu", "Cẩm Lệ", "Hòa Vang", "Thừa Thiên Huế", "Khánh Hòa", "Bình Định", "Quảng Nam", "Quảng Ngãi",
  "Quảng Trị", "Quảng Bình", "Lâm Đồng", "Đà Lạt", "Vũng Tàu", "Cam Ranh", "Phú Quốc", "Hải Vân", "Mỹ Khê", "Non Nước",
];
export function giuCum(s: string, ten: string[] = []): string {
  if (!s) return s;
  const NB = " ";
  let t = s.replace(/(\d[\d.,]*)\s+(m²|m2|PN|WC|tầng|tỷ|triệu|tr|ha)(?!\p{L})/giu, `$1${NB}$2`);
  const ds = [...new Set([...ten, ...DIA_DANH_CHUNG].map((x) => x.trim()).filter((x) => x.includes(" ")))].sort((a, b) => b.length - a.length);
  for (const x of ds) {
    const re = new RegExp(`(?<!\\p{L})${x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")}(?!\\p{L})`, "giu");
    t = t.replace(re, (m) => m.replace(/\s+/g, NB));
  }
  return t;
}

// Tên địa danh của tin (cả hệ cũ) — để giữ chữ hoa khi đổi chữ thường
export function tenDiaDanh(l: Listing): string[] {
  return [l.location, l.locationCu ?? ""]
    .flatMap((x) => x.split(","))
    .map((x) => x.trim().replace(/^(Phường|Xã|Quận|Huyện|Thị xã|Thành phố|Tỉnh)\s+/i, ""))
    .filter(Boolean);
}
