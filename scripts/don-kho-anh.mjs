// ════════════════════════════════════════════════════════════════════════════
// DỌN KHO ẢNH SUPABASE — xoá tệp KHÔNG tin/dự án/bài viết/nội dung nào dùng tới
//
// VÌ SAO KHO ĐẦY RÁC (đo 11/09/2026): tên tệp cũ đặt theo GIỜ TẢI LÊN nên cùng
// một tấm ảnh tải lên lần nữa là thành tệp mới. Nhập hàng loạt chạy lại, sửa tin
// rồi đăng lại… mỗi lần phình thêm một bộ ảnh. Kết quả: 2.954 tệp / 2.082 MB thì
// 2.058 tệp / 1.532 MB không ai dùng — 73% kho là rác.
// Gốc đã chặn trong src/lib/uploadImage.ts (tên tệp = mã băm nội dung).
// Script này dọn phần đã lỡ sinh ra.
//
// ⚠️ BẮT BUỘC DÙNG KHOÁ service_role, KHÔNG dùng khoá anon:
//   · Khoá anon chỉ đọc được tin ĐÃ DUYỆT. Tin khách đang CHỜ DUYỆT bị che →
//     ảnh của họ sẽ bị tính nhầm là rác và xoá mất. Không lấy lại được.
//   · Khoá anon cũng không xoá được: Supabase từ chối IM LẶNG (trả về danh sách
//     rỗng như thể thành công). Đã đo thật, tưởng xoá xong mà kho y nguyên.
//
// CÁCH DÙNG:
//   node scripts/don-kho-anh.mjs            → chỉ XEM, không xoá gì
//   node scripts/don-kho-anh.mjs --xoa      → xoá thật, xong tự kiểm lại web
//   node scripts/don-kho-anh.mjs --giu-video → giữ nguyên mọi video (chưa kịp
//                                              đưa lên YouTube thì dùng cờ này)
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
const XOA = process.argv.includes("--xoa");
const GIU_VIDEO = process.argv.includes("--giu-video");
const BUCKET = "listings";

if (!KHOA) {
  console.error(`
❌ Thiếu khoá service_role.

   Supabase → Project Settings → API → dòng "service_role" → Reveal → copy
   rồi thêm vào .env.local:

       SUPABASE_SERVICE_ROLE_KEY=<khoá vừa copy>

   (Khoá này TOÀN QUYỀN với dữ liệu — chỉ để trong .env.local, đừng commit,
    đừng dán vào chat. .env.local đã nằm trong .gitignore.)
`);
  process.exit(1);
}

const H = { apikey: KHOA, Authorization: `Bearer ${KHOA}`, "Content-Type": "application/json" };
const MB = (byte) => (byte / 1024 / 1024).toFixed(0);
const co = (f) => Number(f.metadata?.size || 0);
const laVideo = (t) => /\.(mp4|webm|mov|m4v|ogg)$/i.test(t);

