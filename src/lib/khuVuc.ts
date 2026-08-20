import { provinceNamesNew, provinceNames } from "@/lib/locations";
import { normalizeVi } from "@/lib/filters";

// ============================================================================
// TRANG THEO KHU VỰC — /mua-ban/da-nang · /cho-thue/hue · /du-an/quang-ngai …
// ----------------------------------------------------------------------------
// Vì sao phải có: nhóm truy vấn ĐÔNG NHẤT của ngành này là "nhà đất Đà Nẵng",
// "cho thuê căn hộ Huế", "đất nền Quảng Ngãi" — tức LOẠI HÌNH + ĐỊA PHƯƠNG.
// Web trước đây chỉ có trang theo loại hình (/mua-ban/can-ho-chung-cu) nên gần
// như không có cửa vào từ nhóm truy vấn đó. Batdongsan/Homedy sống chủ yếu nhờ
// nhóm trang này.
//
// NGUYÊN TẮC CHỐNG "TRANG MỎNG":
// Chỉ trang khu vực CÓ TIN mới được đưa vào sitemap và cho Google lập chỉ mục.
// Khu vực chưa có tin vẫn mở xem bình thường (khách bấm từ menu vẫn tới nơi,
// kèm gợi ý tin liên quan) nhưng gắn noindex — mở hàng loạt trang rỗng là cách
// nhanh nhất để Google đánh giá thấp cả tên miền.
// ============================================================================

export type KhuVuc = { slug: string; name: string };

// "Đà Nẵng" → "da-nang" · "Hồ Chí Minh" → "ho-chi-minh"
export function slugKhuVuc(name: string): string {
  return normalizeVi(name).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Nhận CẢ hai hệ đơn vị hành chính: hệ MỚI (34 tỉnh sau sáp nhập) và hệ CŨ —
// vì tin cũ còn ghi "Quảng Nam", "Bình Định", khách cũng vẫn gõ tên cũ.
const TEN_TAT_CA: string[] = Array.from(new Set([...provinceNamesNew, ...provinceNames]));

export const khuVucList: KhuVuc[] = TEN_TAT_CA.map((name) => ({ slug: slugKhuVuc(name), name }));

// Slug → tên tỉnh. Không khớp → null (để trang trả về "không tìm thấy").
export function timKhuVuc(slug: string): KhuVuc | null {
  const s = slug.toLowerCase();
  return khuVucList.find((k) => k.slug === s) ?? null;
}

// ── Khu vực TRỌNG ĐIỂM — luôn hiện trong khối liên kết cuối trang danh sách ──
// Đúng vùng Coastal Land phủ sóng (Depth trước Breadth: Đà Nẵng + Huế trước).
export const khuVucTrongDiem: string[] = [
  "Đà Nẵng", "Huế", "Quảng Trị", "Quảng Ngãi", "Gia Lai", "Khánh Hòa", "Đắk Lắk", "Lâm Đồng",
];

// ── Tiêu đề & mô tả cho từng trang khu vực ──────────────────────────────────
// Viết đúng cách người ta gõ vào Google, mỗi trang một câu riêng (trùng lặp
// tiêu đề giữa các trang là lỗi khiến Google chỉ chọn một trang để hiện).
export function tieuDeKhuVuc(muc: "ban" | "thue" | "duan", ten: string): string {
  if (muc === "thue") return `Cho thuê nhà đất tại ${ten} — giá mới nhất`;
  if (muc === "duan") return `Dự án bất động sản tại ${ten}`;
  return `Nhà đất bán tại ${ten} — giá mới nhất`;
}

export function moTaKhuVuc(muc: "ban" | "thue" | "duan", ten: string, soTin: number): string {
  const dem = soTin > 0 ? `${soTin} tin đang đăng. ` : "";
  if (muc === "thue") {
    return `${dem}Cho thuê nhà riêng, căn hộ, mặt bằng kinh doanh, văn phòng, phòng trọ tại ${ten} — lọc theo phường/xã, loại hình và giá thuê theo tháng.`;
  }
  if (muc === "duan") {
    return `Danh sách dự án bất động sản tại ${ten}: căn hộ, khu đô thị, nghỉ dưỡng — tiến độ, mặt bằng, giá bán và tiện ích đầy đủ.`;
  }
  return `${dem}Mua bán nhà đất, căn hộ, đất nền, nhà mặt phố tại ${ten} — lọc theo phường/xã, loại hình, mức giá và diện tích.`;
}

// Đếm tin thuộc một tỉnh (địa chỉ tin dạng "Phường, Quận, Tỉnh" → lấy phần cuối)
export function demTinTheoKhuVuc(items: { location: string }[], ten: string): number {
  const t = normalizeVi(ten);
  return items.filter((x) => normalizeVi(x.location.split(",").pop() ?? "") === t).length;
}
