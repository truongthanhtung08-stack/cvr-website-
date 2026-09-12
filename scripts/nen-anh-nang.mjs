// ════════════════════════════════════════════════════════════════════════════
// NÉN ẢNH NẶNG — GIỮ NGUYÊN KÍCH THƯỚC, CHỈ ĐỔI ĐỊNH DẠNG
//
// VÌ SAO (đo thật 12/09/2026): Supabase báo tổ chức VƯỢT HẠN MỨC, doạ khoá dự
// án từ 08/10/2026. Nhưng kho chỉ dùng 327 MB / 1 GB — tức KHÔNG phải kho đầy,
// mà là BĂNG THÔNG: mỗi lượt xem trang chủ khách tải về **65 MB ảnh** (đo bằng
// trình duyệt thật, cuộn hết trang: 106 ảnh). Gói miễn phí cho 5 GB/tháng →
// chịu được đúng ~78 lượt xem. Đang chạy Google Ads thì vài ngày là thủng.
//
// Thủ phạm: 20 tấm ảnh khu vực/dự án để dạng **PNG 2,7–3 MB**. PNG là định dạng
// cho hình vẽ/đồ hoạ, dùng cho ẢNH CHỤP thì phình gấp hơn 10 lần. Cùng số điểm
// ảnh y hệt, chuyển sang WebP chỉ còn ~250 KB mà mắt thường không phân biệt nổi.
//
// ⛔ KHÔNG GIẢM KÍCH THƯỚC ẢNH. Chủ dự án đã chốt: "giảm thì không nét, web
// không được". Script này giữ NGUYÊN số điểm ảnh, chỉ đổi cách mã hoá.
//
// AN TOÀN:
//   · Ảnh gốc GIỮ NGUYÊN trong kho, không xoá. Sai thì trỏ ngược lại là xong.
//   · Mặc định chỉ XEM (không đổi gì). Phải thêm --ap mới ghi.
//   · Tệp mới đặt tên theo nội dung (băm SHA-256) → chạy lại không sinh bản sao.
//
//   node scripts/nen-anh-nang.mjs              → xem sẽ nén được bao nhiêu
//   node scripts/nen-anh-nang.mjs --ap         → nén thật + trỏ tin sang ảnh mới
//   node scripts/nen-anh-nang.mjs --nguong 300 → hạ ngưỡng xuống 300 KB
// ════════════════════════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

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
const BUCKET = "listings";
const AP = process.argv.includes("--ap");
const NGUONG =
  Number((process.argv.find((a) => a.startsWith("--nguong")) ?? "").split("=")[1] ?? 0) * 1024 ||
  700 * 1024; // mặc định: đụng tới ảnh trên 700 KB

