// Dữ liệu mẫu (tạm thời) — sau này thay bằng dữ liệu thật từ Supabase
// Ảnh đặt theo từng phân khúc: villa, căn hộ, nhà phố, đất nền, condotel, đất CN, kho xưởng

import { asset } from "@/lib/asset";
import { chuThuan } from "@/lib/chuThuan";
import { specForType, amenityGroups, interiorItems, furnishLevels } from "@/lib/listingSpec";
import { directionOptions, normalizeVi } from "@/lib/filters";

// Ảnh dùng chung theo phân khúc (placeholder)
const seg = (name: string) => asset(`/images/segments/${name}.jpg`);
// 👉 Ảnh RIÊNG của từng tin / dự án — bỏ ảnh thật vào public/images/tin/ và public/images/du-an/
//    theo đúng tên file (xem public/images/tin/README.md để biết file nào ứng với tin nào).
const tin = (id: number) => asset(`/images/tin/${id}.jpg`);
const duan = (slug: string) => asset(`/images/du-an/${slug}.jpg`);

export type Listing = {
  id: string;
  title: string;
  price: string;
  pricePerM2?: string;
  area: string;
  beds?: number;
  baths?: number;
  location: string;
  type: string;
  image: string;
  // Số ẢNH thật của tin (để badge "📷 n" đúng, không cứng "1"). Không có → coi như 1.
  imageCount?: number;
  // Tin CÓ video không → thẻ hiện nhãn "▶ Video" cạnh số ảnh (kiểu Batdongsan/Homedy).
  hasVideo?: boolean;
  // Vài ảnh ĐẦU của tin — để THẺ TIN tự chạy ảnh, khách lướt qua đã thấy được nhà
  // đó ra sao thay vì chỉ mỗi ảnh bìa. Chỉ lấy ít tấm, không kéo cả bộ 15 ảnh.
  images?: string[];
  badge?: "VIP" | "Nổi bật" | "Mới";
  // Mục đích tin: "ban" = mua bán (mặc định) · "thue" = cho thuê (giá tính theo tháng).
  // Phân tách rõ với "type" (sản phẩm/loại hình) để logic bán/thuê đúng trên mọi trang.
  purpose?: "ban" | "thue" | "mua" | "can-thue";
  // Tên NGƯỜI ĐĂNG THẬT (details.contact.name — khách hàng, kể cả khi admin đăng giùm).
  // Không có → thẻ tin hiện "Coastal Land".
  agentName?: string;
  // Ảnh đại diện người đăng (details.contact.avatar) — hiện trên thẻ tin cấp cao.
  // Không có → avatar chữ cái đầu tên.
  agentAvatar?: string;
  // SLUG dự án tin này thuộc về (details.project) — dùng cho mục
  // "Tin mua bán liên quan tại dự án …". Không thuộc dự án nào → bỏ trống.
  projectSlug?: string;
  // Vị trí admin GHIM tay (toạ độ "16.06,108.22" hoặc link Google Maps).
  // Có thì bản đồ trỏ đúng điểm này; không có thì tự tìm theo địa chỉ.
  mapPin?: string;
  // MÔ TẢ tin — đưa vào vùng dò của ô tìm kiếm (khớp cả nội dung, không chỉ tiêu đề)
  desc?: string;
  // MỌI TRƯỜNG CÒN LẠI đã nhập của tin, gộp thành MỘT chuỗi để ô tìm kiếm dò tới:
  // pháp lý · hướng · nội thất · tiện ích · tiện ích xung quanh · địa chỉ chi tiết ·
  // đặc điểm theo loại hình · dự án · tên người đăng.
  // Dựng ở rowToListing (src/lib/listingsDb.ts) — KHÔNG hiển thị ra giao diện.
  searchText?: string;
  // NGÀY ĐĂNG thật (created_at dạng ISO). Thẻ tin hiện "Hôm nay / 3 ngày trước /
  // 12/08/2026" theo mốc này. Không có → thẻ không hiện thời gian (thà không hiện
  // còn hơn ghi cứng "Hôm nay" cho cả tin đăng ba tháng trước).
  postedAt?: string;
};

// Lọc tin theo mục đích (mặc định không có purpose = "ban")
export function listingsByPurpose(purpose: "ban" | "thue"): Listing[] {
  return featuredListings.filter((l) => (l.purpose ?? "ban") === purpose);
}

