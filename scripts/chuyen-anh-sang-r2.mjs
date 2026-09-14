// ════════════════════════════════════════════════════════════════════════════
// CHUYỂN ẢNH TỪ KHO SUPABASE SANG CLOUDFLARE R2
//
// Vì sao: ảnh đi từ Supabase (Tokyo) qua hàm Vercel rồi mới tới khách → ăn băng
// thông Supabase (5 GB/tháng, đã bị doạ khoá 08/10) + ăn CPU Vercel. R2 miễn phí
// băng thông và có máy chủ ngay VN.
//
// CHẠY LẠI ĐƯỢC NHIỀU LẦN: tệp nào đã có trên R2 đúng kích thước thì bỏ qua.
// Đứt giữa chừng (hết mạng, hết lượt) cứ chạy lại là nó làm nốt phần còn thiếu.
//
//   node scripts/chuyen-anh-sang-r2.mjs            → chuyển thật
//   node scripts/chuyen-anh-sang-r2.mjs --thu 5    → chỉ thử 5 tệp đầu
//
// Đường dẫn giữ NGUYÊN: kho Supabase `listings/abc.webp` → R2 `listings/abc.webp`
// nên route /anh/ chỉ cần đổi đúng địa chỉ gốc, không phải đổi gì khác.
// ════════════════════════════════════════════════════════════════════════════
import fs from "node:fs";
import path from "node:path";
import { AwsClient } from "aws4fetch";

const GOC = path.resolve(import.meta.dirname, "..");

function docFileKhoa(tep) {
  const o = {};
  for (const dong of fs.readFileSync(path.join(GOC, tep), "utf8").split(/\r?\n/)) {
    const m = dong.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)$/);
    if (m) o[m[1]] = m[2].trim();
  }
  return o;
}

const r2 = docFileKhoa("khoa-r2.txt");
const env = docFileKhoa(".env.local");

const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const KHOA_SUPA = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = r2.BUCKET;
const ENDPOINT = r2.ENDPOINT;

for (const [ten, gt] of Object.entries({ SUPA, KHOA_SUPA, BUCKET, ENDPOINT,
  ACCESS_KEY_ID: r2.ACCESS_KEY_ID, SECRET_ACCESS_KEY: r2.SECRET_ACCESS_KEY })) {
  if (!gt) { console.error(`❌ Thiếu ${ten} — xem khoa-r2.txt và .env.local`); process.exit(1); }
}

const DAU_SUPA = { Authorization: `Bearer ${KHOA_SUPA}`, apikey: KHOA_SUPA };
const DAU_SUPA_JSON = { ...DAU_SUPA, "Content-Type": "application/json" };

const ky = new AwsClient({
  accessKeyId: r2.ACCESS_KEY_ID,
  secretAccessKey: r2.SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

const gioiHan = (() => {
  const i = process.argv.indexOf("--thu");
  return i > -1 ? Number(process.argv[i + 1] || 5) : Infinity;
})();

// ── Liệt kê mọi tệp trong một thư mục của kho Supabase (đệ quy) ──────────────
async function lietKe(bucket, thuMuc = "") {
  const ra = [];
  let tu = 0;
  for (;;) {
    const res = await fetch(`${SUPA}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: DAU_SUPA_JSON,
      body: JSON.stringify({ prefix: thuMuc, limit: 1000, offset: tu, sortBy: { column: "name", order: "asc" } }),
    });
    if (!res.ok) throw new Error(`Liệt kê ${bucket}/${thuMuc} hỏng: ${res.status} ${await res.text()}`);
    const ds = await res.json();
    if (!ds.length) break;
    for (const m of ds) {
      const duong = thuMuc ? `${thuMuc}/${m.name}` : m.name;
      // id = null nghĩa là THƯ MỤC, không phải tệp
      if (m.id === null) ra.push(...await lietKe(bucket, duong));
      else ra.push({ duong, cỡ: m.metadata?.size ?? 0, loai: m.metadata?.mimetype || "application/octet-stream" });
    }
    if (ds.length < 1000) break;
    tu += ds.length;
  }
  return ra;
}

async function danhSachBucket() {
  const res = await fetch(`${SUPA}/storage/v1/bucket`, { headers: DAU_SUPA });
  if (!res.ok) throw new Error(`Không đọc được danh sách kho: ${res.status}`);
  return (await res.json()).map((b) => b.name);
}

// ── Đã có trên R2 chưa (và đúng cỡ chưa) ────────────────────────────────────
async function daCo(khoa, cỡ) {
  const res = await ky.fetch(`${ENDPOINT}/${BUCKET}/${khoa}`, { method: "HEAD" });
  if (res.status === 404) return false;
  if (!res.ok) return false;
  const len = Number(res.headers.get("content-length") || 0);
  return cỡ === 0 || len === cỡ;
}

async function chepMot(bucket, tep) {
  const khoa = `${bucket}/${tep.duong}`;
  if (await daCo(khoa, tep.cỡ)) return "bo-qua";

  const tai = await fetch(`${SUPA}/storage/v1/object/public/${bucket}/${tep.duong.split("/").map(encodeURIComponent).join("/")}`);
  if (!tai.ok) throw new Error(`Tải ${khoa} hỏng: ${tai.status}`);
  const body = Buffer.from(await tai.arrayBuffer());

  const day = await ky.fetch(`${ENDPOINT}/${BUCKET}/${khoa}`, {
    method: "PUT",
    body,
    headers: { "Content-Type": tai.headers.get("content-type") || tep.loai, "Content-Length": String(body.length) },
  });
  if (!day.ok) throw new Error(`Đẩy ${khoa} hỏng: ${day.status} ${await day.text()}`);
  return "da-chep";
}

// ── Chạy ────────────────────────────────────────────────────────────────────
const buckets = await danhSachBucket();
console.log(`Kho Supabase có ${buckets.length} bucket: ${buckets.join(", ")}`);

let tong = 0, chep = 0, boQua = 0, hong = 0;
const loi = [];

for (const bucket of buckets) {
  const tep = await lietKe(bucket);
  console.log(`\n▶ ${bucket}: ${tep.length} tệp`);
  for (const t of tep) {
    if (tong >= gioiHan) break;
    tong++;
    try {
      const kq = await chepMot(bucket, t);
      kq === "da-chep" ? chep++ : boQua++;
    } catch (e) {
      hong++;
      loi.push(`${bucket}/${t.duong}: ${e.message}`);
    }
    if (tong % 25 === 0) console.log(`   ... ${tong} tệp — chép ${chep} · bỏ qua ${boQua} · hỏng ${hong}`);
  }
  if (tong >= gioiHan) break;
}

console.log(`\n═══ XONG ═══`);
console.log(`Tổng xét: ${tong} · Đã chép: ${chep} · Bỏ qua (đã có): ${boQua} · Hỏng: ${hong}`);
if (loi.length) {
  fs.writeFileSync(path.join(GOC, ".tmp-r2-loi.txt"), loi.join("\n"));
  console.log(`Danh sách hỏng ghi ở .tmp-r2-loi.txt — chạy lại lệnh này là nó thử lại phần hỏng.`);
}
