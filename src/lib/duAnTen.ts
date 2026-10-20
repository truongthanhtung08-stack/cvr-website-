import { normalizeVi } from "@/lib/filters";

// ============================================================================
// TÊN DỰ ÁN CHO Ô TÌM — chủ dự án 21/10/2026: "từ khoá ngắn ngoài các trường đã cấu trúc là TÊN DỰ ÁN; tên dài hay ngắn
// đều phải hiểu được TÊN LÕI". Nguồn THẬT: bảng Dự án + trường "Dự án" của tin đăng (tin thuộc dự án nào) — không dùng dự án
// mẫu trong data.ts (trước đây gợi ý tên dự án lấy từ mẫu nên tên thật như Sun Symphony, Golden Bay không bao giờ ra).
// ============================================================================
export type DuAnTen = {
  ten: string;          // tên đầy đủ ("Symphony 5 - Sun Symphony Residence Đà Nẵng")
  slug: string;         // mã dự án (trường details.project của tin / slug trang dự án)
  tinh: string;         // tỉnh/thành
  coTrang: boolean;     // có trang thông tin dự án /du-an/<slug>
  ban: number;          // số tin bán còn hạn thuộc dự án
  thue: number;         // số tin cho thuê còn hạn thuộc dự án
};

// Phần CHUNG không phải tên riêng: loại hình đứng đầu tên, tên tỉnh/thành, vài phường hay đi kèm tên dự án
const DAU_CHUNG = /^(the|du an|can ho( cao cap)?( \d+ sao)?|chung cu|khu do thi( moi)?|kdt|khu can ho|khu cong nghiep|toa nha|to hop)\s+/;
const DIA_DANH_DUOI = /\s+(da nang|danang|hue|nha trang|quy nhon|son tra|hoi an|phan thiet|binh dinh|khanh hoa|quang nam|quang tri|quang ngai|gia lai|lam dong|da lat|binh thuan|ha noi|ho chi minh|hcm|sai gon)$/;
const DUOI_CHUNG = /\s+(residences?|complex|tower|towers|city|plaza|apartment|apartments|central|center|centre|heights)$/;

/** Mọi cách gọi một dự án: tên đầy đủ, tên lõi, từng vế quanh dấu "-" — đã bỏ dấu, ≥ 4 ký tự */
export function cachGoiDuAn(ten: string): string[] {
  const ra = new Set<string>();
  const them = (x: string) => { const n = x.trim(); if (n.length >= 4 && !/^\d+$/.test(n)) ra.add(n); };
  const veGoc = [ten, ...ten.split(/\s+[-–—|]\s+/)];
  for (const v of veGoc) {
    let n = normalizeVi(v).replace(/[^a-z0-9]+/g, " ").trim();
    them(n);
    for (let i = 0; i < 3; i++) n = n.replace(DAU_CHUNG, "").replace(DIA_DANH_DUOI, "").trim();
    them(n);
    const ngan = n.replace(DUOI_CHUNG, "").trim();
    // Bỏ đuôi chung (Tower, Residence, Plaza…) chỉ khi phần còn lại vẫn đủ đặc trưng: "Sun Symphony Residence" → "sun symphony";
    // "Cora Tower" giữ nguyên ("cora" quá ngắn, dễ trùng chữ khác)
    if (ngan !== n && (ngan.split(" ").length >= 2 || ngan.length >= 5)) them(ngan);
    // Bỏ TÊN THƯƠNG HIỆU / chữ đầu khi còn ≥ 2 chữ: "Vinhomes Hải Vân Bay" → "hải vân bay" (khách hay gọi tắt như vậy)
    const tu = n.split(" ");
    if (tu.length >= 3) them(tu.slice(1).join(" "));
  }
  return [...ra];
}

/** Khoá gộp hai cách viết của cùng một dự án ("goldenbay" và "golden bay") */
export function khoaDuAn(ten: string): string {
  const goi = cachGoiDuAn(ten);
  const loi = goi.sort((a, b) => a.length - b.length)[0] ?? normalizeVi(ten);
  return loi.replace(/\s+/g, "");
}

export type KhopDuAn = { duAn: DuAnTen; cach: string };

/** Câu khách gõ có nhắc tên dự án không — khớp TRỌN TỪ, cách gọi dài nhất thắng. dangGo: chữ cuối có thể đang gõ dở. */
export function timDuAn(raw: string, ds: DuAnTen[], dangGo = false): KhopDuAn | null {
  const q = ` ${normalizeVi(raw).replace(/[^a-z0-9]+/g, " ").trim()} `;
  if (q.trim().length < 3) return null;
  // Khớp TRỌN TÊN (mọi chữ của cách gọi có trong câu) thắng khớp ĐANG GÕ DỞ (câu là phần đầu của cách gọi)
  let tron: KhopDuAn | null = null;
  let doDang: KhopDuAn | null = null;
  for (const d of ds) {
    for (const c of cachGoiDuAn(d.ten)) {
      if (q.includes(` ${c} `)) { if (!tron || c.length > tron.cach.length) tron = { duAn: d, cach: c }; }
      else if (dangGo && q.trim().length >= 4 && c.startsWith(q.trim()) && (!doDang || c.length < doDang.cach.length)) doDang = { duAn: d, cach: c };
    }
  }
  return tron ?? doDang;
}

// ── NẠP Ở TRÌNH DUYỆT (một lần mỗi lần mở trang, lúc khách bắt đầu tìm) ──────────────────────────────────────────────────
let _ds: DuAnTen[] | null = null;
let _dangNap: Promise<DuAnTen[]> | null = null;
export function dsDuAnDaNap(): DuAnTen[] | null {
  return _ds;
}
export function napDsDuAn(): Promise<DuAnTen[]> {
  _dangNap ??= fetch("/api/du-an/ten").then((r) => (r.ok ? r.json() : [])).then((ds: DuAnTen[]) => (_ds = ds)).catch(() => (_ds = []));
  return _dangNap;
}
