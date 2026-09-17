// ============================================================================
// VIDEO CỦA MỘT ĐỢT TIN → LÊN KÊNH YOUTUBE → TỰ VỀ ĐÚNG TIN
// ----------------------------------------------------------------------------
// Việc lặp lại mỗi đợt, nên làm gọn đúng HAI LỆNH. Không soát tiêu đề bằng tay,
// không copy dán link từng cái.
//
//   BƯỚC 1 — đặt tên tệp (chạy trước khi kéo lên YouTube):
//     node scripts/video-len-kenh.mjs dat-ten "D:/…/TIN HANG NGAY chuẩn/10092026"
//
//     Đọc file Bang-*.csv trong thư mục đó, đổi tên mỗi tệp video trong thư mục
//     con "Video" thành:  <tiêu đề tin rút gọn> [<mã tin>].mp4
//     YouTube tải hàng loạt TỰ LẤY TÊN TỆP LÀM TIÊU ĐỀ → kênh có tiêu đề tử tế,
//     mà mã trong ngoặc vuông là đường để bước 2 khớp video về đúng tin.
//     ⚠️ YouTube cắt tiêu đề ở 100 ký tự nên tên giữ dưới 96.
//
//   Giữa hai bước: kéo cả thư mục Video vào studio.youtube.com → TẢI VIDEO LÊN
//     · để CÔNG KHAI (không công khai là danh sách bị giấu, bước 2 không thấy)
//     · ĐỪNG đổi tên trên YouTube
//     · "Video này có dành cho trẻ em không?" → Không
//
//   BƯỚC 2 — gắn link về tin (chạy sau khi YouTube xử lý xong):
//     node scripts/video-len-kenh.mjs gan          → chỉ xem khớp được những gì
//     node scripts/video-len-kenh.mjs gan --that   → ghi link vào tin
//
//     Đọc danh sách video công khai của kênh (không cần khoá API), lấy mã trong
//     tiêu đề, gắn link vào tin có cùng details.maAnh. Tin nào đã có video rồi
//     thì bỏ qua, chạy lại bao nhiêu lần cũng không nhân đôi.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { docVideoKenh } from "./doc-video-kenh.mjs";

const GOC = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(GOC, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL;
const KHOA = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KHOA, Authorization: `Bearer ${KHOA}`, "Content-Type": "application/json" };
const TEN_KENH = "@CoastalLandvn";

const lenh = process.argv[2];
const ghiThat = process.argv.includes("--that");

// ── Mã tin trong một chuỗi: cụm chữ + số ở cuối ("dn01", "qnhon06") ──────────
// MÃ TIN TỪ TÊN TỆP GỐC — Cowork đặt tên "dn01-video.mp4", mã nằm ở ĐẦU.
function maTuTenTep(f) {
  const m = /^([a-z]{2,10}\d{1,3})\b/i.exec(String(f).trim());
  return m ? m[1].toLowerCase() : "";
}

// MÃ TIN TỪ TIÊU ĐỀ VIDEO TRÊN KÊNH — CHỈ chấp nhận mã trong [ngoặc vuông].
// Tuyệt đối không dò "chữ + số" tự do trong câu tiếng Việt: chạy thử 17/09/2026
// thì video "Bán nhà Bàu Làng 2" khớp bừa sang tin của nhà khác. Video cũ đặt
// tên không có ngoặc vuông thì BỎ QUA, thà không gắn còn hơn gắn nhầm nhà.
function maTuTieuDe(ten) {
  const m = /\[\s*([a-z]{2,10}\d{1,3})\s*\]/i.exec(String(ten));
  return m ? m[1].toLowerCase() : "";
}

// ── Đọc bảng tin của đợt (CSV) để lấy tiêu đề theo mã ────────────────────────
function docBang(thuMuc) {
  const ten = fs.readdirSync(thuMuc).find((f) => /^Bang-.*\.csv$/i.test(f));
  if (!ten) throw new Error(`Không thấy file Bang-*.csv trong ${thuMuc}`);
  const text = fs.readFileSync(path.join(thuMuc, ten), "utf8").replace(/^\ufeff/, "");
  const rows = [];
  let row = [], cell = "", trongNgoac = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (trongNgoac) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else trongNgoac = false; }
      else cell += c;
    } else if (c === '"') trongNgoac = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); if (row.some((x) => x.trim())) rows.push(row); }
  const head = rows[0].map((x) => x.trim());
  const i = (n) => head.indexOf(n);
  const theoMa = new Map();
  for (const r of rows.slice(1)) {
    const ma = (r[i("ma_anh")] ?? "").trim();
    if (ma) theoMa.set(ma, {
      tieuDe: (r[i("tieu_de")] ?? "").trim(),
      px: (r[i("phuong_xa")] ?? "").trim(),
      tinh: (r[i("tinh_thanh")] ?? "").trim(),
    });
  }
  return { ten, theoMa };
}

// Tên tệp hợp lệ trên Windows, bỏ ký tự cấm, gói dưới 96 ký tự kể cả [mã].mp4
function tenTep(tieuDe, ma, px, tinh) {
  const sach = (s) => s.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
  const duoi = ` [${ma}].mp4`;
  let ten = sach(tieuDe);
  const dia = sach([px, tinh].filter(Boolean).join(", "));
  // Thêm địa danh nếu tiêu đề chưa nhắc tới và vẫn còn chỗ
  const khongDau = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (dia && !khongDau(ten).includes(khongDau(px.replace(/^(Phường|Xã)\s+/i, "")))) ten += ` - ${dia}`;
  const conLai = 96 - duoi.length;
  if (ten.length > conLai) ten = ten.slice(0, conLai).replace(/[\s,\-–—:;.]+$/, "");
  return ten + duoi;
}

