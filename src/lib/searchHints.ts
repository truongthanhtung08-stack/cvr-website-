import type { Listing, Project } from "./data";

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

// ── Tiện ích dùng chung ───────────────────────────────────────────────────
// Tỉnh/thành = phần cuối địa chỉ ("Hoà Hải, Ngũ Hành Sơn, Đà Nẵng" → "Đà Nẵng")
const tinhCua = (location: string) => location.split(",").pop()?.trim() ?? "";
// Loại hình gọn để gõ: "Đất nền / Đất nền dự án" → "Đất nền" (bộ máy vẫn hiểu)
const loaiCua = (type: string) => type.split("/")[0].trim();
const gomTrung = (xs: string[]) => Array.from(new Set(xs.filter(Boolean)));

// ── Gợi ý mục MUA BÁN / CHO THUÊ — chạy theo TIN MỚI và TIN HOT ────────────
// Kho tin sẽ lên hàng trăm, hàng nghìn → câu gợi ý KHÔNG để cố định mà bám dữ
// liệu đang có, đổi theo từng đợt đăng tin:
//   • HOT   = cặp (loại hình × khu vực) có nhiều tin nhất, tin hạng VIP/Nổi bật
//             tính điểm nặng hơn → phản ánh đúng chỗ đang sôi động.
//   • MỚI   = loại hình & khu vực của những tin vừa đăng (kho trả về mới nhất trước).
//   • GIÁ   = ghép thêm tầm giá đang nhiều tin nhất của cặp hot nhất.
// Xen kẽ HOT ↔ MỚI cho phong phú. Kho rỗng → lùi về bộ theo cơ cấu.
export function listingHints(items: Listing[], purpose: "ban" | "thue"): string[] {
  const mac = purpose === "thue" ? HINT_THUE : HINT_BAN;
  const ds = items.filter((l) => (l.purpose ?? "ban") === purpose);
  if (ds.length === 0) return mac;

  // Điểm HOT: mỗi tin cộng điểm cho cặp "loại hình × tỉnh" của nó
  const diemCua = (l: Listing) => (l.badge === "VIP" ? 3 : l.badge === "Nổi bật" ? 2 : 1);
  const diem = new Map<string, number>();
  for (const l of ds) {
    const k = `${loaiCua(l.type)}|${tinhCua(l.location)}`;
    diem.set(k, (diem.get(k) ?? 0) + diemCua(l));
  }
  const hot = [...diem]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => {
      const [loai, tinh] = k.split("|");
      return tinh ? `${loai} tại ${tinh}` : loai;
    });

  // MỚI: 3 tin vừa đăng (kho sắp created_at giảm dần)
  const moi = ds.slice(0, 3).map((l) => {
    const tinh = tinhCua(l.location);
    return tinh ? `${loaiCua(l.type)} ${tinh}` : loaiCua(l.type);
  });

  // Tầm giá đang có nhiều tin nhất trong nhóm hot nhất → thành 1 câu kèm giá
  const cauGia: string[] = [];
  const [loaiHot, tinhHot] = ([...diem].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "").split("|");
  if (loaiHot && tinhHot) {
    const cungNhom = ds.filter((l) => loaiCua(l.type) === loaiHot && tinhCua(l.location) === tinhHot);
    const tam = tamGiaPhoBien(cungNhom, purpose);
    if (tam) cauGia.push(`${loaiHot} ${tinhHot} ${tam}`);
  }

  // Xen kẽ hot ↔ mới để câu chạy không bị lặp một kiểu
  const xen: string[] = [];
  for (let i = 0; i < Math.max(hot.length, moi.length); i++) {
    if (hot[i]) xen.push(hot[i]);
    if (moi[i]) xen.push(moi[i]);
  }
  const ra = gomTrung([...xen, ...cauGia]);
  return ra.length >= 3 ? ra : gomTrung([...ra, ...mac]).slice(0, 6);
}

