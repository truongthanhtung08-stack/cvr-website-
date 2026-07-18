// ============================================================================
// IMPORT TIN MỒI HÀNG LOẠT vào Supabase (bảng listings) — cho 500+ tin.
//
// CÁCH DÙNG:
//   1. Điền tin vào file CSV theo mẫu data/tin-moi-mau.csv (mở bằng Excel,
//      Save As → CSV UTF-8). Cột "anh": nhiều link cách nhau dấu |
//   2. Lấy khoá service_role: Supabase Dashboard → Project Settings → API keys
//      → service_role → Copy. TỰ THÊM vào file .env.local dòng:
//        SUPABASE_SERVICE_ROLE_KEY=eyJ...
//      (khoá này chỉ nằm trên máy anh, KHÔNG commit lên git)
//   3. Chạy thử (không ghi gì): node scripts/import-tin-moi.mjs data/tin-moi.csv --dry-run
//   4. Chạy thật:               node scripts/import-tin-moi.mjs data/tin-moi.csv
//
// Tin import vào với status='approved' (hiện ngay trên web) — muốn vào hàng chờ
// duyệt thì thêm --cho-duyet (status='pending').
// ============================================================================

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ── Đọc .env.local ──────────────────────────────────────────────────────────
function readEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch {
    /* thiếu file → báo bên dưới */
  }
  return env;
}

// ── CSV parser (hỗ trợ ô trong ngoặc kép, xuống dòng trong ô, BOM) ──────────
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", inQuotes = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); if (row.some((x) => x.trim() !== "")) rows.push(row); }
  return rows;
}

// ── Danh mục hợp lệ (khớp src/lib/listingSpec.ts) ───────────────────────────
const LOAI_HINH = [
  "Condotel / Nghỉ dưỡng", "Căn hộ / Chung cư", "Đất công nghiệp / Nhà xưởng / Kho bãi",
  "Văn phòng / Mặt bằng kinh doanh", "Biệt thự / Villa", "Shophouse / Nhà phố thương mại",
  "Nhà mặt phố", "Nhà trọ / Phòng trọ", "Nhà riêng", "Đất nền / Đất",
];
const HANG = { thuong: "basic", basic: "basic", silver: "silver", gold: "gold", diamond: "diamond" };

// ── Giá "5,5 tỷ" / "12 triệu" / "850 triệu" / "Thoả thuận" → VNĐ ────────────
function parseGia(s, mucDich) {
  const t = (s ?? "").trim().toLowerCase();
  if (!t || t.includes("thoả thuận") || t.includes("thoa thuan") || t.includes("thỏa thuận")) return null;
  const n = parseFloat(t.replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(n)) return NaN; // giá ghi sai → báo lỗi dòng
  if (t.includes("tỷ") || t.includes("ty")) return Math.round(n * 1e9);
  if (t.includes("triệu") || t.includes("trieu") || t.includes("tr")) return Math.round(n * 1e6);
  // Không ghi đơn vị: thuê hiểu là triệu/tháng, bán hiểu là tỷ
  return Math.round(n * (mucDich === "thue" ? 1e6 : 1e9));
}

const num = (s) => (s?.trim() ? parseFloat(s.replace(",", ".")) : null);
const int = (s) => (s?.trim() ? parseInt(s, 10) : null);

