// ============================================================================
// GÓI ĐĂNG TIN · CHÍNH SÁCH GIÁ · KHUYẾN MÃI · VÍ THÀNH VIÊN
// ----------------------------------------------------------------------------
// GIÁ CHUẨN nằm trong `BILLING_DEFAULT` (khớp bảng giá đang hiển thị trên web).
// Chủ dự án sửa giá / bật khuyến mãi / bật miễn phí ở /admin/goi-dich-vu và
// /admin/khuyen-mai — lưu vào site_content (key "billing") → web đọc no-store
// nên đổi là hiện NGAY, không cần sửa code.
// ============================================================================

import { getTier, type TierId } from "@/lib/packages";
import { tachThue } from "@/lib/thue";

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
  maxVideos?: number; // SỐ VIDEO TỐI ĐA mỗi tin của cấp này
};

// Số ảnh/video tối đa của một cấp tin. Chưa đặt trong admin → mức mặc định bên dưới.
const ANH_MAC_DINH: Record<TierId, number> = { diamond: 15, gold: 12, silver: 10, basic: 7 };
const VIDEO_MAC_DINH: Record<TierId, number> = { diamond: 3, gold: 2, silver: 1, basic: 1 };

// ── MỨC CHUNG (giai đoạn hiện tại) ──────────────────────────────────────────
// Chưa siết theo cấp tin: MỌI tin đều 15 ảnh + 1 video, kể cả tin Basic. Khi nào
// bắt đầu thu tiền theo cấp thì bật "Giới hạn ảnh theo cấp tin" ở trang
// /admin/gia-khuyen-mai → quay lại mức riêng từng cấp (Basic 7 · Silver 10 ·
// Gold 12 · Diamond 15). Không phải sửa code.
export const ANH_CHUNG_MAC_DINH = 15;
export const VIDEO_CHUNG_MAC_DINH = 1;

export function soAnhToiDa(data: BillingData, tierId: TierId): number {
  if (!data.mediaTheoCap) return data.anhChung ?? ANH_CHUNG_MAC_DINH;
  return data.plans.find((p) => p.tierId === tierId)?.maxImages ?? ANH_MAC_DINH[tierId];
}

export function soVideoToiDa(data: BillingData, tierId: TierId): number {
  if (!data.mediaTheoCap) return data.videoChung ?? VIDEO_CHUNG_MAC_DINH;
  return data.plans.find((p) => p.tierId === tierId)?.maxVideos ?? VIDEO_MAC_DINH[tierId];
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
  // THỜI HẠN CỦA CHÍNH CHƯƠNG TRÌNH (khác `days` — `days` là "khách mới trong
  // bao nhiêu ngày kể từ lúc họ đăng ký"). Hai mốc này đóng/mở cả chương trình:
  // hết `to` là không ai còn được đăng miễn phí nữa, kể cả người vừa đăng ký.
  // Rỗng = không giới hạn (chương trình chạy mãi).
  from?: string;       // "YYYY-MM-DD"
  to?: string;         // "YYYY-MM-DD" — áp đến HẾT ngày này
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
  return levels.map((l) => ({
    ...l,
    minTopup: l.minTopup ?? l.minSpend ?? 0,
    // Cấp khởi điểm trước đây từng đặt tên "Đồng" và có thể còn nằm trong bản
    // admin đã lưu trên Supabase. Đổi ngay khi đọc lên → khách luôn thấy
    // "Basic", trùng tên với hạng tin, không phải nhớ hai hệ tên.
    id: l.id === "dong" ? "basic" : l.id,
    name: l.name?.trim() === "Đồng" ? "Basic" : l.name,
  }));
}

// ── BA BẢNG GIÁ DỊCH VỤ CÒN LẠI: ĐẨY TIN · PR · BANNER ─────────────────────
// Trước đây ba bảng này ghi cứng trong trang Báo giá dịch vụ nên sửa ở admin
// không đổi được gì. Nay gom về đây cùng một chỗ với giá gói tin: mọi chương
// trình · giá · khuyến mãi đều sửa ở /admin/gia-khuyen-mai, không sửa trong code.
// Giá để dạng SỐ (VNĐ) — web tự định dạng, admin không phải gõ dấu chấm.

