// ============================================================================
// KIỂM MỘT ĐỢT SAU KHI NẠP (quy trình 3 bên — bước 5, chủ dự án chốt 19/10/2026)
//   node scripts/kiem-dot-tren-web.mjs "D:/Coastal Land/SEO/DA-DUYET/17102026"
// Chỉ ĐỌC Supabase (bằng khoá máy chủ trong .env.local). Với từng dòng Bang-*.xlsx:
//   · tin có trên web chưa, trạng thái (chờ duyệt / đang hiện), đã gắn tài khoản chưa
//   · bộ ảnh trên web ĐÚNG từng ảnh trong thư mục `anh` (không thiếu, không thừa, không trùng,
//     không lẫn ảnh đợt cũ) · ảnh đại diện đúng số ở cột anh_dai_dien
// Một lượt đọc bảng listings (~1 truy vấn) — không chạy hàm Vercel, không xoá bộ nhớ đệm.
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const thuMuc = process.argv[2];
if (!thuMuc || !fs.existsSync(thuMuc)) { console.error('Thiếu thư mục đợt. VD: node scripts/kiem-dot-tren-web.mjs "D:/…/17102026"'); process.exit(1); }
const env = Object.fromEntries(fs.readFileSync(resolve(ROOT, ".env.local"), "utf8").split(/\r?\n/).map((l) => l.match(/^([A-Z_0-9]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]));
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}` };

const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { docTinTuBang } = await jiti.import(ROOT + "/src/lib/csvTin.ts");
const { docXlsx } = await jiti.import(ROOT + "/src/lib/docXlsx.ts");
const { isVideoUrl } = await jiti.import(ROOT + "/src/lib/media.ts");
const tepBang = fs.readdirSync(thuMuc).find((f) => /^Bang-.*\.xlsx$/i.test(f));
const kq = docTinTuBang(await docXlsx(new Uint8Array(fs.readFileSync(path.join(thuMuc, tepBang))).buffer));

// Ảnh trong thư mục theo mã: dn01-1710 → [1, 2, 4…]
const tep = {};
for (const f of fs.readdirSync(path.join(thuMuc, "anh"))) {
  const m = f.match(/^(.+?-\d{4})-(\d+)\.(jpe?g|png|webp)$/i);
  if (m) (tep[m[1].toLowerCase()] ??= []).push(+m[2]);
}
const soAnh = (u, ma) => { const p = decodeURIComponent(u).toLowerCase().split(`${ma}-`)[1]; const n = p ? parseInt(p, 10) : NaN; return Number.isNaN(n) ? null : n; };

const ma = kq.rows.map((r) => r.maAnh).filter(Boolean);
const ds = await (await fetch(`${U}/rest/v1/listings?select=id,status,owner_id,images,details->>maAnh,details->>anh_bia,details->>choChuDuyet&details->>maAnh=in.(${ma.join(",")})`, { headers: H })).json();
const theoMa = new Map();
for (const x of ds) (theoMa.get(x.maAnh) ?? theoMa.set(x.maAnh, []).get(x.maAnh)).push(x);

let loi = 0, tongAnh = 0;
const dem = { cho: 0, hien: 0 };
for (const r of kq.rows) {
  const m = r.maAnh.toLowerCase(), tin = theoMa.get(r.maAnh) ?? [];
  const bao = [];
  if (!tin.length) bao.push("CHƯA CÓ trên web");
  if (tin.length > 1) bao.push(`TRÙNG ${tin.length} tin cùng mã`);
  for (const x of tin) {
    x.choChuDuyet ? dem.cho++ : x.status === "approved" ? dem.hien++ : 0;
    if (!x.owner_id) bao.push("chưa gắn tài khoản");
    const anh = x.images.filter((u) => !isVideoUrl(u));
    tongAnh += anh.length;
    const so = anh.map((u) => soAnh(u, m));
    const la = so.filter((s) => s == null).length;
    if (la) bao.push(`${la} ảnh không thuộc đợt này (ảnh đợt cũ còn sót)`);
    const web = so.filter((s) => s != null).sort((a, b) => a - b), can = [...(tep[m] ?? [])].sort((a, b) => a - b);
    if (JSON.stringify(web) !== JSON.stringify(can)) bao.push(`ảnh web [${web}] ≠ thư mục [${can}]`);
    if (new Set(anh).size !== anh.length) bao.push("ảnh trùng");
    const muon = r.payload.details?.anhDaiDienSo;
    const bia = x.anh_bia ? soAnh(x.anh_bia, m) : null;
    if (muon && bia !== muon) bao.push(`ảnh đại diện ${bia ?? "(trống)"} ≠ cột anh_dai_dien ${muon}`);
    if (x.anh_bia && !anh.includes(x.anh_bia)) bao.push("ảnh đại diện không nằm trong bộ ảnh");
  }
  if (bao.length) { loi++; console.log(`${r.maAnh} · ${bao.join(" ; ")}`); }
}
console.log(`\n${kq.rows.length} dòng · ${ds.length} tin trên web (${dem.cho} chờ duyệt, ${dem.hien} đang hiện) · ${tongAnh} ảnh · ${loi ? `${loi} tin cần sửa` : "KHỚP HẾT"}`);
