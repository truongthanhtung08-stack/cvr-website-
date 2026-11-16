// CHÉP NGUYÊN từ web src/lib/docSo.ts (16/11/2026) — Mini App là gói riêng, không nhập được mã web. Sửa luật bên web thì chép lại tệp này.
// ĐỌC SỐ NGƯỜI VIỆT GÕ — MỘT HÀM cho cả web (anh 16/11/2026: "7,9 hay 7.9 đều phải đọc được, kể cả số thập phân phía sau").
// Trước đây mỗi nơi tự đọc: chỗ coi dấu chấm là dấu nghìn ("7.9 tỷ" → 79 tỷ — tin 160d2c5a bị báo nhầm giá), chỗ coi là thập phân.
//   "7,9" · "7.9" · "7,95" · "0.5"      → thập phân
//   "1.500" · "1,500" · "12.000.000"     → dấu nghìn (đúng 3 chữ số sau mỗi dấu)   — trừ khi nghin3: false
//   "1.234,5" · "1,234.5"                → dấu sau cùng là thập phân, dấu kia là nghìn
// nghin3: false — ô nhập đã ghi rõ đơn vị (Giá bán TỶ đồng, Diện tích m²…): một dấu duy nhất luôn là thập phân ("7.900" tỷ = 7,9 tỷ).
export function docSo(v: unknown, { nghin3 = true }: { nghin3?: boolean } = {}): number {
  const s = String(v ?? "").trim().replace(/\s/g, "");
  const m = s.match(/-?\d[\d.,]*/);
  if (!m) return Number.NaN;
  let t = m[0].replace(/[.,]$/, "");
  const cham = t.lastIndexOf("."), phay = t.lastIndexOf(",");
  if (cham >= 0 && phay >= 0) {
    const thapPhan = cham > phay ? "." : ",";
    t = t.split(thapPhan === "." ? "," : ".").join("").replace(",", ".");
  } else if (cham >= 0 || phay >= 0) {
    const dau = cham >= 0 ? "." : ",";
    const phan = t.split(dau);
    const laNghin = phan.length > 2 || (nghin3 && phan[1].length === 3 && phan[0].replace("-", "").length <= 3);
    t = laNghin ? phan.join("") : phan.join(".");
  }
  return Number(t);
}
