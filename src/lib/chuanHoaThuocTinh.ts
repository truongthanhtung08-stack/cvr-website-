// ============================================================================
// CHUẨN HOÁ THUỘC TÍNH TIN ĐĂNG — TIỆN ÍCH · NỘI THẤT · PHÁP LÝ
// ----------------------------------------------------------------------------
// VÌ SAO CÓ FILE NÀY
// Trang chi tiết chỉ hiện tiện ích/nội thất có tên TRÙNG KHỚP danh mục chuẩn
// (listingSpec.ts). Người gom tin viết theo cách nói đời thường — "Bảo vệ 24/7",
// "Máy lạnh", "Hầm xe", "Sổ hồng riêng" — sai một chữ là mục đó BIẾN MẤT im lặng
// khi tin lên web, không báo lỗi gì.
//
// Ở đây làm hai việc, đúng theo yêu cầu "code cả 2 phía cho khớp":
//   1. DỊCH cách viết đời thường → đúng tên trong danh mục chuẩn.
//   2. Mục thật sự không có trong danh mục ("Kiệt ô tô") thì GIỮ NGUYÊN, không
//      vứt đi — trang tin hiện chúng ở nhóm "Tiện ích khác".
// ============================================================================

import { amenityGroups, interiorItems, legalOptions, furnishLevels } from "@/lib/listingSpec";

