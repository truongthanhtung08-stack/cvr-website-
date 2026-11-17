// ════════════════════════════════════════════════════════════════════════════
// ĐỒNG BỘ KHO ẢNH SUPABASE → CLOUDFLARE R2 (17/11/2026) — bản nhanh của chuyen-anh-sang-r2.mjs.
// Liệt kê HẾT hai bên một lần, so tên + cỡ, chỉ chép tệp thiếu / lệch cỡ; 8 tệp song song, mỗi tệp tối đa 2 phút,
// hỏng thử lại 2 lần, in rõ tệp hỏng. CHỈ THÊM, KHÔNG XOÁ gì ở cả hai bên. Chạy lại bao nhiêu lần cũng được.
//   node scripts/dong-bo-r2.mjs          → chép thật
//   node scripts/dong-bo-r2.mjs --dem    → chỉ đếm thiếu bao nhiêu
// ════════════════════════════════════════════════════════════════════════════
import fs from "node:fs";
import path from "node:path";
import { AwsClient } from "aws4fetch";

const GOC = path.resolve(import.meta.dirname, "..");
const doc = (tep) =>
  Object.fromEntries(
    fs.readFileSync(path.join(GOC, tep), "utf8").split(/\r?\n/).map((d) => d.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim().replace(/^"|"$/g, "")]),
  );
const r2 = doc("khoa-r2.txt");
const env = doc(".env.local");
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
const ky = new AwsClient({ accessKeyId: r2.ACCESS_KEY_ID, secretAccessKey: r2.SECRET_ACCESS_KEY, service: "s3", region: "auto" });
const CHI_DEM = process.argv.includes("--dem");

const coHan = (ms) => AbortSignal.timeout(ms);

async function supabase() {
  const ds = [];
  const buckets = (await (await fetch(`${SUPA}/storage/v1/bucket`, { headers: H })).json()).map((b) => b.name);
  async function duyet(b, prefix) {
    for (let off = 0; ; off += 1000) {
      const r = await (await fetch(`${SUPA}/storage/v1/object/list/${b}`, { method: "POST", headers: H, body: JSON.stringify({ prefix, limit: 1000, offset: off }) })).json();
      if (!Array.isArray(r) || !r.length) break;
      for (const o of r) {
        const duong = prefix ? `${prefix}/${o.name}` : o.name;
        if (o.id === null) await duyet(b, duong);
        else ds.push({ bucket: b, duong, khoa: `${b}/${duong}`, co: o.metadata?.size ?? 0, loai: o.metadata?.mimetype });
      }
      if (r.length < 1000) break;
    }
  }
  for (const b of buckets) await duyet(b, "");
  return ds;
}

async function r2CoGi() {
  const co = new Map();
  let tiep = "";
  for (;;) {
    const u = `${r2.ENDPOINT}/${r2.BUCKET}?list-type=2&max-keys=1000${tiep ? `&continuation-token=${encodeURIComponent(tiep)}` : ""}`;
    const xml = await (await ky.fetch(u)).text();
    for (const m of xml.matchAll(/<Contents>[\s\S]*?<Key>([\s\S]*?)<\/Key>[\s\S]*?<Size>(\d+)<\/Size>[\s\S]*?<\/Contents>/g))
      co.set(m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'"), Number(m[2]));
    const t = xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/);
    if (!t) break;
    tiep = t[1];
  }
  return co;
}

async function chep(t) {
  const tai = await fetch(`${SUPA}/storage/v1/object/public/${t.bucket}/${t.duong.split("/").map(encodeURIComponent).join("/")}`, { signal: coHan(120_000) });
  if (!tai.ok) throw new Error(`tải Supabase ${tai.status}`);
  const body = Buffer.from(await tai.arrayBuffer());
  const day = await ky.fetch(`${r2.ENDPOINT}/${r2.BUCKET}/${t.khoa.split("/").map(encodeURIComponent).join("/")}`, {
    method: "PUT",
    body,
    headers: { "Content-Type": tai.headers.get("content-type") || t.loai || "application/octet-stream", "Content-Length": String(body.length) },
    signal: coHan(120_000),
  });
  if (!day.ok) throw new Error(`đẩy R2 ${day.status} ${(await day.text()).slice(0, 120)}`);
}

const [nguon, dich] = await Promise.all([supabase(), r2CoGi()]);
const thieu = nguon.filter((t) => dich.get(t.khoa) !== t.co);
console.log(`Supabase ${nguon.length} tệp · R2 ${dich.size} tệp · cần chép ${thieu.length} (${(thieu.reduce((s, t) => s + t.co, 0) / 1048576).toFixed(0)} MB)`);
if (CHI_DEM) process.exit(0);

let xong = 0;
const hong = [];
let i = 0;
async function tho() {
  while (i < thieu.length) {
    const t = thieu[i++];
    let loi = null;
    for (let lan = 0; lan < 3; lan++) {
      try { await chep(t); loi = null; break; } catch (e) { loi = e; }
    }
    if (loi) hong.push(`${t.khoa}: ${loi.message}`);
    else xong++;
    if ((xong + hong.length) % 200 === 0) console.log(`   ... ${xong + hong.length}/${thieu.length} — chép ${xong} · hỏng ${hong.length}`);
  }
}
await Promise.all(Array.from({ length: 8 }, tho));
console.log(`XONG: chép ${xong} · hỏng ${hong.length}`);
for (const h of hong) console.log("  HỎNG", h);
