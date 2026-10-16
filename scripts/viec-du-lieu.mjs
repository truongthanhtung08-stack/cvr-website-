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
// NƠI LƯU DUY NHẤT cho mọi việc của Cowork (chủ dự án 16/10/2026): D:/Coastal Land/SEO — RA = máy xuất cho Cowork.
// Máy không có ổ D (máy khác) → ghi tạm vào docs/.
const RA = fs.existsSync("D:/Coastal Land/SEO") ? "D:/Coastal Land/SEO/RA" : path.join(GOC, "docs");
fs.mkdirSync(RA, { recursive: true });
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

// 2) Cùng một BĐS đăng nhiều tin
const nhom = {};
for (const x of tin) { const s = sdt(x.details?.contact?.phone); if (!s) continue; const k = [s, x.type, x.price_vnd, x.area_m2, x.ward].join("|"); (nhom[k] ??= []).push(x); }
const trung = Object.values(nhom).filter((v) => v.length > 1);

// 3) Một số điện thoại ghi nhiều tên
const theoSo = {};
for (const x of tin) { const s = sdt(x.details?.contact?.phone); if (!s) continue; (theoSo[s] ??= new Set()).add((x.details?.contact?.name || "").trim()); }
const nhieuTen = Object.entries(theoSo).filter(([, t]) => t.size > 1);

// 4) Tin có số liên hệ khác số của tài khoản giữ tin (tin đăng hộ chưa đồng bộ)
const soTk = new Map((Array.isArray(ho) ? ho : []).map((p) => [p.id, sdt(p.phone)]));
const lech = tin.filter((x) => soTk.has(x.owner_id) && soTk.get(x.owner_id) && sdt(x.details?.contact?.phone) && soTk.get(x.owner_id) !== sdt(x.details?.contact?.phone));

// 5) Dự án được tin gắn nhưng chưa có hồ sơ
const coHoSo = new Set(duAn.map((p) => p.slug));
const canNap = {};
for (const x of tin) {
  const slug = x.details?.project; const ten = (x.details?.projectName || "").trim();
  if (!slug || coHoSo.has(slug)) continue;
  (canNap[slug] ??= { ten: ten || slug, tinh: x.province || "", phuong: x.ward || "", n: 0 }).n++;
}
const dsNap = Object.values(canNap).sort((a, b) => b.n - a.n);
const COT = "ten_du_an,loai_hinh,trang_thai,chu_dau_tu,don_vi_phat_trien,tinh,phuong_xa,dia_chi_chi_tiet,quy_mo,san_pham,khoi_cong,ban_giao,phap_ly,tien_ich,tong_quan,gia_tu,anh,nguon,ngay_cap_nhat";
const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
fs.writeFileSync(path.join(RA, "du-an-can-nap.csv"), "﻿" + [COT, ...dsNap.map((d) => [q(d.ten), "", "", "", "", q(d.tinh), q(d.phuong), "", "", "", "", "", "", "", "", "", "", "", ""].join(","))].join("\n") + "\n");


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

// ── VIỆC COWORK — DANH SÁCH MỤC ĐÁNH SỐ (chủ dự án 16/10/2026: "có rất nhiều mục để lọc data, prompt hôm nay làm mục nào") ──
// Máy chạy 6:30 sáng thứ Hai – thứ Bảy → ghi đè SEO/RA/VIEC.md. Mỗi mục có danh sách việc cụ thể + chỗ giao.
// Chủ dự án nhắn Cowork "Làm mục 2, 6" → làm đúng các mục đó; "Làm việc hôm nay" → làm các mục mặc định của ngày.
const BS = String.fromCharCode(92);
const p = (...x) => x.join(BS);
const now = new Date(Date.now() + 7 * 3600e3);
const thu = now.getUTCDay(); // 0 = Chủ nhật
const dd = ngay.slice(8, 10) + ngay.slice(5, 7) + ngay.slice(0, 4);
const TEN_THU = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][thu];
const SEO = p("D:", "Coastal Land", "SEO");
const CV = p(SEO, "CONG-VIEC-3-BEN.md");
const NOI_TIN = "`" + p("D:", "Coastal Land", "Đăng tin", "TIN HANG NGAY chuẩn", dd) + BS + "`";
const NOI_KHAC = "`" + p(SEO, "VAO", dd) + BS + "`";
const sua = (ds, cot) => ds.map((r) => `- [${r.x.title.slice(0, 60)}](${link(r.x)}) — ${cot(r)}`);
const GOP = "biên tập lại tiêu đề/mô tả chuẩn SEO như mục 1, đưa vào file tin, giữ đúng link `nguon` để web gộp vào tin cũ";
const dauQuy = [1, 4, 7, 10].includes(now.getUTCMonth() + 1) && now.getUTCDate() <= 7;

