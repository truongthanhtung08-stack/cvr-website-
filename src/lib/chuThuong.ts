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
// cấp, xuống dòng thì không cắt cụm từ"). Dấu cách giữa số + đơn vị đổi thành dấu cách không ngắt (U+00A0) → trình duyệt
// đưa cả cụm xuống dòng cùng nhau. Chỉ đổi cách HIỂN THỊ, không đổi chữ.
// ============================================================================
export function giuCum(s: string): string {
  if (!s) return s;
  // Chỉ dính SỐ với ĐƠN VỊ (3,5 tỷ · 127 m² · 3 PN) — cái cần giữ. Tên đường, địa danh, dự án ngắt như chữ thường để dòng trên
  // chạy kín, không hở khoảng trống (chủ dự án 23/10/2026: "chỉ giữ cái gì cần, không sai như tiền, diện tích")
  return s
    // Đơn giá có gạch chéo: 13tr/m² · 13 tr / m2 · 8 triệu/tháng — không cắt trước, sau dấu "/" (chủ dự án 23/10/2026)
    // Giữ đúng cách khách viết (có hay không dấu cách) — chỉ đổi dấu cách thành dấu cách không ngắt và chặn ngắt quanh "/"
    .replace(/\d[\d.,]*\s*(?:tỷ|triệu|tr|nghìn|k|đ)\s*\/\s*(?:m²|m2|tháng|th|năm)(?!\p{L})/giu, (m) => m.replace(/\s+/g, " ").replace("/", "⁠/⁠"))
    .replace(/(\d[\d.,]*)\s+(m²|m2|PN|WC|tầng|tỷ|triệu|tr|ha)(?!\p{L})/giu, "$1 $2");
}

// Tên địa danh của tin (cả hệ cũ) — để giữ chữ hoa khi đổi chữ thường
export function tenDiaDanh(l: Listing): string[] {
  return [l.location, l.locationCu ?? ""]
    .flatMap((x) => x.split(","))
    .map((x) => x.trim().replace(/^(Phường|Xã|Quận|Huyện|Thị xã|Thành phố|Tỉnh)\s+/i, ""))
    .filter(Boolean);
}

// ============================================================================
// TIÊU ĐỀ TRÊN THẺ TIN — MỘT CHUẨN CHO MỌI THẺ (chủ dự án 23/10/2026: "mình code chuẩn theo quy định dù khách viết thế nào").
// Cách viết hoa do QUY ĐỊNH CẤP quyết định, không do khách gõ: cấp in hoa (Diamond · Gold) → CSS in hoa; cấp còn lại → khách gõ
// TOÀN CHỮ HOA thì đưa về chữ thường (chuThuong), viết hoa chữ đầu. Ký tự đặc biệt giữ như khách viết. Mọi cấp: khoảng
// trắng thừa; viết tắt (2PN, WC) và tên riêng (địa danh, tên đường, dự án) luôn đúng chữ; số + đơn vị không ngắt dòng (giuCum).
// Dùng ở TheTinMobile và PropertyCard — thêm thẻ mới thì gọi hàm này, không tự xử lý tiêu đề. Chỉ đổi cách HIỆN trên thẻ,
// không sửa tiêu đề gốc của khách (trang tin chi tiết giữ như đã đặt).
// ============================================================================
export function tieuDeThe(l: Listing, inHoa: boolean): string {
  // Tên phải giữ đúng chữ hoa: địa danh của tin + tên đường khách ghi (bỏ số nhà, chữ "Đường") + tên dự án
  const duong = (l.diaChiSo ?? "").split(",")[0].replace(/^[^\p{L}]*/u, "").replace(/^(Đường|Phố)\s+/iu, "").trim();
  const ten = [...tenDiaDanh(l), duong, l.projectName ?? ""].filter((x) => x.length > 1);
  // ① Ký tự đặc biệt, biểu tượng, dấu câu: GIỮ NGUYÊN như khách viết (chủ dự án 23/10/2026) — chỉ gộp khoảng trắng thừa
  let t = l.title.replace(/\s+/g, " ").trim();
  // ② Cấp không in hoa: khách gõ TOÀN CHỮ HOA → chữ thường; chữ đầu tiêu đề luôn viết hoa
  if (!inHoa) t = chuThuong(t, ten).replace(/\p{L}/u, (c) => c.toLocaleUpperCase("vi"));
  // ③ Viết tắt và tên riêng luôn đúng chữ dù khách gõ thường: 2pn → 2PN, đà nẵng → Đà Nẵng
  t = t.replace(/(\d)\s?(pn|wc)(?!\p{L})/giu, (_, so: string, v: string) => `${so}${v.toUpperCase()}`);
  for (const x of ten) {
    t = t.replace(new RegExp(`(?<!\\p{L})${x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\p{L})`, "giu"), x);
  }
  return giuCum(t || l.title);
}
