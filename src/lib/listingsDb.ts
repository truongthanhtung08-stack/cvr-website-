// ============================================================================
// B2 — LỚP ĐỌC TIN TỪ SUPABASE (server-side, dùng trong Server Components)
// Đọc bảng `listings` qua PostgREST + cache Next (revalidate 60s) rồi MAP về
// đúng type `Listing` của FE — mọi component (PropertyCard, FilterBar, sort…)
// giữ nguyên, không phải sửa.
//
// FALLBACK AN TOÀN: bảng chưa tạo / Supabase lỗi / 0 tin → trả dữ liệu mẫu
// src/lib/data.ts như cũ. Web không bao giờ trắng trang vì DB.
// ============================================================================

import type { Listing } from "@/lib/data";
import { chuanHoaTienIch, chuanHoaNoiThat, chuanHoaPhapLy, chuanHoaMucNoiThat } from "@/lib/chuanHoaThuocTinh";
import { linkHopLe } from "@/lib/linkChen";
import { chuanHoaDiaChiCu, dongBoHaiHe, haiDongDiaChi, heCuaTin } from "@/lib/diaChiHaiHe";
import { mauSoCuaLoaiHinh } from "@/lib/chiSoGia";
import { featuredListings, getListingById } from "@/lib/data";
import { asset } from "@/lib/asset";
import { isVideoUrl } from "@/lib/media";
import { fieldsSplit, amenityGroups, coDienTichXayDung, viTriTuDuongVao, viTriTuAccess, laTinThue, laTinBan, dienTichSanThat, chuanLoaiCon, O_LOAI_CON, type Field } from "@/lib/listingSpec";
import { lapCha } from "@/lib/filters";
import { chuanHoaSdt, maNguoiTuSdt, tachNhieuSdt } from "@/lib/phone";
import { tachTenDuong } from "@/lib/tenDuong";
import { chuoiDiaChiBanDo } from "@/lib/diaChiBanDo";
import { moTaThe } from "@/lib/trichMoTa";
import { tachMaTin } from "@/lib/duongDanTin";


// Thuộc tính linh hoạt lưu trong cột details (JSONB) — xem 0006_listing_details.sql
export type ListingDetailsJson = {
  // Hạn tin khi nâng VIP (CLAUDE.md 0.1 ④⑤): hạn kỳ Basic gốc · lúc hạ VIP về Basic
  han_basic?: string;
  ha_vip_luc?: string;
  specs?: Record<string, string>;
  interior?: string[];
  amenities?: string[];
  legal?: string;
  furnish?: string;
  direction?: string;
  addressDetail?: string;
  // LINK CHÈN DƯỚI TIN — quyền lợi CVR Diamond (chỉ hiện khi tin còn hạng Diamond)
  linkChen?: string;
  // ĐỊA CHỈ HỆ CŨ do người nhập chép NGUYÊN từ tin gốc (cột phuong_xa_cu /
  // quan_huyen_cu khi nhập hàng loạt). Có thì dùng thẳng — suy ngược từ hệ mới
  // không bao giờ ra đúng phường cũ vì một phường mới gộp nhiều phường cũ.
  diaChiCu?: { phuong?: string; quan?: string; tinh?: string };
  // ── m² SÀN SUY RA, KHÔNG PHẢI SỐ NGƯỜI ĐĂNG KHAI ─────────────────────────
  // Giá mỗi m² của NHÀ phải chia m² sàn, mà tin cũ phần lớn không khai. Số liệu
  // đó vẫn nằm trong chính nội dung tin ("nhà 3 tầng"), suy ra được nên THỐNG KÊ
  // dùng nó. Nhưng CỐ Ý KHÔNG ghi đè built_area_m2: ô "Diện tích xây dựng" trên
  // trang tin là số NGƯỜI ĐĂNG KHAI, đắp một con số suy ra vào đó là biến ước
  // tính thành lời khẳng định. Đơn giá tính từ nó luôn có dấu ≈.
  dtSanUocTinh?: number;
  dtSanNguon?: string; // cách suy: "100 m² đất × 3 tầng"
  mapPin?: string; // toạ độ / link Google Maps admin ghim tay
  // GIÁ KHÁCH TỰ GHI (đơn vị "Khác — tự ghi", 15/10/2026) — không quy ra số được nên price_vnd
  // để trống (không vào lọc/sắp xếp giá); trang tin hiện NGUYÊN VĂN câu khách ghi.
  giaTuGhi?: string;
  places?: { category: string; name: string; distance: string }[]; // tiện ích xung quanh
  // phones: MỌI số của người đăng (số đầu = số hiển thị). Giữ đủ để sau này
  // ghép tin đăng hộ về đúng tài khoản khách — khách hay có 2 số.
  contact?: { name?: string; phone?: string; phones?: string[]; email?: string; avatar?: string };
  project?: string; // SLUG dự án tin này thuộc về — dùng cho "Tin liên quan tại dự án"
  // TÊN dự án nguyên văn của người đăng. Giữ riêng slug vì dự án có thể CHƯA được
  // tạo trong admin (tin nhập hàng loạt vào trước, chủ dự án cập nhật dự án sau) —
  // không có tên này thì trang tin không hiện được dự án nào cả.
  projectName?: string;
  // Đơn giá thuê theo NGÀN đồng / m² / tháng — nhà xưởng · kho bãi · văn phòng ·
  // mặt bằng. price_vnd vẫn là TỔNG tiền mỗi tháng để bộ lọc giá chạy đúng.
  donGiaThue?: number;
  donGiaThueNhap?: boolean; // true = khách tự ghi đơn giá thuê (không phải web chia từ giá)
  // ĐƠN GIÁ MỖI M² DO CHÍNH NGƯỜI BÁN NIÊM YẾT (đồng/m² sàn với nhà). Người bán
  // nhà thường chỉ báo TỔNG GIÁ nên web không tự chia ra rồi in lên tin; nhưng
  // tin nào người bán CÓ ghi thì đương nhiên phải hiện — đó là con số của họ,
  // không phải mình suy. Chủ dự án chốt 19/09.
  donGiaBan?: number;
};

// Hàng trong bảng `listings` (xem supabase/migrations/0002_listings.sql)
type Row = {
  id: string;
  purpose: "ban" | "thue" | "mua" | "can-thue";
  type: string;
  title: string;
  description: string | null;
  price_vnd: number | null;
  area_m2: number | null;
  built_area_m2: number | null;
  beds: number | null;
  baths: number | null;
  ward: string | null;
  district: string | null;
  province: string;
  images: string[];
  tier: "diamond" | "gold" | "silver" | "basic";
  tier_expires_at: string | null; // hết hạn gói VIP → hạ về tin thường (null = admin nâng tay, vĩnh viễn)
  details: ListingDetailsJson | null;
  created_at: string;     // lúc khách BẤM TẠO tin (kể cả còn là nháp)
  published_at: string | null; // lúc tin ĐƯỢC DUYỆT và lên sóng — đây mới là "ngày đăng"
  // Lần ĐẨY TIN gần nhất (gói UP). CHỈ dùng để xếp thứ tự và để tính "độ tươi"
  // hiển thị. KHÔNG bao giờ ghi đè published_at — người mua luôn đọc được tin
  // này thực sự rao từ bao giờ. Xem 0034_day_tin.sql.
  bumped_at: string | null;
};

