// ============================================================================
// ĐĂNG MỘT ĐỢT TIN TỪ FILE — DÙNG LẠI ẢNH ĐÃ CÓ TRONG KHO
// ----------------------------------------------------------------------------
// Khi nào dùng: ảnh của đợt ĐÃ tải lên kho rồi (lần up trước hỏng), giờ chỉ cần
// đăng tin và gắn đúng ảnh về đúng tin — khỏi bắt chủ dự án tải lại cả trăm ảnh.
// Việc bình thường hằng ngày vẫn làm ở /admin/tin-dang/nhap-hang-loat.
//
// Đọc file bằng ĐÚNG bộ kiểm tra của web (src/lib/csvTin.ts) nên tin lên giống
// hệt như đăng qua trang admin: cùng payload, cùng luật đỏ/vàng.
//
// CÁCH DÙNG (mặc định chỉ xem, không ghi gì):
//   node scripts/dang-dot-tin.mjs "D:/…/Bang-2026-09-10-HOAN-CHINH.csv"
//   node scripts/dang-dot-tin.mjs "D:/…/Bang-2026-09-10-HOAN-CHINH.csv" --that
//
// Chống trùng: mã tin đã có tin đăng TRONG 3 NGÀY hoặc TIÊU ĐỀ khớp → cập nhật
// ảnh cho tin đó; còn lại đăng tin mới. Cùng luật với trang admin.
// NGÀY ĐĂNG = hôm nay (tin của đợt cũ vẫn hiện là tin mới trên web).
// ============================================================================

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const duongDan = process.argv[2];
const ghiThat = process.argv.includes("--that");
// MỐC NGÀY TẢI ẢNH của đợt này — BẮT BUỘC. Mã tin lặp giữa các đợt (dn01 ngày nào
// cũng có) nên nếu không cắt theo ngày tải thì ảnh đợt cũ chui vào tin mới: đo thật
// trên đợt 10/09 thì gom nhầm 427 ảnh thay vì 229.
const tuNgay = (process.argv.find((x) => /^--tu-ngay=/.test(x)) ?? "").split("=")[1];
if (!tuNgay || !/^\d{4}-\d{2}-\d{2}$/.test(tuNgay)) {
  console.error("Thiếu --tu-ngay=YYYY-MM-DD (ngày bắt đầu tải ảnh của đợt này). VD: --tu-ngay=2026-09-15");
  process.exit(1);
}
if (!duongDan) {
  console.error('Thiếu đường dẫn file. VD: node scripts/dang-dot-tin.mjs "D:/…/Bang-2026-09-10-HOAN-CHINH.csv"');
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
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

// ── Đọc file bằng chính bộ kiểm tra của web ─────────────────────────────────
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { docTinTuCsv, anhThuocMa } = await jiti.import(ROOT + "/src/lib/csvTin.ts");
const { isVideoUrl } = await jiti.import(ROOT + "/src/lib/media.ts");

const kq = docTinTuCsv(readFileSync(duongDan, "utf8"));
if (kq.loiChung) {
  console.error("Không đọc được file:", kq.loiChung);
  process.exit(1);
}
if (kq.canhBaoChung) console.log("⚠️ " + kq.canhBaoChung + "\n");

const loi = kq.rows.filter((r) => r.loi.length);
if (loi.length) {
  console.log(`❌ ${loi.length} dòng lỗi — SẼ BỎ QUA:`);
  for (const r of loi) console.log(`   dòng ${r.dong}: ${r.loi.join(" · ")}`);
  console.log("");
}
const hopLe = kq.rows.filter((r) => !r.loi.length);

// ── Ảnh trong kho, gom theo mã tin ──────────────────────────────────────────
// Kho đặt tên "<mã băm nội dung>-<tên tệp gốc>" nên bỏ cụm băm là ra tên gốc.
const tenGoc = (name) => name.replace(/^[0-9a-f]{16,32}-/i, "").replace(/^\d+-\d+-/, "");
const soCuoi = (s) => {
  const m = s.replace(/\.[^.]+$/, "").match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : 9999;
};
const khoRes = await fetch(`${URL_SB}/storage/v1/object/list/listings`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({ prefix: "", limit: 5000, sortBy: { column: "created_at", order: "desc" } }),
});
const objs = await khoRes.json();
if (!Array.isArray(objs)) {
  console.error("Không đọc được kho ảnh:", objs);
  process.exit(1);
}
const congKhai = (name) => `${URL_SB}/storage/v1/object/public/listings/${name.split("/").map(encodeURIComponent).join("/")}`;

function anhCuaMa(ma) {
  return objs
    .filter((o) => !o.name.startsWith("nho/") && (o.created_at ?? "") >= tuNgay && anhThuocMa(tenGoc(o.name), ma))
    .sort((a, b) => soCuoi(tenGoc(a.name)) - soCuoi(tenGoc(b.name)) || a.name.localeCompare(b.name))
    .map((o) => congKhai(o.name));
}

