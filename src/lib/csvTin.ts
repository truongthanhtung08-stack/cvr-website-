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
// Bộ đặc điểm theo loại hình — để ghi số tầng / mặt tiền / đường vào đúng ô của
// từng loại bất động sản, y như khi đăng tay bằng form.
import { fieldsFor, coDonGiaM2 } from "@/lib/listingSpec";
// SỐ ĐIỆN THOẠI — cùng một hàm với ô nhập trong admin và số hiện trên trang tin,
// nên file của Cowork, cơ sở dữ liệu và web luôn ghi giống hệt nhau (0 + 10 số).
import { chuanHoaSdt, laSdtVN, tachNhieuSdt } from "@/lib/phone";
// TIỆN ÍCH / NỘI THẤT / PHÁP LÝ — dịch cách viết đời thường về đúng tên danh mục.
// Không có bước này thì "Bảo vệ 24/7", "Máy lạnh", "Sổ hồng riêng" lên web là MẤT.
import {
  chuanHoaTienIch, chuanHoaNoiThat, chuanHoaPhapLy, chuanHoaMucNoiThat,
  tienIchNgoaiDanhMuc, noiThatNgoaiDanhMuc,
} from "@/lib/chuanHoaThuocTinh";

export type ListingTierId = "diamond" | "gold" | "silver" | "basic";

export type RowIssue = { dong: number; loi: string[] };