// ── Map 1 dòng CSV → payload listings ───────────────────────────────────────
function toPayload(r, status) {
  const errs = [];
  const mucDich = r.muc_dich?.trim().toLowerCase();
  if (mucDich !== "ban" && mucDich !== "thue") errs.push(`muc_dich phải là ban|thue (đang: "${r.muc_dich}")`);
  const loaiHinh = r.loai_hinh?.trim();
  if (!LOAI_HINH.includes(loaiHinh)) errs.push(`loai_hinh không đúng danh mục: "${loaiHinh}"`);
  if (!r.tieu_de?.trim()) errs.push("thiếu tieu_de");
  if (!r.tinh?.trim()) errs.push("thiếu tinh");
  const gia = parseGia(r.gia, mucDich);
  if (Number.isNaN(gia)) errs.push(`gia không đọc được: "${r.gia}"`);
  const hang = HANG[(r.hang || "thuong").trim().toLowerCase()];
  if (!hang) errs.push(`hang phải là thuong|silver|gold|diamond (đang: "${r.hang}")`);
  if (!r.ten_nguoi_dang?.trim()) errs.push("thiếu ten_nguoi_dang (tên hiện trên thẻ tin)");
  if (!r.so_dien_thoai?.trim()) errs.push("thiếu so_dien_thoai");
  if (errs.length) return { errs };

  return {
    payload: {
      owner_id: null, // tin mồi — không gắn tài khoản; tên/SĐT thật nằm ở contact
      purpose: mucDich,
      type: loaiHinh,
      title: r.tieu_de.trim(),
      description: r.mo_ta?.trim() || null,
      price_vnd: gia,
      area_m2: num(r.dien_tich_m2),
      built_area_m2: num(r.dt_xay_dung_m2),
      beds: int(r.phong_ngu),
      baths: int(r.phong_tam),
      ward: r.phuong_xa?.trim() || null,
      district: r.quan_huyen?.trim() || null,
      province: r.tinh.trim(),
      images: (r.anh ?? "").split("|").map((s) => s.trim()).filter(Boolean),
      details: {
        legal: r.phap_ly?.trim() || undefined,
        furnish: r.noi_that?.trim() || undefined,
        direction: r.huong?.trim() || undefined,
        addressDetail: r.dia_chi_cu_the?.trim() || undefined,
        contact: {
          name: r.ten_nguoi_dang.trim(),
          phone: r.so_dien_thoai.trim(),
          email: r.email?.trim() || "",
        },
      },
      tier: hang,
      status,
      published_at: status === "approved" ? new Date().toISOString() : null,
    },
  };
}

// ── Main ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const status = args.includes("--cho-duyet") ? "pending" : "approved";

if (!csvPath) {
  console.log("Cách dùng: node scripts/import-tin-moi.mjs <file.csv> [--dry-run] [--cho-duyet]");
  process.exit(1);
}

const rows = parseCsv(readFileSync(resolve(ROOT, csvPath), "utf8"));
const header = rows.shift().map((h) => h.trim().toLowerCase());
const records = rows.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])));

console.log(`Đọc ${records.length} dòng tin từ ${csvPath} (status khi import: ${status})\n`);

const good = [], bad = [];
records.forEach((r, i) => {
  const { payload, errs } = toPayload(r, status);
  if (errs) bad.push({ line: i + 2, tieu_de: r.tieu_de?.slice(0, 50), errs });
  else good.push(payload);
});

if (bad.length) {
  console.log(`⚠ ${bad.length} dòng LỖI (sẽ bị bỏ qua):`);
  for (const b of bad) console.log(`  - Dòng ${b.line} "${b.tieu_de ?? ""}": ${b.errs.join(" · ")}`);
  console.log("");
}
console.log(`✓ ${good.length} tin hợp lệ.`);

if (dryRun) {
  console.log("\n[DRY-RUN] Không ghi gì vào database. Tin đầu tiên sau khi map:");
  console.log(JSON.stringify(good[0] ?? null, null, 2).slice(0, 1500));
  process.exit(bad.length ? 2 : 0);
}

const env = readEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("\n✗ Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local — xem hướng dẫn đầu file này.");
  process.exit(1);
}

let inserted = 0;
for (let i = 0; i < good.length; i += 50) {
  const batch = good.slice(i, i + 50);
  const res = await fetch(`${URL}/rest/v1/listings`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    console.error(`✗ Lô ${i / 50 + 1} thất bại (${res.status}): ${(await res.text()).slice(0, 300)}`);
    process.exit(1);
  }
  inserted += batch.length;
  console.log(`  → Đã ghi ${inserted}/${good.length} tin…`);
}

console.log(`\n✅ XONG: ${inserted} tin đã vào database${status === "approved" ? " và HIỆN NGAY trên web" : " (chờ duyệt trong Admin)"}.`);
if (bad.length) console.log(`⚠ Nhớ sửa ${bad.length} dòng lỗi ở trên rồi chạy lại riêng các dòng đó.`);
