// ============================================================================
// SINH DANH MỤC ĐƠN VỊ HÀNH CHÍNH HAI HỆ — src/lib/provincesNew.ts + provincesOld.ts
//
// Nguồn: data/diachimoi.json của github.com/mahiepit/DiaChiMoi (MIT), dựng từ
//   · hệ MỚI: thanglequoc/vietnamese-provinces-database v5.2.0 — danh mục Tổng cục
//     Thống kê (danhmuchanhchinh.gso.gov.vn), cập nhật tới NQ 388/NQ-UBTVQH16 (20/09/2026)
//   · hệ CŨ + bảng sáp nhập: tranngocminhhieu/vietnamadminunits — GSO + sapnhap.bando.com.vn
// Số chính thức phải ra: mới 34 tỉnh · 3.321 xã; cũ 63 tỉnh · 696 huyện · 10.035 xã.
// Script DỪNG nếu số lệch.
//
//   curl -L -o <thư mục>/diachimoi.json https://raw.githubusercontent.com/mahiepit/DiaChiMoi/main/data/diachimoi.json
//   node scripts/sinh-don-vi-hanh-chinh.mjs <thư mục>/diachimoi.json
// ============================================================================
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const J = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

// Bản ĐANG DÙNG (đọc trước khi ghi đè) — để giữ các TÊN CŨ HƠN: phường/xã đã gộp trong
// đợt 2023–2025 nên không còn trong danh mục 30/06/2025 ("An Hải Tây" → nay Phường An Hải),
// mà người đăng tin vẫn quen ghi. Không giữ thì tin ghi tên đó bị đổi hệ SAI.
const docMang = (f) => {
  const s = fs.readFileSync(path.join(ROOT, f), "utf8");
  return JSON.parse(s.slice(s.indexOf("= [") + 2).replace(/;\s*$/, ""));
};
const OLD_TRUOC = docMang("src/lib/provincesOld.ts");
const NEW_TRUOC = docMang("src/lib/provincesNew.ts");
const T = J.types; // ["Tỉnh","Thành phố","Quận","Huyện","Thị xã","Phường","Xã","Thị trấn","Đặc khu"]