// Định dạng vị trí: "Phường/Xã, Quận/Huyện, Tỉnh" — khớp danh mục đơn vị hành chính
// (src/lib/locations.ts) để bộ lọc 3 cấp trả đúng kết quả. Giá tham chiếu mặt bằng 2026.
export const featuredListings: Listing[] = [
];

export type Area = {
  name: string;
  count: string;
  image: string;
  href: string;
};

// Khu vực trọng điểm: DUYÊN HẢI MIỀN TRUNG + TÂY NGUYÊN (8 tỉnh/thành sau sát nhập 2025).
// 5 mục ĐẦU = bộ hiển thị trang chủ (Đà Nẵng lõi + Huế, Khánh Hòa, Quảng Ngãi, Gia Lai);
// các mục sau hiện khi bấm "Xem tất cả".
export const areas: Area[] = [
  { name: "Đà Nẵng", count: "1.240 tin", image: tin(1), href: "/mua-ban?tinh=Đà Nẵng" },
  { name: "Huế", count: "586 tin", image: tin(13), href: "/mua-ban?tinh=Huế" },
  { name: "Quảng Trị", count: "586 tin", image: tin(13), href: "/mua-ban?tinh=Quảng Trị" },
  { name: "Khánh Hòa", count: "212 tin", image: tin(5), href: "/mua-ban?tinh=Khánh Hòa" },
  { name: "Quảng Ngãi", count: "256 tin", image: tin(20), href: "/mua-ban?tinh=Quảng Ngãi" },
  { name: "Gia Lai", count: "298 tin", image: tin(24), href: "/mua-ban?tinh=Gia Lai" },
  { name: "Lâm Đồng", count: "180 tin", image: tin(19), href: "/mua-ban?tinh=Lâm Đồng" },
  { name: "Đắk Lắk", count: "164 tin", image: tin(9), href: "/mua-ban?tinh=Đắk Lắk" },
  { name: "Hồ Chí Minh", count: "138 tin", image: tin(3), href: "/mua-ban?tinh=Hồ Chí Minh" },
  { name: "Hà Nội", count: "180 tin", image: tin(19), href: "/mua-ban?tinh=Hà Nội" },
];

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
  content?: string[];
};