// ════════════════════════════════════════════════════════════════════════════
if (lenh === "dat-ten") {
  const thuMuc = process.argv[3];
  if (!thuMuc) { console.error('Thiếu thư mục đợt. VD: node scripts/video-len-kenh.mjs dat-ten "D:/…/10092026"'); process.exit(1); }
  const thuMucVideo = path.join(thuMuc, "Video");
  if (!fs.existsSync(thuMucVideo)) { console.error(`Không thấy thư mục ${thuMucVideo}`); process.exit(1); }
  const { ten: tenBang, theoMa } = docBang(thuMuc);
  console.log(`Bảng tin: ${tenBang}\nThư mục video: ${thuMucVideo}\n`);

  let doi = 0, boQua = 0;
  for (const f of fs.readdirSync(thuMucVideo).sort()) {
    if (!/\.(mp4|mov|m4v|webm|mkv)(\.(mp4|mov|m4v|webm|mkv))?$/i.test(f)) continue;
    const ma = maTuTenTep(f);
    const tin = theoMa.get(ma);
    if (!tin) { console.log(`⚠️  ${f} — không khớp mã tin nào, để nguyên`); boQua++; continue; }
    if (/\[[a-z]+\d+\]\.mp4$/i.test(f)) { console.log(`✓  ${f} — đã đặt tên rồi`); boQua++; continue; }
    const moi = tenTep(tin.tieuDe, ma, tin.px, tin.tinh);
    fs.renameSync(path.join(thuMucVideo, f), path.join(thuMucVideo, moi));
    console.log(`${f}\n   → ${moi}`);
    doi++;
  }
  console.log(`\nĐã đặt tên ${doi} tệp${boQua ? ` · bỏ qua ${boQua}` : ""}.`);
  console.log("\nGIỜ KÉO CẢ THƯ MỤC VIDEO VÀO studio.youtube.com → TẢI VIDEO LÊN:");
  console.log("  · để CÔNG KHAI · đừng đổi tên · \"dành cho trẻ em\" → Không");
  console.log("Xong rồi chạy:  node scripts/video-len-kenh.mjs gan --that");
  process.exit(0);
}

// ════════════════════════════════════════════════════════════════════════════
if (lenh === "gan") {
  const video = await docVideoKenh(TEN_KENH);
  console.log(`Kênh ${TEN_KENH}: đọc được ${video.length} video công khai`);
  const theoMa = new Map();
  for (const v of video) {
    const ma = maTuTieuDe(v.ten);
    if (ma && !theoMa.has(ma)) theoMa.set(ma, v); // video mới nhất đứng trước
  }

  const res = await fetch(`${URL_SB}/rest/v1/listings?select=id,title,created_at,images,details&limit=5000`, { headers: H });
  const tins = await res.json();
  if (!Array.isArray(tins)) { console.error("Không đọc được listings:", tins); process.exit(1); }

  // MỘT MÃ CÓ THỂ TRÙNG NHIỀU TIN (Cowork đánh lại dn01… mỗi đợt). Video của đợt
  // này chỉ thuộc về TIN MỚI NHẤT mang mã đó — rải vào cả tin cũ là gắn video nhà
  // này vào tin nhà khác, đúng lỗi đã xảy ra với ảnh đợt 10/09.
  const tinMoiNhat = new Map();
  for (const t of tins) {
    const ma = t.details?.maAnh;
    if (!ma) continue;
    const cu2 = tinMoiNhat.get(ma);
    if (!cu2 || String(t.created_at) > String(cu2.created_at)) tinMoiNhat.set(ma, t);
  }

  const laYt = (u) => /youtu\.be\/|youtube\.com\/(watch\?v=|shorts\/|embed\/)/i.test(String(u));
  const viec = [];
  const daCoRoi = [];
  for (const [ma, v] of theoMa) {
    const t = tinMoiNhat.get(ma);
    if (!t) continue;
    const imgs = t.images ?? [];
    if (imgs.some(laYt)) { daCoRoi.push(ma); continue; }   // đã có video → bỏ qua
    viec.push({ t, v, images: [...imgs, `https://youtu.be/${v.id}`] });
  }

  console.log(`\nGẮN ĐƯỢC ${viec.length} video về tin:`);
  for (const { t, v } of viec)
    console.log(`  [${t.details.maAnh}] ${(t.title ?? "").slice(0, 52)}\n        ← ${v.ten.slice(0, 60)} (youtu.be/${v.id})`);

  const khongCoTin = [...theoMa.keys()].filter((ma) => !tinMoiNhat.has(ma));
  if (daCoRoi.length) console.log(`\nBỏ qua ${daCoRoi.length} mã vì tin đã có video: ${daCoRoi.join(", ")}`);
  if (khongCoTin.length) console.log(`Video trên kênh không có tin nào mang mã: ${khongCoTin.join(", ")}`);

  if (!ghiThat) { console.log("\n(Chế độ XEM TRƯỚC — thêm --that để ghi.)"); process.exit(0); }

  let xong = 0;
  for (const { t, images } of viec) {
    const r = await fetch(`${URL_SB}/rest/v1/listings?id=eq.${t.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ images }) });
    if (!r.ok) { console.error(`Gắn được ${xong} tin thì lỗi:`, await r.text()); process.exit(1); }
    xong++;
  }
  console.log(`\n✅ Đã gắn video cho ${xong} tin. Web hiện trong vòng 60 giây.`);
  process.exit(0);
}

console.error('Thiếu lệnh. Dùng:\n  node scripts/video-len-kenh.mjs dat-ten "D:/…/10092026"\n  node scripts/video-len-kenh.mjs gan [--that]');
process.exit(1);
