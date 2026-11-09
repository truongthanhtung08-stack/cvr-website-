// ĐỌC BẢNG TỪ KHOÁ LÕI (máy chủ / máy anh — dùng zlib của Node) — MỘT LUẬT cho Admin → Từ khoá lõi (tải tệp) và scripts/nap-tu-khoa.ts.
// Sheet "Từ khoá lõi" của HE-THONG-TU-KHOA.xlsx; chỉ dòng có "x" ở cột "Lên web", mục đích Bán / Cho thuê. LUẬT AN TOÀN (anh 09/11/2026):
//   · dòng ưu tiên "1 · Đang top" → không đổi chữ (trang đang lên Google giữ nguyên);
//   · chữ lõi mới TRÙNG chữ lõi loại hình khác cùng mục đích + tỉnh (vd Nhà riêng → "Bán nhà" = nhóm Nhà) → không đổi;
//   · trang TRANG_TOP / TRANG_DONG_BANG còn được chặn lần nữa ở pseo.ts lúc vẽ.
import zlib from "node:zlib";
import { saleCategories, rentCategories, nhomPseo, type Category } from "@/lib/categories";

export type TuKhoaLoiTrang = Record<string, { loi?: string; longtail?: string }>;
export type KetQuaDocBang = { trang: TuKhoaLoiTrang; doi: { trang: string; cu: string; moi: string }[]; giu: string[]; soDong: number };

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

function docSheet(buf: Buffer, tenSheet: string): string[][] {
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
const macDinh = (muc: string, slug: string) => { const c = tatCaLoai(muc).find((x) => x.slug === slug); return c ? c.tuKhoa ?? c.h1 : null; };

export function docBangTuKhoaLoi(buf: Buffer): KetQuaDocBang {
  const bang = docSheet(buf, "Từ khoá lõi");
  const dau = bang[0] ?? [];
  const i = (ten: string) => { const k = dau.findIndex((h) => (h ?? "").startsWith(ten)); if (k < 0) throw new Error(`Sheet "Từ khoá lõi" thiếu cột "${ten}"`); return k; };
  const C = { uu: i("Ưu tiên"), noi: i("Địa điểm"), loi: i("LÕI GỌN"), lt: i("LONGTAIL"), trang: i("Trang lõi"), len: i("Lên web") };
  type Dong = { trang: string; muc: string; slug: string; tinh: string; loi: string; longtail: string; uu: string };
  const chon: Dong[] = [];
  const giu: string[] = [];
  for (const r of bang.slice(1)) {
    if ((r[C.len] ?? "").trim().toLowerCase() !== "x") continue;
    const m = (r[C.trang] ?? "").trim().match(/^\/(mua-ban|cho-thue)\/([^/]+)\/([^/\s]+)$/);
    if (!m) continue; // Dự án / Tin tức / Tra cứu: web chưa có trang <loại>/<tỉnh>
    // TRÙNG TRANG (anh 09/11/2026: "nhập trùng thì chỉ lấy 1"): một trang lõi nhiều dòng → lấy dòng đứng trước trong bảng
    if (chon.some((x) => x.trang === m[0])) { giu.push(`${m[0]}: dòng trùng trang — lấy dòng đứng trước`); continue; }
    const noi = (r[C.noi] ?? "").trim();
    chon.push({ trang: m[0], muc: m[1] === "mua-ban" ? "ban" : "thue", slug: m[2], tinh: m[3],
      loi: (r[C.loi] ?? "").trim().replace(new RegExp(`\\s+${noi.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), ""),
      longtail: (r[C.lt] ?? "").trim(), uu: (r[C.uu] ?? "").trim() });
  }
  const trang: TuKhoaLoiTrang = {};
  const doi: KetQuaDocBang["doi"] = [];
  // TRÙNG CHỮ LÕI (cùng mục đích + tỉnh): MỘT chữ chỉ một trang mang. Trang vốn mang chữ đó (mặc định web) giữ; không có thì dòng đứng
  // trước trong bảng nhận, trang sau giữ chữ cũ — hai trang một tiêu đề thì Google chỉ chọn một.
  const dangMang = new Map<string, string>(); // `${muc}|${tinh}|${chữ}` → slug đang mang
  const khoa = (muc: string, tinh: string, chu: string) => `${muc}|${tinh}|${chu}`;
  for (const d of chon) for (const c of tatCaLoai(d.muc)) dangMang.set(khoa(d.muc, d.tinh, c.tuKhoa ?? c.h1), c.slug);
  for (const d of chon) {
    const cu = macDinh(d.muc, d.slug) ?? "";
    const muc: { loi?: string; longtail?: string } = d.longtail ? { longtail: d.longtail } : {};
    if (d.loi && d.loi !== cu) {
      const chu = dangMang.get(khoa(d.muc, d.tinh, d.loi));
      if (d.uu.startsWith("1")) giu.push(`${d.trang}: giữ "${cu}" (trang đang top)`);
      else if (chu && chu !== d.slug) giu.push(`${d.trang}: giữ "${cu}" ("${d.loi}" đã thuộc trang /${d.muc === "ban" ? "mua-ban" : "cho-thue"}/${chu}/${d.tinh})`);
      else { muc.loi = d.loi; doi.push({ trang: d.trang, cu, moi: d.loi }); dangMang.set(khoa(d.muc, d.tinh, d.loi), d.slug); }
    }
    if (muc.loi || muc.longtail) trang[d.trang] = muc;
  }
  return { trang, doi, giu, soDong: chon.length };
}
