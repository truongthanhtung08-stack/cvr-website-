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
  tuKhoa?: string;    // chữ người tìm gõ (bộ từ khoá 16/10/2026) — dùng cho tiêu đề trang pSEO; trống = h1
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
    h1: "Bán biệt thự, nhà liền kề", tuKhoa: "Bán biệt thự", title: `Bán biệt thự, nhà liền kề`,
    desc: `Mua bán biệt thự, nhà liền kề — dự án và nhà lẻ, đầy đủ pháp lý.`,
    // Villa = biệt thự (chủ dự án 21/10/2026: "Villa biển gần Hội An" phải ra cả tin loại "Villa / Biệt thự biển")
    types: ["Nhà biệt thự / Liền kề", "Villa / Biệt thự biển"],
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
    h1: "Bán đất nền dự án", tuKhoa: "Bán đất nền", title: `Bán đất nền dự án`,
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
    // chỉ loại riêng (D18, 29/10/2026) — "Villa / Biệt thự biển" đã thuộc trang biệt thự, để ở đây là trùng trang
    types: ["Trang trại / Khu nghỉ dưỡng"],
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
    h1: "Bán kho, nhà xưởng", tuKhoa: "Bán kho xưởng", title: `Bán kho, nhà xưởng, đất công nghiệp`,
    desc: `Mua bán kho bãi, nhà xưởng và đất công nghiệp.`,
    types: ["Kho / Nhà xưởng", "Đất công nghiệp"],
  },
  {
    slug: "bds-khac", label: "Bất động sản khác",
    h1: "Bán bất động sản khác", title: `Bán bất động sản khác`,
    desc: `Các loại bất động sản khác đang bán.`,
    types: ["Bất động sản khác"],
  },
];

