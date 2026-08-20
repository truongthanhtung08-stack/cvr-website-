import type { Project } from "./data";

// ═══════════════════════════════════════════════════════════════════════════
// CÂU GỢI Ý CHẠY CHỮ trong ô tìm kiếm
// ═══════════════════════════════════════════════════════════════════════════
// NGUYÊN TẮC: KHÔNG gợi ý bừa. Mỗi câu chỉ ghép từ chính TỪ VỰNG mà bộ máy tìm
// kiếm hiểu được (smartSearch.parseQuery), nên gõ y nguyên câu gợi ý là ra đúng
// tiêu chí:
//   • Loại hình  → từ điển LOAI_HINH ("Căn hộ", "Nhà riêng", "Đất nền", "Văn phòng"…)
//   • Khu vực    → từ điển TINH (Đà Nẵng, Huế, Quảng Nam… — đúng vùng đang phủ)
//   • Mức giá    → đúng cú pháp bocGia đọc được ("dưới 3 tỷ", "1 - 2 tỷ", "dưới 10 triệu")
//   • Đặc điểm   → từ điển DAC_DIEM ("view biển", "trung tâm", "sổ hồng", "gần trường")
// Và ĐÚNG MỤC: ô tìm ở mục nào chỉ gợi ý loại hình có thật ở mục đó — cho thuê
// mới có Văn phòng / Mặt bằng kinh doanh / Phòng trọ; mua bán mới có Đất nền,
// Shophouse, Biệt thự (theo danh mục 2 trục trong filters.ts).

export type HintMode = "ban" | "thue" | "duan";

// MUA BÁN — loại hình bán × khu vực × (mức giá | đặc điểm)
const HINT_BAN = [
  "Căn hộ tại Đà Nẵng",
  "Nhà riêng Huế dưới 3 tỷ",
  "Đất nền Quảng Nam 1 - 2 tỷ",
  "Biệt thự view biển Đà Nẵng",
  "Nhà mặt phố trung tâm Huế",
  "Shophouse Quảng Ngãi sổ hồng",
  "Căn hộ view sông Đà Nẵng dưới 5 tỷ",
];

// CHO THUÊ — chỉ loại hình CÓ ở mục cho thuê, mức giá theo triệu/tháng
const HINT_THUE = [
  "Căn hộ cho thuê Đà Nẵng",
  "Văn phòng trung tâm Đà Nẵng",
  "Mặt bằng kinh doanh Huế",
  "Phòng trọ gần trường Đà Nẵng dưới 3 triệu",
  "Nhà nguyên căn Quảng Nam dưới 10 triệu",
  "Căn hộ full nội thất view biển Đà Nẵng",
  "Kho xưởng Quảng Ngãi",
];

// DỰ ÁN — khi chưa có dự án nào trong kho thì gợi ý theo CƠ CẤU (loại hình dự
// án × khu vực × tình trạng), vẫn là từ bộ máy hiểu được.
const HINT_DU_AN = [
  "Dự án căn hộ tại Đà Nẵng",
  "Dự án đất nền Quảng Nam",
  "Dự án nghỉ dưỡng view biển Đà Nẵng",
  "Dự án biệt thự Huế",
  "Dự án căn hộ trung tâm Huế",
];

const HINTS: Record<HintMode, string[]> = {
  ban: HINT_BAN,
  thue: HINT_THUE,
  duan: HINT_DU_AN,
};

// Bộ câu gợi ý của một mục (mua bán / cho thuê / dự án)
export function hintsFor(mode: HintMode): string[] {
  return HINTS[mode];
}

// ── Gợi ý mục DỰ ÁN dựng từ CHÍNH kho dự án đang có ────────────────────────
// Có dự án thật (admin đã đăng) → gợi ý bằng tên dự án · chủ đầu tư · khu vực ·
// tình trạng CÓ THẬT, gõ vào chắc chắn ra kết quả. Kho rỗng → dùng bộ cơ cấu.
// Lấy theo thứ tự cố định (không random) để bản máy chủ và trình duyệt khớp nhau.
export function projectHints(projects: Project[]): string[] {
  if (projects.length === 0) return HINT_DU_AN;

  const lay = <T,>(xs: T[], n: number) => Array.from(new Set(xs)).filter(Boolean).slice(0, n);
  const tinhCua = (location: string) => location.split(",").pop()?.trim() ?? "";

  const ten = lay(projects.map((p) => p.name), 3);
  const chuDauTu = lay(projects.map((p) => p.developer).filter(Boolean) as string[], 2);
  const khuVuc = lay(projects.map((p) => tinhCua(p.location)), 2);
  const tinhTrang = lay(projects.map((p) => p.status).filter(Boolean), 1);

  const hints = [
    ...ten,
    ...chuDauTu.map((d) => `Chủ đầu tư ${d}`),
    ...khuVuc.map((k) => `Dự án tại ${k}`),
    ...tinhTrang.flatMap((t) => (khuVuc[0] ? [`Dự án ${t.toLowerCase()} tại ${khuVuc[0]}`] : [])),
  ];
  return hints.length > 0 ? hints : HINT_DU_AN;
}
