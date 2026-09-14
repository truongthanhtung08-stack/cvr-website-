// Đếm số tệp + dung lượng đang có trên R2 (dùng để theo dõi tiến độ chuyển ảnh)
import fs from "node:fs"; import path from "node:path"; import { AwsClient } from "aws4fetch";
const GOC = path.resolve(import.meta.dirname, "..");
const k = Object.fromEntries(fs.readFileSync(path.join(GOC, "khoa-r2.txt"), "utf8")
  .split(/\r?\n/).map(d => d.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)$/)).filter(Boolean).map(m => [m[1], m[2].trim()]));
const ky = new AwsClient({ accessKeyId: k.ACCESS_KEY_ID, secretAccessKey: k.SECRET_ACCESS_KEY, service: "s3", region: "auto" });
let token = "", n = 0, bytes = 0;
for (;;) {
  const u = new URL(`${k.ENDPOINT}/${k.BUCKET}`);
  u.searchParams.set("list-type", "2"); u.searchParams.set("max-keys", "1000");
  if (token) u.searchParams.set("continuation-token", token);
  const res = await ky.fetch(u); const xml = await res.text();
  if (!res.ok) { console.error(xml.slice(0, 300)); process.exit(1); }
  n += (xml.match(/<Key>/g) || []).length;
  for (const m of xml.matchAll(/<Size>(\d+)<\/Size>/g)) bytes += Number(m[1]);
  const t = xml.match(/<NextContinuationToken>([^<]+)</);
  if (t) token = t[1]; else break;
}
console.log(`R2 đang có ${n} tệp · ${(bytes / 1048576).toFixed(1)} MB`);
