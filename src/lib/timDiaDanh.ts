// ============================================================================
// TÌM ĐỊA DANH THÔNG MINH — cho ô chọn Tỉnh/Thành · Quận/Huyện · Phường/Xã
// (chủ dự án 15/10/2026: "search tỉnh thành, phường xã phải thông minh").
//   · không dấu, viết tắt, dính liền: "q1" · "p12" · "tp hcm" · "haichau" · "P. An Hải"
//   · gõ TÊN CŨ ra TÊN MỚI (bietDanh): "Quảng Nam" → Đà Nẵng, "An Hải Tây" → Phường An Hải
//   · xếp hạng: trùng khớp → bắt đầu bằng → đầu từ → chứa → gõ thiếu/sai chữ
// ============================================================================

import { choCuCua, newProvinceOf, oldNamesOf, tenCuHonCua, type GeoMode } from "@/lib/locations";

const TIEN_TO = /^(thanh pho|tp|tinh|quan|q|huyen|h|thi xa|tx|phuong|p|xa|x|thi tran|tt|dac khu|dk)(?=[\s.\d]|$)\.?\s*/;

/** Chuẩn hoá để so: bỏ dấu, bỏ tiền tố cấp, bỏ dấu câu, số 0 đầu. */
export function chuanTim(s: string): string {
  let t = (s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d")
    .toLowerCase().replace(/[.,;:'’`"()]/g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
  t = t.replace(TIEN_TO, "").trim();
  return t.replace(/\b0+(\d)/g, "$1");
}

const lien = (s: string) => s.replace(/\s/g, "");

// Gõ thiếu/sai: các chữ của truy vấn xuất hiện ĐÚNG THỨ TỰ trong tên (bỏ khoảng trắng).
function theoThuTu(q: string, t: string): boolean {
  let i = 0;
  for (const ch of t) if (ch === q[i]) i++;
  return i === q.length;
}

function diem(q: string, t: string): number {
  if (!q) return 1;
  if (t === q) return 100;
  if (t.startsWith(q)) return 85;
  const tu = t.split(" ");
  const qtu = q.split(" ");
  // Mọi từ gõ đều là đầu một từ trong tên, đúng thứ tự: "ng h son" → "ngu hanh son"
  let j = 0;
  for (const w of tu) if (j < qtu.length && w.startsWith(qtu[j])) j++;
  if (j === qtu.length) return 70;
  if (t.includes(q)) return 55;
  // Chữ cái đầu: "dn" → Đà Nẵng / Đồng Nai, "nhs" → Ngũ Hành Sơn
  if (q.length >= 2 && !q.includes(" ") && tu.length >= 2 && tu.map((w) => w[0]).join("") === q) return 50;
  if (lien(t).includes(lien(q))) return 45;
  if (q.length >= 3 && theoThuTu(lien(q), lien(t))) return 20;
  return 0;
}

// CẤP mà người gõ nhắm tới, đọc từ tiền tố họ gõ: "q1", "quận 1", "h. Hòa Vang" → huyện;
// "p12", "phường 12", "x. Hòa Bắc" → xã. Không gõ tiền tố → không ưu tiên cấp nào.
type Cap = "huyen" | "xa" | "";
function capCua(raw: string): Cap {
  const t = (raw || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().trim();
  if (/^(quan|q|huyen|h|thi xa|tx)(?=[\s.\d]|$)/.test(t)) return "huyen";
  if (/^(phuong|p|xa|x|thi tran|tt|dac khu)(?=[\s.\d]|$)/.test(t)) return "xa";
  return "";
}
const lechCap = (q: Cap, t: Cap) => (q && t && q !== t ? -25 : q && t === q ? 10 : 0);

/** Tên khác: chuỗi (tên phường/xã cũ…) hoặc { ten, cap: "huyen" } cho tên quận/huyện cũ. */
export type BietDanh = string | { ten: string; cap: "huyen" };
export type KetQuaTim = { ten: string; boiTen?: string };

/**
 * Lọc + xếp `ds` theo truy vấn. `bietDanh[ten]` = các tên khác của mục đó (tên cũ, tên gọi
 * quen). Trúng qua tên khác thì kèm `boiTen` để hiện chữ nhỏ cho khách biết vì sao ra.
 */
export function timDiaDanh(q: string, ds: string[], bietDanh?: Record<string, BietDanh[]>): KetQuaTim[] {
  const cq = chuanTim(q);
  if (!cq) return ds.map((ten) => ({ ten }));
  const capQ = capCua(q);
  const kq: { ten: string; boiTen?: string; d: number; i: number }[] = [];
  ds.forEach((ten, i) => {
    let d = diem(cq, chuanTim(ten));
    if (d > 0) d += lechCap(capQ, capCua(ten));
    let boiTen: string | undefined;
    for (const b of bietDanh?.[ten] ?? []) {
      const tb = typeof b === "string" ? b : b.ten;
      const capB: Cap = typeof b === "string" ? capCua(b) : b.cap;
      let db = diem(cq, chuanTim(tb));
      if (db <= 0) continue;
      db += lechCap(capQ, capB) - 5;
      if (db > d) { d = db; boiTen = tb; }
    }
    if (d > 0) kq.push({ ten, boiTen, d, i });
  });
  // Có kết quả khớp rõ thì bỏ kết quả "dò thiếu chữ" — đỡ nhiễu ("hue" không kéo theo Hưng Yên).
  const tot = kq.some((x) => x.d >= 40);
  return kq
    .filter((x) => !tot || x.d >= 30)
    .sort((a, b) => b.d - a.d || a.i - b.i)
    .map(({ ten, boiTen }) => ({ ten, boiTen }));
}

// Tên gọi quen của tỉnh/thành (ngoài tên cũ trước sáp nhập).
export const TEN_GOI_TINH: Record<string, string[]> = {
  "Hồ Chí Minh": ["TP HCM", "TPHCM", "HCM", "Sài Gòn", "SG", "Thành phố Hồ Chí Minh"],
  "TP. Hồ Chí Minh": ["TP HCM", "TPHCM", "HCM", "Sài Gòn", "SG", "Hồ Chí Minh"],
  "Hà Nội": ["HN", "Thủ đô"],
  "Huế": ["Thừa Thiên Huế", "TT Huế"],
  "Thừa Thiên Huế": ["Huế", "TT Huế"],
  "Bà Rịa - Vũng Tàu": ["Vũng Tàu", "BRVT"],
};

// ── TÊN KHÁC CHO TỪNG Ô ─────────────────────────────────────────────────────

/** Ô Tỉnh/Thành: hệ mới — kèm tên tỉnh cũ đã gộp vào; hệ cũ — kèm tên tỉnh mới. */
export function bietDanhTinh(he: GeoMode, ds: string[]): Record<string, string[]> {
  const ra: Record<string, string[]> = {};
  for (const t of ds) {
    const khac = he === "moi" ? oldNamesOf(t).filter((x) => x !== t) : [newProvinceOf(t)].filter((x) => x && x !== t);
    ra[t] = [...khac, ...(TEN_GOI_TINH[t] ?? [])];
  }
  return ra;
}

/** Ô Phường/Xã hệ mới: kèm các phường/xã cũ đã gộp vào ("An Hải Bắc, Sơn Trà"), cả tên cũ hơn. */
export function bietDanhPhuongMoi(tinh: string, ds: string[]): Record<string, BietDanh[]> {
  const ra: Record<string, BietDanh[]> = {};
  for (const w of ds) {
    const cu = choCuCua(tinh, w);
    ra[w] = [
      ...cu.filter((x) => x.phuong).map((x) => `${x.phuong}, ${x.quan}`),
      ...tenCuHonCua(tinh, w),
      // Quận/huyện cũ chứa phường này — gõ "q1", "Gò Vấp" ra các phường mới thuộc quận cũ đó.
      ...[...new Set(cu.map((x) => x.quan))].map((ten) => ({ ten, cap: "huyen" as const })),
    ];
  }
  return ra;
}
