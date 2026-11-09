// NẠP BẢNG TỪ KHOÁ LÕI LÊN WEB (anh 09/11/2026: "cấu trúc tự động, khi nào chỉnh bảng thì cập nhật lên web").
// Đọc sheet "Từ khoá lõi" của HE-THONG-TU-KHOA.xlsx → src/data/tu-khoa-loi.json (web đọc ở pseo.ts tuKhoa).
//   npx tsx scripts/nap-tu-khoa.ts ["D:\Coastal Land\SEO\Plan SEO - pSEO\HE-THONG-TU-KHOA.xlsx"]
// Chỉ lấy dòng có "x" ở cột "Lên web", mục đích Bán / Cho thuê. LUẬT AN TOÀN (tự áp, khỏi hỏi lại):
//   · dòng ưu tiên "1 · Đang top" → không đổi chữ (trang đang lên Google giữ nguyên);
//   · chữ lõi mới TRÙNG chữ lõi của loại hình khác cùng mục đích + tỉnh (vd "Bán nhà" của Nhà riêng = của nhóm Nhà) → không đổi
//     (hai trang một tiêu đề, Google chỉ chọn một);
//   · trang TRANG_TOP / TRANG_DONG_BANG còn được chặn lần nữa ở pseo.ts lúc vẽ.
import fs from "node:fs";
import zlib from "node:zlib";
import { saleCategories, rentCategories, nhomPseo, type Category } from "../src/lib/categories";

const FILE = process.argv[2] || "D:\\Coastal Land\\SEO\\Plan SEO - pSEO\\HE-THONG-TU-KHOA.xlsx";
const RA = "src/data/tu-khoa-loi.json";