if (!KHOA) {
  console.error("❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}
const H = { apikey: KHOA, Authorization: `Bearer ${KHOA}` };
const HJ = { ...H, "Content-Type": "application/json" };
const KB = (b) => (b / 1024).toFixed(0) + " KB";
const MB = (b) => (b / 1048576).toFixed(1) + " MB";
const CONG = `${URL_}/storage/v1/object/public/${BUCKET}/`;

// ── 1. LIỆT KÊ KHO, LỌC ẢNH NẶNG ────────────────────────────────────────────
console.log("NÉN ẢNH NẶNG — giữ nguyên kích thước, chỉ đổi định dạng");
console.log("═".repeat(68));

let tatCa = [];
for (let offset = 0; ; offset += 1000) {
  const r = await fetch(`${URL_}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: HJ,
    body: JSON.stringify({ prefix: "", limit: 1000, offset }),
  });
  const p = await r.json();
  if (!Array.isArray(p) || !p.length) break;
  tatCa = tatCa.concat(p);
  if (p.length < 1000) break;
}

// Chỉ đụng ảnh; video đã lên YouTube hết nên không còn, nhưng vẫn chặn cho chắc.
const laAnh = (t) => /\.(png|jpe?g|webp)$/i.test(t);
const nang = tatCa
  .filter((f) => laAnh(f.name) && (f.metadata?.size ?? 0) >= NGUONG)
  .sort((a, b) => b.metadata.size - a.metadata.size);

const tongKho = tatCa.reduce((a, f) => a + (f.metadata?.size ?? 0), 0);
const tongNang = nang.reduce((a, f) => a + f.metadata.size, 0);
console.log(`\nKho: ${tatCa.length} tệp, ${MB(tongKho)}`);
console.log(`Ảnh từ ${KB(NGUONG)} trở lên: ${nang.length} tệp, ${MB(tongNang)}\n`);
if (!nang.length) {
  console.log("Không có ảnh nào vượt ngưỡng — không phải làm gì.");
  process.exit(0);
}

// ── 2. NƠI NÀO ĐANG DÙNG ẢNH NÀO ────────────────────────────────────────────
// Đọc TOÀN BỘ các bảng có nhúng ảnh. Đọc hụt một bảng là trỏ sót → ảnh cũ vẫn
// được dùng, nén xong chẳng nhẹ đi đâu cả. Nên hụt là DỪNG.
const BANG = [
  ["listings", "select=*&limit=20000"],
  ["projects", "select=*&limit=5000"],
  ["articles", "select=*&limit=5000"],
  ["site_content", "select=*&limit=1000"],
];
const duLieu = {};
for (const [bang, q] of BANG) {
  const r = await fetch(`${URL_}/rest/v1/${bang}?${q}`, { headers: HJ });
  if (!r.ok) {
    console.error(`❌ Không đọc được bảng ${bang}: ${r.status}`);
    process.exit(1);
  }
  duLieu[bang] = await r.json();
}

/** Đếm xem một tên tệp đang được bao nhiêu dòng nhắc tới. */
function dangDung(ten) {
  let so = 0;
  for (const rows of Object.values(duLieu))
    for (const row of rows) if (JSON.stringify(row).includes(encodeURIComponent(ten)) || JSON.stringify(row).includes(ten)) so++;
  return so;
}

// ── 3. NÉN ──────────────────────────────────────────────────────────────────
const doi = new Map(); // tên cũ → tên mới
let truoc = 0,
  sau = 0,
  boQua = 0;

for (const [i, f] of nang.entries()) {
  const ten = f.name;
  const soCho = dangDung(ten);
  process.stdout.write(`\r[${i + 1}/${nang.length}] ${ten.slice(0, 46).padEnd(46)}`);
  if (soCho === 0) {
    boQua++;
    continue; // không ai dùng → để scripts/don-kho-anh.mjs lo, đừng nén rác
  }

  const rTai = await fetch(CONG + encodeURIComponent(ten), { headers: H });
  if (!rTai.ok) {
    console.log(`\n   ⚠️ tải không được (${rTai.status}) — bỏ qua`);
    boQua++;
    continue;
  }
  const goc = Buffer.from(await rTai.arrayBuffer());

  // GIỮ NGUYÊN SỐ ĐIỂM ẢNH. Chỉ đổi mã hoá sang WebP.
  // effort 6 = nén kỹ hơn (chậm hơn chút, nhẹ hơn ~10%); quality 82 là mức mắt
  // thường không phân biệt được với ảnh gốc trên ảnh chụp.
  const moi = await sharp(goc, { failOn: "none" }).webp({ quality: 82, effort: 6 }).toBuffer();

  // Nén xong mà không nhẹ hơn đáng kể thì thôi, đừng đổi cho rối.
  if (moi.length > goc.length * 0.8) {
    boQua++;
    continue;
  }

  const bam = crypto.createHash("sha256").update(moi).digest("hex").slice(0, 24);
  const sach = ten.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const tenMoi = `${bam}-${sach}.webp`;

  truoc += goc.length;
  sau += moi.length;
  doi.set(ten, tenMoi);

  if (AP) {
    const rUp = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${encodeURIComponent(tenMoi)}`, {
      method: "POST",
      headers: { ...H, "Content-Type": "image/webp", "x-upsert": "true" },
      body: moi,
    });
    if (!rUp.ok) {
      console.log(`\n   ❌ tải lên hỏng: ${rUp.status} ${(await rUp.text()).slice(0, 120)}`);
      doi.delete(ten);
      truoc -= goc.length;
      sau -= moi.length;
    }
  }
}
process.stdout.write("\r" + " ".repeat(70) + "\r");

console.log(`Nén được : ${doi.size} ảnh`);
console.log(`Bỏ qua   : ${boQua} (không ai dùng, hoặc nén không nhẹ hơn)`);
console.log(`Dung lượng: ${MB(truoc)} → ${MB(sau)}  (giảm ${(100 - (sau / truoc) * 100).toFixed(0)}%)`);

if (!AP) {
  console.log("\nChưa đổi gì. Ưng thì chạy lại với --ap.");
  process.exit(0);
}

// ── 4. TRỎ TIN / DỰ ÁN / NỘI DUNG SANG ẢNH MỚI ──────────────────────────────
console.log("\nĐang trỏ dữ liệu sang ảnh mới…");
const thay = (chuoi) => {
  let ra = chuoi;
  for (const [cu, moi] of doi) {
    ra = ra.split(encodeURIComponent(cu)).join(encodeURIComponent(moi));
    ra = ra.split(cu).join(moi);
  }
  return ra;
};

for (const [bang] of BANG) {
  let doiDuoc = 0;
  for (const row of duLieu[bang]) {
    const cu = JSON.stringify(row);
    const moi = thay(cu);
    if (moi === cu) continue;
    const banGhi = JSON.parse(moi);
    const khoa = banGhi.id !== undefined ? "id" : "key";
    const r = await fetch(`${URL_}/rest/v1/${bang}?${khoa}=eq.${encodeURIComponent(banGhi[khoa])}`, {
      method: "PATCH",
      headers: { ...HJ, Prefer: "return=minimal" },
      body: moi,
    });
    if (r.ok) doiDuoc++;
    else console.log(`   ✗ ${bang} ${banGhi[khoa]}: ${r.status} ${(await r.text()).slice(0, 120)}`);
  }
  console.log(`   ${bang.padEnd(14)} đổi ${doiDuoc} dòng`);
}

console.log("\n✅ Xong. Ảnh GỐC vẫn còn nguyên trong kho — kiểm web thấy ổn rồi mới dọn:");
console.log("   node scripts/don-kho-anh.mjs");
