import type { Listing } from "@/lib/data";
import { chuanTen } from "@/lib/locations";
import { tachBangCsv } from "@/lib/xuatCsv";

// ════════════════════════════════════════════════════════════════════════════
// MẶT BẰNG GIÁ KHU VỰC — HAI NGUỒN, GHI RÕ NGUỒN NÀO RA SỐ NÀO.
//
//   1. TIN TRÊN CHÍNH WEB MÌNH — tự tính, không phụ thuộc ai, chi tiết tới từng
//      phường + loại hình. Web càng nhiều tin thì càng sát.
//   2. BÁO CÁO THỊ TRƯỜNG THEO QUÝ (Batdongsan · CBRE · Savills · DKRA) — chủ
//      dự án nhập tay mỗi quý một lần trong admin, dùng làm nền xu hướng.
//
// Nguyên tắc: KHÔNG BỊA. Bản cũ lấy giá tin nhân dãy hệ số cố định nên tin nào
// cũng ra "+22%" như nhau — khách mở hai tin cạnh nhau là lộ. Nay thiếu dữ liệu
// thì không hiện, chứ không chế số.
// ════════════════════════════════════════════════════════════════════════════

/** Dưới mức này thì mẫu quá ít, nói ra không có nghĩa gì. */
export const MAU_TOI_THIEU = 5;
/** Bảng so sánh giữa các phường chỉ cần 3 tin — nó nói KHOẢNG GIÁ chứ không
 *  khẳng định con số, và luôn ghi kèm số mẫu để người xem tự cân nhắc. */
export const MAU_SO_SANH = 3;

export type MatBangGia = {
  /** Giá trung vị mỗi m² (đồng) */
  trungVi: number;
  thap: number;
  cao: number;
  /** Số tin dùng để tính */
  soMau: number;
  /** Phạm vi đã dùng: "phường" khi đủ mẫu, nếu không thì lùi ra "tỉnh" */
  pham: "phuong" | "tinh";
  tenPham: string;
};

function giaMoiM2(l: Listing): number | null {
  // Chuỗi giá đã định dạng sẵn để hiển thị nên không tin được; dùng số thô.
  const gia = l.priceVnd;
  const dt = l.areaM2;
  if (!gia || !dt || dt <= 0) return null;
  const v = gia / dt;
  // Chặn số vô lý: dưới 1 triệu hoặc trên 1 tỷ mỗi m² là dữ liệu nhập sai.
  return v >= 1_000_000 && v <= 1_000_000_000 ? v : null;
}

function trungVi(ds: number[]): number {
  const s = [...ds].sort((a, b) => a - b);
  const g = Math.floor(s.length / 2);
  return s.length % 2 ? s[g] : Math.round((s[g - 1] + s[g]) / 2);
}

/** Phân vị thứ p (0–1) — dùng để cắt bỏ giá dị biệt ở hai đầu. */
function phanVi(ds: number[], p: number): number {
  const s = [...ds].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * p)));
  return s[i];
}

/**
 * Mặt bằng giá của khu vực, tính từ các tin ĐANG ĐĂNG cùng loại hình.
 * Đủ mẫu ở cấp phường thì lấy phường; không đủ thì lùi ra cấp tỉnh; vẫn không
 * đủ thì trả null — nơi gọi sẽ không hiện gì.
 */
