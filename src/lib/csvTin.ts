// ============================================================================
// NHẬP TIN HÀNG LOẠT TỪ FILE CSV (Excel → Save as CSV UTF-8)
// ----------------------------------------------------------------------------
// Đọc file → tách dòng → kiểm tra từng dòng → trả về đúng payload của bảng
// `listings` (giống hệt form "Đăng tin mới", để tin nhập hàng loạt hiển thị y
// như tin đăng tay). Mọi kiểm tra làm ở đây, trang admin chỉ hiển thị kết quả.
// ============================================================================

import { saleTypeGroups, rentTypeGroups } from "@/lib/filters";
// Dùng CHUNG hàm tạo slug với form dự án trong admin → tên dự án trong file Excel
// và slug dự án thật luôn khớp nhau, không bao giờ lệch quy tắc.
import { slugify } from "@/lib/contentAdmin";

export type ListingTierId = "diamond" | "gold" | "silver" | "basic";

export type RowIssue = { dong: number; loi: string[] };

export type ParsedRow = {
  dong: number;                       // số dòng trong file (tính cả dòng tiêu đề)
  loi: string[];                      // rỗng = hợp lệ
  payload: Record<string, unknown>;   // sẵn sàng insert vào bảng listings
  maAnh: string;                      // mã để khớp ảnh tải hàng loạt theo tên tệp
  tomTat: { tieuDe: string; mucDich: string; loaiHinh: string; gia: string; khuVuc: string; hang: string };
};

// Ô trong cột "anh" là ĐƯỜNG DẪN/LINK sẵn hay là TÊN TỆP ảnh trên máy?
export function laLinkAnh(gt: string): boolean {
  return /^(https?:)?\/\//i.test(gt) || gt.startsWith("/");
}

// Bỏ đuôi ảnh — bỏ ĐƯỢC CẢ ĐUÔI KÉP. Windows hay tạo ra "tin01-1.jpg.jpg" hoặc
// "tin01-5.jpg.PNG" khi đổi tên tệp lúc đang ẩn phần mở rộng.
const DUOI_ANH = /\.(jpe?g|png|webp|gif|heic|heif|bmp|tiff?)$/i;
function boDuoiAnh(s: string): string {
  let t = s.trim();
  while (DUOI_ANH.test(t)) t = t.replace(DUOI_ANH, "");
  return t;
}

// Hai tên tệp có phải cùng một ảnh không — bỏ qua hoa thường, dấu, đuôi kép, và
// cho phép ghi thiếu đuôi ("nha-my-khe-1" khớp "nha-my-khe-1.jpg").
export function cungTenTep(tenTep: string, ghiTrongFile: string): boolean {
  return chuanHoa(boDuoiAnh(tenTep)) === chuanHoa(boDuoiAnh(ghiTrongFile));
}

// Tách một ô thành danh sách tên ảnh — nhận MỌI kiểu ngăn cách người dùng hay gõ:
// dấu | , ; hoặc xuống dòng.
export function tachDanhSachAnh(o: string): string[] {
  return o.split(/[|;,\n]/).map((s) => s.trim()).filter(Boolean);
}

// Ô "ma_anh" đang ghi MÃ (tin01) hay ghi thẳng DANH SÁCH TÊN ẢNH?
// Có đuôi ảnh hoặc có dấu ngăn cách → coi là danh sách tên ảnh.
export function laDanhSachTenAnh(o: string): boolean {
  return /[|;,\n]/.test(o) || DUOI_ANH.test(o.trim());
}

// Khớp ảnh với tin theo TÊN TỆP: ảnh "tin01-1.jpg", "tin01_2.jpg", "tin01 (3).jpg"
// đều thuộc tin có ma_anh = "tin01". So sánh không phân biệt hoa thường/dấu.
export function anhThuocMa(tenTep: string, maAnh: string): boolean {
  if (!maAnh) return false;
  const ten = chuanHoa(boDuoiAnh(tenTep));
  const ma = chuanHoa(boDuoiAnh(maAnh));
  return ten === ma || ten.startsWith(`${ma}_`) || ten.startsWith(`${ma}(`);
}