// Hạng CVR → huy hiệu FE đang dùng (tierFromBadge trong packages.ts làm chiều ngược lại)
const TIER_BADGE: Record<Row["tier"], Listing["badge"]> = {
  diamond: "VIP",
  gold: "Nổi bật",
  silver: "Mới",
  basic: undefined,
};

// Hạng HIỂN THỊ = hạng đã mua, NHƯNG nếu gói đã hết hạn (tier_expires_at đã qua) thì
// coi như TIN THƯỜNG NGAY — không chờ cron `nhac-xuat` (2 lần/ngày) hạ cột trong DB.
// Cron vẫn ghi DB thật + gửi thông báo gia hạn; đây là lưới an toàn để web KHÔNG BAO
// GIỜ hiện VIP quá hạn (dù trễ tới ~12h giữa hai lần cron).
// tier_expires_at null = admin nâng tay, vĩnh viễn → giữ nguyên hạng.
function tierHieuLuc(r: Row): Row["tier"] {
  if (r.tier === "basic" || !r.tier_expires_at) return r.tier;
  return new Date(r.tier_expires_at).getTime() < Date.now() ? "basic" : r.tier;
}

// Ảnh đại diện khi tin chưa có ảnh (admin đăng nhanh chưa kịp upload)
const PLACEHOLDER_IMAGE = "/images/segments/canho1.jpg";

// ẢNH TẠM THEO LOẠI HÌNH — tin gốc không có ảnh nào (rất hay gặp với tin gom
// hàng loạt) vẫn lên web được, và ảnh minh hoạ ít nhất đúng phân khúc thay vì
// luôn là ảnh căn hộ. Chủ dự án xin được ảnh thật rồi tải lại là ảnh thật thay chỗ.
const ANH_TAM_THEO_LOAI: { khop: RegExp; anh: string }[] = [
  { khop: /đất nền|đất nền dự án|đất thổ|đất ở/i, anh: "/images/segments/datnen1.jpg" },
  { khop: /đất công nghiệp|đất nông nghiệp/i, anh: "/images/segments/datcn1.jpg" },
  { khop: /kho|nhà xưởng|kho bãi/i, anh: "/images/segments/kho1.jpg" },
  { khop: /villa|biệt thự/i, anh: "/images/segments/villa1.jpg" },
  { khop: /condotel/i, anh: "/images/segments/condotel1.jpg" },
  { khop: /nhà mặt phố|shophouse|nhà phố thương mại|mặt bằng|cửa hàng|văn phòng/i, anh: "/images/segments/nhapho1.jpg" },
  { khop: /nhà riêng|nhà trọ|phòng trọ/i, anh: "/images/segments/nhapho2.jpg" },
];

// ẢNH (không video) theo thứ tự hiển thị. Tin admin ĐĂNG HỘ có details.anh_bia = ảnh hợp khung
// 4:3 nhất trong 5 ảnh đầu (chủ dự án 09/10/2026) → đưa lên đầu. Tin khách tự đăng giữ ảnh khách chọn.
function anhTheoThuTu(r: Row): string[] {
  const ds = r.images.filter((s) => !isVideoUrl(s));
  const bia = (r.details as { anh_bia?: string } | null)?.anh_bia;
  return bia && ds.includes(bia) ? [bia, ...ds.filter((s) => s !== bia)] : ds;
}

function anhTam(loaiHinh: string | null): string {
  const t = loaiHinh ?? "";
  return ANH_TAM_THEO_LOAI.find((x) => x.khop.test(t))?.anh ?? PLACEHOLDER_IMAGE;
}

// Số kiểu VN: 7.2 → "7,2" · 1500 → "1.500"
function fmtNum(n: number, maxFrac = 1): string {
  return n.toLocaleString("vi-VN", { maximumFractionDigits: maxFrac });
}

// price_vnd → chuỗi giá FE: bán "33 tỷ"/"850 triệu" · thuê "18 triệu/tháng" · null "Thỏa thuận"
function fmtPrice(v: number | null, purpose: Row["purpose"]): string {
  if (v == null) return "Thỏa thuận";
  // Cả "thue" lẫn "can-thue" đều là giá MỖI THÁNG — xem laTinThue().
  // GHI ĐÚNG SỐ KHÁCH GHI, KHÔNG LÀM TRÒN (chủ dự án 29/10/2026: 1,35 tỷ từng hiện "1,4 tỷ", 2,75 tỷ hiện "2,8 tỷ" — cả thẻ
  // tin, trang tin lẫn tiêu đề Google). Số lẻ tối đa: tỷ 3 chữ số, triệu 2 chữ số; số tròn vẫn hiện gọn ("2,9 tỷ", "23 triệu").
  if (laTinThue(purpose)) return `${fmtNum(v / 1e6, 2)} triệu/tháng`;
  return v >= 1e9 ? `${fmtNum(v / 1e9, 3)} tỷ` : `${fmtNum(v / 1e6, 2)} triệu`;
}

// Gom MỌI TRƯỜNG đã nhập (ngoài tiêu đề/mô tả) thành một chuỗi để ô tìm kiếm dò
// tới: pháp lý, hướng, nội thất, tiện ích, tiện ích xung quanh, địa chỉ chi tiết,
// đặc điểm theo loại hình, dự án, người đăng. Chuỗi này KHÔNG hiện ra giao diện.
function buildSearchText(r: Row): string {
  const d = r.details ?? {};
  return [
    d.legal, d.furnish, d.direction, d.addressDetail, d.project,
    ...Object.values(d.specs ?? {}),
    ...(d.interior ?? []),
    ...(d.amenities ?? []),
    ...(d.places ?? []).map((p) => `${p.category} ${p.name}`),
    d.contact?.name,
  ]
    .filter((s): s is string => Boolean(s && String(s).trim()))
    .join(" ");
}