export function matBangGia(
  tin: Listing,
  tatCa: Listing[],
): MatBangGia | null {
  const loai = chuanTen(tin.type);
  const phuong = chuanTen(tin.diaGioi?.ward ?? "");
  const tinh = chuanTen(tin.diaGioi?.province ?? "");
  if (!tinh) return null;

  const cungLoai = tatCa.filter(
    (x) =>
      x.id !== tin.id &&
      chuanTen(x.type) === loai &&
      (x.purpose ?? "ban") === (tin.purpose ?? "ban"),
  );

  const theo = (loc: (x: Listing) => boolean) =>
    cungLoai.filter(loc).map(giaMoiM2).filter((v): v is number => v !== null);

  if (phuong) {
    const ds = theo((x) => chuanTen(x.diaGioi?.ward ?? "") === phuong);
    if (ds.length >= MAU_TOI_THIEU)
      return {
        trungVi: trungVi(ds),
        thap: phanVi(ds, 0.25),
        cao: phanVi(ds, 0.75),
        soMau: ds.length,
        pham: "phuong",
        tenPham: tin.diaGioi?.ward ?? "",
      };
  }

  const dsTinh = theo((x) => chuanTen(x.diaGioi?.province ?? "") === tinh);
  if (dsTinh.length >= MAU_TOI_THIEU)
    return {
      trungVi: trungVi(dsTinh),
      thap: phanVi(dsTinh, 0.25),
      cao: phanVi(dsTinh, 0.75),
      soMau: dsTinh.length,
      pham: "tinh",
      tenPham: tin.diaGioi?.province ?? "",
    };

  return null;
}

// ── CHỈ SỐ GIÁ THEO QUÝ (chủ dự án nhập tay từ báo cáo thị trường) ──────────
// Lưu ở site_content key "chi_so_gia". Mỗi dòng là một quý của một khu vực.

export type MocQuy = {
  /** Kỳ: "2025-Q1" (quý) hoặc "2025" (cả năm) */
  quy: string;
  /** Giá PHỔ BIẾN mỗi m² (đồng) — trung vị. Tin thuê là giá thuê mỗi tháng. */
  giaM2: number;
  /** Mức thấp và mức cao của kỳ, để vẽ thêm hai đường biên quanh đường phổ biến.
   *  Thiếu thì biểu đồ chỉ vẽ một đường — không suy ra, không bịa. */
  thap?: number;
  cao?: number;
  /** Kỳ này tính từ bao nhiêu tin/giao dịch. CHỈ DÙNG TRONG ADMIN để biết dòng
   *  nào mỏng mà bổ sung — không bao giờ hiện ra cho khách. */
  soMau?: number;
};

export type ChiSoKhuVuc = {
  /** Tên tỉnh/thành theo hệ mới, VD "Đà Nẵng" */
  tinh: string;
  /** Phường/xã hoặc địa danh trong tỉnh. Để trống = cả tỉnh. */
  khuVuc?: string;
  /** Để trống = áp cho mọi loại hình */
  loaiHinh?: string;
  /** Bán hay cho thuê — hai thị trường khác hẳn, trộn vào nhau là hỏng số. */
  mucDich?: "ban" | "thue";
  /** Ai công bố: CBRE · Savills · DKRA · khảo sát của Coastal Land… */
  nguon: string;
  /** Ngày chủ dự án cập nhật, dạng 2026-09-11 */
  capNhat: string;
  /** Link tới báo cáo/trang đã lấy số. Để kiểm chứng lại về sau — số nào cũng
   *  phải truy được về gốc, nhất là khi dựng big data. Không hiện ra cho khách. */
  nguonLink?: string;
  moc: MocQuy[];
};

/** Phạm vi kinh doanh hiện tại của Coastal Land — 11 tỉnh/thành Miền Trung theo
 *  hệ mới sau sáp nhập. Chỉ thu thập và hiện dữ liệu trong phạm vi này; tỉnh
 *  ngoài vùng để trống chứ không lấy số nơi khác đắp vào. */
export const TINH_MIEN_TRUNG = [
  "Đà Nẵng",
  "Huế",
  "Quảng Trị",
  "Quảng Ngãi",
  "Gia Lai",
  "Khánh Hòa",
  "Đắk Lắk",
  "Lâm Đồng",
  "Hà Tĩnh",
  "Nghệ An",
  "Thanh Hóa",
];

export type ChiSoGiaData = { items: ChiSoKhuVuc[] };

/** Tên nguồn để HIỆN LÊN WEB. Số lấy ở đâu thì admin cứ ghi đúng cho mình nhớ,
 *  nhưng ra ngoài thì không nêu tên sàn đối thủ — ghi chung là báo cáo thị trường. */
