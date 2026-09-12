// ════════════════════════════════════════════════════════════════════════════
// THU HỒI ẢNH ĐANG MƯỢN CỦA SÀN KHÁC VỀ KHO MÌNH
//
// VÌ SAO (chủ dự án chốt 12/09/2026): 30 tin đang hiển thị ảnh/video lấy thẳng
// từ máy chủ batdongsan.com.vn (`file4.batdongsan.com.vn`, `vn1-cdn.pgimgs.com`).
// Web mình chỉ trỏ sang đó — như treo tranh của hàng xóm trong nhà mình: hôm nào
// họ cất đi là tường trống. Sắp thu tiền khách đăng tin thì không thể để tin của
// khách phụ thuộc vào máy chủ sàn đối thủ.
//
// Script làm phần ẢNH (13 tấm, ~3,6 MB): tải về → nén WebP → cất vào kho mình →
// sửa tin trỏ sang bản của mình. Ảnh gốc bên họ mình không đụng tới.
//
// VIDEO (12 tệp, 282 MB) script CỐ Ý KHÔNG tải vào kho: một video ăn bằng 40 tấm
// ảnh, và quy trình đã chốt là video đi YouTube. Chạy với --video để tải chúng về
// máy, đặt sẵn tên có [mã] để đưa lên kênh — xem docs/QUY-TRINH-VIDEO-YOUTUBE.md.
//
// Link youtu.be trong tin là video CỦA MÌNH, script bỏ qua.
//
//   node scripts/thu-hoi-anh-san-khac.mjs            → xem sẽ làm gì
//   node scripts/thu-hoi-anh-san-khac.mjs --ap       → tải ảnh về kho + sửa tin
//   node scripts/thu-hoi-anh-san-khac.mjs --video "D:/…"  → tải video về máy
// ════════════════════════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const GOC = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(GOC, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KHOA = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "listings";
const AP = process.argv.includes("--ap");
const iv = process.argv.indexOf("--video");
const THU_MUC_VIDEO = iv > 0 ? process.argv[iv + 1] : "";