function rowToListing(r: Row): Listing {
  const price = r.price_vnd == null && r.details?.giaTuGhi?.trim() ? r.details.giaTuGhi.trim().replace(/\s+/g, " ") : fmtPrice(r.price_vnd, r.purpose);
  // ĐƠN GIÁ / M² — MẪU SỐ KHÁC NHAU THEO LOẠI HÌNH, VÀ PHẢI GHI RÕ LÀ M² GÌ.
  //   · CHO THUÊ kho xưởng · kho bãi · văn phòng · mặt bằng → "35.000 đ/m²/tháng"
  //     (thị trường báo giá kiểu này chứ không báo tổng tiền tháng)
  //   · MUA BÁN đất     → "42 tr/m² đất"
  //   · MUA BÁN căn hộ  → "48 tr/m² căn hộ"
  //   · MUA BÁN nhà     → "48 tr/m² sàn"  — chia cho m² SÀN XÂY DỰNG, KHÔNG phải
  //     m² đất. Biệt thự 24 tỷ / 200 m² đất / 500 m² sàn: chia đất ra 120 tr/m²,
  //     gấp 2,5 lần con số thật — người mua đối chiếu mặt bằng giá là thấy sai ngay.
  //     Tin chưa khai diện tích xây dựng thì KHÔNG hiện dòng này, chứ không chia
  //     tạm m² đất cho có.
  const perM2 = ((): string | undefined => {
    if (r.price_vnd == null) return undefined;
    // CHO THUÊ (chủ dự án 20/10/2026: "cho thuê, BĐS khác … để nguyên, chỉ chia để biết số liệu"): KHÔNG hiện đơn giá web
    // tự chia. Chỉ hiện khi KHÁCH tự ghi đơn giá thuê (cờ donGiaThueNhap — nạp hàng loạt có cột don_gia_thue).
    // 23/10/2026 chủ dự án: đơn giá/m² MẶC ĐỊNH mọi cấp — khách ghi thì lấy của khách; không ghi thì web chia khi số CHẮC CHẮN:
    // thuê căn hộ (÷ m² căn) · văn phòng, mặt bằng, kho xưởng (÷ m² thuê). Thuê nhà nguyên căn: m² không chắc → không ghi.
    // ⛔ CHO THUÊ (chủ dự án 23/10/2026): web KHÔNG tự chia đơn giá /m²/tháng. CHỈ hiện khi KHÁCH tự ghi đơn giá thuê
    // (cờ donGiaThueNhap) — và hiện cùng hàng giá · diện tích. (Lịch sử giá thuê vẫn tính mỗi m² riêng trong chiSoGia.)
    if (!laTinBan(r.purpose)) return r.details?.donGiaThueNhap && r.details?.donGiaThue ? `${fmtNum(r.details.donGiaThue * 1000, 0)} đ/m²/tháng` : undefined;
    const mau = mauSoCuaLoaiHinh(r.type);
    // ⛔ NHÀ GẮN LIỀN ĐẤT: KHÔNG HIỆN ĐƠN GIÁ MỖI M² TRÊN TIN — chủ dự án chốt
    // 19/09. Người bán nhà báo TỔNG GIÁ của cả căn (đất + nhà), không ai niêm yết
    // giá mỗi m² sàn. Mình tự chia ra rồi in lên tin là đặt vào miệng người bán
    // một con số họ chưa từng nói — mà con số đó lại phụ thuộc m² sàn, thứ phần
    // lớn tin cũ chỉ suy ra được chứ không khai.
    // Số ước tính mỗi m² sàn VẪN được tính, nhưng chỉ dùng trong khối Lịch sử giá
    // để so với mặt bằng thị trường — đúng chỗ của một ước lượng.
    // Đất và căn hộ thì ngược lại: thị trường vốn niêm yết theo m², nên vẫn hiện.
    if (mau === "san") {
      // …TRỪ KHI chính người bán niêm yết đơn giá. Lúc đó đây là con số của họ,
      // không phải mình suy ra — đương nhiên phải hiện.
      const khai = r.details?.donGiaBan;
      // 20/10/2026 chủ dự án nhắc lại: "loại nào nghi ngờ thì lấy nguyên giá và diện tích khách nhập, chỉ chia để lấy số liệu"
      // → nhà KHÔNG hiện giá/m² sàn tự chia (giữ luật 19/09); số chia chỉ dùng cho Lịch sử giá.
      if (khai) return `${fmtNum(khai / 1e6, 0)} tr/m² sàn`;
      // Khách GHI THẲNG tổng m² sàn (ô Diện tích xây dựng, không phải số web suy / đất × số tầng — dienTichSanThat) → giá ÷ m² sàn
      // đúng luật CLAUDE.md 0.1 (chủ dự án 23/10/2026: "cái này đã fix"). m² sàn không chắc → không ghi.
      const san = dienTichSanThat(r.built_area_m2, r.area_m2);
      return san ? `${fmtNum(r.price_vnd / san / 1e6, 0)} tr/m² sàn` : undefined;
    }
    const dt = r.area_m2;
    if (!dt) return undefined;
    return `${fmtNum(r.price_vnd / dt / 1e6, 0)} tr/${mau === "can" ? "m² căn hộ" : "m² đất"}`;
  })();
  return {
    id: r.id,
    title: r.title,
    price,
    ...(perM2 ? { pricePerM2: perM2 } : {}),
    area: r.area_m2 != null ? `${fmtNum(r.area_m2, 0)} m²` : "—",
    priceVnd: r.price_vnd ?? null,
    // HIỆU LỰC · HẾT HẠN CỦA TIN (chủ dự án 23/10/2026: "ngày tháng hiệu lực, hết hạn sai bét"). Gốc lỗi: nâng VIP đặt lại
    // published_at = ngày nâng và tier_expires_at = hết VIP, trong khi tin vẫn chạy kỳ Basic tới details.han_basic
    // (luật 15/10: VIP song song kỳ Basic). Trang tin đọc hai mốc này → hiện "Hiệu lực = ngày nâng · Hết hạn = hết VIP".
    // Ở đây trả đúng hạn CỦA TIN (CLAUDE.md 0.1 ③④⑤): hết hạn = muộn hơn giữa hạn VIP và hạn Basic; hiệu lực = postedAt
    // bên dưới (ngày lên web gốc). Không đổi dữ liệu, không đổi luật.
    hetHanLuc: ((a?: string | null, b?: string | null) => (a && b ? (Date.parse(b) > Date.parse(a) ? b : a) : (a ?? b ?? null)))(
      r.tier_expires_at, typeof r.details?.han_basic === "string" ? r.details.han_basic : null),
    hangTin: tierHieuLuc(r),
    areaM2: r.area_m2 ?? null,
    builtAreaM2: r.built_area_m2 ?? null,
    builtAreaM2Uoc: r.details?.dtSanUocTinh ?? null,
    ...((): { viTri?: "lon" | "nho" | "kiet" } => {
      // Bề rộng đường vào là số đo khách quan và đã có ở nhiều tin; ô "Vị trí lối
      // vào" gần như không ai điền nên chỉ dùng làm nguồn dự phòng.
      const v = viTriTuDuongVao(r.details?.specs?.roadWidth) ?? viTriTuAccess(r.details?.specs?.access);
      return v ? { viTri: v } : {};
    })(),
    ...((r.details?.specs?.loaiCanho || r.details?.specs?.landType) ? { loaiCon: chuanLoaiCon(r.details?.specs?.loaiCanho || r.details?.specs?.landType) } : {}),
    ...(r.beds != null ? { beds: r.beds } : {}),
    ...(r.baths != null ? { baths: r.baths } : {}),
    // ĐỊA CHỈ HIỂN THỊ THEO HỆ MỚI — áp cho MỌI tin, kể cả tin đã đăng từ trước.
    // Người đăng nhập theo hệ nào cũng được, người xem luôn thấy tên đang dùng hiện
    // nay; cách gọi cũ nằm ở dòng "Địa chỉ hệ cũ" ngay dưới. Suy không ra tới cấp
    // phường thì giữ nguyên chuỗi khách đã nhập, không hiện địa chỉ nửa vời.
    ...((): { location: string; locationCu?: string; diaChiTim?: string; diaChiSo?: string } => {
      const goc = [r.ward, r.district, r.province].filter(Boolean).join(", ");
      if (!r.province) return { location: goc };
      const hai = haiDongDiaChi(heCuaTin(r.district), {
        tinh: r.province,
        quan: r.district ?? "",
        phuong: r.ward ?? "",
      });
      const moi = hai.moi || goc;
      // ĐỊA CHỈ CŨ NHẬP TAY ĐI TRƯỚC — chép nguyên từ tin gốc nên luôn đúng.
      // Nhưng chỉ khi họ ghi TỚI CẤP PHƯỜNG/QUẬN: có mỗi tên tỉnh thì đó chưa phải
      // địa chỉ, lúc đó dùng bộ ba web suy ngược để dòng hệ cũ đủ 3 cấp.
      // ⚠️ Trước đây chỗ này viết `dcCu?.tinh ?? hai.cuTinh` nên chuỗi nhập tay
      // LUÔN có ít nhất tên tỉnh → nhánh dự phòng `|| hai.cu` không bao giờ chạy,
      // và 100/134 tin chỉ hiện đúng một chữ "Địa chỉ hệ cũ: Đà Nẵng".
      const dcCu = r.details?.diaChiCu;
      const tay = {
        phuong: (dcCu?.phuong ?? "").trim(),
        quan: (dcCu?.quan ?? "").trim(),
        tinh: (dcCu?.tinh ?? "").trim(),
      };
      // Lấy trọn một bộ, không trộn hai nguồn: quận của người nhập ghép với phường
      // máy suy ra rất dễ thành cặp không thuộc về nhau.
      // Nhập tay → đưa về TÊN CHUẨN 3 cấp của hệ thống (chuanHoaDiaChiCu, 20/10/2026): Cowork chép từ tin gốc nên lệch
      // ("Thành phố Huế" / "Huế" / thiếu chữ cấp). Dò không ra mới giữ nguyên chữ người nhập.
      const hm = dongBoHaiHe(heCuaTin(r.district), { tinh: r.province, quan: r.district ?? "", phuong: r.ward ?? "" }).moi;
      const cuTho =
        tay.phuong || tay.quan
          ? chuanHoaDiaChiCu(hm.tinh, hm.phuong, tay) || [tay.phuong, tay.quan, tay.tinh || hai.cuTinh].filter(Boolean).join(", ")
          : hai.cu;
      const cu = cuTho && cuTho !== moi ? cuTho : "";
      return {
        location: moi,
        ...(cu ? { locationCu: cu } : {}),
        // Số nhà + tên đường KHÁCH CHO HIỆN (ô "Địa chỉ chi tiết") — dòng địa chỉ trên thẻ ghép trước hệ mới (20/10/2026)
        ...(r.details?.addressDetail?.trim() ? { diaChiSo: r.details.addressDetail.trim() } : {}),
        // Lọc/tìm khu vực dò trên chuỗi này để tin không mất hút khi đổi cách gọi.
        // Địa chỉ cũ chỉ tới cấp quận ("Nha Trang, Khánh Hòa") → để trống ô phường, bộ lọc so đúng cấp (coDonVi) — 31/10/2026
        diaChiTim: [moi, cu && cu.split(",").length === 2 ? `, ${cu}` : cu, goc].filter(Boolean).join(" · "),
      };
    })(),
    diaGioi: { ward: r.ward ?? "", district: r.district ?? "", province: r.province ?? "" },
    type: r.type,
    // Ảnh đại diện = ẢNH đầu tiên (bỏ qua video nếu đứng trước)
    image: asset(anhTheoThuTu(r)[0] ?? anhTam(r.type)),
    // Số ẢNH thật (không tính video) → badge "📷 n" đúng thay vì cứng "1"
    imageCount: r.images.filter((s) => !isVideoUrl(s)).length,
    // Có ít nhất 1 video → thẻ hiện nhãn "▶ Video"
    hasVideo: r.images.some((s) => isVideoUrl(s)),
    soVideo: r.images.filter((s) => isVideoUrl(s)).length,
    // Video đầu tiên — thẻ tin cho video đứng đầu dải ảnh (chủ dự án 09/10/2026)
    ...((): { video?: string } => { const v = r.images.find((s) => isVideoUrl(s)); return v ? { video: asset(v) } : {}; })(),
    // 6 ảnh đầu cho thẻ tin (Diamond: ảnh chính + 5 ảnh phụ — docs/THE-TIN-THEO-CAP.md)
    images: anhTheoThuTu(r).slice(0, 6).map((s) => asset(s)), // Diamond cần 6 ảnh trên thẻ (chuẩn thẻ tin 09/10/2026)
    badge: TIER_BADGE[tierHieuLuc(r)],
    // NGÀY ĐĂNG = lúc tin lên sóng, KHÔNG phải lúc khách bấm tạo. Tin soạn nháp
    // từ tuần trước mà hôm nay mới duyệt thì ngoài trang vẫn phải ghi "Hôm nay":
    // trước đây lấy created_at nên tin vừa lên sóng đã hiện "8 ngày trước" và bị
    // xếp tụt sau tin khác. Tin cũ không có mốc lên sóng thì lùi về created_at.
    // Ngày tin LÊN WEB gốc — cả web dùng (Hiệu lực, "Đăng … trước", xếp mới nhất, sitemap). Tin đã nâng VIP (có han_basic,
    // hoặc ha_vip_luc khi đã hạ về Basic): published_at bị đặt lại = ngày nâng → lấy ngày đăng tin (created_at).
    postedAt: typeof r.details?.han_basic === "string" || typeof r.details?.ha_vip_luc === "string"
      ? ngayLenWebTinNang(r)
      : (r.published_at ?? r.created_at),
    ...(r.bumped_at ? { bumpedAt: r.bumped_at } : {}),
    purpose: r.purpose,
    // Tên người đăng thật (khách hàng) — thẻ tin hiện đúng tên này, không phải admin
    agentName: r.details?.contact?.name || undefined,
    // 3 số đầu của số người đăng — nút "Hiện số 090 ***" như Batdongsan (đủ số chỉ hiện khi bấm)
    ...((): { soDau?: string } => { const d = (r.details?.contact?.phone ?? "").replace(/\D/g, "").replace(/^84/, "0"); // Số che 3 SỐ CUỐI như trang tin (chủ dự án 22/10/2026): "0905 318" → thẻ hiện "0905 318 ***"
      return d.length >= 9 ? { soDau: `${d.slice(0, 4)} ${d.slice(4, d.length - 3)}` } : {}; })(),
    ...(r.details?.contact?.avatar ? { agentAvatar: asset(r.details.contact.avatar) } : {}),
    ...(r.details?.project ? { projectSlug: r.details.project } : {}),
    ...(r.details?.projectName?.trim() ? { projectName: r.details.projectName.trim() } : {}),
    ...(r.details?.mapPin ? { mapPin: r.details.mapPin } : {}),
    ...(r.details?.direction?.trim() ? { huong: r.details.direction.trim() } : {}),
    ...((): { duong?: string } => { const d = tachTenDuong(r.details?.addressDetail); return d ? { duong: d } : {}; })(),
    ...(r.details?.legal?.trim() ? { phapLy: r.details.legal.trim() } : {}),
    ...(r.details?.furnish?.trim() ? { noiThat: r.details.furnish.trim() } : {}),

    ...((): { maNguoi?: string } => { const so = chuanHoaSdt(tachNhieuSdt(r.details?.contact?.phone ?? "")[0] ?? ""); return so ? { maNguoi: maNguoiTuSdt(so) } : {}; })(),
    ...(r.description ? { desc: r.description } : {}),
    // Mọi trường còn lại → vùng dò của ô tìm kiếm (không hiển thị ra giao diện)
    ...((): { searchText?: string } => {
      const st = buildSearchText(r);
      return st ? { searchText: st } : {};
    })(),
  };
}

