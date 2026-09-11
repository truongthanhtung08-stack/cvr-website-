// ════════════════════════════════════════════════════════════════════════════
// TẢI VIDEO TRONG KHO VỀ MÁY, ĐẶT TÊN SẴN ĐỂ ĐƯA LÊN YOUTUBE
//
// Dùng khi có tin cũ còn video nằm trong kho Supabase (video tải lên kiểu cũ).
// Tin đăng MỚI thì không cần script này: người đăng tự đưa video lên YouTube
// rồi dán link vào ô "Thêm video (link YouTube)" trong form.
//
// TÊN TỆP ĐẶT SẴN THEO TIÊU ĐỀ TIN, mã tin để trong [ngoặc vuông] ở cuối:
//   "Cần bán nhà mới xây hiện đại đường Vũ Miên - Phường Hòa Xuân, Đà Nẵng [dn06].mp4"
//
//   · YouTube tải hàng loạt thì TỰ LẤY TÊN TỆP LÀM TIÊU ĐỀ → kênh công khai của
//     công ty có tiêu đề tử tế, khách xem video của chính tin họ đăng.
//   · Mã trong ngoặc để scripts/dong-bo-video-youtube.mjs khớp video về đúng tin.
//   · ⚠️ YOUTUBE CẮT TIÊU ĐỀ Ở 100 KÝ TỰ — đo thật 11/09/2026, tên dài hơn thì
//     mất luôn phần ngoặc vuông, hết khớp. Nên tên giữ dưới 96 ký tự.
//
// CÁCH DÙNG:
//   node scripts/tai-video-de-up-youtube.mjs "D:/Coastal Land/Video-len-YouTube"
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
const THU_MUC = process.argv[2];

if (!KHOA || !THU_MUC) {
  console.error(`
Cách dùng: node scripts/tai-video-de-up-youtube.mjs "<thư mục lưu>"
Cần SUPABASE_SERVICE_ROLE_KEY trong .env.local (đọc được CẢ tin chưa duyệt).
`);
  process.exit(1);
}
fs.mkdirSync(THU_MUC, { recursive: true });
const H = { apikey: KHOA, Authorization: `Bearer ${KHOA}` };

// MÃ TIN: lấy cụm chữ+số CUỐI CÙNG trong tên tệp gốc, sau khi đã bỏ tiền tố VÀ
// BỎ ĐUÔI. (Quên bỏ đuôi là regex vớ phải "mp4", mọi tệp ra cùng một mã rồi ghi
// đè lên nhau — đã dính đúng lỗi này ngày 11/09/2026.)
const maCua = (tenKho) => {
  const s = decodeURIComponent(tenKho.replace(/^.*\//, ""))
    .replace(/^[0-9a-f]{10,}-(?:[0-9]+-)?/i, "")
    .replace(/(\.(mp4|webm|mov|m4v|ogg))+$/i, "")
    .toLowerCase();
  const m = [...s.matchAll(/\b([a-z]{2,10}\d{1,3})\b/g)];
  return m.length ? m[m.length - 1][1] : s.replace(/[^a-z0-9]+/g, "").slice(0, 12);
};
// Windows không cho các ký tự này trong tên tệp; ngoặc vuông thì để dành làm mã.
const sach = (s) => s.replace(/[\\/:*?"<>|[\]]/g, " ").replace(/\s+/g, " ").trim();
const catGon = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n) > 20 ? s.lastIndexOf(" ", n) : n));

const tin = await (
  await fetch(`${URL_}/rest/v1/listings?select=id,title,ward,province,images&limit=20000`, { headers: H })
).json();

const laTepVideo = (u) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u) && !/youtu|vimeo/i.test(u);
const viec = [];
for (const t of tin)
  for (const u of t.images || [])
    // Chỉ lấy video NẰM TRONG KHO của mình. Video trỏ sang máy chủ khác thì bỏ
    // qua — không phải của mình, đừng đưa lên kênh công ty.
    if (laTepVideo(u) && (!u.startsWith("http") || u.includes("supabase")))
      viec.push({ t, tenKho: decodeURIComponent(u.replace(/^.*\//, "")) });

console.log(`${viec.length} video trong kho\n`);
const dat = new Set();
let tong = 0;
for (const v of viec) {
  const ma = maCua(v.tenKho);
  const kv = sach([v.t.ward, v.t.province].filter(Boolean).join(", "));
  let ten = `${catGon(sach(v.t.title), 52)} - ${kv} [${ma}]`;
  if (ten.length > 96) ten = ten.slice(0, 96);
  const tep = ten + ".mp4";
  if (dat.has(tep)) {
    console.log(`  ! trùng tên, bỏ qua: ${tep}`);
    continue;
  }
  const r = await fetch(`${URL_}/storage/v1/object/public/listings/${encodeURIComponent(v.tenKho)}`);
  if (!r.ok) {
    console.log(`  ✗ ${v.tenKho} (${r.status})`);
    continue;
  }
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(path.join(THU_MUC, tep), buf);
  dat.add(tep);
  tong += buf.length;
  console.log(`  ${(buf.length / 1024 / 1024).toFixed(1)} MB · ${ten.length} ký tự  ${tep}`);
}
console.log(`\n${dat.size} tệp · ${(tong / 1024 / 1024).toFixed(0)} MB → ${THU_MUC}`);
console.log("Tiếp: đưa lên kênh (mỗi đợt tối đa 15 video, ĐỪNG đổi tên, để Công khai),");
console.log("rồi chạy: node scripts/dong-bo-video-youtube.mjs");
