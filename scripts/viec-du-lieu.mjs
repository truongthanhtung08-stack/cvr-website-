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
import { createJiti } from "jiti";
import path from "node:path";

const GOC = path.resolve(import.meta.dirname, "..");
const { choCuCua } = await createJiti(import.meta.url, { alias: { "@": path.join(GOC, "src") } }).import(path.join(GOC, "src/lib/locations.ts"));
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
  doc("listings?select=id,title,description,images,type,purpose,price_vnd,area_m2,built_area_m2,beds,baths,ward,province,owner_id,status,tier_expires_at,details,published_at&status=in.(approved,expired)&limit=2000"),
  doc("projects?select=slug,name&limit=2000"),
  doc("profiles?select=id,phone&limit=10000"),
]);

// 9 chữ số = Excel nuốt số 0 đầu (17/10: 8 tin đăng hộ báo lệch tài khoản chỉ vì vậy) → thêm lại số 0 khi so.
const sdt = (s) => { const x = (s || "").split(/[,;/|]| - /)[0].replace(/\D/g, "").replace(/^84/, "0").slice(0, 10); return x.length === 9 ? "0" + x : x; };
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
  // TRƯỜNG THẺ THEO CẤP (chủ dự án 20/10/2026: "trường nào thiếu báo Cowork lọc cho đủ hiển thị") — thẻ tin hiện PN · WC · giá/m²
  const lh = (x.type || "").toLowerCase();
  const canHo = /căn hộ|chung cư|condotel|officetel/.test(lh), laDat = /đất/.test(lh), nha = !canHo && !laDat && /nhà|biệt thự|villa|shophouse|liền kề/.test(lh);
  if ((canHo || nha) && !x.beds) thieu.push("thiếu số phòng ngủ");
  if ((canHo || nha) && !x.baths) thieu.push("thiếu số WC");
  if (nha && x.purpose !== "thue" && !x.built_area_m2) thieu.push("thiếu m² sàn (dien_tich_xay_dung — CHỈ chép tổng sàn tin gốc ghi thẳng, không tự nhân; dùng để web tính số liệu giá, không hiện trên tin)");
  if (soAnh(x) >= 3 && soAnh(x) < 4) thieu.push("chỉ 3 ảnh (chuẩn ≥ 4)");
  // ĐỊA CHỈ HỆ CŨ 3 CẤP (thẻ tin hiện "Địa chỉ hệ cũ" dưới hệ mới — 20/10/2026): phường mới gộp từ nhiều phường cũ thì máy
  // không suy ra được phường cũ → phải chép từ tin gốc vào phuong_xa_cu (không đoán).
  if (x.ward && x.province && !(x.details?.diaChiCu?.phuong) && choCuCua(x.province, x.ward).length > 1) thieu.push("thiếu phường/xã cũ (phuong_xa_cu — chép từ tin gốc)");
  // CHẤT LƯỢNG CHỮ (18/10/2026, đo 83/126 tin đang hiện lỗi): sửa được từ chính chữ người đăng → giao cả tin không có nguồn.
  const t = x.title || "", d = (x.description || "").trim(), chu = t.replace(/[^A-Za-zÀ-ỹ]/g, "");
  const cl = [];
  if (chu.length > 10 && chu === chu.toUpperCase()) cl.push("tiêu đề VIẾT HOA cả câu");
  // Chuẩn tiêu đề (bảng tự kiểm dòng 1, chủ dự án 20/10/2026): 30–60 ký tự · không ghi giá, diện tích (web tự hiện)
  if (t.trim().length > 60) cl.push(`tiêu đề dài ${t.trim().length} ký tự (chuẩn 30–60)`);
  if (t.trim().length < 30) cl.push(`tiêu đề ngắn ${t.trim().length} ký tự (chuẩn 30–60)`);
  if (/\d+([.,]\d+)?\s*(m2|m²|tỷ|ty\b|triệu|tr\b)/i.test(t)) cl.push("tiêu đề ghi giá/diện tích");
  // 2 câu đầu mô tả hiện ngay dưới tiêu đề trên thẻ tin (20/10/2026) → mô tả mở đầu bằng chính tiêu đề là phí chỗ
  const dongDau = d.split(/\n|(?<=[.!?])\s/)[0]?.toLowerCase().replace(/[^\p{L}\d ]/gu, "").trim() ?? "";
  const tdThuong = t.toLowerCase().replace(/[^\p{L}\d ]/gu, "").trim();
  if (dongDau.length > 10 && (tdThuong.includes(dongDau) || dongDau.includes(tdThuong))) cl.push("mô tả mở đầu bằng chính tiêu đề — viết 2 câu tóm tắt (loại nhà, diện tích, số phòng, điểm nổi bật)");
  if (!/^\s*(bán|cho thuê|chuyển nhượng|sang nhượng)/i.test(t)) cl.push("tiêu đề không mở đầu Bán/Cho thuê");
  if (/siêu phẩm|sập sàn|giá sốc|cực hot|gấp gấp|hiếm|cơ hội vàng|!!/i.test(t)) cl.push("tiêu đề có từ câu khách");
  if (d.length >= 100 && d.length < 300) cl.push("mô tả < 300 ký tự");
  if (d.length >= 100 && !d.includes("\n")) cl.push("mô tả một cục, chưa chia 5 đoạn");
  thieu.push(...cl);
  return { x, thieu, chuChu: cl.length > 0, chan: soAnh(x) < 3 || d.length < 100 || cl.length > 0 };
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