// Một dòng trong bảng Đẩy tin: mỗi cột là một cấp tin (Diamond·Gold·Silver·Basic).
// giaGoc có thì hiện gạch ngang bên cạnh giá bán.
export type UpRow = {
  label: string;
  values: { giaGoc?: number; gia: number }[];
};

export type PrPkg = {
  tierId: TierId;
  name: string;
  gia: number;
  displays: string[];       // bài PR này xuất hiện ở đâu
};

export type BannerRow = {
  name: string;
  size: string;             // "370 × 300" hoặc tên sản phẩm trong bảng combo
  gia: number;
  pos: string;              // vị trí hiển thị
  note: string;             // ghi chú tự do ("Chia sẻ 3", "Chiết khấu 20%"…)
};

export type BannerTable = {
  title: string;
  sizeLabel: string;        // tiêu đề cột 2: "Kích thước (px)" hay "Sản phẩm"
  rows: BannerRow[];
};

export type BillingData = {
  plans: Plan[];
  projectPlans?: Plan[];    // GÓI DỰ ÁN (CVR-PJ) — cùng cấu trúc với gói tin đăng
  up?: UpRow[];             // bảng ĐẨY TIN (UP)
  pr?: PrPkg[];             // gói PR / bài viết
  prNotes?: string[];       // điều kiện kèm bảng PR
  banners?: BannerTable[];  // bảng BANNER (Web · Mobile · Combo)
  promos: Promo[];
  free: FreePolicy;
  points: PointPolicy;
  levels: MemberLevel[];
  topupAmounts: number[];   // mệnh giá nạp nhanh
  // GIỚI HẠN ẢNH/VIDEO — mặc định TẮT: mọi tin dùng CHUNG một mức (anhChung/
  // videoChung). Bật lên = mỗi cấp tin một mức riêng theo maxImages/maxVideos.
  mediaTheoCap?: boolean;
  anhChung?: number;        // số ảnh tối đa khi CHƯA chia theo cấp
  videoChung?: number;      // số video tối đa khi CHƯA chia theo cấp
  // GIÁ CÔNG BỐ THEO MỤC ĐÍCH — do nút "Công bố" ở /admin/gia-chuan ghi vào.
  // Có khối này thì bảng giá tin đăng + đẩy tin lấy theo tin BÁN hay CHO THUÊ,
  // thay cho `plans` / `up` ở trên. Chỉ chứa GIÁ ĐÃ TÍNH SẴN: giá chuẩn và % của
  // chương trình nằm trong bảng bi_mat, khách không đọc được (xem giaChuan.ts).
  congBo?: CongBo;
  // Gói hội viên đã công bố — nút công bố RIÊNG, không kéo theo giá đăng tin
  // (giá tin giữ nguyên trong thời gian miễn phí, chủ dự án chốt 25/09/2026).
  hoiVien?: GoiHoiVien[];
  hoiVienLuc?: string;
};

export type MucDichGia = "ban" | "thue";
export type GiaCongBo = { plans: Plan[]; up: UpRow[] };
export type CongBo = {
  ban: GiaCongBo;
  thue: GiaCongBo;
  chuongTrinh?: string;   // tên chương trình đang áp dụng lúc công bố (để hiện cho khách)
  luc: string;            // thời điểm công bố (ISO)
};

// ── GÓI HỘI VIÊN (chốt 25/09/2026 — một hệ duy nhất, cơ chế theo Batdongsan) ──
// Chưa mua gói = thành viên thường. Quyền lợi là VOUCHER cấp mỗi 30 ngày, hạn
// dùng 30 ngày, tự trừ vào giá lúc thu tiền. Mọi số tiền CHƯA GTGT.
export type LoaiVoucher = "tin-thuong" | "tin-vip" | "day-thuong";
export const TEN_VOUCHER: Record<LoaiVoucher, string> = {
  "tin-thuong": "đăng tin thường",
  "tin-vip": "đăng tin VIP",
  "day-thuong": "đẩy tin thường",
};
export type VoucherGoi = { loai: LoaiVoucher; giam: number; soLuong: number };
export type GoiHoiVien = {
  id: string;                                   // co-ban · tieu-chuan · cao-cap
  ten: string;                                  // "Hội viên Cơ bản"
  thoiHan: { thang: number; price: number; giaGoc?: number }[]; // giaGoc: trước chương trình giảm
  voucher: VoucherGoi[];                        // mỗi 30 ngày
  quyenLoi: string[];                           // quyền lợi khác — CHỈ ghi thứ web đã làm thật
};