// ── CHO THUÊ (khớp menu Header) ────────────────────────────────────────────
export const rentCategories: Category[] = [
  {
    slug: "can-ho-chung-cu", label: "Căn hộ chung cư",
    h1: "Cho thuê căn hộ chung cư", tuKhoa: "Cho thuê căn hộ", title: `Cho thuê căn hộ chung cư`,
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
    h1: "Cho thuê biệt thự, nhà liền kề", tuKhoa: "Cho thuê biệt thự", title: `Cho thuê biệt thự, nhà liền kề`,
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
    h1: "Cho thuê nhà trọ, phòng trọ", tuKhoa: "Cho thuê phòng trọ", title: `Cho thuê phòng trọ, nhà trọ`,
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
    h1: "Cho thuê cửa hàng, ki ốt", tuKhoa: "Cho thuê mặt bằng", title: `Cho thuê mặt bằng, cửa hàng, ki ốt`,
    desc: `Cho thuê mặt bằng bán lẻ, cửa hàng, ki ốt.`,
    types: ["Mặt bằng / Cửa hàng bán lẻ"],
  },
  {
    slug: "kho-nha-xuong", label: "Kho, nhà xưởng, đất",
    h1: "Cho thuê kho, nhà xưởng, đất", tuKhoa: "Cho thuê kho xưởng", title: `Cho thuê kho bãi, nhà xưởng`,
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

// ── NHÓM "NHÀ" CHỈ DÙNG CHO TRANG pSEO (không vào menu) ─────────────────────
// "bán nhà <nơi>" / "cho thuê nhà <nơi>" là nhóm từ khoá đông người gõ nhất (docs/BO-TU-KHOA-PSEO.md),
// gồm mọi loại nhà. Trang /mua-ban/nha/<tỉnh>…; cổng chống trùng tự giữ một trong "nhà" / "nhà riêng".
export const saleNhaPseo: Category = {
  slug: "nha", label: "Nhà", h1: "Bán nhà", title: "Bán nhà", desc: "Mua bán nhà",
  types: ["Nhà riêng", "Nhà mặt phố", "Nhà biệt thự / Liền kề", "Shophouse / Nhà phố thương mại"],
};
export const rentNhaPseo: Category = {
  slug: "nha", label: "Nhà", h1: "Cho thuê nhà", title: "Cho thuê nhà", desc: "Cho thuê nhà",
  types: ["Nhà riêng", "Nhà mặt phố", "Nhà phố thương mại", "Biệt thự / Liền kề"],
};
// Trang NHÓM (chuẩn thống nhất 17/10/2026): gộp loại hình cùng nhóm — bấm nhóm ra mọi tin trong nhóm.
export const saleNghiDuongPseo: Category = {
  slug: "nghi-duong", label: "BĐS nghỉ dưỡng", h1: "Bán bất động sản nghỉ dưỡng", tuKhoa: "Bán bất động sản nghỉ dưỡng",
  title: "Bán bất động sản nghỉ dưỡng", desc: "Mua bán bất động sản nghỉ dưỡng: condotel, villa biển, trang trại, khu nghỉ dưỡng",
  types: ["Villa / Biệt thự biển", "Condotel", "Trang trại / Khu nghỉ dưỡng"],
};
export const rentVanPhongMatBangPseo: Category = {
  slug: "van-phong-mat-bang", label: "Văn phòng, mặt bằng", h1: "Cho thuê văn phòng, mặt bằng", tuKhoa: "Cho thuê văn phòng, mặt bằng",
  title: "Cho thuê văn phòng, mặt bằng", desc: "Cho thuê văn phòng, mặt bằng kinh doanh, cửa hàng, ki ốt",
  types: ["Văn phòng", "Mặt bằng / Cửa hàng bán lẻ"],
};
/** Trang nhóm theo mục đích — thêm nhóm mới: thêm một dòng. */
export const nhomPseo = (muc: "ban" | "thue"): Category[] =>
  muc === "thue" ? [rentNhaPseo, rentVanPhongMatBangPseo] : [saleNhaPseo, saleNghiDuongPseo];

// ── DỰ ÁN (khớp menu Header) — lọc theo trường `type` của dự án ─────────────
export const projectCategories: Category[] = [
  { slug: "can-ho-chung-cu", label: "Căn hộ chung cư", h1: "Dự án căn hộ chung cư", title: `Dự án căn hộ chung cư`, desc: `Danh sách dự án căn hộ chung cư — tiến độ, giá bán, mặt bằng và tiện ích.`, types: ["Căn hộ", "Chung cư"] },
  { slug: "khu-do-thi-moi", label: "Khu đô thị mới", h1: "Dự án khu đô thị mới", title: `Dự án khu đô thị mới`, desc: `Tra cứu dự án khu đô thị mới: vị trí, chủ đầu tư, quy mô, tình trạng, hình ảnh và tin mua bán, cho thuê trong dự án.`, types: ["Khu đô thị"] },
  { slug: "khu-nghi-duong", label: "Khu nghỉ dưỡng, sinh thái", h1: "Dự án khu nghỉ dưỡng, sinh thái", title: `Dự án nghỉ dưỡng, sinh thái`, desc: `Tra cứu dự án khu nghỉ dưỡng, sinh thái: vị trí, chủ đầu tư, quy mô, tình trạng, hình ảnh và tin mua bán, cho thuê trong dự án.`, types: ["Nghỉ dưỡng", "Sinh thái"] },
  { slug: "nha-o-xa-hoi", label: "Nhà ở xã hội", h1: "Dự án nhà ở xã hội", title: `Dự án nhà ở xã hội`, desc: `Tra cứu dự án nhà ở xã hội: vị trí, chủ đầu tư, quy mô, tình trạng, hình ảnh và tin mua bán, cho thuê trong dự án.`, types: ["Nhà ở xã hội"] },
  { slug: "cao-oc-van-phong", label: "Cao ốc văn phòng", h1: "Dự án cao ốc văn phòng", title: `Dự án cao ốc văn phòng`, desc: `Tra cứu dự án cao ốc văn phòng: vị trí, chủ đầu tư, quy mô, tình trạng, hình ảnh và tin mua bán, cho thuê trong dự án.`, types: ["Văn phòng"] },
  { slug: "trung-tam-thuong-mai", label: "Trung tâm thương mại", h1: "Dự án trung tâm thương mại", title: `Dự án trung tâm thương mại`, desc: `Tra cứu dự án trung tâm thương mại: vị trí, chủ đầu tư, quy mô, tình trạng, hình ảnh và tin mua bán, cho thuê trong dự án.`, types: ["Thương mại"] },
  { slug: "biet-thu-lien-ke", label: "Biệt thự, liền kề", h1: "Dự án biệt thự, liền kề", title: `Dự án biệt thự, liền kề`, desc: `Tra cứu dự án biệt thự, liền kề: vị trí, chủ đầu tư, quy mô, tình trạng, hình ảnh và tin mua bán, cho thuê trong dự án.`, types: ["Biệt thự", "Liền kề", "Villa"] },
  // Một dự án có thể có NHIỀU loại hình (chủ dự án 22/10/2026): đất nền, nhà phố, biệt thự/villa, shophouse…
  // → dự án hiện ở mọi nhóm nó có (so "chứa" trên trường type).
  { slug: "dat-nen", label: "Đất nền", h1: "Dự án đất nền", title: `Dự án đất nền`, desc: `Tra cứu dự án đất nền: vị trí, chủ đầu tư, quy mô, tình trạng, hình ảnh và tin mua bán trong dự án.`, types: ["Đất nền", "Đất"] },
  { slug: "nha-pho", label: "Nhà phố", h1: "Dự án nhà phố", title: `Dự án nhà phố`, desc: `Tra cứu dự án nhà phố: vị trí, chủ đầu tư, quy mô, tình trạng, hình ảnh và tin mua bán, cho thuê trong dự án.`, types: ["Nhà phố"] },
  { slug: "shophouse", label: "Shophouse", h1: "Dự án shophouse", title: `Dự án shophouse`, desc: `Tra cứu dự án shophouse: vị trí, chủ đầu tư, quy mô, tình trạng, hình ảnh và tin mua bán, cho thuê trong dự án.`, types: ["Shophouse"] },
];

export function findCategory(list: Category[], slug: string): Category | undefined {
  return list.find((c) => c.slug === slug);
}

// CỔNG INDEX CHO TRANG DANH MỤC GỐC (chủ dự án 20/10/2026: "cái gì không đủ tiêu chí thì không index") — cùng ngưỡng
// với trang pSEO (NGUONG_INDEX = 3, src/lib/pseo.ts). Đếm tin còn hạn đúng mục đích + đúng loại hình của danh mục, bỏ bản kèm.
// Dùng ở metadata trang /mua-ban/<loại>, /cho-thue/<loại> và ở sitemap — hai nơi luôn khớp nhau.
export const NGUONG_INDEX_DANH_MUC = 3;
export function soTinDanhMuc(ds: { type: string; purpose?: string; banSao?: unknown }[], c: Category, muc: "ban" | "thue"): number {
  return ds.filter((l) => !l.banSao && ((l.purpose ?? "ban") === "thue" ? "thue" : "ban") === muc && c.types.includes(l.type)).length;
}

// Dự án thuộc nhóm loại hình — một dự án có nhiều loại hình thì thuộc nhiều nhóm (22/10/2026).
// Dùng chung cho trang /du-an/<nhóm> và sitemap (nhóm chưa có dự án nào: không index, không khai sitemap).
export function duAnThuocNhom<T extends { type?: string | null }>(projects: T[], c: Category): T[] {
  const bo = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
  const keys = c.types.map(bo);
  return projects.filter((p) => { const t = bo(p.type ?? ""); return keys.some((k) => t.includes(k)); });
}
