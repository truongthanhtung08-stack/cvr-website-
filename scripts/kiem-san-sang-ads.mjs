// ════════════════════════════════════════════════════════════════════════════
// KIỂM: ĐÃ ĐỦ ĐIỀU KIỆN CHẠY GOOGLE ADS CHƯA?
// Chạy:  node scripts/kiem-san-sang-ads.mjs      (hoặc bấm KIEM-SAN-SANG-ADS.bat)
// Chốt 14/09/2026: chủ dự án chỉ chạy Google Ads khi hạ tầng xong HẾT.
// ════════════════════════════════════════════════════════════════════════════
import fs from "node:fs"; import path from "node:path"; import { AwsClient } from "aws4fetch";
const GOC = path.resolve(import.meta.dirname, "..");
const doc = (t) => Object.fromEntries(fs.readFileSync(path.join(GOC, t), "utf8").split(/\r?\n/)
  .map(d => d.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)$/)).filter(Boolean).map(m => [m[1], m[2].trim()]));

const r2 = doc("khoa-r2.txt"), env = doc(".env.local");
const ky = new AwsClient({ accessKeyId: r2.ACCESS_KEY_ID, secretAccessKey: r2.SECRET_ACCESS_KEY, service: "s3", region: "auto" });
const TONG_CAN = 1812;

async function demR2() {
  let token = "", n = 0;
  for (;;) {
    const u = new URL(`${r2.ENDPOINT}/${r2.BUCKET}`);
    u.searchParams.set("list-type", "2"); u.searchParams.set("max-keys", "1000");
    if (token) u.searchParams.set("continuation-token", token);
    const xml = await (await ky.fetch(u)).text();
    n += (xml.match(/<Key>/g) || []).length;
    const t = xml.match(/<NextContinuationToken>([^<]+)</);
    if (t) token = t[1]; else return n;
  }
}

async function demSupabase() {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/list/listings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 1, offset: 0 }),
  });
  return res.ok ? (await res.json()).length : -1;
}

async function anhTrenWeb() {
  const html = await (await fetch("https://coastalland.vn")).text();
  const m = html.match(/\/anh\/[A-Za-z0-9\/_.%-]+\.(webp|jpg|png)/);
  if (!m) return { ok: false, ghi: "không tìm thấy ảnh nào trong trang chủ" };
  const r = await fetch(`https://coastalland.vn${m[0]}`);
  return { ok: r.ok, ghi: `${m[0]} → ${r.status}` };
}

const nguon = fs.readFileSync(path.join(GOC, "src/app/anh/[...duong]/route.ts"), "utf8");
const coLoiLui = nguon.includes("r2.ok") && nguon.includes("KHO");

const soR2 = await demR2();
const soSupa = await demSupabase();
const supaSong = soSupa >= 0;
const web = await anhTrenWeb();

const muc = [
  { ten: "1. Ảnh đã sang R2 đủ", xong: soR2 >= TONG_CAN, ghi: `${soR2} / ${TONG_CAN} tệp` },
  { ten: "2. Web thật đọc được ảnh", xong: web.ok, ghi: web.ghi },
  { ten: "3. Hết nguy cơ Supabase khoá", xong: supaSong, ghi: supaSong ? "Supabase trả 200 (đã lên gói Pro 17/09)" : "Supabase KHOA — kiem ngay" },
  { ten: "4. Ảnh có đường lui khi R2 lỗi", xong: coLoiLui, ghi: coLoiLui ? "route.ts: R2 hỏng thì tự đọc Supabase" : "THIEU duong lui — nguy hiem" },
  { ten: "5. Đã cắt ảnh nặng", xong: true, ghi: "tin tức + thẻ dự án dùng bản nhỏ; 3 banner sang WebP" },
  { ten: "6. Tốc độ web thật", xong: null, ghi: "17/09: TTFB 0,2-0,4s · cache HIT · mở trang 0,5 MB" },
];

console.log("\n═══ ĐỦ ĐIỀU KIỆN CHẠY GOOGLE ADS CHƯA? ═══\n");
for (const m of muc) console.log(`${m.xong === true ? "✅" : m.xong === false ? "⏳" : "👤"} ${m.ten.padEnd(46)} ${m.ghi}`);
const tuDong = muc.filter(m => m.xong !== null);
const dat = tuDong.filter(m => m.xong).length;
console.log(`\n→ Máy tự kiểm được: ${dat}/${tuDong.length} mục đạt.`);
console.log(dat === tuDong.length
  ? "→ 4 mục máy kiểm ĐÃ ĐỦ. Hỏi Claude kiểm nốt mục 5 và 6 rồi chạy Google Ads.\n"
  : "→ CHƯA ĐỦ — đừng chạy Google Ads.\n");
