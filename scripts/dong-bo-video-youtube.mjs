// ════════════════════════════════════════════════════════════════════════════
// ĐỒNG BỘ VIDEO TỪ KÊNH YOUTUBE VỀ TIN — thay video tải lên bằng link YouTube
//
// VÌ SAO: một video tải lên kho ăn ~16 MB, bằng 40 tấm ảnh. 14 video đang chiếm
// 41% kho Supabase. Đưa lên YouTube thì tốn 0 MB, mà trên trang tin hiện y hệt
// (vẫn nằm trong thư viện ảnh, bấm play chạy tại chỗ, xem lớn và xoay được).
//
// CÁCH KHỚP — DỰA VÀO TÊN:
//   Tệp trong kho tên "1788319772900-566360-dn06-video.mp4.mp4"
//   → phần nhận dạng là "dn06-video"
//   YouTube khi tải hàng loạt TỰ LẤY TÊN TỆP LÀM TIÊU ĐỀ, nên video trên kênh
//   cũng tên "dn06-video" → khớp được, không cần copy dán link tay từng cái.
//   ⚠️ VÌ VẬY: lúc tải lên YouTube ĐỪNG ĐỔI TÊN. Đổi tên là mất đường khớp.
//
// LẤY DANH SÁCH KÊNH: dùng đường công khai của YouTube, KHÔNG cần khoá API,
// không đụng tới Google Cloud (tài khoản Google của dự án đang bị gắn cờ vì vụ
// Maps — xem docs/BAN-GIAO-GOOGLE-MAPS.md). Đổi lại: chỉ đọc được 15 video MỚI
// NHẤT. Nhiều hơn thì tải lên làm nhiều đợt, mỗi đợt ≤15 rồi chạy script này.
//   → Video PHẢI để chế độ CÔNG KHAI. Để "không công khai" là danh sách bị giấu,
//     script không thấy gì cả.
//
// CÁCH DÙNG:
//   node scripts/dong-bo-video-youtube.mjs           → chỉ XEM khớp được những gì
//   node scripts/dong-bo-video-youtube.mjs --ap      → ghi link YouTube vào tin
//   node scripts/dong-bo-video-youtube.mjs --xoa-tep → xoá video khỏi kho Supabase
//                                                      (CHỈ chạy sau khi đã --ap
//                                                       và tự mở web kiểm video chạy)
// ════════════════════════════════════════════════════════════════════════════

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

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KHOA = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const KENH = "UCm68jy5CoSd_dgcNVaHh8gw"; // kênh Coastal Land (youtube.com/@CoastalLandvn)
const AP = process.argv.includes("--ap");
const XOA_TEP = process.argv.includes("--xoa-tep");

if (!KHOA) {
  console.error("❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local (xem scripts/don-kho-anh.mjs).");
  process.exit(1);
}
const H = { apikey: KHOA, Authorization: `Bearer ${KHOA}`, "Content-Type": "application/json" };