export function tenNguonHienThi(nguon: string): string {
  const doiThu = ["batdongsan", "chotot", "nhatot", "alonhadat", "mogi", "homedy", "muaban", "rever", "propzy"];
  // Phải BỎ DẤU rồi mới so: "Chợ Tốt Nhà" viết có dấu, có khoảng trắng, so thô là trượt.
  const t = chuanTen(nguon).split(" ").join("").split(".").join("");
  return doiThu.some((x) => t.includes(x)) ? "báo cáo thị trường tổng hợp" : nguon;
}

/**
 * Chọn dãy số hợp NHẤT với tin đang xem. Khớp bắt buộc: tỉnh + bán/thuê.
 * Trong những dòng còn lại, dòng nào sát hơn thì thắng — khớp tới phường ăn đứt
 * dòng cả tỉnh, khớp đúng loại hình ăn đứt dòng chung. Tỉnh chưa có dòng nào thì
 * trả null: không vẽ, chứ không mượn số tỉnh khác đắp vào.
 */
export function chiSoChoTin(tin: Listing, data: ChiSoGiaData | null): ChiSoKhuVuc | null {
  if (!data?.items?.length) return null;
  const tinh = chuanTen(tin.diaGioi?.province ?? "");
  const phuong = chuanTen(tin.diaGioi?.ward ?? "");
  const loai = chuanTen(tin.type);
  const mucDich = (tin.purpose ?? "ban") === "thue" ? "thue" : "ban";

  let tot: ChiSoKhuVuc | null = null;
  let diemTot = -1;
  for (const x of data.items) {
    if (chuanTen(x.tinh) !== tinh) continue;
    if ((x.mucDich ?? "ban") !== mucDich) continue;
    if (x.khuVuc && chuanTen(x.khuVuc) !== phuong) continue;
    if (x.loaiHinh && chuanTen(x.loaiHinh) !== loai) continue;
    if (!x.moc?.some((m) => m.giaM2 > 0)) continue;
    const diem = (x.khuVuc ? 2 : 0) + (x.loaiHinh ? 1 : 0);
    if (diem > diemTot) {
      diemTot = diem;
      tot = x;
    }
  }
  return tot;
}

// ── ĐỌC TỆP CSV CHỈ SỐ GIÁ ─────────────────────────────────────────────────
// Gõ tay từng ô cho 11 tỉnh × 8 loại hình × 8 quý là bất khả thi. Chủ dự án điền
// một bảng Excel rồi tải lên, web tự gom thành từng dãy. Mỗi dòng CSV = MỘT kỳ
// của một khu vực; các dòng cùng khu vực + loại hình + bán/thuê tự gom lại.

export type LoiCsv = { dong: number; ly: string };

/** Cột bắt buộc — thiếu một cột là không đọc được tệp. */
const COT_CSV = [
  "tinh",
  "khu_vuc",
  "loai_hinh",
  "muc_dich",
  "ky",
  "gia_m2_trieu",
  "nguon",
  "cap_nhat",
] as const;

/** Cột tuỳ chọn — có thì tốt, không có vẫn nhập được. Cả hai chỉ phục vụ việc
 *  KIỂM CHỨNG trong admin, không hiện ra cho khách. */
const COT_THEM = ["gia_thap_trieu", "gia_cao_trieu", "so_mau", "nguon_link"] as const;

/** Đọc một ô giá viết kiểu Việt ("78,5") hoặc kiểu Anh ("78.5") → số triệu. */
function doiGia(s: string): number {
  return parseFloat((s || "").split(".").join("").split(",").join("."));
}

