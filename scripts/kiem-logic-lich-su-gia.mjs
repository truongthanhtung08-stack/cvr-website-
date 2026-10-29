// ============================================================================
// KIỂM LOGIC LỊCH SỬ GIÁ CẢ HỆ THỐNG (chủ dự án 29/10/2026: "số liệu phải logic! sửa cả hệ thống" · "đường giá phổ biến – khoảng
// giá – giá hiện tại phải khớp và logic, chuẩn" · "cái nào không đúng chuẩn, không hiện")
//   node scripts/kiem-logic-lich-su-gia.mjs
// Chỉ ĐỌC. Lấy số ĐÚNG như trang tin (số web khoCuaMinh + số nộp soNhapHopLe → chiSoChoTin) cho từng tin đang hiện, rồi soát:
//   ① giá tin nằm trong khoảng thấp–cao của quý mới nhất · ② mỗi quý thấp ≤ phổ biến ≤ cao, không nhảy gấp đôi / còn nửa
//   ③ đủ 5 quý liền (1 năm) · ④ cùng loại hình, cùng loại con (nếu dãy ghi loại con) · ⑤ đúng mẫu số.
// Phải ra 0 tin SAI. Kèm bảng mỗi loại hình: số tin có biểu đồ / tổng — phần thiếu là việc Cowork lọc (danh sách còn thiếu).
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";

const ROOT = path.resolve(import.meta.dirname, "..").split(path.sep).join("/");
const env = Object.fromEntries(fs.readFileSync(ROOT + "/.env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
for (const [k, v] of Object.entries(env)) process.env[k] ??= v;
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "/src" }, jsx: true });
const { chiSoChoTin, giaChoLichSu, khoCuaMinh, soNhapHopLe, dayHopLogic, coDuLichSuGia, mauSoLichSu } = await jiti.import(ROOT + "/src/lib/chiSoGia.ts");
const { getListings } = await jiti.import(ROOT + "/src/lib/listingsDb.ts");
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const [sc] = await (await fetch(env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/site_content?select=data&key=eq.chi_so_gia", { headers: H })).json();
const nhap = soNhapHopLe(sc?.data?.items);

const tin = await getListings();
const tr = (v) => (v / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
const chuan = (s) => (s ?? "").normalize("NFC").toLowerCase().trim();
const kho = new Map();
const bang = {};
const sai = [];
let coBieuDo = 0;
for (const l of tin) {
  const muc = l.purpose === "thue" ? "thue" : "ban";
  const k = `${l.diaGioi?.province}|${l.type}|${muc}`;
  if (!kho.has(k)) kho.set(k, await khoCuaMinh(l.diaGioi?.province ?? "", l.type, muc));
  const g = giaChoLichSu(l);
  const d = chiSoChoTin(l, { items: [...kho.get(k), ...nhap] }, { duAn: l.projectName ?? null, diaChi: l.diaChiSo ?? l.location ?? "", giaTin: g });
  const nhom = `${muc === "thue" ? "Thuê" : "Bán"} · ${l.type}`;
  bang[nhom] ??= [0, 0];
  bang[nhom][0]++;
  if (!d) continue;
  bang[nhom][1]++;
  coBieuDo++;
  const m = d.moc[d.moc.length - 1];
  const loi = [];
  if (g && (g < (m.thap ?? m.giaM2) || g > (m.cao ?? m.giaM2))) loi.push(`giá tin ${tr(g)} ngoài khoảng [${tr(m.thap ?? m.giaM2)}–${tr(m.cao ?? m.giaM2)}]`);
  if (!dayHopLogic(d)) loi.push("dãy sai logic (thấp/phổ biến/cao hoặc nhảy bất thường)");
  if (!coDuLichSuGia(d)) loi.push("chưa đủ 5 quý liền");
  if (chuan(d.loaiHinh) !== chuan(l.type) && !d.duAn) loi.push(`khác loại hình (${d.loaiHinh})`);
  if (d.loaiCon && chuan(d.loaiCon) !== chuan(l.loaiCon)) loi.push(`khác loại con (${d.loaiCon} ≠ ${l.loaiCon ?? "trống"})`);
  if (d.mauSo !== mauSoLichSu(l.type, muc)) loi.push("sai mẫu số");
  if (loi.length) sai.push(`${l.id.slice(0, 8)} · ${l.type} · ${(l.title ?? "").slice(0, 40)} → ${loi.join("; ")}`);
}
console.log(Object.entries(bang).sort().map(([k, [a, b]]) => `${k}: ${b}/${a} tin có biểu đồ`).join("\n"));
if (sai.length) console.log("\nSAI:\n" + sai.join("\n"));
console.log(`\n${tin.length} tin đang hiện · ${coBieuDo} tin có biểu đồ · ${sai.length} tin SAI`);
