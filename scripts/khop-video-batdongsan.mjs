// ════════════════════════════════════════════════════════════════════════════
// KHỚP VIDEO ĐỢT BATDONGSAN VỀ ĐÚNG TIN — chạy SAU KHI đã đưa lên YouTube
//
// VÌ SAO CÓ RIÊNG FILE NÀY (không dùng dong-bo-video-youtube.mjs):
// Script kia khớp video ĐANG NẰM TRONG KHO của mình, dựa vào tên tệp trong kho.
// Còn 16 video đợt này thì chưa bao giờ ở trong kho — tin đang trỏ thẳng sang
// máy chủ `vn1-cdn.pgimgs.com` của batdongsan.com.vn. Nên phải khớp theo BẢNG MÃ
// do scripts/thu-hoi-anh-san-khac.mjs sinh ra lúc tải video về.
//
// Mã tin đặt là bds01…bds16 chứ không phải mã UUID: tên tệp mang mã UUID kiểu
// `[7ad986f7]` thì máy dò không ra (mã bắt đầu bằng số, lẫn chữ và số không có
// ranh giới rõ). bdsNN thì chắc chắn khớp.
//
//   node scripts/khop-video-batdongsan.mjs        → xem khớp được những gì
//   node scripts/khop-video-batdongsan.mjs --ap   → ghi link YouTube vào tin
// ════════════════════════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import { docVideoKenh } from "./doc-video-kenh.mjs";

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
const AP = process.argv.includes("--ap");
const BANG_MA = "D:/Coastal Land/Video-len-YouTube/dot-batdongsan/_bang-ma.json";

if (!KHOA) {
  console.error("❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}
if (!fs.existsSync(BANG_MA)) {
  console.error(`❌ Không thấy bảng mã: ${BANG_MA}`);
  console.error("   Chạy scripts/thu-hoi-anh-san-khac.mjs --video \"D:/Coastal Land/Video-len-YouTube\" trước.");
  process.exit(1);
}
const H = { apikey: KHOA, Authorization: `Bearer ${KHOA}`, "Content-Type": "application/json" };

const bang = JSON.parse(fs.readFileSync(BANG_MA, "utf8"));
console.log(`Bảng mã: ${bang.length} video đợt batdongsan`);

const tren = await docVideoKenh("@CoastalLandvn");
console.log(`Kênh Coastal Land: ${tren.length} video công khai\n`);

// Tiêu đề trên kênh chứa "[bdsNN]" hoặc "bdsNN" (YouTube có thể nuốt ngoặc vuông).
const theoMa = new Map();
for (const v of tren) {
  const m = (v.ten || "").toLowerCase().match(/bds\s?(\d{1,2})/);
  if (m) theoMa.set("bds" + m[1].padStart(2, "0"), v);
}

const tin = await (await fetch(`${URL_}/rest/v1/listings?select=id,title,images&limit=20000`, { headers: H })).json();
const khop = [];
const hut = [];
for (const b of bang) (theoMa.has(b.ma) ? khop : hut).push(b);

console.log(`KHỚP ĐƯỢC: ${khop.length}/${bang.length}`);
for (const b of khop) console.log(`  ✓ ${b.ma} → https://youtu.be/${theoMa.get(b.ma).id}  ${b.ten.slice(0, 46)}`);
if (hut.length) {
  console.log(`\nCHƯA LÊN KÊNH: ${hut.length}`);
  for (const b of hut) console.log(`  · ${b.ma}  ${b.ten.slice(0, 56)}`);
}

if (!AP) {
  console.log("\nChưa đổi gì. Ưng thì chạy lại với --ap.");
  process.exit(0);
}

// Thay đúng ô video đang trỏ sang pgimgs bằng link YouTube, giữ nguyên thứ tự ảnh.
let xong = 0;
for (const b of khop) {
  const t = tin.find((x) => x.id === b.tin);
  if (!t) continue;
  const link = `https://youtu.be/${theoMa.get(b.ma).id}`;
  let daThay = false;
  const moi = (t.images || []).map((u) => {
    if (!daThay && /pgimgs\.com/i.test(u)) {
      daThay = true;
      return link;
    }
    return u;
  });
  if (!daThay) continue;
  const r = await fetch(`${URL_}/rest/v1/listings?id=eq.${encodeURIComponent(b.tin)}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ images: moi }),
  });
  if (r.ok) xong++;
  else console.log(`  ✗ tin ${b.tin}: ${r.status}`);
}
console.log(`\nĐã thay link cho ${xong} tin. Kiểm web thấy video chạy là xong.`);
console.log("Soát lại: node scripts/soat-kho-anh.mjs");
