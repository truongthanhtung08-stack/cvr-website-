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

// Tên địa danh của tin (cả hệ cũ) — để giữ chữ hoa khi đổi chữ thường
export function tenDiaDanh(l: Listing): string[] {
  return [l.location, l.locationCu ?? ""]
    .flatMap((x) => x.split(","))
    .map((x) => x.trim().replace(/^(Phường|Xã|Quận|Huyện|Thị xã|Thành phố|Tỉnh)\s+/i, ""))
    .filter(Boolean);
}
