import type { TierId } from "@/lib/packages";
import { COT_NANG_GOI } from "@/lib/billing";

// ============================================================================
// UP TIN – NÂNG GÓI PHÍA KHÁCH (chủ dự án chốt 01/11/2026)
// Khách bấm "Nâng gói" trên tin ĐANG HIỆN → chọn gói cao hơn → gửi YÊU CẦU (details.nang_cho),
// tiền tạm giữ (0067). Tin vẫn hiện bình thường với gói cũ. Admin duyệt mới trừ ví, đổi gói,
// hạn = ngày duyệt + số ngày gói mới (MỘT hạn, gói cũ dừng). Từ chối / khách huỷ = xoá nang_cho.
// Tệp này chỉ có hàm thuần (dùng được cả trình duyệt lẫn máy chủ); tính tiền: giaNangGoi (billing.ts).
// ============================================================================

export type YeuCauNang = {
  tier: TierId;
  days: number;
  apKhauTru: boolean;
  khauTru: number;     // chưa VAT
  truocThue: number;   // chưa VAT — số tiền hàng sẽ thu
  tongTra: number;     // đã gồm VAT — số đã báo khách, đang tạm giữ
  gui_luc: string;     // ISO — mốc tính khấu trừ
};

export const THU_HANG: Record<TierId, number> = { basic: 0, silver: 1, gold: 2, diamond: 3 };

type TinNang = {
  tier: TierId;
  status: string;
  published_at: string | null;
  tier_expires_at: string | null;
  details?: Record<string, unknown> | null;
};

const ds = (r: TinNang) => (r.details ?? {}) as {
  plan?: { tier?: TierId; giaBao?: number; khuyenMai?: boolean; tu?: string };
  han_basic?: string; len_web_luc?: string; nang_cho?: YeuCauNang;
};

/** Hạn hiện tại của tin — như trang tin (listingsDb hetHanLuc): gói thường một hạn, tin chương trình lấy hạn muộn hơn. */
export function hanTin(r: TinNang): string | null {
  const d = ds(r);
  if (d.plan?.khuyenMai === false) return r.tier_expires_at;
  const a = r.tier_expires_at, b = d.han_basic ?? null;
  return a && b ? (Date.parse(b) > Date.parse(a) ? b : a) : (a ?? b);
}

/** Hạng đang chạy (gói VIP quá hạn → Basic, như tierHieuLuc). */
export function hangDangChay(r: TinNang): TierId {
  if (r.tier === "basic" || !r.tier_expires_at) return r.tier;
  return Date.parse(r.tier_expires_at) < Date.now() ? "basic" : r.tier;
}

/** Gói đang chạy để tính khấu trừ: phí đã trả (chưa VAT) của chính gói này, từ … đến … */
export function goiHienTai(r: TinNang): { daTra: number; tu: string; den: string } | null {
  const d = ds(r), han = hanTin(r), tu = d.plan?.tu ?? d.len_web_luc ?? r.published_at;
  if (!han || !tu) return null;
  const daTra = d.plan?.tier === hangDangChay(r) ? Math.max(0, Number(d.plan?.giaBao ?? 0)) : 0;
  return { daTra, tu, den: han };
}

/** Số ngày còn lại của tin (làm tròn lên). */
export function soNgayCon(r: TinNang, luc = Date.now()): number {
  const han = hanTin(r);
  return han ? Math.max(0, Math.ceil((Date.parse(han) - luc) / 86_400_000)) : 0;
}

/** Các gói được nâng lên từ tin này (cao hơn gói đang chạy). */
export function goiNangDuoc(r: TinNang): TierId[] {
  return COT_NANG_GOI.filter((t) => THU_HANG[t] > THU_HANG[hangDangChay(r)]);
}

/** Tin còn hiện, còn hạn, chưa có yêu cầu đang chờ, còn gói cao hơn để nâng. */
export function tinNangDuoc(r: TinNang, luc = Date.now()): boolean {
  const han = hanTin(r);
  return r.status === "approved" && !!han && Date.parse(han) > luc && !ds(r).nang_cho && goiNangDuoc(r).length > 0;
}

export const yeuCauNangCuaTin = (r: Pick<TinNang, "details">): YeuCauNang | null =>
  ((r.details ?? {}) as { nang_cho?: YeuCauNang }).nang_cho ?? null;
