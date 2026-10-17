// THEO DÕI INDEX (chủ dự án 16/10/2026: "trang nào index, trang nào không, trang nào cần bổ sung index — theo dõi kỹ").
//   node scripts/theo-doi-index.mjs  → D:/Coastal Land/SEO/Plan SEO - pSEO/THEO-DOI-INDEX.md
// Danh sách trang Google ĐÃ index: lịch SEO 9:11 đọc ở Search Console → ghi vào gsc-da-index.txt (mỗi dòng một địa chỉ).
import fs from "fs";
const daIndex = fs.readFileSync("D:/Coastal Land/SEO/Plan SEO - pSEO/gsc-da-index.txt", "utf8").split(/\r?\n/).filter(Boolean).map((u) => u.trim().replace(/\/$/, ""));
const sm = await (await fetch("https://coastalland.vn/sitemap.xml")).text();
const muon = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/\/$/, "")).filter((u) => !/\.(jpe?g|png|webp)/.test(u));
const coIndex = new Set(daIndex);
const muonSet = new Set(muon);
// Ưu tiên xin index: trang có nhiều người tìm (bản đồ từ khoá, kế hoạch mục 6) lên trước
const UU_TIEN = ["/mua-ban/nha/da-nang", "/mua-ban/can-ho-chung-cu/da-nang", "/mua-ban/nha/hue", "/cho-thue/can-ho-chung-cu/da-nang", "/cho-thue/van-phong",
  "/mua-ban/dat-nen-du-an/da-nang", "/mua-ban/nha/da-nang/phuong-hai-chau", "/mua-ban/nha/da-nang/gia-duoi-10-ty", "/mua-ban/nha/hue/gia-duoi-10-ty",
  "/mua-ban/nha-mat-pho/hue", "/mua-ban/nha/khanh-hoa", "/mua-ban/nha/khanh-hoa/phuong-nha-trang", "/mua-ban/condotel/da-nang",
  "/mua-ban/can-ho-chung-cu/hue", "/mua-ban/trang-trai-nghi-duong/da-nang", "/cho-thue", "/du-an/tra-cuu", "/mua-ban/khanh-hoa", "/mua-ban/gia-lai", "/mua-ban/lam-dong"];
const S = "https://coastalland.vn";
const chuaIndex = muon.filter((u) => !coIndex.has(u));
const xin = [...UU_TIEN.map((p) => S + p).filter((u) => muonSet.has(u) && !coIndex.has(u)),
  ...chuaIndex.filter((u) => !UU_TIEN.includes(u.replace(S, "")) && /\/(mua-ban|cho-thue)\//.test(u) && !/\/bat-dong-san\//.test(u))];
const khongNen = daIndex.filter((u) => !muonSet.has(u));
const nhom = (u) => (/\/bat-dong-san\//.test(u) ? "Trang tin" : /\/(mua-ban|cho-thue)\//.test(u) ? "Trang danh sách / pSEO" : /\/du-an|\/chu-dau-tu/.test(u) ? "Dự án" : /\/tin-tuc\//.test(u) ? "Bài viết" : "Trang khác");
const dem = (ds) => Object.entries(ds.reduce((a, u) => ((a[nhom(u)] = (a[nhom(u)] ?? 0) + 1), a), {})).map(([k, n]) => `${k} ${n}`).join(" · ");
const L = [
  `# THEO DÕI INDEX — trang nào đã index, chưa index, cần xin index (cập nhật ${new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)})`, "",
  "> Nguồn: Search Console (dữ liệu Google tới 12/10) đối chiếu sitemap thật của coastalland.vn hôm nay.",
  "> Chuẩn: chỉ trang trong sitemap (đã qua cổng chất lượng) mới được xin index. Xin index: theo `KE-HOACH-SEO.md` mục 8 (chủ dự án báo đạt 16/10 — lịch 9:11 xin 10 trang/ngày từ mục 1).", "",
  "| | Số trang | Gồm |", "|---|---|---|",
  `| Web muốn index (sitemap) | ${muon.length} | ${dem(muon)} |`,
  `| Google đã index | ${daIndex.length} | ${dem(daIndex)} |`,
  `| Muốn index nhưng CHƯA index | ${chuaIndex.length} | ${dem(chuaIndex)} |`,
  `| Đã index nhưng web KHÔNG còn muốn index | ${khongNen.length} | ${dem(khongNen)} |`, "",
  "## 1. CẦN XIN INDEX — theo thứ tự ưu tiên (khi chủ dự án báo \"đạt\", Search Console → Kiểm tra URL → Yêu cầu lập chỉ mục, tối đa ~10 trang/ngày)",
  ...xin.map((u, i) => `${i + 1}. ${u.replace(S, "")}`), "",
  "Trang tin (/bat-dong-san/…) không xin tay từng trang: Google tự vào theo sitemap + liên kết nội bộ khi các trang danh sách ở trên được index.", "",
  "## 2. ĐÃ INDEX — giữ", ...daIndex.filter((u) => muonSet.has(u)).map((u) => `- ${u.replace(S, "") || "/"}`), "",
  "## 3. ĐÃ INDEX NHƯNG KHÔNG CÒN MUỐN — để Google tự gỡ (đã noindex hoặc chuyển hướng 301)",
  ...khongNen.map((u) => `- ${u.replace(S, "")} — ${/\?tinh=/.test(u) ? "đã chuyển hướng 301 về trang tỉnh" : "đang noindex (trang chưa đủ nội dung / không có người tìm)"}`), "",
];
fs.writeFileSync("D:/Coastal Land/SEO/Plan SEO - pSEO/THEO-DOI-INDEX.md", L.join("\n"));
console.log(muon.length, daIndex.length, chuaIndex.length, khongNen.length, xin.length);