// Cột cho thẻ tin & danh sách — GỒM CẢ details để thẻ hiện đúng TÊN NGƯỜI ĐĂNG THẬT
// (details.contact.name — cột details đã có trên production từ migration 0006).
const COLS =
  "id,purpose,type,title,description,price_vnd,area_m2,built_area_m2,beds,baths,ward,district,province,images,tier,tier_expires_at,created_at,published_at,bumped_at,details";
const COLS_DETAIL = COLS;

// Gọi PostgREST trực tiếp bằng fetch để dùng cache Next (revalidate) —
// KHÔNG dùng client cookies ở đây vì tin đã duyệt là dữ liệu công khai.
// NGÀY LÊN WEB của tin đã nâng VIP — MỘT chỗ cho cả web (chủ dự án 23/10/2026: "sửa cả hệ thống" · "giá, tiền, hạn: 1 nguồn duy
// nhất"): published_at bị đặt lại = ngày nâng, ngày tạo tin có thể sớm hơn ngày duyệt → Hiệu lực = HẾT HẠN của tin (muộn hơn giữa
// hạn VIP và hạn Basic) − SỐ NGÀY HIỂN THỊ của chương trình trong ADMIN (billing free.hienThi). Chưa đọc được admin → ngày tạo tin.
let SO_NGAY_CT: number | undefined;
async function napSoNgayCt(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  try {
    const res = await fetch(`${url}/rest/v1/site_content?select=data&key=eq.billing&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { tags: ["noi-dung"], revalidate: 3600 },
    });
    const ds = res.ok ? ((await res.json()) as { data?: { free?: { hienThi?: number } } }[]) : [];
    const n = ds[0]?.data?.free?.hienThi;
    if (typeof n === "number" && n > 0) SO_NGAY_CT = n;
  } catch { /* giữ số cũ */ }
}
function ngayLenWebTinNang(r: Row): string {
  // Mốc lên web cũ ghi lúc nâng VIP (ListingForm, 31/10/2026) — có thì dùng thẳng, không suy ra
  const ghi = (r.details as { len_web_luc?: string } | null)?.len_web_luc;
  if (typeof ghi === "string") return ghi;
  const het = [r.tier_expires_at, typeof r.details?.han_basic === "string" ? r.details.han_basic : null]
    .filter((x): x is string => !!x).sort((a, b) => Date.parse(a) - Date.parse(b)).pop();
  const suyRa = het && SO_NGAY_CT ? new Date(Date.parse(het) - SO_NGAY_CT * 86_400_000).toISOString() : r.created_at;
  // Suy theo số ngày chương trình miễn phí chỉ đúng với tin miễn phí; tin khách trả gói khác ngày → ra ngày TRƯỚC cả lúc khách
  // tạo tin (9A5DA44A: tạo 31/10, hiện 11/10). Không bao giờ sớm hơn created_at.
  return Date.parse(suyRa) < Date.parse(r.created_at) ? r.created_at : suyRa;
}

async function rest(query: string): Promise<Row[] | null> {
  if (SO_NGAY_CT === undefined) await napSoNgayCt();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null; // chưa cấu hình env (worktree/CI) → fallback
  try {
    const res = await fetch(`${url}/rest/v1/listings?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      // CACHE THEO THẺ "listings" (thay cho no-store cũ) — đây là đòn bẩy tốc độ:
      //   · Khi admin DUYỆT tin, route /api/tin-dang/duyet gọi revalidateTag("listings")
      //     → xoá cache NGAY → tin lên sóng tức thì (giữ đúng quy tắc "hiện NGAY").
      //   · Giữa hai lần duyệt, Google & khách nhận HTML đã dựng sẵn phục vụ từ edge
      //     (không đọc DB mỗi request như no-store) → Core Web Vitals / thứ hạng tốt hơn.
      //   · Thay đổi ngoài luồng duyệt (admin ẩn/sửa tin ghi thẳng Supabase) do cron
      //     /api/tin-dang/het-han mỗi phút bắt qua updated_at. revalidate 1 giờ chỉ là lưới
      //     an toàn cuối (15/10/2026: 60s làm trang dựng lại liên tục → tốn ISR Writes).
      next: { tags: ["listings"], revalidate: 3600 },
    });
    if (!res.ok) return null; // bảng chưa tạo (404) / lỗi khác → fallback
    return (await res.json()) as Row[];
  } catch {
    return null;
  }
}

