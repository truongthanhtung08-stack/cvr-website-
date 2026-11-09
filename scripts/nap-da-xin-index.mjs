// NẠP CÁC TRANG ĐÃ XIN INDEX TỪ SỔ THEO-DOI-INDEX.md → src/data/da-xin-index.json (dùng cho Admin → Xin index).
//   node scripts/nap-da-xin-index.mjs ["D:\Coastal Land\SEO\Plan SEO - pSEO\THEO-DOI-INDEX.md"]
// Chỉ đọc dòng có ghi đã xin ("Indexing requested" / "đã xin"); bỏ phần sau "KHÔNG xin". Tin đăng ghi theo mã 8 ký tự (khoá "ma:<mã>").
import fs from "node:fs";
const tep = process.argv[2] || "D:/Coastal Land/SEO/Plan SEO - pSEO/THEO-DOI-INDEX.md";
const ra = {};
let ngayTruoc = "";
for (const dong of fs.readFileSync(tep, "utf8").split(/\r?\n/)) {
  const ng = dong.match(/\((\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (ng) ngayTruoc = `${ng[3] ?? "2026"}-${ng[2].padStart(2, "0")}-${ng[1].padStart(2, "0")}`;
  if (!/Indexing requested|đã xin|Đã xin/.test(dong)) continue;
  const phan = dong.split(/KHÔNG xin|Ngày sau xin tiếp|ngày sau xin tiếp|Dừng ở|Lượt kế/)[0];
  for (const m of phan.matchAll(/\/(?:mua-ban|cho-thue|du-an|tin-tuc)(?:\/[a-z0-9-]+)*/g)) ra[m[0]] = ngayTruoc;
  for (const m of phan.matchAll(/(?:^|[\s·/(-])([0-9a-f]{8})(?=[\s·.,)(]|$)/g)) ra[`ma:${m[1]}`] = ngayTruoc;
}
fs.writeFileSync("src/data/da-xin-index.json", JSON.stringify(ra, null, 1) + "\n");
console.log(Object.keys(ra).length, "mục ·", Object.keys(ra).filter((k) => k.startsWith("ma:")).length, "tin");
