// ============================================================================
// SOÁT ẢNH / VIDEO LẠC TIN — chạy sau MỖI ĐỢT ĐĂNG, trước khi yên tâm.
// ----------------------------------------------------------------------------
// Vì sao phải có: mã tin (dn01, hue01…) lặp lại giữa các đợt, nên ảnh và video
// rất dễ chui sang tin của nhà khác. Đợt 10/09/2026 đã dính: 108 ảnh của đợt mới
// nằm trong 19 tin cũ. Khách xem tin này lại thấy ảnh nhà khác — mất uy tín ngay.
//
// Soát 5 loại sai, đều bằng ĐO chứ không phỏng đoán:
//   1. ẢNH LẠC TIN   — ảnh tên "<mã>-n.webp" nằm trong tin mang mã KHÁC
//   2. ẢNH DÙNG CHUNG — cùng một tệp ảnh xuất hiện ở NHIỀU tin
//   3. ẢNH TRÙNG      — cùng một ảnh lặp hai lần trong CÙNG một tin
//   4. VIDEO LẠC TIN  — video YouTube có "[mã]" trong tiêu đề nằm ở tin mã khác
//   5. VIDEO DÙNG CHUNG — một video gắn ở nhiều tin
//
// Ảnh/video đời cũ không đặt tên theo mã thì KHÔNG kết luận (chỉ đếm để biết).
//
// CÁCH DÙNG:
//   node scripts/soat-anh-video-lac.mjs            → soát mọi tin
//   node scripts/soat-anh-video-lac.mjs 2026-09-16 → chỉ tin tạo từ ngày đó
//   (thêm --bo-video để bỏ qua bước đọc kênh YouTube cho nhanh)
//
// Kết thúc: mã thoát 0 = sạch, 1 = có sai (dùng được trong quy trình kiểm).
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const GOC = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(GOC, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL;
const KHOA = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SB || !KHOA) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(2);
}
const H = { apikey: KHOA, Authorization: `Bearer ${KHOA}`, "Content-Type": "application/json" };

const tuNgay = process.argv.find((x) => /^\d{4}-\d{2}-\d{2}$/.test(x));
const boVideo = process.argv.includes("--bo-video");

// ── Tên tệp gốc nằm ở cuối URL; kho đặt "<mã băm>-<tên gốc>" hoặc "<mốc>-<số>-<tên gốc>"
function tenGoc(url) {
  const cuoi = decodeURIComponent(String(url).split("?")[0].split("/").pop() ?? "");
  return cuoi.replace(/^[0-9a-f]{16,32}-/i, "").replace(/^\d{10,}-\d+-/, "");
}

// TÊN ĐẦY ĐỦ trong kho — GIỮ mã băm nội dung ở đầu. Đây mới là thứ nhận ra
// "cùng một tấm ảnh": hai đợt cùng đặt tên "nt01-1.webp" nhưng nội dung khác thì
// mã băm khác, URL khác → KHÔNG phải dùng chung.
function tenTrongKho(url) {
  return decodeURIComponent(String(url).split("?")[0].split("/").pop() ?? "");
}

// Mã tin đứng ĐẦU tên tệp: "dn01-3.webp" → "dn01"; tên không theo quy ước → ""
function maCuaAnh(url) {
  const m = /^([a-z]{2,10}\d{1,3})[-_. (]/i.exec(tenGoc(url));
  return m ? m[1].toLowerCase() : "";
}

const laVideo = (u) => /youtu\.be\/|youtube\.com\/(watch\?v=|shorts\/|embed\/)|\.(mp4|webm|mov|m4v)(\?|$)/i.test(String(u));
const maYoutube = (u) => (String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/) ?? [])[1] ?? "";

// ── Đọc tin ─────────────────────────────────────────────────────────────────
const dieuKien = tuNgay ? `&created_at=gte.${tuNgay}` : "";
const res = await fetch(`${URL_SB}/rest/v1/listings?select=id,title,created_at,status,images,details&limit=5000${dieuKien}`, { headers: H });
const tins = await res.json();
if (!Array.isArray(tins)) {
  console.error("Không đọc được bảng listings:", tins);
  process.exit(2);
}
console.log(`SOÁT ${tins.length} tin${tuNgay ? ` (tạo từ ${tuNgay})` : ""}\n`);

const nhan = (t) => `[${t.details?.maAnh ?? "—"}] ${(t.title ?? "").slice(0, 46)}`;

// ── 1. ẢNH LẠC TIN ──────────────────────────────────────────────────────────
const anhLac = [];
let anhCoMa = 0, anhKhongMa = 0;
for (const t of tins) {
  const maTin = (t.details?.maAnh ?? "").toLowerCase();
  for (const u of t.images ?? []) {
    if (laVideo(u)) continue;
    const ma = maCuaAnh(u);
    if (!ma) { anhKhongMa++; continue; }
    anhCoMa++;
    if (maTin && ma !== maTin) anhLac.push({ t, url: u, ma });
  }
}