// Tin MẪU seed từ lúc dev có id dạng SỐ ('1'..'33') — tin thật của khách là UUID.
// WEB PHẢI THẬT (18/7): loại tin mẫu khỏi mọi trang, kể cả khi chưa xoá trong DB
// (migration 0008 xoá hẳn; lớp lọc này đảm bảo ngay cả khi chưa chạy SQL).
const isSeedRow = (r: Row) => /^\d+$/.test(r.id);
// CÒN HẠN HIỂN THỊ (luật chốt 01/10/2026: hết hạn là NGỪNG hiển thị, không hạ về tin
// thường). Cron /api/tin-dang/het-han mỗi giờ mới đổi status → 'expired'; lớp lọc này
// bảo đảm từ đúng giây hết hạn tin đã rời mọi danh sách, không chờ cron.
// tier_expires_at null = tin không có hạn (admin nâng tay) → vẫn hiện.
const conHan = (r: Row) => !r.tier_expires_at || new Date(r.tier_expires_at).getTime() > Date.now();
// ĐÃ TỚI NGÀY HIỂN THỊ — tin hẹn ngày đăng (chuẩn Batdongsan) duyệt xong có published_at ở
// tương lai: "Chờ hiển thị", chưa lên danh sách cho tới đúng giờ đó.
const daToiNgay = (r: Row) => !r.published_at || new Date(r.published_at).getTime() <= Date.now();
// Tin THẬT của khách luôn có id dạng UUID; tin DEMO seed (0002) có id SỐ ('1'..'33').
// Dùng để chặn cả trang chi tiết /bat-dong-san/<số> mở ra tin demo.
const isSeedId = (id: string) => /^\d+$/.test(id);

// Toàn bộ tin ĐÃ DUYỆT (mới nhất trước — FE tự xếp hạng VIP bằng sortListings)
// TIN THẬT 100%: DB trả 0 tin thật → hiện trống thật (KHÔNG độn dữ liệu mẫu).
// Chỉ fallback mẫu khi Supabase LỖI/chưa cấu hình (rows=null) để web không trắng trang.
export async function getListings(): Promise<Listing[]> {
  const rows = await rest(`select=${COLS}&status=eq.approved&order=bumped_at.desc.nullslast,published_at.desc.nullslast,created_at.desc&limit=500`);
  if (!rows) return featuredListings; // lỗi kết nối/chưa cấu hình → fallback mẫu
  // THỨ TỰ TRONG CÙNG HẠNG (chủ dự án 23/10/2026): xét MỐC GẦN NHẤT giữa ngày đăng và lần đẩy — cùng ngày đăng thì tin
  // được đẩy lên trước; tin đẩy từ lâu không đứng mãi trên tin mới đăng. Hạng do sortListings / chonTinTrangChu xếp sau
  // (sắp ổn định nên giữ thứ tự này trong từng hạng). Ngày đăng hiển thị vẫn giữ nguyên ("Làm mới …" là chữ riêng).
  const moc = (r: Row) => Math.max(Date.parse(r.bumped_at ?? "") || 0, Date.parse(r.published_at ?? r.created_at) || 0);
  return rows.filter((r) => !isSeedRow(r) && conHan(r) && daToiNgay(r)).sort((a, b) => moc(b) - moc(a)).map(rowToListing);
}

