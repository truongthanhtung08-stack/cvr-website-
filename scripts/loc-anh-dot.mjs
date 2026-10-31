// ============================================================================
// LỌC ẢNH MỘT ĐỢT TIN — máy bỏ ảnh nhỏ, mờ, trùng trước khi chủ dự án xem
// ----------------------------------------------------------------------------
// Chủ dự án 19/10/2026: "mất rất nhiều thời gian chỉnh sửa hình ảnh — giảm tải giúp". Chạy ở bước 3
// quy trình 3 bên (sau "Cowork xong").
//
//   node scripts/loc-anh-dot.mjs "D:/Coastal Land/SEO/DA-DUYET/18102026"          → chỉ xem
//   node scripts/loc-anh-dot.mjs "D:/Coastal Land/SEO/DA-DUYET/18102026" --that   → làm thật
//
// Với từng tin (ảnh tên <ma_anh>-<số>.<đuôi> trong anh\):
//   · ảnh nhỏ: cạnh dài < 600 px → bỏ
//   · ảnh mờ: độ nét (độ lệch chuẩn sau lọc Laplace, ảnh thu về 512 px) < NGUONG_MO → bỏ
//   · ảnh trùng / gần giống (dấu vân dHash 64 bit, lệch ≤ 6 bit) → giữ tấm lớn + nét hơn
//   · quá 12 ảnh → giữ 12 tấm điểm cao nhất (nét × kích thước), ảnh -01 của Cowork luôn giữ nếu đạt
// Ảnh bỏ KHÔNG XOÁ — chuyển sang _saoluu\<tên cũ>. Ảnh còn lại đánh số lại liền nhau, giữ đúng thứ tự.
// Chạy trên máy (sharp), không tốn gì của Vercel / Supabase.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const thuMuc = process.argv[2];
const that = process.argv.includes("--that");
const NHO = 600, NGUONG_MO = 6, TRUNG = 6, TOI_DA = 12;
const dirAnh = path.join(thuMuc, "anh");
if (!fs.existsSync(dirAnh)) { console.error("Không thấy thư mục anh"); process.exit(1); }

const diem = async (f) => {
  const img = sharp(f, { failOn: "none" });
  const m = await img.metadata();
  const dai = Math.max(m.width || 0, m.height || 0);
  const net = (await sharp(f).greyscale().resize(512, 512, { fit: "inside" })
    .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0] }).stats()).channels[0].stdev;
  const px = await sharp(f).greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let h = 0n;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) h = (h << 1n) | (px[y * 9 + x] > px[y * 9 + x + 1] ? 1n : 0n);
  return { dai, net, h, w: m.width, ht: m.height };
};
const lech = (a, b) => { let x = a ^ b, n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };

const nhom = {};
for (const ten of fs.readdirSync(dirAnh)) {
  const m = /^(.+)-(\d+)(\.[a-z0-9]+)$/i.exec(ten);
  if (!m || !/\.(jpe?g|png|webp)$/i.test(ten)) continue;
  (nhom[m[1]] ??= []).push({ ten, so: Number(m[2]), duoi: m[3] });
}
let tongBo = 0, tongGiu = 0;
const baoCao = [];
for (const [ma, ds] of Object.entries(nhom)) {
  ds.sort((a, b) => a.so - b.so);
  for (const a of ds) Object.assign(a, await diem(path.join(dirAnh, a.ten)));
  const ly = new Map();
  for (const a of ds) {
    if (a.dai < NHO) ly.set(a.ten, `nhỏ ${a.w}×${a.ht}`);
    else if (a.net < NGUONG_MO) ly.set(a.ten, `mờ (độ nét ${a.net.toFixed(1)})`);
  }
  const conLai = ds.filter((a) => !ly.has(a.ten));
  for (let i = 0; i < conLai.length; i++) for (let j = i + 1; j < conLai.length; j++) {
    const a = conLai[i], b = conLai[j];
    if (ly.has(a.ten) || ly.has(b.ten) || lech(a.h, b.h) > TRUNG) continue;
    const bo = a.dai * a.net >= b.dai * b.net ? b : a;
    ly.set(bo.ten, `trùng với ${(bo === a ? b : a).ten}`);
  }
  let giu = ds.filter((a) => !ly.has(a.ten));
  if (giu.length > TOI_DA) {
    const dau = giu[0];
    const xep = giu.slice(1).sort((a, b) => b.dai * b.net - a.dai * a.net);
    const thua = xep.slice(TOI_DA - 1);
    for (const a of thua) ly.set(a.ten, "thừa (quá 12 ảnh, điểm thấp)");
    giu = [dau, ...xep.slice(0, TOI_DA - 1)].sort((a, b) => a.so - b.so);
  }
  if (giu.length < 3) baoCao.push(`⚠ ${ma}: sau lọc còn ${giu.length} ảnh đạt (cần ≥ 3) — giữ nguyên, CẦN ANH XEM`);
  else if (ly.size) baoCao.push(`${ma}: giữ ${giu.length}, bỏ ${ly.size} — ${[...ly].map(([t, l]) => `${t} (${l})`).join("; ")}`);
  if (giu.length < 3) continue; // không đủ ảnh đạt thì không đụng — để chủ dự án quyết
  tongBo += ly.size; tongGiu += giu.length;
  if (that && ly.size) {
    const boDir = path.join(thuMuc, "_saoluu");
    fs.mkdirSync(boDir, { recursive: true });
    for (const t of ly.keys()) fs.renameSync(path.join(dirAnh, t), path.join(boDir, t));
    // Đánh số lại liền nhau: đổi qua tên tạm trước để không đè nhau
    giu.forEach((a, i) => fs.renameSync(path.join(dirAnh, a.ten), path.join(dirAnh, `__tam__${i}${a.duoi}`)));
    // Số ảnh luôn 2 chữ số (-01 = ảnh đại diện) — đúng bộ mẫu SEO\MAU\dot-tin-mau-24-10 (chủ dự án chốt 25/10/2026)
    giu.forEach((a, i) => fs.renameSync(path.join(dirAnh, `__tam__${i}${a.duoi}`), path.join(dirAnh, `${ma}-${String(i + 1).padStart(2, "0")}${a.duoi}`)));
  }
}
const tep = path.join(thuMuc, "LOC-ANH.txt");
fs.writeFileSync(tep, [`LỌC ẢNH — ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}${that ? "" : " (CHỈ XEM, chưa đổi gì)"}`,
  `${Object.keys(nhom).length} tin · giữ ${tongGiu} ảnh · bỏ ${tongBo} ảnh (chuyển sang _saoluu\\, không xoá)`, "", ...baoCao, ""].join("\r\n"));
console.log(`${Object.keys(nhom).length} tin · giữ ${tongGiu} · bỏ ${tongBo}${that ? "" : " (chỉ xem)"} → ${tep}`);
