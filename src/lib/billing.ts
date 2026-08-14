// ============================================================================
// GÓI ĐĂNG TIN · CHÍNH SÁCH GIÁ · KHUYẾN MÃI · VÍ THÀNH VIÊN
// ----------------------------------------------------------------------------
// GIÁ CHUẨN nằm trong `BILLING_DEFAULT` (khớp bảng giá đang hiển thị trên web).
// Chủ dự án sửa giá / bật khuyến mãi / bật miễn phí ở /admin/goi-dich-vu và
// /admin/khuyen-mai — lưu vào site_content (key "billing") → web đọc no-store
// nên đổi là hiện NGAY, không cần sửa code.
// ============================================================================

import { getTier, type TierId } from "@/lib/packages";

// ── Gói đăng tin ────────────────────────────────────────────────────────────
// Mỗi cấp tin (Diamond/Gold/Silver/Basic) có các mốc thời hạn kèm giá chuẩn.
export type PlanTerm = {
  days: number;      // số ngày hiển thị
  price: number;     // giá chuẩn (VNĐ) cho trọn kỳ
};

export type Plan = {
  tierId: TierId;
  name: string;      // "CVR Diamond"
  terms: PlanTerm[];
  note?: string;
  maxImages?: number; // SỐ ẢNH TỐI ĐA mỗi tin của cấp này (giữ dung lượng kho ảnh)
};

// Số ảnh tối đa của một cấp tin. Chưa đặt trong admin → dùng mức mặc định bên dưới.
const ANH_MAC_DINH: Record<TierId, number> = { diamond: 15, gold: 12, silver: 10, basic: 7 };

export function soAnhToiDa(data: BillingData, tierId: TierId): number {
  return data.plans.find((p) => p.tierId === tierId)?.maxImages ?? ANH_MAC_DINH[tierId];
}

// ── GÓI DỰ ÁN (CVR-PJ) ──────────────────────────────────────────────────────
// Dự án có thư viện ảnh, mặt bằng, tiện ích… nên số ảnh nhiều hơn tin thường.
const ANH_DU_AN_MAC_DINH: Record<TierId, number> = { diamond: 30, gold: 25, silver: 20, basic: 15 };

export function goiDuAn(data: BillingData): Plan[] {
  return data.projectPlans?.length ? data.projectPlans : PROJECT_PLANS_DEFAULT;
}

export function soAnhDuAnToiDa(data: BillingData, tierId: TierId): number {
  return goiDuAn(data).find((p) => p.tierId === tierId)?.maxImages ?? ANH_DU_AN_MAC_DINH[tierId];
}

// Báo giá cho DỰ ÁN — dùng chung công thức với tin đăng (khuyến mãi + cấp hội viên)
export function quotePriceDuAn(args: {
  data: BillingData;
  tierId: TierId;
  days: number;
  today: string;
  isNewMember?: boolean;
  levelId?: string;
}): PriceQuote {
  return quotePrice({ ...args, data: { ...args.data, plans: goiDuAn(args.data) } });
}

// ── Khuyến mãi ──────────────────────────────────────────────────────────────
// Chủ dự án tự đặt: giảm bao nhiêu %, áp cho ai, trong thời gian nào.
export type PromoAudience = "all" | "new" | "agent" | "company";

export type Promo = {
  id: string;
  name: string;             // "Khai trương giảm 15%"
  percent: number;          // 10 = giảm 10%
  audience: PromoAudience;  // đối tượng áp dụng
  tiers: TierId[];          // rỗng = áp cho mọi cấp tin
  from: string;             // "2026-08-01" (rỗng = không giới hạn)
  to: string;               // "2026-09-30"
  active: boolean;
};

// ── Miễn phí cho thành viên mới ─────────────────────────────────────────────
export type FreePolicy = {
  active: boolean;
  days: number;        // miễn phí trong bao nhiêu ngày kể từ khi đăng ký
  quota: number;       // số tin miễn phí được đăng
  tierId: TierId;      // đăng ở cấp tin nào
  audience: PromoAudience;
  note: string;        // dòng hiển thị cho khách
};