// TIN ĐÃ HẾT HẠN — chủ dự án chốt 03/10/2026: tin hết hạn VẪN HIỆN trên web, xếp SAU
// toàn bộ tin còn hạn ở Mua bán / Cho thuê / Tìm kiếm, gắn nhãn "Tin hết hạn" (thẻ mờ).
// Gồm cả tin cron chưa kịp đổi status (approved nhưng đã quá giờ). Trang chủ, sitemap,
// gợi ý KHÔNG dùng hàm này — ở đó chỉ có tin còn hạn.
// NHÌN XA: tin hết hạn dồn lên hàng nghìn → chỉ lấy tin hết hạn trong 90 NGÀY gần nhất,
// tối đa 300 tin, mới hết hạn trước — trang danh sách không phình theo năm tháng.
export async function getListingsHetHan(): Promise<Listing[]> {
  // LÀM TRÒN THEO NGÀY (17/10/2026): mốc tính tới từng mili giây làm mỗi lần gọi là một địa chỉ MỚI → bộ nhớ đệm không
  // bao giờ trúng, trang kết quả dựng lần đầu phải chờ Supabase 1,5–2,5 giây (và tốn thêm lượt gọi). Tròn ngày → cả ngày
  // dùng chung một bản đệm; lệch tối đa 1 ngày ở mép 90 ngày là không đáng kể.
  const tu = new Date(Math.floor((Date.now() - 90 * 86_400_000) / 86_400_000) * 86_400_000).toISOString();
  const rows = await rest(`select=${COLS}&status=in.(approved,expired)&tier_expires_at=gte.${tu}&order=tier_expires_at.desc.nullslast&limit=300`);
  if (!rows) return [];
  return rows
    .filter((r) => !isSeedRow(r) && !conHan(r))
    .map((r) => ({ ...rowToListing(r), hetHan: true }));
}

// TIN DÙNG ĐỂ XÉT TRANG pSEO ĐỦ TIN (mở trang, index, sitemap, liên kết nội bộ, trang giá) — chủ dự án 29/10/2026: "tính hết tin
// hết hạn, tất cả tin trên web; tin hết hạn đã có cơ chế hết hạn, không ảnh hưởng cách Google chấm điểm". Chỉ để ĐẾM / XÉT
// cổng — danh sách hiển thị vẫn tách tin còn hạn (getListings) và tin hết hạn (getListingsHetHan, mục riêng trên trang).
export async function getTinXetTrang(): Promise<Listing[]> {
  const [con, het] = await Promise.all([getListings().catch(() => []), getListingsHetHan().catch(() => [])]);
  return [...con, ...het];
}

// ── BẢN NHẸ CHO TRANG CHỈ HIỆN THẺ TIN (trang chủ) ──────────────────────────
//
// VÌ SAO CÓ: mọi thứ hàm trên trả về đều bị Next gói vào HTML gửi xuống máy khách.
// Đo trang chủ ngày 11/09/2026: HTML 638 KB, trong đó 556 KB là dữ liệu tin —
// mà màn hình chỉ hiện 16 thẻ. Nặng nhất là hai thứ THẺ TIN KHÔNG HỀ DÙNG:
//   · desc       — mô tả đầy đủ, trung bình 580 ký tự/tin, cái dài nhất 2.666
//   · searchText — vùng chữ gộp nội thất/tiện ích/đặc điểm để ô tìm dò
// Hai trường đó chỉ cần ở trang CÓ Ô TÌM VÀ BỘ LỌC (/mua-ban, /cho-thue,
// /tim-kiem) — những trang đó vẫn gọi getListings() đầy đủ như cũ.
//
// ⚠️ ĐỪNG dùng hàm này cho trang có tìm kiếm/lọc: thiếu desc + searchText thì
// gõ "gần biển", "nội thất đầy đủ" sẽ không ra tin.
export async function getListingsThe(): Promise<Listing[]> {
  const ds = await getListings();
  return ds.map((l) => {
    // 20/10/2026 (trang chủ 603 KB > ngưỡng 450): bỏ thêm các trường thẻ KHÔNG dùng (đã rà TheTinMobile, PropertyCard,
    // FeaturedListings, tinNoiBat) — vùng dò tìm, địa giới, mã người, số thô, hạn tin.
    const {
      desc: _desc, searchText: _searchText, diaChiTim: _dct, diaGioi: _dg, maNguoi: _mn, hetHanLuc: _hh,
      builtAreaM2Uoc: _bu, hangTin: _ht, duong: _du,  priceVnd: _pv, areaM2: _am, builtAreaM2: _ba, loaiCon: _lc,
      ...the
    } = l;
    // 20/10/2026: thẻ hiện 2 câu đầu mô tả (src/lib/trichMoTa.ts) → chỉ gửi đúng 2 câu đó (~150–250 ký tự), không gửi cả mô tả
    const ngan = moTaThe(l);
    return ngan ? { ...the, desc: ngan } : the;
  });
}

// Đường dẫn trang tin (src/lib/duongDanTin.ts) → mã tin đầy đủ. Mã ngắn 8 ký tự tra theo khoảng mã
// (mã tin là UUID); trùng hai tin (gần như không xảy ra) → không đoán, trả null.
export async function idTuDuongDan(doan: string): Promise<string | null> {
  const t = tachMaTin(doan);
  if (!t) return null;
  if ("id" in t) return t.id;
  const rows = await rest(`select=id&id=gte.${t.ma}-0000-0000-0000-000000000000&id=lte.${t.ma}-ffff-ffff-ffff-ffffffffffff&limit=2`);
  return rows?.length === 1 ? rows[0].id : null;
}

// Một tin theo id (trang chi tiết) — fallback tìm trong dữ liệu mẫu
export async function getListing(id: string): Promise<Listing | null> {
  if (isSeedId(id)) return null; // tin demo (id số) → coi như không tồn tại
  const rows = await rest(`select=${COLS}&id=eq.${encodeURIComponent(id)}&limit=1`);
  if (!rows || rows.length === 0) return getListingById(id) ?? null;
  return rowToListing(rows[0]);
}

// Nhiều tin theo DANH SÁCH id — dùng cho "Tin đã lưu" và "So sánh".
// Chạy được CẢ ở trình duyệt (chỉ dùng fetch + khoá NEXT_PUBLIC_*), vì 2 mục này
// đọc id từ localStorage nên phải tra tin phía client.
// Giữ đúng THỨ TỰ id truyền vào; tin đã gỡ/chưa duyệt thì tự rơi khỏi danh sách.
export async function getListingsByIds(ids: string[]): Promise<Listing[]> {
  const wanted = ids.filter((id) => id && !isSeedId(id));
  if (wanted.length === 0) return [];
  const inList = wanted.map(encodeURIComponent).join(",");
  const rows = await rest(`select=${COLS}&status=eq.approved&id=in.(${inList})&limit=${wanted.length}`);
  if (!rows) return [];
  const byId = new Map(rows.filter((r) => conHan(r) && daToiNgay(r)).map((r) => [r.id, rowToListing(r)]));
  return wanted.map((id) => byId.get(id)).filter((x): x is Listing => Boolean(x));
}

