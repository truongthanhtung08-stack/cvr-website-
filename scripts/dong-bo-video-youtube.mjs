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
// LẤY DANH SÁCH KÊNH: đọc trang kênh công khai (scripts/doc-video-kenh.mjs),
// KHÔNG cần khoá API, không đụng tới Google Cloud (tài khoản Google của dự án
// đang bị gắn cờ vì vụ Maps — xem docs/BAN-GIAO-GOOGLE-MAPS.md). Đọc được CẢ
// SHORTS và lật hết các trang, nên tải lên bao nhiêu đợt cũng khớp được.
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
const TEN_KENH = "@CoastalLandvn"; // kênh Coastal Land
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
// ĐỌC CẢ SHORTS. Bản đầu đọc RSS `feeds/videos.xml` và ngày 12/09/2026 trả về
// ĐÚNG 0 VIDEO trong khi kênh có 14 — vì video bất động sản quay dọc dưới 3 phút
// bị YouTube tự xếp thành Shorts, mà RSS thì không liệt kê Shorts (RSS cũng chỉ
// trả 15 video mới nhất, qua 15 tin là hụt). Nay đọc thẳng trang kênh công khai.
const tren = await docVideoKenh(TEN_KENH);
console.log(`Kênh Coastal Land: ${tren.length} video công khai (tính cả Shorts)\n`);
if (tren.length === 0) {
  console.log("Chưa có video nào — tải lên kênh xong rồi chạy lại.");
  console.log("⚠️ Nhớ: để chế độ CÔNG KHAI và ĐỪNG ĐỔI TÊN tệp khi tải lên.");
  process.exit(0);
}

// MỘT MÃ TIN LÊN KÊNH HAI LẦN thì phải chọn một. Ưu tiên bản NHIỀU LƯỢT XEM hơn
// — đó là bản khách đang thật sự xem, đổi sang bản mới là vứt hết lượt xem cũ.
const trungMa = new Map();
for (const v of tren) {
  const ma = nhanDang(v.ten);
  const cu = trungMa.get(ma);
  if (!cu) trungMa.set(ma, [v]);
  else cu.push(v);
}
// (Chọn bản nào nằm ở bước 3, sau khi biết tin đang gắn video nào.)

// ── 2. TIN ĐANG DÙNG VIDEO TẢI LÊN ──────────────────────────────────────────
const tin = await (await fetch(`${URL_}/rest/v1/listings?select=id,title,images&limit=20000`, { headers: H })).json();
const laTepVideo = (u) => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(u) && !/youtu|vimeo/i.test(u);
// TÁCH BẠCH BA THỨ, đừng gộp rồi báo sai:
//   · viec  — video NẰM TRONG KHO của mình, đây mới là việc phải làm
//   · ngoai — video nhúng thẳng từ sàn khác (vn1-cdn.pgimgs.com của
//             batdongsan.com.vn). KHÔNG phải của mình, không tải lên kênh được,
//             và cũng không tốn kho. Gộp chúng vào "chưa khớp" là báo cáo láo.
//   · daGan — mã video YouTube đã gắn sẵn trong tin, để biết cái nào trên kênh
//             còn nằm không.
const viec = [];
const ngoai = [];
const daGan = new Set();
for (const t of tin)
  for (const u of t.images || []) {
    const yt = String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/);
    if (yt) { daGan.add(yt[1]); continue; }
    if (!laTepVideo(u)) continue;
    const muc = { tin: t.id, tieuDe: t.title, url: u, ma: nhanDang(u) };
    if (String(u).startsWith(URL_)) viec.push(muc);
    else ngoai.push(muc);
  }

// ── 3. KHỚP ─────────────────────────────────────────────────────────────────
// MỘT MÃ TIN LÊN KÊNH HAI LẦN thì phải chọn một bản. Thứ tự ưu tiên:
//   ① bản ĐANG GẮN trong tin — đổi sang bản khác là đổi link đang chạy tốt,
//     vứt luôn lượt xem đã tích;  ② bản nhiều lượt xem hơn.
for (const [ma, ds] of trungMa) {
  ds.sort((a, b) => Number(daGan.has(b.id)) - Number(daGan.has(a.id)) || b.xem - a.xem);
  if (ds.length > 1) {
    console.log(`⚠️ Mã "${ma}" có ${ds.length} video trên kênh — chỉ dùng một:`);
    for (const v of ds)
      console.log(
        `     ${v === ds[0] ? "→ DÙNG" : "  bỏ  "} https://youtu.be/${v.id} (${v.xem} lượt xem${daGan.has(v.id) ? ", đang gắn trong tin" : ""})`,
      );
  }
}
const theoMa = new Map([...trungMa].map(([ma, ds]) => [ma, ds[0]]));
const khop = [], hut = [];
for (const v of viec) {
  const y = theoMa.get(v.ma);
  if (y) khop.push({ ...v, yt: y });
  else hut.push(v);
}

console.log(`VIDEO CÒN TRONG KHO: ${viec.length} — khớp được ${khop.length}`);
for (const k of khop)
  console.log(`  ✓ ${k.ma.padEnd(22)} → https://youtu.be/${k.yt.id}  (${k.yt.xem} lượt xem)  ${String(k.tieuDe).slice(0, 40)}`);
if (hut.length) {
  console.log(`\nCHƯA KHỚP: ${hut.length} — chưa tải lên kênh, hoặc đã đổi tên lúc tải:`);
  for (const h of hut) console.log(`  · ${h.ma}  ${String(h.tieuDe).slice(0, 50)}`);
}

const chuaGan = tren.filter((v) => !daGan.has(v.id));
console.log(`\nĐÃ GẮN VÀO TIN: ${tren.length - chuaGan.length}/${tren.length} video trên kênh`);
if (chuaGan.length) {
  console.log(`Còn ${chuaGan.length} video trên kênh chưa tin nào dùng:`);
  for (const v of chuaGan) console.log(`  · https://youtu.be/${v.id}  ${v.ten.slice(0, 60)}`);
}

if (ngoai.length) {
  console.log(`\n${ngoai.length} video NHÚNG TỪ SÀN KHÁC (không phải của mình, không tốn kho, script bỏ qua):`);
  const theoNha = new Map();
  for (const n of ngoai) {
    const nha = new URL(n.url).hostname;
    theoNha.set(nha, (theoNha.get(nha) ?? 0) + 1);
  }
  for (const [nha, so] of theoNha) console.log(`  · ${nha}: ${so} video`);
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
