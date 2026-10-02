import type { SupabaseClient } from "@supabase/supabase-js";
import { vnd } from "@/lib/billing";

// ════════════════════════════════════════════════════════════════════════════
// VÍ KHẢ DỤNG = SỐ DƯ − TẠM GIỮ (0056 · quy trình chuẩn sàn, chốt 02/10/2026)
// Tạm giữ = phí (đã gồm VAT) các tin đang chờ duyệt chưa trừ ví — CSDL tính (tien_tam_giu).
// Mọi chỗ máy chủ so "đủ tiền" / báo thiếu tiền dùng hàm này, y như CSDL kiểm.
// boTin: bỏ tiền giữ của chính tin đang xử lý (duyệt tin / đăng lại tin đó).
// ════════════════════════════════════════════════════════════════════════════
export type ViKhaDung = { soDu: number; tamGiu: number; khaDung: number };

export async function viKhaDung(admin: SupabaseClient, userId: string, boTin?: string): Promise<ViKhaDung> {
  const [{ data: hs }, { data: giu }] = await Promise.all([
    admin.from("profiles").select("balance").eq("id", userId).limit(1),
    admin.rpc("tien_tam_giu", { p_user: userId, p_bo_tin: boTin ?? null }),
  ]);
  const soDu = Number((hs as { balance: number | null }[] | null)?.[0]?.balance ?? 0);
  const tamGiu = Number(giu ?? 0);
  return { soDu, tamGiu, khaDung: soDu - tamGiu };
}

/** Câu báo thiếu tiền thống nhất: "Nạp thêm X để …" (số đã gồm VAT). */
export function cauThieuTien(canTra: number, vi: ViKhaDung, viec: string): string {
  const thieu = Math.max(0, canTra - vi.khaDung);
  return `Nạp thêm ${vnd(thieu)} để ${viec}. Cần ${vnd(canTra)}, khả dụng ${vnd(vi.khaDung)}` +
    (vi.tamGiu > 0 ? ` (đang tạm giữ ${vnd(vi.tamGiu)} cho tin chờ duyệt).` : ".");
}
