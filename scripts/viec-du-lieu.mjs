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
  doc("listings?select=id,title,description,images,type,purpose,price_vnd,area_m2,ward,province,owner_id,status,tier_expires_at,details,published_at&status=in.(approved,expired)&limit=2000"),
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
// Tin mới đạt chuẩn 2 ngày qua — nguồn bài mạng xã hội (kế hoạch D:/Coastal Land/SEO/Plan MXH/KE-HOACH-MXH.md, 16/10/2026)
const tinMxh = tin.filter((x) => datChuan(x) && x.published_at && Date.now() - new Date(x.published_at) < 2 * 864e5)
  .sort((a, b) => new Date(b.published_at) - new Date(a.published_at)).slice(0, 10);

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
const NOI_TIN = "`" + p("D:", "Coastal Land", "Đăng tin", "COWORK", dd) + BS + "`"; // bước 2 — chủ dự án duyệt xong chuyển sang TIN HANG NGAY chuẩn
const NOI_KHAC = "`" + p(SEO, "VAO", dd) + BS + "`";
const sua = (ds, cot) => ds.map((r) => `- [${r.x.title.slice(0, 60)}](${link(r.x)}) — ${cot(r)}`);
const GOP = "biên tập lại tiêu đề/mô tả chuẩn SEO như mục 1, đưa vào file tin, giữ đúng link `nguon` để web gộp vào tin cũ";
const dauQuy = [1, 4, 7, 10].includes(now.getUTCMonth() + 1) && now.getUTCDate() <= 7;