/** "2025-Q1" · "2025Q1" · "Q1/2025" · "2025" → chuẩn hoá, sai thì trả "". */
export function chuanKy(s: string): string {
  const t = (s || "").trim().toUpperCase().split(" ").join("");
  let m = t.match(/^(\d{4})-?Q([1-4])$/);
  if (m) return `${m[1]}-Q${m[2]}`;
  m = t.match(/^Q([1-4])[/-](\d{4})$/);
  if (m) return `${m[2]}-Q${m[1]}`;
  m = t.match(/^(\d{4})$/);
  if (m) return m[1];
  return "";
}

export function docCsvChiSo(text: string): { items: ChiSoKhuVuc[]; loi: LoiCsv[] } {
  return docBangChiSo(tachBangCsv(text));
}

/** Nhận thẳng bảng đã tách — dùng chung cho tệp CSV và tệp Excel .xlsx. */
export function docBangChiSo(bang: string[][]): { items: ChiSoKhuVuc[]; loi: LoiCsv[] } {
  const loi: LoiCsv[] = [];
  if (!bang.length) return { items: [], loi: [{ dong: 0, ly: "Tệp rỗng" }] };

  const dau = bang[0].map((c) => chuanTen(c).split(" ").join("_"));
  const viTri = COT_CSV.map((c) => dau.indexOf(c));
  const viTriThem = COT_THEM.map((c) => dau.indexOf(c));
  const thieu = COT_CSV.filter((_, i) => viTri[i] < 0);
  if (thieu.length)
    return { items: [], loi: [{ dong: 1, ly: `Thiếu cột: ${thieu.join(", ")}` }] };

  const gom = new Map<string, ChiSoKhuVuc>();
  for (let i = 1; i < bang.length; i++) {
    const o = bang[i];
    const lay = (k: number) => (viTri[k] < o.length ? o[viTri[k]] : "");
    const themLay = (k: number) =>
      viTriThem[k] >= 0 && viTriThem[k] < o.length ? o[viTriThem[k]] : "";
    const tinh = lay(0);
    const ky = chuanKy(lay(4));
    const gia = doiGia(lay(5));
    if (!tinh) {
      loi.push({ dong: i + 1, ly: "Thiếu tỉnh/thành" });
      continue;
    }
    if (!ky) {
      loi.push({ dong: i + 1, ly: `Kỳ "${lay(4)}" không đọc được — viết 2025-Q1 hoặc 2025` });
      continue;
    }
    if (!Number.isFinite(gia) || gia <= 0) {
      loi.push({ dong: i + 1, ly: `Giá "${lay(5)}" không hợp lệ — đơn vị triệu đồng, VD 78,5` });
      continue;
    }
    const mucDich = chuanTen(lay(3)).startsWith("thue") ? "thue" : "ban";
    const khuVuc = lay(1);
    const loaiHinh = lay(2);
    const thap = doiGia(themLay(0));
    const cao = doiGia(themLay(1));
    const soMau = Math.round(Number(themLay(2).split(".").join("")));
    const khoa = [chuanTen(tinh), chuanTen(khuVuc), chuanTen(loaiHinh), mucDich].join("|");
    let muc = gom.get(khoa);
    if (!muc) {
      muc = {
        tinh,
        khuVuc: khuVuc || undefined,
        loaiHinh: loaiHinh || undefined,
        mucDich,
        nguon: lay(6) || "Khảo sát của Coastal Land",
        capNhat: lay(7) || new Date().toISOString().slice(0, 10),
        nguonLink: themLay(3) || undefined,
        moc: [],
      };
      gom.set(khoa, muc);
    }
    const cu = muc.moc.find((m) => m.quy === ky);
    const giaDong = Math.round(gia * 1_000_000);
    // Thấp/cao chỉ nhận khi đúng phía so với giá phổ biến — điền ngược là sai số
    // liệu, thà bỏ còn hơn vẽ ra một biểu đồ có đường thấp nằm trên đường cao.
    const mocMoi: MocQuy = {
      quy: ky,
      giaM2: giaDong,
      thap: Number.isFinite(thap) && thap > 0 && thap <= gia ? Math.round(thap * 1_000_000) : undefined,
      cao: Number.isFinite(cao) && cao >= gia ? Math.round(cao * 1_000_000) : undefined,
      soMau: Number.isFinite(soMau) && soMau > 0 ? soMau : undefined,
    };
    if (cu) Object.assign(cu, mocMoi);
    else muc.moc.push(mocMoi);
  }

  const items = [...gom.values()].map((x) => ({
    ...x,
    moc: [...x.moc].sort((a, b) => a.quy.localeCompare(b.quy)),
  }));
  return { items, loi };
}

