// ════════════════════════════════════════════════════════════════════════════
// KIỂM KHOÁ QUẢN TRỊ SUPABASE — chạy SAU KHI đổi khoá
//
// VÌ SAO CÓ FILE NÀY: khoá `service_role` bị lộ qua ảnh chụp màn hình ngày
// 11/09/2026. Đổi khoá thì phải chứng minh được BA điều, chứ không thể tin là
// "chắc xong rồi":
//   ① khoá MỚI trên máy chạy được (script còn dùng được)
//   ② khoá MỚI trên Vercel chạy được (web còn duyệt tin / gửi thông báo được)
//   ③ khoá CŨ đã THẬT SỰ chết (nếu không thì đổi cũng bằng thừa)
//
// Điều ③ chỉ kiểm được khi có khoá cũ trong tay. Thêm một dòng vào .env.local:
//     SUPABASE_SERVICE_ROLE_KEY_CU=<khoá cũ đã bị lộ>
// Kiểm xong thì XOÁ dòng đó đi.
//
// Script KHÔNG in khoá ra màn hình — chỉ in dạng và độ dài, để chụp màn hình
// gửi qua lại cũng không lộ thêm lần nữa.
//
//   node scripts/kiem-khoa-supabase.mjs
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
const MOI = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const CU = env.SUPABASE_SERVICE_ROLE_KEY_CU;

function dang(k) {
  if (!k) return "(trống)";
  if (k.startsWith("sb_secret_")) return `khoá đời MỚI (sb_secret_…, ${k.length} ký tự)`;
  if (k.startsWith("eyJ")) return `khoá đời CŨ — JWT (eyJ…, ${k.length} ký tự)`;
  return `không nhận ra dạng (${k.length} ký tự)`;
}

/** Thử đọc thứ mà CHỈ khoá quản trị mới thấy: tin chưa duyệt. */
async function thu(khoa) {
  if (!khoa) return { song: false, vi: "không có khoá" };
  try {
    const r = await fetch(`${URL_}/rest/v1/listings?select=id,status&status=neq.approved&limit=5`, {
      headers: { apikey: khoa, Authorization: `Bearer ${khoa}` },
    });
    const body = await r.text();
    if (!r.ok) return { song: false, vi: `${r.status} ${body.slice(0, 120)}` };
    const ds = JSON.parse(body);
    return { song: true, so: ds.length };
  } catch (e) {
    return { song: false, vi: e.message };
  }
}

console.log("KIỂM KHOÁ QUẢN TRỊ SUPABASE");
console.log("─".repeat(64));

// ── ① Khoá mới trên máy ─────────────────────────────────────────────────────
console.log(`\n① Khoá đang cắm trên máy: ${dang(MOI)}`);
const kqMoi = await thu(MOI);
if (kqMoi.song) {
  console.log(`   ✅ CHẠY ĐƯỢC — đọc được tin chưa duyệt (${kqMoi.so} tin mẫu).`);
  if (MOI?.startsWith("eyJ"))
    console.log("   ⚠️ Nhưng vẫn là khoá ĐỜI CŨ. Nếu đây là khoá bị lộ thì chưa đổi gì cả.");
} else {
  console.log(`   ❌ KHÔNG chạy: ${kqMoi.vi}`);
  console.log("   → Dán lại khoá mới vào .env.local, dòng SUPABASE_SERVICE_ROLE_KEY=");
}

// ── ② Khoá trên Vercel (bản web thật) ───────────────────────────────────────
// Đường /api/auth/sms-hook?kiem-tra-token=1 phải dùng khoá quản trị để đọc
// token Zalo trong bảng bi_mat. Khoá hỏng là nó báo "KHÔNG lấy được" ngay.
console.log("\n② Khoá trên Vercel (đo trên coastalland.vn):");
try {
  const r = await fetch("https://coastalland.vn/api/auth/sms-hook?kiem-tra-token=1", { cache: "no-store" });
  const d = await r.json();
  const chuoi = JSON.stringify(d);
  if (/KHÔNG lấy được/.test(chuoi))
    console.log("   ❌ Web KHÔNG đọc được kho bí mật — khoá trên Vercel sai, hoặc chưa Redeploy.");
  else console.log(`   ✅ CHẠY ĐƯỢC — ${chuoi.slice(0, 160)}`);
} catch (e) {
  console.log(`   ⚠️ Không gọi được web: ${e.message}`);
}

// ── ③ Khoá cũ đã chết chưa ──────────────────────────────────────────────────
console.log("\n③ Khoá CŨ (khoá bị lộ):");
if (!CU) {
  console.log("   ⏭️ Chưa kiểm được. Muốn kiểm thì thêm vào .env.local một dòng:");
  console.log("      SUPABASE_SERVICE_ROLE_KEY_CU=<khoá cũ>   (kiểm xong nhớ xoá dòng này)");
} else {
  const kqCu = await thu(CU);
  if (kqCu.song) {
    console.log(`   🔴 KHOÁ CŨ VẪN SỐNG — vẫn đọc được dữ liệu khách (${kqCu.so} tin mẫu).`);
    console.log("   → Vào Supabase → Project Settings → API Keys → Legacy API keys → vô hiệu hoá.");
  } else {
    console.log(`   ✅ Đã chết: ${kqCu.vi}`);
  }
}

console.log("\n" + "─".repeat(64));
const xong = kqMoi.song && !MOI?.startsWith("eyJ") && CU && !(await thu(CU)).song;
console.log(xong ? "KẾT LUẬN: đổi khoá XONG, khoá lộ đã vô hiệu." : "KẾT LUẬN: chưa xong hết — xem các dòng ❌ 🔴 ⏭️ ở trên.");
