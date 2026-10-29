// ============================================================================
// CHUẨN HOÁ MỘT ĐỢT TIN TRƯỚC KHI UP — sửa thẳng trong thư mục, không bắt ai sửa tay
// ----------------------------------------------------------------------------
//   node scripts/chuan-hoa-dot.mjs "D:/…/TIN HANG NGAY chuẩn/07102026"          → chỉ xem
//   node scripts/chuan-hoa-dot.mjs "D:/…/TIN HANG NGAY chuẩn/07102026" --that   → sửa thật
//
// Excel (cột ma_anh) là GỐC. Ảnh và video đổi tên theo mã trong Excel:
//   · ảnh  dn01-1007-3.jpg            → dn01-0710-03.jpg  (cùng khu+số, lệch đuôi ngày; số ảnh 2 chữ số)
//   · video bất kỳ tên nào            → "<tiêu đề tin> dn01-0710.mp4" — dưới 95 ký tự, mã ở CUỐI;
//     chủ dự án up lên YouTube không đổi tên → Admin bấm "Gắn video từ YouTube" (chuẩn 25/10/2026,
//     bộ mẫu SEO\MAU\dot-tin-mau-24-10; luật đọc mã: src/lib/videoKenh.ts maTuTieuDe)
//   · hai video cùng một mã → xét tiêu đề video với tiêu đề tin để trả về đúng mã
// Dòng Excel lỗi (theo đúng bộ kiểm của web) thì liệt kê để quyết.
// Lỗi 05/10 + 07/10/2026 là lý do có lệnh này.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const thuMuc = process.argv[2];
const that = process.argv.includes("--that");
if (!thuMuc || !fs.existsSync(thuMuc)) {
  console.error('Thiếu thư mục đợt. VD: node scripts/chuan-hoa-dot.mjs "D:/…/07102026"');
  process.exit(1);
}

const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { docTinTuBang, docTinTuCsv } = await jiti.import(ROOT + "/src/lib/csvTin.ts");
const { docXlsx } = await jiti.import(ROOT + "/src/lib/docXlsx.ts");

const tepBang = fs.readdirSync(thuMuc).find((f) => /^Bang-.*\.(xlsx|csv)$/i.test(f));
if (!tepBang) { console.error("Không thấy file Bang-*.xlsx / .csv trong thư mục"); process.exit(1); }
const duongBang = path.join(thuMuc, tepBang);
const kq = /\.xlsx$/i.test(tepBang)
  ? docTinTuBang(await docXlsx(new Uint8Array(fs.readFileSync(duongBang)).buffer))
  : docTinTuCsv(fs.readFileSync(duongBang, "utf8"));
const rows = kq.rows.filter((r) => r.maAnh);

// "dn01-0710" → khoá "dn01"
const khoa = (ma) => (/^([a-z]{2,10}\d{1,3})/i.exec(ma)?.[1] ?? "").toLowerCase();
const theoKhoa = new Map(rows.map((r) => [khoa(r.maAnh), r]));
const gon = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const doi = []; // [cũ, mới]

// ── ẢNH ─────────────────────────────────────────────────────────────────────
const dsAnh = [];
const di = (p) => { for (const f of fs.readdirSync(p, { withFileTypes: true })) f.isDirectory() ? di(path.join(p, f.name)) : dsAnh.push(path.join(p, f.name)); };
if (fs.existsSync(path.join(thuMuc, "anh"))) di(path.join(thuMuc, "anh"));
const thieuAnh = new Set(rows.map((r) => r.maAnh));
for (const p of dsAnh) {
  const ten = path.basename(p);
  const m = /^([a-z]{2,10}\d{1,3})-(\d{4})(-.*)$/i.exec(ten);
  if (!m) continue;
  const r = theoKhoa.get(m[1].toLowerCase());
  if (!r) continue;
  thieuAnh.delete(r.maAnh);
  const moi = `${r.maAnh}${m[3].replace(/^-(\d)(\.[^.]+)$/, "-0$1$2")}`;
  if (moi !== ten) doi.push([p, path.join(path.dirname(p), moi)]);
}