// ── đọc .xlsx (zip) không cần thư viện ──
function moZip(buf: Buffer): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  let e = buf.length - 22;
  while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  const n = buf.readUInt16LE(e + 10);
  let p = buf.readUInt32LE(e + 16);
  for (let i = 0; i < n; i++) {
    const cach = buf.readUInt16LE(p + 10), nen = buf.readUInt32LE(p + 20);
    const lt = buf.readUInt16LE(p + 28), lx = buf.readUInt16LE(p + 30), lc = buf.readUInt16LE(p + 32);
    const goc = buf.readUInt32LE(p + 42);
    const ten = buf.toString("utf8", p + 46, p + 46 + lt);
    const dl = goc + 30 + buf.readUInt16LE(goc + 26) + buf.readUInt16LE(goc + 28);
    const raw = buf.subarray(dl, dl + nen);
    out.set(ten, cach === 8 ? zlib.inflateRawSync(raw) : raw);
    p += 46 + lt + lx + lc;
  }
  return out;
}
const giaiXml = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const zip = moZip(fs.readFileSync(FILE));
const doc = (n: string) => zip.get(n)?.toString("utf8") ?? "";
const chung = [...doc("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => giaiXml([...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1]).join("")));
const wb = doc("xl/workbook.xml"), rels = doc("xl/_rels/workbook.xml.rels");
const rid = wb.match(/<sheet [^>]*name="Từ khoá lõi"[^>]*r:id="([^"]+)"/)?.[1] ?? wb.match(/<sheet [^>]*r:id="([^"]+)"[^>]*name="Từ khoá lõi"/)?.[1];
const dich = rels.match(new RegExp(`Id="${rid}"[^>]*Target="([^"]+)"`))?.[1] ?? rels.match(new RegExp(`Target="([^"]+)"[^>]*Id="${rid}"`))?.[1];
if (!dich) throw new Error('Không thấy sheet "Từ khoá lõi"');
const sheet = doc("xl/" + dich.replace(/^\/?xl\//, ""));
const cot = (r: string) => [...r.replace(/\d/g, "")].reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
const bang: string[][] = [...sheet.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)].map((m) => {
  const dong: string[] = [];
  for (const c of m[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const v = c[3]?.match(/<v>([^<]*)<\/v>/)?.[1] ?? c[3]?.match(/<t[^>]*>([^<]*)<\/t>/)?.[1] ?? "";
    dong[cot(c[1])] = /t="s"/.test(c[2]) ? chung[+v] ?? "" : giaiXml(v);
  }
  return dong;
});
const dau = bang[0];
const i = (ten: string) => { const k = dau.findIndex((h) => (h ?? "").startsWith(ten)); if (k < 0) throw new Error(`Thiếu cột "${ten}"`); return k; };
const C = { uu: i("Ưu tiên"), muc: i("Mục đích"), noi: i("Địa điểm"), loi: i("LÕI GỌN"), lt: i("LONGTAIL"), trang: i("Trang lõi"), len: i("Lên web") };

// chữ lõi mặc định của web theo loại hình (để soát trùng)
const macDinh = (muc: string, slug: string) => {
  const ds: Category[] = muc === "ban" ? [...saleCategories, ...nhomPseo("ban")] : [...rentCategories, ...nhomPseo("thue")];
  const c = ds.find((x) => x.slug === slug);
  return c ? c.tuKhoa ?? c.h1 : null;
};
type Dong = { trang: string; muc: string; slug: string; tinh: string; noi: string; loi: string; longtail: string; uu: string };
const chon: Dong[] = [];
for (const r of bang.slice(1)) {
  if ((r[C.len] ?? "").trim().toLowerCase() !== "x") continue;
  const m = (r[C.trang] ?? "").match(/^\/(mua-ban|cho-thue)\/([^/]+)\/([^/\s]+)$/);
  if (!m) continue; // Dự án / Tin tức / Tra cứu: chưa có trang <loại>/<tỉnh> trên web
  const noi = (r[C.noi] ?? "").trim();
  chon.push({ trang: m[0], muc: m[1] === "mua-ban" ? "ban" : "thue", slug: m[2], tinh: m[3], noi,
    loi: (r[C.loi] ?? "").trim().replace(new RegExp(`\\s+${noi}$`), ""), longtail: (r[C.lt] ?? "").trim(), uu: (r[C.uu] ?? "").trim() });
}
const ket: Record<string, { loi?: string; longtail?: string }> = {};
const bo: string[] = [];
for (const d of chon) {
  const cu = macDinh(d.muc, d.slug);
  const muc: { loi?: string; longtail?: string } = d.longtail ? { longtail: d.longtail } : {};
  if (!d.loi || d.loi === cu) { /* không đổi chữ */ }
  else if (d.uu.startsWith("1")) bo.push(`${d.trang}: giữ "${cu}" (trang đang top)`);
  else {
    const trung = chon.filter((x) => x !== d && x.muc === d.muc && x.tinh === d.tinh).map((x) => x.loi || macDinh(x.muc, x.slug))
      .concat([...saleCategories, ...rentCategories, ...nhomPseo("ban"), ...nhomPseo("thue")].filter((c) => c.slug !== d.slug && (d.muc === "ban" ? !c.h1.startsWith("Cho thuê") : c.h1.startsWith("Cho thuê"))).map((c) => c.tuKhoa ?? c.h1));
    if (trung.includes(d.loi)) bo.push(`${d.trang}: giữ "${cu}" ("${d.loi}" trùng loại hình khác)`);
    else muc.loi = d.loi;
  }
  if (muc.loi || muc.longtail) ket[d.trang] = muc;
}
fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync(RA, JSON.stringify({ nguon: "HE-THONG-TU-KHOA.xlsx · sheet Từ khoá lõi · cột Lên web", trang: ket }, null, 2) + "\n");
const doi = Object.entries(ket).filter(([, v]) => v.loi);
console.log(`Chọn ${chon.length} dòng Bán/Cho thuê → đổi chữ lõi ${doi.length} trang:`);
for (const [k, v] of doi) console.log(`  ${k}: "${macDinh(k.split("/")[1] === "mua-ban" ? "ban" : "thue", k.split("/")[2])}" → "${v.loi}"`);
console.log(`Giữ nguyên ${bo.length}:`); bo.forEach((x) => console.log("  " + x));