// ── CỘT TRONG FILE ──────────────────────────────────────────────────────────
// Tên cột nhận cả có dấu lẫn không dấu, hoa/thường, dấu cách hay gạch dưới.
export const COT = {
  mucDich: "muc_dich",
  loaiHinh: "loai_hinh",
  tieuDe: "tieu_de",
  moTa: "mo_ta",
  gia: "gia",
  dienTich: "dien_tich",
  phongNgu: "phong_ngu",
  phongTam: "phong_tam",
  phuongXa: "phuong_xa",
  quanHuyen: "quan_huyen",
  tinhThanh: "tinh_thanh",
  hangTin: "hang_tin",
  anh: "anh",
  maAnh: "ma_anh",
  diaChi: "dia_chi",
  phapLy: "phap_ly",
  huong: "huong",
  lienHeTen: "lien_he_ten",
  lienHeSdt: "lien_he_sdt",
  // ── 5 cột BỔ SUNG theo file mẫu mới (mau-nhap-tin-hang-loat.xlsx) ──────────
  tenDuAn: "ten_du_an",                 // tin thuộc dự án nào
  huongBanCong: "huong_ban_cong",       // hướng ban công (căn hộ / chung cư)
  tinhTrangNoiThat: "tinh_trang_noi_that", // mức nội thất (Bàn giao thô / Đầy đủ…)
  noiThatBanGiao: "noi_that_ban_giao",  // danh sách nội thất, ngăn bằng dấu phẩy
  tienIch: "tien_ich",                  // danh sách tiện ích, ngăn bằng dấu phẩy
} as const;

// Tách ô "A, B; C" hoặc xuống dòng → mảng, bỏ khoảng trắng thừa và mục rỗng
function tachDanhSach(s: string): string[] {
  return s.split(/[,;\n|]+/).map((x) => x.trim()).filter(Boolean);
}


export const HEADER_MAU = Object.values(COT);

const TIERS: ListingTierId[] = ["diamond", "gold", "silver", "basic"];

const loaiHinhBan = saleTypeGroups.flatMap((g) => g.items);
const loaiHinhThue = rentTypeGroups.flatMap((g) => g.items);
export const LOAI_HINH_HOP_LE = { ban: loaiHinhBan, thue: loaiHinhThue };

// Bỏ dấu + chuẩn hoá để so tên cột / tên loại hình không phụ thuộc dấu, hoa thường
function chuanHoa(s: string): string {
  return s
    .normalize("NFD") // tách dấu ra khỏi chữ rồi xoá dấu (̀–ͯ)
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[\s\-/]+/g, "_");
}

// Đọc số theo cách người Việt gõ, KHÔNG được nhầm 5,5 tỷ thành 55 tỷ:
//   · Có dấu PHẨY  → phẩy là dấu thập phân, chấm là dấu nghìn: "1.234,5" → 1234.5
//   · Không có phẩy → chấm là dấu thập phân (kiểu Excel tiếng Anh): "5.5" → 5.5
function soVN(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const chuan = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  const n = Number(chuan);
  return Number.isNaN(n) ? null : n;
}

// ── ĐỌC CSV ─────────────────────────────────────────────────────────────────
// Tự nhận dấu phân cách , hoặc ; (Excel tiếng Việt hay xuất bằng ;), hiểu ô có
// dấu nháy kép bọc ngoài (bên trong có dấu phẩy, xuống dòng, "" = một dấu nháy).
export function docCsv(text: string): string[][] {
  const noBom = text.replace(/^﻿/, "");
  const dongDau = noBom.split(/\r?\n/, 1)[0] ?? "";
  const sep = (dongDau.match(/;/g)?.length ?? 0) > (dongDau.match(/,/g)?.length ?? 0) ? ";" : ",";

  const bang: string[][] = [];
  let o = "";
  let dong: string[] = [];
  let trongNhay = false;

  for (let i = 0; i < noBom.length; i++) {
    const c = noBom[i];
    if (trongNhay) {
      if (c === '"') {
        if (noBom[i + 1] === '"') { o += '"'; i++; }
        else trongNhay = false;
      } else o += c;
      continue;
    }
    if (c === '"') { trongNhay = true; continue; }
    if (c === sep) { dong.push(o); o = ""; continue; }
    if (c === "\n") { dong.push(o); bang.push(dong); dong = []; o = ""; continue; }
    if (c === "\r") continue;
    o += c;
  }
  dong.push(o);
  bang.push(dong);

  // Bỏ các dòng trống hoàn toàn
  return bang.filter((r) => r.some((v) => v.trim() !== ""));
}

// ── KIỂM TRA & CHUYỂN THÀNH TIN ─────────────────────────────────────────────
export function docTinTuCsv(text: string): { rows: ParsedRow[]; loiChung: string | null } {
  return docTinTuBang(docCsv(text));
}