// Bỏ dấu, bỏ hoa/thường, gộp mọi dấu ngăn thành một khoảng trắng — để so tên
// không phụ thuộc cách gõ ("Bảo vệ 24/7" ≈ "bao ve 24 7").
function khoa(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Dựng bảng tra: tên chuẩn → chính nó (để "Hồ bơi" ghi sao cũng khớp)
function bangTra(danhMuc: string[], dongNghia: Record<string, string>): Map<string, string> {
  const m = new Map<string, string>();
  for (const ten of danhMuc) m.set(khoa(ten), ten);
  for (const [viet, chuan] of Object.entries(dongNghia)) m.set(khoa(viet), chuan);
  return m;
}

const TEN_TIEN_ICH = amenityGroups.flatMap((g) => g.items);

// ── ĐỒNG NGHĨA TIỆN ÍCH ────────────────────────────────────────────────────
// Bên trái: cách người đăng/Cowork hay viết · Bên phải: tên trong danh mục chuẩn.
const DN_TIEN_ICH: Record<string, string> = {
  "Bảo vệ 24/7": "An ninh 24/7",
  "Bảo vệ 24 24": "An ninh 24/7",
  "An ninh 24 24": "An ninh 24/7",
  "Bảo vệ": "An ninh 24/7",
  "An ninh": "An ninh 24/7",
  "Camera": "Camera giám sát",
  "Camera an ninh": "Camera giám sát",
  "Hầm xe": "Hầm / bãi đỗ xe",
  "Bãi xe": "Hầm / bãi đỗ xe",
  "Chỗ để xe": "Hầm / bãi đỗ xe",
  "Bãi đỗ xe": "Hầm / bãi đỗ xe",
  "Gara": "Hầm / bãi đỗ xe",
  "Bể bơi": "Hồ bơi",
  "Gym": "Phòng gym",
  "Phòng tập": "Phòng gym",
  "Cây xanh": "Công viên cây xanh",
  "Công viên nội khu": "Công viên cây xanh",
  "BBQ": "Khu BBQ",
  "Sân chơi": "Sân chơi trẻ em",
  "Khu vui chơi trẻ em": "Sân chơi trẻ em",
  "Siêu thị": "Khu thương mại",
  "Trung tâm thương mại nội khu": "Khu thương mại",
  "Thang may": "Thang máy",
  "Gần chợ": "Gần chợ / siêu thị",
  "Gần siêu thị": "Gần chợ / siêu thị",
  "Gần trường": "Gần trường học",
  "Gần trường đại học": "Gần trường học",
  "Gần sông": "Gần sông / hồ",
  "Gần hồ": "Gần sông / hồ",
  "View sông": "Gần sông / hồ",
  "Gần bãi tắm": "Gần biển",
  "View biển": "Gần biển",
  "Sát biển": "Gần biển",
  "Gần trung tâm thương mại": "Gần TTTM",
  "Gần bệnh viện đa khoa": "Gần bệnh viện",
  "Mặt tiền đường": "Mặt tiền đường lớn",
  "Đường lớn": "Mặt tiền đường lớn",
  "Gần UBND": "Gần khu hành chính",
  "Gần trung tâm hành chính": "Gần khu hành chính",
};

// ── ĐỒNG NGHĨA NỘI THẤT ────────────────────────────────────────────────────
const DN_NOI_THAT: Record<string, string> = {
  "Máy lạnh": "Điều hoà",
  "Máy điều hoà": "Điều hoà",
  "Điều hòa": "Điều hoà",
  "Máy nước nóng": "Bình nóng lạnh",
  "Nóng lạnh": "Bình nóng lạnh",
  "Bình nước nóng": "Bình nóng lạnh",
  "Bếp ga": "Bếp từ / gas",
  "Bếp gas": "Bếp từ / gas",
  "Bếp từ": "Bếp từ / gas",
  "Bếp điện": "Bếp từ / gas",
  "Hút mùi": "Máy hút mùi",
  "Kệ bếp": "Tủ bếp",
  "Giường": "Giường ngủ",
  "Tủ áo": "Tủ quần áo",
  "Salon": "Sofa",
  "Ghế sofa": "Sofa",
  "Bàn ghế ăn": "Bàn ăn",
  "Rèm": "Rèm cửa",
  "TV": "Tivi",
  "Ti vi": "Tivi",
  "Máy sấy": "Máy giặt",
  "Lò nướng": "Lò vi sóng",
  "Bàn học": "Bàn làm việc",
  "Đèn chùm": "Đèn trang trí",
};

// ── ĐỒNG NGHĨA PHÁP LÝ ─────────────────────────────────────────────────────
// Chủ dự án đã chốt: NHÀ = sổ hồng · ĐẤT = sổ đỏ. Danh mục chuẩn gộp làm một mục
// "Sổ đỏ / Sổ hồng chính chủ" nên mọi cách viết sổ riêng đều quy về đó.
const DN_PHAP_LY: Record<string, string> = {
  "Sổ hồng riêng": "Sổ đỏ / Sổ hồng chính chủ",
  "Sổ hồng": "Sổ đỏ / Sổ hồng chính chủ",
  "Sổ hồng lâu dài": "Sổ đỏ / Sổ hồng chính chủ",
  "Sổ đỏ": "Sổ đỏ / Sổ hồng chính chủ",
  "Sổ đỏ riêng": "Sổ đỏ / Sổ hồng chính chủ",
  "Sổ riêng": "Sổ đỏ / Sổ hồng chính chủ",
  "Sổ hồng chính chủ": "Sổ đỏ / Sổ hồng chính chủ",
  "Sổ đỏ chính chủ": "Sổ đỏ / Sổ hồng chính chủ",
  "Chính chủ": "Sổ đỏ / Sổ hồng chính chủ",
  "Đã có sổ": "Sổ đỏ / Sổ hồng chính chủ",
  "Sẵn sổ": "Sổ đỏ / Sổ hồng chính chủ",
  "HĐMB": "Hợp đồng mua bán",
  "Hợp đồng": "Hợp đồng mua bán",
  "Chờ sổ": "Đang chờ sổ",
  "Đang làm sổ": "Đang chờ sổ",
  "Sổ chung": "Sổ chung / vi bằng",
  "Vi bằng": "Sổ chung / vi bằng",
  "Giấy tay": "Sổ chung / vi bằng",
  "Đang cập nhật": "Đang cập nhật",
  "Chưa rõ": "Đang cập nhật",
};

// ── ĐỒNG NGHĨA MỨC NỘI THẤT ────────────────────────────────────────────────
const DN_MUC_NOI_THAT: Record<string, string> = {
  "Cơ bản": "Nội thất cơ bản",
  "Đầy đủ": "Nội thất đầy đủ",
  "Full nội thất": "Nội thất đầy đủ",
  "Full": "Nội thất đầy đủ",
  "Cao cấp": "Nội thất cao cấp",
  "Đầy đủ / Cao cấp": "Nội thất cao cấp",
  "Nội thất xịn": "Nội thất cao cấp",
  "Thô": "Bàn giao thô",
  "Bàn giao thô": "Bàn giao thô",
  "Không nội thất": "Bàn giao thô",
  "Nhà trống": "Bàn giao thô",
};

const TRA_TIEN_ICH = bangTra(TEN_TIEN_ICH, DN_TIEN_ICH);
const TRA_NOI_THAT = bangTra(interiorItems, DN_NOI_THAT);
const TRA_PHAP_LY = bangTra(legalOptions, DN_PHAP_LY);
const TRA_MUC_NOI_THAT = bangTra(furnishLevels, DN_MUC_NOI_THAT);

// Dịch một danh sách sang tên chuẩn; mục không tra được thì GIỮ NGUYÊN chữ gốc.
function dichDanhSach(ds: string[], tra: Map<string, string>): string[] {
  const ra: string[] = [];
  for (const raw of ds) {
    const v = raw.trim();
    if (!v) continue;
    const chuan = tra.get(khoa(v)) ?? v;
    if (!ra.includes(chuan)) ra.push(chuan);
  }
  return ra;
}

export const chuanHoaTienIch = (ds: string[]): string[] => dichDanhSach(ds, TRA_TIEN_ICH);
export const chuanHoaNoiThat = (ds: string[]): string[] => dichDanhSach(ds, TRA_NOI_THAT);

// Một giá trị đơn (ô select) — không tra được thì giữ nguyên để không mất dữ liệu.
export const chuanHoaPhapLy = (v: string): string =>
  v.trim() ? (TRA_PHAP_LY.get(khoa(v)) ?? v.trim()) : "";
export const chuanHoaMucNoiThat = (v: string): string =>
  v.trim() ? (TRA_MUC_NOI_THAT.get(khoa(v)) ?? v.trim()) : "";

// Mục nào KHÔNG nằm trong danh mục chuẩn — trang tin gom vào nhóm "Tiện ích khác",
// form admin hiện thành thẻ riêng để bấm Lưu không làm mất chúng.
export const tienIchNgoaiDanhMuc = (ds: string[]): string[] =>
  ds.filter((a) => !TEN_TIEN_ICH.includes(a));
export const noiThatNgoaiDanhMuc = (ds: string[]): string[] =>
  ds.filter((a) => !interiorItems.includes(a));
