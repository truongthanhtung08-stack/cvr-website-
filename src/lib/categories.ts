// ═══════════════════════════════════════════════════════════════════════════
// DANH MỤC LOẠI HÌNH THEO ĐƯỜNG DẪN RIÊNG (/mua-ban/can-ho-chung-cu …)
// ---------------------------------------------------------------------------
// Đây là NGUỒN DUY NHẤT cho:
//   · các mục trong menu Header (Mua bán · Cho thuê · Dự án)
//   · các trang danh mục thật /mua-ban/[loai], /cho-thue/[loai], /du-an/[loai]
//   · sitemap.xml
//
// Vì sao phải có: trước đây menu trỏ tới ~29 đường dẫn loại hình nhưng KHÔNG có
// trang nào nhận → /mua-ban/can-ho-chung-cu và /cho-thue/* trả 404, còn
// /du-an/* rơi vào trang chi tiết dự án và hiện "Không tìm thấy dự án" (soft 404).
// Đây đúng là nhóm từ khoá đáng giá nhất của một sàn BĐS
// ("căn hộ chung cư Đà Nẵng", "nhà riêng cho thuê Huế"…) nên phải là trang thật.
//
// `types` khớp đúng tên loại hình trong filters.ts (saleTypeGroups /
// rentTypeGroups) để trang danh mục lọc được bằng bộ lọc sẵn có.
// ═══════════════════════════════════════════════════════════════════════════

export type Category = {
  slug: string;
  label: string;      // nhãn trong menu
  h1: string;         // tiêu đề H1 trên trang danh mục
  title: string;      // thẻ <title> cho Google
  desc: string;       // thẻ description
  types: string[];    // các loại hình trong filters.ts thuộc danh mục này
};


// ── MUA BÁN (khớp menu Header) ─────────────────────────────────────────────
export const saleCategories: Category[] = [
  {
    slug: "can-ho-chung-cu", label: "Căn hộ chung cư",
    h1: "Bán căn hộ chung cư", title: `Bán căn hộ chung cư`,
    desc: `Mua bán căn hộ chung cư — giá thật, hình thật, lọc theo khu vực, diện tích và mức giá.`,
    types: ["Căn hộ", "Chung cư"],
  },
  {
    slug: "nha-rieng", label: "Nhà riêng",
    h1: "Bán nhà riêng", title: `Bán nhà riêng`,
    desc: `Mua bán nhà riêng, nhà trong hẻm — cập nhật liên tục, lọc theo quận/huyện và mức giá.`,
    types: ["Nhà riêng"],
  },
  {
    slug: "biet-thu-lien-ke", label: "Nhà biệt thự, liền kề",
    h1: "Bán biệt thự, nhà liền kề", title: `Bán biệt thự, nhà liền kề`,
    desc: `Mua bán biệt thự, nhà liền kề — dự án và nhà lẻ, đầy đủ pháp lý.`,
    types: ["Nhà biệt thự / Liền kề"],
  },
  {
    slug: "nha-mat-pho", label: "Nhà mặt phố",
    h1: "Bán nhà mặt phố", title: `Bán nhà mặt phố`,
    desc: `Mua bán nhà mặt phố, nhà mặt tiền kinh doanh.`,
    types: ["Nhà mặt phố"],
  },
  {
    slug: "shophouse", label: "Shophouse, nhà phố thương mại",
    h1: "Bán shophouse, nhà phố thương mại", title: `Bán shophouse, nhà phố thương mại`,
    desc: `Mua bán shophouse, nhà phố thương mại — vị trí kinh doanh, dòng tiền cho thuê.`,
    types: ["Shophouse / Nhà phố thương mại"],
  },
  {
    slug: "dat-nen-du-an", label: "Đất nền dự án",
    h1: "Bán đất nền dự án", title: `Bán đất nền dự án`,
    desc: `Mua bán đất nền dự án — pháp lý rõ ràng, giá theo từng phân khu.`,
    types: ["Đất nền / Đất nền dự án"],
  },
  {
    slug: "dat", label: "Đất",
    h1: "Bán đất", title: `Bán đất thổ cư, đất nông nghiệp`,
    desc: `Mua bán đất thổ cư, đất nông nghiệp — lọc theo diện tích và mức giá.`,
    types: ["Đất nông nghiệp", "Đất nền / Đất nền dự án"],
  },
  {
    slug: "trang-trai-nghi-duong", label: "Trang trại, khu nghỉ dưỡng",
    h1: "Bán trang trại, khu nghỉ dưỡng", title: `Bán trang trại, khu nghỉ dưỡng`,
    desc: `Mua bán trang trại, villa và bất động sản nghỉ dưỡng ven biển.`,
    types: ["Villa / Biệt thự biển"],
  },
  {
    slug: "condotel", label: "Condotel",
    h1: "Bán condotel", title: `Bán condotel`,
    // ⚠️ KHÔNG viết "cam kết lợi nhuận" — Coastal Land là cổng thông tin, không
    // hứa lợi nhuận thay chủ đầu tư. Mức lợi nhuận (nếu có) do NGƯỜI ĐĂNG khai
    // trong trường "Cam kết lợi nhuận" của tin, không phải Coastal Land cam kết.
    desc: `Mua bán condotel, căn hộ khách sạn — vị trí ven biển, thông tin pháp lý rõ ràng.`,
    types: ["Condotel"],
  },
  {
    slug: "kho-nha-xuong", label: "Kho, nhà xưởng",
    h1: "Bán kho, nhà xưởng", title: `Bán kho, nhà xưởng, đất công nghiệp`,
    desc: `Mua bán kho bãi, nhà xưởng và đất công nghiệp.`,
    types: ["Kho / Nhà xưởng", "Đất công nghiệp"],
  },
  {
    slug: "bds-khac", label: "Bất động sản khác",
    h1: "Bán bất động sản khác", title: `Bán bất động sản khác`,
    desc: `Các loại bất động sản khác đang rao bán.`,
    types: ["Bất động sản khác"],
  },
];

