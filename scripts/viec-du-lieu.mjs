// ════════════════════════════════════════════════════════════════════════════
// VIỆC DỮ LIỆU TUẦN CHO COWORK (kế hoạch tự động hoá D1, 15/10/2026)
//
//   node scripts/viec-du-lieu.mjs
//
// Quét kho tin + dự án, xuất:
//   docs/viec-du-lieu-<ngày>.md        — danh sách việc cụ thể (tin chưa đạt chuẩn, tin trùng,
//                                         số ghi nhiều tên, tin lệch tài khoản, dự án thiếu hồ sơ)
//   docs/du-an-can-nap-<ngày>.csv      — đúng mẫu mau-nhap-du-an.csv, điền sẵn tên + tỉnh + phường
// Chỉ ĐỌC (không sửa dữ liệu). Chuẩn đối chiếu: docs/CHUAN-TIN-DANG-SEO.md.
// Không in số điện thoại đầy đủ (chỉ 4 số đầu).
// ════════════════════════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";

const GOC = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  fs.readFileSync(path.join(GOC, ".env.local"), "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const K = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const doc = async (q) => (await fetch(`${U}/rest/v1/${q}`, { headers: { apikey: K, Authorization: `Bearer ${K}` } })).json();

const ngay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const [tin, duAn, ho] = await Promise.all([
  doc("listings?select=id,title,description,images,type,purpose,price_vnd,area_m2,ward,province,owner_id,status,tier_expires_at,details&status=in.(approved,expired)&limit=2000"),
  doc("projects?select=slug,name&limit=2000"),
  doc("profiles?select=id,phone&limit=10000"),
]);

const sdt = (s) => (s || "").split(/[,;/|]| - /)[0].replace(/\D/g, "").replace(/^84/, "0").slice(0, 10);
const che = (s) => (s ? `${s.slice(0, 4)}***` : "—");
const conHan = (x) => x.status === "approved" && (!x.tier_expires_at || new Date(x.tier_expires_at) > new Date());
const soAnh = (x) => (x.images || []).filter((s) => !/youtu|\.mp4|\.mov|\.webm/i.test(s)).length;
const link = (x) => `https://coastalland.vn/bat-dong-san/${x.id}`;
const md = [];
md.push(`# VIỆC DỮ LIỆU TUẦN — ${ngay}`, "", "Đọc trước: docs/COWORK-YEU-CAU-TONG-HOP.md (mọi yêu cầu lọc, sửa, nạp dữ liệu)", "");

// 1) Tin còn hạn chưa đạt chuẩn
const chuaDat = tin.filter(conHan).map((x) => {
  const thieu = [];
  if (soAnh(x) < 3) thieu.push(`${soAnh(x)} ảnh (cần ≥ 3)`);
  if ((x.description || "").trim().length < 100) thieu.push("mô tả < 100 ký tự");
  if (!/đường|kiệt|hẻm|ngõ/i.test(x.details?.addressDetail || "")) thieu.push("thiếu tên đường");
  if (!x.details?.direction) thieu.push("thiếu hướng");
  if (!x.details?.legal && x.purpose !== "thue") thieu.push("thiếu pháp lý");
  return { x, thieu, chan: soAnh(x) < 3 || (x.description || "").trim().length < 100 };
}).filter((r) => r.thieu.length);
md.push(`## 1. Tin còn hạn cần bổ sung (${chuaDat.filter((r) => r.chan).length} tin đang bị noindex · ${chuaDat.length} tin thiếu trường)`, "");
md.push("| Tin | Thiếu | Đang noindex |", "|---|---|---|");
for (const r of chuaDat.sort((a, b) => Number(b.chan) - Number(a.chan))) md.push(`| [${r.x.title.slice(0, 50)}](${link(r.x)}) | ${r.thieu.join(" · ")} | ${r.chan ? "có" : "—"} |`);

// 2) Cùng một BĐS đăng nhiều tin
const nhom = {};
for (const x of tin) { const s = sdt(x.details?.contact?.phone); if (!s) continue; const k = [s, x.type, x.price_vnd, x.area_m2, x.ward].join("|"); (nhom[k] ??= []).push(x); }
const trung = Object.values(nhom).filter((v) => v.length > 1);
md.push("", `## 2. Cùng một BĐS đăng nhiều tin (${trung.length} nhóm) — giữ một, gỡ phần còn lại`, "");
for (const v of trung) md.push(`- ${v.map((x) => `[${x.title.slice(0, 40)}](${link(x)}) (${conHan(x) ? "còn hạn" : "hết hạn"})`).join("  ·  ")}`);

// 3) Một số điện thoại ghi nhiều tên
const theoSo = {};
for (const x of tin) { const s = sdt(x.details?.contact?.phone); if (!s) continue; (theoSo[s] ??= new Set()).add((x.details?.contact?.name || "").trim()); }
const nhieuTen = Object.entries(theoSo).filter(([, t]) => t.size > 1);
md.push("", `## 3. Một số điện thoại đang ghi nhiều tên (${nhieuTen.length} số) — thống nhất một tên`, "");
for (const [s, t] of nhieuTen) md.push(`- ${che(s)}: ${[...t].join(" / ")}`);

// 4) Tin có số liên hệ khác số của tài khoản giữ tin (tin đăng hộ chưa đồng bộ)
const soTk = new Map((Array.isArray(ho) ? ho : []).map((p) => [p.id, sdt(p.phone)]));
const lech = tin.filter((x) => soTk.has(x.owner_id) && soTk.get(x.owner_id) && sdt(x.details?.contact?.phone) && soTk.get(x.owner_id) !== sdt(x.details?.contact?.phone));
md.push("", `## 4. Tin đăng hộ chưa về đúng tài khoản (${lech.length} tin) — chuyển về tài khoản của số liên hệ`, "");
for (const x of lech) md.push(`- [${x.title.slice(0, 50)}](${link(x)}) · số liên hệ ${che(sdt(x.details?.contact?.phone))} · tài khoản đang giữ số ${che(soTk.get(x.owner_id))}`);

// 5) Dự án được tin gắn nhưng chưa có hồ sơ
const coHoSo = new Set(duAn.map((p) => p.slug));
const canNap = {};
for (const x of tin) {
  const slug = x.details?.project; const ten = (x.details?.projectName || "").trim();
  if (!slug || coHoSo.has(slug)) continue;
  (canNap[slug] ??= { ten: ten || slug, tinh: x.province || "", phuong: x.ward || "", n: 0 }).n++;
}
const dsNap = Object.values(canNap).sort((a, b) => b.n - a.n);
md.push("", `## 5. Dự án có tin nhưng chưa có hồ sơ (${dsNap.length}) — nạp bằng docs/du-an-can-nap-${ngay}.csv`, "");
for (const d of dsNap) md.push(`- ${d.ten} · ${d.phuong ? d.phuong + ", " : ""}${d.tinh} · ${d.n} tin`);
const COT = "ten_du_an,loai_hinh,trang_thai,chu_dau_tu,don_vi_phat_trien,tinh,phuong_xa,dia_chi_chi_tiet,quy_mo,san_pham,khoi_cong,ban_giao,phap_ly,tien_ich,tong_quan,gia_tu,anh,nguon,ngay_cap_nhat";
const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
fs.writeFileSync(path.join(GOC, `docs/du-an-can-nap-${ngay}.csv`), "﻿" + [COT, ...dsNap.map((d) => [q(d.ten), "", "", "", "", q(d.tinh), q(d.phuong), "", "", "", "", "", "", "", "", "", "", "", ""].join(","))].join("\n") + "\n");

// 6) Lịch sử giá
md.push("", "## 6. Lịch sử giá", "", "Admin → Chỉ số giá → **Tải danh sách còn thiếu** → nhập theo YEU-CAU-COWORK-LICH-SU-GIA.md ở thư mục gốc (theo quý, đủ 5 quý liền mới hiện).");

// 7) NHÓM SẮP MỞ TRANG GOOGLE (16/10/2026): trang pSEO chỉ được index khi có ≥ 3 tin ĐẠT CHUẨN còn hạn
// (≥ 3 ảnh, mô tả ≥ 100 ký tự — src/lib/pseo.ts). Liệt kê nhóm đang có 1–2 tin đạt chuẩn → Cowork biết
// đúng cần nạp thêm tin gì, ở đâu. Danh mục đọc thẳng từ src/lib/categories.ts (một nguồn với web).
const nguonDm = fs.readFileSync(path.join(GOC, "src/lib/categories.ts"), "utf8");
const docDm = (ten) => {
  const doan = nguonDm.split(`export const ${ten}`)[1]?.split("];")[0] ?? "";
  return [...doan.matchAll(/h1: "([^"]+)"(?:, tuKhoa: "([^"]+)")?[\s\S]*?types: \[([^\]]*)\]/g)]
    .map((m) => ({ ten: m[2] || m[1], types: [...m[3].matchAll(/"([^"]+)"/g)].map((t) => t[1]) }));
};
const DM = { ban: docDm("saleCategories"), thue: docDm("rentCategories") };
DM.ban.push({ ten: "Bán nhà", types: ["Nhà riêng", "Nhà mặt phố", "Nhà biệt thự / Liền kề", "Shophouse / Nhà phố thương mại"] });
DM.thue.push({ ten: "Cho thuê nhà", types: ["Nhà riêng", "Nhà mặt phố", "Nhà phố thương mại", "Biệt thự / Liền kề"] });
const datChuan = (x) => conHan(x) && soAnh(x) >= 3 && (x.description || "").trim().length >= 100;
const demNhom = {};
for (const x of tin.filter(datChuan)) {
  const muc = x.purpose === "thue" ? "thue" : "ban";
  for (const c of DM[muc].filter((c) => c.types.includes(x.type))) {
    const tinhK = `${c.ten} ${x.province}`;
    (demNhom[tinhK] ??= { ten: tinhK, n: 0 }).n++;
    if (x.ward) { const k = `${c.ten} ${x.ward}, ${x.province}`; (demNhom[k] ??= { ten: k, n: 0 }).n++; }
  }
}
const sapMo = Object.values(demNhom).filter((g) => g.n > 0 && g.n < 3).sort((a, b) => b.n - a.n || a.ten.localeCompare(b.ten, "vi"));
md.push("", `## 7. Nhóm sắp có trang trên Google — còn thiếu tin đạt chuẩn (${sapMo.length} nhóm)`, "",
  "Mỗi nhóm cần **≥ 3 tin đạt chuẩn còn hạn** (≥ 3 ảnh thật, mô tả ≥ 100 ký tự) mới có trang riêng trên Google. Ưu tiên nhóm thiếu 1 tin.", "",
  "| Trang sẽ mở | Đang có | Cần thêm |", "|---|---|---|");
for (const g of sapMo) md.push(`| ${g.ten} | ${g.n} | ${3 - g.n} tin |`);

fs.writeFileSync(path.join(GOC, `docs/viec-du-lieu-${ngay}.md`), md.join("\n") + "\n");
console.log(`→ docs/viec-du-lieu-${ngay}.md · docs/du-an-can-nap-${ngay}.csv`);
console.log(`tin cần bổ sung ${chuaDat.length} · nhóm trùng ${trung.length} · số nhiều tên ${nhieuTen.length} · tin lệch tài khoản ${lech.length} · dự án cần nạp ${dsNap.length} · nhóm sắp mở trang ${sapMo.length}`);
