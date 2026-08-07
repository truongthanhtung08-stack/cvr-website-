// ============================================================================
// NHẬP TIN HÀNG LOẠT TỪ FILE CSV (Excel → Save as CSV UTF-8)
// ----------------------------------------------------------------------------
// Đọc file → tách dòng → kiểm tra từng dòng → trả về đúng payload của bảng
// `listings` (giống hệt form "Đăng tin mới", để tin nhập hàng loạt hiển thị y
// như tin đăng tay). Mọi kiểm tra làm ở đây, trang admin chỉ hiển thị kết quả.
// ============================================================================

import { saleTypeGroups, rentTypeGroups } from "@/lib/filters";

export type ListingTierId = "diamond" | "gold" | "silver" | "basic";

export type RowIssue = { dong: number; loi: string[] };

export type ParsedRow = {
  dong: number;                       // số dòng trong file (tính cả dòng tiêu đề)
  loi: string[];                      // rỗng = hợp lệ
  payload: Record<string, unknown>;   // sẵn sàng insert vào bảng listings
  tomTat: { tieuDe: string; mucDich: string; loaiHinh: string; gia: string; khuVuc: string; hang: string };
};

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
  diaChi: "dia_chi",
  phapLy: "phap_ly",
  huong: "huong",
  lienHeTen: "lien_he_ten",
  lienHeSdt: "lien_he_sdt",
} as const;

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
  const bang = docCsv(text);
  if (bang.length < 2) return { rows: [], loiChung: "File chưa có dữ liệu (cần dòng tiêu đề + ít nhất 1 dòng tin)." };

  const header = bang[0].map(chuanHoa);
  const thieu = [COT.tieuDe, COT.tinhThanh].filter((c) => !header.includes(c));
  if (thieu.length)
    return { rows: [], loiChung: `File thiếu cột bắt buộc: ${thieu.join(", ")}. Hãy tải file mẫu và nhập theo đúng cột.` };

  const rows = bang.slice(1).map((cells, i) => docMotDong(header, cells, i + 2));
  return { rows, loiChung: null };
}

function docMotDong(header: string[], cells: string[], soDong: number): ParsedRow {
  const lay = (ten: string): string => {
    const k = header.indexOf(ten);
    return k >= 0 ? (cells[k] ?? "").trim() : "";
  };
  const loi: string[] = [];

  const tieuDe = lay(COT.tieuDe);
  if (!tieuDe) loi.push("Thiếu tiêu đề");

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
  const giaRaw = lay(COT.gia).replace(/\./g, "").replace(",", ".").trim();
  let giaVnd: number | null = null;
  if (giaRaw) {
    const n = parseFloat(giaRaw);
    if (Number.isNaN(n)) loi.push(`gia "${lay(COT.gia)}" không phải số`);
    else giaVnd = Math.round(n * (mucDich === "thue" ? 1e6 : 1e9));
  }

  const soHoacNull = (v: string, ten: string, nguyen = false): number | null => {
    const s = v.replace(",", ".").trim();
    if (!s) return null;
    const n = nguyen ? parseInt(s, 10) : parseFloat(s);
    if (Number.isNaN(n)) { loi.push(`${ten} "${v}" không phải số`); return null; }
    return n;
  };

  const hangRaw = chuanHoa(lay(COT.hangTin) || "basic");
  const hang = (TIERS as string[]).includes(hangRaw) ? (hangRaw as ListingTierId) : "basic";
  if (lay(COT.hangTin) && !(TIERS as string[]).includes(hangRaw))
    loi.push(`hang_tin "${lay(COT.hangTin)}" không hợp lệ (diamond/gold/silver/basic)`);

  // Nhiều ảnh: ngăn cách bằng dấu | (đường dẫn /images/... hoặc link ảnh đầy đủ)
  const anh = lay(COT.anh).split("|").map((s) => s.trim()).filter(Boolean);

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
    },
    tier: hang,
    status: "approved",
  };

  return {
    dong: soDong,
    loi,
    payload,
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
