import { matBangGia } from "../src/lib/chiSoGia";
import type { Listing } from "../src/lib/data";
import fs from "fs";
fs.readFileSync(".env.local", "utf8").split(/\r?\n/).forEach((l) => { const m = l.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
(async () => {
  const rows: any[] = await (await fetch(`${url}/rest/v1/listings?select=id,type,purpose,price_vnd,area_m2,province,ward&status=eq.approved&limit=500`, { headers: { apikey: key, Authorization: "Bearer " + key } })).json();
  const all: Listing[] = rows.map((r) => ({ id: r.id, title: "", price: "", area: "", type: r.type ?? "", image: "", location: "", purpose: r.purpose ?? "ban", priceVnd: r.price_vnd, areaM2: r.area_m2, diaGioi: { ward: r.ward ?? "", district: "", province: r.province ?? "" } })) as any;
  const co = all.filter((t) => matBangGia(t, all));
  console.log(`${co.length}/${all.length} tin CÓ mặt bằng giá`);
  console.log("5 id đầu có mặt bằng:");
  co.slice(0, 5).forEach((t) => console.log("  " + t.id + "  " + t.type));
})();
