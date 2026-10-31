// ============================================================================
// THỬ ĐỌC MỘT ĐỢT TIN ĐÚNG NHƯ NÚT "ĐĂNG" Ở ADMIN — chạy TRƯỚC khi chủ dự án đăng (chuẩn 29/10/2026)
//   node scripts/thu-doc-dot.mjs "D:/Coastal Land/SEO/DA-DUYET/29102026"
// Chỉ ĐỌC. Dùng chính bộ đọc của web (src/lib/csvTin.ts) → in mỗi tin: loại hình + ô đặc điểm loại con, pháp lý,
// giá hiện ra (đúng số khách ghi, không làm tròn), lỗi + cảnh báo vàng. Đạt = 0 lỗi, 0 cảnh báo, tin căn hộ có
// loai_can_ho, tin đất có loai_dat. Gói tin không nằm trong file: web tự gán khuôn tin thành viên mới khi đăng.
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";

const ROOT = path.resolve(import.meta.dirname, "..").split(path.sep).join("/");
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "/src" }, jsx: true });
const { docXlsx } = await jiti.import(ROOT + "/src/lib/docXlsx.ts");
const { docTinTuBang } = await jiti.import(ROOT + "/src/lib/csvTin.ts");

const thuMuc = process.argv[2];
if (!thuMuc) { console.error('Cách dùng: node scripts/thu-doc-dot.mjs "<thư mục đợt>"'); process.exit(1); }
const tep = fs.readdirSync(thuMuc).find((f) => /^Bang-.*\.xlsx$/i.test(f));
if (!tep) { console.error("Không thấy Bang-*.xlsx trong thư mục"); process.exit(1); }
const b = fs.readFileSync(path.join(thuMuc, tep));
const kq = docTinTuBang(await docXlsx(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)));

const so = (n, le) => n.toLocaleString("vi-VN", { maximumFractionDigits: le });
const giaChu = (v, thue) => v == null ? "Thỏa thuận" : thue ? `${so(v / 1e6, 2)} triệu/tháng` : v >= 1e9 ? `${so(v / 1e9, 3)} tỷ` : `${so(v / 1e6, 2)} triệu`;
let loi = 0, vang = 0, thieu = 0;
for (const r of kq.rows) {
  const p = r.payload ?? {}, d = p.details ?? {}, sp = d.specs ?? {};
  const ma = d.maAnh ?? r.maAnh ?? "?";
  const loaiCon = sp.loaiCanho ?? sp.landType ?? sp.access ?? "";
  const canCon = /căn hộ/i.test(p.type ?? "") ? !sp.loaiCanho : /^đất/i.test(p.type ?? "") ? !sp.landType : false;
  if (canCon) thieu++;
  loi += (r.loi ?? []).length; vang += (r.canhBao ?? []).length;
  console.log(`${ma} · ${p.type}${loaiCon ? ` (${loaiCon})` : ""} · pháp lý: ${d.legal ?? "—"} · giá: ${giaChu(p.price_vnd, p.purpose === "thue")}` +
    (canCon ? " · ⚠ THIẾU ô loại con" : "") +
    ((r.loi ?? []).length ? ` · ✗ LỖI: ${r.loi.join("; ")}` : "") +
    ((r.canhBao ?? []).length ? ` · ⚠ VÀNG: ${r.canhBao.join("; ")}` : ""));
}
console.log(`\n${kq.rows.length} tin · ${loi} lỗi · ${vang} cảnh báo vàng · ${thieu} tin thiếu ô loại con` + (kq.loiChung?.length ? ` · lỗi chung: ${kq.loiChung.join("; ")}` : ""));
console.log(loi || vang || thieu ? "→ CHƯA ĐẠT: sửa trong file rồi chạy lại." : "→ ĐẠT: báo chủ dự án đăng.");