// 6b) LỊCH SỬ GIÁ CÒN THIẾU (18/10/2026): tải sẵn danh sách dãy còn thiếu cho Cowork — Cowork không giữ mã nộp.
// Chỉ ĐỌC. Chi phí: 1 lần gọi hàm Vercel mỗi sáng (~26 lần/tháng), nằm gọn trong gói Pro.
try {
  if (env.MA_NOP_SO_LIEU) {
    const r = await fetch(`https://coastalland.vn/api/chi-so-gia/con-thieu?ma=${encodeURIComponent(env.MA_NOP_SO_LIEU)}`);
    if (r.ok) fs.writeFileSync(path.join(RA, "lich-su-gia-con-thieu.csv"), Buffer.from(await r.arrayBuffer()));
  }
} catch { /* mạng lỗi → hôm nay không có tệp, Cowork ghi báo cáo */ }

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
// Khu vực theo thứ tự chủ dự án chốt 20/10/2026 (tỉnh/thành địa giới mới). Hà Nội, TP. Hồ Chí Minh: thị trường lớn, vẫn trong
// định hướng SEO/pSEO — CHƯA giao cho tới khi quy trình ở các khu vực đang làm chạy ổn định (bỏ DUNG khi chủ dự án cho triển khai).
const KHU = ["Đà Nẵng", "Huế", "Khánh Hòa", "Gia Lai", "Lâm Đồng", "Quảng Ngãi", "Quảng Trị"];
const DUNG = /Hà Nội|Hồ Chí Minh/;
const hangKhu = (ten) => { const i = KHU.findIndex((k) => ten.endsWith(k)); return i < 0 ? KHU.length : i; };
const sapMo = Object.values(demNhom).filter((g) => g.n > 0 && g.n < 3 && !DUNG.test(g.ten))
  .sort((a, b) => hangKhu(a.ten) - hangKhu(b.ten) || b.n - a.n || a.ten.localeCompare(b.ten, "vi"));
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
// 18/10/2026 (chủ dự án: "dồn hết một folder SEO"): tin cũng giao vào SEO\VAO\<ngày> cùng mọi dữ liệu khác;
// Claude kiểm xong CHUYỂN cả thư mục ngày sang SEO\DA-DUYET\<ngày>. Không còn dùng Đăng tin\COWORK, TIN HANG NGAY chuẩn.
const NOI_TIN = "`" + p(SEO, "VAO", dd) + BS + "` (tệp `Bang-" + ngay + ".xlsx` + `anh" + BS + "` + `Video" + BS + "`)";
const NOI_KHAC = "`" + p(SEO, "VAO", dd) + BS + "`";
// Kèm link tin gốc (quy trình 17/10): Cowork không tự tìm được nguồn; tin khách tự đăng không có nguồn → không giao.
// Lỗi chất lượng chữ (chuChu) sửa được từ chính tin trên web → giao cả khi không có nguồn.
const sua = (ds, cot) => ds.filter((r) => r.x.details?.nguonTin || r.chuChu).map((r) => `- [${r.x.title.slice(0, 60)}](${link(r.x)}) — ${cot(r)} · nguồn: ${r.x.details?.nguonTin || "không có — viết lại từ chính chữ trên tin, không thêm ý mới"}`);
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
    ? ["Nhóm còn thiếu tin (đủ 3 tin đạt chuẩn là có trang Google) — đã xếp theo thứ tự khu vực chủ dự án chốt, làm từ trên xuống:", ...sapMo.slice(0, 80).map((g) => `- ${g.ten} — cần thêm ${3 - g.n} tin`)]
    : ["Không có việc."]],
  ["Tin mới", NOI_TIN, null, [
    "**Khu vực theo thứ tự:** Đà Nẵng → Huế → Khánh Hòa → Gia Lai → Lâm Đồng → Quảng Ngãi → Quảng Trị (chủ dự án 20/10/2026; Hà Nội, TP. Hồ Chí Minh chưa làm — triển khai khi quy trình ổn định). Tỉnh, phường ghi hệ mới theo `D:\\Coastal Land\\SEO\\DANH-SACH-PHUONG-XA-TOAN-QUOC.txt`.",
    `Lọc + biên tập theo \`${p(SEO, "YEU-CAU-COWORK-DANG-TIN-HANG-LOAT.md")}\`:`,
    "- **Tiêu đề = câu SEO chính**, 30–60 ký tự, chỉ giữ thông tin chính: Bán/Cho thuê + loại hình + đặc điểm khách hay tìm + tên đường/dự án — phường, tỉnh **tùy tin** — tin đã có tên đường / dự án thì không cần; tin thiếu tên đường, dự án hoặc ở thành phố lớn thì nên ghi; không ghi giá, diện tích (web tự thêm).",
    "- **Mô tả** ≥ 300 ký tự, đủ 5 phần: tổng quan · vị trí · thông số · pháp lý · điều kiện giao dịch.",
    "- Mọi thông tin trong tin gốc (giá, diện tích, mặt tiền, đường vào, hướng, pháp lý, phòng ngủ, tên dự án…) điền vào **đúng cột**.",
    "- 4–15 ảnh thật (ít nhất 4–5), ảnh đầu đẹp nhất; tin nhà phải có ảnh mặt tiền; ảnh có watermark vẫn lấy. Tự kiểm mục 9 của tệp yêu cầu trước khi giao.",
  ]],
  ["Sửa tin đang không lên Google (thiếu ảnh / mô tả ngắn)", NOI_TIN, chuaDat.filter((r) => r.chan).length, (() => {
    const ds = chuaDat.filter((r) => r.chan);
    return ds.length ? [`Tìm lại tin gốc, lấy đủ ảnh + mô tả, ${GOP}:`, ...sua(ds, (r) => r.thieu.filter((t) => /ảnh|mô tả|tiêu đề/.test(t)).join(", "))] : ["Không có việc."];
  })()],
  // Mạng xã hội — chung quy trình 4 bước: máy chọn tin → Cowork soạn bài → chủ dự án duyệt nguyên văn → chủ dự án tự đăng.
  ["Bài mạng xã hội (Fanpage · OA · nhóm)", `${NOI_KHAC.slice(0, -1)}mxh${BS}\` (tệp \`bai-mxh-${dd}.docx\` + \`anh${BS}\`)`, tinMxh.length, tinMxh.length
    ? [`**2 bài mỗi ngày, có ảnh: 1 bài Zalo, 1 bài Facebook** (chủ dự án 20/10). Soạn bài theo mục 4–5 của \`${p(SEO, "Plan MXH", "KE-HOACH-MXH.md")}\`: mỗi bài ghi rõ kênh, chữ, ảnh (lấy từ tin), link đúng như dưới.`,
      ...tinMxh.map((x) => `- ${x.title.slice(0, 60)} — Fanpage: ${link(x)}?utm_source=facebook&utm_medium=fanpage · OA: ${link(x)}?utm_source=zalo&utm_medium=oa · nhóm: ${link(x)}?utm_source=zalo&utm_medium=nhom`)]
    : ["Không có tin mới đạt chuẩn trong 2 ngày qua — soạn 1 bài gom tin nổi bật theo khu vực."]],
  ["Hồ sơ dự án", `${NOI_KHAC} (tệp \`du-an-${dd}.csv\`)`, dsNap.length, dsNap.length
    ? [`Điền \`${p(SEO, "RA", "du-an-can-nap.csv")}\` theo mục 4 của \`${CV}\`: đủ cột bắt buộc, **tổng quan tự viết lại 3–6 câu chuẩn SEO** (tên dự án · vị trí · chủ đầu tư · loại sản phẩm), có nguồn + ngày. Ưu tiên dự án đã có người tìm (Alacarte, Altara, Fusion Suites, Harmony). Làm 10 dự án mỗi lần:`, ...dsNap.slice(0, 10).map((d) => `- ${d.ten} · ${d.phuong ? d.phuong + ", " : ""}${d.tinh}`)]
    : ["Nạp dự án mới toàn quốc theo mục 4 của `CONG-VIEC-3-BEN.md`."]],
  ["Bổ sung trường còn thiếu (tên đường / hướng / pháp lý / phòng ngủ, WC, m² sàn — để thẻ hiện đủ theo cấp)", NOI_TIN, chuaDat.filter((r) => !r.chan).length, (() => {
    const ds = chuaDat.filter((r) => !r.chan);
    return ds.length ? [`Lấy lại từ tin gốc, ${GOP}. Làm 20 tin mỗi lần:`, ...sua(ds.slice(0, 20), (r) => r.thieu.join(", "))] : ["Không có việc."];
  })()],
  ["Bảng giá đất Nhà nước", `${NOI_KHAC} (tệp \`gia-dat-<tỉnh>.csv\`)`, null, ["Theo mục 5 của `CONG-VIEC-3-BEN.md`, từ văn bản gốc quyết định UBND tỉnh. Thứ tự: Đà Nẵng → Huế → Khánh Hòa → Gia Lai → Lâm Đồng."]],
  // Quy trình 17/10: Cowork chỉ thấy 4 số đầu nên không làm được mục này — máy so số đầy đủ, Claude ghi mục 2 chờ chủ dự án OK.
  ["Tin trùng · một số nhiều tên · tin đăng hộ", "Cowork KHÔNG làm — Claude xử lý, chủ dự án OK ở mục 2", trung.length + nhieuTen.length + lech.length, [
    ...(trung.length ? ["Cùng một BĐS đăng nhiều tin — ghi tin nào giữ, tin nào gỡ:", ...trung.map((g) => `- ${g.map((x) => `[${x.title.slice(0, 40)}](${link(x)})`).join(" · ")}`)] : []),
    ...(nhieuTen.length ? ["Một số điện thoại ghi nhiều tên — ghi tên đúng:", ...nhieuTen.map(([so, t]) => `- ${che(so)}: ${[...t].join(" / ")}`)] : []),
    ...(lech.length ? ["Tin đăng hộ — ghi tin nào thuộc số nào:", ...lech.map((x) => `- [${x.title.slice(0, 50)}](${link(x)}) · số liên hệ ${che(sdt(x.details?.contact?.phone))}`)] : []),
    ...(!trung.length && !nhieuTen.length && !lech.length ? ["Không có việc."] : []),
  ]],
  // Chủ dự án 18/10: "hoàn thiện lịch sử giá để chạy trên web" → hằng ngày tới khi đủ (trước chỉ tuần đầu mỗi quý).
  // 18/10: Cowork KHÔNG nộp (mã nộp là của chủ dự án) — giao tệp vào VAO, Claude kiểm rồi nộp.
  // Chủ dự án 21/10/2026: "ghi vào công việc để có đủ số liệu hiển thị theo lộ trình nhanh nhất" → MỖI NGÀY tới khi đủ.
  // Cowork CHỈ LỌC GIÁ: giá mỗi m² theo loại hình, cả bán lẫn thuê, mỗi quý đủ phổ biến + thấp nhất + cao nhất.
  ["Lịch sử giá — LỌC GIÁ, mỗi ngày tới khi đủ" + (dauQuy ? " (ĐẦU QUÝ: thêm quý mới cho các dãy đang có)" : ""), `${NOI_KHAC} (tệp \`lich-su-gia-${dd}.csv\`)`, null, [
    `Theo \`${p(SEO, "YEU-CAU-COWORK-LICH-SU-GIA.md")}\` (khối CHỐT 21/10 ở đầu tệp). Lộ trình nhanh nhất, làm từ trên xuống:`,
    "1. Bổ sung giá thấp nhất + cao nhất cho 4 quý Q3/25 → Q2/26 của 2 dãy Phường Ngũ Hành Sơn (đất nền, căn hộ) — có là biểu đồ hiện dải khoảng giá ngay.",
    `2. Dãy theo DỰ ÁN đang có tin trên web (một dãy phủ mọi tin trong dự án) — danh sách \`${p(SEO, "RA", "lich-su-gia-con-thieu.csv")}\`.`,
    "3. Dãy theo PHƯỜNG/XÃ nhiều tin nhất, đúng loại hình (mỗi loại nhà một dãy: nhà riêng, nhà phố, villa…), cả MUA BÁN lẫn CHO THUÊ.",
    "Mỗi quý đủ 3 số (phổ biến · thấp nhất · cao nhất), giá mỗi m² theo loại hình, càng dài càng tốt (1 → 5 năm). Chỉ nguồn công khai, không bịa, không dùng số cả tỉnh. **Cowork không nộp** — giao tệp, Claude kiểm rồi nộp.",
  ]],
  ["Tiện ích lân cận (trường, bệnh viện, khu công nghiệp, chợ, biển, sân bay)", `${NOI_KHAC} (tệp \`tien-ich-<tỉnh>.csv\`)`, null, [`Theo mục 8 của \`CONG-VIEC-3-BEN.md\`, mẫu \`${p("SEO", "MAU", "mau-tien-ich-lan-can.csv")}\` — một tỉnh mỗi lần: Đà Nẵng → Huế → Khánh Hòa.`]],
  ["Thư viện pháp luật", `${NOI_KHAC} (tệp \`thu-vien-phap-luat-${dd}.csv\`)`, null, ["Hằng ngày, theo mục 6 của `CONG-VIEC-3-BEN.md` — văn bản thật, link nguồn chính thức, tình trạng hiệu lực đúng luật, 20 văn bản mỗi lần. **Không chờ chủ dự án duyệt**: Claude kiểm nguồn + hiệu lực rồi nạp thẳng (chốt 18/10)."]],
  ["Hồ sơ công ty", `${NOI_KHAC} (tệp \`ho-so-cong-ty-${dd}.csv\`)`, null, ["**Không làm riêng mục này** (chốt 18/10): khi lọc tin, người đăng là công ty / sàn thì ghi đúng tên công ty vào `lien_he_ten` — hồ sơ công ty sẽ lấy từ tin."]],
  ["Bài viết", `${NOI_KHAC} (tệp \`bai-viet-${dd}.docx\`)`, null, ["**Hằng ngày 2–3 bài chất lượng, có ảnh, cho mục Tin tức** (chốt 20/10) — Cowork tự chọn đề tài theo tình trạng SEO: từ khoá người tìm có lượt hiện mà chưa có lượt bấm (số Search Console trong tệp này / kế hoạch SEO mục 3). Viết theo mục 6 và 7 của `CONG-VIEC-3-BEN.md`: chuẩn SEO, giọng người làm nghề, số liệu có nguồn + ngày, 2–4 link về trang coastalland.vn."]],
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
  // Một thư mục SEO (18/10): VAO\<ngày> còn nằm đó = Cowork đã giao, Claude chưa kiểm / chưa chuyển sang DA-DUYET.
  ...thuMuc("D:/Coastal Land/SEO/VAO").map((x) => `Đợt \`${p("SEO", "VAO", x)}\` (Claude chưa kiểm — nhắn "Cowork xong")`),
];

