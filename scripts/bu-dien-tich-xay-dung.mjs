// ============================================================================
// BÙ DIỆN TÍCH XÂY DỰNG CHO TIN CŨ — lấy từ CHÍNH NỘI DUNG TIN.
//
// Giá mỗi m² của NHÀ phải chia cho m² SÀN. Tin nhập trước 19/09 không có cột
// dien_tich_xay_dung nên phần lớn để trống → trang tin không hiện được giá mỗi
// m². Số liệu đó thường vẫn nằm trong tiêu đề/mô tả, chỉ là chưa ai bóc ra.
//
//   NHÓM A — tin ghi THẲNG m² sàn ("DT sàn 263,3m²", "diện tích sàn 300m2").
//            Chép nguyên, không tính toán → ghi được ngay.
//   NHÓM B — tin chỉ ghi SỐ TẦNG. m² sàn = m² đất × số tầng là công thức của
//            thị trường, nhưng vẫn là PHÉP TÍNH chứ không phải số người đăng
//            khai → in ra cho người duyệt gật, script không tự ghi.
//
// Chạy:
//   node scripts/bu-dien-tich-xay-dung.mjs             → chỉ xem
//   node scripts/bu-dien-tich-xay-dung.mjs --ghi-a     → ghi nhóm A
//   node scripts/bu-dien-tich-xay-dung.mjs --ghi <id,…> → ghi những tin nhóm B đã duyệt
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";
const ROOT = path.resolve(import.meta.dirname, "..");
const jiti = createJiti(ROOT + "/kiem.mjs", { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { mauSoCuaLoaiHinh, specForType } = await jiti.import(ROOT + "/src/lib/listingSpec.ts");

const env = Object.fromEntries(fs.readFileSync(ROOT + "/.env.local", "utf8").split(/\r?\n/)
  .filter((l) => l && !l.startsWith("#") && l.includes("="))
  .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" };

const args = process.argv.slice(2);
const ghiA = args.includes("--ghi-a");
const ghiIds = (args[args.indexOf("--ghi") + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const rows = await (await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listings?select=id,title,description,type,purpose,price_vnd,area_m2,built_area_m2,details&limit=2000`, { headers: H })).json();
const so = (s) => parseFloat(String(s).replace(/\./g, "").replace(",", "."));

const A = [], B = [], C = [];
for (const r of rows) {
  if (mauSoCuaLoaiHinh(r.type) !== "san") continue;   // chỉ nhà gắn liền đất
  if (r.built_area_m2 || r.details?.dtSanUocTinh) continue;  // đã có số khai hoặc số suy
  const chu = [r.title, r.description, r.details?.addressDetail].filter(Boolean).join(" | ");

  // ① m² SÀN ghi thẳng — "DT sàn 263,3m2" · "diện tích sàn: 300 m²" · "tổng sàn 450m2"
  const san = chu.match(/(?:dt|diện\s*tích|tổng)\s*(?:sàn|xây\s*dựng)\s*[:\-]?\s*([\d.,]+)\s*m|(?:sàn|xây\s*dựng)\s*[:\-]?\s*([\d.,]+)\s*m²/i);
  const vSan = san ? so(san[1] ?? san[2]) : NaN;

  // Số tầng — ưu tiên ô đặc điểm đã nhập, sau mới dò trong chữ.
  const tangSpec = parseInt(String(r.details?.specs?.floors ?? "").match(/\d+/)?.[0] ?? "", 10);
  const tangChu = chu.match(/(\d{1,2})\s*tầng/i);
  const tang = Number.isFinite(tangSpec) && tangSpec > 0 ? tangSpec : tangChu ? parseInt(tangChu[1], 10) : NaN;
  const coTang = Number.isFinite(tang) && tang > 0 && tang <= 20;

  if (Number.isFinite(vSan) && vSan > 0 && vSan < 100000) {
    // ⚠️ "Diện tích sàn" trong tin Việt Nam KHÔNG nhất quán: có tin ghi TỔNG sàn,
    // có tin ghi sàn MỖI TẦNG. Số nhỏ hơn cả diện tích đất thì chắc chắn là mỗi
    // tầng ("Diện tích sàn: 74,5m²" trên lô 102 m² 6 tầng) — nhân lên mới ra tổng.
    const moiTang = r.area_m2 && vSan < r.area_m2;
    if (moiTang && coTang) {
      B.push({ r, m2: Math.round(vSan * tang), vi: `${vSan} m² mỗi sàn × ${tang} tầng (số ghi < DT đất nên là sàn MỖI TẦNG)`, bang: san[0] });
    } else if (moiTang) {
      C.push({ r, ly: `ghi "${san[0]}" nhỏ hơn DT đất mà tin không nói số tầng — không biết nhân mấy` });
    } else {
      A.push({ r, m2: Math.round(vSan * 10) / 10, vi: "tin ghi thẳng TỔNG m² sàn", bang: san[0] });
    }
    continue;
  }

  if (coTang && r.area_m2) {
    B.push({ r, m2: Math.round(r.area_m2 * tang), vi: `${r.area_m2} m² đất × ${tang} tầng`, bang: tangChu?.[0] ?? `ô Số tầng = ${tang}` });
    continue;
  }
  C.push({ r, ly: "tin không nói m² sàn lẫn số tầng" });
}

const in1 = (o, i) => console.log(`  ${i + 1}. ${o.r.id}\n     ${specForType(o.r.type).label} · ${o.r.area_m2 ?? "?"} m² đất  →  ${o.m2} m² sàn   [${o.vi}]\n     bằng chứng: "${o.bang}"  ⟵ ${(o.r.title ?? "").slice(0, 52)}`);
console.log(`Tin nhà gắn liền đất còn thiếu m² sàn: ${A.length + B.length + C.length}`);
console.log(`\n═══ NHÓM A — tin ghi thẳng m² sàn, ghi được ngay: ${A.length}`);
A.forEach(in1);
console.log(`\n═══ NHÓM B — suy từ số tầng, CẦN NGƯỜI DUYỆT: ${B.length}`);
B.forEach(in1);
console.log(`\n═══ NHÓM C — tin không nói gì về sàn lẫn số tầng: ${C.length}`);
C.forEach((o, i) => console.log(`  ${i + 1}. ${specForType(o.r.type).label} — ${(o.r.title ?? "").slice(0, 50)}  [${o.ly}]`));

// Thống kê là GIÁ TRUNG BÌNH nên phải suy ra mới đủ mẫu — chủ dự án chốt 19/09.
// --ghi-tat ghi cả nhóm A (số tin ghi thẳng) lẫn nhóm B (suy từ số tầng).
const ghiTat = args.includes("--ghi-tat");
const canGhi = ghiTat ? [...A, ...B] : ghiA ? A : B.filter((o) => ghiIds.includes(o.r.id));
if (!canGhi.length) { console.log("\n(chỉ xem — thêm --ghi-a hoặc --ghi <id,…> mới ghi vào Supabase)"); process.exit(0); }
console.log(`\n→ Đang ghi ${canGhi.length} tin…`);
for (const o of canGhi) {
  // ⚠️ GHI VÀO details.dtSanUocTinh, KHÔNG ghi built_area_m2. Ô "Diện tích xây
  // dựng" trên trang tin là số NGƯỜI ĐĂNG KHAI; số suy ra chỉ để tính giá mỗi m²
  // (hiện kèm dấu ≈) và để thống kê giá trung bình khu vực.
  const details = { ...(o.r.details ?? {}), dtSanUocTinh: o.m2, dtSanNguon: o.vi };
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listings?id=eq.${o.r.id}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ details }),
  });
  console.log(`  ${res.ok ? "✔" : "✘ " + res.status} ${o.r.id} → ${o.m2} m² sàn`);
}