// Dùng chung cho CSV và Excel (.xlsx) — cả hai đều quy về bảng string[][]
export function docTinTuBang(bang: string[][]): { rows: ParsedRow[]; loiChung: string | null } {
  if (bang.length < 2) return { rows: [], loiChung: "File chưa có dữ liệu (cần dòng tiêu đề + ít nhất 1 dòng tin)." };

  // TÌM DÒNG TÊN CỘT — không bắt buộc phải là dòng đầu tiên: chủ dự án hay chèn
  // dòng trang trí ("BẢNG ĐĂNG TIN THÁNG 8…") phía trên cho dễ nhìn. Quét 10 dòng
  // đầu, dòng nào có cột "tieu_de" thì đó là dòng tên cột.
  const viTriHeader = bang.slice(0, 10).findIndex((r) => r.map(chuanHoa).includes(COT.tieuDe));
  if (viTriHeader < 0)
    return { rows: [], loiChung: `File không có cột "${COT.tieuDe}" (tiêu đề tin). Hãy tải file mẫu và nhập theo đúng cột.` };

  const header = bang[viTriHeader].map(chuanHoa);
  const thieu = [COT.tieuDe, COT.tinhThanh].filter((c) => !header.includes(c));
  if (thieu.length)
    return { rows: [], loiChung: `File thiếu cột bắt buộc: ${thieu.join(", ")}. Hãy tải file mẫu và nhập theo đúng cột.` };

  const rows = bang
    .slice(viTriHeader + 1)
    .map((cells, i) => docMotDong(header, cells, viTriHeader + i + 2));
  return { rows, loiChung: null };
}

