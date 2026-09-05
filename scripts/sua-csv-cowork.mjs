// ============================================================================
// SỬA FILE CSV CỦA COWORK TRƯỚC KHI NHẬP LÊN WEB
//   • Cột mo_ta bị dán thành MỘT ĐOẠN DÀI  → chèn lại xuống dòng/gạch đầu dòng
//   • Số bị chèn dấu cách sau dấu chấm ("2. 000m2", "11. 5 tỷ") → dán liền lại
// CHỈ THÊM/BỚT KHOẢNG TRẮNG, không đổi chữ. Máy tự kiểm rồi mới ghi.
//
// Dùng:  node scripts/sua-csv-cowork.mjs "<đường dẫn file .csv>"
// Kết quả: file mới cùng thư mục, thêm đuôi "-DA-SUA.csv" (file gốc giữ nguyên).
// ============================================================================
import { readFileSync, writeFileSync } from "node:fs";
import { suaXuongDong } from "./sua-xuong-dong-tin.mjs";

const nguon = process.argv[2];
if (!nguon) { console.error("Thiếu đường dẫn file CSV."); process.exit(1); }

function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some((x) => x.trim() !== "")) rows.push(row); row = []; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); if (row.some((x) => x.trim() !== "")) rows.push(row); }
  return rows;
}
const toCsv = (rows) =>
  rows.map((r) => r.map((c) => (/[",\n\r]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c)).join(",")).join("\r\n");

// Số bị vỡ: "2. 000m2" → "2.000m2" (hàng nghìn) · "11. 5 tỷ" → "11.5 tỷ" (thập phân)
const vaSo = (s) =>
  s
    .replace(/(\d)\.\s+(\d{3})(?!\d)/g, "$1.$2")
    .replace(/(\d)\.\s+(\d{1,2})\s*(tỷ|tỉ|triệu|m2|m²|ha|km)\b/giu, "$1.$2 $3");

const rows = parseCsv(readFileSync(nguon, "utf8"));
const head = rows[0];
const iMo = head.indexOf("mo_ta");
if (iMo < 0) { console.error("File không có cột mo_ta."); process.exit(1); }

const gon = (s) => (s || "").replace(/\s+/g, " ").trim();
let sua = 0, soVa = 0, boQua = 0;
for (let i = 1; i < rows.length; i++) {
  const cu = rows[i][iMo] || "";
  let moi = suaXuongDong(cu);
  const sauVaSo = vaSo(moi);
  if (sauVaSo !== moi) { soVa++; moi = sauVaSo; }
  // Kiểm: bỏ hết khoảng trắng thì hai bản phải y hệt nhau
  if (gon(moi).replace(/\s/g, "") !== gon(cu).replace(/\s/g, "")) { boQua++; continue; }
  if (moi !== cu) { rows[i][iMo] = moi; sua++; }
}

const dich = nguon.replace(/\.csv$/i, "") + "-DA-SUA.csv";
writeFileSync(dich, "\uFEFF" + toCsv(rows), "utf8");
console.log(`Tổng tin: ${rows.length - 1} · đã sửa xuống dòng: ${sua} · vá số bị vỡ: ${soVa} · bỏ qua (không an toàn): ${boQua}`);
console.log("File mới:", dich);