// Mỗi mục: [tên, chỗ giao, các dòng việc]
const MUC = [
  ["Tin mới", NOI_TIN, [
    `Lọc + biên tập theo \`${p(SEO, "YEU-CAU-COWORK-DANG-TIN-HANG-LOAT.md")}\`:`,
    "- **Tiêu đề** 45–70 ký tự: Bán/Cho thuê + loại hình + điểm nổi bật + tên đường + phường, tỉnh.",
    "- **Mô tả** ≥ 300 ký tự, đủ 5 phần: tổng quan · vị trí · thông số · pháp lý · điều kiện giao dịch.",
    "- Mọi thông tin trong tin gốc (giá, diện tích, mặt tiền, đường vào, hướng, pháp lý, phòng ngủ, tên dự án…) điền vào **đúng cột**.",
    "- ≥ 3 ảnh thật, ảnh đầu đẹp nhất. Tự kiểm mục 9 của tệp yêu cầu trước khi giao.",
    ...(sapMo.some((g) => g.n === 2) ? ["Ưu tiên nhóm sau — thêm 1 tin là có trang Google:", ...sapMo.filter((g) => g.n === 2).slice(0, 15).map((g) => `- ${g.ten}`)] : []),
  ]],
  ["Sửa tin đang không lên Google (thiếu ảnh / mô tả ngắn)", NOI_TIN, (() => {
    const ds = chuaDat.filter((r) => r.chan);
    return ds.length ? [`Tìm lại tin gốc, lấy đủ ảnh + mô tả, ${GOP}:`, ...sua(ds, (r) => r.thieu.filter((t) => /ảnh|mô tả/.test(t)).join(", "))] : ["Không có việc."];
  })()],
  ["Bổ sung trường còn thiếu (tên đường / hướng / pháp lý)", NOI_TIN, (() => {
    const ds = chuaDat.filter((r) => !r.chan);
    return ds.length ? [`Lấy lại từ tin gốc, ${GOP}. Làm 20 tin mỗi lần (${ds.length} tin còn lại):`, ...sua(ds.slice(0, 20), (r) => r.thieu.join(", "))] : ["Không có việc."];
  })()],
  ["Tin trùng · một số nhiều tên · tin đăng hộ", "`bao-cao.txt` (chủ dự án sửa trong admin)", [
    ...(trung.length ? ["Cùng một BĐS đăng nhiều tin — ghi tin nào giữ, tin nào gỡ:", ...trung.map((g) => `- ${g.map((x) => `[${x.title.slice(0, 40)}](${link(x)})`).join(" · ")}`)] : []),
    ...(nhieuTen.length ? ["Một số điện thoại ghi nhiều tên — ghi tên đúng:", ...nhieuTen.map(([so, t]) => `- ${che(so)}: ${[...t].join(" / ")}`)] : []),
    ...(lech.length ? ["Tin đăng hộ — ghi tin nào thuộc số nào:", ...lech.map((x) => `- [${x.title.slice(0, 50)}](${link(x)}) · số liên hệ ${che(sdt(x.details?.contact?.phone))}`)] : []),
    ...(!trung.length && !nhieuTen.length && !lech.length ? ["Không có việc."] : []),
  ]],
  ["Tìm tin cho nhóm còn thiếu (có trang Google khi đủ 3 tin)", NOI_TIN, sapMo.length
    ? ["Tìm tin thật cho các nhóm sau:", ...sapMo.slice(0, 40).map((g) => `- ${g.ten} — cần thêm ${3 - g.n} tin`)] : ["Không có việc."]],
  ["Hồ sơ dự án", `${NOI_KHAC} (tệp \`du-an-${dd}.csv\`)`, dsNap.length
    ? [`Điền \`${p(SEO, "RA", "du-an-can-nap.csv")}\` theo mục 4 của \`${CV}\`: đủ cột bắt buộc, **tổng quan tự viết lại 3–6 câu chuẩn SEO** (tên dự án · vị trí · chủ đầu tư · loại sản phẩm), có nguồn + ngày. Làm 10 dự án mỗi lần (${dsNap.length} dự án còn thiếu):`, ...dsNap.slice(0, 10).map((d) => `- ${d.ten} · ${d.phuong ? d.phuong + ", " : ""}${d.tinh}`)]
    : ["Nạp dự án mới toàn quốc theo mục 4 của `CONG-VIEC-3-BEN.md`."]],
  ["Bảng giá đất Nhà nước", `${NOI_KHAC} (tệp \`gia-dat-<tỉnh>.csv\`)`, ["Theo mục 5 của `CONG-VIEC-3-BEN.md`, từ văn bản gốc quyết định UBND tỉnh. Thứ tự: Đà Nẵng → Huế → Khánh Hòa → Gia Lai → Lâm Đồng."]],
  ["Lịch sử giá", "nộp ở coastalland.vn/nop-so-lieu", [`Theo \`${p(SEO, "YEU-CAU-COWORK-LICH-SU-GIA.md")}\` (theo quý, đủ 5 quý liền).`]],
  ["Thư viện pháp luật", `${NOI_KHAC} (tệp \`thu-vien-phap-luat-${dd}.csv\`)`, ["Theo mục 6 của `CONG-VIEC-3-BEN.md` — văn bản thật, link nguồn chính thức, 20 văn bản mỗi lần."]],
  ["Hồ sơ công ty", `${NOI_KHAC} (tệp \`ho-so-cong-ty-${dd}.csv\`)`, ["Theo mục 6 của `CONG-VIEC-3-BEN.md` — các công ty, sàn đang đăng tin trên coastalland.vn trước."]],
  ["Tiện ích lân cận (trường, bệnh viện, khu công nghiệp, chợ, biển, sân bay)", `${NOI_KHAC} (tệp \`tien-ich-<tỉnh>.csv\`)`, ["Theo mục 8 của `CONG-VIEC-3-BEN.md` — một tỉnh mỗi lần: Đà Nẵng → Huế → Khánh Hòa."]],
  ["Bài viết", `${NOI_KHAC} (tệp \`bai-viet-${dd}.docx\`)`, ["Theo mục 6 và 7 của `CONG-VIEC-3-BEN.md` — chỉ khi chủ dự án giao đề tài."]],
];
// Mục mặc định theo thứ (số mục tính từ 1)
const MAC_DINH = { 1: [1, 2], 2: [1, 4], 3: [1, 6], 4: [1, 5], 5: [1, 3, 7], 6: [1] }[thu] ?? [];
if (dauQuy && MAC_DINH.length) MAC_DINH.push(8);

