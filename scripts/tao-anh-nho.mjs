// ════════════════════════════════════════════════════════════════════════════
// TẠO BẢN ẢNH NHỎ CHO THẺ TIN — ảnh gốc GIỮ NGUYÊN
//
// VÌ SAO (đo bằng trình duyệt thật 12/09/2026): một lượt xem trang chủ tải về
// **65 MB / 106 ảnh**, vì mỗi thẻ tin tự chạy tới 6 tấm và tấm nào cũng là ảnh
// gốc cỡ 1500–2000px — trong khi cái thẻ chỉ rộng chừng 400px. Gói Supabase
// miễn phí có 5 GB băng thông/tháng → chịu được ~78 lượt xem. Tổ chức đã bị
// gắn cờ vượt hạn mức, doạ khoá dự án từ 08/10/2026.
//
// Script này đặt cạnh mỗi ảnh một bản hẹp hơn ở thư mục `nho/`:
//     listings/<tên>        ← ảnh gốc, KHÔNG ĐỤNG TỚI
//     listings/nho/<tên>    ← bản cho thẻ
// Thẻ tin và ô khu vực xin bản `nho/` (hàm anhNho trong src/lib/asset.ts).
// Thư viện ảnh và phần xem toàn màn hình vẫn dùng ẢNH GỐC, nguyên độ nét —
// chủ dự án đã chốt: ảnh không được mờ.
//
// Thiếu bản nhỏ cũng không sao: đường /anh/… tự trả ảnh gốc thay thế.
//
//   node scripts/tao-anh-nho.mjs             → xem sẽ tạo bao nhiêu, nặng bao nhiêu
//   node scripts/tao-anh-nho.mjs --ap        → tạo thật
//   node scripts/tao-anh-nho.mjs --rong 1600 → đổi bề ngang tối đa (mặc định 1280)
// ════════════════════════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
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
const i = process.argv.indexOf("--rong");
const RONG = i > 0 ? Number(process.argv[i + 1]) || 1280 : 1280;

if (!KHOA) {
  console.error("❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}
const H = { apikey: KHOA, Authorization: `Bearer ${KHOA}` };
const HJ = { ...H, "Content-Type": "application/json" };
const MB = (b) => (b / 1048576).toFixed(1) + " MB";
const CONG = `${URL_}/storage/v1/object/public/${BUCKET}/`;

async function liet(prefix) {
  let ra = [];
  for (let offset = 0; ; offset += 1000) {
    const r = await fetch(`${URL_}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: HJ,
      body: JSON.stringify({ prefix, limit: 1000, offset }),
    });
    const p = await r.json();
    if (!Array.isArray(p) || !p.length) break;
    ra = ra.concat(p);
    if (p.length < 1000) break;
  }
  return ra;
}

console.log(`TẠO BẢN ẢNH NHỎ (ngang tối đa ${RONG}px) — ảnh gốc giữ nguyên`);
console.log("═".repeat(68));

const goc = (await liet("")).filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name));
const daCo = new Set((await liet("nho")).map((f) => f.name));
console.log(`\nẢnh gốc: ${goc.length} · đã có bản nhỏ: ${daCo.size}`);

// Chỉ làm cho ảnh ĐANG ĐƯỢC DÙNG — đừng tốn công cho rác chờ dọn.
const BANG = ["listings?select=images&limit=20000", "projects?select=*&limit=5000", "articles?select=*&limit=5000", "site_content?select=*&limit=1000"];
let dung = new Set();
for (const q of BANG) {
  const r = await fetch(`${URL_}/rest/v1/${q}`, { headers: HJ });
  if (!r.ok) {
    console.error(`❌ Không đọc được ${q}: ${r.status}`);
    process.exit(1);
  }
  const chu = JSON.stringify(await r.json());
  for (const f of goc) if (chu.includes(f.name) || chu.includes(encodeURIComponent(f.name))) dung.add(f.name);
}

const canLam = goc.filter((f) => dung.has(f.name) && !daCo.has(f.name));
console.log(`Ảnh đang dùng: ${dung.size} · cần tạo bản nhỏ: ${canLam.length}\n`);
if (!canLam.length) {
  console.log("Không có gì phải làm.");
  process.exit(0);
}

let truoc = 0,
  sau = 0,
  xong = 0,
  hong = 0;

for (const [k, f] of canLam.entries()) {
  process.stdout.write(`\r[${k + 1}/${canLam.length}] ${f.name.slice(0, 44).padEnd(44)}`);
  try {
    const r = await fetch(CONG + encodeURIComponent(f.name), { headers: H });
    if (!r.ok) {
      hong++;
      continue;
    }
    const anh = Buffer.from(await r.arrayBuffer());
    // withoutEnlargement: ảnh vốn đã nhỏ hơn thì để yên, đừng phóng to cho mờ.
    const nho = await sharp(anh, { failOn: "none" })
      .resize({ width: RONG, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toBuffer();
    truoc += anh.length;
    sau += nho.length;
    if (AP) {
      const up = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${encodeURIComponent("nho/" + f.name)}`, {
        method: "POST",
        headers: { ...H, "Content-Type": "image/webp", "x-upsert": "true" },
        body: nho,
      });
      if (!up.ok) {
        hong++;
        continue;
      }
    }
    xong++;
  } catch {
    hong++;
  }
}
process.stdout.write("\r" + " ".repeat(70) + "\r");

console.log(`Tạo được: ${xong} bản nhỏ${hong ? ` · hỏng ${hong}` : ""}`);
console.log(`Khi thẻ tin dùng bản nhỏ: ${MB(truoc)} → ${MB(sau)} (nhẹ hơn ${(truoc / sau).toFixed(1)} lần)`);
console.log(`Kho tốn thêm: ${MB(sau)}`);
if (!AP) console.log("\nChưa tạo gì. Ưng thì chạy lại với --ap.");
