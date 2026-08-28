// ════════════════════════════════════════════════════════════════════════════
// ĐỌC HÓA ĐƠN NƯỚC NGOÀI (PDF) → RA SỐ LIỆU KHAI THUẾ NHÀ THẦU
//
// Anthropic, Vercel, Supabase đều phát hành hóa đơn qua Stripe nên bố cục và
// NHÃN CHỮ giống hệt nhau. Vì vậy bắt theo nhãn của Stripe là ăn cả ba:
//     Invoice number   PYYF4T6M-0008
//     Date of issue    August 18, 2026
//     Amount paid      $22.22
//
// Chỉ nhận diện chữ, KHÔNG đoán mò: đọc không ra ô nào thì để trống và ghi
// cảnh báo, để người nhập tự điền. Số liệu này đi thẳng vào tờ khai thuế —
// đoán sai còn tệ hơn bỏ trống.
//
// Hàm này chỉ xử lý CHUỖI VĂN BẢN. Việc bóc chữ khỏi file PDF do pdfjs làm ở
// trang admin (chạy trong trình duyệt, file không rời máy).
// ════════════════════════════════════════════════════════════════════════════

import { NCC_DA_BIET } from "./thueNhaThau";

export type HoaDonNgoaiDoc = {
  nha_cung_cap: string;
  so_hoa_don: string | null;
  /** yyyy-mm-dd, null nếu không đọc được. */
  ngay_hoa_don: string | null;
  tien: number;
  /** Mã tiền tệ đọc được — không phải USD thì phải cảnh báo, tỷ giá đang tính theo USD. */
  tienTe: string;
  /**
   * Trên hóa đơn có dấu hiệu nhà cung cấp ĐÃ đăng ký thuế tại Việt Nam
   * (ghi mã số thuế VN, hoặc có dòng thu thuế GTGT Việt Nam) → Nhóm 1,
   * KHÔNG khai nộp thay. Đây là bằng chứng mạnh hơn danh sách đoán theo tên.
   */
  daDangKyVn: boolean;
  /** Mã số thuế VN của nhà cung cấp nước ngoài đọc được (nếu có). */
  mstVn: string | null;
  /** Những gì không chắc — hiện lên cho người nhập soát lại. */
  canhBao: string[];
};

const THANG: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

function iso(nam: number, thang: number, ngay: number): string | null {
  if (thang < 1 || thang > 12 || ngay < 1 || ngay > 31) return null;
  return `${nam}-${String(thang).padStart(2, "0")}-${String(ngay).padStart(2, "0")}`;
}

/** Đọc một ngày kiểu Anh: "August 18, 2026" · "18 Aug 2026" · "2026-08-18". */
function docNgay(s: string): string | null {
  const t = s.trim();

  const m1 = t.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (m1) {
    const th = THANG[m1[1].toLowerCase()];
    if (th) return iso(Number(m1[3]), th, Number(m1[2]));
  }

  const m2 = t.match(/(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{4})/);
  if (m2) {
    const th = THANG[m2[2].toLowerCase()];
    if (th) return iso(Number(m2[3]), th, Number(m2[1]));
  }

  const m3 = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m3) return iso(Number(m3[1]), Number(m3[2]), Number(m3[3]));

  return null;
}

/**
 * Đọc số tiền, chịu được cả 3 kiểu viết:
 *   Mỹ        "$1,234.56"   → 1234.56
 *   Châu Âu   "1.234,56"    → 1234.56
 *   Việt Nam  "578.000 ₫"   → 578000      ← Google/Facebook xuất kiểu này
 *
 * Quy tắc: có cả chấm lẫn phẩy thì dấu ĐỨNG SAU là dấu thập phân. Chỉ có một
 * loại dấu thì đếm số chữ số phía sau dấu cuối cùng — đúng 3 chữ số là dấu ngăn
 * nghìn ("1.234" = một nghìn hai trăm ba tư), 1–2 chữ số mới là thập phân
 * ("22.22" = hai hai phẩy hai hai).
 */