// ── CHO THUÊ (khớp menu Header) ────────────────────────────────────────────
export const rentCategories: Category[] = [
  {
    slug: "can-ho-chung-cu", label: "Căn hộ chung cư",
    h1: "Cho thuê căn hộ chung cư", title: `Cho thuê căn hộ chung cư`,
    desc: `Cho thuê căn hộ chung cư — giá thuê theo tháng, đầy đủ nội thất, lọc theo khu vực.`,
    types: ["Căn hộ", "Chung cư", "Căn hộ dịch vụ"],
  },
  {
    slug: "nha-rieng", label: "Nhà riêng",
    h1: "Cho thuê nhà riêng", title: `Cho thuê nhà riêng`,
    desc: `Cho thuê nhà riêng nguyên căn — cập nhật liên tục.`,
    types: ["Nhà riêng"],
  },
  {
    slug: "biet-thu-lien-ke", label: "Nhà biệt thự, liền kề",
    h1: "Cho thuê biệt thự, nhà liền kề", title: `Cho thuê biệt thự, nhà liền kề`,
    desc: `Cho thuê biệt thự, nhà liền kề — ở dài hạn và lưu trú.`,
    types: ["Biệt thự / Liền kề"],
  },
  {
    slug: "nha-mat-pho", label: "Nhà mặt phố",
    h1: "Cho thuê nhà mặt phố", title: `Cho thuê nhà mặt phố`,
    desc: `Cho thuê nhà mặt phố, mặt tiền kinh doanh.`,
    types: ["Nhà mặt phố"],
  },
  {
    slug: "shophouse", label: "Shophouse, nhà phố thương mại",
    h1: "Cho thuê shophouse, nhà phố thương mại", title: `Cho thuê shophouse, nhà phố thương mại`,
    desc: `Cho thuê shophouse, nhà phố thương mại.`,
    types: ["Nhà phố thương mại"],
  },
  {
    slug: "phong-tro", label: "Nhà trọ, phòng trọ",
    h1: "Cho thuê nhà trọ, phòng trọ", title: `Cho thuê phòng trọ, nhà trọ`,
    desc: `Cho thuê phòng trọ, nhà trọ giá rẻ — gần trường học, khu công nghiệp.`,
    types: ["Nhà trọ / Phòng trọ"],
  },
  {
    slug: "van-phong", label: "Văn phòng",
    h1: "Cho thuê văn phòng", title: `Cho thuê văn phòng`,
    desc: `Cho thuê văn phòng, toà nhà văn phòng — giá theo m²/tháng.`,
    types: ["Văn phòng"],
  },
  {
    slug: "cua-hang-ki-ot", label: "Cửa hàng, ki ốt",
    h1: "Cho thuê cửa hàng, ki ốt", title: `Cho thuê mặt bằng, cửa hàng, ki ốt`,
    desc: `Cho thuê mặt bằng bán lẻ, cửa hàng, ki ốt.`,
    types: ["Mặt bằng / Cửa hàng bán lẻ"],
  },
  {
    slug: "kho-nha-xuong", label: "Kho, nhà xưởng, đất",
    h1: "Cho thuê kho, nhà xưởng, đất", title: `Cho thuê kho bãi, nhà xưởng`,
    desc: `Cho thuê kho bãi, nhà xưởng và đất.`,
    types: ["Thuê đất / Nhà xưởng / Kho bãi"],
  },
  {
    slug: "bds-khac", label: "Bất động sản khác",
    h1: "Cho thuê bất động sản khác", title: `Cho thuê bất động sản khác`,
    desc: `Các loại bất động sản khác đang cho thuê.`,
    types: ["Bất động sản khác"],
  },
];