// ── VIDEO ───────────────────────────────────────────────────────────────────
const thuMucVideo = path.join(thuMuc, "Video");
const daDungMa = new Map();
const videoLe = [];
// Tên video chuẩn: "<tiêu đề tin> <mã>.mp4" — bỏ ký tự YouTube/Windows cấm, cả tên ≤ 95 ký tự (cắt ở chỗ hết từ)
const tenVideoChuan = (tieuDe, ma) => {
  let t = String(tieuDe ?? "").replace(/[<>\\/:*?"|]/g, "").replace(/\s+/g, " ").trim();
  const max = 95 - ma.length - 1;
  if (t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, "").replace(/[\s,.\-]+$/, "");
  return `${t} ${ma}.mp4`;
};
if (fs.existsSync(thuMucVideo)) {
  for (const f of fs.readdirSync(thuMucVideo)) {
    if (!/\.(mp4|mov|m4v)$/i.test(f)) continue;
    const goc = f.replace(/\.[^.]+$/, "");
    // Tên kiểu cũ "dn01-0710-video" → vẫn nhận ra tin, đổi sang tên chuẩn
    const kieuCu = /^([a-z]{2,10}\d{1,3})-\d{4}-video$/i.exec(goc);
    const m = kieuCu ? null : /^(.*?)[\s\-–]*\[?\s*([a-z]{2,10}\d{1,3})(?:[\s-]+\d{4})?\s*\]?\s*$/i.exec(goc);
    const tieuDe = (m ? m[1] : goc).replace(/\s+/g, " ").trim();
    // Ưu tiên tin có TIÊU ĐỀ khớp (chống hai video cùng mã), rồi mới theo mã trong tên
    const theoTieuDe = kieuCu ? undefined : rows.find((r) => { const a = gon(tieuDe), b = gon(r.tomTat?.tieuDe); const n = Math.min(24, a.length, b.length); return n >= 12 && a.slice(0, n) === b.slice(0, n); });
    const r = theoTieuDe ?? (kieuCu ? theoKhoa.get(kieuCu[1].toLowerCase()) : m ? theoKhoa.get(m[2].toLowerCase()) : undefined);
    if (!r) { videoLe.push(f); continue; }
    if (daDungMa.has(r.maAnh)) { videoLe.push(`${f} (trùng tin với ${daDungMa.get(r.maAnh)})`); continue; }
    daDungMa.set(r.maAnh, f);
    const moi = tenVideoChuan(r.tomTat?.tieuDe, r.maAnh);
    if (moi !== f) doi.push([path.join(thuMucVideo, f), path.join(thuMucVideo, moi)]);
  }
}

// ── BÁO CÁO + SỬA ───────────────────────────────────────────────────────────
console.log(`${tepBang}: ${rows.length} tin · ${dsAnh.length} ảnh · ${daDungMa.size} video`);
for (const [a, b] of doi) console.log(`  ĐỔI TÊN  ${path.basename(a)}  →  ${path.basename(b)}`);
const loi = kq.rows.filter((r) => r.loi.length);
for (const r of loi) console.log(`  ❌ dòng ${r.dong} [${r.maAnh}] ${r.loi.join(" · ")}`);
for (const ma of thieuAnh) console.log(`  ❌ [${ma}] không có ảnh nào`);
for (const v of videoLe) console.log(`  ❌ video không khớp tin nào: ${v}`);
if (that) {
  for (const [a, b] of doi) if (!fs.existsSync(b)) fs.renameSync(a, b);
  console.log(`\n✅ Đã đổi tên ${doi.length} tệp.`);
} else if (doi.length) console.log("\n(Chỉ xem — thêm --that để sửa.)");
if (!doi.length && !loi.length && !thieuAnh.size && !videoLe.length) console.log("✅ Đợt này đúng chuẩn, up được.");