function docTien(s: string): number {
  const t = s.replace(/[^\d.,]/g, "");
  if (!t) return 0;

  const cham = t.lastIndexOf(".");
  const phay = t.lastIndexOf(",");
  let chuan: string;

  if (cham >= 0 && phay >= 0) {
    chuan = phay > cham ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (cham >= 0 || phay >= 0) {
    const dau = cham >= 0 ? "." : ",";
    const viTri = Math.max(cham, phay);
    const soDauSau = t.length - viTri - 1;
    const nhieuDau = (t.match(dau === "." ? /\./g : /,/g) ?? []).length > 1;
    // Nhiều dấu, hoặc đúng 3 chữ số phía sau → dấu ngăn nghìn, bỏ hết.
    chuan = nhieuDau || soDauSau === 3
      ? t.replace(/[.,]/g, "")
      : t.replace(/[.,]/g, ".");
  } else {
    chuan = t;
  }

  const n = Number(chuan);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Bóc số liệu từ toàn bộ chữ của một file hóa đơn PDF.
 *
 * @param vanBan Chữ đã lấy khỏi PDF, các mảnh nối bằng dấu cách.
 */
export function docHoaDonNgoai(vanBan: string): HoaDonNgoaiDoc {
  // pdfjs trả về nhiều mảnh rời; ép về một dòng để bắt nhãn "Invoice number" và
  // giá trị của nó dù chúng nằm khác dòng trong bản gốc.
  //
  // ⚠️ Dọn KÝ TỰ ĐIỀU KHIỂN trước khi ép dòng. Hóa đơn thật của Anthropic có
  // bảng ánh xạ phông làm dấu gạch nối rơi thành NUL (U+0000): "PYYF4T6M-0008"
  // bóc ra là "PYYF4T6M   0008". NUL không phải khoảng trắng nên mọi biểu
  // thức dùng \s đều trượt, số hóa đơn cụt mất đuôi. Đổi hết về khoảng trắng.
  const t = vanBan.replace(/[\u0000-\u001F]/g, " ").replace(/\s+/g, " ").trim();
  const canhBao: string[] = [];

  // ── Nhà cung cấp ────────────────────────────────────────────────────────
  const thap = t.toLowerCase();
  const biet = NCC_DA_BIET.find((n) => thap.includes(n.khoa));
  let nha_cung_cap = biet?.ten ?? "";
  if (!nha_cung_cap) {
    // Không nhận ra tên quen → lấy cụm chữ đầu tiên, coi như tên người bán.
    nha_cung_cap = t.split(" ").slice(0, 4).join(" ").slice(0, 60);
    canhBao.push("Không nhận ra nhà cung cấp — kiểm tra lại tên");
  }

  // ── Số hóa đơn ──────────────────────────────────────────────────────────
  // ⚠️ Nhóm bắt thứ hai KHÔNG thừa. Dấu gạch nối trong PDF của Anthropic không
  // phải ký tự chữ nên pdfjs làm rơi mất, "PYYF4T6M-0008" bóc ra thành
  // "PYYF4T6M   0008". Thiếu đuôi thì chống trùng hỏng và số trên tờ khai sai.
  // Vì vậy: bắt phần đầu, rồi nếu ngay sau đó là một cụm 3–6 chữ số thì nối lại.
  const mSo =
    t.match(/Invoice\s*(?:number|no\.?|#)\s*:?\s*([A-Z0-9][A-Z0-9\-–—]{2,})(?:\s+(\d{3,6})\b)?/i) ??
    t.match(/Receipt\s*(?:number|no\.?|#)\s*:?\s*([A-Z0-9][A-Z0-9\-–—]{2,})(?:\s+(\d{3,6})\b)?/i);
  const soHd = mSo
    ? mSo[1].replace(/[–—]/g, "-") + (mSo[2] ? "-" + mSo[2] : "")
    : null;
  if (!soHd) canhBao.push("Không đọc được số hóa đơn");

  // ── Ngày ────────────────────────────────────────────────────────────────
  // Ưu tiên ngày phát hành, hết mới tới ngày thanh toán.
  //
  // Cắt một ĐOẠN NGẮN ngay sau nhãn rồi mới dò ngày trong đó, KHÔNG bắt ngày
  // thẳng bằng một biểu thức dài: hóa đơn ghi "Date of issue 2026-09-05" thì
  // kiểu bắt dài sẽ tóm nhầm cụm "2026" rồi dừng, ra ngày rỗng.
  const NHAN_NGAY = [/Date of issue/i, /Invoice date/i, /Issue date/i, /Payment date/i, /Date paid/i];
  let ngay_hoa_don: string | null = null;
  for (const nhan of NHAN_NGAY) {
    const m = t.match(nhan);
    if (!m || m.index === undefined) continue;
    const doan = t.slice(m.index + m[0].length, m.index + m[0].length + 32);
    ngay_hoa_don = docNgay(doan);
    if (ngay_hoa_don) break;
  }
  // Không có nhãn nào khớp thì lấy ngày đầu tiên xuất hiện trong cả tờ.
  if (!ngay_hoa_don) ngay_hoa_don = docNgay(t);
  if (!ngay_hoa_don) canhBao.push("Không đọc được ngày hóa đơn");

  // ── Số tiền ─────────────────────────────────────────────────────────────
  // "Amount paid" là số đã thực trả — đúng thứ cần cho thuế nhà thầu.
  // "Total" có thể là tổng trước khi trừ credit, nên xếp sau.
  const cumTien =
    t.match(/Amount paid\s*:?\s*([^\s]*\s?[\d.,]+)/i)?.[1] ??
    t.match(/Amount due\s*:?\s*([^\s]*\s?[\d.,]+)/i)?.[1] ??
    t.match(/Total\s*:?\s*([^\s]*\s?[\d.,]+)/i)?.[1] ??
    "";
  const tien = docTien(cumTien);
  if (!(tien > 0)) canhBao.push("Không đọc được số tiền");

  // ── Tiền tệ ─────────────────────────────────────────────────────────────
  // VNĐ xét TRƯỚC: Google/Facebook đã đăng ký thuế tại VN nên xuất hóa đơn bằng
  // VNĐ. Gặp loại này thì khỏi quy đổi, tỷ giá để 1.
  let tienTe = "";
  if (/₫|VND|VNĐ|đồng/i.test(cumTien) || /\bVND\b/.test(t)) tienTe = "VND";
  else if (/\$|USD/i.test(cumTien) || /\bUSD\b/.test(t)) tienTe = "USD";
  else if (/€|EUR/i.test(cumTien)) tienTe = "EUR";
  else if (/£|GBP/i.test(cumTien)) tienTe = "GBP";
  else {
    tienTe = "USD";
    canhBao.push("Không thấy ghi loại tiền — đang tạm hiểu là USD, kiểm tra lại");
  }
  if (tienTe !== "USD" && tienTe !== "VND") {
    canhBao.push(`Hóa đơn ghi ${tienTe} — phải tự quy đổi sang USD hoặc VNĐ rồi nhập tay`);
  }

  // ── Đã đăng ký thuế tại Việt Nam chưa? ──────────────────────────────────
  // Nhà cung cấp nước ngoài có đăng ký với Cục Thuế thì TỰ thu và TỰ nộp thuế
  // GTGT Việt Nam — mình KHÔNG khai nộp thay nữa, khai là nộp trùng.
  // Hóa đơn của họ luôn để lại dấu vết: mã số thuế VN (10 số, bắt đầu bằng 9)
  // và/hoặc một dòng thu thuế GTGT Việt Nam.
  //   Ví dụ thật (Anthropic, hóa đơn PYYF4T6M-0008 ngày 17/08/2026):
  //     "VAT Registration  Vietnam VAT  9000020034"
  //     "VAT - Vietnam  10% on $20.00  $2.22"
  // Chỉ nhận mã số thuế khi nó ĐỨNG CẠNH chữ VAT/Tax — bắt trơ một cụm 10 số
  // bắt đầu bằng 9 sẽ dính nhầm số hóa đơn của nhà cung cấp khác.
  const mstVn =
    t.match(/Vi(?:e|ệ)tnam\s*(?:VAT|Tax)[^0-9]{0,20}(9\d{9})/i)?.[1] ??
    t.match(/(?:VAT|Tax)\s*(?:Registration|ID|number)?[^0-9]{0,30}(9\d{9})/i)?.[1] ??
    null;
  const coThueVn = /VAT\s*[-–]\s*Vi(?:e|ệ)tnam/i.test(t) || /Vi(?:e|ệ)tnam\s*VAT/i.test(t);
  const daDangKyVn = Boolean(mstVn) || coThueVn;
  if (daDangKyVn) {
    canhBao.push(
      `Hóa đơn ghi nhà cung cấp đã đăng ký thuế tại VN${mstVn ? ` (MST ${mstVn})` : ""} — KHÔNG khai nộp thay, đã tự xếp Nhóm 1`,
    );
  }

  return { nha_cung_cap, so_hoa_don: soHd, ngay_hoa_don, tien, tienTe, daDangKyVn, mstVn, canhBao };
}