// Cách bỏ dấu web đang dùng: "Hòa", "Thủy" (không "Hoà", "Thuỷ"). Chỉ đổi khi vần đứng cuối
// âm tiết, và không đụng "qu" (Quý, Quỳ là đúng). Dấu nháy trong tên Tây Nguyên: "’".
const DAU = { "oà": "òa", "oá": "óa", "oả": "ỏa", "oã": "õa", "oạ": "ọa", "oè": "òe", "oé": "óe", "oẻ": "ỏe", "oẽ": "õe", "oẹ": "ọe", "uỳ": "ùy", "uý": "úy", "uỷ": "ủy", "uỹ": "ũy", "uỵ": "ụy" };
const chu = (s) =>
  String(s).normalize("NFC").trim().replace(/\s+/g, " ").replace(/'/g, "’")
    .replace(/(?<![qQ])(o[àáảãạèéẻẽẹ]|u[ỳýỷỹỵ])(?![a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])/gi, (m) => {
      const r = DAU[m.toLowerCase()];
      return !r ? m : m[0] === m[0].toUpperCase() ? r[0].toUpperCase() + r.slice(1) : r;
    });
const khoa = (s) => chu(s).toLowerCase();

// ── HỆ MỚI ──────────────────────────────────────────────────────────────────
const tenTinhMoi = new Map(J.np.map((p) => [p[0], chu(p[1])]));
const phuongMoi = new Map(); // mã → { tinh, i }
const provincesNew = J.np.map((p) => {
  const wards = J.nw.filter((w) => w[1] === p[0]).map((w, i) => {
    phuongMoi.set(w[0], { tinh: p[0], i });
    return chu(`${T[w[3]]} ${w[2]}`);
  });
  return { name: chu(p[1]), wards };
});

// ── HỆ CŨ ───────────────────────────────────────────────────────────────────
// Tên tỉnh cũ giữ ĐÚNG cách web đã lưu trong tin ("TP. Hồ Chí Minh", "Thừa Thiên Huế").
const TEN_TINH_CU = { "Hồ Chí Minh": "TP. Hồ Chí Minh", "Huế": "Thừa Thiên Huế" };
// Bỏ tiền tố cấp cho gọn, GIỮ lại khi bỏ đi gây nhầm: tên là con số ("Quận 4", "Phường 12"),
// trùng tên cấp trên, hoặc hai đơn vị cùng cha trùng tên ("TP. Cao Lãnh" / "Huyện Cao Lãnh").
const tienTo = (t) => (t === "Thành phố" ? "TP." : t);
function datTen(ds, tenCha) {
  const dem = new Map();
  for (const x of ds) dem.set(khoa(x.ten), (dem.get(khoa(x.ten)) ?? 0) + 1);
  return ds.map((x) => {
    const giu = /^\d+$/.test(x.ten) || khoa(x.ten) === khoa(tenCha) || dem.get(khoa(x.ten)) > 1;
    return giu ? `${tienTo(x.cap)} ${x.ten}` : x.ten;
  });
}

// Khoá so tên: bỏ dấu, bỏ tiền tố cấp ("Phường 12" = "12", "Quận Hải Châu" = "Hải Châu").
const khongDau = (s) => chu(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
const khoaXa = (s) =>
  khongDau(s)
    .replace(/^(thanh pho|tp\.|thi xa|tx\.|quan|huyen|phuong|xa|thi tran|dac khu)\s+/, "")
    .replace(/\s*-\s*/g, "-") // "Phan Rang - Tháp Chàm" = "Phan Rang-Tháp Chàm"
    .replace(/[’']\s*/g, "'") // "Ia H’ Drai" = "Ia H'Drai"
    .replace(/^0+(\d)/, "$1");
const khoaLoi = (tinh, huyen) => `${khongDau(tinh)}|${khoaXa(huyen)}`;
// tên cũ hơn: "tỉnh|huyện" → [[tên phường cũ, tên phường mới]] (lấy từ bản đang dùng, kể cả `cu` của lần sinh trước)
const tenCuHon = new Map();
const daGiu = new Set();
const tinhMoiCuaTenWeb = new Map(J.op.map((p) => [TEN_TINH_CU[chu(p[1])] ?? chu(p[1]), tenTinhMoi.get(p[3])]));
for (const p of OLD_TRUOC) {
  const tinhMoi = NEW_TRUOC.find((x) => x.name === tinhMoiCuaTenWeb.get(p.name));
  for (const d of p.districts) {
    const k = khoaLoi(p.name, d.name);
    const ds = tenCuHon.get(k) ?? [];
    const dsMoi = tinhMoi?.wards ?? [];
    d.wards.forEach((w, i) => dsMoi[d.moi[i]] && ds.push([w, dsMoi[d.moi[i]]]));
    for (const [w, j] of d.cu ?? []) if (dsMoi[j]) ds.push([w, dsMoi[j]]);
    tenCuHon.set(k, ds);
  }
}

let soXaChia = 0;
const provincesOld = J.op.map((p) => {
  const goc = chu(p[1]);
  const ten = TEN_TINH_CU[goc] ?? goc;
  const maTinhMoi = p[3];
  const huyen = J.od.filter((d) => d[1] === p[0]);
  const tenHuyen = datTen(huyen.map((d) => ({ ten: chu(d[2]), cap: T[d[3]] })), goc);
  const districts = huyen.map((d, hi) => {
    const xa = J.ow.filter((w) => w[1] === d[0]);
    // Quận chỉ có PHƯỜNG — nguồn ghi nhầm "Xã 5", "Xã 15" ở quận Phú Nhuận (TP.HCM).
    const capXa = (w) => (T[d[3]] === "Quận" ? "Phường" : T[w[3]]);
    const wards = datTen(xa.map((w) => ({ ten: chu(w[2]), cap: capXa(w) })), chu(d[2]));
    const moi = [];
    const them = []; // xã cũ bị CHIA: [vị trí xã, chỉ số phường mới phụ]
    xa.forEach((w, wi) => {
      const ds = Array.isArray(w[4]) ? w[4] : [w[4]];
      if (ds.length > 1) soXaChia++;
      ds.forEach((ma, k) => {
        const m = phuongMoi.get(ma);
        if (!m || m.tinh !== maTinhMoi) throw new Error(`Xã ${w[2]} trỏ sang mã ${ma} không thuộc tỉnh mới`);
        if (k === 0) moi.push(m.i);
        else them.push([wi, m.i]);
      });
    });
    const out = { name: tenHuyen[hi], wards, moi };
    if (them.length) out.them = them;
    // TÊN CŨ HƠN của huyện này trong bản đang dùng → [tên, chỉ số phường mới].
    const loi = khoaLoi(ten, chu(d[2]));
    const coRoi = new Set(wards.map(khoaXa));
    const cu = [];
    for (const [ten, tenMoi] of tenCuHon.get(loi) ?? []) {
      if (coRoi.has(khoaXa(ten))) continue;
      const j = provincesNew.find((x) => x.name === tenTinhMoi.get(maTinhMoi))?.wards.findIndex((w) => khoaXa(w) === khoaXa(tenMoi)) ?? -1;
      if (j < 0) throw new Error(`Tên cũ ${ten} trỏ sang ${tenMoi} không còn trong danh mục mới`);
      cu.push([ten, j]);
      daGiu.add(`${loi}|${khoaXa(ten)}`);
    }
    if (cu.length) out.cu = cu;
    // Huyện đảo không có xã → nay là ĐẶC KHU (vd Bạch Long Vĩ, Cồn Cỏ).
    if (d[4]) out.dk = phuongMoi.get(d[4]).i;
    return out;
  });
  // HUYỆN CŨ HƠN đã giải thể trước 30/06/2025 (vd Đạ Tẻh nhập Đạ Huoai năm 2024): không
  // hiện trong ô chọn, chỉ giữ để tin ghi tên đó vẫn đổi hệ đúng.
  const dsMoiTinh = provincesNew.find((x) => x.name === tenTinhMoi.get(maTinhMoi))?.wards ?? [];
  const huyenCuHon = [];
  for (const [k, ds] of tenCuHon) {
    if (k.split("|")[0] !== khongDau(ten) || districts.some((d) => khoaLoi(ten, d.name) === k)) continue;
    const tenHuyen = OLD_TRUOC.find((p) => p.name === ten)?.districts.find((d) => khoaLoi(ten, d.name) === k)?.name ?? k;
    const cu = [];
    for (const [w, tenMoi] of ds) {
      const j = dsMoiTinh.findIndex((x) => khoaXa(x) === khoaXa(tenMoi));
      if (j >= 0 && !cu.some((c) => khoaXa(c[0]) === khoaXa(w))) cu.push([w, j]);
    }
    huyenCuHon.push({ name: tenHuyen, cu });
    daGiu.add(k);
  }
  return { name: ten, newName: tenTinhMoi.get(maTinhMoi), districts, ...(huyenCuHon.length ? { huyenCuHon } : {}) };
});

// ── KIỂM SỐ CHÍNH THỨC ──────────────────────────────────────────────────────
const so = {
  tinhMoi: provincesNew.length,
  xaMoi: provincesNew.reduce((a, p) => a + p.wards.length, 0),
  tinhCu: provincesOld.length,
  huyenCu: provincesOld.reduce((a, p) => a + p.districts.length, 0),
  xaCu: provincesOld.reduce((a, p) => a + p.districts.reduce((b, d) => b + d.wards.length, 0), 0),
  xaCuBiChia: soXaChia,
};
const DUNG = { tinhMoi: 34, xaMoi: 3321, tinhCu: 63, huyenCu: 696, xaCu: 10035 };
for (const [k, v] of Object.entries(DUNG)) if (so[k] !== v) throw new Error(`Lệch số chính thức: ${k} = ${so[k]}, phải ${v}`);
so.tenCuHonDaGiu = daGiu.size;
// Tên ở bản đang dùng mà KHÔNG còn chỗ nào nhận (huyện không còn trong danh mục) — in ra để soát.
const rot = [];
for (const [k, ds] of tenCuHon) {
  const tinh = k.split("|")[0];
  const conHuyen = provincesOld.some((p) => khongDau(p.name) === tinh && (p.districts.some((d) => khoaLoi(p.name, d.name) === k) || (p.huyenCuHon ?? []).length));
  if (!conHuyen) rot.push(`${k} (${ds.length} xã)`);
}
console.log(so);
if (rot.length) console.log("Huyện ở bản đang dùng không còn trong danh mục chính thức:", rot);

const NGAY = J.meta?.builtAt ?? "";
fs.writeFileSync(
  path.join(ROOT, "src/lib/provincesNew.ts"),
  `// ĐƠN VỊ HÀNH CHÍNH MỚI — sau sáp nhập 2025 (NQ 202/2025/QH15), cập nhật tới NQ 388/NQ-UBTVQH16 (20/09/2026).
// Cấu trúc 2 CẤP: Tỉnh/Thành phố → Phường/Xã/Đặc khu (KHÔNG còn Quận/Huyện).
// Nguồn: danh mục Tổng cục Thống kê qua thanglequoc/vietnamese-provinces-database v5.2.0 (gói DiaChiMoi ${NGAY}).
// Sinh tự động bằng scripts/sinh-don-vi-hanh-chinh.mjs — KHÔNG sửa tay.
// ${so.tinhMoi} tỉnh/thành · ${so.xaMoi} phường/xã/đặc khu.

export type ProvinceNew = { name: string; wards: string[] };

export const provincesNew: ProvinceNew[] = ${JSON.stringify(provincesNew.map(({ name, wards }) => ({ name, wards })))};
`,
);
fs.writeFileSync(
  path.join(ROOT, "src/lib/provincesOld.ts"),
  `// ĐƠN VỊ HÀNH CHÍNH CŨ — tình trạng ngày 30/06/2025 (trước sáp nhập), kèm ÁNH XẠ CHÍNH THỨC sang hệ mới.
// Nguồn: danh mục Tổng cục Thống kê + bảng sáp nhập sapnhap.bando.com.vn, qua tranngocminhhieu/vietnamadminunits
// (gói DiaChiMoi ${NGAY}). Sinh tự động bằng scripts/sinh-don-vi-hanh-chinh.mjs — KHÔNG sửa tay.
// ${so.tinhCu} tỉnh · ${so.huyenCu} quận/huyện · ${so.xaCu} phường/xã · ${so.xaCuBiChia} xã bị chia về nhiều xã mới.
//
// \`moi[i]\`  = CHỈ SỐ phường/xã mới (trong provincesNew[tỉnh mới].wards) nhận PHẦN CHÍNH của wards[i].
// \`them\`    = xã cũ bị CHIA: [i, chỉ số phường mới nhận phần còn lại].
// \`dk\`      = huyện đảo không có xã, nay là đặc khu (chỉ số trong provincesNew).
// \`cu\`      = TÊN CŨ HƠN (xã đã gộp trước 30/06/2025, vd "An Hải Tây"): [tên, chỉ số phường mới].
//              Không hiện trong ô chọn — chỉ để tin ghi tên đó vẫn đổi hệ đúng.
// \`huyenCuHon\` = huyện đã giải thể trước 30/06/2025 (vd Đạ Tẻh), cùng mục đích.
// TÊN: bỏ tiền tố cấp cho gọn ("Quận Hải Châu" → "Hải Châu"); giữ lại khi tên là con số
// ("Quận 4", "Phường 12"), trùng tên cấp trên, hoặc hai đơn vị cùng cha trùng tên.

export type DistrictOld = { name: string; wards: string[]; moi: number[]; them?: [number, number][]; dk?: number; cu?: [string, number][] };
export type ProvinceOld = { name: string; newName: string; districts: DistrictOld[]; huyenCuHon?: { name: string; cu: [string, number][] }[] };

export const provincesOld: ProvinceOld[] = ${JSON.stringify(provincesOld)};
`,
);
console.log("Đã ghi src/lib/provincesNew.ts và src/lib/provincesOld.ts");