// Rút MÃ NHẬN DẠNG — thứ dùng để khớp video trên kênh về đúng tin.
//
// Tệp trong kho:   "1788319772900-566360-dn06-video.mp4.mp4"     → "dn06-video"
// Tệp đã đặt tên:  "Cần bán nhà… Hòa Xuân, Đà Nẵng [dn06-video].mp4" → "dn06-video"
// Tiêu đề YouTube: "Cần bán nhà… Hòa Xuân, Đà Nẵng [dn06-video]"     → "dn06-video"
//
// VÌ SAO CÓ NGOẶC VUÔNG: kênh Coastal Land là kênh CÔNG KHAI của công ty, khách
// xem video của chính tin họ đăng — để tiêu đề kiểu "1788319772900-566360-dn06"
// thì trông nghiệp dư. Nên tên video là tiêu đề tin thật, còn mã để trong ngoặc
// vuông ở cuối: người đọc không bận tâm, mà máy vẫn khớp được về đúng tin.
// ⚠️ ĐỪNG XOÁ PHẦN TRONG NGOẶC VUÔNG khi sửa tiêu đề trên YouTube.
// ⚠️ YOUTUBE CẮT TIÊU ĐỀ Ở 100 KÝ TỰ. Đo thật 11/09/2026: tên tệp
//   "Cơ hội vàng sở hữu shophouse… Quy Nhơn Bắc, Gia Lai [qnhon07-video].mp4"
// lên kênh thành "…Quy Nhơn Bắc, Gia Lai qnhon07 v" — mất cả dấu ngoặc lẫn đuôi.
// Nên KHÔNG khớp bằng nguyên cụm trong ngoặc, mà bằng MÃ NGẮN: cụm chữ + số
// (dn06 · hue07 · pt03 · qnhon07 · video01). Mã luôn nằm cuối tên nên lấy cụm
// CUỐI CÙNG — tiêu đề tin phía trước có thể lẫn số ("nhà 3 tầng", "2PN").
function nhanDang(ten) {
  const s = ten
    .replace(/^.*\//, "")
    .replace(/^[0-9a-f]{10,}-(?:[0-9]+-)?/i, "")
    .replace(/(\.(mp4|webm|mov|m4v|ogg))+$/i, "")
    .toLowerCase();
  const ma = [...s.matchAll(/\b([a-z]{2,10}\d{1,3})\b/g)];
  return ma.length ? ma[ma.length - 1][1] : s.trim();
}

// ── 1. VIDEO TRÊN KÊNH ──────────────────────────────────────────────────────
const xml = await (await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${KENH}`)).text();
const tren = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
  const k = m[1];
  const lay = (the) => (k.match(new RegExp(`<${the}>([\\s\\S]*?)</${the}>`)) ?? [, ""])[1];
  return {
    id: lay("yt:videoId"),
    ten: lay("media:title").replace(/&amp;/g, "&"),
    xem: Number((k.match(/media:statistics views="(\d+)"/) ?? [, 0])[1]),
  };
});
console.log(`Kênh Coastal Land: ${tren.length} video (đường công khai chỉ trả 15 video mới nhất)\n`);
if (tren.length === 0) {
  console.log("Chưa có video nào — tải lên kênh xong rồi chạy lại.");
  console.log("⚠️ Nhớ: để chế độ CÔNG KHAI và ĐỪNG ĐỔI TÊN tệp khi tải lên.");
  process.exit(0);
}

// ── 2. TIN ĐANG DÙNG VIDEO TẢI LÊN ──────────────────────────────────────────
const tin = await (await fetch(`${URL_}/rest/v1/listings?select=id,title,images&limit=20000`, { headers: H })).json();
const laTepVideo = (u) => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(u) && !/youtu|vimeo/i.test(u);
const viec = [];
for (const t of tin)
  for (const u of t.images || [])
    if (laTepVideo(u)) viec.push({ tin: t.id, tieuDe: t.title, url: u, ma: nhanDang(u) });

// ── 3. KHỚP ─────────────────────────────────────────────────────────────────
const theoMa = new Map(tren.map((v) => [nhanDang(v.ten), v]));
const khop = [], hut = [];
for (const v of viec) {
  const y = theoMa.get(v.ma);
  if (y) khop.push({ ...v, yt: y });
  else hut.push(v);
}

console.log(`KHỚP ĐƯỢC: ${khop.length}/${viec.length} video`);
for (const k of khop)
  console.log(`  ✓ ${k.ma.padEnd(22)} → https://youtu.be/${k.yt.id}  (${k.yt.xem} lượt xem)  ${String(k.tieuDe).slice(0, 40)}`);
if (hut.length) {
  console.log(`\nCHƯA KHỚP: ${hut.length} — chưa tải lên kênh, hoặc đã đổi tên lúc tải:`);
  for (const h of hut) console.log(`  · ${h.ma}`);
}
const thua = tren.filter((v) => !viec.some((x) => x.ma === nhanDang(v.ten)));
if (thua.length) {
  console.log(`\nTrên kênh có ${thua.length} video không ứng với tin nào (video marketing, hoặc tên đã đổi):`);
  for (const v of thua) console.log(`  · ${v.ten}`);
}

if (!AP && !XOA_TEP) {
  console.log("\nChưa đổi gì. Ưng thì chạy lại với --ap để ghi link YouTube vào tin.");
  process.exit(0);
}

// ── 4. GHI LINK YOUTUBE VÀO TIN ─────────────────────────────────────────────
if (AP) {
  console.log("\nĐang ghi link vào tin…");
  const theoTin = new Map();
  for (const k of khop) theoTin.set(k.tin, (theoTin.get(k.tin) ?? []).concat(k));
  let xong = 0;
  for (const [maTin, ds] of theoTin) {
    const t = tin.find((x) => x.id === maTin);
    // Giữ NGUYÊN thứ tự ảnh/video trong tin — chỉ thay đúng ô video đó bằng link.
    const moi = t.images.map((u) => {
      const k = ds.find((x) => x.url === u);
      return k ? `https://youtu.be/${k.yt.id}` : u;
    });
    const r = await fetch(`${URL_}/rest/v1/listings?id=eq.${encodeURIComponent(maTin)}`, {
      method: "PATCH",
      headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ images: moi }),
    });
    if (r.ok) { xong++; process.stdout.write(`\r  ${xong}/${theoTin.size} tin`); }
    else console.log(`\n  ✗ tin ${maTin}: ${r.status} ${(await r.text()).slice(0, 120)}`);
  }
  console.log(`\nĐã thay link cho ${xong} tin.`);
  console.log("→ Mở web kiểm vài tin thấy video chạy, rồi mới chạy --xoa-tep để dọn kho.");
}

// ── 5. XOÁ VIDEO KHỎI KHO (chạy sau khi đã kiểm) ────────────────────────────
if (XOA_TEP) {
  // Chỉ xoá tệp KHÔNG còn tin nào trỏ tới — đọc lại DB cho chắc, không tin bộ nhớ cũ.
  const lai = await (await fetch(`${URL_}/rest/v1/listings?select=images&limit=20000`, { headers: H })).json();
  const conDung = new Set(lai.flatMap((t) => t.images || []).map((u) => decodeURIComponent(u.replace(/^.*\//, ""))));
  const canXoa = [...new Set(viec.map((v) => decodeURIComponent(v.url.replace(/^.*\//, ""))))].filter((t) => !conDung.has(t));
  console.log(`\nXoá ${canXoa.length} tệp video khỏi kho (đã không còn tin nào dùng)…`);
  if (canXoa.length) {
    const r = await fetch(`${URL_}/storage/v1/object/listings`, {
      method: "DELETE",
      headers: H,
      body: JSON.stringify({ prefixes: canXoa }),
    });
    const kq = r.ok ? await r.json() : [];
    console.log(`Đã xoá ${Array.isArray(kq) ? kq.length : 0} tệp.`);
  }
}
