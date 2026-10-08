// ============================================================================
// SEO — RÀ TOÀN BỘ TRANG TRONG SITEMAP (chạy hằng ngày, chủ dự án 08/10/2026: "SEO là tiên quyết")
//
//   node scripts/seo-kiem-tra.mjs [https://coastalland.vn]
//
// Với MỖI địa chỉ trong sitemap: mã trạng thái · <title> (thiếu / trùng / quá dài) ·
// mô tả (thiếu / trùng / quá dài, quá ngắn) · số thẻ <h1> · canonical (thiếu / trỏ nơi khác) ·
// noindex nhầm · ảnh thiếu alt · dung lượng HTML · chữ cấm ("Miền Trung", "Sàn giao dịch").
// In bảng tổng hợp + danh sách lỗi, ghi kết quả JSON vào docs/seo-kiem-tra-<ngày>.json.
// Chỉ ĐỌC web, không sửa gì.
// ============================================================================
import fs from "node:fs";

const SITE = (process.argv[2] || "https://coastalland.vn").replace(/\/$/, "");
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const CHU_CAM = [/Miền Trung/i, /Sàn giao dịch bất động sản/i, /Duyên hải/i];
const NGAN_TITLE = 65, DAI_DESC = 165, NGAN_DESC = 70, NANG_KB = 450;

const giai = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const lay = (h, re) => { const m = h.match(re); return m ? giai(m[1]).trim() : ""; };

const sm = await (await fetch(`${SITE}/sitemap.xml`, { headers: { "user-agent": UA } })).text();
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => !/\.(jpe?g|png|webp|avif)(\?|$)/i.test(u));

const kq = [];
let i = 0;
async function kiem(u) {
  const r = { url: u.replace(SITE, "") || "/", loi: [] };
  try {
    const res = await fetch(u.replace("https://coastalland.vn", SITE), { headers: { "user-agent": UA }, redirect: "manual" });
    r.ma = res.status;
    if (res.status !== 200) { r.loi.push(`mã ${res.status}`); return r; }
    const h = await res.text();
    r.kb = Math.round(h.length / 1024);
    r.title = lay(h, /<title>([^<]*)<\/title>/);
    r.desc = lay(h, /<meta name="description" content="([^"]*)"/);
    r.h1 = (h.match(/<h1[\s>]/g) || []).length;
    r.canonical = lay(h, /<link rel="canonical" href="([^"]*)"/);
    r.robots = lay(h, /<meta name="robots" content="([^"]*)"/);
    r.anhThieuAlt = (h.match(/<img(?![^>]*alt="[^"])[^>]*>/g) || []).filter((t) => !/logo|banner-app-bg|aria-hidden/.test(t)).length;
    if (!r.title) r.loi.push("thiếu title");
    else if (r.title.length > NGAN_TITLE) r.loi.push(`title dài ${r.title.length}`);
    if (!r.desc) r.loi.push("thiếu mô tả");
    else if (r.desc.length > DAI_DESC) r.loi.push(`mô tả dài ${r.desc.length}`);
    else if (r.desc.length < NGAN_DESC) r.loi.push(`mô tả ngắn ${r.desc.length}`);
    if (r.h1 !== 1) r.loi.push(`${r.h1} thẻ h1`);
    if (!r.canonical) r.loi.push("thiếu canonical");
    else if (r.canonical.replace(/\/$/, "") !== u.replace(/\/$/, "")) r.loi.push(`canonical → ${r.canonical}`);
    if (/noindex/i.test(r.robots)) r.loi.push("noindex (nằm trong sitemap)");
    if (r.anhThieuAlt) r.loi.push(`${r.anhThieuAlt} ảnh thiếu alt`);
    if (r.kb > NANG_KB) r.loi.push(`nặng ${r.kb}KB`);
    const vanBan = (r.title + " " + r.desc);
    for (const re of CHU_CAM) if (re.test(vanBan)) r.loi.push(`chữ cấm: ${re.source}`);
  } catch (e) {
    r.loi.push("không tải được: " + e.message);
  }
  return r;
}
// 6 luồng song song — nhẹ cho máy chủ
const hang = [...urls];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (hang.length) { const u = hang.shift(); kq.push(await kiem(u)); if (++i % 50 === 0) console.error(`… ${i}/${urls.length}`); }
}));

// Trùng tiêu đề / mô tả
const dem = (k) => kq.reduce((m, r) => (r[k] ? m.set(r[k], (m.get(r[k]) || 0) + 1) : m), new Map());
const tT = dem("title"), tD = dem("desc");
for (const r of kq) {
  if (r.title && tT.get(r.title) > 1) r.loi.push("title trùng");
  if (r.desc && tD.get(r.desc) > 1) r.loi.push("mô tả trùng");
}

const coLoi = kq.filter((r) => r.loi.length);
const nhom = {};
for (const r of coLoi) for (const l of r.loi) { const k = l.replace(/\d+/g, "N").replace(/→ .*/, "→ …"); nhom[k] = (nhom[k] || 0) + 1; }
const kbTB = Math.round(kq.filter((r) => r.kb).reduce((s, r) => s + r.kb, 0) / Math.max(1, kq.filter((r) => r.kb).length));

console.log(`SITE ${SITE} · ${urls.length} địa chỉ · ${coLoi.length} trang có lỗi · HTML trung bình ${kbTB}KB`);
console.log("Nhóm lỗi:", JSON.stringify(Object.entries(nhom).sort((a, b) => b[1] - a[1])));
for (const r of coLoi.slice(0, 40)) console.log(`- ${r.url} :: ${r.loi.join(" · ")}`);
const ngay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(`docs/seo-kiem-tra-${ngay}.json`, JSON.stringify({ ngay, site: SITE, tong: urls.length, coLoi: coLoi.length, kbTB, nhom, chiTiet: kq }, null, 1));
console.log(`→ docs/seo-kiem-tra-${ngay}.json`);