// ── Điểm thưởng ─────────────────────────────────────────────────────────────
export type PointPolicy = {
  active: boolean;
  earnPerVnd: number;   // nạp bao nhiêu VNĐ được 1 điểm (vd 10000 → 1 điểm)
  redeemRate: number;   // 1 điểm đổi được bao nhiêu VNĐ (vd 100)
  minRedeem: number;    // số điểm tối thiểu mỗi lần đổi
};

// ── Cấp thành viên ──────────────────────────────────────────────────────────
// ĐÚNG 4 CẤP: Basic · Silver · Gold · Diamond.
// LÊN CẤP THEO TỔNG TIỀN ĐÃ NẠP (không phải tiền đã tiêu) — khách nạp vào ví
// bao nhiêu thì xét cấp bấy nhiêu, tiền còn trong ví vẫn được tính.
export type MemberLevel = {
  id: string;
  name: string;         // Basic · Silver · Gold · Diamond (trùng tên 4 hạng tin)
  minTopup: number;     // tổng tiền NẠP tối thiểu để đạt cấp này (VNĐ)
  discount: number;     // % giảm thêm cho cấp này
  color: string;
};

// Dữ liệu admin lưu trước đây dùng tên cũ `minSpend` (xét theo chi tiêu).
// Đọc lên thì quy về `minTopup` để không mất cài đặt cũ.
type LegacyMemberLevel = MemberLevel & { minSpend?: number };

export function chuanHoaCapHoiVien(levels: LegacyMemberLevel[] | undefined): MemberLevel[] {
  if (!levels?.length) return BILLING_DEFAULT.levels;
  return levels.map((l) => ({ ...l, minTopup: l.minTopup ?? l.minSpend ?? 0 }));
}

export type BillingData = {
  plans: Plan[];
  projectPlans?: Plan[];    // GÓI DỰ ÁN (CVR-PJ) — cùng cấu trúc với gói tin đăng
  promos: Promo[];
  free: FreePolicy;
  points: PointPolicy;
  levels: MemberLevel[];
  topupAmounts: number[];   // mệnh giá nạp nhanh
};

// ── GIÁ GÓI DỰ ÁN CHUẨN (khớp mục "Gói Dự án" trong trang Báo giá) ──────────
// Giai đoạn đầu: CVR-PJ Basic để 0đ (miễn phí) cho dự án chạy trước.
// Chủ dự án sửa được toàn bộ ở /admin/gia-khuyen-mai → tab "Gói dự án".
export const PROJECT_PLANS_DEFAULT: Plan[] = [
  {
    tierId: "diamond",
    name: "CVR-PJ Diamond",
    terms: [
      { days: 7, price: 6_800_000 },
      { days: 14, price: 12_800_000 },
    ],
    note: "Trang chủ + đứng trên CVR-PJ Gold — icon đỏ nổi bật",
    maxImages: 30,
  },
  {
    tierId: "gold",
    name: "CVR-PJ Gold",
    terms: [
      { days: 7, price: 3_500_000 },
      { days: 14, price: 6_600_000 },
    ],
    note: "Đứng trên CVR-PJ Silver — icon vàng nổi bật",
    maxImages: 25,
  },
  {
    tierId: "silver",
    name: "CVR-PJ Silver",
    terms: [
      { days: 7, price: 2_000_000 },
      { days: 14, price: 3_800_000 },
    ],
    note: "Đứng trên CVR-PJ Basic — icon xanh nổi bật",
    maxImages: 20,
  },
  {
    tierId: "basic",
    name: "CVR-PJ Basic",
    terms: [
      { days: 7, price: 0 },
      { days: 14, price: 0 },
    ],
    note: "Giai đoạn đầu: miễn phí — đặt giá trong admin khi bắt đầu thu",
    maxImages: 15,
  },
];