const v = [`# VIỆC COWORK — cập nhật ${TEN_THU}, ${dd.slice(0, 2)}/${dd.slice(2, 4)}/${dd.slice(4)}`, "",
  "**Mọi mục: không chỉ lọc.** Đọc hiểu nguồn → lấy ĐỦ thông tin vào đúng cột → **biên tập chuẩn SEO** → **tự kiểm** → mới giao. Chủ dự án chỉ duyệt. Không bịa: nguồn không có thì để trống.", "",
  "- Nhắn **\"Làm mục 2, 6\"** → làm đúng các mục đó.",
  `- Nhắn **"Làm việc hôm nay"** → làm ${MAC_DINH.length ? "mục " + MAC_DINH.join(", ") : "— Chủ nhật nghỉ"}.`,
  "- Giao xong ghi `bao-cao.txt` (đã giao gì, bỏ gì, vì sao) vào đúng thư mục đã giao.", "",
  "| Mục | Việc | Giao vào |", "|---|---|---|",
  ...MUC.map(([ten, noi], i) => `| ${i + 1} | ${ten} | ${noi} |`), ""];
// MỤC 0 — BƯỚC 1 CỦA QUY TRÌNH: máy đối chiếu hiện trạng web (SEO · pSEO) — đọc kết quả rà web mới nhất
// (scripts/seo-kiem-tra.mjs, lịch chạy trước lệnh này). Lỗi kỹ thuật là việc của Claude; thiếu dữ liệu là việc Cowork (mục 1–12).
const raWeb = fs.readdirSync(path.join(GOC, "docs")).filter((f) => /^seo-kiem-tra-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().pop();
if (raWeb) {
  const r = JSON.parse(fs.readFileSync(path.join(GOC, "docs", raWeb), "utf8"));
  v.push(`## Mục 0. Hiện trạng web (máy đối chiếu ${r.ngay}) — việc của Claude, Cowork không làm`,
    `${r.tong} trang trên Google (sitemap) · ${r.coLoi} trang có lỗi · trang trung bình ${r.kbTB} KB.`,
    ...(r.coLoi ? Object.entries(r.nhom).map(([k, n]) => `- ${k.replace(/ N(KB)?$/, "")}: ${n} trang`) : ["- Không có lỗi."]),
    `- Nhóm sắp có trang Google (thiếu 1–2 tin): ${sapMo.length} — Cowork làm ở mục 1, 5.`,
    `- Tin không lên Google vì thiếu ảnh / mô tả: ${chuaDat.filter((r2) => r2.chan).length} — Cowork làm ở mục 2.`, "");
}
MUC.forEach(([ten, noi, dong], i) => v.push(`## Mục ${i + 1}. ${ten}`, `Giao vào: ${noi}`, "", ...dong, ""));
fs.writeFileSync(path.join(RA, "VIEC.md"), v.join("\n"));
console.log(`→ ${RA}/VIEC.md (${TEN_THU}: mục ${MAC_DINH.join(", ")}) · du-an-can-nap.csv`);
console.log(`tin cần bổ sung ${chuaDat.length} · nhóm trùng ${trung.length} · số nhiều tên ${nhieuTen.length} · tin lệch tài khoản ${lech.length} · dự án cần nạp ${dsNap.length} · nhóm sắp mở trang ${sapMo.length}`);