/** Đổi đồng/m² sang chuỗi gọn: 78,5 triệu/m². Tin cho thuê thì thêm "/tháng". */
export function vndM2(v: number, laThue = false): string {
  const duoi = laThue ? "/tháng" : "";
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(".", ",")} tỷ/m²${duoi}`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(".", ",")} triệu/m²${duoi}`;
  return `${Math.round(v / 1000).toLocaleString("vi-VN")} nghìn/m²${duoi}`;
}


// ── SO SÁNH VỚI KHU VỰC LÂN CẬN ────────────────────────────────────────────
// Người mua luôn hỏi "chỗ này so với mấy phường bên cạnh thì sao". Đây là câu
// hỏi quyết định chọn chỗ, mà không sàn nào ở Miền Trung trả lời được vì họ
// không tách nổi dữ liệu tới cấp phường.

export type OSanh = { ten: string; trungVi: number; soMau: number; chinhNo: boolean };

export function soSanhKhuVuc(tin: Listing, tatCa: Listing[], toiDa = 5): OSanh[] {
  const loai = chuanTen(tin.type);
  const tinh = chuanTen(tin.diaGioi?.province ?? "");
  if (!tinh) return [];

  const nhom = new Map<string, number[]>();
  for (const x of tatCa) {
    if (chuanTen(x.type) !== loai || (x.purpose ?? "ban") !== (tin.purpose ?? "ban")) continue;
    if (chuanTen(x.diaGioi?.province ?? "") !== tinh) continue;
    const ph = x.diaGioi?.ward?.trim();
    if (!ph) continue;
    const v = giaMoiM2(x);
    if (v === null) continue;
    const cu = nhom.get(ph);
    if (cu) cu.push(v);
    else nhom.set(ph, [v]);
  }

  const cuaTin = chuanTen(tin.diaGioi?.ward ?? "");
  return [...nhom.entries()]
    .filter(([, ds]) => ds.length >= MAU_SO_SANH)
    .map(([ten, ds]) => ({
      ten,
      trungVi: trungVi(ds),
      soMau: ds.length,
      chinhNo: chuanTen(ten) === cuaTin,
    }))
    .sort((a, b) => b.trungVi - a.trungVi)
    .slice(0, toiDa);
}

// ── XU HƯỚNG TỪ KHO CỦA CHÍNH MÌNH ─────────────────────────────────────────
// Bảng gia_khu_vuc_thang chụp mặt bằng giá mỗi tháng và giữ lại vĩnh viễn. Khi
// kho đủ dày (mỗi quý có mẫu), web tự vẽ đường giá của mình và KHÔNG cần số
// mượn bên ngoài nữa — đây chính là cách Batdongsan làm, chỉ khác quy mô.
// Chưa đủ thì trả null, nơi gọi lùi về chỉ số nhập tay từ báo cáo.