// ── GIÁ CHUẨN HIỆN TẠI (khớp bảng giá đang đăng trên web) ───────────────────
export const BILLING_DEFAULT: BillingData = {
  plans: [
    {
      tierId: "diamond",
      name: "CVR Diamond",
      terms: [
        { days: 7, price: 1_050_000 },
        { days: 15, price: 2_100_000 },
        { days: 30, price: 3_900_000 },
      ],
      note: "Ưu tiên hiển thị cao nhất — x20 lượt xem",
      maxImages: 15,
    },
    {
      tierId: "gold",
      name: "CVR Gold",
      terms: [
        { days: 7, price: 630_000 },
        { days: 15, price: 1_260_000 },
        { days: 30, price: 2_340_000 },
      ],
      note: "Hiển thị nổi bật — x10 lượt xem",
      maxImages: 12,
    },
    {
      tierId: "silver",
      name: "CVR Silver",
      terms: [
        { days: 7, price: 280_000 },
        { days: 15, price: 560_000 },
        { days: 30, price: 1_040_000 },
      ],
      note: "Tiết kiệm hiệu quả — x5 lượt xem",
      maxImages: 10,
    },
    {
      tierId: "basic",
      name: "CVR Basic",
      terms: [
        { days: 7, price: 70_000 },
        { days: 15, price: 140_000 },
        { days: 30, price: 260_000 },
      ],
      note: "Tin thường, chi phí thấp nhất",
      maxImages: 7,
    },
  ],
  promos: [],
  free: {
    active: true,
    days: 30,
    quota: 3,
    tierId: "basic",
    audience: "new",
    note: "Thành viên mới được đăng 3 tin miễn phí trong 30 ngày đầu.",
  },
  points: { active: true, earnPerVnd: 10_000, redeemRate: 100, minRedeem: 100 },
  // CẤP HỘI VIÊN — ĐÚNG 4 CẤP, TRÙNG TÊN với 4 hạng tin (Basic · Silver · Gold ·
  // Diamond) để khách không phải nhớ hai hệ tên. Basic là cấp khởi điểm (nạp 0đ),
  // NẠP đủ mốc là tự lên cấp trên. Màu lấy đúng màu hạng tin trong packages.ts.
  // Mốc mặc định — chủ dự án sửa được ở /admin/gia-khuyen-mai → tab Cấp hội viên.
  levels: [
    { id: "basic", name: "Basic", minTopup: 0, discount: 0, color: "#9aa0a6" },
    { id: "silver", name: "Silver", minTopup: 5_000_000, discount: 3, color: "#0071e3" },
    { id: "gold", name: "Gold", minTopup: 20_000_000, discount: 5, color: "#c9a24a" },
    { id: "diamond", name: "Diamond", minTopup: 50_000_000, discount: 10, color: "#d7263d" },
  ],
  topupAmounts: [200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000],
  projectPlans: PROJECT_PLANS_DEFAULT,
};

// ── TÍNH GIÁ ────────────────────────────────────────────────────────────────
// Giá chuẩn → trừ khuyến mãi đang chạy → trừ ưu đãi theo cấp thành viên.
// Trả về cả phần giảm để hiển thị minh bạch cho khách.
export type PriceQuote = {
  base: number;        // giá chuẩn
  promo: Promo | null; // khuyến mãi được áp
  promoOff: number;    // tiền giảm do khuyến mãi
  levelOff: number;    // tiền giảm do cấp thành viên
  total: number;       // phải trả
};

export function isPromoRunning(p: Promo, today: string): boolean {
  if (!p.active) return false;
  if (p.from && today < p.from) return false;
  if (p.to && today > p.to) return false;
  return true;
}

export function quotePrice({
  data,
  tierId,
  days,
  today,
  isNewMember = false,
  levelId,
}: {
  data: BillingData;
  tierId: TierId;
  days: number;
  today: string;          // "YYYY-MM-DD"
  isNewMember?: boolean;
  levelId?: string;       // không truyền = khách chưa có cấp hội viên
}): PriceQuote {
  const plan = data.plans.find((p) => p.tierId === tierId);
  const term = plan?.terms.find((t) => t.days === days) ?? plan?.terms[0];
  const base = term?.price ?? 0;

  // Khuyến mãi phù hợp nhất (giảm nhiều nhất) trong số đang chạy
  const fit = data.promos
    .filter((p) => isPromoRunning(p, today))
    .filter((p) => p.tiers.length === 0 || p.tiers.includes(tierId))
    .filter((p) => p.audience === "all" || (p.audience === "new" && isNewMember) || p.audience === levelId)
    .sort((a, b) => b.percent - a.percent);
  const promo = fit[0] ?? null;
  const promoOff = promo ? Math.round((base * promo.percent) / 100) : 0;

  const level = levelId ? data.levels.find((l) => l.id === levelId) : undefined;
  const levelOff = level?.discount ? Math.round(((base - promoOff) * level.discount) / 100) : 0;

  return { base, promo, promoOff, levelOff, total: Math.max(0, base - promoOff - levelOff) };
}

