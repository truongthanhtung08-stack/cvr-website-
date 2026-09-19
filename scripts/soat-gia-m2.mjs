// SOÁT GIÁ MỖI M² — mẫu số đúng chưa, tin nào chưa đủ số liệu để tính.
//   node scripts/soat-gia-m2.mjs
import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";
const ROOT = path.resolve(import.meta.dirname, "..");
const jiti = createJiti(ROOT + "/kiem.mjs", { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { mauSoCuaLoaiHinh, TEN_MAU_SO, specForType, coDonGiaM2 } = await jiti.import(ROOT + "/src/lib/listingSpec.ts");

const env = Object.fromEntries(fs.readFileSync(ROOT + "/.env.local", "utf8").split(/\r?\n/)
  .filter((l) => l && !l.startsWith("#") && l.includes("="))
  .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const rows = await (await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listings?select=id,title,type,purpose,price_vnd,area_m2,built_area_m2,details&limit=2000`,
  { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY } })).json();

const nhom = new Map();
for (const r of rows) {
  const mau = mauSoCuaLoaiHinh(r.type);
  const k = `${r.purpose === "thue" ? "THUÊ " : "BÁN  "}${specForType(r.type).label}`;
  const o = nhom.get(k) ?? { n: 0, tinhDuoc: 0, mau: TEN_MAU_SO[mau] };
  o.n++;
  // Nhà chưa khai m² sàn thì dùng số SUY RA từ nội dung tin (details.dtSanUocTinh).
  const dt = coDonGiaM2(r.type, r.purpose) ? r.area_m2 : mau === "san" ? r.built_area_m2 ?? r.details?.dtSanUocTinh : r.area_m2;
  if (r.price_vnd != null && dt) o.tinhDuoc++;
  nhom.set(k, o);
}
let tong = 0, duoc = 0;
console.log("MỤC ĐÍCH · LOẠI HÌNH".padEnd(46), "tin  tính được  mẫu số đúng");
for (const [k, o] of [...nhom.entries()].sort()) {
  tong += o.n; duoc += o.tinhDuoc;
  const co = o.tinhDuoc === o.n ? "✔" : o.tinhDuoc === 0 ? "✘" : "~";
  console.log(k.padEnd(46), String(o.n).padStart(3), String(o.tinhDuoc).padStart(9), ` ${co}  ${o.mau}`);
}
console.log(`\nTổng: ${duoc}/${tong} tin hiện được giá mỗi m² đúng mẫu số.`);
