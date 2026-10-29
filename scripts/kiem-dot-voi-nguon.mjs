// ============================================================================
// KIỂM MỘT ĐỢT TIN VỚI TIN GỐC (quy trình 3 bên — bước 3, chủ dự án chốt 19/10/2026)
//   node scripts/kiem-dot-voi-nguon.mjs "D:/Coastal Land/SEO/DA-DUYET/17102026"
// Chỉ ĐỌC (không sửa bảng). Với từng dòng của Bang-*.xlsx: mở link `nguon` →
//   ① tin gốc còn hạn không (hết hạn / đã gỡ "không tồn tại")
//   ② so từng trường với bảng thông số tin gốc: giá, diện tích, PN, WC, hướng, hướng ban
//      công, số tầng, tầng số, ngang, dài, nội thất, diện tích sử dụng (sàn), pháp lý
// Không kiểm tiêu đề có giá / diện tích (được phép từ 23/10/2026). Cách xử lý kết quả: KE-HOACH-SEO.md mục 11, bước 2 (25/10/2026; gom từ CONG-VIEC-3-BEN.md 28/10/2026).
// Đọc được: Chợ Tốt (nhatot.com), muaban.net (thông số đầy đủ); homedy, bds123 (chỉ mô tả).
// Mỗi tin một lượt curl, nghỉ 0,7 giây — không chạm máy chủ web (không tốn Vercel/Supabase).
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const thuMuc = process.argv[2];
if (!thuMuc || !fs.existsSync(thuMuc)) { console.error('Thiếu thư mục đợt. VD: node scripts/kiem-dot-voi-nguon.mjs "D:/…/17102026"'); process.exit(1); }
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { docTinTuBang } = await jiti.import(ROOT + "/src/lib/csvTin.ts");
const { docXlsx } = await jiti.import(ROOT + "/src/lib/docXlsx.ts");
const { loaiConTheoLoiKhach } = await jiti.import(ROOT + "/src/lib/listingSpec.ts");
const tepBang = fs.readdirSync(thuMuc).find((f) => /^Bang-.*\.xlsx$/i.test(f));
if (!tepBang) { console.error("Không thấy Bang-*.xlsx"); process.exit(1); }
const kq = docTinTuBang(await docXlsx(new Uint8Array(fs.readFileSync(path.join(thuMuc, tepBang))).buffer));

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36";
const RE_ND = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/;
const tim = (o, d = 0) => { if (o && typeof o === "object") { if (o.body && o.title && d < 12) return o; for (const k in o) { const r = tim(o[k], d + 1); if (r) return r; } } };

// Đọc tin gốc → { ok, conHan, tt: { "Diện tích": "65 m²", … }, gia }
function docNguon(u) {
  if (!u) return { ok: false, ly: "không có link nguon" };
  let h = "";
  try { h = execFileSync("curl", ["-sL", "--compressed", "-A", UA, u], { maxBuffer: 5e7 }).toString(); }
  catch (e) { return { ok: false, ly: "không mở được: " + e.message }; }
  if (/không tồn tại/i.test(h) && !RE_ND.test(h)) return { ok: true, conHan: false, ly: "tin gốc không còn tồn tại" };
  try {
    if (/nhatot|chotot/.test(u)) {
      const j = JSON.parse(h.match(RE_ND)[1]);
      const info = j.props?.pageProps?.initialState?.adView?.adInfo;
      if (!info?.ad?.subject) return { ok: true, conHan: false, ly: "tin gốc không còn tồn tại" };
      const tt = Object.fromEntries(Object.values(info.ad_params || {}).map((x) => [x.label, x.value]));
      return { ok: true, conHan: !info.ad.status || info.ad.status === "active", ly: info.ad.status, tt, gia: info.ad.price_string, loiKhach: `${info.ad.subject} ${info.ad.body ?? ""}` };
    }
    if (/muaban/.test(u)) {
      const ad = tim(JSON.parse(h.match(RE_ND)[1]));
      if (!ad) return { ok: true, conHan: false, ly: "tin gốc không còn tồn tại" };
      const tt = Object.fromEntries((ad.parameters || []).map((x) => [x.label || x.name, String(x.value)]));
      return { ok: true, conHan: !(ad.is_expired || ad.is_outdate), ly: ad.is_expired ? "hết hạn" : "", tt, gia: ad.price_display, loiKhach: `${ad.title} ${ad.body ?? ""}` };
    }
    // homedy / bds123: chỉ đọc được ngày hết hạn trong trang
    const het = (h.replace(/<[^>]+>/g, " ").match(/Ngày hết hạn\s+(?:[^0-9]{0,12})?(\d{2})\/(\d{2})\/(\d{4})/) || []);
    const conHan = het.length ? new Date(`${het[3]}-${het[2]}-${het[1]}T23:59:59+07:00`) >= new Date() : true;
    return { ok: true, conHan, ly: het.length ? `hết hạn ${het[1]}/${het[2]}/${het[3]}` : "", tt: null };
  } catch (e) { return { ok: false, ly: "đọc lỗi: " + e.message }; }
}