if (!KHOA) {
  console.error("❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}
const H = { apikey: KHOA, Authorization: `Bearer ${KHOA}` };
const HJ = { ...H, "Content-Type": "application/json" };
const MB = (b) => (b / 1048576).toFixed(1) + " MB";
const KB = (b) => (b / 1024).toFixed(0) + " KB";

// Máy chủ của sàn khác. youtu.be / youtube.com là video CỦA MÌNH — không tính.
const LA_SAN_KHAC = (u) => /(pgimgs\.com|batdongsan\.com\.vn)/i.test(u);
const LA_VIDEO = (u) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);

console.log("THU HỒI ẢNH/VIDEO ĐANG MƯỢN CỦA SÀN KHÁC");
console.log("═".repeat(66));

const tin = await (await fetch(`${URL_}/rest/v1/listings?select=id,title,images&limit=20000`, { headers: HJ })).json();
const viec = [];
for (const t of tin)
  for (const u of t.images || [])
    if (typeof u === "string" && LA_SAN_KHAC(u)) viec.push({ tin: t.id, tieuDe: t.title, url: u });

const anh = viec.filter((v) => !LA_VIDEO(v.url));
const video = viec.filter((v) => LA_VIDEO(v.url));
const soTin = new Set(viec.map((v) => v.tin)).size;
console.log(`\n${soTin} tin đang mượn: ${new Set(anh.map((v) => v.url)).size} ảnh · ${new Set(video.map((v) => v.url)).size} video\n`);

// ── VIDEO: tải về máy để đưa lên YouTube ────────────────────────────────────
if (THU_MUC_VIDEO) {
  fs.mkdirSync(THU_MUC_VIDEO, { recursive: true });
  console.log(`Tải ${video.length} video về ${THU_MUC_VIDEO} …`);
  const sach = (s) => String(s).replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
  for (const [k, v] of video.entries()) {
    // Tên = tiêu đề tin + mã tin trong ngoặc vuông, dưới 96 ký tự (YouTube cắt ở 100).
    const ma = v.tin.slice(0, 8);
    const ten = `${sach(v.tieuDe).slice(0, 70)} [${ma}].mp4`;
    const dich = path.join(THU_MUC_VIDEO, ten);
    if (fs.existsSync(dich)) {
      console.log(`  ${k + 1}/${video.length} đã có, bỏ qua: ${ten.slice(0, 50)}`);
      continue;
    }
    const r = await fetch(v.url);
    if (!r.ok) {
      console.log(`  ✗ ${r.status} ${v.url.slice(0, 60)}`);
      continue;
    }
    fs.writeFileSync(dich, Buffer.from(await r.arrayBuffer()));
    console.log(`  ${k + 1}/${video.length} ${ten.slice(0, 60)}`);
  }
  console.log("\nXong. Đưa lên kênh Coastal Land rồi dán link vào tin (đừng đổi tên tệp).");
}

// ── ẢNH: tải về, nén, cất vào kho mình ──────────────────────────────────────
if (!anh.length) {
  console.log("Không còn ảnh nào phải thu hồi.");
  process.exit(0);
}

const doi = new Map(); // url cũ → url mới
let truoc = 0,
  sau = 0;

for (const [k, v] of [...new Map(anh.map((x) => [x.url, x])).values()].entries()) {
  process.stdout.write(`\r[${k + 1}] ${v.url.slice(-46).padEnd(46)}`);
  try {
    const r = await fetch(v.url);
    if (!r.ok) {
      console.log(`\n  ✗ tải không được (${r.status})`);
      continue;
    }
    const goc = Buffer.from(await r.arrayBuffer());
    // Cùng chuẩn với ảnh khách tự tải lên: cạnh dài tối đa 2048, WebP.
    const nen = await sharp(goc, { failOn: "none" })
      .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toBuffer();
    const nho = await sharp(nen).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    const ma = crypto.createHash("sha256").update(nen).digest("hex").slice(0, 24);
    const ten = `${ma}-${path.basename(new URL(v.url).pathname).replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.[^.]+$/, "")}.webp`;
    truoc += goc.length;
    sau += nen.length;
    if (AP) {
      for (const [duong, du] of [
        [ten, nen],
        [`nho/${ten}`, nho],
      ]) {
        const up = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${encodeURIComponent(duong)}`, {
          method: "POST",
          headers: { ...H, "Content-Type": "image/webp", "x-upsert": "true" },
          body: du,
        });
        if (!up.ok) throw new Error(`tải lên hỏng ${up.status}`);
      }
    }
    doi.set(v.url, `${URL_}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(ten)}`);
  } catch (e) {
    console.log(`\n  ✗ ${e.message}`);
  }
}
process.stdout.write("\r" + " ".repeat(70) + "\r");
console.log(`Ảnh thu hồi được: ${doi.size} · ${MB(truoc)} → ${MB(sau)} (trung bình ${KB(sau / Math.max(1, doi.size))}/ảnh)`);

if (!AP) {
  console.log("\nChưa đổi gì. Ưng thì chạy lại với --ap.");
  process.exit(0);
}

// ── SỬA TIN TRỎ SANG ẢNH CỦA MÌNH ───────────────────────────────────────────
const theoTin = new Map();
for (const v of anh) if (doi.has(v.url)) theoTin.set(v.tin, (theoTin.get(v.tin) ?? []).concat(v.url));
let xong = 0;
for (const [maTin, ds] of theoTin) {
  const t = tin.find((x) => x.id === maTin);
  // Giữ NGUYÊN thứ tự ảnh trong tin, chỉ thay đúng ô đang trỏ ra ngoài.
  const moi = t.images.map((u) => (ds.includes(u) ? doi.get(u) : u));
  const r = await fetch(`${URL_}/rest/v1/listings?id=eq.${encodeURIComponent(maTin)}`, {
    method: "PATCH",
    headers: { ...HJ, Prefer: "return=minimal" },
    body: JSON.stringify({ images: moi }),
  });
  if (r.ok) xong++;
  else console.log(`  ✗ tin ${maTin}: ${r.status}`);
}
console.log(`Đã sửa ${xong}/${theoTin.size} tin sang ảnh của mình.`);
console.log("Video vẫn đang mượn — chạy lại với --video \"<thư mục>\" để tải về đưa lên YouTube.");
