// ============================================================================
// SỬA LỖI MẤT XUỐNG DÒNG trong mô tả tin (đợt tin cowork gom ngày 30/08, lên
// web 01–02/09). Cowork dán mô tả thành MỘT ĐOẠN DÀI, mất hết gạch đầu dòng.
//
// Nguyên tắc: CHỈ CHÈN ký tự xuống dòng, KHÔNG đổi một chữ nào của người đăng.
// Script tự kiểm: bỏ hết khoảng trắng của bản trước và sau phải GIỐNG HỆT nhau.
//
// CÁCH DÙNG:
//   node scripts/sua-xuong-dong-tin.mjs              → xem trước (không ghi gì)
//   node scripts/sua-xuong-dong-tin.mjs --ghi        → ghi thật vào Supabase
//   node scripts/sua-xuong-dong-tin.mjs --hoan-tac <file-sao-luu.json>
//
// Ghi thật cần khoá service_role trong .env.local:  SUPABASE_SERVICE_ROLE_KEY=...
// ============================================================================
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY_DOC = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const KEY_GHI = env.SUPABASE_SERVICE_ROLE_KEY;

// ── Quy tắc chèn xuống dòng ────────────────────────────────────────────────
// 1. Gạch đầu dòng: " - Chữ Hoa" / " + " / " * " / " • "  → xuống dòng trước dấu.
//    Chỉ nhận khi sau dấu là CHỮ HOA (để không cắt nhầm "3,8 tỷ - 4,5 tỷ",
//    "Thanh Khê - gần Trần Cao Vân") và dấu đó xuất hiện từ 2 lần trở lên.
//    Dấu đầu tiên của danh sách phải đứng SAU dấu kết câu (. : ! ? …) — nhờ vậy
//    chuỗi địa danh "biệt thự sân vườn - đường Văn Tiến Dũng - khu FPT - Ngũ Hành
//    Sơn" KHÔNG bị cắt. Từ dấu thứ hai trở đi (đã vào danh sách) thì cắt tiếp
//    kể cả khi dòng trên không có dấu chấm ("+ Tầng 2: 2 phòng ngủ, 1 wc + Tầng 3").
function tachGachDauDong(line) {
  for (const dau of ["-", "+", "*", "•"]) {
    const re = new RegExp("\\s+[" + dau + "] (?=\\p{Lu})", "gu");
    const viTri = [];
    let trongDs = false;
    let m;
    while ((m = re.exec(line)) !== null) {
      const ketCau = /[.:!?…]$/.test(line.slice(0, m.index).trimEnd());
      if (ketCau || trongDs) { viTri.push([m.index, m[0].length]); trongDs = true; }
    }
    if (viTri.length < 2) continue;
    for (const [i, len] of viTri.reverse()) line = line.slice(0, i) + `\n${dau} ` + line.slice(i + len);
  }
  return line;
}

// 2. Dòng còn dài (>180 ký tự) thì tách tiếp ở ranh giới câu, nhưng CHỈ trước
//    những câu là "mục có nhãn" (có dấu ":" trong 60 ký tự đầu — kiểu
//    "Diện tích: 68m²", "Pháp lý: Sổ hồng") hoặc sau một câu kết thúc bằng ":".
function tachMucCoNhan(line) {
  if (line.length <= 180) return line;
  const cau = [];
  for (const c of line.split(/(?<=[.!?…])\s+/)) {
    // "1." "2." đứng một mình là SỐ THỨ TỰ của mục, không phải hết câu → dính
    // vào mục phía sau ("2." + "Tiện ích nội khu: …").
    if (cau.length && /^\d{1,2}\.$/.test(cau[cau.length - 1])) cau[cau.length - 1] += " " + c;
    else cau.push(c);
  }
  // Câu mở đầu bằng cùng một từ từ 3 lần trở lên = danh sách liệt kê
  // ("Lô A2 … Lô B2 … Lô D4 …") → mỗi mục một dòng.
  const dem = {};
  for (const c of cau) {
    const tu = c.split(/\s+/)[0];
    if (/^\p{Lu}/u.test(tu)) dem[tu] = (dem[tu] || 0) + 1;
  }

  const out = [];
  for (const c of cau) {
    const coNhan = /^[^.\n]{0,60}:/.test(c);
    const laMucLap = (dem[c.split(/\s+/)[0]] || 0) >= 3;
    const truocLaTieuDe = out.length > 0 && /:$/.test(out[out.length - 1]);
    if (out.length === 0 || coNhan || laMucLap || truocLaTieuDe) out.push(c);
    else out[out.length - 1] += " " + c;
  }

  // CÒN LẠI LÀ MỘT KHỐI VĂN XUÔI DÀI (tin cowork viết liền một mạch, không gạch đầu
  // dòng, không nhãn) → mỗi CÂU một dòng. Không đổi một chữ nào, chỉ xuống dòng cho
  // đọc được: tin BĐS mỗi câu là một ý (diện tích · hướng · pháp lý · vị trí…).
  return out
    .flatMap((d) => (d.length > 180 && d.split(/(?<=[.!?…])\s+/).length >= 3 ? d.split(/(?<=[.!?…])\s+/) : [d]))
    .join("\n");
}