// Tầm giá nhiều tin nhất, viết đúng cú pháp bộ máy đọc được ("dưới 3 tỷ", "1 - 2 tỷ")
function tamGiaPhoBien(items: Listing[], purpose: "ban" | "thue"): string | null {
  const bac: [string, (n: number) => boolean][] =
    purpose === "thue"
      ? [
          ["dưới 5 triệu", (n) => n < 0.005],
          ["5 - 10 triệu", (n) => n >= 0.005 && n < 0.01],
          ["10 - 20 triệu", (n) => n >= 0.01 && n < 0.02],
          ["trên 20 triệu", (n) => n >= 0.02],
        ]
      : [
          ["dưới 2 tỷ", (n) => n < 2],
          ["2 - 5 tỷ", (n) => n >= 2 && n < 5],
          ["5 - 10 tỷ", (n) => n >= 5 && n < 10],
          ["trên 10 tỷ", (n) => n >= 10],
        ];
  const so = (giá: string) => {
    const m = giá.replace(",", ".").match(/[\d.]+/);
    if (!m) return null;
    const n = parseFloat(m[0]);
    return /tri[eệ]u/i.test(giá) ? n / 1000 : n; // quy về đơn vị tỷ
  };
  const dem = new Map<string, number>();
  for (const l of items) {
    const n = so(l.price);
    if (n == null) continue;
    const hit = bac.find(([, ok]) => ok(n));
    if (hit) dem.set(hit[0], (dem.get(hit[0]) ?? 0) + 1);
  }
  return [...dem].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// ── Gợi ý mục DỰ ÁN dựng từ CHÍNH kho dự án đang có ────────────────────────
// Có dự án thật (admin đã đăng) → gợi ý bằng tên dự án · chủ đầu tư · khu vực ·
// tình trạng CÓ THẬT, gõ vào chắc chắn ra kết quả. Kho rỗng → dùng bộ cơ cấu.
// Lấy theo thứ tự cố định (không random) để bản máy chủ và trình duyệt khớp nhau.
export function projectHints(projects: Project[]): string[] {
  if (projects.length === 0) return HINT_DU_AN;

  const lay = <T,>(xs: T[], n: number) => Array.from(new Set(xs)).filter(Boolean).slice(0, n);

  // MỚI: kho trả về dự án mới nhất trước → 2 cái đầu là 2 dự án vừa lên.
  const moi = lay(projects.map((p) => p.name), 2);
  // HOT: dự án ĐANG MỞ BÁN / SẮP MỞ BÁN — thứ khách hỏi nhiều nhất.
  const dangHot = projects.filter((p) => /mở bán|nhận (giữ chỗ|booking)/i.test(p.status ?? ""));
  const tenHot = lay(dangHot.map((p) => p.name), 2);
  // Khu vực có NHIỀU dự án nhất (chỗ đang sôi động)
  const demKhuVuc = new Map<string, number>();
  for (const p of projects) {
    const t = tinhCua(p.location);
    if (t) demKhuVuc.set(t, (demKhuVuc.get(t) ?? 0) + 1);
  }
  const khuVuc = [...demKhuVuc].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t);
  const chuDauTu = lay(projects.map((p) => p.developer).filter(Boolean) as string[], 2);
  const tinhTrang = lay(dangHot.map((p) => p.status).filter(Boolean), 1);

  // Xen kẽ MỚI ↔ HOT rồi tới khu vực · chủ đầu tư · tình trạng
  const hints = gomTrung([
    moi[0], tenHot[0], moi[1], tenHot[1],
    ...khuVuc.map((k) => `Dự án tại ${k}`),
    ...chuDauTu.map((d) => `Chủ đầu tư ${d}`),
    ...tinhTrang.flatMap((t) => (khuVuc[0] ? [`Dự án ${t.toLowerCase()} tại ${khuVuc[0]}`] : [])),
  ].filter(Boolean) as string[]);

  return hints.length > 0 ? hints : HINT_DU_AN;
}