// ── VIỆC HÔM NAY — 3 BÊN, THEO THỨ TỰ ƯU TIÊN (chủ dự án 16/10/2026: "3 bên Cowork, tôi và bạn bắt đầu
// từ công việc theo thứ tự ưu tiên hằng ngày — lọc tin + lọc dữ liệu cho SEO pSEO và dữ liệu khác cần thiết";
// "mục đích chính là SEO, qua đó cập nhật thông tin và dữ liệu hằng ngày").
// Mục Cowork xếp theo giá trị SEO: tin đưa nhóm lên Google trước, dữ liệu nền sau. "Làm việc hôm nay" =
// làm từ mục 1 xuống, hết giờ thì dừng; "Làm mục 2, 6" = chỉ các mục đó.
const KE_HOACH = "D:/Coastal Land/SEO/Plan SEO - pSEO/KE-HOACH-SEO.md";
const MUC = [
  ["Tìm tin cho nhóm sắp có trang Google", NOI_TIN, sapMo.length, sapMo.length
    ? ["Ưu tiên trước: nhóm ở mục 3 #2 của kế hoạch SEO (đã có lượt hiển thị, gần trang 2 Google — condotel, khu nghỉ dưỡng / trang trại Đà Nẵng, căn hộ chung cư Huế).",
      "Sau đó các nhóm còn thiếu tin (đủ 3 tin đạt chuẩn là có trang Google):", ...sapMo.slice(0, 40).map((g) => `- ${g.ten} — cần thêm ${3 - g.n} tin`)]
    : ["Không có việc."]],
  ["Tin mới", NOI_TIN, null, [
    "**Khu vực: toàn quốc — có cả Hà Nội (mã `hn`) và TP. Hồ Chí Minh (mã `hcm`)** (chủ dự án 17/10/2026). Tỉnh, phường ghi hệ mới theo `D:\\Coastal Land\\SEO\\DANH-SACH-PHUONG-XA-TOAN-QUOC.txt`.",
    `Lọc + biên tập theo \`${p(SEO, "YEU-CAU-COWORK-DANG-TIN-HANG-LOAT.md")}\`:`,
    "- **Tiêu đề** 45–70 ký tự: Bán/Cho thuê + loại hình + điểm nổi bật + tên đường + phường, tỉnh.",
    "- **Mô tả** ≥ 300 ký tự, đủ 5 phần: tổng quan · vị trí · thông số · pháp lý · điều kiện giao dịch.",
    "- Mọi thông tin trong tin gốc (giá, diện tích, mặt tiền, đường vào, hướng, pháp lý, phòng ngủ, tên dự án…) điền vào **đúng cột**.",
    "- ≥ 3 ảnh thật, ảnh đầu đẹp nhất. Tự kiểm mục 9 của tệp yêu cầu trước khi giao.",
  ]],
  ["Sửa tin đang không lên Google (thiếu ảnh / mô tả ngắn)", NOI_TIN, chuaDat.filter((r) => r.chan).length, (() => {
    const ds = chuaDat.filter((r) => r.chan);
    return ds.length ? [`Tìm lại tin gốc, lấy đủ ảnh + mô tả, ${GOP}:`, ...sua(ds, (r) => r.thieu.filter((t) => /ảnh|mô tả/.test(t)).join(", "))] : ["Không có việc."];
  })()],
  // Mạng xã hội — chung quy trình 4 bước: máy chọn tin → Cowork soạn bài → chủ dự án duyệt nguyên văn → chủ dự án tự đăng.
  ["Bài mạng xã hội (Fanpage · OA · nhóm)", `${NOI_KHAC.slice(0, -1)}mxh${BS}\` (tệp \`bai-mxh-${dd}.docx\` + \`anh${BS}\`)`, tinMxh.length, tinMxh.length
    ? [`Soạn bài theo mục 4–5 của \`${p(SEO, "Plan MXH", "KE-HOACH-MXH.md")}\`: mỗi bài ghi rõ kênh, chữ, ảnh (lấy từ tin), link đúng như dưới.`,
      ...tinMxh.map((x) => `- ${x.title.slice(0, 60)} — Fanpage: ${link(x)}?utm_source=facebook&utm_medium=fanpage · OA: ${link(x)}?utm_source=zalo&utm_medium=oa · nhóm: ${link(x)}?utm_source=zalo&utm_medium=nhom`)]
    : ["Không có tin mới đạt chuẩn trong 2 ngày qua — soạn 1 bài gom tin nổi bật theo khu vực."]],
  ["Hồ sơ dự án", `${NOI_KHAC} (tệp \`du-an-${dd}.csv\`)`, dsNap.length, dsNap.length
    ? [`Điền \`${p(SEO, "RA", "du-an-can-nap.csv")}\` theo mục 4 của \`${CV}\`: đủ cột bắt buộc, **tổng quan tự viết lại 3–6 câu chuẩn SEO** (tên dự án · vị trí · chủ đầu tư · loại sản phẩm), có nguồn + ngày. Ưu tiên dự án đã có người tìm (Alacarte, Altara, Fusion Suites, Harmony). Làm 10 dự án mỗi lần:`, ...dsNap.slice(0, 10).map((d) => `- ${d.ten} · ${d.phuong ? d.phuong + ", " : ""}${d.tinh}`)]
    : ["Nạp dự án mới toàn quốc theo mục 4 của `CONG-VIEC-3-BEN.md`."]],
  ["Bổ sung trường còn thiếu (tên đường / hướng / pháp lý)", NOI_TIN, chuaDat.filter((r) => !r.chan).length, (() => {
    const ds = chuaDat.filter((r) => !r.chan);
    return ds.length ? [`Lấy lại từ tin gốc, ${GOP}. Làm 20 tin mỗi lần:`, ...sua(ds.slice(0, 20), (r) => r.thieu.join(", "))] : ["Không có việc."];
  })()],
  ["Bảng giá đất Nhà nước", `${NOI_KHAC} (tệp \`gia-dat-<tỉnh>.csv\`)`, null, ["Theo mục 5 của `CONG-VIEC-3-BEN.md`, từ văn bản gốc quyết định UBND tỉnh. Thứ tự: Đà Nẵng → Huế → Khánh Hòa → Gia Lai → Lâm Đồng."]],
  ["Tin trùng · một số nhiều tên · tin đăng hộ", "`bao-cao.txt` (chủ dự án sửa trong admin)", trung.length + nhieuTen.length + lech.length, [
    ...(trung.length ? ["Cùng một BĐS đăng nhiều tin — ghi tin nào giữ, tin nào gỡ:", ...trung.map((g) => `- ${g.map((x) => `[${x.title.slice(0, 40)}](${link(x)})`).join(" · ")}`)] : []),
    ...(nhieuTen.length ? ["Một số điện thoại ghi nhiều tên — ghi tên đúng:", ...nhieuTen.map(([so, t]) => `- ${che(so)}: ${[...t].join(" / ")}`)] : []),
    ...(lech.length ? ["Tin đăng hộ — ghi tin nào thuộc số nào:", ...lech.map((x) => `- [${x.title.slice(0, 50)}](${link(x)}) · số liên hệ ${che(sdt(x.details?.contact?.phone))}`)] : []),
    ...(!trung.length && !nhieuTen.length && !lech.length ? ["Không có việc."] : []),
  ]],
  ["Lịch sử giá" + (dauQuy ? " — ĐẦU QUÝ, làm ngay" : " (tuần đầu mỗi quý)"), "nộp ở coastalland.vn/nop-so-lieu", null, [`Theo \`${p(SEO, "YEU-CAU-COWORK-LICH-SU-GIA.md")}\` (theo quý, đủ 5 quý liền).`]],
  ["Tiện ích lân cận (trường, bệnh viện, khu công nghiệp, chợ, biển, sân bay)", `${NOI_KHAC} (tệp \`tien-ich-<tỉnh>.csv\`)`, null, [`Theo mục 8 của \`CONG-VIEC-3-BEN.md\`, mẫu \`${p("SEO", "MAU", "mau-tien-ich-lan-can.csv")}\` — một tỉnh mỗi lần: Đà Nẵng → Huế → Khánh Hòa.`]],
  ["Thư viện pháp luật", `${NOI_KHAC} (tệp \`thu-vien-phap-luat-${dd}.csv\`)`, null, ["Theo mục 6 của `CONG-VIEC-3-BEN.md` — văn bản thật, link nguồn chính thức, 20 văn bản mỗi lần."]],
  ["Hồ sơ công ty", `${NOI_KHAC} (tệp \`ho-so-cong-ty-${dd}.csv\`)`, null, ["Theo mục 6 của `CONG-VIEC-3-BEN.md` — các công ty, sàn đang đăng tin trên coastalland.vn trước."]],
  ["Bài viết", `${NOI_KHAC} (tệp \`bai-viet-${dd}.docx\`)`, null, ["Theo mục 6 và 7 của `CONG-VIEC-3-BEN.md` — chỉ khi chủ dự án giao đề tài."]],
];