// ── CHI TIẾT ĐẦY ĐỦ cho trang /bat-dong-san/[id] — DỮ LIỆU THẬT ─────────────
// Trả đúng những gì Admin đã nhập: TẤT CẢ ảnh, mô tả, đặc điểm, nội thất, tiện
// ích, pháp lý, người đăng. Phần trống → null/[] để trang ghi "Chưa cập nhật"
// (KHÔNG bịa như buildListingDetail cũ).
export type ListingSpecRow = { label: string; value: string };
export type ListingFull = {
  listing: Listing;            // giá/diện tích/vị trí/hạng… (thẻ dùng chung)
  images: string[];            // toàn bộ ảnh thật (đúng số lượng)
  videos: string[];            // video (tệp mp4 tải lên / link YouTube-Vimeo)
  builtArea: string | null;    // diện tích xây dựng
  descriptionParas: string[];  // mô tả (tách theo dòng)
  specsChinh: ListingSpecRow[]; // THÔNG TIN CHÍNH của loại hình (bỏ mục trống)
  // TIỀN VÀ THANH TOÁN của tin thuê (chủ dự án 21/10/2026: tiền cọc nằm ở "Đặc điểm" là sai) → hàng giá, đầu trang:
  // tienDau ngay sau giá thuê (đặt cọc, kỳ thanh toán) · tienSau cuối hàng (điện, nước, phí dịch vụ)
  tienDau: ListingSpecRow[];
  tienSau: ListingSpecRow[];
  specs: ListingSpecRow[];     // đặc điểm còn lại đã nhập (bỏ mục trống)
  interior: string[];          // nội thất có sẵn
  amenityGroups: { group: string; items: { name: string; active: boolean }[] }[];
  legal: string | null;
  furnish: string | null;
  direction: string | null;
  addressDetail: string | null;
  linkChen: string | null;       // link chèn dưới tin (CVR Diamond)
  // TÊN dự án (nếu tin thuộc dự án) + slug để bấm sang trang dự án khi dự án đó
  // đã được tạo. Chưa tạo thì vẫn hiện tên, chỉ không bấm được.
  projectName: string | null;
  projectSlug: string | null;
  contact: { name: string; phone: string; email: string; avatar: string | null } | null;
  mapQuery: string;            // chuỗi địa chỉ (hoặc toạ độ) để ghim bản đồ
  mapZoom: number;             // mức phóng: 17 khi ghim đúng nhà/đường · 15 khi chỉ có phường
  places: { category: string; name: string; distance: string }[]; // tiện ích quanh BĐS
};

