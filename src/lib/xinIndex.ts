// TRẠNG THÁI INDEX — MỘT NGUỒN cho Admin → Xin index, Admin → Từ khoá lõi và bảng từ khoá (anh 12/11/2026: "page nào đã index, page
// nào chưa index, thống nhất"). Hai trạng thái duy nhất: ĐÃ INDEX / CHƯA INDEX. "Đã xin dd/mm" chỉ là ghi chú của trang chưa index.
// Gốc sự thật = danh sách trang đã index của Search Console (Trang → Đã lập chỉ mục), dán vào Admin → Xin index → "Cập nhật từ
// Search Console" → site_content "xin_index".google. Trang Kiểm tra URL báo "có trên Google" sau lần cập nhật đó → bấm "Đã index" (kq da-co).
import type { createAdminClient } from "@/lib/supabase/admin";
import daXinTuSo from "@/data/da-xin-index.json";

export type Ghi = { ngay: string; kq: "da-xin" | "da-co" };
export type GoogleDs = { ngay: string; ds: string[] };
export type SoXinIndex = { trang: Record<string, Ghi>; google: GoogleDs | null };
export type TrangThaiIndex = { daIndex: boolean; xin: string | null };

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

export async function docSoXinIndex(admin: Admin): Promise<SoXinIndex> {
  const { data } = await admin.from("site_content").select("data").eq("key", "xin_index").limit(1);
  const d = (data?.[0]?.data ?? {}) as Partial<SoXinIndex>;
  return { trang: d.trang ?? {}, google: d.google ?? null };
}

export async function ghiSoXinIndex(admin: Admin, so: SoXinIndex) {
  return admin.from("site_content").upsert({ key: "xin_index", data: so });
}

/** Một dòng danh sách Search Console → khoá so khớp: tin đăng "ma:<8 ký tự cuối>" (đường dẫn tin đổi chữ vẫn khớp), trang khác
 *  "/đường-dẫn". Nhận "https://coastalland.vn/…", "/…" hoặc "ma:xxxxxxxx"; bỏ dòng có "?" (trang lọc tạm, không phải trang web). */
export function duongTuUrl(u: string): string | null {
  const s = u.trim();
  if (/^ma:[0-9a-f]{8}$/i.test(s)) return s.toLowerCase();
  const m = s.match(/^(?:https?:\/\/(?:www\.)?coastalland\.vn)?(\/[^\s#]*)$/i);
  if (!m || m[1].includes("?")) return null;
  const p = decodeURI(m[1]).replace(/\/+$/, "") || "/";
  return p.startsWith("/bat-dong-san/") ? `ma:${p.slice(-8).toLowerCase()}` : p;
}

const khoa = (duong: string) => (duong.startsWith("/bat-dong-san/") ? `ma:${duong.slice(-8).toLowerCase()}` : duong);

/** Trạng thái một trang: đã index (theo Search Console, hoặc đánh dấu tay sau lần cập nhật) / chưa index + ngày đã xin. */
export function trangThaiIndex(duong: string, so: SoXinIndex, googleSet: Set<string>): TrangThaiIndex {
  const g = so.trang[duong];
  const cu = (daXinTuSo as Record<string, string>)[duong]
    ?? (duong.startsWith("/bat-dong-san/") ? (daXinTuSo as Record<string, string>)[`ma:${duong.slice(-8)}`] : undefined);
  const daIndex = googleSet.has(khoa(duong)) || (g?.kq === "da-co" && (!so.google || g.ngay >= so.google.ngay));
  return { daIndex, xin: g?.ngay ?? cu ?? null };
}
