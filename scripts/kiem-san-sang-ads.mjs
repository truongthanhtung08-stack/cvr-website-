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
const conDungR2Dev = nguon.includes("r2.dev");

const soR2 = await demR2();
const soSupa = await demSupabase();
const web = await anhTrenWeb();

const muc = [
  { ten: "1. Ảnh đã sang R2 đủ", xong: soR2 >= TONG_CAN, ghi: `${soR2} / ${TONG_CAN} tệp` },
  { ten: "2. Web thật đọc được ảnh", xong: web.ok, ghi: web.ghi },
  { ten: "3. Đã xoá ảnh cũ ở Supabase", xong: soSupa === 0, ghi: soSupa < 0 ? "không đọc được kho" : (soSupa === 0 ? "kho trống" : "kho VẪN CÒN ảnh") },
  { ten: "4. Đã bỏ đường r2.dev (dùng tên miền riêng)", xong: !conDungR2Dev, ghi: conDungR2Dev ? "route.ts còn dùng r2.dev" : "đã đổi sang tên miền riêng" },
  { ten: "5. Đã cắt bớt ảnh tải cùng lúc", xong: null, ghi: "phải đo bằng trình duyệt — Claude kiểm" },
  { ten: "6. Đo lần cuối trên coastalland.vn", xong: null, ghi: "Claude kiểm" },
];

console.log("\n═══ ĐỦ ĐIỀU KIỆN CHẠY GOOGLE ADS CHƯA? ═══\n");
for (const m of muc) console.log(`${m.xong === true ? "✅" : m.xong === false ? "⏳" : "👤"} ${m.ten.padEnd(46)} ${m.ghi}`);
const tuDong = muc.filter(m => m.xong !== null);
const dat = tuDong.filter(m => m.xong).length;
console.log(`\n→ Máy tự kiểm được: ${dat}/${tuDong.length} mục đạt.`);
console.log(dat === tuDong.length
  ? "→ 4 mục máy kiểm ĐÃ ĐỦ. Hỏi Claude kiểm nốt mục 5 và 6 rồi chạy Google Ads.\n"
  : "→ CHƯA ĐỦ — đừng chạy Google Ads.\n");
