// ĐỌC BẢNG TỪ KHOÁ LÕI (máy chủ / máy anh — dùng zlib của Node) — MỘT LUẬT cho Admin → Từ khoá lõi (tải tệp) và scripts/nap-tu-khoa.ts.
// Sheet "Từ khoá lõi" của HE-THONG-TU-KHOA.xlsx; chỉ dòng có "x" ở cột "Lên web", mục đích Bán / Cho thuê. LUẬT AN TOÀN (anh 09/11/2026):
//   · dòng ưu tiên "1 · Đang top" → không đổi chữ (trang đang lên Google giữ nguyên);
//   · chữ lõi mới TRÙNG chữ lõi loại hình khác cùng mục đích + tỉnh (vd Nhà riêng → "Bán nhà" = nhóm Nhà) → không đổi;
//   · trang TRANG_TOP / TRANG_DONG_BANG còn được chặn lần nữa ở pseo.ts lúc vẽ.
import zlib from "node:zlib";
import { saleCategories, rentCategories, nhomPseo, type Category } from "@/lib/categories";
import { giuSoCu } from "@/lib/pseo";
import type { ThuongHieu } from "@/lib/thuongHieu";

// loiCon: chữ lõi CHỈ cho trang con (phường, giá, phòng ngủ…) khi chính trang lõi đang top / giữ bản cũ (12/11/2026)
export type TuKhoaLoiTrang = Record<string, { loi?: string; loiCon?: string; longtail?: string; uuTien?: true }>;
// DÒNG ĐẶC ĐIỂM (anh 13/11/2026: "một bảng kế hoạch, thống nhất Admin và web"): dòng tầng "Đặc điểm" của sheet — CHỈ để Admin theo dõi
// (longtail · đặc điểm · trang đích · trạng thái), KHÔNG đổi chữ nào trên web (chữ trên web chỉ đi theo LÕI GỌN của dòng có x).
export type DongKeHoach = { khuVuc: string; loaiHinh: string; loiGoc: string; loTrinh: string; tang: string; muc: "ban" | "thue"; noi: string; loi: string; longtail: string; dacDiem: string; nhom: string; google: number; soTin: number; trang: string; xin: string; chon: boolean };
export type KetQuaDocBang = { trang: TuKhoaLoiTrang; doi: { trang: string; cu: string; moi: string }[]; giu: string[]; soDong: number; keHoach: DongKeHoach[] };

function moZip(buf: Buffer): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  let e = buf.length - 22;
  while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error("Tệp không phải .xlsx");
  const n = buf.readUInt16LE(e + 10);
  let p = buf.readUInt32LE(e + 16);
  for (let i = 0; i < n; i++) {
    const cach = buf.readUInt16LE(p + 10), nen = buf.readUInt32LE(p + 20);
    const lt = buf.readUInt16LE(p + 28), lx = buf.readUInt16LE(p + 30), lc = buf.readUInt16LE(p + 32);
    const goc = buf.readUInt32LE(p + 42);
    const ten = buf.toString("utf8", p + 46, p + 46 + lt);
    const dl = goc + 30 + buf.readUInt16LE(goc + 26) + buf.readUInt16LE(goc + 28);
    const raw = buf.subarray(dl, dl + nen);
    out.set(ten, cach === 8 ? zlib.inflateRawSync(raw) : raw);
    p += 46 + lt + lx + lc;
  }
  return out;
}
const giaiXml = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