export type ParsedRow = {
  dong: number;                       // số dòng trong file (tính cả dòng tiêu đề)
  loi: string[];                      // rỗng = hợp lệ (ĐỎ — không đăng)
  // CẢNH BÁO (VÀNG) — tin vẫn đăng được nhưng chủ dự án cần liếc qua: mô tả bị
  // dồn thành một đoạn, tiện ích ghi tên lạ, số điện thoại không đúng 10 số,
  // và ghi chú Cowork để lại khi họ có sửa tiêu đề / nội dung tin gốc.
  canhBao: string[];
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
  lienHeSdt: "lien_he_sdt",      // nhiều số ngăn bằng dấu |
  lienHeEmail: "lien_he_email",  // không bắt buộc — thêm một chìa để ghép tài khoản
  // ── 5 cột BỔ SUNG theo file mẫu mới (mau-nhap-tin-hang-loat.xlsx) ──────────
  tenDuAn: "ten_du_an",                 // tin thuộc dự án nào
  huongBanCong: "huong_ban_cong",       // hướng ban công (căn hộ / chung cư)
  tinhTrangNoiThat: "tinh_trang_noi_that", // mức nội thất (Bàn giao thô / Đầy đủ…)
  noiThatBanGiao: "noi_that_ban_giao",  // danh sách nội thất, ngăn bằng dấu phẩy
  tienIch: "tien_ich",                  // danh sách tiện ích, ngăn bằng dấu phẩy
  // ── ĐƠN GIÁ THUÊ THEO M² — NHÀ XƯỞNG · KHO BÃI · VĂN PHÒNG · MẶT BẰNG ────
  // Thị trường báo giá "35.000đ/m²/tháng", KHÔNG báo tổng tiền tháng. Cowork ghi
  // NGUYÊN con số đơn giá theo NGÀN ĐỒNG (35.000đ/m² → ghi 35), web tự nhân với
  // diện tích ra tổng tiền mỗi tháng. Cowork hết phải tính nhẩm — chỗ sai nhiều nhất.
  donGiaThue: "don_gia_thue",           // NGÀN đồng / m² / tháng
  // ── KÍCH THƯỚC / SỐ TẦNG — vào bộ đặc điểm theo LOẠI HÌNH ──────────────────
  duongVao: "duong_vao",                // bề rộng đường trước nhà (m)
  matTien: "mat_tien",                  // chiều ngang mặt tiền (m)
  soTang: "so_tang",                    // số tầng nhà (căn hộ: tổng số tầng toà)
  chieuDai: "chieu_dai",                // chiều sâu thửa đất (m)
  namXayDung: "nam_xay_dung",
  tangSo: "tang_so",                    // căn hộ ở tầng mấy
  // ── ĐẶC ĐIỂM RIÊNG CỦA KHO · NHÀ XƯỞNG · BÃI (chủ yếu tin CHO THUÊ) ──────
  dienTichSuDung: "dien_tich_su_dung",  // diện tích xưởng/kho thực dùng (m²)
  loaiKho: "loai_kho",                  // Xưởng sản xuất · Kho hàng khô · Kho lạnh…
  chieuCao: "chieu_cao",                // chiều cao thông thuỷ (m)
  taiTrongNen: "tai_trong_nen",         // VD: 3 tấn/m²
  congSuatDien: "cong_suat_dien",       // VD: 560 KVA
  pccc: "pccc",                         // Đã có / Chưa có
  vanPhongTrongKho: "van_phong_trong_kho", // m²
  xeContainer: "xe_container",          // Container 40 feet / 20 feet / Xe tải nhỏ
  // ── HAI MỤC MỌI TIN CHO THUÊ ĐỀU CẦN ────────────────────────────────────
  thoiHanThue: "thoi_han_thue",         // VD: 3 năm
  tienCoc: "tien_coc",                  // VD: 3 tháng
  // ── BA MỤC CHỈ CÓ Ở TIN CHO THUÊ ─────────────────────────────────────────
  thoiGianVaoO: "thoi_gian_du_kien_vao_o",
  giaDien: "muc_gia_dien",
  giaNuoc: "muc_gia_nuoc",
  // ── GHI CHÚ NỘI BỘ — LƯU LẠI NHƯNG KHÔNG HIỆN RA TRANG TIN ───────────────
  ghiChu: "ghi_chu",                    // ghi chú của người nhập
  nguon: "nguon",                       // link tin gốc (để đối chiếu khi cần)
  linkAnh: "link_anh",                  // link ảnh gốc — dùng để TẢI ẢNH VỀ, không đăng thẳng
  // VIDEO — link YouTube/Vimeo hoặc tệp .mp4 đã có trên mạng. Nhiều link ngăn
  // bằng dấu |. Lưu chung vào cột images của tin; trang chi tiết tự tách ra mục
  // Video riêng (xem isVideoUrl trong media.ts).
  video: "video",
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
  const canhBao: string[] = [];

  // ── ĐIỀU KIỆN ĐỂ GOOGLE NHẬN TIN ──────────────────────────────────────────
  // Cùng bộ quy tắc với form đăng tin trong admin. Nhập hàng loạt đăng thẳng
  // trạng thái 'approved' nên nếu không kiểm ở đây thì cả trăm tin thiếu nội
  // dung sẽ lên web, Google coi là "nội dung mỏng" và bỏ qua toàn bộ.
  const tieuDe = lay(COT.tieuDe);
  if (!tieuDe) loi.push("Thiếu tiêu đề");
  else if (tieuDe.length < 30) loi.push(`Tiêu đề quá ngắn (${tieuDe.length}/30 ký tự)`);

  const moTa = lay(COT.moTa);
  if (moTa.trim().length < 50) loi.push(`Mô tả quá ngắn (${moTa.trim().length}/50 ký tự)`);
  // XUỐNG DÒNG PHẢI KHỚP TIN GỐC. Người đăng viết mỗi ý một dòng; dán qua công cụ
  // trung gian là dồn hết thành một cục chữ, lên web khách bỏ đi. Không chặn đăng
  // (có tin gốc vốn viết liền) nhưng phải báo vàng để chủ dự án mở tin gốc đối chiếu.
  if (moTa.trim().length >= 250 && moTa.indexOf(String.fromCharCode(10)) < 0)
    canhBao.push("Mô tả dồn thành MỘT ĐOẠN — mở tin gốc xem lại xuống dòng/gạch đầu dòng");

  // ĐƠN VỊ HÀNH CHÍNH MỚI — 2 cấp: Tỉnh/Thành → Phường/Xã (KHÔNG còn Quận/Huyện).
  // Vì vậy chỗ bắt buộc là PHƯỜNG/XÃ. Tin theo hệ cũ chỉ ghi quan_huyen vẫn nhận.
  const phuongXa = lay(COT.phuongXa);
  const quanHuyen = lay(COT.quanHuyen);
  if (!phuongXa && !quanHuyen) loi.push("Thiếu phường/xã");

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

  const dienTichSo = soVN(lay(COT.dienTich));

  // ── GIÁ ───────────────────────────────────────────────────────────────────
  // BÁN nhập theo TỶ · THUÊ nhập theo TRIỆU/tháng (giống form đăng tin).
  // Bỏ trống cả hai cột giá = Thỏa thuận.
  let giaVnd: number | null = null;
  if (lay(COT.gia)) {
    const n = soVN(lay(COT.gia));
    if (n == null) loi.push(`gia "${lay(COT.gia)}" không phải số`);
    else giaVnd = Math.round(n * (mucDich === "thue" ? 1e6 : 1e9));
  }

  // ── ĐƠN GIÁ THUÊ THEO M² — NHÀ XƯỞNG · KHO BÃI · VĂN PHÒNG · MẶT BẰNG ─────
  // Tin gốc ghi "35.000đ/m²/tháng"; Cowork chép NGUYÊN con số theo NGÀN ĐỒNG
  // (ghi 35), web nhân với diện tích ra tổng tiền mỗi tháng. Nhờ vậy không ai
  // phải tính nhẩm — đây là chỗ đợt vừa rồi sai hết.
  //   35 (nghìn/m²) × 2.000 m² = 70.000.000 đ/tháng
  // Đơn giá bậc thang theo diện tích (dưới 1.000 m² một giá, trên 1.000 m² một
  // giá rẻ hơn) thì ghi ĐÚNG mức áp cho diện tích của chính tin này.
  const laGiaTheoM2 = coDonGiaM2(loaiHinhChuan, mucDich);
  let donGiaThue: number | null = null;
  if (lay(COT.donGiaThue)) {
    const n = soVN(lay(COT.donGiaThue));
    if (n == null) loi.push(`don_gia_thue "${lay(COT.donGiaThue)}" không phải số`);
    else if (mucDich !== "thue") canhBao.push("don_gia_thue chỉ dùng cho tin CHO THUÊ — đã bỏ qua");
    else if (dienTichSo == null) loi.push("Có don_gia_thue nhưng thiếu dien_tich — không tính được giá thuê");
    else {
      // Người ghi nhầm nguyên số đồng (35000 thay vì 35) vẫn hiểu đúng, không
      // để tin ra giá 70 tỷ một tháng.
      donGiaThue = n >= 1000 ? n / 1000 : n;
      if (n >= 1000) canhBao.push(`don_gia_thue ghi ${lay(COT.donGiaThue)} — hiểu là ${donGiaThue} nghìn đ/m²/tháng`);
      giaVnd = Math.round(donGiaThue * 1000 * dienTichSo);
    }
  } else if (laGiaTheoM2 && giaVnd != null && dienTichSo) {
    // Chỉ ghi tổng tiền tháng vẫn nhận — tự suy ngược ra đơn giá để trang tin hiện.
    donGiaThue = Math.round((giaVnd / 1000 / dienTichSo) * 10) / 10;
  } else if (laGiaTheoM2 && giaVnd == null) {
    canhBao.push("Kho/xưởng/mặt bằng cho thuê nên có don_gia_thue (ngàn đ/m²/tháng)");
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

  // Chỉ giữ làm "mã gom ảnh theo tiền tố" khi ô đó thực sự là MÃ (tin01), còn nếu
  // là danh sách tên ảnh thì đã gộp vào danh sách ảnh phía trên.
  const maAnh = laDanhSachTenAnh(maAnhRaw) ? "" : maAnhRaw;

  // Ghi MÃ ảnh cũng tính là ĐÃ khai ảnh — ảnh thật khớp vào theo tên tệp ở Bước 4.
  if (anh.length === 0 && !maAnh) loi.push("Thiếu ảnh (cần ít nhất 1)");

  // VIDEO xếp SAU ảnh trong cùng cột images — trang chi tiết tự tách ra mục Video.
  // Video KHÔNG thay được ảnh: tin chỉ có video vẫn báo thiếu ảnh ở trên.
  const video = tachDanhSachAnh(lay(COT.video)).filter(laLinkAnh);

  const ten = lay(COT.lienHeTen);
  // ── SỐ ĐIỆN THOẠI NGƯỜI ĐĂNG ───────────────────────────────────────────────
  // Chuẩn đã chốt: 10 chữ số, CÓ SỐ 0 phía trước. Cùng hàm chuanHoaSdt() với ô
  // nhập trong admin và với số hiện trên trang tin, nên file Cowork · kho dữ liệu ·
  // trang web luôn ghi giống hệt nhau. "0905.123.456" · "+84905123456" đều về
  // "0905123456".
  // Đây cũng là CHÌA KHOÁ gán tin đăng hộ về tài khoản khách sau này → lưu ĐỦ số.
  const dsSdt = tachNhieuSdt(lay(COT.lienHeSdt));
  const sdt = dsSdt[0] ?? "";
  const sdtLoi = tachDanhSachAnh(lay(COT.lienHeSdt)).filter((s) => s.trim() && !laSdtVN(s) && chuanHoaSdt(s).length !== 11);
  if (sdtLoi.length) canhBao.push(`Số điện thoại không đúng chuẩn 10 số: ${sdtLoi.join(" · ")}`);
  const email = lay(COT.lienHeEmail).trim().toLowerCase();

  // ── ĐẶC ĐIỂM THEO LOẠI HÌNH ────────────────────────────────────────────────
  // Mỗi loại hình có bộ mục riêng (listingSpec.ts). CHỈ ghi vào mục mà loại hình
  // đó thật sự có — ghi mục không thuộc loại hình thì trang chi tiết không hiện,
  // chỉ tồn dữ liệu rác. Ba mục điện/nước/vào ở chỉ tồn tại ở tin CHO THUÊ.
  const khoaCoSan = new Set(fieldsFor(loaiHinhChuan, mucDich).map((f) => f.key));
  const specs: Record<string, string> = {};
  const datSpec = (giaTri: string, ...uuTien: string[]) => {
    const v = giaTri.trim();
    if (!v) return;
    const k = uuTien.find((x) => khoaCoSan.has(x));
    if (k) specs[k] = v;
  };
  datSpec(lay(COT.huongBanCong), "balcony");
  datSpec(lay(COT.matTien), "frontage");
  datSpec(lay(COT.duongVao), "roadWidth");
  // Nhà/biệt thự/shophouse: "số tầng" là của chính căn nhà. Căn hộ/chung cư
  // không có mục ấy nên hiểu là TỔNG SỐ TẦNG CỦA TOÀ.
  datSpec(lay(COT.soTang), "floors", "buildingFloors");
  datSpec(lay(COT.chieuDai), "depth");
  datSpec(lay(COT.namXayDung), "builtYear");
  datSpec(lay(COT.tangSo), "floor");
  // Kho · nhà xưởng · bãi — bộ đặc điểm riêng, phần lớn là tin CHO THUÊ.
  datSpec(lay(COT.dienTichSuDung), "usableArea");
  datSpec(lay(COT.loaiKho), "khoLoai");
  datSpec(lay(COT.chieuCao), "clearHeight");
  datSpec(lay(COT.taiTrongNen), "floorLoad");
  datSpec(lay(COT.congSuatDien), "power");
  datSpec(lay(COT.pccc), "pccc");
  datSpec(lay(COT.vanPhongTrongKho), "officeArea");
  datSpec(lay(COT.xeContainer), "container");
  // Mọi tin cho thuê
  datSpec(lay(COT.thoiGianVaoO), "moveIn");
  datSpec(lay(COT.thoiHanThue), "minTerm");
  datSpec(lay(COT.tienCoc), "deposit");
  datSpec(lay(COT.giaDien), "elecPrice");
  datSpec(lay(COT.giaNuoc), "waterPrice");

  // ── TIỆN ÍCH · NỘI THẤT · PHÁP LÝ — DỊCH VỀ ĐÚNG TÊN DANH MỤC ─────────────
  // Trang tin chỉ hiện tiện ích/nội thất TRÙNG KHỚP danh mục chuẩn. Ghi "Bảo vệ
  // 24/7" thay vì "An ninh 24/7" là mục đó biến mất, không báo lỗi gì. Ở đây dịch
  // lại; mục thật sự lạ thì GIỮ NGUYÊN (trang tin gom vào nhóm "Tiện ích khác")
  // và báo vàng để chủ dự án biết mà xem.
  const tienIch = lay(COT.tienIch) ? chuanHoaTienIch(tachDanhSach(lay(COT.tienIch))) : [];
  const noiThat = lay(COT.noiThatBanGiao) ? chuanHoaNoiThat(tachDanhSach(lay(COT.noiThatBanGiao))) : [];
  const phapLy = chuanHoaPhapLy(lay(COT.phapLy));
  const mucNoiThat = chuanHoaMucNoiThat(lay(COT.tinhTrangNoiThat));
  const ngoaiDanhMuc = [...tienIchNgoaiDanhMuc(tienIch), ...noiThatNgoaiDanhMuc(noiThat)];
  if (ngoaiDanhMuc.length)
    canhBao.push(`Ngoài danh mục chuẩn (vẫn hiện ở mục "khác"): ${ngoaiDanhMuc.join(" · ")}`);

  // ── GHI CHÚ CỦA COWORK ────────────────────────────────────────────────────
  // Cowork có sửa tiêu đề / nội dung so với tin gốc thì BẮT BUỘC ghi vào cột
  // ghi_chu. Đưa lên bảng xem trước để chủ dự án đối chiếu ngay, khỏi mở lại file.
  if (lay(COT.ghiChu).trim()) canhBao.push(`Ghi chú Cowork: ${lay(COT.ghiChu).trim()}`);

  const payload = {
    purpose: mucDich,
    type: loaiHinhChuan || null,
    title: tieuDe,
    description: lay(COT.moTa) || null,
    price_vnd: giaVnd,
    area_m2: soHoacNull(lay(COT.dienTich), "dien_tich"),
    beds: soHoacNull(lay(COT.phongNgu), "phong_ngu", true),
    baths: soHoacNull(lay(COT.phongTam), "phong_tam", true),
    ward: phuongXa || null,
    district: quanHuyen || null,
    province: tinhThanh || null,
    images: [...anh, ...video],
    details: {
      // MÃ ẢNH lưu luôn vào tin — để lần tải file sau nhận ra tin này ĐÃ ĐĂNG,
      // chỉ bổ sung ảnh còn thiếu thay vì đăng trùng một tin nữa.
      maAnh: (laDanhSachTenAnh(maAnhRaw) ? "" : maAnhRaw) || undefined,
      addressDetail: lay(COT.diaChi) || undefined,
      legal: phapLy || undefined,
      direction: lay(COT.huong) || undefined,
      contact: ten || sdt || email
        ? { name: ten || undefined, phone: sdt || undefined,
            ...(dsSdt.length > 1 ? { phones: dsSdt } : {}),
            email: email || undefined }
        : undefined,
      // ── DỰ ÁN ────────────────────────────────────────────────────────────
      // Lưu CẢ HAI: slug để nối với trang dự án, và TÊN NGUYÊN VĂN để trang tin
      // hiện được ngay cả khi dự án đó chưa được tạo trong admin (chủ dự án cập
      // nhật dự án sau — yêu cầu 05/09). Trước đây chỉ lưu slug nên tên dự án
      // không hiện ở đâu cả, và mở form sửa là mất luôn.
      project: lay(COT.tenDuAn) ? slugify(lay(COT.tenDuAn)) : undefined,
      projectName: lay(COT.tenDuAn) || undefined,
      // ĐƠN GIÁ THUÊ theo NGÀN đồng/m²/tháng — trang tin hiện "35.000 đ/m²/tháng"
      donGiaThue: donGiaThue ?? undefined,
      specs: Object.keys(specs).length ? specs : undefined,
      // GHI CHÚ NỘI BỘ — lưu để đối chiếu về sau, KHÔNG hiện ra trang tin
      // (trang chi tiết chỉ hiện những mục có trong bộ đặc điểm của loại hình).
      ghiChuNoiBo: lay(COT.ghiChu) || undefined,
      nguonTin: lay(COT.nguon) || undefined,
      // Link ảnh gốc: để TẢI ẢNH VỀ cắt 4:3 rồi tải lên ở Bước 4 — KHÔNG đăng
      // thẳng link của trang khác lên web.
      linkAnhGoc: lay(COT.linkAnh) ? tachDanhSachAnh(lay(COT.linkAnh)) : undefined,
      furnish: mucNoiThat || undefined,
      interior: noiThat.length ? noiThat : undefined,
      amenities: tienIch.length ? tienIch : undefined,
    },
    tier: hang,
    status: "approved",
  };

  return {
    dong: soDong,
    loi,
    canhBao,
    payload,
    maAnh,
    tomTat: {
      tieuDe: tieuDe || "(trống)",
      mucDich: mucDich === "thue" ? "Cho thuê" : "Mua bán",
      loaiHinh: loaiHinhChuan || "(trống)",
      gia: giaVnd == null ? "Thỏa thuận" : giaVnd.toLocaleString("vi-VN") + " ₫",
      khuVuc: [phuongXa, quanHuyen, tinhThanh].filter(Boolean).join(", ") || "(trống)",
      hang,
    },
  };
}
