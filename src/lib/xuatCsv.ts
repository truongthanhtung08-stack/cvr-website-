// Xuất / đọc tệp CSV mở được bằng Excel — để chủ dự án tự làm báo cáo thống kê
// và nhập số hàng loạt mà không phải vào Supabase gõ lệnh.
//
// HAI THỨ BẮT BUỘC, thiếu một cái là Excel mở ra lỗi hết (đã dính 11/9/2026):
//
//   1. DẤU BOM ở đầu tệp. Thiếu nó Excel đọc tiếng Việt thành ký tự lạ
//      ("Huáº¿", "Ä'à Náºµng") — mở ra là bỏ luôn không dùng được.
//
//   2. PHÂN CÁCH BẰNG DẤU CHẤM PHẨY + dòng "sep=;" ở đầu. Windows cài vùng Việt
//      Nam dùng dấu phẩy làm dấu thập phân, nên CSV phân cách bằng dấu phẩy bị
//      Excel dồn hết vào MỘT cột. Dòng "sep=;" ép Excel tách đúng, không hỏi gì.
//      Giá viết "78,5" kiểu Việt Nam nhờ đó cũng vào đúng ô số.
//
// Đọc vào thì ngược lại: chấp nhận cả ";" lẫn "," lẫn tab, vì tệp có thể do
// người khác xuất ra bằng máy cài vùng khác.

const SEP = ";";

function oCsv(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.split('"').join('""')}"` : s;
}

/** Nội dung một tệp CSV hoàn chỉnh (kèm BOM + dòng sep) — dùng chung cho tải về
 *  trên trình duyệt và sinh tệp mẫu lúc build. */
export function noiDungCsv(cot: string[], dong: unknown[][]): string {
  const than = [cot.map(oCsv).join(SEP), ...dong.map((d) => d.map(oCsv).join(SEP))].join("\r\n");
  return `﻿sep=${SEP}\r\n${than}\r\n`;
}

export function taiCsv(tenFile: string, cot: string[], dong: unknown[][]): void {
  const blob = new Blob([noiDungCsv(cot, dong)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = tenFile;
  a.click();
  URL.revokeObjectURL(url);
}

/** Đoán dấu phân cách của dòng tiêu đề: cái nào xuất hiện nhiều nhất thì thắng. */
function doPhanCach(dongDau: string): string {
  let tot = ",";
  let nhieuNhat = 0;
  for (const s of [";", ",", "\t"]) {
    const n = dongDau.split(s).length - 1;
    if (n > nhieuNhat) {
      nhieuNhat = n;
      tot = s;
    }
  }
  return tot;
}

/**
 * Đọc cả tệp CSV thành bảng. Tự bỏ BOM, tự bỏ dòng "sep=;", tự đoán phân cách,
 * tôn trọng dấu nháy kép bao quanh ô có chứa dấu phân cách.
 */
export function tachBangCsv(text: string): string[][] {
  const dong = text
    .split(/\r?\n/)
    .map((d, i) => (i === 0 ? d.replace(/^﻿/, "") : d))
    .filter((d) => d.trim() && !/^sep=.$/i.test(d.trim()));
  if (!dong.length) return [];

  const sep = doPhanCach(dong[0]);
  return dong.map((d) => {
    const o: string[] = [];
    let hienTai = "";
    let trongNhay = false;
    for (let i = 0; i < d.length; i++) {
      const c = d[i];
      if (c === '"') {
        if (trongNhay && d[i + 1] === '"') {
          hienTai += '"';
          i++;
        } else trongNhay = !trongNhay;
      } else if (c === sep && !trongNhay) {
        o.push(hienTai.trim());
        hienTai = "";
      } else hienTai += c;
    }
    o.push(hienTai.trim());
    return o;
  });
}

/** Ngày hôm nay dạng 2026-09-11 — gắn vào tên tệp cho khỏi lẫn các lần tải. */
export function homNay(): string {
  return new Date().toISOString().slice(0, 10);
}
