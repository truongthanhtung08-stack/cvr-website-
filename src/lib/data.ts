// Dữ liệu mẫu (tạm thời) — sau này thay bằng dữ liệu thật từ Supabase
// Ảnh đặt theo từng phân khúc: villa, căn hộ, nhà phố, đất nền, condotel, đất CN, kho xưởng

import { asset } from "@/lib/asset";
import { chuThuan } from "@/lib/chuThuan";
import { normalizeVi } from "@/lib/filters";
import { ZALO_OA_ID } from "@/lib/lienHe";

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
  // BA CẤP ĐỊA GIỚI GIỮ RIÊNG (ngoài chuỗi location đã ghép sẵn) — cần cho việc
  // hiện địa chỉ theo CẢ HAI HỆ cũ/mới trên trang chi tiết tin.
  /** Giá và diện tích dạng SỐ — để tính giá mỗi m², mặt bằng giá khu vực.
   *  Chuỗi price/area ở trên đã định dạng sẵn để hiển thị, không tính được. */
  priceVnd?: number | null;
  areaM2?: number | null;
  /** m² SÀN XÂY DỰNG — mẫu số bắt buộc khi tính giá mỗi m² của NHÀ gắn liền đất
   *  (xem mauSoCuaLoaiHinh trong chiSoGia.ts). Thiếu nó thì tin đó KHÔNG được
   *  tính giá mỗi m², chứ không lấy tạm m² đất thay vào. */
  builtAreaM2?: number | null;
  /** m² sàn SUY RA từ nội dung tin khi người đăng không khai — dùng cho thống kê
   *  và đơn giá (hiện kèm dấu ≈), không bao giờ hiện thành "Diện tích xây dựng". */
  builtAreaM2Uoc?: number | null;
  /** Nhóm vị trí suy từ bề rộng đường vào: "lon" | "nho" | "kiet" — để so giá với
   *  đúng hạng đường, vì trong cùng một phường mặt tiền và kiệt lệch 2–3 lần. */
  viTri?: "lon" | "nho" | "kiet";
  /** LOẠI CON người bán chọn (căn hộ: "Loại hình căn hộ" · đất: "Loại đất") — lịch sử giá so theo đúng loại con (29/10/2026). */
  loaiCon?: string;
  /** Cùng chỗ đó gọi theo hệ CŨ — hiện ở dòng dưới, nhãn "Địa chỉ cũ". */
  locationCu?: string;
  // Số nhà + tên đường người đăng cho hiện (details.addressDetail) — dòng địa chỉ hệ mới trên thẻ (20/10/2026)
  diaChiSo?: string;
  /** Gộp cả hai cách gọi — dùng để LỌC/TÌM khu vực, không hiển thị. Thiếu nó thì
   *  tin nhập theo hệ cũ ("Sơn Trà") mất hút khi location đã đổi sang tên mới. */
  diaChiTim?: string;
  diaGioi?: { ward: string; district: string; province: string };
  type: string;
  image: string;
  // Số ẢNH thật của tin (để badge "📷 n" đúng, không cứng "1"). Không có → coi như 1.
  imageCount?: number;
  // Tin CÓ video không → thẻ hiện nhãn "▶ Video" cạnh số ảnh (kiểu Batdongsan/Homedy).
  hasVideo?: boolean;
  /** Số video của tin — nhãn đếm trên thẻ "ảnh · video". */
  soVideo?: number;
  // Vài ảnh ĐẦU của tin — để THẺ TIN tự chạy ảnh, khách lướt qua đã thấy được nhà
  // đó ra sao thay vì chỉ mỗi ảnh bìa. Chỉ lấy ít tấm, không kéo cả bộ 15 ảnh.
  images?: string[];
  badge?: "VIP" | "Nổi bật" | "Mới";
  /** Bản kèm "Nhân đôi hiển thị" của tin CVR Diamond (nhanDoiHienThi.ts) — không phải tin riêng. */
  banSao?: boolean;
  // Mục đích tin: "ban" = mua bán (mặc định) · "thue" = cho thuê (giá tính theo tháng).
  // Phân tách rõ với "type" (sản phẩm/loại hình) để logic bán/thuê đúng trên mọi trang.
  purpose?: "ban" | "thue" | "mua" | "can-thue";
  // Tên NGƯỜI ĐĂNG THẬT (details.contact.name — khách hàng, kể cả khi admin đăng giùm).
  // Không có → thẻ tin hiện "Coastal Land".
  agentName?: string;
  // Ảnh đại diện người đăng (details.contact.avatar) — hiện trên thẻ tin cấp cao.
  // Không có → avatar chữ cái đầu tên.
  agentAvatar?: string;
  /** 3 số đầu SĐT người đăng — nút "Hiện số 090 ***" trên thẻ tin. */
  soDau?: string;
  /** Video đầu tiên của tin (YouTube / tệp) — đứng đầu dải ảnh trên thẻ tin. */
  video?: string;
  // SLUG dự án tin này thuộc về (details.project) — dùng cho mục
  // "Tin mua bán liên quan tại dự án …". Không thuộc dự án nào → bỏ trống.
  projectSlug?: string;
  projectName?: string; // tên dự án khách tự ghi (chưa có trang dự án) — để nối khi trang dự án được tạo
  // Ba trường cho trang pSEO (src/lib/pseo.ts): hướng nhà, tên đường tách từ địa chỉ chi tiết, pháp lý.
  huong?: string;
  duong?: string;
  phapLy?: string;
  noiThat?: string;
  // Mã người đăng = băm một chiều từ SĐT (không lộ số) — để nhận ra MỘT người đăng cùng một BĐS nhiều tin.
  maNguoi?: string;
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
  /** Lần ĐẨY TIN gần nhất (gói UP). Ngày đăng ở trên KHÔNG bị sửa theo nó. */
  bumpedAt?: string;
  /** Hết hạn gói tin (theo tier_expires_at). null = không đặt hạn. */
  hetHanLuc?: string | null;
  /** Hạng tin đã mua: diamond · gold · silver · basic */
  hangTin?: "diamond" | "gold" | "silver" | "basic";
  /** Tin ĐÃ HẾT HẠN — chỉ hiện ở CUỐI danh sách Mua bán/Cho thuê/Tìm kiếm, nhãn "Tin hết hạn". */
  hetHan?: boolean;
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
  // Ngày dạng ISO cho Google (JSON-LD datePublished / dateModified) — date ở trên là dạng hiển thị dd/mm/yyyy
  ngayDangIso?: string;
  ngaySuaIso?: string;
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
  "Căn hộ", "Condotel", "Homestay", "Farmstay", "Khu nghỉ dưỡng", "Villa", "Biệt thự", "Shophouse", "Nhà phố",
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
    that = that.slice(l.title.length).replace(/^[\s.,:;–—-]+/, "").trim();
  }

  if (that.length >= 30) return that;

  const place = l.location.split(",").slice(0, 2).map((s) => s.trim()).join(", ");
  const beds = l.beds ? ` • ${l.beds} PN` : "";
  return `${l.type} tại ${place}. Diện tích ${l.area}${beds}.`;
}

