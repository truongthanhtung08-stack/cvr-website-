// ============================================================================
// KIỂM NỘI DUNG MỘT ĐỢT TIN — máy soát thay chủ dự án, chỉ đưa ra tin CẦN XEM
// ----------------------------------------------------------------------------
// Chủ dự án 19/10/2026: "quá nhiều nội dung, không thể kiểm từng cái — đảm bảo sao tôi chỉ cần
// xem qua". Chạy ở bước 3 quy trình 3 bên (sau "Cowork xong"), trước khi chủ dự án xem.
//
//   node scripts/kiem-noi-dung-dot.mjs "D:/Coastal Land/SEO/DA-DUYET/17102026"
//
// Đọc bảng bằng ĐÚNG bộ kiểm của web (src/lib/csvTin.ts). Soát từng tin:
//   ① con số trong tiêu đề / mô tả phải KHỚP cột (giá, diện tích, phòng ngủ) — lệch là dấu hiệu bịa / chép nhầm
//   ② từ cấm (câu khách, giọng AI, "chúng tôi bán"), biểu tượng cảm xúc, số điện thoại / link trong chữ
//   ③ bố cục mô tả (≥ 300 ký tự, chia đoạn), tiêu đề (mở đầu Bán / Cho thuê, ≤ 60 ký tự, không viết hoa cả câu)
//   ④ giá mỗi m² bất thường so với tin cùng tỉnh + loại hình đang có trên web (dưới 1/3 hoặc trên 3 lần giá giữa)
//   ⑤ ghi chú Cowork cần gọi xác nhận / nghi vấn
// Ghi kết quả vào <thư mục>/CAN-ANH-XEM.txt — chỉ những tin có vấn đề, mỗi tin một dòng lý do.
// Chỉ ĐỌC dữ liệu web (1 lần đọc bảng tin để lấy giá giữa) — không ghi gì lên web.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const thuMuc = process.argv[2];
if (!thuMuc || !fs.existsSync(thuMuc)) { console.error("Cần đường dẫn thư mục đợt tin"); process.exit(1); }
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { docTinTuBang, docTinTuCsv } = await jiti.import(ROOT + "/src/lib/csvTin.ts");
const { docXlsx } = await jiti.import(ROOT + "/src/lib/docXlsx.ts");

const tepBang = fs.readdirSync(thuMuc).find((f) => /^Bang-.*\.(xlsx|csv)$/i.test(f));
if (!tepBang) { console.error("Không thấy Bang-*.xlsx / .csv"); process.exit(1); }
const duong = path.join(thuMuc, tepBang);
const kq = /\.xlsx$/i.test(tepBang)
  ? docTinTuBang(await docXlsx(new Uint8Array(fs.readFileSync(duong)).buffer))
  : docTinTuCsv(fs.readFileSync(duong, "utf8"));
const rows = kq.rows.filter((r) => r.maAnh);

// Giá giữa mỗi m² theo tỉnh + loại hình + mua/thuê, từ tin đang hiện trên web
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)
  .filter((l) => l.includes("=") && !l.startsWith("#"))
  .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const K = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const web = await (await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listings?select=province,type,purpose,price_vnd,area_m2&status=eq.approved&limit=3000`,
  { headers: { apikey: K, Authorization: `Bearer ${K}` } })).json();
const giaM2 = (x) => (x.price_vnd > 0 && x.area_m2 > 0 ? x.price_vnd / x.area_m2 : null);
const khoa = (tinh, loai, muc) => `${tinh}|${loai}|${muc === "thue" ? "thue" : "ban"}`;
const nhom = {};
for (const x of Array.isArray(web) ? web : []) { const g = giaM2(x); if (g) (nhom[khoa(x.province, x.type, x.purpose)] ??= []).push(g); }
const giua = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };

// Con số trong chữ
const so = (s) => Number(String(s).replace(/\./g, "").replace(",", "."));
// Bỏ số không phải giá tổng: đơn giá ("120 triệu/m²"), tiền giảm / cọc / phí / hoa hồng / thu nhập, giá thuê kèm
// (đo 19/10 trên đợt 17/10: "Đơn giá: 120 triệu/m²", "đã giảm 120 triệu" từng bị báo nhầm).
// "tr" phải là chữ đứng riêng — "287 Trần Hưng Đạo", "51 Trần Bạch Đằng" không phải 287 / 51 triệu.
const DV = "(?![\\p{L}\\d])";
const boNgu = (t) => t
  .replace(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(tỷ|ty|triệu|tr)${DV}\\s*\\/\\s*(m²|m2)`, "giu"), " ")
  .replace(new RegExp(`(giảm|bớt|cọc|đặt cọc|phí|quản lý|điện|nước|hoa hồng|thu nhập|doanh thu|lợi nhuận|chiết khấu|hỗ trợ|vay|trả trước|thanh toán trước)[^.\\n]{0,25}?\\d+(?:[.,]\\d+)?\\s*(tỷ|ty|triệu|tr)${DV}`, "giu"), " ");