// Loại voucher áp cho một lần ĐĂNG TIN theo hạng tin.
export const loaiVoucherTin = (tierId: string): LoaiVoucher => (tierId === "basic" ? "tin-thuong" : "tin-vip");

// Mục đích của tin → bảng giá nào. "Cần thuê" tính như cho thuê, "Cần mua" như bán.
export function mucDichGia(purpose?: string | null): MucDichGia {
  return purpose === "thue" || purpose === "can-thue" ? "thue" : "ban";
}

// Bảng giá ĐÚNG cho một tin: đã công bố giá theo mục đích thì thay `plans` + `up`
// bằng bảng của mục đích đó; chưa công bố thì giữ nguyên như trước. Mọi chỗ tính
// tiền (form đăng tin, duyệt tin, đẩy tin, mua gói đẩy) đi qua hàm này nên báo
// giá và trừ tiền luôn cùng một bảng.
export function bangTheoMucDich(d: BillingData, purpose?: string | null): BillingData {
  const cb = d.congBo?.[mucDichGia(purpose)];
  if (!cb) return d;
  return {
    ...d,
    plans: cb.plans.length ? cb.plans : d.plans,
    up: cb.up.length ? cb.up : d.up,
  };
}

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
// ── ĐẨY TIN · PR · BANNER: MỨC CHUẨN ───────────────────────────────────────
// Bốn cột của bảng Đẩy tin theo đúng thứ tự Diamond · Gold · Silver · Basic.
export const UP_DEFAULT: UpRow[] = [
  { label: "Đẩy 1 lượt", values: [{ gia: 90_000 }, { gia: 46_000 }, { gia: 17_000 }, { gia: 5_000 }] },
  { label: "Đẩy 3 lượt (−20%)", values: [
    { giaGoc: 270_000, gia: 216_000 }, { giaGoc: 138_000, gia: 110_400 },
    { giaGoc: 51_000, gia: 40_800 }, { giaGoc: 15_000, gia: 12_000 },
  ] },
  { label: "Đẩy 7 lượt (−30%)", values: [
    { giaGoc: 630_000, gia: 441_000 }, { giaGoc: 322_000, gia: 225_400 },
    { giaGoc: 119_000, gia: 83_300 }, { giaGoc: 35_000, gia: 24_500 },
  ] },
  { label: "Đẩy 13 lượt (−40%)", values: [
    { giaGoc: 1_170_000, gia: 702_000 }, { giaGoc: 598_000, gia: 358_800 },
    { giaGoc: 221_000, gia: 132_600 }, { giaGoc: 65_000, gia: 39_000 },
  ] },
  { label: "Đẩy 27 lượt (−50%)", values: [
    { giaGoc: 2_430_000, gia: 1_215_000 }, { giaGoc: 1_242_000, gia: 621_000 },
    { giaGoc: 459_000, gia: 229_500 }, { giaGoc: 135_000, gia: 67_500 },
  ] },
];

export const PR_DEFAULT: PrPkg[] = [
  { tierId: "diamond", name: "CVR-PR Diamond", gia: 8_900_000, displays: ["Xuất hiện trên Trang chủ: box Tin tức.", "Xuất hiện trên trang chuyên mục Tin tức.", "Chia sẻ trên Fanpage Facebook của Coastal Land."] },
  { tierId: "gold", name: "CVR-PR Gold", gia: 5_900_000, displays: ["Xuất hiện trên Trang chủ: box Tin tức.", "Xuất hiện trên trang chuyên mục Tin tức."] },
  { tierId: "silver", name: "CVR-PR Silver", gia: 2_900_000, displays: ["Xuất hiện trên trang chuyên mục Tin tức."] },
];

export const PR_NOTES_DEFAULT: string[] = [
  "Một bài PR không quá 5 ảnh minh hoạ.",
  "Bài PR gửi trước 2 ngày.",
  "Bài PR xuất hiện ở Trang chủ trong 1 ngày, xuất hiện trên trang chuyên mục Tin tức vĩnh viễn.",
];