const v = [`# VIỆC HÔM NAY — 3 BÊN · ${TEN_THU}, ${dd.slice(0, 2)}/${dd.slice(2, 4)}/${dd.slice(4)}`, "",
  "**COWORK:** nhận lệnh \"Làm việc hôm nay\" → làm từ trên xuống. Không hỏi lại chủ dự án.", "",
  thu === 0 ? "Chủ nhật: chỉ làm việc Claude giao riêng ở đầu tệp (nếu có)." : "Mục đích chính: **SEO** — qua đó cập nhật thông tin, dữ liệu hằng ngày. Mỗi bên làm từ trên xuống.", "",
  "## 1. COWORK — chuẩn chung, hết giờ thì dừng",
  "**⛔ KHÔNG HỎI LẠI CHỦ DỰ ÁN.** Vướng gì (thiếu nguồn, chưa rõ loại hình, cần số đầy đủ…) → bỏ qua dòng đó, ghi một dòng vào `bao-cao.txt` mục \"CẦN CLAUDE TRẢ LỜI\", làm tiếp việc khác. Claude trả lời trong ngày ở đầu tệp này. Hết việc thì ghi `bao-cao.txt` và dừng.",
  "**Mọi mục: không chỉ lọc.** Đọc hiểu nguồn → lấy ĐỦ thông tin vào đúng cột → **biên tập chuẩn SEO** (nội dung, ảnh, video) → **tự kiểm** → mới giao. Không bịa: nguồn không có thì để trống. Giao xong ghi `bao-cao.txt`.",
  "**\"Làm mục 2, 6\"** = chỉ các mục đó.", "",
  // BẢNG TỰ KIỂM (chủ dự án 17/10/2026: "tôi phải sửa lại nhiều — nhắc Cowork về SEO, nội dung, ngôn ngữ")
  "### ⛔ TỰ KIỂM TỪNG TIN TRƯỚC KHI GIAO — chủ dự án đang phải sửa lại nhiều",
  "Tin nào chưa qua đủ 13 dòng dưới đây thì **chưa được giao**. Chuẩn đầy đủ: `YEU-CAU-COWORK-DANG-TIN-HANG-LOAT.md` mục 4–9 · ngôn ngữ: `CONG-VIEC-3-BEN.md` mục 7.",
  "",
  "| # | SEO | Đạt khi |",
  "|---|---|---|",
  "| 1 | Tiêu đề | 30–60 ký tự · mở đầu **Bán / Cho thuê** + loại hình + đặc điểm khách hay tìm + tên đường/dự án · phường, tỉnh **tùy tin** — tin đã có tên đường / dự án thì không cần; tin thiếu tên đường, dự án hoặc ở thành phố lớn thì nên ghi; không ghi giá, diện tích (web tự thêm) · không trùng tin khác |",
  "| 2 | Thành phố lớn | Tin ở Nha Trang, Đà Lạt, Quy Nhơn, Buôn Ma Thuột, Vũng Tàu… mà tên phường không có tên thành phố → ghi tên thành phố vào tiêu đề |",
  "| 3 | Mô tả | ≥ 300 ký tự · 5 đoạn: tổng quan · vị trí · thông số (gạch đầu dòng) · pháp lý · điều kiện giao dịch · dòng trống giữa các đoạn |",
  "| 4 | Cột dữ liệu | Giá, diện tích, phòng, hướng, pháp lý, **tên đường**, **tên dự án** chép đúng cột, đúng đơn vị (bán = tỷ, thuê = triệu) |",
  "| 5 | Ảnh | **Chất lượng trước**: thật, rõ nét, cạnh dài ≥ 800 px · 4–15 ảnh/tin (ít nhất 4–5), **tự bỏ ảnh trùng, ảnh thừa** · ảnh `-01` đẹp nhất · tin nhà phải có ảnh mặt tiền (xấu vẫn lấy) · ảnh có watermark / logo / chữ / SĐT đè vẫn lấy — chủ dự án xoá · dưới 4 ảnh đạt → bỏ tin |",
  "| # | NỘI DUNG | Đạt khi |",
  "| 6 | Không bịa | Mọi con số, tiện ích, khoảng cách, pháp lý đều có trong tin gốc · thiếu thì bỏ, không viết cho đủ |",
  "| 7 | Khớp số | Số trong tiêu đề = số trong mô tả = số trong cột = tin gốc |",
  "| 8 | Dự án | Tin thuộc dự án → `ten_du_an` đúng tên trên web; dự án chưa có → lập hồ sơ dự án cùng ngày |",
  "| # | NGÔN NGỮ | Đạt khi |",
  "| 9 | Tiếng Việt chuẩn | Có dấu, đúng chính tả, viết hoa đúng tên riêng · **không VIẾT HOA cả câu** |",
  "| 10 | Giọng người làm nghề | Câu ngắn, đi thẳng ý · không \"siêu phẩm, sập sàn, giá sốc, cực hot, cơ hội vàng\" · không \"Hãy cùng…\", \"Tóm lại…\" · không biểu tượng cảm xúc |",
  "| 11 | Cổng thông tin | Không \"chúng tôi bán\", \"liên hệ chúng tôi\", \"nhận đặt chỗ\" — Coastal Land không môi giới |",
  "| 12 | Sạch | Không số điện thoại, link, tên sàn khác trong tiêu đề / mô tả |",
  "| 13 | Xếp dòng | Bảng xếp theo tỉnh → phường/xã → mã tin (Đà Nẵng · Huế · Khánh Hòa · Gia Lai · Lâm Đồng · Quảng Ngãi · Quảng Trị · Hà Nội · TP. Hồ Chí Minh) — chủ dự án sửa ảnh hàng loạt theo tỉnh |",
  "",
  // Việc kế hoạch SEO giao Cowork (KE-HOACH-SEO.md mục 3, cột Ai có "Cowork") — kèm số Search Console ghi ở cột trạng thái.
  // Quy trình 17/10: giao theo kế hoạch + số thật, không chỉ theo danh sách đếm tin.
  ...(keHoach.some((k) => /cowork/i.test(k.ai))
    ? ["### ƯU TIÊN THEO KẾ HOẠCH SEO + SEARCH CONSOLE — làm trước mục 1 (giao chung thư mục của mục 1 / mục 5)",
       ...keHoach.filter((k) => /cowork/i.test(k.ai)).map((k) => `- ${k.viec} — ${k.tt}`), ""]
    : []),
  "| Mục | Việc | Còn | Giao vào |", "|---|---|---|---|",
  ...MUC.map(([ten, noi, con], i) => `| ${i + 1} | ${ten} | ${con ?? "—"} | ${noi} |`), "",
  "## 2. CHỦ DỰ ÁN",
  ...(choDuyet.length
    ? ["**Cowork đã giao, chờ Claude kiểm** → nhắn Claude \"Cowork xong\" → Claude kiểm, chuyển cả ngày sang `SEO\\DA-DUYET\\<ngày>` → anh sửa nội dung, ảnh ở đó → nhắn \"Đăng <ngày>\":", ...choDuyet.map((x) => `- ${x}`)]
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
// GIỮ MỤC 0 (18/10/2026): mục 0 là Claude trả lời Cowork / giao việc riêng trong ngày — lượt 6:30 ghi đè cả tệp
// nên từng xoá mất. Giữ nguyên khi tiêu đề mục 0 có ngày hôm nay (dd/mm); mục 0 của ngày cũ thì bỏ.
const tepViec = path.join(RA, "VIEC.md");
if (fs.existsSync(tepViec)) {
  const cu = fs.readFileSync(tepViec, "utf8");
  const a = cu.indexOf("## 0. "), b = cu.indexOf("## 1. COWORK");
  const muc0 = a >= 0 && b > a ? cu.slice(a, b).trimEnd() : "";
  if (muc0 && muc0.split("\n")[0].includes(`${dd.slice(0, 2)}/${dd.slice(2, 4)}`)) v.splice(v.indexOf(v.find((l) => l.startsWith("## 1. COWORK"))), 0, muc0, "");
}
// Nhắc hằng ngày (chủ dự án 18/10: "đảm bảo chuẩn thì mới chạy, không chuẩn không chạy, luôn nhắc việc này hằng ngày").
v.splice(4, 0, "**⛔ CHUẨN TRƯỚC, CHẠY SAU — cả 3 bên, mọi việc:** tin, bài, dữ liệu, trang chưa đạt chuẩn thì **không đăng, không xin index, không giao**. Đạt chuẩn mới chạy.", "");
// YÊU CẦU CHỦ DỰ ÁN — IN MỖI NGÀY ở đầu tệp (chủ dự án 20/10/2026: "yêu cầu tôi nói nhiều rồi" — trước đây chỉ nằm ở
// mục 0 sửa tay nên sáng hôm sau bị lượt 6:30 ghi đè mất). Đổi yêu cầu = sửa đúng mảng này, không sửa tay VIEC.md.
const YEU_CAU = [
  "## ⛔ YÊU CẦU CHỦ DỰ ÁN — áp cho mọi việc, đè lên mọi dòng khác (chốt 19–20/10/2026)",
  "1. **Khu vực, ưu tiên theo thứ tự:** Đà Nẵng → Huế → Khánh Hòa (Nha Trang) → Gia Lai (Quy Nhơn) → Lâm Đồng (Phan Thiết) → Quảng Ngãi → Quảng Trị. Tỉnh/thành **theo địa giới mới**: thành phố, phường, xã nào thuộc tỉnh đó đều được lọc.",
  "2. **Hà Nội, TP. Hồ Chí Minh: CHƯA làm — vẫn nằm trong định hướng SEO/pSEO (thị trường lớn); triển khai khi quy trình ở các khu vực đang làm chạy ổn định** — hiện chưa lọc tin hai thị trường này.",
  "3. **Mua bán / cho thuê 70/30.**",
  "4. **Tin mới nhất trước, không đặt số ngày cố định — tùy khu vực** (khu ít tin được lấy tin cũ hơn). **Tin gốc phải còn hạn** — hết hạn, đã gỡ → không lấy (kể cả sửa tin cũ). Mở lại link gốc ngay trước khi giao; ghi ngày đăng tin gốc vào `ghi_chu`.",
  "5. **Ảnh: ít nhất 4–5 ảnh/tin, tối đa 15.** Bỏ ảnh kém (mờ, tối, trùng góc, bừa bộn). **Ảnh có watermark, logo sàn khác, chữ, số điện thoại đè VẪN LẤY — chủ dự án xoá hết.** Dưới 4 ảnh đạt → bỏ tin.",
  "6. **Tin nhà (bán, cho thuê): phải có ít nhất 1 ảnh mặt tiền hoặc toàn cảnh ngôi nhà** — không có ảnh đẹp thì vẫn lấy ảnh kém hơn; tin gốc không có tấm nào → bỏ tin.",
  "7. **Tin tức: mỗi ngày 2–3 bài chất lượng, có ảnh, hợp SEO.** **Mạng xã hội: mỗi ngày 2 bài có ảnh — 1 Zalo, 1 Facebook.**",
  `8. **Tên ảnh số 2 chữ số:** \`dn01-${dd.slice(0, 4)}-01.jpg\`, \`-02\`…`,
  "9. **LỌC NHIỀU TIN HƠN MỖI NGÀY (chủ dự án 20/10/2026)** — trang khu vực trên Google mỏng vì THIẾU TIN, không phải vì tin ngắn (đo 20/10: condotel Đà Nẵng 3 tin → 118 chữ riêng; nhà Đà Nẵng 49 tin → 1.366 chữ riêng). Ưu tiên nhóm (loại hình × tỉnh/phường) đang ít tin, nhất là nhóm đã có lượt hiển thị trên Google (mục 1 bên dưới). Mỗi tin chỉ cần đủ chuẩn 13 dòng, không cần viết dài.",
  "10. **TIÊU ĐỀ = Mục đích (Bán / Cho thuê) + loại hình + điểm nổi bật** (+ tên đường / dự án, nơi chốn) — viết cho ĐỦ độ dài chuẩn 30–60 ký tự, không ghi giá, diện tích (chủ dự án 20/10/2026; bảng tự kiểm dòng 1). Phải CỐ viết cho đủ, đúng chuẩn (việc này không khó) — tin cũ tiêu đề ngắn mà đúng nội dung tạm chấp nhận, nhưng khi lọc, viết tin thì viết đủ 30–60 ký tự. **Mô tả mở đầu bằng 2 câu tóm tắt** (loại nhà, diện tích, số phòng, điểm nổi bật), không lặp lại tiêu đề — 2 câu này hiện ngay dưới tiêu đề trên thẻ tin (chủ dự án 20/10/2026).",
  "",
];
v.splice(6, 0, ...YEU_CAU);
fs.writeFileSync(tepViec, v.join("\n"));
console.log(`→ ${RA}/VIEC.md (${TEN_THU}) · du-an-can-nap.csv`);
console.log(`tin cần bổ sung ${chuaDat.length} · nhóm trùng ${trung.length} · số nhiều tên ${nhieuTen.length} · tin lệch tài khoản ${lech.length} · dự án cần nạp ${dsNap.length} · nhóm sắp mở trang ${sapMo.length}`);
