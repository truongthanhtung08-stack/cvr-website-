// ════════════════════════════════════════════════════════════════════════════
// SOẠN SẴN TIN NẠP — trước khi tới lượt chủ dự án duyệt (luồng chốt 16/10/2026)
//
//   node scripts/soan-san-tin-nap.mjs --cham-anh          → chấm ảnh mọi tin chờ duyệt, ghi details.deXuat.anh
//   node scripts/soan-san-tin-nap.mjs --liet-ke           → in JSON các tin chờ duyệt CHƯA có đề xuất chữ
//   node scripts/soan-san-tin-nap.mjs --ghi <tệp.json>    → ghi đề xuất tiêu đề/mô tả (đã kiểm số) vào details.deXuat
//
// Tệp .json cho --ghi: [{ "id": "...", "tieuDe": "...", "moTa": "...", "truong": { ... } }, ...]
// "truong" = các trường CÒN TRỐNG mà khách ĐÃ NÓI RÕ trong tiêu đề/mô tả (chủ dự án 16/10: "lọc ra đủ các
// trường của một tin"): beds, baths, direction, legal, furnish, addressDetail (tên đường), specs.<khoá chuẩn
// trong src/lib/listingSpec.ts> (vd floors, frontage, roadWidth, depth, builtYear…). Mỗi giá trị phải có trong chữ gốc.
// LUẬT KHÔNG BỊA (memory ai-tao-tin-khong-bia): mọi con số trong tiêu đề/mô tả đề xuất phải xuất hiện
// trong tin gốc (tiêu đề, mô tả, giá, diện tích, phòng, đặc điểm). Lệch → KHÔNG ghi, in lý do.
// Chỉ ghi vào tin còn cờ details.choChuDuyet — không đụng tin đang hiện trên web.
// ════════════════════════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const GOC = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  fs.readFileSync(path.join(GOC, ".env.local"), "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const K = env.SUPABASE_SERVICE_ROLE_KEY;
if (!K) { console.error("Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };

const tinCho = async () =>
  (await fetch(`${U}/rest/v1/listings?select=id,title,description,images,type,purpose,price_vnd,area_m2,built_area_m2,beds,baths,ward,province,details&details->>choChuDuyet=eq.true&limit=500`, { headers: H })).json();
const ghiDetails = async (id, details) => {
  const r = await fetch(`${U}/rest/v1/listings?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ details }) });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
};
const boDau = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
const urlDay = (u) => (u.startsWith("http") ? u : `https://coastalland.vn${u.startsWith("/") ? "" : "/"}${u}`);
const laVideo = (u) => /youtu|\.mp4|\.mov|\.webm/i.test(u);

const cheDo = process.argv[2];

if (cheDo === "--cham-anh") {
  const ds = await tinCho();
  const hashTatCa = new Map(); // dHash → [id tin]
  const ketQua = [];
  for (const t of ds) {
    const diem = [];
    for (const u of (t.images ?? []).filter((x) => !laVideo(x))) {
      try {
        const buf = Buffer.from(await (await fetch(urlDay(u))).arrayBuffer());
        const meta = await sharp(buf).metadata();
        // ĐỘ NÉT: phương sai Laplace trên ảnh xám thu về 512px — ảnh mờ có phương sai thấp
        const { data } = await sharp(buf).resize(512, 512, { fit: "inside" }).greyscale()
          .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0] }).raw().toBuffer({ resolveWithObject: true });
        let tong = 0, tongBp = 0;
        for (const v of data) { tong += v; tongBp += v * v; }
        const tb = tong / data.length;
        const net = tongBp / data.length - tb * tb;
        // dHash 8×8 để nhận ảnh trùng giữa các tin
        const g = await sharp(buf).resize(9, 8, { fit: "fill" }).greyscale().raw().toBuffer();
        let hash = "";
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) hash += g[y * 9 + x] > g[y * 9 + x + 1] ? "1" : "0";
        (hashTatCa.get(hash) ?? hashTatCa.set(hash, []).get(hash)).push(t.id);
        diem.push({ u, rong: meta.width ?? 0, cao: meta.height ?? 0, net, hash });
      } catch {
        diem.push({ u, rong: 0, cao: 0, net: 0, hash: "", loi: true });
      }
    }
    ketQua.push({ t, diem });
  }
  for (const { t, diem } of ketQua) {
    const co = {};
    for (const a of diem) {
      if (a.loi) co[a.u] = "không mở được";
      else if (Math.min(a.rong, a.cao) < 600) co[a.u] = `nhỏ ${a.rong}×${a.cao}`;
      else if (a.net < 60) co[a.u] = "mờ";
      else if ((hashTatCa.get(a.hash) ?? []).some((id) => id !== t.id)) co[a.u] = "trùng ảnh tin khác";
    }
    // Thứ tự: ảnh không cờ trước, ngang trước dọc, nét + to trước; video giữ cuối
    const thuTu = [...diem]
      .sort((a, b) => Number(!!co[a.u]) - Number(!!co[b.u]) || Number(b.rong >= b.cao) - Number(a.rong >= a.cao) || b.net * b.rong - a.net * a.rong)
      .map((a) => a.u)
      .concat((t.images ?? []).filter(laVideo));
    await ghiDetails(t.id, { ...t.details, deXuat: { ...(t.details?.deXuat ?? {}), anh: { thuTu, co } } });
    console.log(`${t.id.slice(0, 8)} · ${diem.length} ảnh · cờ: ${Object.values(co).join(", ") || "không"}`);
  }
  console.log(`Đã chấm ảnh ${ketQua.length} tin chờ duyệt.`);
} else if (cheDo === "--liet-ke") {
  const ds = (await tinCho()).filter((t) => !t.details?.deXuat?.tieuDe);
  console.log(JSON.stringify(ds.map((t) => ({
    id: t.id, title: t.title, description: t.description, type: t.type, purpose: t.purpose,
    price_vnd: t.price_vnd, area_m2: t.area_m2, built_area_m2: t.built_area_m2, beds: t.beds, baths: t.baths,
    ward: t.ward, province: t.province,
    details: { addressDetail: t.details?.addressDetail, direction: t.details?.direction, legal: t.details?.legal, furnish: t.details?.furnish,
      specs: t.details?.specs, amenities: t.details?.amenities, interior: t.details?.interior, projectName: t.details?.projectName },
  })), null, 1));
} else if (cheDo === "--ghi") {
  const de = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
  const ds = new Map((await tinCho()).map((t) => [t.id, t]));
  const so = (s) => (String(s).match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(",", "."));
  for (const d of de) {
    const t = ds.get(d.id);
    if (!t) { console.log(`✗ ${d.id}: không còn chờ duyệt — bỏ qua`); continue; }
    // KIỂM SỐ: mọi con số trong đề xuất phải có trong nguồn của chính tin đó
    const nguon = JSON.stringify([t.title, t.description, t.price_vnd, t.price_vnd && t.price_vnd / 1e9, t.price_vnd && t.price_vnd / 1e6,
      t.area_m2, t.built_area_m2, t.beds, t.baths, t.ward, t.details]);
    const coSo = new Set(so(nguon).flatMap((x) => [x, String(Number(x))]));
    const la = [...so(d.tieuDe ?? ""), ...so(d.moTa ?? "")].filter((x) => !coSo.has(x) && !coSo.has(String(Number(x))));
    const loi = [];
    if (la.length) loi.push(`số không có trong tin gốc: ${[...new Set(la)].join(", ")}`);
    if (!d.tieuDe || d.tieuDe.length < 30 || d.tieuDe.length > 100) loi.push("tiêu đề phải 30–100 ký tự");
    if (d.tieuDe && d.tieuDe === d.tieuDe.toUpperCase()) loi.push("tiêu đề viết hoa toàn bộ");
    if (/(0\d{9}|https?:\/\/|www\.)/.test(`${d.tieuDe} ${d.moTa}`)) loi.push("có số điện thoại / đường dẫn");
    // TRƯỜNG LẤY TỪ MÔ TẢ: số phải có trong chữ gốc; chữ (hướng, pháp lý, tên đường…) phải xuất hiện trong chữ gốc
    const chuGoc = boDau(`${t.title} ${t.description ?? ""}`);
    const soChuGoc = new Set(so(chuGoc).flatMap((x) => [x, String(Number(x))]));
    const truong = {};
    const boQua = [];
    const phang = { ...(d.truong ?? {}), ...Object.fromEntries(Object.entries(d.truong?.specs ?? {}).map(([k, v]) => [`specs.${k}`, v])) };
    delete phang.specs;
    for (const [k, v] of Object.entries(phang)) {
      const g = String(v ?? "").trim();
      if (!g) continue;
      const soTrong = so(g);
      const dat = soTrong.length ? soTrong.every((x) => soChuGoc.has(x) || soChuGoc.has(String(Number(x)))) : chuGoc.includes(boDau(g).replace(/^(duong|huong)s+/, ""));
      if (dat) truong[k] = typeof v === "number" ? v : g; else boQua.push(k);
    }
    if (boQua.length) console.log(`  ${d.id.slice(0, 8)}: bỏ trường không thấy trong chữ gốc: ${boQua.join(", ")}`);
    if (loi.length) { console.log(`✗ ${d.id.slice(0, 8)}: ${loi.join(" · ")}`); continue; }
    await ghiDetails(t.id, { ...t.details, deXuat: { ...(t.details?.deXuat ?? {}), tieuDe: d.tieuDe.trim(), moTa: (d.moTa ?? "").trim(), ...(Object.keys(truong).length ? { truong } : {}) } });
    console.log(`✓ ${d.id.slice(0, 8)}: đã ghi đề xuất`);
  }
} else {
  console.log("Dùng: --cham-anh | --liet-ke | --ghi <tệp.json>");
}
