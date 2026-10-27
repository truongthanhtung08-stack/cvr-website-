import type { Listing } from "@/lib/data";
import { rentCategories, saleCategories, rentNhaPseo, rentVanPhongMatBangPseo, saleNhaPseo, type Category } from "@/lib/categories";
import { duongDan, khop, tatCaTrang, tieuDe, type DieuKien } from "@/lib/pseo";
import { giaTheoNhom, khoangGiaTin, type GiaNhom } from "@/components/HoiDapPseo";
import type { KhuVuc } from "@/lib/khuVuc";
import { thangHienTai } from "@/lib/thang";

// ============================================================================
// TRANG "GIÁ NHÀ ĐẤT <TỈNH> THÁNG MM/YYYY" (kế hoạch SEO mục 5b-D3, chủ dự án duyệt 27/10/2026)
// Nhóm từ khoá "giá đất / giá nhà / giá căn hộ <nơi>" = 448 cụm Google gợi ý (17% bộ từ khoá) mà web chưa có trang đích.
// Mỗi loại hình đủ tin = một mục, dùng ĐÚNG khuôn giá theo khu vực của trang pSEO (giaTheoNhom): phường + quận cũ → dự án →
// giá, diện tích, giá/m², theo phòng ngủ, theo mức giá. Số tự tính từ tin đang có; không tự viết văn mô tả.
// Cổng (chống trang mỏng): ≥ 2 mục có số → cho Google; 1 mục → xem được, noindex; 0 mục → 404.
// Chi phí: tính trong lúc dựng trang từ dữ liệu đã có bộ nhớ đệm (getListings) — không thêm truy vấn, cron hay hàm máy chủ.
// ============================================================================

// Nhóm "Nhà" thay cho nhà riêng / nhà mặt phố (người tìm gõ "giá nhà <nơi>"), giữ các loại hình còn lại theo menu
const BAN: Category[] = [
  saleCategories.find((c) => c.slug === "can-ho-chung-cu")!, saleNhaPseo,
  // thứ tự theo người tìm: căn hộ · nhà · đất · đất nền · condotel · biệt thự · shophouse · kho
  ...["dat", "dat-nen-du-an", "condotel", "biet-thu-lien-ke", "shophouse", "kho-nha-xuong"].map((s) => saleCategories.find((c) => c.slug === s)!),
];
const THUE: Category[] = [
  rentCategories.find((c) => c.slug === "can-ho-chung-cu")!, rentNhaPseo, rentVanPhongMatBangPseo,
  ...rentCategories.filter((c) => ["phong-tro", "kho-nha-xuong"].includes(c.slug)),
];

export type MucGia = { dk: DieuKien; g: GiaNhom; khoang: string; lienKet: { href: string; nhan: string } };
export type TrangGia = { tinh: KhuVuc; tieuDe: string; moTa: string; ban: MucGia[]; thue: MucGia[]; index: boolean };

export function trangGiaNhaDat(tinh: KhuVuc, listings: Listing[]): TrangGia {
  const trang = tatCaTrang(listings);
  // Hai loại hình cùng đúng một nhóm tin (vd đất nền = đất khi mọi tin đất là đất nền) → chỉ giữ mục đầu, không lặp số
  const daCo = new Set<string>();
  const muc = (m: "ban" | "thue", ds: Category[]) => ds.flatMap((cat): MucGia[] => {
    const dk: DieuKien = { muc: m, tinh, cat };
    const tin = listings.filter((l) => khop(l, dk));
    const khoa = m + ":" + tin.map((l) => l.id).sort().join(",");
    if (daCo.has(khoa)) return [];
    daCo.add(khoa);
    const g = giaTheoNhom(dk, tin);
    if (!g || !g.khuVucGia.length) return [];
    const path = duongDan(dk);
    // Trỏ về trang loại hình × tỉnh khi trang đó mở cho Google; chưa mở thì về trang tỉnh
    const mo = trang.get(path)?.index;
    return [{ dk, g, khoang: khoangGiaTin(tin, m === "thue"), lienKet: mo ? { href: path, nhan: `Xem tin ${tieuDe(dk).charAt(0).toLowerCase()}${tieuDe(dk).slice(1)}` } : g.veTinh }];
  });
  const ban = muc("ban", BAN), thue = muc("thue", THUE);
  // Mô tả Google: "Giá nhà đất Đà Nẵng tháng 10/2026: căn hộ chung cư từ … đến …, nhà từ …; thuê căn hộ từ … triệu/tháng." — ≤ 160 ký tự
  const ten = (x: MucGia) => (x.dk.cat!.tuKhoa ?? x.dk.cat!.h1).replace(/^(Bán|Cho thuê)\s+/i, "").toLowerCase();
  const phan = [...ban.map((x) => `${ten(x)} ${x.khoang}`), ...thue.map((x) => `thuê ${ten(x)} ${x.khoang}`)];
  let moTa = `Giá nhà đất ${tinh.name} ${thangHienTai()}:`;
  for (const p of phan) { const thu = `${moTa}${moTa.endsWith(":") ? " " : ", "}${p}`; if ([...thu].length + 1 > 160) break; moTa = thu; }
  return { tinh, tieuDe: `Giá nhà đất ${tinh.name} ${thangHienTai()}`, moTa: `${moTa}.`, ban, thue, index: ban.length + thue.length >= 2 };
}
