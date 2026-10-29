// ============================================================================
// KIỂM LOGIC LỊCH SỬ GIÁ CẢ HỆ THỐNG (chủ dự án 29/10/2026: "số liệu phải logic! sửa cả hệ thống")
//   node scripts/kiem-logic-lich-su-gia.mjs
// Chỉ ĐỌC. Mỗi tin đang hiện: dãy lịch sử giá web chọn (bậc dự án / đường / phường — đúng hàm chiSoChoTin của web)
// so với giá/m² của chính tin (cùng mẫu số theo loại hình). Báo LỆCH khi giá tin nằm ngoài khoảng thấp–cao của quý
// mới nhất trong dãy — dấu hiệu dãy không cùng phân khúc / vị trí với tin (vd Golden Bay 39,7 tr/m² so dãy cả phường
// 57–108,8). Không tự ẩn, không tự sửa số: liệt kê để chủ dự án / Cowork xem.
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";

const ROOT = path.resolve(import.meta.dirname, "..").split(path.sep).join("/");
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "/src" }, jsx: true });
const { chiSoChoTin, giaChoLichSu } = await jiti.import(ROOT + "/src/lib/chiSoGia.ts");
const { getListings } = await jiti.import(ROOT + "/src/lib/listingsDb.ts");
const env = Object.fromEntries(fs.readFileSync(ROOT + "/.env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
for (const [k, v] of Object.entries(env)) process.env[k] ??= v;
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const [sc] = await (await fetch(env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/site_content?select=data&key=eq.chi_so_gia", { headers: H })).json();

const tin = await getListings();
const tr = (v) => (v / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
let coDay = 0, lech = 0;
const dong = [];
for (const l of tin) {
  const d = chiSoChoTin(l, sc.data, { duAn: l.projectName ?? null, diaChi: l.diaChiSo ?? l.location ?? "", giaTin: giaChoLichSu(l) });
  if (!d) continue;
  coDay++;
  const m = d.moc?.at?.(-1);
  // Thuê: dãy tính TỔNG tiền/tháng (không mẫu số, chốt 23/10/2026) → so thẳng giá tin; bán: chia đúng mẫu số loại hình
  const dt = !d.mauSo ? 1 : d.mauSo === "san" ? (l.builtAreaM2 ?? null) : (l.areaM2 ?? null);
  if (!m || !l.priceVnd || !dt) continue;
  const g = l.priceVnd / dt;
  const thap = m.thap ?? m.giaM2, cao = m.cao ?? m.giaM2;
  const bac = d.duAn ? "dự án" : d.duong ? "đường" : "phường";
  if (g < thap * 0.97 || g > cao * 1.03) { const tl = g < thap ? g / thap : g / cao;
    lech++;
    dong.push(`${tl.toFixed(2)} · ${l.specs?.loaiCanho ?? ""} · ${l.id.slice(0, 8)} · ${l.type} · ${(l.title ?? "").slice(0, 42)} | tin ${tr(g)} ${d.mauSo ? "tr/m²" : "tr/tháng"} | dãy ${bac} "${d.duAn ?? d.duong ?? d.khuVuc}" (${d.loaiHinh}) ${m.quy}: ${tr(m.giaM2)} [${tr(thap)}–${tr(cao)}]`);
  }
}
console.log(dong.sort().join("\n"));
console.log(`\n${tin.length} tin đang hiện · ${coDay} tin có lịch sử giá · ${lech} tin LỆCH (giá tin ngoài khoảng của dãy)`);
