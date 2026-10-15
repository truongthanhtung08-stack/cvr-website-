// ============================================================================
// SỐ ĐIỆN THOẠI VIỆT NAM — MỘT CÁCH GHI DUY NHẤT CHO CẢ HỆ THỐNG
// ----------------------------------------------------------------------------
// Chuẩn đã chốt: **10 chữ số, có số 0 phía trước** — `0905123456`.
// Cùng một hàm này dùng ở CẢ HAI PHÍA nên file của Cowork, ô nhập trong admin và
// số hiện trên trang tin không bao giờ lệch nhau:
//   · lúc NHẬP  — csvTin.ts (file hàng loạt) · ListingForm · PostListingForm
//   · lúc HIỆN  — trang chi tiết tin · nút gọi · nút Zalo
//
// Người đăng gõ đủ kiểu: "0905.123.456" · "0905 123 456" · "+84 905 123 456" ·
// "84905123456" · "905123456" — và rất hay gõ HAI SỐ TRONG MỘT Ô:
// "0707.435.555 / 0918.339.739". Tất cả phải ra đúng một chuỗi số.
// ============================================================================

// Một chuỗi CHỈ chứa một số → dạng "0…" chỉ gồm chữ số.
// Số cố định 11 chữ số (0236 3825 888) giữ nguyên độ dài — KHÔNG ép về 10.
function chiSo(s: string): string {
  let d = (s ?? "").replace(/[^0-9]/g, "");
  if (!d) return "";
  // Mã quốc gia: "0084…" hoặc "84…". Cẩn thận đầu số 084 (Vinaphone) — số đó đã
  // bắt đầu bằng 0 nên không rơi vào nhánh này.
  if (d.startsWith("0084")) d = d.slice(4);
  else if (d.startsWith("84") && d.length >= 11) d = d.slice(2);
  if (!d.startsWith("0")) d = "0" + d;
  return d;
}

// Cắt một ô thành từng số riêng. Người ta ngăn nhau bằng | ; , / xuống dòng,
// gạch ngang có khoảng trắng hai bên, hoặc hai khoảng trắng liền.
// KHÔNG cắt ở khoảng trắng đơn — "0905 123 456" là MỘT số.
function tachPhan(raw: string): string[] {
  return (raw ?? "")
    .split(/[|;,\n/]+|\s+-\s+|\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const hopLe = (s: string) => s.length >= 10 && s.length <= 11;

// Một phần dính nhiều số không có dấu ngăn tách được ("0963453368-0787223223",
// "0905123456 0918123456") → cắt dãy chữ số thành từng khúc 10 số, mỗi khúc phải
// bắt đầu bằng 0. Không cắt đều được thì trả rỗng — không đoán.
function catDinh(phan: string): string[] {
  const d = phan.replace(/[^0-9]/g, "");
  if (d.length < 20 || d.length % 10) return [];
  const ds = d.match(/.{10}/g) ?? [];
  return ds.every((s) => s.startsWith("0")) ? ds : [];
}

// Mọi số trong một ô, theo thứ tự người đăng ghi.
function moiSo(raw: string): string[] {
  return tachPhan(raw).flatMap((p) => {
    const s = chiSo(p);
    return hopLe(s) ? [s] : catDinh(p);
  });
}

// Chuẩn hoá một ô → SỐ ĐẦU TIÊN hợp lệ trong ô đó.
// Ô có hai số ("0707.435.555 / 0918.339.739") thì lấy số đầu, TUYỆT ĐỐI không
// dán hai số vào nhau thành một chuỗi 20 chữ số.
// Không tìm được số nào ra hồn thì TRẢ LẠI NGUYÊN VĂN — thà hiện đúng thứ người
// đăng ghi, còn hơn bịa ra một dãy số không gọi được cho ai.
export function chuanHoaSdt(raw: string): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  const dau = moiSo(t)[0];
  if (dau) return dau;
  const gop = chiSo(t);
  return hopLe(gop) ? gop : t;
}

// Đúng chuẩn di động Việt Nam chưa: 10 chữ số, bắt đầu bằng 0.
export function laSdtVN(s: string): boolean {
  return /^0[0-9]{9}$/.test(chuanHoaSdt(s));
}

// Tách một ô có NHIỀU số thành danh sách đã chuẩn hoá, bỏ trùng.
// Dùng khi cần giữ ĐỦ số của người đăng (chìa khoá ghép tin về đúng tài khoản
// khách sau này — khách hay có 2 số).
export function tachNhieuSdt(o: string): string[] {
  const ds = [...new Set(moiSo(o))];
  if (ds.length) return ds;
  // Cắt theo dấu ngăn mà không ra số nào — người nhập dùng dấu phẩy làm dấu phân
  // nhóm ("0905,123,456"). Gộp cả ô lại thử một lần nữa, đừng để mất số.
  const gop = chiSo(o);
  return hopLe(gop) ? [gop] : [];
}

// MÃ NGƯỜI ĐĂNG — băm một chiều (djb2) từ SĐT đã chuẩn hoá. Dùng để nhận ra cùng một người đăng
// (tin trùng, gom hồ sơ chuyên gia) mà không đưa số điện thoại ra trình duyệt.
export function maNguoiTuSdt(so: string): string {
  let h = 5381;
  for (let i = 0; i < so.length; i++) h = ((h << 5) + h + so.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