// "Vừa xong" · "25 phút trước" · "3 giờ trước" · "Hôm qua" · "12/08/2026".
//
// PHẢI CÓ MỨC GIỜ/PHÚT thì gói Đẩy tin mới có nghĩa. Trước đây mốc nhỏ nhất là
// "Hôm nay": khách bỏ tiền đẩy tin lên đầu, nhưng người mua nhìn vào vẫn thấy
// "Hôm nay" y hệt mọi tin khác cũng "Hôm nay" — đẩy mấy lần cũng không ai cảm
// nhận được, tức là bán một thứ khách không nhận được. (Đối chiếu homedy.com:
// "Vừa xong" · "2 giờ trước" — xem docs/NGHIEN-CUU-CO-CHE-HIEN-THI.md.)
export function postedText(iso?: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const giay = Math.floor((Date.now() - t) / 1000);
  if (giay < 0) return "Vừa xong";          // lệch giờ máy khách → không nói "âm phút"
  if (giay < 90) return "Vừa xong";
  const phut = Math.floor(giay / 60);
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.floor(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  const ngay = Math.floor(giay / 86400);
  if (ngay === 1) return "Hôm qua";
  if (ngay < 30) return `${ngay} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

// DÒNG THỜI GIAN TRÊN THẺ TIN — nói thật cả hai phía.
//
// Người bán mua gói Đẩy tin để tin nổi lại; người mua cần biết tin rao từ bao
// giờ. Hai nhu cầu đó chỏi nhau, và cách các sàn hay làm là SỬA LUÔN ngày đăng
// (tài liệu cơ chế gọi là "Dynamic Timestamp Refresh") — người mua bị lừa.
//
// Coastal Land tách hẳn hai chữ:
//   · chưa đẩy  → "3 giờ trước"            (ngày đăng thật)
//   · đã đẩy    → "Làm mới 10 phút trước"  (nói rõ là LÀM MỚI, không phải đăng)
// Người bán vẫn nhận đúng thứ đã trả tiền: tin lên đầu và trông tươi. Người mua
// không bị nói dối, và muốn biết ngày đăng gốc thì mở trang tin là thấy.
export function freshText(postedAt?: string, bumpedAt?: string): string {
  if (!bumpedAt) return postedText(postedAt);
  const b = new Date(bumpedAt).getTime();
  const p = postedAt ? new Date(postedAt).getTime() : 0;
  if (Number.isNaN(b)) return postedText(postedAt);
  // Chênh dưới 2 phút = mốc đẩy do migration gán bằng ngày đăng, chưa đẩy thật.
  if (b - p < 120_000) return postedText(postedAt);
  return `Làm mới ${postedText(bumpedAt).replace(/^Vừa xong$/, "vừa xong")}`;
}

export type Project = {
  slug: string;
  name: string;
  /** Địa chỉ HIỂN THỊ — theo hệ MỚI khi suy ra được, giống bên tin đăng. */
  location: string;
  /** Cùng chỗ đó gọi theo hệ CŨ — dòng dưới, nhãn "Địa chỉ cũ". */
  locationCu?: string;
  /** Chỉ phường + tỉnh/thành theo hệ MỚI (không số nhà, đường) — thẻ Dự án nổi bật */
  diaChiMoi?: string;
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
  capNhat?: string;                     // "15/10/2026" — ngày cập nhật thông tin dự án
  nguon?: string;                       // nguồn thông tin dự án (MASTER 3.2: dự án phải có nguồn + ngày)
  dangThe?: boolean;                    // hồ sơ dạng thẻ (nạp hàng loạt cho Tra cứu dự án) — không lên Dự án nổi bật
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