// ── Tin đã có trong CSDL theo mã ────────────────────────────────────────────
const maTrongFile = [...new Set(hopLe.map((r) => r.maAnh).filter(Boolean))];
const daCoRes = await fetch(
  `${URL_SB}/rest/v1/listings?select=id,title,created_at,images,details&details->>maAnh=in.(${maTrongFile.join(",")})`,
  { headers: H },
);
const daCoRaw = await daCoRes.json();
if (!Array.isArray(daCoRaw)) {
  console.error("Không đọc được bảng listings:", daCoRaw);
  process.exit(1);
}
const goi = (s) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const moc = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
const cungTin = new Map();       // maAnh → tin cũ
const cungTinTheoNguon = new Map(); // link tin gốc → tin cũ
for (const r of daCoRaw) {
  const ma = r.details?.maAnh;
  if (!ma) continue;
  const nguon = r.details?.nguonTin;
  // ① LINK TIN GỐC là khoá chắc nhất: mỗi tin gốc một URL, không lặp giữa các đợt.
  if (nguon && !cungTinTheoNguon.has(nguon))
    cungTinTheoNguon.set(nguon, { id: r.id, images: r.images ?? [], details: r.details ?? {} });
  // ② Không có link thì mới xét mã ảnh + (trong 3 ngày HOẶC tiêu đề khớp).
  const dong = hopLe.find((x) => x.maAnh === ma);
  if (!dong) continue;
  if (r.created_at >= moc || goi(r.title) === goi(dong.tomTat.tieuDe))
    cungTin.set(ma, { id: r.id, images: r.images ?? [], details: r.details ?? {} });
}

// ── Dựng danh sách việc ─────────────────────────────────────────────────────
const themMoi = [];
const capNhat = [];
const chuaAnh = [];
for (const r of hopLe) {
  const tuFile = (r.payload.images ?? []).filter((u) => /^https?:\/\//i.test(u)); // link video YouTube ghi trong file
  const anh = anhCuaMa(r.maAnh).slice(0, 15);
  const video = tuFile.filter(isVideoUrl).slice(0, 1);
  const images = [...anh, ...video];
  if (!anh.length) { chuaAnh.push(r); continue; }
  const nguonTin = r.payload.details?.nguonTin;
  const cu = (nguonTin ? cungTinTheoNguon.get(nguonTin) : undefined) ?? cungTin.get(r.maAnh);
  if (cu) {
    // Giữ ảnh tin đó đã có, chỉ thêm tấm chưa có (so bằng URL) — không làm mất ảnh cũ.
    const gop = [...cu.images, ...images.filter((u) => !cu.images.includes(u))];
    const gopCat = [...gop.filter((u) => !isVideoUrl(u)).slice(0, 15), ...gop.filter(isVideoUrl).slice(0, 1)];
    // VÁ những mục details tin cũ còn THIẾU (tin đăng bằng bản mẫu cũ không có
    // địa chỉ hệ cũ). Chỉ THÊM chỗ trống, không đè dữ liệu đã có.
    const dMoi = r.payload.details ?? {};
    const dCu = cu.details ?? {};
    const va = {};
    for (const k of Object.keys(dMoi))
      if (dMoi[k] !== undefined && (dCu[k] === undefined || dCu[k] === null || dCu[k] === "")) va[k] = dMoi[k];
    capNhat.push({ r, id: cu.id, images: gopCat, cuSo: cu.images.length, va });
  }
  else themMoi.push({ r, images });
}

console.log(`File: ${hopLe.length} tin hợp lệ`);
console.log(`  · Đăng MỚI     : ${themMoi.length} tin`);
console.log(`  · Cập nhật ảnh : ${capNhat.length} tin (đã có trên web)`);
console.log(`  · Chưa có ảnh trong kho, BỎ QUA: ${chuaAnh.length} tin${chuaAnh.length ? " → " + chuaAnh.map((r) => r.maAnh).join(", ") : ""}`);
console.log(`  · Tổng ảnh gắn : ${[...themMoi, ...capNhat].reduce((n, x) => n + x.images.filter((u) => !isVideoUrl(u)).length, 0)}`);
console.log(`  · Tổng video   : ${[...themMoi, ...capNhat].reduce((n, x) => n + x.images.filter(isVideoUrl).length, 0)}`);
console.log("");
for (const { r, images } of themMoi)
  console.log(`  MỚI  [${r.maAnh}] ${images.filter((u) => !isVideoUrl(u)).length} ảnh${images.some(isVideoUrl) ? " + video" : ""} · ${r.tomTat.tieuDe.slice(0, 58)}`);
for (const { r, images, cuSo, va } of capNhat) {
  const muc = Object.keys(va ?? {});
  console.log(
    `  SỬA  [${r.maAnh}] ${cuSo} → ${images.length} ảnh` +
      (muc.length ? ` · vá ${muc.length} mục: ${muc.join(", ")}` : "") +
      ` · ${r.tomTat.tieuDe.slice(0, 50)}`,
  );
}

if (!ghiThat) {
  console.log("\n(Chế độ XEM TRƯỚC — thêm --that để đăng thật.)");
  process.exit(0);
}

// ── Ghi ─────────────────────────────────────────────────────────────────────
const now = new Date().toISOString();
let xong = 0;
for (let i = 0; i < themMoi.length; i += 25) {
  const lo = themMoi.slice(i, i + 25).map(({ r, images }) => ({ ...r.payload, images, published_at: now }));
  const res = await fetch(`${URL_SB}/rest/v1/listings`, { method: "POST", headers: H, body: JSON.stringify(lo) });
  if (!res.ok) {
    console.error(`Đăng được ${xong} tin thì lỗi:`, await res.text());
    process.exit(1);
  }
  xong += lo.length;
}
let sua = 0;
for (const { id, images, va } of capNhat) {
  const than = Object.keys(va ?? {}).length
    ? { images, details: { ...(capNhat.find((x) => x.id === id)?.r.payload.details ?? {}), ...va } }
    : { images };
  const res = await fetch(`${URL_SB}/rest/v1/listings?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify(than) });
  if (!res.ok) {
    console.error(`Đăng ${xong} tin, sửa ${sua} tin thì lỗi:`, await res.text());
    process.exit(1);
  }
  sua++;
}
console.log(`\n✅ Đã đăng ${xong} tin mới · cập nhật ảnh cho ${sua} tin. Web hiện trong vòng 60 giây.`);
