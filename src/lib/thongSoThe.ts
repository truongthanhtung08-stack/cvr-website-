import type { Listing } from "@/lib/data";
import type { TierId } from "@/lib/packages";

// THÔNG SỐ TRÊN THẺ TIN — quy định admin "Thông số trên thẻ tin" (chủ dự án 23/10/2026):
//   Diamond giá · diện tích · giá/m² · phòng ngủ · WC · nội thất (một dòng) · Gold giá · diện tích · giá/m² · phòng ngủ · WC
//   Silver · Basic giá · diện tích · giá/m².
// Giá · diện tích · giá/m² đã có đơn vị → không biểu tượng (tiết kiệm chỗ); số trơn (PN, WC) và nội thất có biểu tượng.
// Đơn giá/m² mọi cấp: khách ghi thì lấy của khách; không thì web chia đúng loại hình khi số chắc chắn (listingsDb pricePerM2).
// Chỉ mục tin CÓ GHI, không suy, không bịa. Địa chỉ là dòng RIÊNG. Dùng chung TheTinMobile + PropertyCard variant "tier".
export type MucSo = { chu: string; do?: boolean; icon?: "pn" | "wc" | "sofa"; giaM2?: boolean };
export function thongSo(l: Listing): MucSo[] {
  const loai = (l.type || "").toLowerCase();
  const canHo = /căn hộ|chung cư|condotel|officetel|penthouse/.test(loai);
  const dat = /đất/.test(loai);
  const vanPhong = /văn phòng|mặt bằng|kho|xưởng|kiot|cửa hàng/.test(loai);
  const nha = !canHo && !dat && !vanPhong && /nhà|biệt thự|villa|shophouse|liền kề/.test(loai);
  const thue = l.purpose === "thue" || l.purpose === "can-thue";
  const ds: MucSo[] = [{ chu: l.price === "Thỏa thuận" ? "Giá thỏa thuận" : l.price, do: true }];
  if (l.area) ds.push({ chu: l.area, do: true });
  if (l.pricePerM2 && (canHo || dat || nha || vanPhong)) ds.push({ chu: l.pricePerM2, giaM2: true });
  if ((canHo || nha) && l.beds) ds.push({ chu: String(l.beds), icon: "pn" });
  if ((canHo || nha) && l.baths) ds.push({ chu: String(l.baths), icon: "wc" });
  // Nội thất (Diamond, chủ dự án 23/10/2026): biểu tượng ghế sofa + chữ ngắn — bỏ chữ "Nội thất" vì đã có biểu tượng
  const nt = gonNoiThat(l.noiThat);
  if ((canHo || nha) && nt) ds.push({ chu: nt, icon: "sofa" });
  return ds;
}
// "Nội thất đầy đủ" → "Đầy đủ" · "Nội thất cao cấp" → "Cao cấp" · "… cơ bản" → "Cơ bản"
function gonNoiThat(s?: string): string | undefined {
  const x = (s ?? "").toLowerCase();
  if (!x) return undefined;
  if (/cao cấp/.test(x)) return "Cao cấp";
  if (/đầy đủ/.test(x)) return "Đầy đủ";
  if (/cơ bản/.test(x)) return "Cơ bản";
  // Chỉ ba tình trạng rõ ràng (chủ dự án 23/10/2026): Cơ bản · Đầy đủ · Cao cấp — "bàn giao thô", khác → không hiện
  return undefined;
}

// Thông số THEO CẤP để hiện trên thẻ, ĐÚNG THỨ TỰ quy định admin: giá · diện tích · giá/m² · phòng ngủ · WC; phòng ngủ · WC chỉ
// Diamond. Trên thẻ giá/m² chỉ ghi "47 tr/m²" — bỏ đuôi "căn hộ / sàn / đất" (chủ dự án 23/10/2026) để cả dãy nằm một dòng;
// trang tin vẫn ghi đủ đơn vị theo loại hình.
// Theo cấp (chủ dự án 23/10/2026): Diamond giá · DT · giá/m² · PN · WC · nội thất · Gold giá · DT · giá/m² · PN · WC ·
// Silver · Basic giá · DT · giá/m². Diamond đúng MỘT dòng (TheTinMobile co cỡ chữ dòng này cho vừa).
export function thongSoTheoCap(l: Listing, t: TierId): MucSo[] {
  const ds = thongSo(l).map((x) => (x.giaM2 ? { ...x, chu: x.chu.replace(/ (căn hộ|sàn|đất)$/, "") } : x));
  if (t === "diamond") return ds;
  if (t === "gold") return ds.filter((x) => x.icon !== "sofa");
  return ds.filter((x) => !x.icon);
}