export async function xuHuongCuaMinh(
  tinh: string,
  loaiHinh: string,
  mucDich: string,
  phuong = "",
): Promise<ChiSoKhuVuc | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !tinh || !loaiHinh) return null;

  const q =
    `${url}/rest/v1/gia_khu_vuc_thang` +
    `?select=thang,trung_vi,thap,cao,so_mau` +
    `&tinh=eq.${encodeURIComponent(tinh)}` +
    `&phuong=eq.${encodeURIComponent(phuong)}` +
    `&loai_hinh=eq.${encodeURIComponent(loaiHinh)}` +
    `&muc_dich=eq.${encodeURIComponent(mucDich)}` +
    `&order=thang.asc&limit=36`;

  try {
    const r = await fetch(q, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const ds = (await r.json()) as {
      thang: string;
      trung_vi: number;
      thap: number;
      cao: number;
      so_mau: number;
    }[];
    if (!Array.isArray(ds) || ds.length < 2) return null;

    // VẼ THEO THÁNG, không gom quý. Kho này web tự chụp mỗi ngày nên nó là nguồn
    // bám sát thị trường nhất mình có — gom về quý là tự tay làm chậm số liệu đi
    // ba tháng. Số nhập tay từ báo cáo thì vẫn theo quý, nhưng hai nguồn không
    // bao giờ vẽ chung một biểu đồ (nguồn này luôn được ưu tiên trước).
    // Mỗi mốc giữ đủ ba mức: phổ biến (trung vị) · thấp · cao.
    const moc: MocQuy[] = ds.slice(-12).map((d) => ({
      quy: d.thang.slice(0, 7),
      giaM2: Math.round(d.trung_vi),
      thap: d.thap > 0 ? Math.round(d.thap) : undefined,
      cao: d.cao > 0 ? Math.round(d.cao) : undefined,
    }));
    if (moc.length < 2) return null;

    return {
      tinh,
      loaiHinh,
      mucDich: mucDich === "thue" ? "thue" : "ban",
      nguon: "tin đăng trên Coastal Land",
      capNhat: ds[ds.length - 1].thang,
      moc,
    };
  } catch {
    return null;
  }
}

// ── MẶT BẰNG GIÁ THEO LOẠI HÌNH CHO CẢ MỘT KHU VỰC ─────────────────────────
// Dùng ở trang khu vực (/mua-ban/da-nang…): khách vào xem "nhà đất Đà Nẵng" thì
// câu đầu tiên họ muốn biết là mỗi loại hình đang bao nhiêu một mét vuông.

export type DongBangGia = { loai: string; trungVi: number; thap: number; cao: number; soMau: number };

export function bangGiaTheoLoai(tin: Listing[], mucDich: "ban" | "thue" = "ban"): DongBangGia[] {
  const nhom = new Map<string, number[]>();
  for (const x of tin) {
    if ((x.purpose ?? "ban") !== mucDich) continue;
    const loai = (x.type ?? "").trim();
    if (!loai) continue;
    const v = giaMoiM2(x);
    if (v === null) continue;
    const cu = nhom.get(loai);
    if (cu) cu.push(v);
    else nhom.set(loai, [v]);
  }
  return [...nhom.entries()]
    .filter(([, ds]) => ds.length >= MAU_SO_SANH)
    .map(([loai, ds]) => ({
      loai,
      trungVi: trungVi(ds),
      thap: phanVi(ds, 0.25),
      cao: phanVi(ds, 0.75),
      soMau: ds.length,
    }))
    .sort((a, b) => b.soMau - a.soMau);
}

// ── CHƯA ĐỦ DỮ LIỆU THÌ NÓI THẲNG LÀ CHƯA ĐỦ ───────────────────────────────
// Không bịa số, nhưng cũng không im lặng cho khối biến mất — nói rõ đang có bao
// nhiêu tin, cần bao nhiêu. Người xem biết web chưa đủ căn cứ chứ không tưởng
// web thiếu chức năng. Đây là chỗ khác các sàn khác: họ không bao giờ nói con số
// của họ dựa trên mấy tin.

export function demTinLamMau(tin: Listing, tatCa: Listing[]): number {
  const loai = chuanTen(tin.type);
  const tinh = chuanTen(tin.diaGioi?.province ?? "");
  if (!tinh) return 0;
  return tatCa.filter(
    (x) =>
      x.id !== tin.id &&
      chuanTen(x.type) === loai &&
      (x.purpose ?? "ban") === (tin.purpose ?? "ban") &&
      chuanTen(x.diaGioi?.province ?? "") === tinh &&
      giaMoiM2(x) !== null,
  ).length;
}
