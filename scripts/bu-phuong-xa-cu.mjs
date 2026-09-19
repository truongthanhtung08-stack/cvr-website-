// ============================================================================
// BÙ PHƯỜNG/XÃ CŨ CHO TIN ĐÃ ĐĂNG — để dòng "Địa chỉ hệ cũ" đủ 3 cấp.
//
// Một phường MỚI gộp 2–10 phường CŨ nên từ tên mới KHÔNG suy ngược ra được
// phường cũ (xem ungVienPhuongCu). Script này đi tìm câu trả lời trong CHÍNH
// NỘI DUNG TIN, rồi đối chiếu với bảng sáp nhập chính thức:
//
//   NHÓM A — người đăng tự viết câu chuyển hệ: "xã Triệu Vân, NAY xã Nam Cửa
//            Việt". Chính chủ tin khai ra, khớp đúng một ứng viên trong bảng
//            → ghi thẳng, không cần ai duyệt.
//   NHÓM B — tên phường cũ chỉ xuất hiện rời rạc trong tin. Có ca bẫy thật:
//            "Altara Residences, đường Trần Hưng Đạo" khớp phường Trần Hưng Đạo
//            nhưng đó là TÊN ĐƯỜNG, chạy qua nhiều phường → PHẢI người xem,
//            script chỉ in bảng chứ không tự ghi.
//
// Chạy:
//   node scripts/bu-phuong-xa-cu.mjs              → chỉ xem, không ghi gì
//   node scripts/bu-phuong-xa-cu.mjs --ghi-a      → ghi nhóm A
//   node scripts/bu-phuong-xa-cu.mjs --ghi <id,id…> → ghi những tin nhóm B đã duyệt
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";