const so = (s) => { if (s == null) return null; const m = String(s).replace(/\./g, "").replace(",", ".").match(/[\d.]+/); return m ? +m[0] : null; };
const giaVnd = (s) => { const n = so(s); return n == null ? null : /tỷ/.test(s) ? n * 1e9 : /triệu/.test(s) ? n * 1e6 : n; };
const kd = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

let soLech = 0, soHetHan = 0;
for (const r of kq.rows) {
  const p = r.payload, d = p.details ?? {}, sp = d.specs ?? {};
  const ng = docNguon(d.nguonTin);
  await new Promise((ok) => setTimeout(ok, 700));
  const lech = [];
  if (!ng.ok) lech.push(`⚠ ${ng.ly}`);
  else if (!ng.conHan) { lech.push(`⛔ ${ng.ly || "tin gốc hết hạn"} → BỎ khỏi đợt`); soHetHan++; }
  if (ng.tt) {
    const t = ng.tt;
    const chk = (ten, a, b, f = (x, y) => x == y) => { if (b == null || b === "") return; if (!f(a, b)) lech.push(`${ten}: bảng=${a ?? "(trống)"} · gốc=${b}`); };
    chk("giá", p.price_vnd, giaVnd(ng.gia), (a, b) => Math.abs((a ?? 0) - b) < 1e3);
    chk("diện tích", p.area_m2, so(t["Diện tích đất"] ?? t["Diện tích"]), (a, b) => Math.abs((a ?? 0) - b) < 1);
    chk("PN", p.beds, so(t["Số phòng ngủ"]));
    chk("WC", p.baths, t["Số phòng vệ sinh"] && !/nhiều/i.test(t["Số phòng vệ sinh"]) ? so(t["Số phòng vệ sinh"]) : null);
    chk("hướng", d.direction, t["Hướng cửa chính"], (a, b) => kd(a) === kd(b));
    chk("số tầng", sp.floors, so(t["Tổng số tầng"]), (a, b) => so(a) == b);
    chk("tầng số", sp.floor, so(t["Tầng số"]), (a, b) => so(a) == b);
    chk("ngang", sp.frontage, so(t["Chiều ngang"]), (a, b) => so(a) == b);
    chk("dài", sp.depth, so(t["Chiều dài"]), (a, b) => so(a) == b);
    chk("nội thất", d.furnish, t["Tình trạng nội thất"], (a, b) => kd(a) === kd(b));
    chk("diện tích sàn", p.built_area_m2, so(t["Diện tích sử dụng"]), (a, b) => a == b);
  }
  // LỜI KHÁCH THẮNG Ô THÔNG SỐ TRANG NGUỒN (chủ dự án 29/10/2026) — cùng luật với bước nạp (listingSpec.loaiConTheoLoiKhach):
  // khách viết trong tin gốc (tiêu đề, mô tả) là loại khác ô đang ghi → sửa theo lời khách.
  if (ng.loiKhach) for (const k of ["landType", "loaiCanho"]) {
    const dung = sp[k] && loaiConTheoLoiKhach(k, sp[k], ng.loiKhach);
    if (dung) lech.push(`loại con: bảng=${sp[k]} · lời khách ở tin gốc → ${dung} (theo LỜI KHÁCH, không theo ô trang nguồn)`);
  }
  if (lech.length) soLech++;
  console.log(`${r.maAnh} · ${p.type} · ${lech.length ? lech.join(" ; ") : "khớp"}`);
}
console.log(`\n${kq.rows.length} tin · ${soLech} tin cần xem · ${soHetHan} tin gốc hết hạn/đã gỡ`);
console.log("Lệch so với ô thông số trang nguồn chỉ là gợi ý: đúng là LỜI NGƯỜI BÁN viết — bảng khớp lời người bán thì không báo; lệch lời người bán thì Claude sửa luôn, báo \"đã sửa\".");