// Tách mô tả thành mảng DÒNG cho RichContent (chế độ WYSIWYG): GIỮ nguyên xuống dòng
// + dòng trống người đăng gõ (dòng trống = NGẮT ĐOẠN), chỉ cắt dòng trống thừa đầu/cuối.
// TRƯỚC ĐÂY .filter(Boolean) BỎ hết dòng trống → mất ngắt đoạn, mô tả dính "đều đều".
function dongMoTa(text: string | null): string[] {
  const lines = (text ?? "").replace(/\r\n/g, "\n").split("\n").map((s) => s.trim());
  while (lines.length && lines[0] === "") lines.shift();
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

// HIỂN THỊ ĐÚNG CHUẨN dù khách gõ lộn xộn (chủ dự án 10/10/2026): bỏ khoảng trắng thừa,
// dòng trống thừa; giữ chỗ xuống dòng có nội dung. Dữ liệu gốc không đổi — chỉ trang tin gọn.
function gon(v: string | null | undefined): string {
  return (v ?? "").replace(/\r/g, "").split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

function rowToDetail(r: Row): ListingFull {
  const d = r.details ?? {};
  // Tách ẢNH và VIDEO: thư viện ảnh chỉ nhận ảnh; video hiện ở mục Video riêng.
  // Video tệp tải lên cũng đi qua /anh/… như ảnh (xem src/lib/asset.ts); link
  // YouTube/Vimeo thì asset() giữ nguyên.
  const videos = r.images.filter(isVideoUrl).map(asset);
  const imageOnly = anhTheoThuTu(r);
  const imgs = imageOnly.length ? imageOnly : [anhTam(r.type)];
  // Bộ mục theo LOẠI HÌNH, tách sẵn THÔNG TIN CHÍNH và ĐẶC ĐIỂM. Tin cho thuê
  // có thêm phần điện/nước/thời gian vào ở. Mục nào người đăng để trống thì lọc
  // bỏ luôn — trang tin không bao giờ hiện ô rỗng.
  const doc = (fs: Field[]) =>
    fs
      // Nhãn gọn, đơn vị ghép vào số ("Mặt tiền (chiều ngang): 4,16 m") — trước ghi kiểu ô nhập liệu "Mặt tiền (chiều ngang) (m): 4,16" (20/10/2026)
      .map((f) => {
        // Loại con hiện theo TÊN CHUẨN (chuanLoaiCon — cùng danh sách form khách, admin, nạp hàng loạt; 29/10/2026)
        const v = O_LOAI_CON.includes(f.key) ? chuanLoaiCon(gon(d.specs?.[f.key])) : gon(d.specs?.[f.key]);
        // Trang tin ghi nhãn gọn "Mặt tiền", "Chiều dài" (chủ dự án 21/10/2026); form đăng tin giữ chú thích trong ngoặc
        return { label: f.label.replace(/\s*\((chiều ngang|chiều sâu)\)$/, ""), value: v && f.unit && /^[\d.,\s]+$/.test(v) ? `${v} ${f.unit}` : v };
      })
      // Loại con lặp tên cha thì bỏ (lapCha, 30/10/2026)
      .filter((s, i) => s.value && !(O_LOAI_CON.includes(fs[i].key) && lapCha(s.value, r.type, r.purpose)));
  const { chinh, dacDiem } = fieldsSplit(r.type, r.purpose);
  // Tin thuê: mục TIỀN lên hàng giá, mục điều kiện thuê (vào ở, thời hạn) lên thông tin chính — "Đặc điểm" chỉ còn
  // đặc điểm của bất động sản. Chỉ đổi chỗ hiện trên trang tin; form đăng tin giữ nguyên (fieldsSplit dùng chung).
  const TIEN_DAU = ["deposit", "billingCycle"], TIEN_SAU = ["elecPrice", "waterPrice", "phiDichVu"], DIEU_KIEN = ["moveIn", "minTerm"];
  const tatCa = [...chinh, ...dacDiem];
  const theoKhoa = (ks: string[]) => ks.map((k) => tatCa.find((f) => f.key === k)).filter((f): f is Field => Boolean(f));
  // THỐNG NHẤT ĐƠN VỊ TIỀN (chủ dự án 29/10/2026, ảnh Sun Ponte: giá thuê "15 triệu/tháng" mà cọc "15.000.000 đ") → số tiền từ
  // 1 triệu trở lên trong ô tiền đổi về triệu / tỷ như giá; số nhỏ (điện, nước theo kWh, m³) giữ nguyên.
  const dvt = (v: string) =>
    v.replace(/(\d{1,3}(?:\.\d{3})+|\d{7,})\s*(?:đồng|vnđ|vnd|đ)(?![\p{L}])/giu, (m, so: string) => {
      const n = Number(so.split(".").join(""));
      if (!(n >= 1_000_000)) return m;
      return n >= 1e9
        ? `${(n / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 3 })} tỷ`
        : `${(n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} triệu`;
    });
  const tienDau = doc(theoKhoa(TIEN_DAU))
    // Theo tháng là mặc định của giá thuê — chỉ nói khi tin báo theo quý / năm
    .filter((s) => s.value !== "Theo tháng")
    .map((s) => ({
      label: s.label === "Tiền cọc" ? "Tiền đặt cọc" : s.label === "Kỳ báo giá" ? "Kỳ thanh toán" : s.label,
      // Tiền đặt cọc ghi số trơn ("7") = triệu đồng, cùng đơn vị giá thuê
      value: s.label === "Tiền cọc" && /^\d+(,\d+)?$/.test(s.value) ? `${s.value} triệu` : dvt(s.value),
    }));
  const tienSau = doc(theoKhoa(TIEN_SAU)).map((s) => ({ ...s, value: dvt(s.value) }));
  const boRa = new Set([...TIEN_DAU, ...TIEN_SAU, ...DIEU_KIEN]);
  const specsChinh = doc([...chinh.filter((f) => !boRa.has(f.key)), ...theoKhoa(DIEU_KIEN)]);
  const specs = doc(dacDiem.filter((f) => !boRa.has(f.key)));
  // Mục khách tự ghi trùng nghĩa mục chuẩn ("Máy lạnh", "hồ bơi ") → đúng tên chuẩn, đúng nhóm.
  const dsTienIch = chuanHoaTienIch((d.amenities ?? []).map(gon));
  const amenSet = new Set(dsTienIch);
  // Tiện ích người đăng ghi mà danh mục chuẩn không có ("Kiệt ô tô", "Gần KCN"…).
  // Trước đây những mục này BIẾN MẤT im lặng vì trang tin chỉ duyệt danh mục chuẩn.
  const tenChuan = new Set(amenityGroups.flatMap((g) => g.items));
  const tienIchKhac = dsTienIch.filter((a) => a && !tenChuan.has(a));
  const c = d.contact;
  return {
    listing: rowToListing(r),
    images: imgs.map(asset),
    videos,
    // Tin cũ ghi tổng sàn ở ô "Diện tích sử dụng" đã gộp (15/10/2026) → vẫn hiện, chỉ với loại NHÀ
    // (văn phòng, kho xưởng dùng chính khoá usableArea làm ô chính riêng của chúng).
    builtArea: r.built_area_m2 != null ? `${fmtNum(r.built_area_m2, 0)} m²`
      : coDienTichXayDung(r.type) && d.specs?.usableArea ? `${String(d.specs.usableArea).trim()} m²` : null,
    descriptionParas: dongMoTa(r.description),
    specsChinh,
    tienDau,
    tienSau,
    specs,
    interior: chuanHoaNoiThat((d.interior ?? []).map(gon)),
    amenityGroups: [
      ...amenityGroups.map((g) => ({
        group: g.group,
        items: g.items.map((name) => ({ name, active: amenSet.has(name) })),
      })),
      ...(tienIchKhac.length
        ? [{ group: "Tiện ích khác", items: tienIchKhac.map((name) => ({ name, active: true })) }]
        : []),
    ],
    projectName: d.projectName ?? null,
    projectSlug: d.project ?? null,
    legal: chuanHoaPhapLy(gon(d.legal), r.type) || null,
    furnish: chuanHoaMucNoiThat(gon(d.furnish)) || null,
    direction: gon(d.direction) || null,
    addressDetail: d.addressDetail || null,
    linkChen: linkHopLe(d.linkChen),
    // SỐ ĐIỆN THOẠI ra web luôn đi qua chuanHoaSdt() — dữ liệu cũ nhập lẫn dấu
    // chấm / khoảng trắng / +84 vẫn hiện đúng chuẩn 0 + 10 số, khớp với file gốc.
    contact: c && (c.name || c.phone) ? { name: c.name ?? "", phone: chuanHoaSdt(c.phone ?? ""), email: c.email ?? "", avatar: c.avatar ? asset(c.avatar) : null } : null,
    // GHIM BẢN ĐỒ — thứ tự ưu tiên, càng lên trên càng chính xác:
    //   1) điểm admin GHIM tay (details.mapPin: toạ độ / link Maps) → đúng tuyệt đối
    //   2) ĐỊA CHỈ CHI TIẾT (số nhà, tên đường) + Phường/Quận/Tỉnh → ghim đúng con đường
    //   3) chỉ Phường/Quận/Tỉnh → ghim giữa khu vực
    // Trước đây bỏ sót bước 2: tin ghi rõ "123 Nguyễn Văn Linh" vẫn chỉ ghim giữa
    // phường, khách không biết bất động sản nằm ở đoạn đường nào.
    places: d.places ?? [],
    mapQuery: d.mapPin?.trim() || chuoiDiaChiBanDo(d.addressDetail, r.ward, r.district, r.province),
    // Có toạ độ ghim / có tên đường → phóng gần (17) thấy rõ vị trí;
    // chỉ có phường/xã → giữ 15 nhìn bao quát khu vực.
    mapZoom: d.mapPin?.trim() || d.addressDetail?.trim() ? 17 : 15,
  };
}

// XEM TRƯỚC TIN (form đăng tin, 15/10/2026): dựng đúng như trang tin bằng CHÍNH hàm của trang tin,
// từ dữ liệu khách đang nhập (chưa lưu) — xem trước thế nào thì đăng lên thế ấy.
export function xemTruocTin(r: Omit<Row, "id" | "tier_expires_at" | "created_at" | "published_at" | "bumped_at">): ListingFull {
  return rowToDetail({ ...r, id: "xem-truoc", tier_expires_at: null, created_at: new Date().toISOString(), published_at: null, bumped_at: null });
}

// Fallback khi DB chưa sẵn (worktree/CI) — dựng chi tiết tối giản từ dữ liệu mẫu.
function mockToDetail(m: Listing): ListingFull {
  return {
    listing: m,
    images: [m.image],
    videos: [],
    builtArea: null,
    descriptionParas: [],
    specsChinh: [],
    tienDau: [],
    tienSau: [],
    specs: [],
    interior: [],
    amenityGroups: amenityGroups.map((g) => ({ group: g.group, items: g.items.map((name) => ({ name, active: false })) })),
    legal: null, furnish: null, direction: null, addressDetail: null, linkChen: null, contact: null,
    projectName: null, projectSlug: null,
    places: [],
    mapQuery: m.location, mapZoom: 15,
  };
}

// Tin đã HẾT HẠN chưa ('expired', 0041)? Trang tin dùng để hiện thông báo hết
// hạn, ẩn số điện thoại và báo Google bỏ tin khỏi kết quả — link cũ vẫn mở được.
export async function tinDaHetHan(id: string): Promise<boolean> {
  if (isSeedId(id)) return false;
  const rows = (await rest(`select=status,tier_expires_at&id=eq.${encodeURIComponent(id)}&limit=1`)) as unknown as
    { status?: string; tier_expires_at?: string | null }[] | null;
  const r = rows?.[0];
  if (!r) return false;
  // Qua giờ hết hạn là hết hạn ngay — không chờ cron đổi status.
  return r.status === "expired" || (r.status === "approved" && !!r.tier_expires_at && new Date(r.tier_expires_at).getTime() <= Date.now());
}

export async function getListingDetail(id: string): Promise<ListingFull | null> {
  if (isSeedId(id)) return null; // tin demo (id số) → trang chi tiết trả 404
  const q = `&id=eq.${encodeURIComponent(id)}&limit=1`;
  // Ưu tiên query CÓ details; nếu lỗi (cột details chưa tạo) → query cơ bản,
  // tin vẫn hiển thị (đặc điểm để trống) thay vì 404.
  let rows = await rest(`select=${COLS_DETAIL}${q}`);
  if (!rows) rows = await rest(`select=${COLS}${q}`);
  if (!rows) {
    const m = getListingById(id); // DB hoàn toàn không sẵn → dữ liệu mẫu
    return m ? mockToDetail(m) : null;
  }
  if (rows.length === 0) return null;
  return rowToDetail(rows[0]);
}