export const BANNERS_DEFAULT: BannerTable[] = [
  {
    title: "Banner Web",
    sizeLabel: "Kích thước (px)",
    rows: [
      { name: "CVR-BANNER Homepage 1", size: "370 × 300", gia: 7_500_000, pos: "Trang chủ", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Homepage 2", size: "370 × 312", gia: 5_000_000, pos: "Trang chủ", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Homepage 3", size: "370 × 430", gia: 6_000_000, pos: "Trang chủ", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Listing 1", size: "370 × 600", gia: 7_000_000, pos: "Trang danh sách Tin đăng / Dự án", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Listing 2", size: "370 × 320", gia: 3_000_000, pos: "Trang danh sách Tin đăng / Dự án", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Listing 3", size: "370 × 430", gia: 5_000_000, pos: "Trang danh sách Tin đăng / Dự án", note: "Chia sẻ 3" },
    ],
  },
  {
    title: "Banner Mobile Web",
    sizeLabel: "Kích thước (px)",
    rows: [
      { name: "CVR-BANNER Mobile Homepage", size: "345 × 200", gia: 5_000_000, pos: "Trang chủ (mobile)", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Mobile Listing", size: "345 × 150", gia: 3_000_000, pos: "Trang chủ + Tin đăng (mobile)", note: "Bao toàn tỉnh lẻ: 1.500.000đ" },
    ],
  },
  {
    title: "Banner Web + Mobile Web (Combo)",
    sizeLabel: "Sản phẩm",
    rows: [
      { name: "CVR-BANNER Combo Homepage", size: "Banner Homepage 1 + Mobile Homepage", gia: 10_000_000, pos: "Web + Mobile", note: "Chiết khấu 20%" },
      { name: "CVR-BANNER Combo Listing", size: "Banner Listing 1 + Mobile Listing", gia: 8_900_000, pos: "Web + Mobile", note: "Chiết khấu 15%" },
    ],
  },
];

// Admin chưa lưu bảng nào thì dùng mức chuẩn — trang báo giá không bao giờ trống.
export const bangUp = (d: BillingData): UpRow[] => (d.up?.length ? d.up : UP_DEFAULT);

// Thứ tự CỘT của bảng Đẩy tin — đúng thứ tự trang báo giá đang render.
const COT_UP: TierId[] = ["diamond", "gold", "silver", "basic"];

// ── GÓI UP NHIỀU LƯỢT ───────────────────────────────────────────────────────
// Bảng Đẩy tin có 2 loại dòng, khác hẳn nhau về cách bán:
//   · dòng đầu  "Đẩy 1 lượt"     → mua LẺ 1 lượt, bấm là trừ ví.
//   · dòng sau  "Đẩy 7 lượt (−30%)" → mua SỈ nhiều lượt, rẻ hơn, tiêu dần mỗi ngày.
// Số lượt đọc THẲNG từ nhãn dòng nên chủ dự án thêm/sửa dòng trong admin là web
// hiểu ngay, không phải sửa code (vd gõ "Đẩy 10 lượt (−35%)" là có gói 10 lượt).
export type GoiUp = {
  label: string;   // nguyên văn nhãn dòng, để hiện cho khách
  soLuot: number;  // số lượt trong gói
  gia: number;     // giá CHƯA thuế cho trọn gói, theo cấp tin
  giaGoc?: number; // giá gạch ngang (nếu có khuyến mãi)
};

// "Đẩy 7 lượt (−30%)" → 7 · "Đẩy 1 lượt" → 1. Nhận cả nhãn cũ "Up 7 lần"
// (bảng admin lưu trước 25/09/2026) để không gãy dữ liệu cũ.
function soLuotTuNhan(label: string): number {
  const m = label.match(/(\d+)\s*(lần|lượt)/i);
  return m ? Number(m[1]) : 1;
}

// Danh sách gói NHIỀU LƯỢT (bỏ dòng "Đẩy 1 lượt" vì đó là mua lẻ) của một cấp tin.
export function goiUpNhieuLuot(d: BillingData, tierId: TierId): GoiUp[] {
  const cot = COT_UP.indexOf(tierId);
  if (cot < 0) return [];
  return bangUp(d)
    .map((r) => ({
      label: r.label,
      soLuot: soLuotTuNhan(r.label),
      gia: r.values[cot]?.gia ?? 0,
      ...(r.values[cot]?.giaGoc ? { giaGoc: r.values[cot].giaGoc } : {}),
    }))
    .filter((g) => g.soLuot > 1 && g.gia > 0);
}

// GIÁ MỘT LƯỢT ĐẨY NGAY của một cấp tin (dòng đầu bảng Đẩy tin, "Đẩy 1 lượt").
// Giá CHƯA gồm GTGT — cộng thuế ở chỗ trừ ví, giống mọi khoản khác.
// Đọc từ bảng admin đang lưu nên chủ dự án đổi giá ở /admin/gia-khuyen-mai là
// đổi luôn số tiền trừ khi khách bấm Đẩy, không phải sửa code.
export function giaDayTin(d: BillingData, tierId: TierId): number {
  const cot = COT_UP.indexOf(tierId);
  const dong = bangUp(d)[0];
  return cot >= 0 ? dong?.values[cot]?.gia ?? 0 : 0;
}
export const goiPr = (d: BillingData): PrPkg[] => (d.pr?.length ? d.pr : PR_DEFAULT);
export const ghiChuPr = (d: BillingData): string[] => (d.prNotes?.length ? d.prNotes : PR_NOTES_DEFAULT);
export const bangBanner = (d: BillingData): BannerTable[] => (d.banners?.length ? d.banners : BANNERS_DEFAULT);

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
      note: "Ưu tiên hiển thị cao nhất — hệ số tiếp cận X30",
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
      note: "Hiển thị nổi bật — hệ số tiếp cận X15",
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
      note: "Tiết kiệm hiệu quả — hệ số tiếp cận X8",
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
      note: "Tin thường — hiển thị theo thời gian đăng",
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
    // Chủ dự án chốt 17/9/2026: chương trình chạy TỪ HÔM NAY ĐẾN HẾT 1 THÁNG SAU.
    // Muốn gia hạn hay đóng sớm thì sửa ở /admin/gia-khuyen-mai → tab Miễn phí,
    // không phải sửa code.
    from: "2026-09-17",
    to: "2026-10-17",
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
  up: UP_DEFAULT,
  pr: PR_DEFAULT,
  prNotes: PR_NOTES_DEFAULT,
  banners: BANNERS_DEFAULT,
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
  // Chương trình có hạn chót thì PHẢI nói ra — khách cần biết ưu đãi còn mấy ngày,
  // và web không được tiếp tục hứa miễn phí sau khi chương trình đã đóng.
  const hanChot = f.to ? ` Chương trình áp dụng đến hết ngày ${ngayVn(f.to)}.` : "";
  return `Thành viên mới: đăng miễn phí ${soTin} trong ${thoiHan}${goi}.${hanChot}`;
}

// Chương trình miễn phí có đang chạy vào ngày `today` ("YYYY-MM-DD") không?
// Tắt bằng nút Trạng thái, hoặc hết hạn `to` — cả hai đều chặn như nhau.
export function freeDangChay(f: FreePolicy, today: string): boolean {
  if (!f.active) return false;
  if (f.from && today < f.from) return false;
  if (f.to && today > f.to) return false;
  return true;
}

// "2026-10-17" → "17/10/2026". Không dùng new Date() để khỏi lệch múi giờ.
export function ngayVn(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
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
      original: giam > 0 ? giaTra(goc) : undefined,
      price: giaTra(t.price),
    };
  });
}

