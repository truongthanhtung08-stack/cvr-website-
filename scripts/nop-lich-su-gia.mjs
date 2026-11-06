// ════════════════════════════════════════════════════════════════════════════
// TỰ NỘP LỊCH SỬ GIÁ — máy tự nộp, không ai gõ mã (chủ dự án duyệt 22/10/2026 — SEO/GUI-CLAUDE-CODE/LICH-SU-GIA-22102026.md mục 10)
//
//   node scripts/nop-lich-su-gia.mjs
//
// Cowork chỉ việc lưu tệp D:/Coastal Land/SEO/DA-DUYET/<ngày>/lich-su-gia-<ngày>.csv. Máy (lịch Windows mỗi giờ
// "CoastalLand-NopLichSuGia") thấy tệp MỚI hoặc VỪA SỬA → gửi lên /api/chi-so-gia/nop (bổ sung, KHÔNG làm mới) → web tự
// kiểm → ghi kết quả vào ket-qua-nop.txt cùng thư mục + một dòng vào mục 0 của SEO/RA/VIEC.md.
// Mã nộp lấy từ .env.local (MA_NOP_SO_LIEU) — không in ra, không ghi vào tệp nào Cowork đọc.
// Chi phí: chỉ gọi web khi có tệp mới/sửa (vài lần mỗi tuần) — không đáng kể trong gói Vercel Pro.
// ════════════════════════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";

const GOC = path.resolve(import.meta.dirname, "..");
const SEO = "D:/Coastal Land/SEO";
const DA_DUYET = path.join(SEO, "DA-DUYET");
const TEP_VIEC = path.join(SEO, "RA", "VIEC.md");
const WEB = "https://coastalland.vn/api/chi-so-gia/nop";