// ── DỰ ÁN (khớp menu Header) — lọc theo trường `type` của dự án ─────────────
export const projectCategories: Category[] = [
  { slug: "can-ho-chung-cu", label: "Căn hộ chung cư", h1: "Dự án căn hộ chung cư", title: `Dự án căn hộ chung cư`, desc: `Danh sách dự án căn hộ chung cư — tiến độ, giá bán, mặt bằng và tiện ích.`, types: ["Căn hộ", "Chung cư"] },
  { slug: "khu-do-thi-moi", label: "Khu đô thị mới", h1: "Dự án khu đô thị mới", title: `Dự án khu đô thị mới`, desc: `Danh sách dự án khu đô thị mới.`, types: ["Khu đô thị"] },
  { slug: "khu-nghi-duong", label: "Khu nghỉ dưỡng, sinh thái", h1: "Dự án khu nghỉ dưỡng, sinh thái", title: `Dự án nghỉ dưỡng, sinh thái`, desc: `Danh sách dự án nghỉ dưỡng, sinh thái ven biển.`, types: ["Nghỉ dưỡng", "Sinh thái"] },
  { slug: "nha-o-xa-hoi", label: "Nhà ở xã hội", h1: "Dự án nhà ở xã hội", title: `Dự án nhà ở xã hội`, desc: `Danh sách dự án nhà ở xã hội — điều kiện mua và tiến độ.`, types: ["Nhà ở xã hội"] },
  { slug: "cao-oc-van-phong", label: "Cao ốc văn phòng", h1: "Dự án cao ốc văn phòng", title: `Dự án cao ốc văn phòng`, desc: `Danh sách dự án cao ốc văn phòng.`, types: ["Văn phòng"] },
  { slug: "trung-tam-thuong-mai", label: "Trung tâm thương mại", h1: "Dự án trung tâm thương mại", title: `Dự án trung tâm thương mại`, desc: `Danh sách dự án trung tâm thương mại.`, types: ["Thương mại"] },
  { slug: "biet-thu-lien-ke", label: "Biệt thự, liền kề", h1: "Dự án biệt thự, liền kề", title: `Dự án biệt thự, liền kề`, desc: `Danh sách dự án biệt thự, nhà liền kề.`, types: ["Biệt thự", "Liền kề"] },
  { slug: "shophouse", label: "Shophouse", h1: "Dự án shophouse", title: `Dự án shophouse`, desc: `Danh sách dự án shophouse, nhà phố thương mại.`, types: ["Shophouse"] },
];

export function findCategory(list: Category[], slug: string): Category | undefined {
  return list.find((c) => c.slug === slug);
}
