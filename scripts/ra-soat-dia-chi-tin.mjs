// RÀ SOÁT ĐỊA CHỈ HAI HỆ trên TOÀN BỘ tin đang có — đi đúng đường listingsDb.rowToListing
//   node scripts/ra-soat-dia-chi-tin.mjs
import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";
const ROOT = path.resolve(import.meta.dirname, "..");
const jiti = createJiti(ROOT + "/kiem.mjs", { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { haiDongDiaChi, heCuaTin } = await jiti.import(ROOT + "/src/lib/diaChiHaiHe.ts");

const env = Object.fromEntries(fs.readFileSync(ROOT + "/.env.local", "utf8").split(/\r?\n/)
  .filter((l) => l && !l.startsWith("#") && l.includes("="))
  .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listings?select=id,title,ward,district,province,details&limit=2000`,
  { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } });
const rows = await res.json();

const out = [];
for (const r of rows) {
  const goc = [r.ward, r.district, r.province].filter(Boolean).join(", ");
  let moi = goc, cu = "", hai = null;
  if (r.province) {
    hai = haiDongDiaChi(heCuaTin(r.district), { tinh: r.province, quan: r.district ?? "", phuong: r.ward ?? "" });
    moi = hai.moi || goc;
    // ⚠️ Chép đúng luật của listingsDb.rowToListing — sửa bên đó thì sửa cả đây.
    const dcCu = r.details?.diaChiCu;
    const tay = { phuong: (dcCu?.phuong ?? "").trim(), quan: (dcCu?.quan ?? "").trim(), tinh: (dcCu?.tinh ?? "").trim() };
    const cuTho = tay.phuong || tay.quan
      ? [tay.phuong, tay.quan, tay.tinh || hai.cuTinh].filter(Boolean).join(", ")
      : hai.cu;
    cu = cuTho && cuTho !== moi ? cuTho : "";
  }
  out.push({ id: r.id.slice(0, 8), he: heCuaTin(r.district), ward: r.ward, district: r.district, province: r.province,
    dcCu: r.details?.diaChiCu ?? null, moi, cu, capCu: cu ? cu.split(",").length : 0, suyCu: hai?.cu ?? "", title: (r.title || "").slice(0, 40) });
}
const dem = {};
for (const o of out) dem[o.capCu] = (dem[o.capCu] || 0) + 1;
console.log("Tổng tin:", out.length, "· số cấp ở dòng 'Địa chỉ hệ cũ':", dem);
console.log("\n=== DÒNG HỆ CŨ THIẾU CẤP (<3) ===");
for (const o of out.filter((o) => o.capCu > 0 && o.capCu < 3))
  console.log(`${o.id} [${o.he}] moi="${o.moi}" | cu="${o.cu}" | suy="${JSON.stringify(o.suyCu)}" | dcCu=${JSON.stringify(o.dcCu)} | db="${o.ward}"/"${o.district}"/"${o.province}"`);
console.log("\n=== KHÔNG CÓ DÒNG HỆ CŨ ===", out.filter((o) => o.capCu === 0).length);
for (const o of out.filter((o) => o.capCu === 0))
  console.log(`${o.id} [${o.he}] moi="${o.moi}" | suy="${JSON.stringify(o.suyCu)}" | dcCu=${JSON.stringify(o.dcCu)} | db="${o.ward}"/"${o.district}"/"${o.province}"`);