// ── 1. TOÀN BỘ TỆP TRONG KHO ────────────────────────────────────────────────
async function liet_ke_kho() {
  const ds = [];
  for (let off = 0; ; off += 1000) {
    const r = await fetch(`${URL_}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({ limit: 1000, offset: off, prefix: "", sortBy: { column: "name", order: "asc" } }),
    });
    if (!r.ok) throw new Error(`Không liệt kê được kho: ${r.status} ${await r.text()}`);
    const lo = await r.json();
    if (!Array.isArray(lo) || lo.length === 0) break;
    ds.push(...lo);
    if (lo.length < 1000) break;
  }
  return ds;
}

// ── 2. TỆP ĐANG ĐƯỢC DÙNG — quét MỌI nguồn, MỌI trạng thái ─────────────────
// Quét cả cột details/description vì ảnh còn được chèn giữa bài mô tả.
async function liet_ke_dang_dung() {
  const dung = new Set();
  const nhat = (s) => {
    if (typeof s !== "string") return;
    // Tên tệp kiểu CŨ (<giờ>-<số>-tên) lẫn kiểu MỚI (<mã băm>-tên) đều bắt được.
    for (const m of s.matchAll(/([0-9a-f]{10,}-[^"'\\\s,\]}]+|[0-9]{10,}-[0-9]+-[^"'\\\s,\]}]+)/g))
      dung.add(decodeURIComponent(m[1].replace(/^.*\//, "")));
  };
  const quet = (v) => {
    if (v == null) return;
    if (typeof v === "string") return nhat(v);
    if (Array.isArray(v)) return v.forEach(quet);
    if (typeof v === "object") return Object.values(v).forEach(quet);
  };

  const nguon = [
    ["listings", "select=*&limit=20000"], // MỌI trạng thái: duyệt, chờ duyệt, từ chối, nháp
    ["projects", "select=*&limit=5000"],
    ["articles", "select=*&limit=5000"],
    ["site_content", "select=*&limit=1000"],
  ];
  for (const [bang, q] of nguon) {
    const r = await fetch(`${URL_}/rest/v1/${bang}?${q}`, { headers: H });
    // Đọc hụt một nguồn là xoá nhầm ảnh của nguồn đó → DỪNG HẲN, không đoán tiếp.
    if (!r.ok) throw new Error(`Không đọc được bảng ${bang}: ${r.status} ${await r.text()}`);
    const rows = await r.json();
    const truoc = dung.size;
    quet(rows);
    console.log(`   ${bang.padEnd(13)} ${String(rows.length).padStart(6)} dòng → thêm ${dung.size - truoc} tệp`);
  }
  return dung;
}

// ── 3. KIỂM LẠI SAU KHI XOÁ: mọi ảnh web đang dùng phải còn sống ───────────
async function kiem_tra_web(dangDung) {
  const ds = [...dangDung];
  let hong = [];
  let i = 0;
  async function luong() {
    while (i < ds.length) {
      const ten = ds[i++];
      const r = await fetch(`${URL_}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(ten)}`, { method: "HEAD" });
      if (!r.ok && r.status !== 400) hong.push(`${ten} (${r.status})`);
      if (i % 100 === 0) process.stdout.write(`\r   đã kiểm ${i}/${ds.length}`);
    }
  }
  await Promise.all(Array.from({ length: 12 }, luong));
  process.stdout.write(`\r   đã kiểm ${ds.length}/${ds.length}\n`);
  return hong;
}

// ── CHẠY ────────────────────────────────────────────────────────────────────
console.log(XOA ? "CHẾ ĐỘ: XOÁ THẬT\n" : "CHẾ ĐỘ: CHỈ XEM (thêm --xoa để xoá thật)\n");

const kho = await liet_ke_kho();
console.log(`Kho hiện có: ${kho.length} tệp · ${MB(kho.reduce((t, f) => t + co(f), 0))} MB\n`);

console.log("Quét các nguồn đang dùng ảnh:");
const dangDung = await liet_ke_dang_dung();
console.log(`   → tổng cộng ${dangDung.size} tệp đang được dùng\n`);

let rac = kho.filter((f) => !dangDung.has(f.name));
if (GIU_VIDEO) {
  const video = rac.filter((f) => laVideo(f.name));
  rac = rac.filter((f) => !laVideo(f.name));
  console.log(`Giữ lại ${video.length} video (${MB(video.reduce((t, f) => t + co(f), 0))} MB) theo cờ --giu-video\n`);
}

const racVideo = rac.filter((f) => laVideo(f.name));
console.log(`RÁC (không nguồn nào dùng): ${rac.length} tệp · ${MB(rac.reduce((t, f) => t + co(f), 0))} MB`);
console.log(`   trong đó video: ${racVideo.length} tệp · ${MB(racVideo.reduce((t, f) => t + co(f), 0))} MB`);
console.log(`Sau khi dọn, kho còn: ${kho.length - rac.length} tệp · ${MB(kho.filter((f) => !rac.includes(f)).reduce((t, f) => t + co(f), 0))} MB\n`);

const nhatKy = path.join(GOC, `.tmp-da-xoa-${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(nhatKy, JSON.stringify(rac.map((f) => ({ ten: f.name, byte: co(f), tao: f.created_at })), null, 1));
console.log(`Danh sách đã ghi ra: ${path.basename(nhatKy)}`);

if (!XOA) {
  console.log("\nChưa xoá gì. Xem danh sách trên, ưng thì chạy lại với --xoa");
  process.exit(0);
}

console.log("\nĐang xoá…");
let daXoa = 0;
for (let i = 0; i < rac.length; i += 100) {
  const lo = rac.slice(i, i + 100).map((f) => f.name);
  const r = await fetch(`${URL_}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: H,
    body: JSON.stringify({ prefixes: lo }),
  });
  if (!r.ok) {
    console.log(`\n   lô ${i}: lỗi ${r.status} ${(await r.text()).slice(0, 150)}`);
    continue;
  }
  const kq = await r.json();
  daXoa += Array.isArray(kq) ? kq.length : 0;
  process.stdout.write(`\r   ${daXoa}/${rac.length}`);
}
console.log(`\nĐã xoá ${daXoa} tệp.`);

// Xoá 0 tệp mà không báo lỗi = khoá không đủ quyền (Supabase từ chối im lặng).
if (daXoa === 0) {
  console.log("\n⚠️  KHÔNG tệp nào bị xoá dù không báo lỗi — khoá đang dùng không có quyền xoá.");
  console.log("   Kiểm tra lại SUPABASE_SERVICE_ROLE_KEY có đúng là khoá service_role không.");
  process.exit(1);
}

const conLai = await liet_ke_kho();
console.log(`\nKho sau khi dọn: ${conLai.length} tệp · ${MB(conLai.reduce((t, f) => t + co(f), 0))} MB`);

console.log("\nKiểm lại toàn bộ ảnh web đang dùng:");
const hong = await kiem_tra_web(dangDung);
if (hong.length === 0) {
  console.log("   ✓ Tất cả ảnh đang dùng vẫn còn nguyên — web không ảnh hưởng gì.");
} else {
  console.log(`   ❌ ${hong.length} tệp đang dùng bị mất:`);
  hong.slice(0, 20).forEach((x) => console.log(`      ${x}`));
  console.log(`   Danh sách vừa xoá nằm ở ${path.basename(nhatKy)} để đối chiếu.`);
}
