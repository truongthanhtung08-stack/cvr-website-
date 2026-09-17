// ============================================================================
// GỠ ẢNH BỊ NHÉT NHẦM VÀO TIN CŨ — sự cố đợt 10/09/2026.
// ----------------------------------------------------------------------------
// Vì sao có script này: trang nhập hàng loạt đối chiếu `ma_anh` để biết tin đã
// đăng hay chưa. Cowork đánh lại mã dn01…pt06 MỖI NGÀY, nên ảnh của đợt mới bị
// gộp vào tin CŨ cùng mã — đo thật: 229 ảnh của đợt 10/09 chui vào 19 tin đăng
// ngày 01/09 · 05/09 · 07/09, khách xem tin này lại thấy ảnh nhà khác.
// (Trang đã được sửa để không tái diễn: chỉ đối chiếu với tin đăng trong 3 ngày.)
//
// Script chỉ GỠ ảnh lạ ra khỏi tin cũ, KHÔNG xoá tệp trong kho và KHÔNG đụng tin
// của đợt mới — ảnh gỡ ra vẫn còn nguyên để gắn về đúng tin.
//
// CÁCH DÙNG (mặc định chỉ xem, không ghi gì):
//   node scripts/go-anh-lan-tin.mjs 2026-09-15
//   node scripts/go-anh-lan-tin.mjs 2026-09-15 --that      ← ghi thật
//
// Tham số: mốc ngày tải ảnh của ĐỢT MỚI (ảnh tải từ ngày này trở đi là của đợt
// mới, nên không được nằm trong tin đăng TRƯỚC mốc đó).
// Trước khi ghi, script tự lưu bản sao danh sách ảnh cũ ra tệp .json để hoàn tác.
// ============================================================================

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const moc = process.argv[2];
const ghiThat = process.argv.includes("--that");
if (!moc || !/^\d{4}-\d{2}-\d{2}$/.test(moc)) {
  console.error("Thiếu mốc ngày. Ví dụ: node scripts/go-anh-lan-tin.mjs 2026-09-15");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SB || !KEY) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

// ── 1. Ảnh trong kho tải lên TỪ MỐC trở đi = ảnh của đợt mới ────────────────
const kho = await fetch(`${URL_SB}/storage/v1/object/list/listings`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({ prefix: "", limit: 5000, sortBy: { column: "created_at", order: "desc" } }),
});
const objs = await kho.json();
if (!Array.isArray(objs)) {
  console.error("Không đọc được kho ảnh:", objs);
  process.exit(1);
}
const anhDotMoi = new Set(objs.filter((o) => (o.created_at ?? "") >= moc).map((o) => o.name));
console.log(`Ảnh tải lên từ ${moc}: ${anhDotMoi.size} tệp`);

// ── 2. Tin đăng TRƯỚC mốc mà đang chứa ảnh của đợt mới ──────────────────────
const res = await fetch(
  `${URL_SB}/rest/v1/listings?select=id,title,created_at,images,details&created_at=lt.${moc}&limit=5000`,
  { headers: H },
);
const tins = await res.json();
if (!Array.isArray(tins)) {
  console.error("Không đọc được bảng listings:", tins);
  process.exit(1);
}

const tenTep = (u) => decodeURIComponent(String(u).split("?")[0].split("/").pop() ?? "");
const canSua = [];
for (const t of tins) {
  const imgs = t.images ?? [];
  const giu = imgs.filter((u) => !anhDotMoi.has(tenTep(u)));
  if (giu.length !== imgs.length) canSua.push({ t, giu, go: imgs.length - giu.length });
}

console.log(`\nTin cũ đang chứa ảnh của đợt mới: ${canSua.length}`);
let tongGo = 0;
for (const { t, giu, go } of canSua) {
  tongGo += go;
  console.log(
    `  [${t.details?.maAnh ?? "-"}] ${(t.created_at ?? "").slice(0, 10)} · gỡ ${go} ảnh, còn ${giu.length} · "${(t.title ?? "").slice(0, 55)}"`,
  );
  if (!giu.length) console.log("      ⚠️ GỠ XONG TIN NÀY KHÔNG CÒN ẢNH NÀO — kiểm tra lại trước khi ghi");
}
console.log(`\nTổng cộng gỡ ${tongGo} ảnh khỏi ${canSua.length} tin.`);

if (!ghiThat) {
  console.log("\n(Đang ở chế độ XEM TRƯỚC — thêm --that để ghi thật.)");
  process.exit(0);
}

// ── 3. Sao lưu rồi ghi ──────────────────────────────────────────────────────
const tepLuu = resolve(ROOT, `sao-luu-anh-truoc-khi-go-${Date.now()}.json`);
writeFileSync(tepLuu, JSON.stringify(canSua.map(({ t }) => ({ id: t.id, images: t.images })), null, 2), "utf8");
console.log(`Đã lưu bản sao để hoàn tác: ${tepLuu}`);

let xong = 0;
for (const { t, giu } of canSua) {
  const r = await fetch(`${URL_SB}/rest/v1/listings?id=eq.${t.id}`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ images: giu }),
  });
  if (!r.ok) {
    console.error(`Lỗi khi sửa tin ${t.id}:`, await r.text());
    break;
  }
  xong++;
}
console.log(`Đã trả ${xong}/${canSua.length} tin về đúng bộ ảnh của nó.`);