// CHỦ DỰ ÁN TỰ ĐỔI THỨ TỰ (16/10/2026: "tôi có thể thay đổi công việc hằng ngày nếu thấy thứ tự không hợp lý"):
// tệp THU-TU-UU-TIEN.txt — mỗi dòng một tên việc; đổi thứ tự dòng = đổi thứ tự ưu tiên, xoá dòng = bỏ việc.
// Chưa có tệp → máy tạo với thứ tự mặc định ở trên.
const THU_TU = "D:/Coastal Land/SEO/THU-TU-UU-TIEN.txt";
if (fs.existsSync(path.dirname(THU_TU))) {
  if (!fs.existsSync(THU_TU)) {
    fs.writeFileSync(THU_TU, "\uFEFF" + [
      "# THỨ TỰ VIỆC COWORK MỖI NGÀY — dòng trên làm trước.",
      "# Đổi thứ tự: kéo dòng lên/xuống. Bỏ một việc: xoá dòng. Dòng bắt đầu bằng # là ghi chú.",
      ...MUC.map((m) => m[0].replace(/ \(tuần đầu mỗi quý\)| — ĐẦU QUÝ, làm ngay/, "")),
    ].join("\r\n") + "\r\n");
  }
  const chuan = (t) => t.toLowerCase().replace(/\s+/g, " ").trim();
  const dong = fs.readFileSync(THU_TU, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const xep = dong.map((l) => MUC.find((m) => chuan(m[0]).startsWith(chuan(l)))).filter(Boolean);
  if (xep.length) MUC.splice(0, MUC.length, ...xep);
}

// Việc kế hoạch SEO chưa xong (bảng "VIỆC THEO THỨ TỰ ƯU TIÊN" của kế hoạch: # · Việc · Ai · Trạng thái) — chia theo người làm
// Kế hoạch mạng xã hội cùng khung bảng → việc của nó gắn tiền tố "Mạng xã hội:"
const docKeHoach = (tep, dau1 = "") => {
  if (!fs.existsSync(tep)) return [];
  const kh = fs.readFileSync(tep, "utf8").split(/\r?\n/);
  const dau = kh.findIndex((l) => /^## .*VIỆC THEO THỨ TỰ/.test(l));
  if (dau < 0) return [];
  const ds = [];
  for (const l of kh.slice(dau + 1)) { if (/^## /.test(l)) break; if (/^\| \d+[a-z]? \|/.test(l)) ds.push(l.split("|").map((c) => c.trim())); }
  return ds.filter((c) => !/✅/.test(c[4] ?? "")).map((c) => ({ viec: dau1 + c[2].replace(/\*\*/g, ""), ai: c[3], tt: c[4] }));
};
const keHoach = [...docKeHoach(KE_HOACH), ...docKeHoach("D:/Coastal Land/SEO/Plan MXH/KE-HOACH-MXH.md", "Mạng xã hội: ")];
// Thư mục Cowork đã giao mà chủ dự án chưa chuyển sang "đã duyệt"
const thuMuc = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((x) => /^\d{8}$/.test(x)) : []);
const choDuyet = [
  ...thuMuc("D:/Coastal Land/Đăng tin/COWORK").filter((x) => !thuMuc("D:/Coastal Land/Đăng tin/TIN HANG NGAY chuẩn").includes(x)).map((x) => `Tin \`${p("Đăng tin", "COWORK", x)}\``),
  ...thuMuc("D:/Coastal Land/SEO/VAO").filter((x) => !thuMuc("D:/Coastal Land/SEO/DA-DUYET").includes(x)).map((x) => `Dữ liệu \`${p("SEO", "VAO", x)}\``),
];

const v = [`# VIỆC HÔM NAY — 3 BÊN · ${TEN_THU}, ${dd.slice(0, 2)}/${dd.slice(2, 4)}/${dd.slice(4)}`, "",
  thu === 0 ? "Chủ nhật nghỉ." : "Mục đích chính: **SEO** — qua đó cập nhật thông tin, dữ liệu hằng ngày. Mỗi bên làm từ trên xuống.", "",
  "## 1. COWORK — làm từ mục 1 xuống, hết giờ thì dừng",
  "**Mọi mục: không chỉ lọc.** Đọc hiểu nguồn → lấy ĐỦ thông tin vào đúng cột → **biên tập chuẩn SEO** (nội dung, ảnh, video) → **tự kiểm** → mới giao. Không bịa: nguồn không có thì để trống. Giao xong ghi `bao-cao.txt`.",
  "Nhắn **\"Làm việc hôm nay\"** = làm từ mục 1 xuống · **\"Làm mục 2, 6\"** = chỉ các mục đó.", "",
  // BẢNG TỰ KIỂM (chủ dự án 17/10/2026: "tôi phải sửa lại nhiều — nhắc Cowork về SEO, nội dung, ngôn ngữ")
  "### ⛔ TỰ KIỂM TỪNG TIN TRƯỚC KHI GIAO — chủ dự án đang phải sửa lại nhiều",
  "Tin nào chưa qua đủ 12 dòng dưới đây thì **chưa được giao**. Chuẩn đầy đủ: `YEU-CAU-COWORK-DANG-TIN-HANG-LOAT.md` mục 4–9 · ngôn ngữ: `CONG-VIEC-3-BEN.md` mục 7.",
  "",
  "| # | SEO | Đạt khi |",
  "|---|---|---|",
  "| 1 | Tiêu đề | 45–70 ký tự · mở đầu **Bán / Cho thuê** + loại hình + điểm nổi bật + tên đường/dự án + **phường, tỉnh** · không trùng tin khác |",
  "| 2 | Thành phố lớn | Tin ở Nha Trang, Đà Lạt, Quy Nhơn, Buôn Ma Thuột, Vũng Tàu… → tên thành phố có trong tiêu đề hoặc câu đầu mô tả |",
  "| 3 | Mô tả | ≥ 300 ký tự · 5 đoạn: tổng quan · vị trí · thông số (gạch đầu dòng) · pháp lý · điều kiện giao dịch · dòng trống giữa các đoạn |",
  "| 4 | Cột dữ liệu | Giá, diện tích, phòng, hướng, pháp lý, **tên đường**, **tên dự án** chép đúng cột, đúng đơn vị (bán = tỷ, thuê = triệu) |",
  "| 5 | Ảnh | ≥ 3 ảnh thật, ảnh `-1` đẹp nhất · không số điện thoại / logo sàn khác / chữ đè |",
  "| # | NỘI DUNG | Đạt khi |",
  "| 6 | Không bịa | Mọi con số, tiện ích, khoảng cách, pháp lý đều có trong tin gốc · thiếu thì bỏ, không viết cho đủ |",
  "| 7 | Khớp số | Số trong tiêu đề = số trong mô tả = số trong cột = tin gốc |",
  "| 8 | Dự án | Tin thuộc dự án → `ten_du_an` đúng tên trên web; dự án chưa có → lập hồ sơ dự án cùng ngày |",
  "| # | NGÔN NGỮ | Đạt khi |",
  "| 9 | Tiếng Việt chuẩn | Có dấu, đúng chính tả, viết hoa đúng tên riêng · **không VIẾT HOA cả câu** |",
  "| 10 | Giọng người làm nghề | Câu ngắn, đi thẳng ý · không \"siêu phẩm, sập sàn, giá sốc, cực hot, cơ hội vàng\" · không \"Hãy cùng…\", \"Tóm lại…\" · không biểu tượng cảm xúc |",
  "| 11 | Cổng thông tin | Không \"chúng tôi bán\", \"liên hệ chúng tôi\", \"nhận đặt chỗ\" — Coastal Land không môi giới |",
  "| 12 | Sạch | Không số điện thoại, link, tên sàn khác trong tiêu đề / mô tả |",
  "",
  "| Mục | Việc | Còn | Giao vào |", "|---|---|---|---|",
  ...MUC.map(([ten, noi, con], i) => `| ${i + 1} | ${ten} | ${con ?? "—"} | ${noi} |`), "",
  "## 2. CHỦ DỰ ÁN",
  ...(choDuyet.length
    ? ["**Duyệt bản Cowork đã giao** → sửa xong chuyển sang thư mục đã duyệt (tin: `TIN HANG NGAY chuẩn`, dữ liệu: `SEO\\DA-DUYET`) → nhắn Claude \"Đăng <ngày>\":", ...choDuyet.map((x) => `- ${x}`)]
    : ["- Chưa có bản Cowork nào chờ duyệt."]),
  ...keHoach.filter((k) => /chủ dự án/i.test(k.ai)).map((k) => `- ${k.viec} — ${k.tt}`), "",
  "## 3. CLAUDE",
  ...keHoach.filter((k) => /claude/i.test(k.ai)).map((k) => `- ${k.viec} — ${k.tt}`)];
// Bước 1 — máy đối chiếu hiện trạng web
const raWeb = fs.readdirSync(path.join(GOC, "docs")).filter((f) => /^seo-kiem-tra-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().pop();
if (raWeb) {
  const r = JSON.parse(fs.readFileSync(path.join(GOC, "docs", raWeb), "utf8"));
  v.push(`- Rà web ${r.ngay}: ${r.tong} trang trong sitemap · ${r.coLoi} trang có lỗi${r.coLoi ? " (" + Object.entries(r.nhom).map(([k, n]) => `${k.replace(/ N(KB)?$/, "")} ${n}`).join(", ") + ")" : ""} · trang trung bình ${r.kbTB} KB.`);
}
// Search Console (lịch 9:11 ghi mỗi sáng) — việc hôm nay dựa trên tình trạng index thật (chủ dự án 17/10/2026)
const TD = "D:/Coastal Land/SEO/Plan SEO - pSEO/THEO-DOI-INDEX.md";
if (fs.existsSync(TD)) {
  const td = fs.readFileSync(TD, "utf8");
  const so = (nhan) => (td.match(new RegExp(`\\| ${nhan} \\| (\\d+) \\|`)) || [])[1] ?? "?";
  const ngay = (td.match(/cập nhật (\d{4}-\d{2}-\d{2})/) || [])[1] ?? "";
  v.push(`- Search Console ${ngay}: Google đã index ${so("Google đã index")} · đạt chuẩn mà chưa index ${so("Muốn index nhưng CHƯA index")} → xin index 10 trang/ngày theo \`THEO-DOI-INDEX.md\` mục 1; nhóm trang nào chạy thử thì đo theo kế hoạch mục 4 (cổng chạy hàng loạt).`);
}
v.push("", `Quy trình: \`${CV}\` · Kế hoạch SEO: \`${KE_HOACH.replace(/\//g, BS)}\``, "", "---", "# CHI TIẾT VIỆC COWORK", "");
MUC.forEach(([ten, noi, , dong], i) => v.push(`## Mục ${i + 1}. ${ten}`, `Giao vào: ${noi}`, "", ...dong, ""));
fs.writeFileSync(path.join(RA, "VIEC.md"), v.join("\n"));
console.log(`→ ${RA}/VIEC.md (${TEN_THU}) · du-an-can-nap.csv`);
console.log(`tin cần bổ sung ${chuaDat.length} · nhóm trùng ${trung.length} · số nhiều tên ${nhieuTen.length} · tin lệch tài khoản ${lech.length} · dự án cần nạp ${dsNap.length} · nhóm sắp mở trang ${sapMo.length}`);
