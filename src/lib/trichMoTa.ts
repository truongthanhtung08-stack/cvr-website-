import type { Listing } from "@/lib/data";
import { chuThuan } from "@/lib/chuThuan";
import { normalizeVi } from "@/lib/filters";
import { tierFromBadge } from "@/lib/packages";

// DÒNG MÔ TẢ TRÊN THẺ Ở TRANG DANH SÁCH (chủ dự án 20/10/2026: "điều chỉnh hiển thị sau khi lọc tin").
// Số dòng theo cấp (tối đa 3) — chủ dự án 20/10/2026: lấy Basic làm nền (trang toàn Basic) = 2 dòng ≈ 150–180 ký tự,
// bằng đoạn mô tả Google tự hiện trong kết quả; cấp trên: Bạc 2 · Vàng 3 · Kim Cương 3 (cấp cao khác nhau ở ảnh, huy hiệu,
// tiêu đề IN HOA, Zalo + Hiện số). Chỉ trang danh sách sau khi lọc; thẻ trang chủ (PropertyCard) giữ như cũ.
// Chữ = 2 CÂU ĐẦU của mô tả người đăng, BỎ câu lặp lại tiêu đề (chủ dự án 20/10/2026). Không mô tả → không hiện
// (không tự ghép câu thay). Bỏ số điện thoại — số chỉ hiện qua nút "Hiện số".
// Dùng chung cho thẻ (TheTinMobile) và khung máy chủ cho Google (KhungChoDanhMuc) → Google đọc TRÙNG chữ khách thấy.
export function soDongMoTa(l: Listing): 2 | 3 {
  const t = l.badge ? tierFromBadge(l.badge) : "basic";
  return t === "diamond" || t === "gold" ? 3 : 2;
}

export function moTaThe(l: Listing): string {
  const that = chuThuan(l.desc)
    .replace(/[•·▪◦#=_~>-]{2,}/g, " ")
    .replace(/\+?\d[\d .-]{7,}\d/g, "")
    .trim();
  if (!that) return "";
  const goc = (s: string) => normalizeVi(s).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const tieuDe = goc(l.title);
  // Tách câu: dấu . ! ? … rồi khoảng trắng, hoặc xuống dòng
  const cau = that.split(/(?<=[.!?…])\s+|\n+/).map((c) => c.replace(/\s+/g, " ").replace(/^[-–—•*+✓✔➤►▶·]+\s*/, "").trim()).filter((c) => c.length > 1);
  // Câu lặp lại tiêu đề (người đăng hay mở đầu mô tả bằng đúng tiêu đề) → bỏ
  const laTieuDe = (c: string) => { const n = goc(c); return n.length > 10 && (tieuDe.includes(n) || n.includes(tieuDe)); };
  return cau.filter((c) => !laTieuDe(c)).slice(0, 2).join(" ");
}

// ĐỊA CHỈ TRÊN THẺ — HAI DÒNG ĐỒNG BỘ, MỌI THẺ, MỌI NƠI (chủ dự án 20/10/2026: "hệ mới và cũ đồng bộ, mới trên, cũ dưới"):
//   · trên: số nhà + tên đường (khách cho hiện) + hệ MỚI 2 cấp — "12 Nguyễn Biểu, Phường Bắc Nha Trang, Khánh Hòa"
//   · dưới: hệ CŨ 3 cấp, tên chuẩn của hệ thống (listingsDb chuẩn hoá) — "Vĩnh Hải, Nha Trang, Khánh Hòa"
// Cùng nội dung, cùng chữ "Địa chỉ hệ cũ" như trang tin.
export function diaChiHaiDong(l: Pick<Listing, "location" | "locationCu" | "diaChiSo">): { moi: string; cu: string } {
  const moi = [l.diaChiSo, l.location].filter(Boolean).join(", ");
  const cu = l.locationCu && l.locationCu !== l.location ? l.locationCu : "";
  return { moi, cu };
}