// ── 2 & 3. ẢNH DÙNG CHUNG / TRÙNG TRONG MỘT TIN ─────────────────────────────
const tinTheoAnh = new Map(); // tên tệp gốc → [tin]
const anhTrungTrongTin = [];
for (const t of tins) {
  const daThay = new Set();
  for (const u of t.images ?? []) {
    if (laVideo(u)) continue;
    const ten = tenTrongKho(u);
    if (daThay.has(ten)) anhTrungTrongTin.push({ t, ten: tenGoc(u) });
    daThay.add(ten);
  }
  for (const ten of daThay) {
    if (!tinTheoAnh.has(ten)) tinTheoAnh.set(ten, []);
    tinTheoAnh.get(ten).push(t);
  }
}
const anhDungChung = [...tinTheoAnh.entries()].filter(([, ds]) => ds.length > 1);

// ── 4 & 5. VIDEO ────────────────────────────────────────────────────────────
const videoTheoTin = new Map(); // id video → [tin]
for (const t of tins) {
  for (const u of t.images ?? []) {
    const id = maYoutube(u);
    if (!id) continue;
    if (!videoTheoTin.has(id)) videoTheoTin.set(id, []);
    videoTheoTin.get(id).push(t);
  }
}
const videoDungChung = [...videoTheoTin.entries()].filter(([, ds]) => ds.length > 1);

let videoLac = [];
let videoKhongMa = 0;
if (!boVideo && videoTheoTin.size) {
  try {
    const { docVideoKenh } = await import("./doc-video-kenh.mjs");
    const dsKenh = await docVideoKenh("@CoastalLandvn");
    const maTheoId = new Map();
    for (const v of dsKenh) {
      const m = /\[\s*([a-z]{2,10}\d{1,3})\s*\]/i.exec(v.ten ?? "");
      if (m) maTheoId.set(v.id, m[1].toLowerCase());
    }
    for (const [id, ds] of videoTheoTin) {
      const maVideo = maTheoId.get(id);
      if (!maVideo) { videoKhongMa++; continue; }
      for (const t of ds) {
        const maTin = (t.details?.maAnh ?? "").toLowerCase();
        if (maTin && maVideo !== maTin) videoLac.push({ t, id, maVideo });
      }
    }
  } catch (e) {
    console.log(`(Không đọc được kênh YouTube để soát video: ${e.message})\n`);
  }
}

// ── BÁO CÁO ─────────────────────────────────────────────────────────────────
const in_ = (tieuDe, ds, ve) => {
  if (!ds.length) { console.log(`✅ ${tieuDe}: không có`); return; }
  console.log(`❌ ${tieuDe}: ${ds.length}`);
  for (const x of ds.slice(0, 30)) console.log("   " + ve(x));
  if (ds.length > 30) console.log(`   … và ${ds.length - 30} trường hợp nữa`);
};

in_("ẢNH LẠC TIN (ảnh mang mã khác nằm trong tin)", anhLac,
  (x) => `${nhan(x.t)}  ←  ảnh của mã "${x.ma}": ${tenGoc(x.url)}`);
in_("ẢNH DÙNG CHUNG (một tệp ảnh ở nhiều tin)", anhDungChung,
  ([ten, ds]) => `${ten.replace(/^[0-9a-f]{16,32}-/i, "")} → ${ds.length} tin: ${ds.map(nhan).join(" | ")}`);
in_("ẢNH LẶP TRONG CÙNG MỘT TIN", anhTrungTrongTin,
  (x) => `${nhan(x.t)} — ${x.ten}`);
in_("VIDEO LẠC TIN (video mã khác nằm trong tin)", videoLac,
  (x) => `${nhan(x.t)}  ←  video của mã "${x.maVideo}": youtu.be/${x.id}`);
in_("VIDEO DÙNG CHUNG (một video ở nhiều tin)", videoDungChung,
  ([id, ds]) => `youtu.be/${id} → ${ds.length} tin: ${ds.map(nhan).join(" | ")}`);

const loi = anhLac.length + anhDungChung.length + anhTrungTrongTin.length + videoLac.length + videoDungChung.length;
console.log("\n" + "─".repeat(70));
console.log(`Ảnh soát được theo mã: ${anhCoMa} · ảnh đời cũ không theo mã (không kết luận): ${anhKhongMa}`);
console.log(`Video: ${videoTheoTin.size}${videoKhongMa ? ` · trong đó ${videoKhongMa} video không có [mã] nên không kết luận` : ""}`);
console.log(loi === 0 ? "\n✅ SẠCH — không tin nào mang ảnh/video của tin khác." : `\n❌ CÓ ${loi} trường hợp phải xử lý.`);
process.exit(loi === 0 ? 0 : 1);