export function suaXuongDong(text) {
  return (text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .flatMap((line) => tachGachDauDong(line.trim()).split("\n")) // tách gạch đầu dòng trước
    .map(tachMucCoNhan) // rồi mới tách mục có nhãn, TRONG TỪNG DÒNG
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const gonTrang = (s) => (s || "").replace(/\s+/g, " ").trim();

// Khi được file khác import (vd sua-csv-cowork.mjs) thì CHỈ lấy hàm suaXuongDong,
// không chạy phần đọc/ghi Supabase bên dưới.
const CHAY_TRUC_TIEP = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (!CHAY_TRUC_TIEP) { /* chỉ dùng hàm */ } else {
// ── Chạy ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const GHI = args.includes("--ghi");
const iHoan = args.indexOf("--hoan-tac");

async function sb(path, init = {}) {
  const key = init.method && init.method !== "GET" ? KEY_GHI : KEY_DOC;
  const r = await fetch(URL_SB + path, {
    ...init,
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 200));
  return r.status === 204 ? null : r.json();
}

if (iHoan >= 0) {
  const backup = JSON.parse(readFileSync(args[iHoan + 1], "utf8"));
  if (!KEY_GHI) { console.error("Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local"); process.exit(1); }
  for (const t of backup) {
    await sb(`/rest/v1/listings?id=eq.${t.id}`, { method: "PATCH", body: JSON.stringify({ description: t.description }) });
    console.log("hoàn tác:", t.title.slice(0, 60));
  }
  console.log(`Đã trả lại nguyên trạng ${backup.length} tin.`);
  process.exit(0);
}

const tin = await sb("/rest/v1/listings?select=id,title,description,created_at&created_at=gte.2026-09-01&order=created_at.asc");
const doi = [];
for (const t of tin) {
  const moi = suaXuongDong(t.description);
  if (moi === (t.description || "").trim()) continue;
  if (gonTrang(moi) !== gonTrang(t.description)) {
    console.error("!! BỎ QUA (chữ bị đổi):", t.title.slice(0, 60));
    continue;
  }
  doi.push({ ...t, moi });
}

console.log(`Tổng tin đợt này: ${tin.length} · cần sửa: ${doi.length}`);
const bcao = doi
  .map((t) => `\n══════ ${t.title}\n── TRƯỚC ──\n${t.description}\n── SAU ──\n${t.moi}\n`)
  .join("");
const fPreview = resolve(ROOT, ".tmp-xem-truoc-xuong-dong.txt");
writeFileSync(fPreview, bcao, "utf8");
console.log("Xem trước đầy đủ:", fPreview);

if (!GHI) { console.log("\n(Chưa ghi gì. Thêm --ghi để ghi thật.)"); process.exit(0); }
if (!KEY_GHI) { console.error("Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local"); process.exit(1); }

const fBackup = resolve(ROOT, `.sao-luu-mo-ta-${new Date().toISOString().slice(0, 10)}.json`);
writeFileSync(fBackup, JSON.stringify(doi.map(({ id, title, description }) => ({ id, title, description })), null, 1), "utf8");
console.log("Đã sao lưu bản cũ:", fBackup);

for (const t of doi) {
  await sb(`/rest/v1/listings?id=eq.${t.id}`, { method: "PATCH", body: JSON.stringify({ description: t.moi }) });
  console.log("đã sửa:", t.title.slice(0, 60));
}
console.log(`Xong ${doi.length} tin.`);

}