const ROOT = path.resolve(import.meta.dirname, "..");
const jiti = createJiti(ROOT + "/kiem.mjs", { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { haiDongDiaChi, heCuaTin, ungVienPhuongCu } = await jiti.import(ROOT + "/src/lib/diaChiHaiHe.ts");
const { normalizeVi } = await jiti.import(ROOT + "/src/lib/filters.ts");

const env = Object.fromEntries(
  fs.readFileSync(ROOT + "/.env.local", "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL_DB = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY; // phải là khoá service_role mới ghi được
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const args = process.argv.slice(2);
const ghiA = args.includes("--ghi-a");
const ghiIds = (args[args.indexOf("--ghi") + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
// --dat "<id>=<Tên phường cũ>,…" — người duyệt chỉ đích danh, KHÔNG theo máy đoán.
// Tên phải nằm trong danh sách ứng viên của chính tin đó, sai là script báo và bỏ qua.
const datTay = (args[args.indexOf("--dat") + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  .map((s) => ({ id: s.slice(0, s.indexOf("=")).trim(), ten: s.slice(s.indexOf("=") + 1).trim() }));
const coGhi = ghiA || (args.includes("--ghi") && ghiIds.length > 0) || datTay.length > 0;

const rows = await (await fetch(
  `${URL_DB}/rest/v1/listings?select=id,title,description,ward,district,province,details&limit=2000`,
  { headers: H },
)).json();

// Tin còn thiếu: chưa có phường/xã cũ nào (nhập tay lẫn suy ra đều không tới cấp phường)
const thieu = rows.filter((r) => {
  if (!r.province) return false;
  const d = r.details?.diaChiCu;
  if (d && ((d.phuong ?? "").trim() || (d.quan ?? "").trim())) return false;
  const hai = haiDongDiaChi(heCuaTin(r.district), { tinh: r.province, quan: r.district ?? "", phuong: r.ward ?? "" });
  return !(hai.cu && hai.cu.split(",").length >= 3);
});

const A = [], B = [], C = [];
for (const r of thieu) {
  const uv = ungVienPhuongCu("moi", r.province, r.ward ?? "");
  if (!uv.length) { C.push({ r, ly: "bảng không có ứng viên nào" }); continue; }
  const tho = [r.title, r.description, r.details?.addressDetail].filter(Boolean).join(" | ");
  const chu = normalizeVi(tho);
  const tenMoi = normalizeVi(r.ward ?? "");
  const co = [], coNay = [], coDiaChi = [];
  for (const x of uv) {
    const ten = normalizeVi(x.phuong);
    // BẪY: tên phường cũ nằm sẵn trong TÊN MỚI ("Lăng Cô" ⊂ "Xã Chân Mây - Lăng Cô").
    // Tin nhắc tên mới là dính, nhưng đó không phải bằng chứng gì cả.
    if (tenMoi.includes(ten)) continue;
    for (let i = chu.indexOf(ten); i >= 0; i = chu.indexOf(ten, i + 1)) {
      if (!co.includes(x)) { co.push(x); x.bangChung = tho.slice(Math.max(0, i - 45), i + ten.length + 45).replace(/\s+/g, " "); }
      // CÂU CHUYỂN HỆ: tên cũ đứng ngay trước chữ "nay" — chính người đăng khai.
      if (/^[^|]{0,22}\bnay\b/.test(chu.slice(i + ten.length)) && !coNay.includes(x)) coNay.push(x);
      // ĐỊA CHỈ MINH THỊ: tên đứng ngay sau từ chỉ CẤP hoặc chỉ CHỖ ĐẶT TIN.
      // "phường Phú Thượng" · "Thị trấn La Hà" · "Vị trí: Lộc Vĩnh" → tin nằm ở đó.
      // Loại hẳn "đường Trần Hưng Đạo", "chợ Tây Lộc", "gần biển Mỹ An", "Kho Nhơn
      // Hội" — đó là tên đường, tên dự án hay mốc lân cận, KHÔNG phải nơi tin toạ lạc.
      if (/(phuong|xa|thi tran|vi tri:?|toa lac tai)\s+$/.test(chu.slice(Math.max(0, i - 14), i)) && !coDiaChi.includes(x)) coDiaChi.push(x);
    }
  }
  if (coNay.length === 1) A.push({ r, x: coNay[0], vi: "câu chuyển hệ" });
  else if (coDiaChi.length === 1) A.push({ r, x: coDiaChi[0], vi: "địa chỉ minh thị" });
  else if (co.length === 1) B.push({ r, x: co[0] });
  else C.push({ r, ly: co.length > 1 ? `tin nhắc ${co.length} phường cũ, không biết cái nào` : "tin không nhắc tên cũ" });
}

const dong = (o) => `${o.x.phuong}, ${o.x.quan}, ${o.x.tinh}`;
console.log(`Tin còn thiếu phường/xã cũ: ${thieu.length}`);
console.log(`\n═══ NHÓM A — tin tự nói ra, ghi được ngay: ${A.length} tin`);
A.forEach((o, i) => console.log(`  ${i + 1}. [${o.vi}] ${o.r.id}\n     ${o.r.ward}, ${o.r.province}  →  ${dong(o)}\n     bằng chứng: …${o.x.bangChung}…`));
console.log(`\n═══ NHÓM B — chỉ trùng tên rời, CẦN NGƯỜI DUYỆT: ${B.length} tin`);
B.forEach((o, i) => console.log(`  ${i + 1}. ${o.r.id}\n     ${o.r.ward}, ${o.r.province}  →  ${dong(o)}\n     bằng chứng: …${o.x.bangChung}…`));
console.log(`\n═══ NHÓM C — không có căn cứ, giữ 2 cấp: ${C.length} tin`);
C.forEach((o, i) => console.log(`  ${i + 1}. ${o.r.ward}, ${o.r.province} — ${o.ly}`));

if (!coGhi) { console.log("\n(chỉ xem — thêm --ghi-a hoặc --ghi <id,…> mới ghi vào Supabase)"); process.exit(0); }

const canGhi = ghiA ? A : [...B.filter((o) => ghiIds.includes(o.r.id))];
for (const d of datTay) {
  const r = rows.find((x) => x.id === d.id);
  if (!r) { console.log(`  ✘ không có tin ${d.id}`); continue; }
  const x = ungVienPhuongCu("moi", r.province, r.ward ?? "").find((u) => normalizeVi(u.phuong) === normalizeVi(d.ten));
  if (!x) { console.log(`  ✘ "${d.ten}" không nằm trong danh sách phường/xã cũ của ${r.ward} — bỏ qua`); continue; }
  canGhi.push({ r, x });
}
console.log(`\n→ Đang ghi ${canGhi.length} tin…`);
for (const o of canGhi) {
  // Gộp vào details cũ, KHÔNG thay cả cục: mã ảnh, nguồn tin, ghi chú nội bộ đều nằm đó.
  const details = { ...(o.r.details ?? {}), diaChiCu: { phuong: o.x.phuong, quan: o.x.quan, tinh: o.x.tinh } };
  const res = await fetch(`${URL_DB}/rest/v1/listings?id=eq.${o.r.id}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ details }),
  });
  console.log(`  ${res.ok ? "✔" : "✘ " + res.status} ${o.r.id} → ${dong(o)}`);
}
console.log("\nXong. Nhớ mở /api/lam-moi để xoá cache nếu muốn thấy ngay trên web.");