const env = Object.fromEntries(
  fs.readFileSync(path.join(GOC, ".env.local"), "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const MA = env.MA_NOP_SO_LIEU;
if (!MA) { console.log("Thiếu MA_NOP_SO_LIEU trong .env.local — không nộp."); process.exit(0); }
if (!fs.existsSync(DA_DUYET)) { console.log("Không có thư mục DA-DUYET."); process.exit(0); }

const gio = () => new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false });
const ddmm = (() => { const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0"); })();

// Ghi một dòng vào mục 0 của VIEC.md (mục 0 có ngày hôm nay thì lượt 6:30 giữ lại; chưa có thì tạo mục 0 ngắn).
function ghiMuc0(dong) {
  if (!fs.existsSync(TEP_VIEC)) return;
  let v = fs.readFileSync(TEP_VIEC, "utf8");
  const a = v.indexOf("## 0. ");
  const b = v.indexOf("## 1. COWORK");
  if (a >= 0 && b > a && v.slice(a, v.indexOf("\n", a)).includes(ddmm)) {
    v = v.slice(0, b).trimEnd() + "\n" + dong + "\n\n" + v.slice(b);
  } else if (b >= 0) {
    v = v.slice(0, b) + `## 0. KẾT QUẢ NỘP LỊCH SỬ GIÁ — ${ddmm}\n${dong}\n\n` + v.slice(b);
  } else v = v.trimEnd() + `\n\n## 0. KẾT QUẢ NỘP LỊCH SỬ GIÁ — ${ddmm}\n${dong}\n`;
  fs.writeFileSync(TEP_VIEC, v);
}

// Danh sách còn thiếu cho Cowork: lượt sáng 6:30 xuất; máy bật muộn (lượt sáng chưa chạy) thì lượt nộp đầu tiên trong ngày
// xuất bù — mỗi ngày tối đa 1 lần gọi web.
const TEP_THIEU = path.join(SEO, "RA", "lich-su-gia-con-thieu.csv");
const ngayVn = (ms) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10);
if (!fs.existsSync(TEP_THIEU) || ngayVn(fs.statSync(TEP_THIEU).mtimeMs) !== ngayVn(Date.now())) {
  try {
    const r = await fetch(`https://coastalland.vn/api/chi-so-gia/con-thieu?ma=${encodeURIComponent(MA)}`);
    if (r.ok) {
      fs.writeFileSync(TEP_THIEU, Buffer.from(await r.arrayBuffer()));
      ghiMuc0(`- **Lịch sử giá — danh sách còn thiếu đã làm mới** (${gio()}): \`SEO\\RA\\lich-su-gia-con-thieu.csv\`.`);
      console.log(`${gio()} — đã làm mới danh sách còn thiếu.`);
    }
  } catch { /* mạng lỗi → giờ sau thử lại */ }
}

// MÁY TỰ NHẬN TỆP (chủ dự án 23/10/2026: "cái này thì bạn phải làm chứ") — Cowork lưu ở đâu trong SEO\VAO hay SEO\DA-DUYET
// (gốc hoặc thư mục ngày), tên gì, .csv hay .xlsx đều được. Nhận ra bằng NỘI DUNG: .csv có cột gia_m2_trieu + ky (đúng khuôn
// tệp nộp); .xlsx (không đọc được đầu cột ở đây) thì tên có "lịch sử giá" — web vẫn tự kiểm từng dòng.
const boDau = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
function laTepLichSuGia(tep, ten) {
  if (ten.startsWith(".") || /^ket-qua/i.test(ten)) return false;
  if (/\.xlsx$/i.test(ten)) return /lich.?su.?gia/.test(boDau(ten));
  if (!/\.csv$/i.test(ten)) return false;
  const dau = fs.readFileSync(tep, "utf8").slice(0, 2000).toLowerCase();
  return dau.includes("gia_m2_trieu") && /(^|[;,\n])ky([;,\r\n]|$)/.test(dau);
}
function timTep() {
  const ra = [];
  for (const goc of [DA_DUYET, path.join(SEO, "VAO")]) {
    if (!fs.existsSync(goc)) continue;
    for (const thuMuc of [goc, ...fs.readdirSync(goc).map((x) => path.join(goc, x)).filter((x) => fs.statSync(x).isDirectory())]) {
      for (const ten of fs.readdirSync(thuMuc)) {
        const tep = path.join(thuMuc, ten);
        if (fs.statSync(tep).isFile() && laTepLichSuGia(tep, ten)) ra.push({ thuMuc, ten });
      }
    }
  }
  return ra;
}

let soTep = 0;
{
  for (const { thuMuc, ten } of timTep()) {
    const tep = path.join(thuMuc, ten);
    const dau = `${fs.statSync(tep).mtimeMs}|${fs.statSync(tep).size}`;
    const tepDau = path.join(thuMuc, `.da-nop-${ten}.txt`);
    // Đã nộp đúng bản này rồi → bỏ qua (sửa tệp → mtime đổi → nộp lại)
    if (fs.existsSync(tepDau) && fs.readFileSync(tepDau, "utf8").trim() === dau) continue;
    soTep++;
    let ketQua;
    try {
      const form = new FormData();
      form.set("ma", MA);
      form.set("tep", new Blob([fs.readFileSync(tep)], { type: /\.xlsx$/i.test(ten) ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv" }), ten);
      const r = await fetch(WEB, { method: "POST", body: form });
      ketQua = { ...(await r.json().catch(() => ({ ok: false, loi: `Web trả mã ${r.status}` }))), traLoi: true };
    } catch (e) {
      ketQua = { ok: false, loi: `Không gửi được (mạng): ${e instanceof Error ? e.message : e}` };
    }
    const dongLoi = (ketQua.dongLoi ?? []).map((x) => `  dòng ${x.dong}: ${x.ly}`);
    const chan = (ketQua.chan ?? []).map((x) => `  chặn dãy ${x.day}: ${x.ly}`);
    const bao = [
      `NỘP LÚC ${gio()} — ${ten}`,
      ketQua.ok
        ? `Nhận ${ketQua.nhan} dãy · ${ketQua.moc} mốc giá · kho web có ${ketQua.tongDay} dãy.`
        : `KHÔNG NHẬN: ${ketQua.loi ?? "lỗi không rõ"}`,
      ...(dongLoi.length ? ["Dòng bị từ chối (sửa rồi lưu đè tệp, máy nộp lại):", ...dongLoi] : []),
      ...(chan.length ? ["Dãy bị chặn vì giá nhảy quá gấp đôi / rơi quá nửa giữa hai quý (kiểm lại nguồn):", ...chan] : []),
      "",
    ].join("\n");
    fs.appendFileSync(path.join(thuMuc, "ket-qua-nop.txt"), bao + "\n");
    ghiMuc0(`- **Lịch sử giá — máy đã nộp** \`${ten}\` (${gio()}): ${ketQua.ok ? `nhận ${ketQua.nhan} dãy, ${ketQua.moc} mốc` : "KHÔNG nhận"}${dongLoi.length ? ` · ${dongLoi.length} dòng bị từ chối` : ""}${chan.length ? ` · ${chan.length} dãy bị chặn` : ""} — chi tiết \`${path.join("SEO", path.relative(SEO, thuMuc), "ket-qua-nop.txt").replace(/\//g, "\\")}\`.`);
    // Đánh dấu "đã nộp" khi web đã trả lời (nhận hay từ chối đều có lý do — sửa tệp thì máy nộp lại); lỗi mạng thì giờ sau thử lại.
    if (ketQua.traLoi) fs.writeFileSync(tepDau, dau);
    console.log(bao);
  }
}
if (!soTep) console.log(`${gio()} — không có tệp lịch sử giá mới.`);