export const articles: Article[] = [
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

// Tỉnh/thành = phần cuối chuỗi địa chỉ ("Hòa Hải, Ngũ Hành Sơn, Đà Nẵng" → "Đà Nẵng").
export function provinceOf(location: string): string {
  return location.split(",").pop()?.trim() ?? "";
}

// Quận/huyện = phần áp cuối ("Hòa Hải, Ngũ Hành Sơn, Đà Nẵng" → "Ngũ Hành Sơn").
export function districtOf(location: string): string {
  const parts = location.split(",").map((s) => s.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : "";
}

// Phân khúc = từ khoá loại hình chuẩn hoá, suy từ chuỗi type (khớp giữa dự án ↔ tin).
// Trả "" nếu không nhận ra (không tính là cùng phân khúc).
const SEGMENT_KEYWORDS = [
  "Căn hộ", "Condotel", "Villa", "Biệt thự", "Shophouse", "Nhà phố",
  "Nhà riêng", "Đất nền", "Đất công nghiệp", "Nhà xưởng", "Kho", "Đất",
];
export function segmentOf(type: string): string {
  return SEGMENT_KEYWORDS.find((k) => type.includes(k)) ?? "";
}

// Chọn N mục "liên quan" theo ĐIỂM relevance (cao → thấp), giữ thứ tự gốc khi bằng điểm,
// luôn trả đủ N nếu pool đủ (điểm 0 vẫn được lấy để lấp). Dùng chung cho BĐS/dự án/tin tức.
export function pickRelated<T>(pool: T[], score: (x: T) => number, n: number): T[] {
  return pool
    .map((x, i) => ({ x, s: score(x), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map((e) => e.x);
}

// Nội dung bài viết — dùng content nếu có, không thì sinh đoạn mẫu chuyên nghiệp
export function articleContent(a: Article): string[] {
  if (a.content?.length) return a.content;
  return [
    `${a.excerpt}`,
    `Theo ghi nhận của Coastal Land, thị trường bất động sản Duyên hải miền Trung tiếp tục cho thấy sự phân hoá rõ rệt giữa các phân khúc. Người mua ngày càng quan tâm đến tính pháp lý minh bạch, vị trí kết nối hạ tầng và tiềm năng khai thác dòng tiền dài hạn.`,
    `Các chuyên gia khuyến nghị nhà đầu tư và người mua ở thực nên kiểm chứng thông tin thực địa, đối chiếu quy hoạch và lựa chọn đơn vị môi giới uy tín để giảm thiểu rủi ro. Coastal Land nỗ lực cung cấp thông tin khách quan và rà soát tin đăng trước khi công bố.`,
    `Để cập nhật phân tích thị trường mới nhất cũng như danh mục bất động sản phù hợp, quý khách có thể theo dõi chuyên mục Tin tức hoặc liên hệ trực tiếp đội ngũ chuyên viên của Coastal Land.`,
  ];
}

// ===== Chi tiết BĐS (suy ra từ dữ liệu cơ bản — nội dung đầy đủ kiểu Homedy) =====

// Lấy BĐS theo id
export function getListingById(id: string): Listing | undefined {
  return featuredListings.find((l) => l.id === id);
}

// Tóm tắt ngắn 2 dòng cho card (kiểu Homedy) — suy từ dữ liệu cơ bản
// Dòng mô tả trên THẺ TIN.
// Ưu tiên MÔ TẢ THẬT người đăng viết — dọn xuống dòng, biểu tượng, khoảng trắng
// thừa cho gọn một dòng. Tin chưa có mô tả mới rơi về câu tóm tắt tự sinh.
// (Trước đây LUÔN dùng câu tự sinh → 500 tin hiện y hệt nhau, khách lướt không
//  thu được thông tin gì.)
export function listingSummary(l: Listing): string {
  // chuThuan() gỡ ::justify::, **đậm**, ảnh/video chèn giữa bài — không gỡ thì
  // mấy ký hiệu soạn thảo đó lòi thẳng ra thẻ tin.
  let that = chuThuan(l.desc)
    .replace(/[•·▪◦#=_~>-]{2,}/g, " ")
    .trim();

  // ⚠️ MÔ TẢ PHẢI LÀ NỘI DUNG, KHÔNG PHẢI CHÉP LẠI TIÊU ĐỀ.
  // Rất nhiều người đăng mở đầu phần mô tả bằng đúng cái tiêu đề vừa gõ, nên thẻ
  // tin hiện hai dòng y hệt nhau — đọc xong không biết thêm được gì. Cắt bỏ đoạn
  // đầu trùng tiêu đề, còn lại mới là nội dung thật.
  const tThat = normalizeVi(that);
  const tTitle = normalizeVi(l.title);
  if (tTitle.length > 10 && tThat.startsWith(tTitle)) {
    that = that.slice(l.title.length).replace(/^[s.,:;–—-]+/, "").trim();
  }

  if (that.length >= 30) return that;

  const place = l.location.split(",").slice(0, 2).map((s) => s.trim()).join(", ");
  const beds = l.beds ? ` • ${l.beds} PN` : "";
  return `${l.type} tại ${place}. Diện tích ${l.area}${beds}.`;
}

// "Hôm nay" · "3 ngày trước" · "12/08/2026" — từ ngày đăng thật.
export function postedText(iso?: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const ngay = Math.floor((Date.now() - t) / 86400000);
  if (ngay <= 0) return "Hôm nay";
  if (ngay === 1) return "Hôm qua";
  if (ngay < 30) return `${ngay} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export type ListingDetail = {
  code: string;
  postedDate: string;
  gallery: string[];
  description: string[];
  features: { label: string; value: string }[];
  specs: { label: string; value: string }[];
  furnish: string;
  interior: string[];
  amenityGroups: { group: string; items: { name: string; active: boolean }[] }[];
  legal: string;
  direction: string;
  agent: { name: string; role: string; phone: string; zalo: string };
  mapQuery: string;
};

const directions = directionOptions;

// Dựng nội dung chi tiết đầy đủ từ một tin (đủ "dung lượng" mô tả, thư viện ảnh, tiện ích, môi giới)
export function buildListingDetail(l: Listing): ListingDetail {
  const idx = parseInt(l.id, 10) || 1;
  // Thư viện 6 ảnh THẬT: ảnh chính + các BĐS cùng loại hình (đồng bộ, chuyên nghiệp)
  const sameType = featuredListings.filter((x) => x.type === l.type && x.id !== l.id).map((x) => x.image);
  const others = featuredListings.filter((x) => x.type !== l.type).map((x) => x.image);
  const gallery = Array.from(new Set([l.image, ...sameType, ...others])).slice(0, 6);

  const dir = directions[idx % directions.length];
  const floors = l.type.includes("Đất") ? "—" : `${2 + (idx % 4)} tầng`;

  const description = [
    `${l.title} toạ lạc tại ${l.location} — một trong những vị trí được săn đón bậc nhất khu vực nhờ kết nối giao thông thuận tiện, gần trục đường chính, trường học, bệnh viện và trung tâm thương mại. Bất động sản phù hợp cho cả nhu cầu ở thực lẫn đầu tư dài hạn.`,
    `Diện tích ${l.area}${l.beds ? `, thiết kế ${l.beds} phòng ngủ và ${l.baths ?? l.beds} phòng vệ sinh` : ""}, bố cục thông minh, tối ưu công năng và đón sáng tự nhiên. Hướng nhà ${dir} thoáng đãng, hợp phong thuỷ với đa số gia chủ. ${floors !== "—" ? `Công trình ${floors}, kết cấu vững chắc, vật liệu hoàn thiện cao cấp.` : "Đất vuông vức, mặt tiền rộng, sẵn sàng xây dựng hoặc tách thửa."}`,
    // ⚠️ Thủ tục công chứng / sang tên là TRÁCH NHIỆM CỦA MÔI GIỚI và hai bên
    // giao dịch — KHÔNG phải của Coastal Land. Vai trò của Coastal Land chỉ là
    // NỖ LỰC XÁC THỰC thông tin (không "cam kết", không đứng ra làm thủ tục).
    `Pháp lý minh bạch, sổ đỏ/sổ hồng chính chủ. Thủ tục công chứng, sang tên do bên môi giới cùng người mua và người bán thực hiện; Coastal Land nỗ lực xác thực thông tin trước khi đăng tin. Mức giá ${l.price}${l.pricePerM2 ? ` (~${l.pricePerM2})` : ""} còn thương lượng cho khách thiện chí.`,
    // ⚠️ Coastal Land là CỔNG THÔNG TIN: không môi giới, không đứng ra giao dịch.
    // Câu kết phải hướng người xem liên hệ NGƯỜI ĐĂNG TIN — không được hàm ý
    // Coastal Land "đồng hành đến khi hoàn tất giao dịch".
    `Liên hệ người đăng tin để được tư vấn chi tiết, xem nhà thực tế và nhận thêm hình ảnh, video, hồ sơ pháp lý đầy đủ. Coastal Land là cổng thông tin bất động sản — mọi trao đổi và giao dịch do bạn thực hiện trực tiếp với người đăng tin.`,
  ];

  const features = [
    { label: "Mức giá", value: l.price },
    { label: "Diện tích", value: l.area },
    ...(l.pricePerM2 ? [{ label: "Giá / m²", value: l.pricePerM2 }] : []),
    ...(l.beds ? [{ label: "Phòng ngủ", value: `${l.beds} PN` }] : []),
    ...(l.baths ? [{ label: "Phòng tắm", value: `${l.baths} WC` }] : []),
    { label: "Hướng nhà", value: dir },
    { label: "Số tầng", value: floors },
    { label: "Loại hình", value: l.type },
  ];

  const furnish = furnishLevels[idx % furnishLevels.length];

  // Thuộc tính theo loại hình — để sẵn đủ trường, suy giá trị hợp lý (chưa có thì "Đang cập nhật")
  const specs = specForType(l.type).fields.map((f) => {
    let value = "Đang cập nhật";
    switch (f.key) {
      case "beds": value = l.beds ? `${l.beds}` : value; break;
      case "baths": value = l.baths ? `${l.baths}` : value; break;
      case "floors": value = floors !== "—" ? floors.replace(" tầng", "") : value; break;
      case "direction": case "balcony": value = dir; break;
      case "furnish": value = furnish; break;
      case "frontage": value = `${4 + (idx % 6)} m`; break;
      case "roadWidth": value = `${5 + (idx % 8)} m`; break;
      case "floor": value = `Tầng ${5 + (idx % 25)}`; break;
      case "block": value = `Block ${["A", "B", "C", "D"][idx % 4]}`; break;
      case "loaiCanho": value = ["Chung cư", "Duplex", "Penthouse", "Studio"][idx % 4]; break;
      case "landType": value = "Đất ở đô thị"; break;
      case "view": value = ["Biển", "Thành phố", "Hồ bơi", "Sông / núi"][idx % 4]; break;
      case "profit": value = "8%/năm"; break;
      case "operator": value = "Đơn vị quốc tế"; break;
      case "pccc": value = "Đã có"; break;
      case "power": value = "560 KVA"; break;
      case "term": value = "Lâu dài"; break;
      case "blocks": value = `Lô ${["A", "B", "C"][idx % 3]}${10 + (idx % 30)}`; break;
    }
    return { label: f.label + (f.unit ? ` (${f.unit})` : ""), value };
  });

  // Nội thất: chọn một tập con theo mức nội thất (mức cao → nhiều món hơn)
  const furnishCount = furnish === "Bàn giao thô" ? 0 : furnish === "Nội thất cơ bản" ? 6 : furnish === "Nội thất đầy đủ" ? 11 : interiorItems.length;
  const interior = interiorItems.slice(0, furnishCount);

  // Tiện ích: đánh dấu mục "có" (active) trên toàn bộ danh mục để hiển thị chuyên nghiệp
  const activeSet = new Set<string>();
  amenityGroups.forEach((g) => g.items.forEach((it, i) => { if ((idx + i) % 3 !== 0) activeSet.add(it); }));
  const grouped = amenityGroups.map((g) => ({
    group: g.group,
    items: g.items.map((name) => ({ name, active: activeSet.has(name) })),
  }));

  // LIÊN HỆ CHUNG — chỉ tên và số CÔNG TY. Tuyệt đối không đưa tên riêng hay số
  // điện thoại cá nhân vào mã nguồn (kho mã này công khai trên GitHub).
  const agents = [
    { name: "Coastal Land", role: "Hỗ trợ khách hàng", phone: "0377 985 036", zalo: "0377985036" },
  ];

  return {
    code: `CVR-${l.id.padStart(5, "0")}`,
    postedDate: "12/06/2026",
    gallery,
    description,
    features,
    specs,
    furnish,
    interior,
    amenityGroups: grouped,
    legal: "Sổ đỏ / Sổ hồng chính chủ",
    direction: dir,
    agent: agents[idx % agents.length],
    // Ưu tiên điểm admin đã ghim (chính xác tuyệt đối), không có mới đoán theo địa chỉ
    mapQuery: l.mapPin?.trim() ? l.mapPin.trim() : `${l.location}, Việt Nam`,
  };
}

export type Project = {
  slug: string;
  name: string;
  location: string;
  priceFrom: string;
  type: string;
  status: string;
  image: string;
  // Nội dung chi tiết riêng từng dự án (sát thực thị trường — số liệu tham khảo)
  developer: string;
  scale: { label: string; value: string }[];
  amenities: string[];
  overview: string[];
  photos?: string[]; // ảnh thật của dự án (cho thư viện ảnh) — nếu có sẽ ưu tiên
  videos?: string[]; // video dự án (tệp mp4 / link YouTube-Vimeo) — hiện ở mục Video
  // ── Dữ liệu cấu trúc mới (admin nhập, cột details) ──
  tier?: "diamond" | "gold" | "silver" | "basic"; // cấp CVR-PJ → thứ tự slide dự án
  contact?: { name?: string; phone?: string; email?: string }; // liên hệ dự án (rỗng = không hiện)
  purposes?: ("ban" | "thue")[];        // Mục đích: Bán / Cho thuê
  priceMode?: "show" | "hidden";        // hiện giá cụ thể / ẩn giá → "Liên hệ"
  priceTable?: { unit: string; area: string; direction: string; price: string }[];
  floorPlans?: { label: string; image: string; note: string }[];
  places?: { category: string; name: string; distance: string }[];
  developerInfo?: { established?: string; website?: string; desc?: string; logo?: string };
  developmentUnit?: string;             // Đơn vị phát triển (khác Chủ đầu tư)
};

// ⚠️ Số liệu dự án mang tính tham khảo cho mẫu giao diện — cần đối chiếu công bố
//    chính thức của chủ đầu tư trước khi dùng cho mục đích giao dịch.
export const projects: Project[] = [
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export type ProjectDetail = {
  gallery: string[];
  overview: string[];
  scale: { label: string; value: string }[];
  amenities: string[];
  developer: string;
  handover: string;
  mapQuery: string;
};

export function buildProjectDetail(p: Project): ProjectDetail {
  // Thư viện ảnh: ưu tiên ảnh THẬT của dự án (photos), sau đó bổ sung từ dự án khác
  const gallery = Array.from(
    new Set([...(p.photos ?? [p.image]), ...projects.filter((x) => x.slug !== p.slug).map((x) => x.image)]),
  ).slice(0, 6);
  const handover = p.scale.find((s) => s.label.includes("Bàn giao"))?.value ?? p.status;

  return {
    gallery,
    overview: p.overview,
    scale: p.scale,
    amenities: p.amenities,
    developer: p.developer,
    handover,
    mapQuery: `${p.location}, Việt Nam`,
  };
}