// GIÁ GÓI DỰ ÁN (CVR-PJ) cho trang báo giá — trước đây bảng này viết cứng trong
// trang nên sửa ở /admin/gia-khuyen-mai → tab "Gói dự án" không đổi được gì.
export function priceLinesDuAn(data: BillingData, tierId: TierId): PriceLineOut[] | null {
  return priceLinesFor({ ...data, plans: goiDuAn(data) }, tierId);
}

// Tiền trên TRANG BÁO GIÁ: "7.500.000đ" — cả trang dùng chung một kiểu.
export function dong(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

// ── SỐ TIỀN HIỆN CHO KHÁCH = SỐ KHÁCH THỰC TRẢ ─────────────────────────────
// Giá gốc trong bảng giá là giá CHƯA thuế, nhưng khách bấm thanh toán là trừ ví
// đúng số ĐÃ GỒM GTGT. Bày giá chưa thuế rồi trừ số khác là khách khiếu nại —
// nên mọi giá hiện ra ngoài đều đi qua đây (chủ dự án chốt 11/9/2026).
// Tiền hàng và tiền thuế vẫn tách riêng trong sổ doanh thu và trên hóa đơn.
export function giaTra(giaChuaThue: number): string {
  return dong(tachThue(giaChuaThue).tongTra);
}
