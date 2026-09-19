// ============================================================================
// NHẬP TIN HÀNG LOẠT TỪ FILE CSV (Excel → Save as CSV UTF-8)
// ----------------------------------------------------------------------------
// Đọc file → tách dòng → kiểm tra từng dòng → trả về đúng payload của bảng
// `listings` (giống hệt form "Đăng tin mới", để tin nhập hàng loạt hiển thị y
// như tin đăng tay). Mọi kiểm tra làm ở đây, trang admin chỉ hiển thị kết quả.
// ============================================================================

import { saleTypeGroups, rentTypeGroups } from "@/lib/filters";
// Máy KHÔNG suy ngược được phường cũ khi một phường mới gộp nhiều phường cũ —
// dùng để báo vàng khi file thiếu ba cột địa chỉ hệ cũ.
import { ungVienPhuongCu } from "@/lib/diaChiHaiHe";
// Dùng CHUNG hàm tạo slug với form dự án trong admin → tên dự án trong file Excel
// và slug dự án thật luôn khớp nhau, không bao giờ lệch quy tắc.
import { slugify } from "@/lib/contentAdmin";
// Bộ đặc điểm theo loại hình — để ghi số tầng / mặt tiền / đường vào đúng ô của
// từng loại bất động sản, y như khi đăng tay bằng form.
import { fieldsFor, coDonGiaM2, coDienTichXayDung, mauSoCuaLoaiHinh } from "@/lib/listingSpec";
// SỐ ĐIỆN THOẠI — cùng một hàm với ô nhập trong admin và số hiện trên trang tin,
// nên file của Cowork, cơ sở dữ liệu và web luôn ghi giống hệt nhau (0 + 10 số).
import { chuanHoaSdt, laSdtVN, tachNhieuSdt } from "@/lib/phone";
// TIỆN ÍCH / NỘI THẤT / PHÁP LÝ — dịch cách viết đời thường về đúng tên danh mục.
// Không có bước này thì "Bảo vệ 24/7", "Máy lạnh", "Sổ hồng riêng" lên web là MẤT.
import {
  chuanHoaTienIch, chuanHoaNoiThat, chuanHoaPhapLy, chuanHoaMucNoiThat, phapLyLechLoaiHinh,
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
  // ── DIỆN TÍCH XÂY DỰNG — MẪU SỐ CỦA GIÁ/M² Ở NHÀ GẮN LIỀN ĐẤT ────────────
  // Giá mỗi m² của ĐẤT chia cho m² đất, nhưng của NHÀ phải chia cho m² SÀN XÂY
  // DỰNG — hai con số lệch nhau vài lần: biệt thự 24 tỷ / 200 m² đất = 120 tr/m²,
  // còn chia 500 m² sàn chỉ 48 tr/m². Trước 19/09 file nhập tin KHÔNG có cột này
  // nên 129/134 tin trống diện tích xây dựng, web không có gì để tính cho đúng.
  dienTichXayDung: "dien_tich_xay_dung", // m² sàn xây dựng (cộng hết các tầng)
  phongNgu: "phong_ngu",
  phongTam: "phong_tam",
  phuongXa: "phuong_xa",
  quanHuyen: "quan_huyen",
  tinhThanh: "tinh_thanh",
  // ── ĐỊA CHỈ HỆ CŨ, CHÉP NGUYÊN TỪ TIN GỐC ─────────────────────────────────
  // Một phường mới gộp 2–4 phường cũ nên KHÔNG có cách nào suy ngược từ hệ mới
  // ra đúng phường cũ: đo trên 34 tin ngày 10/09 thì 13 tin mất cấp phường, vài
  // tin ra sai hẳn ("Thủy Vân" thành "Vỹ Dạ"). Tin gốc vốn ghi theo hệ cũ, nên
  // Cowork chép nguyên vào hai cột này; có thì web dùng thẳng, không suy nữa.
  phuongXaCu: "phuong_xa_cu",
  quanHuyenCu: "quan_huyen_cu",
  tinhCu: "tinh_cu",             // tỉnh trước sáp nhập (Bình Định, Bình Thuận…)
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
  donGiaThue: "don_gia_thue",           // NGÀN đồng / m² / kỳ (xem chu_ky_thue)
  // ── KỲ BÁO GIÁ THUÊ: thang · quy · nam ────────────────────────────────────
  // Văn phòng, kho xưởng, đất thuê rất hay niêm yết "150 triệu/quý" hay
  // "1,2 tỷ/năm". Bắt Cowork tự chia 3 hoặc chia 12 là lại đẻ ra một chỗ tính
  // nhẩm để sai — cứ chép NGUYÊN con số của tin gốc vào `gia`/`don_gia_thue`
  // rồi ghi kỳ vào đây, web tự quy về đồng mỗi tháng. Bỏ trống = theo tháng.
  chuKyThue: "chu_ky_thue",
  // ── ĐƠN GIÁ BÁN MỖI M² — CHỈ KHI TIN GỐC CÓ GHI ─────────────────────────
  // Người bán nhà niêm yết TỔNG GIÁ, không ai báo giá mỗi m² sàn, nên web KHÔNG
  // tự chia ra rồi in lên tin. Nhưng tin nào người bán CÓ ghi ("giá 45 triệu/m²
  // sàn") thì chép vào đây theo TRIỆU đồng — đó là con số của họ, phải hiện.
  // Tin không ghi thì BỎ TRỐNG, đừng tự tính.
  donGiaBan: "don_gia_ban",              // TRIỆU đồng / m² (sàn với nhà)
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
// Đọc số kiểu Việt lẫn kiểu Anh. Luật: dấu nào đứng SAU CÙNG và chỉ xuất hiện
// MỘT LẦN thì đó là dấu thập phân; dấu lặp nhiều lần là phân cách nghìn.
//   "62,5"      → 62,5      · "62.5"        → 62,5
//   "1.234.567" → 1234567   · "1,234.56"    → 1234,56
// ⚠️ CÒN MỘT CHỖ MÁY KHÔNG TỰ QUYẾT ĐƯỢC: một dấu chấm với ĐÚNG BA chữ số sau
// nó ("2.222") vừa có thể là 2222 (phân cách nghìn) vừa có thể là 2,222 (thập
// phân) — hai cách hiểu lệch nhau 1000 lần. Ở đây vẫn hiểu là THẬP PHÂN như cũ,
// nhưng phần kiểm tra bên dưới soi lại ĐƠN GIÁ MỖI M²: ra ngoài khoảng hợp lý
// thì báo vàng. Đợt 19/09 có 3 tin sai đúng kiểu này lọt lên web (2.222 m² thành
// 2,222 m², 2,246 tỷ thành 2.246 tỷ) — không ai thấy cho tới khi soi đơn giá.
function soVN(s: string): number | null {
  const t = s.trim().split(" ").join("");
  if (!t) return null;
  const soCham = (t.match(/\./g) ?? []).length;
  const soPhay = (t.match(/,/g) ?? []).length;
  let chuan = t;
  if (soCham && soPhay) {
    const thapPhan = t.lastIndexOf(".") > t.lastIndexOf(",") ? "." : ",";
    const nghin = thapPhan === "." ? "," : ".";
    chuan = t.split(nghin).join("").split(thapPhan).join(".");
  } else if (soCham > 1) chuan = t.split(".").join("");
  else if (soPhay > 1) chuan = t.split(",").join("");
  else if (soPhay === 1) chuan = t.split(",").join(".");
  const n = Number(chuan);
  return Number.isNaN(n) ? null : n;
}

// ── SOI LẠI ĐƠN GIÁ MỖI M² TRƯỚC KHI ĐĂNG ──────────────────────────────────
// Giá và diện tích đọc riêng lẻ thì ô nào cũng "trông hợp lệ"; chỉ khi chia ra
// đơn giá mới lộ chuyện sai dấu chấm. Đây là cửa chặn cuối, bắt cả lỗi người gõ
// lẫn lỗi máy đọc — không chặn đăng, chỉ báo vàng để mở tin gốc đối chiếu.
// Ngưỡng đo trên 134 tin thật ngày 19/09: nới tới mức KHÔNG kêu oan tin đúng,
// nhưng vẫn tóm được lỗi sai dấu chấm (lệch 1000 lần thì vượt rất xa mọi ngưỡng).
//   · Sàn dưới của thuê để 5 nghìn: đất xưởng/bãi ngoại thành có tin thật
//     "2.000 m² giá 20 triệu/tháng" = 10 nghìn đ/m²/tháng.
//   · Trần của bán để 400 triệu: đất mặt tiền ven biển Đà Nẵng chạm mức này, và
//     tin tiền tỷ như vậy thì ĐÁNG được liếc lại — cảnh báo vàng, không chặn đăng.
const KHOANG_DON_GIA = {
  ban: { thap: 0.3e6, cao: 400e6, ten: "triệu/m²" },   // 0,3 – 400 triệu mỗi m²
  thue: { thap: 5e3, cao: 3e6, ten: "đ/m²/tháng" },    // 5 nghìn – 3 triệu mỗi m² mỗi tháng
};

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
// Kết quả đọc cả file: lỗi chung (đỏ, không đọc được) và cảnh báo chung (vàng,
// vẫn đăng được) — vd file soạn theo BẢN MẪU CŨ nên thiếu hẳn vài cột.
export type KetQuaDoc = { rows: ParsedRow[]; loiChung: string | null; canhBaoChung?: string };

// CỘT CỦA BẢN MẪU HIỆN HÀNH. Thiếu cột nào trong đây nghĩa là file đang soạn trên
// bản mẫu CŨ — cả cột đó sẽ trống trên web mà không ai biết. Đợt 10/09 hỏng một
// phần vì chuyện này: bản mẫu 48 cột không có 3 cột địa chỉ hệ cũ.
const COT_BAN_MOI: { cot: string; ten: string }[] = [
  { cot: COT.phuongXaCu, ten: "địa chỉ hệ cũ" },
  { cot: COT.quanHuyenCu, ten: "địa chỉ hệ cũ" },
  { cot: COT.tinhCu, ten: "địa chỉ hệ cũ" },
  { cot: COT.donGiaThue, ten: "đơn giá thuê theo m²" },
  { cot: COT.nguon, ten: "link tin gốc" },
  { cot: COT.linkAnh, ten: "link ảnh gốc" },
  { cot: COT.ghiChu, ten: "ghi chú" },
];

export function docTinTuCsv(text: string): KetQuaDoc {
  return docTinTuBang(docCsv(text));
}

// Dùng chung cho CSV và Excel (.xlsx) — cả hai đều quy về bảng string[][]
export function docTinTuBang(bang: string[][]): KetQuaDoc {
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

  // FILE SOẠN TRÊN BẢN MẪU CŨ — báo ngay, đừng để đăng xong mới phát hiện mất cột.
  const cotThieu = COT_BAN_MOI.filter((c) => !header.includes(c.cot));
  const tenNhom = [...new Set(cotThieu.map((c) => c.ten))];

  const rows = bang
    .slice(viTriHeader + 1)
    .map((cells, i) => docMotDong(header, cells, viTriHeader + i + 2));
  return {
    rows,
    loiChung: null,
    ...(cotThieu.length
      ? {
          canhBaoChung:
            `File đang theo BẢN MẪU CŨ — thiếu ${cotThieu.length} cột: ` +
            `${cotThieu.map((c) => c.cot).join(", ")} (${tenNhom.join(" · ")}). ` +
            `Tin vẫn đăng được nhưng những mục đó sẽ TRỐNG trên web — tải lại file mẫu mới rồi bảo Cowork nhập theo bản đó.`,
        }
      : {}),
  };
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
  // ── CHUẨN SEO CHO TIÊU ĐỀ & MÔ TẢ (cảnh báo vàng, vẫn đăng được) ───────────
  // Đo 34 tin ngày 10/09: 17 tiêu đề dài trên 80 ký tự (Google cắt mất đuôi) và
  // 26 tiêu đề không có tên phường/xã hoặc tỉnh — mất từ khoá địa phương, đúng
  // thứ Coastal Land mạnh nhất. Thẻ <title> đã được web tự chuẩn hoá, nhưng sửa
  // từ gốc vẫn hơn: tiêu đề là dòng khách đọc trên thẻ tin.
  if (tieuDe && tieuDe.length > 75) canhBao.push(`Tiêu đề dài ${tieuDe.length} ký tự — nên 45–70, Google cắt phần sau`);
  if (tieuDe && /siêu phẩm|sập sàn|giá sốc|cực hot|gấp gấp|[\u{1F300}-\u{1FAFF}☀-➿]/iu.test(tieuDe))
    canhBao.push("Tiêu đề có từ câu khách / biểu tượng cảm xúc — bỏ đi, Google coi là tin rác");
  if (tieuDe && /\b0\d{8,10}\b/.test(tieuDe)) canhBao.push("Tiêu đề có số điện thoại — bỏ khỏi tiêu đề");
  if (moTa.trim().length >= 50 && moTa.trim().length < 300)
    canhBao.push(`Mô tả ${moTa.trim().length} ký tự — dưới 300 Google coi là nội dung mỏng`);
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

  // NHÀ GẮN LIỀN ĐẤT THIẾU DIỆN TÍCH XÂY DỰNG = thiếu MẪU SỐ để tính giá mỗi m²
  // sàn. Không chặn đăng (tin gốc có khi không ghi) nhưng phải báo vàng, vì thiếu
  // nó thì trang tin chỉ ra được giá trên m² đất — con số khác hẳn về ý nghĩa.
  if (loaiHinhChuan && coDienTichXayDung(loaiHinhChuan) && !lay(COT.dienTichXayDung).trim())
    canhBao.push("Thiếu dien_tich_xay_dung — loại hình này cần m² sàn để tính đúng giá mỗi m²");


  const tinhThanh = lay(COT.tinhThanh);
  if (!tinhThanh) loi.push("Thiếu tỉnh/thành");

  // ĐỊA CHỈ HỆ CŨ — báo vàng khi phường mới này gộp NHIỀU phường cũ mà file không
  // chép tên phường cũ. Máy không có cách nào suy ngược ra đúng cái nào (Phường
  // Nha Trang gộp 10 phường cũ), nên thiếu là dòng "Địa chỉ hệ cũ" cụt mất cấp
  // phường vĩnh viễn. Đo 19/09: 41/134 tin cũ đang thiếu vì chưa có cửa chặn này.
  if (!lay(COT.phuongXaCu).trim() && !lay(COT.quanHuyenCu).trim()) {
    const uv = ungVienPhuongCu("moi", tinhThanh, phuongXa);
    if (uv.length)
      canhBao.push(
        `Thiếu phuong_xa_cu — "${phuongXa}" gộp từ ${uv.length} phường/xã cũ ` +
          `(${uv.slice(0, 4).map((x) => x.phuong).join(" · ")}${uv.length > 4 ? "…" : ""}), ` +
          `máy không suy ngược ra được. Tin gốc ghi phường cũ nào thì chép vào.`,
      );
  }

  // SEO ĐỊA PHƯƠNG — tiêu đề nên có tên phường/xã và tỉnh (bỏ tiền tố cấp khi so).
  const trongTieuDe = (s: string) =>
    !!s && chuanHoa(tieuDe).includes(chuanHoa(s.replace(/^(Phường|Xã|Thị trấn|Đặc khu)\s+/i, "")));
  const thieuDiaDanh = [
    phuongXa && !trongTieuDe(phuongXa) ? "phường/xã" : "",
    tinhThanh && !trongTieuDe(tinhThanh) ? "tỉnh/thành" : "",
  ].filter(Boolean);
  if (tieuDe && thieuDiaDanh.length)
    canhBao.push(`Tiêu đề thiếu ${thieuDiaDanh.join(" và ")} — thêm vào để tin ra trong tìm kiếm theo khu vực`);
  // MỤC ĐÍCH PHẢI ĐỌC ĐƯỢC NGAY Ở TIÊU ĐỀ. Khách lướt danh sách chỉ đọc dòng tiêu
  // đề; "Studio The Camellia 30m2 tầng 5" không cho biết bán hay cho thuê, mà đó
  // cũng là cụm từ khoá người tìm gõ vào Google ("bán căn hộ…", "cho thuê nhà…").
  {
    const t = chuanHoa(tieuDe);
    const noiBan = /(^|_)ban(_|$)|chuyen_nhuong|sang_nhuong|can_ban|cat_lo/.test(t);
    const noiThue = /cho_thue|(^|_)thue(_|$)|cho_muon/.test(t);
    if (tieuDe && mucDich === "ban" && !noiBan)
      canhBao.push('Tiêu đề không cho biết là tin BÁN — mở đầu bằng "Bán …" (hoặc "Chuyển nhượng …")');
    if (tieuDe && mucDich === "thue" && !noiThue)
      canhBao.push('Tiêu đề không cho biết là tin CHO THUÊ — mở đầu bằng "Cho thuê …"');
    if (tieuDe && mucDich === "ban" && noiThue && !noiBan)
      canhBao.push("muc_dich ghi BÁN nhưng tiêu đề nói CHO THUÊ — kiểm tra lại cả dòng");
    if (tieuDe && mucDich === "thue" && noiBan && !noiThue)
      canhBao.push("muc_dich ghi CHO THUÊ nhưng tiêu đề nói BÁN — kiểm tra lại cả dòng");
  }

  const dienTichSo = soVN(lay(COT.dienTich));

  // ── KỲ BÁO GIÁ THUÊ ───────────────────────────────────────────────────────
  // Tin gốc báo "150 triệu/quý" hay "1,2 tỷ/năm" thì Cowork chép nguyên con số
  // vào `gia`, ghi kỳ vào `chu_ky_thue`; web chia ra đồng mỗi tháng để bộ lọc
  // khoảng giá và sắp xếp so được với mọi tin khác. Bỏ trống = theo tháng.
  const KY: Record<string, { soThang: number; nhan: string }> = {
    thang: { soThang: 1, nhan: "Theo tháng" },
    quy: { soThang: 3, nhan: "Theo quý" },
    nam: { soThang: 12, nhan: "Theo năm" },
  };
  const chuKyRaw = chuanHoa(lay(COT.chuKyThue));
  const chuKy = KY[chuKyRaw] ?? KY.thang;
  if (chuKyRaw && !KY[chuKyRaw])
    loi.push(`chu_ky_thue "${lay(COT.chuKyThue)}" không hợp lệ (chỉ nhận: thang · quy · nam)`);
  if (chuKyRaw && chuKyRaw !== "thang" && mucDich !== "thue")
    canhBao.push("chu_ky_thue chỉ dùng cho tin CHO THUÊ — đã bỏ qua");
  // Chỉ tin THUÊ mới chia kỳ; tin bán là một lần trả đứt, không có kỳ nào cả.
  const soThang = mucDich === "thue" ? chuKy.soThang : 1;

  // ── GIÁ ───────────────────────────────────────────────────────────────────
  // BÁN nhập theo TỶ · THUÊ nhập theo TRIỆU cho MỘT KỲ (mặc định là tháng).
  // Bỏ trống cả hai cột giá = Thỏa thuận.
  let giaVnd: number | null = null;
  if (lay(COT.gia)) {
    const n = soVN(lay(COT.gia));
    if (n == null) loi.push(`gia "${lay(COT.gia)}" không phải số`);
    else giaVnd = Math.round((n * (mucDich === "thue" ? 1e6 : 1e9)) / soThang);
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
      if (n >= 1000) canhBao.push(`don_gia_thue ghi ${lay(COT.donGiaThue)} — hiểu là ${donGiaThue} nghìn đ/m²/kỳ`);
      giaVnd = Math.round((donGiaThue * 1000 * dienTichSo) / soThang);
      // Đơn giá hiện trên trang tin luôn là đ/m²/THÁNG, nên cũng phải chia kỳ.
      if (soThang > 1) donGiaThue = Math.round((donGiaThue / soThang) * 10) / 10;
    }
  } else if (laGiaTheoM2 && giaVnd != null && dienTichSo) {
    // Chỉ ghi tổng tiền tháng vẫn nhận — tự suy ngược ra đơn giá để trang tin hiện.
    donGiaThue = Math.round((giaVnd / 1000 / dienTichSo) * 10) / 10;
  } else if (laGiaTheoM2 && giaVnd == null) {
    canhBao.push("Kho/xưởng/mặt bằng cho thuê nên có don_gia_thue (ngàn đ/m²/tháng)");
  }

  // CỬA CHẶN CUỐI — chia giá cho diện tích, ra ngoài khoảng hợp lý là báo vàng.
  // Bắt được cả ba tin sai dấu chấm của đợt 19/09 mà từng ô riêng lẻ trông vẫn ổn.
  if (giaVnd != null) {
    const mau = mauSoCuaLoaiHinh(loaiHinhChuan);
    const mauSan = mau === "san" && !coDonGiaM2(loaiHinhChuan, mucDich);
    const dtDonGia = mauSan ? soVN(lay(COT.dienTichXayDung)) : dienTichSo;
    const k = KHOANG_DON_GIA[mucDich];
    if (dtDonGia && dtDonGia > 0) {
      const don = giaVnd / dtDonGia;
      if (don < k.thap || don > k.cao) {
        const hien = mucDich === "thue" ? `${Math.round(don).toLocaleString("vi-VN")} đ` : `${(don / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu`;
        canhBao.push(
          `Đơn giá ra ${hien}/m² — ngoài khoảng thường gặp (${mucDich === "thue" ? "20 nghìn – 3 triệu" : "0,3 – 400 triệu"} ${k.ten}). ` +
            `Kiểm tra lại dấu chấm ở gia / dien_tich: "2.222" web hiểu là 2,222 chứ không phải 2222.`,
        );
      }
    }
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
  // SỐ ĐIỆN THOẠI LÀ BẮT BUỘC — chốt của chủ dự án: đủ 10 chữ số, CÓ SỐ 0 đầu.
  // Không có số thì tin vô dụng (khách không liên hệ được), mà nguy hơn nữa là
  // form admin từng tự điền hồ sơ người đăng nhập vào chỗ trống → số của chủ dự
  // án bị đóng vào tin của khách. Vì vậy chặn ngay ở đây, không cho lên web.
  // ⚠️ Excel hay NUỐT SỐ 0 ĐẦU khi ô để kiểu Số ("0905…" thành 905…) — cũng chặn.
  if (!lay(COT.lienHeSdt).trim()) loi.push("Thiếu số điện thoại người đăng (lien_he_sdt)");
  else if (!sdt) loi.push(`Số điện thoại không đọc được: "${lay(COT.lienHeSdt)}"`);
  else if (sdtLoi.length)
    loi.push(`Số điện thoại phải đủ 10 chữ số và có số 0 đầu — đang ghi: ${sdtLoi.join(" · ")}`);
  const email = lay(COT.lienHeEmail).trim().toLowerCase();

  // ── ĐẶC ĐIỂM THEO LOẠI HÌNH ────────────────────────────────────────────────
  // Mỗi loại hình có bộ mục riêng (listingSpec.ts). CHỈ ghi vào mục mà loại hình
  // đó thật sự có — ghi mục không thuộc loại hình thì trang chi tiết không hiện,
  // chỉ tồn dữ liệu rác. Ba mục điện/nước/vào ở chỉ tồn tại ở tin CHO THUÊ.
  const khoaCoSan = new Set(fieldsFor(loaiHinhChuan, mucDich).map((f) => f.key));
  const specs: Record<string, string> = {};
  // Ô có dữ liệu mà loại hình KHÔNG có mục đó thì trước đây bị bỏ lặng lẽ — Cowork
  // gõ công mà không ai biết là mất. Nay báo vàng kèm TÊN CỘT để sửa cho đúng chỗ.
  const datSpec = (giaTri: string, tenCot: string, ...uuTien: string[]) => {
    const v = giaTri.trim();
    if (!v) return;
    const k = uuTien.find((x) => khoaCoSan.has(x));
    if (k) specs[k] = v;
    else canhBao.push(`Cột "${tenCot}" không thuộc loại hình "${loaiHinhChuan}" — ô này KHÔNG hiện trên trang tin`);
  };
  // Tin gốc báo theo quý/năm thì phải NÓI RA: giá trên web đã quy về mỗi tháng,
  // nhưng người thuê cần biết mình ký và trả một lần theo kỳ nào.
  if (mucDich === "thue" && soThang > 1) datSpec(chuKy.nhan, COT.chuKyThue, "billingCycle");
  datSpec(lay(COT.huongBanCong), COT.huongBanCong, "balcony");
  datSpec(lay(COT.matTien), COT.matTien, "frontage");
  datSpec(lay(COT.duongVao), COT.duongVao, "roadWidth");
  // Nhà/biệt thự/shophouse: "số tầng" là của chính căn nhà. Căn hộ/chung cư
  // không có mục ấy nên hiểu là TỔNG SỐ TẦNG CỦA TOÀ.
  datSpec(lay(COT.soTang), COT.soTang, "floors", "buildingFloors");
  datSpec(lay(COT.chieuDai), COT.chieuDai, "depth");
  datSpec(lay(COT.namXayDung), COT.namXayDung, "builtYear");
  datSpec(lay(COT.tangSo), COT.tangSo, "floor");
  // Kho · nhà xưởng · bãi — bộ đặc điểm riêng, phần lớn là tin CHO THUÊ.
  datSpec(lay(COT.dienTichSuDung), COT.dienTichSuDung, "usableArea");
  datSpec(lay(COT.loaiKho), COT.loaiKho, "khoLoai");
  datSpec(lay(COT.chieuCao), COT.chieuCao, "clearHeight");
  datSpec(lay(COT.taiTrongNen), COT.taiTrongNen, "floorLoad");
  datSpec(lay(COT.congSuatDien), COT.congSuatDien, "power");
  datSpec(lay(COT.pccc), COT.pccc, "pccc");
  datSpec(lay(COT.vanPhongTrongKho), COT.vanPhongTrongKho, "officeArea");
  datSpec(lay(COT.xeContainer), COT.xeContainer, "container");
  // Mọi tin cho thuê
  datSpec(lay(COT.thoiGianVaoO), COT.thoiGianVaoO, "moveIn");
  datSpec(lay(COT.thoiHanThue), COT.thoiHanThue, "minTerm");
  datSpec(lay(COT.tienCoc), COT.tienCoc, "deposit");
  datSpec(lay(COT.giaDien), COT.giaDien, "elecPrice");
  datSpec(lay(COT.giaNuoc), COT.giaNuoc, "waterPrice");

  // ── TIỆN ÍCH · NỘI THẤT · PHÁP LÝ — DỊCH VỀ ĐÚNG TÊN DANH MỤC ─────────────
  // Trang tin chỉ hiện tiện ích/nội thất TRÙNG KHỚP danh mục chuẩn. Ghi "Bảo vệ
  // 24/7" thay vì "An ninh 24/7" là mục đó biến mất, không báo lỗi gì. Ở đây dịch
  // lại; mục thật sự lạ thì GIỮ NGUYÊN (trang tin gom vào nhóm "Tiện ích khác")
  // và báo vàng để chủ dự án biết mà xem.
  const tienIch = lay(COT.tienIch) ? chuanHoaTienIch(tachDanhSach(lay(COT.tienIch))) : [];
  const noiThat = lay(COT.noiThatBanGiao) ? chuanHoaNoiThat(tachDanhSach(lay(COT.noiThatBanGiao))) : [];
  // PHÁP LÝ CHỐT THEO LOẠI HÌNH — đất chỉ sổ đỏ, căn hộ chỉ sổ hồng. Tin gốc ghi
  // mập mờ "sổ đỏ/sổ hồng" thì loại hình tự chốt hộ; ghi sai hẳn loại giấy thì
  // báo vàng để người duyệt mở tin gốc xem lại, chứ không lặng lẽ đăng ra.
  const phapLy = chuanHoaPhapLy(lay(COT.phapLy), loaiHinhChuan);
  if (phapLyLechLoaiHinh(lay(COT.phapLy), loaiHinhChuan))
    canhBao.push(`phap_ly "${lay(COT.phapLy)}" không đúng với loại hình "${loaiHinhChuan}" — đất chỉ có sổ đỏ, căn hộ chỉ có sổ hồng`);
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
    built_area_m2: soHoacNull(lay(COT.dienTichXayDung), "dien_tich_xay_dung"),
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
      // ĐỊA CHỈ HỆ CŨ NGUYÊN VĂN — trang tin ưu tiên dòng này thay vì suy ngược.
      ...(lay(COT.phuongXaCu) || lay(COT.quanHuyenCu) || lay(COT.tinhCu)
        ? {
            diaChiCu: {
              phuong: lay(COT.phuongXaCu) || undefined,
              quan: lay(COT.quanHuyenCu) || undefined,
              tinh: lay(COT.tinhCu) || undefined,
            },
          }
        : {}),
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
      ...((): { donGiaBan?: number } => {
        // Chỉ nhận khi tin gốc CÓ ghi — không suy từ tổng giá.
        const n = soVN(lay(COT.donGiaBan));
        if (n == null) return {};
        return { donGiaBan: Math.round(n * 1e6) };
      })(),
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