// Cấp hội viên theo TỔNG TIỀN ĐÃ NẠP. Chưa đủ mốc thấp nhất → null (chưa có cấp).
export function levelOf(data: BillingData, totalTopup: number): MemberLevel | null {
  const sorted = [...data.levels].sort((a, b) => b.minTopup - a.minTopup);
  return sorted.find((l) => totalTopup >= l.minTopup) ?? null;
}

// Cấp kế tiếp cần đạt (để nói cho khách còn thiếu bao nhiêu). Hết cấp → null.
export function levelTiepTheo(data: BillingData, totalTopup: number): MemberLevel | null {
  return [...data.levels].sort((a, b) => a.minTopup - b.minTopup).find((l) => totalTopup < l.minTopup) ?? null;
}

// Còn thiếu bao nhiêu tiền nạp nữa thì lên cấp kế tiếp (0 = đã đạt cấp cao nhất).
export function conThieuDeLenCap(data: BillingData, totalTopup: number): number {
  const tiep = levelTiepTheo(data, totalTopup);
  return tiep ? Math.max(0, tiep.minTopup - totalTopup) : 0;
}

export function vnd(n: number): string {
  return n.toLocaleString("vi-VN") + " ₫";
}

// ── DÒNG THÔNG BÁO MIỄN PHÍ CHO THÀNH VIÊN MỚI ──────────────────────────────
// LUÔN SINH TỪ CÀI ĐẶT THẬT — không lấy chữ tự do nữa. Trước đây admin gõ tay
// câu này nên đổi số tin/số ngày mà quên sửa câu là web nói SAI ưu đãi
// (vd cài "không giới hạn" nhưng vẫn hiện "được đăng 3 tin").
// quota = 0 → KHÔNG GIỚI HẠN số tin.
export function freeNote(f: FreePolicy, tenGoi?: string): string {
  const soTin = f.quota > 0 ? `${f.quota} tin` : "KHÔNG GIỚI HẠN số tin";
  const thoiHan =
    f.days % 30 === 0 && f.days >= 30 ? `${f.days / 30} tháng đầu` : `${f.days} ngày đầu`;
  const goi = tenGoi ? ` (gói ${tenGoi})` : "";
  return `Thành viên mới: đăng miễn phí ${soTin} trong ${thoiHan}${goi}.`;
}

// Tên gói của chính sách miễn phí — để câu thông báo nói rõ miễn phí ở gói nào.
// TÊN CẤP TIN luôn lấy từ packages.ts (một nguồn duy nhất) để mọi nơi gọi giống nhau.
export function tenGoiMienPhi(data: BillingData): string {
  return getTier(data.free.tierId).name;
}

// ── DÒNG GIÁ CHO TRANG BÁO GIÁ (/bao-gia-dang-tin) ──────────────────────────
// Sinh thẳng từ bảng giá admin đang lưu → sửa giá ở /admin/gia-khuyen-mai là
// trang báo giá đổi theo (trước đây giá viết cứng trong trang nên không đổi).
// Mốc 1 tuần làm giá gốc: kỳ dài hơn rẻ hơn thì hiện giá gạch + % giảm.
export type PriceLineOut = { label: string; original?: string; price: string };

export function priceLinesFor(data: BillingData, tierId: TierId): PriceLineOut[] | null {
  const plan = data.plans.find((p) => p.tierId === tierId);
  if (!plan?.terms.length) return null;
  const terms = [...plan.terms].sort((a, b) => a.days - b.days);
  const perWeek = terms.find((t) => t.days === 7)?.price ?? terms[0].price / (terms[0].days / 7);

  return terms.map((t) => {
    const goc = Math.round(perWeek * (t.days / 7));
    const giam = goc > t.price ? Math.round(((goc - t.price) / goc) * 100) : 0;
    const ten = t.days % 7 === 0 ? `Giá ${t.days / 7} tuần` : `Giá ${t.days} ngày`;
    return {
      label: giam > 0 ? `${ten} (−${giam}%)` : ten,
      original: giam > 0 ? dong(goc) : undefined,
      price: dong(t.price),
    };
  });
}

function dong(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}