const tyTrongChu = (t) => [...boNgu(t).matchAll(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(tỷ|ty)${DV}`, "giu"))].map((m) => so(m[1]) * 1e9);
const trieuTrongChu = (t) => [...boNgu(t).matchAll(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(triệu|tr)${DV}`, "giu"))].map((m) => so(m[1]) * 1e6);
const m2TrongChu = (t) => [...t.matchAll(/(\d+(?:[.,]\d+)?)\s*(m²|m2)\b/gi)].map((m) => so(m[1]));
const pnTrongChu = (t) => [...t.matchAll(/(\d+)\s*(pn|phòng ngủ)\b/gi)].map((m) => Number(m[1]));
const gan = (a, b, tl = 0.02) => Math.abs(a - b) <= Math.max(1, Math.abs(b) * tl);

const CAM = /siêu phẩm|sập sàn|giá sốc|cực hot|gấp gấp|cơ hội vàng|hãy cùng|tóm lại|chúng tôi (bán|có|nhận)|liên hệ (ngay|chúng tôi)|nhận đặt chỗ|không thể bỏ lỡ|đẳng cấp thượng lưu|[\u{1F300}-\u{1FAFF}☀-➿]/iu;
const ra = [];
for (const r of rows) {
  const p = r.payload || {};
  const t = String(p.title || ""), d = String(p.description || ""), ly = [];
  for (const l of r.loi || []) ly.push(`LỖI: ${l}`);
  // ① khớp số
  const gia = Number(p.price_vnd) || 0;
  const giaChu = [...tyTrongChu(t + " " + d), ...trieuTrongChu(t + " " + d)].filter((v) => v >= 1e8 || p.purpose === "thue");
  if (gia && giaChu.length && !giaChu.some((v) => gan(v, gia))) ly.push(`giá trong chữ (${giaChu.map((v) => v >= 1e9 ? v / 1e9 + " tỷ" : v / 1e6 + " triệu").join(", ")}) khác cột giá (${gia >= 1e9 ? gia / 1e9 + " tỷ" : gia / 1e6 + " triệu"})`);
  const dt = Number(p.area_m2) || 0, dtChu = m2TrongChu(t + " " + d);
  if (dt && dtChu.length && !dtChu.some((v) => gan(v, dt, 0.01))) ly.push(`diện tích trong chữ (${[...new Set(dtChu)].join(", ")} m²) khác cột (${dt} m²)`);
  const pn = Number(p.beds) || 0, pnChu = pnTrongChu(t + " " + d);
  if (pn && pnChu.length && !pnChu.includes(pn)) ly.push(`số phòng ngủ trong chữ (${[...new Set(pnChu)].join(", ")}) khác cột (${pn})`);
  // ② từ cấm, số điện thoại, link
  const cam = (t + " " + d).match(CAM); if (cam) ly.push(`có từ cấm "${cam[0]}"`);
  if (/(0\d{9})|https?:\/\/|www\./i.test(t + " " + d)) ly.push("chữ có số điện thoại / link");
  // ③ bố cục
  if (d.trim().length < 300) ly.push(`mô tả ${d.trim().length} ký tự (< 300)`);
  if (!/\n\s*\n/.test(d)) ly.push("mô tả chưa chia đoạn");
  // Phường, tỉnh trong tiêu đề: tùy tin (chủ dự án 19/10) — chỉ báo khi quá 75 ký tự (Google cắt mất).
  if (t.length > 75) ly.push(`tiêu đề dài ${t.length} ký tự (> 75, Google cắt mất đuôi)`);
  // ④ giá bất thường
  const g = giaM2(p), ds = nhom[khoa(p.province, p.type, p.purpose)];
  if (g && ds && ds.length >= 3) { const m = giua(ds); if (g < m / 3 || g > m * 3) ly.push(`giá/m² ${(g / 1e6).toFixed(1)} triệu — giá giữa trên web cùng tỉnh, loại hình ${(m / 1e6).toFixed(1)} triệu`); }
  // ⑤ ghi chú Cowork
  const gc = String(p.details?.ghiChuNoiBo || "");
  if (/gọi|xác nhận|mâu thuẫn|nghi|chưa rõ|phối cảnh|thấp bất thường|cao bất thường/i.test(gc)) ly.push(`Cowork ghi: ${gc.slice(0, 120)}`);
  if (ly.length) ra.push(`${r.maAnh} — ${t.slice(0, 55)}\n    · ${ly.join("\n    · ")}`);
}
const tep = path.join(thuMuc, "CAN-ANH-XEM.txt");
fs.writeFileSync(tep, [
  `CẦN ANH XEM — ${tepBang} (máy kiểm ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })})`,
  `${rows.length} tin · ${ra.length} tin cần xem · ${rows.length - ra.length} tin máy kiểm đạt (không cần đọc)`,
  "", ...ra, "",
].join("\r\n"));
console.log(`${rows.length} tin · ${ra.length} cần xem → ${tep}`);