export function docSheet(buf: Buffer, tenSheet: string): string[][] {
  const zip = moZip(buf);
  const doc = (n: string) => zip.get(n)?.toString("utf8") ?? "";
  const chung = [...doc("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => giaiXml([...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1]).join("")));
  const wb = doc("xl/workbook.xml"), rels = doc("xl/_rels/workbook.xml.rels");
  const the = [...wb.matchAll(/<sheet\b[^>]*>/g)].map((m) => m[0]).find((t) => giaiXml(t.match(/name="([^"]*)"/)?.[1] ?? "") === tenSheet);
  const rid = the?.match(/r:id="([^"]+)"/)?.[1];
  const quanHe = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => m[0]).find((t) => t.includes(`Id="${rid}"`));
  const dich = quanHe?.match(/Target="([^"]+)"/)?.[1];
  if (!dich) throw new Error(`Không thấy sheet "${tenSheet}"`);
  const sheet = doc("xl/" + dich.replace(/^\/?xl\//, ""));
  const cot = (r: string) => [...r].reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  return [...sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((m) => {
    const dong: string[] = [];
    for (const c of m[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const v = c[3]?.match(/<v>([^<]*)<\/v>/)?.[1] ?? [...(c[3] ?? "").matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1]).join("");
      dong[cot(c[1])] = /t="s"/.test(c[2]) ? chung[+v] ?? "" : giaiXml(v);
    }
    return dong;
  });
}

const tatCaLoai = (muc: string): Category[] => (muc === "ban" ? [...saleCategories, ...nhomPseo("ban")] : [...rentCategories, ...nhomPseo("thue")]);
const macDinh = (muc: string, slug: string) => { if (!slug) return muc === "ban" ? "Bán nhà đất" : "Cho thuê nhà đất"; const c = tatCaLoai(muc).find((x) => x.slug === slug); return c ? c.tuKhoa ?? c.h1 : null; };

export function docBangTuKhoaLoi(buf: Buffer): KetQuaDocBang {
  const bang = docSheet(buf, "Từ khoá lõi");
  const dau = bang[0] ?? [];
  const i = (ten: string) => { const k = dau.findIndex((h) => (h ?? "").startsWith(ten)); if (k < 0) throw new Error(`Sheet "Từ khoá lõi" thiếu cột "${ten}"`); return k; };
  const C = { uu: i("Ưu tiên"), noi: i("Địa điểm"), loi: i("LÕI GỌN"), lt: i("LONGTAIL"), trang: i("Trang lõi"), len: i("Lên web"),
    tang: dau.findIndex((h) => (h ?? "").trim() === "Tầng") }; // cột Tầng (Tỉnh / Cha / Con) — có thể chưa có
  type Dong = { trang: string; muc: string; slug: string; tinh: string; loi: string; longtail: string; uu: string; cha: boolean; giu?: boolean };
  const chon: Dong[] = [];
  const giu: string[] = [];
  for (const r of bang.slice(1)) {
    if ((r[C.len] ?? "").trim().toLowerCase() !== "x") continue;
    // Trang lõi: /mua-ban|cho-thue/<loại>/<tỉnh> hoặc tầng tỉnh /mua-ban|cho-thue/<tỉnh> ("Bán nhà đất Đà Nẵng" — slug loại = "")
    const m0 = (r[C.trang] ?? "").trim().match(/^\/(mua-ban|cho-thue)\/([^/\s]+)(?:\/([^/\s]+))?$/);
    if (!m0) continue; // Dự án / Tin tức / Tra cứu: web chưa có trang <loại>/<tỉnh>
    const m = m0[3] ? [m0[0], m0[1], m0[2], m0[3]] : [m0[0], m0[1], "", m0[2]];
    if (giuSoCu(m[0])) giu.push(`${m[0]}: giữ nguyên (trang đang top / giữ bản Google đã đọc) — trang con dùng chữ lõi mới`);
    // TRÙNG TRANG (anh 09/11/2026: "nhập trùng thì chỉ lấy 1"): một trang lõi nhiều dòng → lấy dòng đứng trước trong bảng
    if (chon.some((x) => x.trang === m[0])) { giu.push(`${m[0]}: dòng trùng trang — lấy dòng đứng trước`); continue; }
    const noi = (r[C.noi] ?? "").trim();
    chon.push({ trang: m[0], muc: m[1] === "mua-ban" ? "ban" : "thue", slug: m[2], tinh: m[3],
      loi: (r[C.loi] ?? "").trim().replace(new RegExp(`\\s+${noi.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), ""),
      longtail: (r[C.lt] ?? "").trim(), uu: (r[C.uu] ?? "").trim(), cha: C.tang < 0 || (r[C.tang] ?? "").trim().startsWith("Cha"), giu: giuSoCu(m[0]) });
  }
  const trang: TuKhoaLoiTrang = {};
  const doi: KetQuaDocBang["doi"] = [];
  // TRÙNG CHỮ LÕI (cùng mục đích + tỉnh): MỘT chữ chỉ một trang mang. Trang vốn mang chữ đó (mặc định web) giữ; không có thì dòng đứng
  // trước trong bảng nhận, trang sau giữ chữ cũ — hai trang một tiêu đề thì Google chỉ chọn một.
  const dangMang = new Map<string, string>(); // `${muc}|${tinh}|${chữ}` → slug đang mang
  const khoa = (muc: string, tinh: string, chu: string) => `${muc}|${tinh}|${chu}`;
  for (const d of chon) for (const c of tatCaLoai(d.muc)) dangMang.set(khoa(d.muc, d.tinh, c.tuKhoa ?? c.h1), c.slug);
  for (const d of chon) dangMang.set(khoa(d.muc, d.tinh, macDinh(d.muc, "")!), ""); // tầng tỉnh "Bán nhà đất"
  for (const d of chon) {
    const cu = macDinh(d.muc, d.slug) ?? "";
    const muc: { loi?: string; loiCon?: string; longtail?: string; uuTien?: true } = d.longtail && !d.giu ? { longtail: d.longtail } : {};
    // Trang lõi đang top / giữ bản cũ: chính trang giữ chữ cũ, chỉ lưu chữ lõi cho trang con
    if (d.giu || d.uu.startsWith("1")) { if (d.loi && d.loi !== cu) muc.loiCon = d.loi; if (muc.loiCon) trang[d.trang] = muc; continue; }
    if (d.loi && d.loi !== cu) {
      const chu = dangMang.get(khoa(d.muc, d.tinh, d.loi));
      if (d.uu.startsWith("1")) giu.push(`${d.trang}: giữ "${cu}" (trang đang top)`);
      else if (chu !== undefined && chu !== d.slug) giu.push(`${d.trang}: giữ "${cu}" ("${d.loi}" đã thuộc trang /${d.muc === "ban" ? "mua-ban" : "cho-thue"}/${chu ? chu + "/" : ""}${d.tinh})`);
      else { muc.loi = d.loi; doi.push({ trang: d.trang, cu, moi: d.loi }); dangMang.set(khoa(d.muc, d.tinh, d.loi), d.slug); }
    }
    // LÕI ƯU TIÊN INDEX (anh 09/11/2026): dòng loại hình + tỉnh có x, ưu tiên 2–3 → khi trùng tin với trang con của nó, trang lõi được giữ
    // (pseo.ts bước ⑤). Dòng "1 · Đang top" không gắn — trang con đang lên Google giữ nguyên.
    if (d.slug && d.cha && /^[23]/.test(d.uu)) muc.uuTien = true; // chỉ loại CHA (anh 09/11/2026: SEO tập trung loại cha Nhà, Đất…)
    if (muc.loi || muc.loiCon || muc.longtail || muc.uuTien) trang[d.trang] = muc;
  }
  const j = (ten: string) => dau.findIndex((h) => (h ?? "").startsWith(ten));
  const K = { kv: j("Khu vực"), lh: j("Loại hình"), goc: j("Lõi gốc"), lo: j("Lộ trình"), muc: j("Mục đích"), dd: j("Đặc điểm"), nhom: j("Nhóm đặc điểm"), g: j("Google gợi ý"), tin: j("Tin"), xin: j("Xin index") };
  // MỌI dòng của bảng (lõi + đặc điểm) — Admin hiện đúng từng dòng của file kèm trạng thái thật trên web (anh 13/11/2026:
  // "đồng bộ file này lên Admin, hiển thị để tôi quản lý được — link nào đã index, chưa index")
  const keHoach: DongKeHoach[] = C.tang < 0 || K.dd < 0 ? [] : bang.slice(1)
    .filter((r) => (r[C.lt] ?? "").trim() || (r[C.loi] ?? "").trim())
    .map((r) => ({
      khuVuc: K.kv < 0 ? "" : (r[K.kv] ?? "").trim(), loaiHinh: K.lh < 0 ? "" : (r[K.lh] ?? "").trim(), loiGoc: K.goc < 0 ? "" : (r[K.goc] ?? "").trim(),
      loTrinh: K.lo < 0 ? "" : (r[K.lo] ?? "").trim(), tang: (r[C.tang] ?? "").trim(),
      muc: (r[K.muc] ?? "").includes("thuê") ? "thue" : "ban", noi: (r[C.noi] ?? "").trim(), loi: (r[C.loi] ?? "").trim(), longtail: (r[C.lt] ?? "").trim() || (r[C.loi] ?? "").trim(),
      dacDiem: (r[K.dd] ?? "").trim(), nhom: K.nhom < 0 ? "" : (r[K.nhom] ?? "").trim(), google: Number(r[K.g] ?? 0) || 0, soTin: Number(r[K.tin] ?? 0) || 0,
      trang: (r[C.trang] ?? "").trim(), xin: K.xin < 0 ? "" : (r[K.xin] ?? "").trim(),
      chon: (r[C.len] ?? "").trim().toLowerCase() === "x", // anh lọc bảng, đánh x ở "Lên web" = dòng đặc điểm đang làm (xin index / mở trang)
    }));
  return { trang, doi, giu, soDong: chon.length, keHoach };
}

// ── SHEET "THƯƠNG HIỆU" (anh 12/11/2026: "sheet riêng, nạp là lên luôn") ─────────────────────────────────────────────
// Cột: "Mục" · "Nội dung" · "Trả lời" (chỉ dòng Hỏi đáp). Mục: Tên · Câu thương hiệu 1 · Câu thương hiệu 2 · Định nghĩa (Việt) ·
// Định nghĩa (Anh) · Cách gõ khác (mỗi dòng một cách) · Kênh chính thức (mỗi dòng một link) · Hỏi đáp (mỗi dòng một câu).
// Không có sheet → null (web giữ bản mặc định src/lib/thuongHieu.ts). Thiếu Tên / Câu 1 / Câu 2 → báo lỗi, không nạp nửa vời.
export function docThuongHieu(buf: Buffer): { thuongHieu: Partial<ThuongHieu> | null; loi?: string } {
  let bang: string[][];
  try { bang = docSheet(buf, "Thương hiệu"); } catch { return { thuongHieu: null }; }
  const dau = (bang[0] ?? []).map((h) => (h ?? "").trim().toLowerCase());
  const cMuc = dau.findIndex((h) => h.startsWith("mục")), cNd = dau.findIndex((h) => h.startsWith("nội dung")), cTl = dau.findIndex((h) => h.startsWith("trả lời"));
  if (cMuc < 0 || cNd < 0) return { thuongHieu: null, loi: 'Sheet "Thương hiệu" thiếu cột "Mục" hoặc "Nội dung"' };
  const th: Partial<ThuongHieu> & { cachGo: string[]; kenh: string[]; hoiDap: { hoi: string; dap: string }[] } = { cachGo: [], kenh: [], hoiDap: [] };
  for (const r of bang.slice(1)) {
    const muc = (r[cMuc] ?? "").trim().toLowerCase(), nd = (r[cNd] ?? "").trim();
    if (!muc || !nd) continue;
    if (muc === "tên") th.ten = nd;
    else if (muc.startsWith("câu thương hiệu 1")) th.cau1 = nd;
    else if (muc.startsWith("câu thương hiệu 2")) th.cau2 = nd;
    else if (muc.startsWith("định nghĩa (việt")) th.dinhNghia = nd;
    else if (muc.startsWith("định nghĩa (anh")) th.dinhNghiaEn = nd;
    else if (muc.startsWith("cách gõ")) th.cachGo.push(nd);
    else if (muc.startsWith("kênh")) { if (/^https:\/\//.test(nd)) th.kenh.push(nd); }
    else if (muc.startsWith("hỏi đáp")) { const tl = cTl >= 0 ? (r[cTl] ?? "").trim() : ""; if (tl) th.hoiDap.push({ hoi: nd, dap: tl }); }
  }
  if (!th.ten || !th.cau1 || !th.cau2) return { thuongHieu: null, loi: 'Sheet "Thương hiệu" phải có đủ Tên, Câu thương hiệu 1, Câu thương hiệu 2' };
  return { thuongHieu: th };
}
