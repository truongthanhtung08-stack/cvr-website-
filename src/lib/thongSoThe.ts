import type { Listing } from "@/lib/data";
import type { TierId } from "@/lib/packages";

// Số mục thông số THEO CẤP — đúng quy định admin "Thông số trên thẻ tin" (site_content quy_dinh_gia, 20/10/2026):
// Diamond giá · diện tích · giá/m² · phòng ngủ · WC · Gold, Silver, Basic giá · diện tích.
// Dùng chung: thẻ điện thoại (TheTinMobile) + thẻ trang chủ máy tính (PropertyCard variant "tier").
export const SO_THONG_SO: Record<TierId, number> = { diamond: 5, gold: 2, silver: 2, basic: 2 };

// Thông số theo LOẠI HÌNH (chủ dự án 09/10/2026: "tuỳ loại hình BĐS"), rồi cắt theo cấp.
// Thứ tự: giá · m² · PN · WC · giá/m² (đất không có PN/WC).
export type MucSo = { chu: string; do?: boolean; icon?: "pn" | "wc"; giaM2?: boolean };
export function thongSo(l: Listing): MucSo[] {
  const loai = (l.type || "").toLowerCase();
  const canHo = /căn hộ|chung cư|condotel|officetel|penthouse/.test(loai);
  const dat = /đất/.test(loai);
  const nha = !canHo && !dat && /nhà|biệt thự|villa|shophouse|liền kề/.test(loai);
  const ds: MucSo[] = [{ chu: l.price === "Thỏa thuận" ? "Giá thỏa thuận" : l.price, do: true }];
  if (l.area) ds.push({ chu: l.area, do: true });
  if ((canHo || nha) && l.beds) ds.push({ chu: String(l.beds), icon: "pn" });
  if ((canHo || nha) && l.baths) ds.push({ chu: String(l.baths), icon: "wc" });
  if (l.pricePerM2 && (canHo || dat || nha)) ds.push({ chu: l.pricePerM2, giaM2: true });
  return ds;
}

// Thông số THEO CẤP để hiện trên thẻ: cắt đúng số mục của cấp (SO_THONG_SO, giữ luật Gold · Silver · Basic = giá · diện tích),
// rồi đặt giá/m² NGAY SAU giá (chủ dự án 22/10/2026 tối: "phải đúng chuẩn — giá/m² phải ở gần chỗ giá, tin Diamond").
export function thongSoTheoCap(l: Listing, t: TierId): MucSo[] {
  const ds = thongSo(l).slice(0, SO_THONG_SO[t]);
  const i = ds.findIndex((x) => x.giaM2);
  if (i > 1) ds.splice(1, 0, ...ds.splice(i, 1));
  return ds;
}