function docMotDong(header: string[], cells: string[], soDong: number): ParsedRow {
  const lay = (ten: string): string => {
    const k = header.indexOf(ten);
    return k >= 0 ? (cells[k] ?? "").trim() : "";
  };
  const loi: string[] = [];

  // ── ĐIỀU KIỆN ĐỂ GOOGLE NHẬN TIN ──────────────────────────────────────────
  // Cùng bộ quy tắc với form đăng tin trong admin. Nhập hàng loạt đăng thẳng
  // trạng thái 'approved' nên nếu không kiểm ở đây thì cả trăm tin thiếu nội
  // dung sẽ lên web, Google coi là "nội dung mỏng" và bỏ qua toàn bộ.
  const tieuDe = lay(COT.tieuDe);
  if (!tieuDe) loi.push("Thiếu tiêu đề");
  else if (tieuDe.length < 30) loi.push(`Tiêu đề quá ngắn (${tieuDe.length}/30 ký tự)`);

  const moTa = lay(COT.moTa);
  if (moTa.trim().length < 100) loi.push(`Mô tả quá ngắn (${moTa.trim().length}/100 ký tự)`);

  const quanHuyen = lay(COT.quanHuyen);
  if (!quanHuyen) loi.push("Thiếu quận/huyện");

  if (!lay(COT.dienTich).trim()) loi.push("Thiếu diện tích");

  const mucDichRaw = chuanHoa(lay(COT.mucDich) || "ban");
  const mucDich = mucDichRaw === "thue" || mucDichRaw === "cho_thue" ? "thue" : "ban";
  if (mucDichRaw && !["ban", "thue", "cho_thue", "mua_ban"].includes(mucDichRaw))
    loi.push(`muc_dich "${lay(COT.mucDich)}" không hợp lệ (chỉ nhận: ban hoặc thue)`);

  const loaiHinh = lay(COT.loaiHinh);
  const dsLoai = mucDich === "thue" ? loaiHinhThue : loaiHinhBan;
  if (!loaiHinh) loi.push("Thiếu loại hình");
  else if (!dsLoai.some((x) => chuanHoa(x) === chuanHoa(loaiHinh)))
    loi.push(`loai_hinh "${loaiHinh}" không có trong danh mục ${mucDich === "thue" ? "cho thuê" : "mua bán"}`);
  const loaiHinhChuan = dsLoai.find((x) => chuanHoa(x) === chuanHoa(loaiHinh)) ?? loaiHinh;

  const tinhThanh = lay(COT.tinhThanh);
  if (!tinhThanh) loi.push("Thiếu tỉnh/thành");

  // Giá: BÁN nhập theo TỶ · THUÊ nhập theo TRIỆU/tháng (giống form đăng tin).
  // Bỏ trống = Thỏa thuận.
  let giaVnd: number | null = null;
  if (lay(COT.gia)) {
    const n = soVN(lay(COT.gia));
    if (n == null) loi.push(`gia "${lay(COT.gia)}" không phải số`);
    else giaVnd = Math.round(n * (mucDich === "thue" ? 1e6 : 1e9));
  }

  const soHoacNull = (v: string, ten: string, nguyen = false): number | null => {
    if (!v.trim()) return null;
    const n = soVN(v);
    if (n == null) { loi.push(`${ten} "${v}" không phải số`); return null; }
    return nguyen ? Math.round(n) : n;
  };

  const hangRaw = chuanHoa(lay(COT.hangTin) || "basic");
  const hang = (TIERS as string[]).includes(hangRaw) ? (hangRaw as ListingTierId) : "basic";
  if (lay(COT.hangTin) && !(TIERS as string[]).includes(hangRaw))
    loi.push(`hang_tin "${lay(COT.hangTin)}" không hợp lệ (diamond/gold/silver/basic)`);

  // ẢNH — nhận mọi kiểu ghi, ngăn nhau bằng | , ; hoặc xuống dòng:
  //   · TÊN TỆP ảnh trên máy ("tin01-1.jpg") → khớp với ảnh tải ở Bước 4
  //   · Đường dẫn/link có sẵn ("/images/tin/1.jpg", "https://…") → dùng thẳng
  // Ghi nhầm danh sách tên ảnh vào ô "ma_anh" cũng hiểu (rất dễ nhầm 2 cột này).
  const maAnhRaw = lay(COT.maAnh);
  const anh = [
    ...tachDanhSachAnh(lay(COT.anh)),
    ...(laDanhSachTenAnh(maAnhRaw) ? tachDanhSachAnh(maAnhRaw) : []),
  ];

  if (anh.length === 0) loi.push("Thiếu ảnh (cần ít nhất 1)");

  const ten = lay(COT.lienHeTen);
  const sdt = lay(COT.lienHeSdt);

  const payload = {
    purpose: mucDich,
    type: loaiHinhChuan || null,
    title: tieuDe,
    description: lay(COT.moTa) || null,
    price_vnd: giaVnd,
    area_m2: soHoacNull(lay(COT.dienTich), "dien_tich"),
    beds: soHoacNull(lay(COT.phongNgu), "phong_ngu", true),
    baths: soHoacNull(lay(COT.phongTam), "phong_tam", true),
    ward: lay(COT.phuongXa) || null,
    district: lay(COT.quanHuyen) || null,
    province: tinhThanh || null,
    images: anh,
    details: {
      addressDetail: lay(COT.diaChi) || undefined,
      legal: lay(COT.phapLy) || undefined,
      direction: lay(COT.huong) || undefined,
      contact: ten || sdt ? { name: ten, phone: sdt } : undefined,
      // ── 5 cột bổ sung ────────────────────────────────────────────────────
      // Dự án: lưu SLUG để trang chi tiết nối được với dự án tương ứng
      project: lay(COT.tenDuAn) ? slugify(lay(COT.tenDuAn)) : undefined,
      // Hướng ban công nằm trong bộ đặc điểm theo loại hình (key "balcony")
      specs: lay(COT.huongBanCong) ? { balcony: lay(COT.huongBanCong) } : undefined,
      furnish: lay(COT.tinhTrangNoiThat) || undefined,
      interior: lay(COT.noiThatBanGiao) ? tachDanhSach(lay(COT.noiThatBanGiao)) : undefined,
      amenities: lay(COT.tienIch) ? tachDanhSach(lay(COT.tienIch)) : undefined,
    },
    tier: hang,
    status: "approved",
  };

  return {
    dong: soDong,
    loi,
    payload,
    // Chỉ giữ làm "mã gom ảnh theo tiền tố" khi ô đó thực sự là MÃ (tin01),
    // còn nếu là danh sách tên ảnh thì đã gộp vào danh sách ảnh phía trên.
    maAnh: laDanhSachTenAnh(maAnhRaw) ? "" : maAnhRaw,
    tomTat: {
      tieuDe: tieuDe || "(trống)",
      mucDich: mucDich === "thue" ? "Cho thuê" : "Mua bán",
      loaiHinh: loaiHinhChuan || "(trống)",
      gia: giaVnd == null ? "Thỏa thuận" : giaVnd.toLocaleString("vi-VN") + " ₫",
      khuVuc: [lay(COT.phuongXa), lay(COT.quanHuyen), tinhThanh].filter(Boolean).join(", ") || "(trống)",
      hang,
    },
  };
}
