import type { Listing } from "@/lib/data";
import { chuanTen, provinceNamesNew, wardsOfNew } from "@/lib/locations";
import { mauSoCuaLoaiHinh, coDonGiaM2, dungODienTichXayDung, dienTichSanThat, laTinThue, TEN_MAU_SO, TEN_VI_TRI, docViTri, type MauSo, type ViTriGia } from "@/lib/listingSpec";
export { mauSoCuaLoaiHinh, TEN_MAU_SO, TEN_VI_TRI };
export type { MauSo, ViTriGia };
import { tachBangCsv } from "@/lib/xuatCsv";
import { homNayVn } from "@/lib/gioVn";

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


/** Đọc ô `mau_so` của tệp chỉ số. Bỏ trống thì KHÔNG đoán bừa theo loại hình:
 *  trả undefined để nơi so sánh biết là chưa khai mà đứng lại. */
function docMauSo(raw: string, loaiHinh: string): MauSo | undefined {
  const t = chuanTen(raw);
  if (!t) return undefined;
  if (t.startsWith("dat")) return "dat";
  if (t.startsWith("san")) return "san";
  if (t.startsWith("can")) return "can";
  // Người nộp ghi thẳng tên loại hình cũng hiểu được.
  return loaiHinh ? mauSoCuaLoaiHinh(raw) : undefined;
}

/** Giá mỗi m² của tin theo ĐÚNG luật của loại hình (đất→m² đất · nhà→m² sàn · căn hộ→m² căn). */
export function giaMoiM2(l: Listing): number | null {
  return giaMoiM2Theo(l, mauSoCuaLoaiHinh(l.type));
}

/** Giá mỗi m² của tin chia theo MỘT mẫu số chỉ định — dùng khi phải so với một
 *  dãy số bên ngoài đang tính trên cơ sở khác. */
export function giaMoiM2Theo(l: Listing, mau: MauSo): number | null {
  // Chuỗi giá đã định dạng sẵn để hiển thị nên không tin được; dùng số thô.
  const gia = l.priceVnd;
  // Chia theo m² sàn thì tin chưa khai diện tích xây dựng là KHÔNG có mẫu số →
  // trả null, tin đó không góp vào thống kê và không được vẽ lên biểu đồ. Thà
  // thiếu một điểm còn hơn đưa vào một con số khác bản chất.
  // "m² sàn" lấy ở ô nào tuỳ loại hình: nhà có ô riêng, văn phòng/mặt bằng thì
  // chính ô diện tích đã là sàn (xem dungODienTichXayDung).
  // Nhà: CHỈ m² sàn thật (dienTichSanThat) — không dùng số ước tính, không dùng số
  // đúng bằng m² đất × số tầng (chủ dự án 03/10/2026: mỗi sàn chỉ 75–80% đất).
  const dt = mau === "san" && dungODienTichXayDung(l.type)
    ? dienTichSanThat(l.builtAreaM2, l.areaM2)
    : l.areaM2;
  if (!gia || !dt || dt <= 0) return null;
  const v = gia / dt;
  // Chặn số vô lý. Hai thang hoàn toàn khác nhau: tin BÁN tính bằng triệu mỗi m²,
  // tin THUÊ chỉ vài chục nghìn mỗi m² mỗi tháng. Trước 19/09 chỉ có một ngưỡng
  // "≥ 1 triệu" dùng chung nên 35/37 tin cho thuê bị loại sạch — mọi khối mặt
  // bằng giá của thị trường thuê im lặng biến mất mà không ai biết.
  const laThue = laTinThue(l.purpose);
  const [thap, cao] = laThue ? [1_000, 5_000_000] : [1_000_000, 1_000_000_000];
  return v >= thap && v <= cao ? v : null;
}

/** SỐ ĐƯA VÀO LỊCH SỬ GIÁ — giá mỗi m² theo loại hình (đất ÷ m² đất · căn hộ ÷ m² căn · nhà ÷ m² sàn).
 *  CHO THUÊ: dùng ĐÚNG chuẩn đơn giá của hệ thống (coDonGiaM2 — kho, nhà xưởng, đất công nghiệp · văn phòng, mặt bằng kinh doanh
 *  → giá/m²/tháng); loại hình còn lại → TỔNG tiền/tháng (chủ dự án 23/10/2026: "mọi loại hình, mọi mục đích đã có quy chuẩn về giá"). */
export function laThueTong(type: string, mucDich: string | undefined): boolean {
  return laTinThue(mucDich) && !coDonGiaM2(type, mucDich);
}
/** Mẫu số của dãy lịch sử giá: thuê tính tổng tiền → không có mẫu số (undefined). */
export function mauSoLichSu(type: string, mucDich: string | undefined): MauSo | undefined {
  return laThueTong(type, mucDich) ? undefined : mauSoCuaLoaiHinh(type);
}
export function giaChoLichSu(l: Listing): number | null {
  if (laThueTong(l.type, l.purpose)) {
    const g = l.priceVnd;
    return g && g >= 100_000 && g <= 10_000_000_000 ? g : null;
  }
  return giaMoiM2(l);
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
      laTinThue(x.purpose) === laTinThue(tin.purpose),
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
  /** Giá PHỔ BIẾN mỗi m² (đồng) — trung vị. Tin thuê là giá thuê mỗi tháng.
   *  Nguồn chỉ có khoảng thấp–cao → số giữa khoảng (chủ dự án 16/10/2026). */
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
  /** GIÁ NÀY CHIA CHO CÁI GÌ: m² đất · m² sàn xây dựng · m² căn hộ.
   *  Bắt buộc phải khai, vì cùng một "104 triệu/m²" cho biệt thự có thể là giá
   *  trên đất (đúng) hay trên sàn (cao gấp đôi thực tế). Dòng nào không khai thì
   *  vẫn vẽ được đường thị trường của chính nó, nhưng KHÔNG được đem so với giá
   *  của tin đang xem — so hai mẫu số khác nhau là ra một con số sai. */
  mauSo?: MauSo;
  /** VỊ TRÍ dãy số này nói tới: mặt tiền đường lớn · đường nhỏ · kiệt/hẻm.
   *  Để trống = gộp mọi vị trí trong khu vực — vẫn dùng được, nhưng phải nói rõ
   *  với người xem rằng đó là mức chung của cả khu, không phải giá của đúng
   *  con đường trước căn nhà họ đang xem (chênh nhau 2–3 lần là chuyện thường). */
  viTri?: ViTriGia;
  /** LOẠI CON (cột loai_con): "Căn hộ chung cư", "Nhà ở xã hội", "Đất thổ cư"… Để trống = chung cả loại hình (29/10/2026). */
  loaiCon?: string;
  /** Tên DỰ ÁN dãy số này nói tới (bậc ① — sát nhất). */
  duAn?: string;
  /** Tên TUYẾN ĐƯỜNG trong phường `khuVuc` (bậc ②). */
  duong?: string;
  /** Lúc dãy được nộp/nhập (ISO). Dãy nhập trước đợt làm mới 03/10/2026 không có
   *  dấu này → không được dùng (xem soNhapHopLe). */
  nhapLuc?: string;
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
/** ĐƯA VỀ THEO QUÝ như Batdongsan (Q2/25 → Q2/26). Dãy theo tháng: mỗi quý lấy số
 *  của THÁNG MUỘN NHẤT có trong quý đó — không cộng, không trung bình, không bịa.
 *  Dãy đã theo quý giữ nguyên. */
export function veQuy(x: ChiSoKhuVuc): ChiSoKhuVuc {
  const gom = new Map<string, MocQuy & { _t: string }>();
  for (const m of x.moc) {
    if (!(m.giaM2 > 0)) continue;
    const t = m.quy.match(/^(\d{4})-(\d{2})$/);
    const q = t ? `${t[1]}-Q${Math.ceil(Number(t[2]) / 3)}` : m.quy.toUpperCase();
    const cu = gom.get(q);
    if (!cu || m.quy > cu._t) gom.set(q, { ...m, quy: q, _t: m.quy });
  }
  const moc = [...gom.values()]
    .sort((a, b) => a.quy.localeCompare(b.quy))
    .map(({ _t, ...m }) => (void _t, m));
  return { ...x, moc };
}

/** TÊN CHUẨN HỆ MỚI — "An Hải" và "Phường An Hải" là MỘT phường; gom và so phải theo
 *  một tên, nếu không một phường bị tách thành nhiều dãy, mỗi dãy thiếu số. */
export function tenTinhChuan(t?: string | null): string {
  const x = (t ?? "").trim();
  return provinceNamesNew.find((n) => chuanTen(n) === chuanTen(x)) ?? x;
}
export function tenPhuongChuan(tinh?: string | null, p?: string | null): string {
  const x = (p ?? "").trim();
  if (!x) return "";
  return wardsOfNew(tenTinhChuan(tinh)).find((w) => chuanTen(w) === chuanTen(x)) ?? x;
}

/** "Bất động sản khác" gom đủ thứ — không phải một phân khúc, không làm lịch sử giá. */
export function coLichSuGia(loaiHinh?: string | null): boolean {
  return !!loaiHinh && chuanTen(loaiHinh) !== chuanTen("Bất động sản khác");
}

/** ĐỢT LÀM MỚI LỊCH SỬ GIÁ (chủ dự án 03/10/2026): số nhập trước mốc này chưa được
 *  kiểm theo luật mới → không dùng. Chỉ nhận dãy nộp từ mốc này trở đi. */
export const MOC_LAM_MOI = "2026-10-03";
export function soNhapHopLe(items: ChiSoKhuVuc[] | undefined | null): ChiSoKhuVuc[] {
  return (items ?? []).filter((x) => (x.nhapLuc ?? "") >= MOC_LAM_MOI);
}

/** Phạm vi của một dãy: du-an · duong · phuong · tinh. */
export function bacCuaDay(x: ChiSoKhuVuc): "du-an" | "duong" | "phuong" | "tinh" {
  return x.duAn ? "du-an" : x.duong ? "duong" : x.khuVuc ? "phuong" : "tinh";
}

/** Tên phạm vi để ghi trên tiêu đề khối: "dự án X" · "đường X, phường Y" · phường · tỉnh. */
export function tenPhamVi(x: ChiSoKhuVuc): string {
  if (x.duAn) return x.duAn;
  if (x.duong) return `${x.duong}, ${x.khuVuc}`;
  return x.khuVuc || x.tinh;
}

/** Tìm tên đường trong địa chỉ tin theo NGUYÊN TỪ ("Lê Lợi" không khớp "Lê Lợi Mới"
 *  thì vẫn khớp — chấp nhận; nhưng "Lợi" không khớp "Lê Lợi"). */
function coDuong(diaChi: string, duong: string): boolean {
  const d = chuanTen(duong);
  if (!d) return false;
  return ` ${chuanTen(diaChi)} `.includes(` ${d} `);
}

/**
 * CHỌN DÃY CHO MỘT TIN — BA BẬC (cùng phân khúc, cùng vị trí; chủ dự án 03/10,
 * bỏ bậc cả tỉnh 16/10/2026): ① cùng DỰ ÁN → ② cùng TUYẾN ĐƯỜNG → ③ cùng PHƯỜNG.
 * Bậc nào cũng bắt buộc: cùng tỉnh · cùng loại hình · cùng bán/thuê · đúng mẫu số
 * của loại hình · ĐỦ SỐ (13 tháng liền). Bậc trên không đủ số mới xuống bậc dưới.
 * Không bậc nào đủ → null, khối Lịch sử giá ẩn hẳn.
 */
// Nhóm căn hộ (mục cha "Căn hộ") — chỉ dùng để khớp dãy CÙNG DỰ ÁN (29/10/2026)
const NHOM_CAN_HO = new Set(["Căn hộ", "Chung cư", "Căn hộ chung cư", "Căn hộ dịch vụ", "Condotel"].map((s) => chuanTen(s)));

// NGUỒN SỐ LIỆU (chủ dự án 29/10/2026: "lấy web! thiếu thì lọc! lọc thì phải CHUẨN!"): cùng một dãy (tỉnh · phường/dự án/đường ·
// loại hình · bán/thuê · mẫu số · vị trí) có cả số của web (tin đăng trên Coastal Land, kể cả tin hết hạn trong tháng) lẫn số Cowork
// lọc → quý nào web có số thì lấy số web, quý web chưa có thì lấy số lọc.
const NGUON_WEB = "tin đăng trên Coastal Land";
function ghepNguon(ds: ChiSoKhuVuc[]): ChiSoKhuVuc[] {
  const khoa = (x: ChiSoKhuVuc) =>
    [x.tinh, x.khuVuc ?? "", x.duAn ?? "", x.duong ?? "", x.loaiHinh ?? "", x.loaiCon ?? ""].map((s) => chuanTen(s)).concat([x.mucDich ?? "ban", x.mauSo ?? "", x.viTri ?? ""]).join("|");
  const web = new Map(ds.filter((x) => x.nguon === NGUON_WEB).map((x) => [khoa(x), x]));
  const daGhep = new Set<string>();
  const ra = ds.map((x) => {
    const w = x.nguon === NGUON_WEB ? undefined : web.get(khoa(x));
    if (!w) return x;
    daGhep.add(khoa(x));
    const theoQuy = new Map(x.moc.map((m) => [m.quy, m]));
    for (const m of w.moc) theoQuy.set(m.quy, m);
    return { ...x, moc: [...theoQuy.values()].sort((a, b) => a.quy.localeCompare(b.quy)) };
  });
  return ra.filter((x) => !(x.nguon === NGUON_WEB && daGhep.has(khoa(x))));
}

/** SỐ BẤT THƯỜNG, SAI LOGIC THÌ KHÔNG HIỆN (chủ dự án 29/10/2026): mỗi quý thấp ≤ phổ biến ≤ cao; hai quý liền nhau không đổi
 *  gấp đôi / còn một nửa (cùng ngưỡng với cửa nộp số liệu). */
export function dayHopLogic(x: ChiSoKhuVuc): boolean {
  const moc = x.moc.filter((m) => m.giaM2 > 0);
  return moc.every((m, i) => {
    if ((m.thap ?? m.giaM2) <= 0 || (m.thap ?? m.giaM2) > m.giaM2 || (m.cao ?? m.giaM2) < m.giaM2) return false;
    const ty = i ? m.giaM2 / moc[i - 1].giaM2 : 1;
    return ty < 2 && ty > 0.5;
  });
}

export function chiSoChoTin(
  tin: Listing,
  data: ChiSoGiaData | null,
  them: { duAn?: string | null; diaChi?: string | null; giaTin?: number | null } = {},
): ChiSoKhuVuc | null {
  if (!data?.items?.length) return null;
  const tinh = chuanTen(tin.diaGioi?.province ?? "");
  const phuong = chuanTen(tin.diaGioi?.ward ?? "");
  const loai = chuanTen(tin.type);
  const mucDich = laTinThue(tin.purpose) ? "thue" : "ban";
  const mau = mauSoLichSu(tin.type, mucDich);
  const duAn = chuanTen(them.duAn ?? "");
  const diaChi = them.diaChi ?? "";
  if (!tinh || !coLichSuGia(tin.type)) return null;

  // Điều kiện chung của mọi bậc (sau khi đưa mọi dãy về theo quý).
  const hop = ghepNguon(data.items.map(veQuy)).filter(
    (x) =>
      chuanTen(x.tinh) === tinh &&
      (x.mucDich ?? "ban") === mucDich &&
      // Cùng loại hình. Riêng dãy CỦA DỰ ÁN: căn hộ · chung cư · căn hộ dịch vụ · condotel trong cùng một dự án là MỘT sản phẩm
      // (mục cha "Căn hộ", cùng đơn vị m² căn) — chủ dự án 29/10/2026: tin Golden Bay ghi "Căn hộ" theo tin gốc, dãy dự án ghi
      // "Condotel" → trượt xuống dãy cả phường Sơn Trà 70,2 tr/m² trong khi dự án 42,3 tr/m².
      !!x.loaiHinh && (chuanTen(x.loaiHinh) === loai || (!!x.duAn && NHOM_CAN_HO.has(chuanTen(x.loaiHinh)) && NHOM_CAN_HO.has(loai))) &&
      // Đúng mẫu số của loại hình; thuê tính tổng tiền/tháng thì dãy không có mẫu số (23/10/2026)
      x.mauSo === mau &&
      !x.viTri && // cùng phân khúc + cùng vị trí; không chia nhỏ theo bề rộng đường
      // LOẠI CON (29/10/2026: "căn hộ thì phải có loại hình con của nó, đất cũng vậy"): dãy ghi loại con chỉ so với tin cùng loại con
      (!x.loaiCon || chuanTen(x.loaiCon) === chuanTen(tin.loaiCon ?? "")) &&
      dayHopLogic(x) &&
      coDuLichSuGia(x),
  );

  const bac: ((x: ChiSoKhuVuc) => boolean)[] = [
    // ① cùng dự án (tin chưa gắn dự án mà tiêu đề ghi đúng tên dự án cũng tính — vd Capital Square)
    (x) => !!x.duAn && ((!!duAn && chuanTen(x.duAn) === duAn) || (!!tin.projectSlug && x.duAn === tin.projectSlug) ||
      (!duAn && chuanTen(x.duAn).length >= 6 && chuanTen(tin.title ?? "").includes(chuanTen(x.duAn)))),
    // ② cùng tuyến đường (trong đúng phường)
    (x) => !x.duAn && !!x.duong && !!phuong && chuanTen(x.khuVuc ?? "") === phuong && coDuong(diaChi, x.duong),
    // ③ cùng phường
    (x) => !x.duAn && !x.duong && !!phuong && chuanTen(x.khuVuc ?? "") === phuong,
    // ⛔ KHÔNG có bậc cả tỉnh (chủ dự án 16/10/2026: số một phường / một loại hình
    // đem áp cho cả tỉnh là sai — lịch sử giá chỉ của cùng dự án, đường hoặc vị trí tương đương).
  ];
  // GIÁ TIN LÀ SỐ CỦA QUÝ HIỆN TẠI (chủ dự án 29/10/2026: "lấy giá hiện tại của tin là nguồn hiện tại … đối chiếu và so sánh để đưa
  // ra khoảng giá chuẩn"). Đường giá phổ biến – khoảng giá – giá tin phải khớp:
  //  · dãy CÙNG DỰ ÁN là cùng sản phẩm → dùng; khoảng thấp–cao của quý mới nhất mở ra cho chứa giá tin. Giá tin lệch quá 30% ngoài
  //    khoảng (nhập nhầm diện tích, nhầm giá) là số bất thường → không hiện (chủ dự án 29/10/2026).
  //  · dãy đường / phường chỉ dùng khi giá tin nằm trong khoảng của dãy (lệch ≤ 3%) — ngoài khoảng là khác sản phẩm (đất kiệt so
  //    với dãy trộn mặt tiền, nhà ở xã hội so với chung cư thường, studio so với căn 3 phòng ngủ) → thử bậc sau; hết bậc → không vẽ.
  // Đo cả hệ thống: node scripts/kiem-logic-lich-su-gia.mjs (phải 0 tin lệch).
  const g = them.giaTin ?? null;
  const cuoi = (x: ChiSoKhuVuc) => x.moc[x.moc.length - 1];
  const khop = (x: ChiSoKhuVuc, bien = 0.03) => {
    if (!g) return true;
    const m = cuoi(x);
    return g >= (m.thap ?? m.giaM2) * (1 - bien) && g <= (m.cao ?? m.giaM2) * (1 + bien);
  };
  const chuaGiaTin = (x: ChiSoKhuVuc): ChiSoKhuVuc => {
    if (!g) return x;
    const m = cuoi(x);
    const moc = [...x.moc.slice(0, -1), { ...m, thap: Math.min(m.thap ?? m.giaM2, g), cao: Math.max(m.cao ?? m.giaM2, g) }];
    return { ...x, moc };
  };
  for (const [i, dung] of bac.entries()) {
    // Cùng bậc: ưu tiên dãy dài hơn (nhiều tháng liền hơn).
    // Cùng bậc: dãy đúng loại con trước, rồi dãy dài hơn.
    const ds = hop.filter(dung).sort((a, b) => Number(!!b.loaiCon) - Number(!!a.loaiCon) || soKyLienMach(b) - soKyLienMach(a));
    const chon = i === 0 ? ds.find((x) => khop(x, 0.3)) : ds.find((x) => khop(x));
    if (chon) return chuaGiaTin(chon);
  }
  return null;
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
const COT_THEM = ["gia_thap_trieu", "gia_cao_trieu", "so_mau", "nguon_link", "mau_so", "vi_tri", "du_an", "duong", "loai_con"] as const;

/**
 * Đọc một ô giá về SỐ TRIỆU, chấp nhận cả bốn lối viết đang gặp thật:
 *   "78,5"        → 78,5   (thập phân kiểu Việt)
 *   "78.5"        → 78,5   (thập phân kiểu Anh — máy tính xuất ra kiểu này)
 *   "1.234.567"   → 1234567 (dấu chấm phân cách nghìn kiểu Việt)
 *   "1,234.56"    → 1234,56 (phân cách nghìn kiểu Anh)
 *
 * Luật: dấu nào xuất hiện SAU CÙNG và chỉ một lần thì đó là dấu thập phân;
 * dấu lặp lại nhiều lần là phân cách nghìn.
 *
 * ⛔ Bản cũ xoá MỌI dấu chấm rồi mới đổi phẩy thành chấm, nên "94.1" thành
 * 941 và "94.09999999999999" thành 9.409.999.999.999.999 — sai gấp cả triệu
 * lần. Lỗi này nằm im vì mọi lần thử đều gõ tay kiểu "78,5"; chỉ lộ ra khi
 * nhận tệp do máy xuất (18/09/2026), lúc đó 55/76 dãy bị chặn oan vì "giá
 * nhảy bất thường".
 */
function doiGia(s: string): number {
  const t = (s || "").trim().split(" ").join("");
  if (!t) return NaN;
  const soCham = (t.match(/\./g) ?? []).length;
  const soPhay = (t.match(/,/g) ?? []).length;

  // Có cả hai dấu: dấu đứng sau là thập phân, dấu kia là phân cách nghìn.
  if (soCham && soPhay) {
    const thapPhan = t.lastIndexOf(".") > t.lastIndexOf(",") ? "." : ",";
    const nghin = thapPhan === "." ? "," : ".";
    return parseFloat(t.split(nghin).join("").split(thapPhan).join("."));
  }
  // Một loại dấu lặp nhiều lần → chắc chắn là phân cách nghìn.
  if (soCham > 1) return parseFloat(t.split(".").join(""));
  if (soPhay > 1) return parseFloat(t.split(",").join(""));
  // Đúng một dấu → thập phân. Trong đơn vị TRIỆU đồng mỗi m², "1.234" là
  // 1,234 triệu chứ không thể là 1.234 triệu (một tỷ hai mỗi mét vuông).
  return parseFloat(t.split(",").join("."));
}

/** Ba mức kỳ, đều nhận: THÁNG "2026-08" · QUÝ "2025-Q1" · NĂM "2025".
 *  Viết kiểu nào cũng đọc được ("Q1/2025", "8/2026", "T8/2026"); sai thì trả "".
 *  Tháng đứng đầu danh sách vì báo cáo của các trang lớn phần nhiều theo tháng,
 *  mà kho web tự chụp cũng theo tháng — cùng đơn vị thì sau này đổi nguồn không
 *  gãy biểu đồ. */
export function chuanKy(s: string): string {
  const t = (s || "").trim().toUpperCase().split(" ").join("");
  const thang = (nam: string, so: string) =>
    +so >= 1 && +so <= 12 ? `${nam}-${String(+so).padStart(2, "0")}` : "";
  let m = t.match(/^(\d{4})-?Q([1-4])$/);
  if (m) return `${m[1]}-Q${m[2]}`;
  m = t.match(/^Q([1-4])[/-](\d{4})$/);
  if (m) return `${m[2]}-Q${m[1]}`;
  m = t.match(/^(\d{4})[-/](\d{1,2})$/);
  if (m) return thang(m[1], m[2]);
  m = t.match(/^T?(\d{1,2})[-/](\d{4})$/);
  if (m) return thang(m[2], m[1]);
  // Báo cáo 6 tháng: 2026-H1 · H1/2026 · 6T1/2026 (6 tháng đầu năm) · 6T2/2026 (6 tháng cuối năm)
  m = t.match(/^(\d{4})-?H([12])$/);
  if (m) return `${m[1]}-H${m[2]}`;
  m = t.match(/^(?:H|6T)([12])[/-](\d{4})$/);
  if (m) return `${m[2]}-H${m[1]}`;
  m = t.match(/^(\d{4})$/);
  if (m) return m[1];
  return "";
}

/** BÁO CÁO 6 THÁNG / NĂM → TỪNG QUÝ (chủ dự án 23/10/2026: "có quý / 6 tháng / năm thì suy ra chỗ cần ghi"). Cowork ghi đúng
 *  kỳ của báo cáo, web tự suy: 6 tháng → 2 quý của kỳ, năm → 4 quý, cùng số. Kỳ quý / tháng giữ nguyên. */
export function kyRaQuy(ky: string): { quy: string[]; suyRa: boolean } {
  const h = ky.match(/^(\d{4})-H([12])$/);
  if (h) return { quy: h[2] === "1" ? [`${h[1]}-Q1`, `${h[1]}-Q2`] : [`${h[1]}-Q3`, `${h[1]}-Q4`], suyRa: true };
  const n = ky.match(/^(\d{4})$/);
  if (n) return { quy: [1, 2, 3, 4].map((q) => `${n[1]}-Q${q}`), suyRa: true };
  return { quy: [ky], suyRa: false };
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
  // cap_nhat không bắt buộc (khuôn danh sách còn thiếu 22/10/2026 không có cột này) — trống thì lấy ngày nộp
  const thieu = COT_CSV.filter((c, i) => viTri[i] < 0 && c !== "cap_nhat");
  if (thieu.length)
    return { items: [], loi: [{ dong: 1, ly: `Thiếu cột: ${thieu.join(", ")}` }] };

  const gom = new Map<string, ChiSoKhuVuc>();
  const quyRieng = new Set<string>(); // quý có dòng số riêng (không phải suy từ báo cáo 6 tháng / năm)
  for (let i = 1; i < bang.length; i++) {
    const o = bang[i];
    const lay = (k: number) => (viTri[k] >= 0 && viTri[k] < o.length ? o[viTri[k]] : "");
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
      loi.push({
        dong: i + 1,
        ly: `Kỳ "${lay(4)}" không đọc được — viết 2026-Q2 (quý), 2026-H1 (6 tháng đầu năm), 2025 (năm) hoặc 2026-08 (tháng)`,
      });
      continue;
    }
    // Ô giá BỎ TRỐNG là bình thường, không phải lỗi: khung dựng sẵn hàng nghìn
    // dòng cho nhiều đợt, mỗi lần chỉ điền một phần. Báo chúng thành lỗi thì
    // mỗi lần nộp lại hiện hàng nghìn dòng đỏ, người nộp hết dám tin cái nào là
    // lỗi thật. Chỉ báo khi ô CÓ CHỮ mà đọc không ra số.
    // NGUỒN CHỈ CÓ KHOẢNG (chủ dự án 16/10/2026: "45–50 tr/m²"): bỏ trống giá phổ biến,
    // điền thấp + cao → giá phổ biến = số giữa khoảng (chủ dự án chọn), biểu đồ vẫn có đường phổ biến.
    const chiKhoang = !lay(5).trim();
    if (chiKhoang) {
      const t = doiGia(themLay(0));
      const c = doiGia(themLay(1));
      if (!(Number.isFinite(t) && Number.isFinite(c) && t > 0 && c >= t)) continue;
    } else if (!Number.isFinite(gia) || gia <= 0) {
      loi.push({ dong: i + 1, ly: `Giá "${lay(5)}" không hợp lệ — đơn vị triệu đồng, VD 78,5` });
      continue;
    }
    const mucDich = chuanTen(lay(3)).startsWith("thue") ? "thue" : "ban";
    const khuVuc = lay(1);
    const loaiHinh = lay(2);
    const duAnO = themLay(6).trim();
    const duongO = themLay(7).trim();
    const loaiConO = themLay(8).trim();
    // BA BẬC (chủ dự án 16/10/2026): dự án → tuyến đường → phường. Không có cả tỉnh.
    // Dòng nào không đủ điều kiện của bậc mình thì trang tin không bao giờ dùng tới →
    // chặn ngay khi nhập, không để nằm trong kho như số liệu hợp lệ.
    if (!loaiHinh.trim()) {
      loi.push({ dong: i + 1, ly: "Thiếu loai_hinh" });
      continue;
    }
    // Bán: giá MỖI M² đúng mẫu số của loại hình. Thuê văn phòng, kho/xưởng/đất: giá/m²/tháng. Thuê loại hình khác:
    // TỔNG tiền/tháng, bỏ trống mau_so (chủ dự án 23/10/2026).
    const mauDung = mauSoLichSu(loaiHinh, mucDich);
    if (docMauSo(themLay(4), loaiHinh) !== mauDung) {
      loi.push({ dong: i + 1, ly: mauDung ? `mau_so phải là "${mauDung}" (${TEN_MAU_SO[mauDung]}) cho ${loaiHinh}` : `Thuê ${loaiHinh} ghi TỔNG tiền/tháng — bỏ trống mau_so` });
      continue;
    }
    if (duongO && !khuVuc.trim()) {
      loi.push({ dong: i + 1, ly: "Có duong thì phải ghi khu_vuc (phường/xã của tuyến đường đó)" });
      continue;
    }
    if (themLay(5).trim()) {
      loi.push({ dong: i + 1, ly: "Bỏ trống vi_tri — lịch sử giá chỉ tách theo dự án / tuyến đường / phường" });
      continue;
    }
    if (!duAnO && !khuVuc.trim()) {
      loi.push({ dong: i + 1, ly: "Thiếu khu_vuc hoặc du_an — lịch sử giá không nhận số cả tỉnh" });
      continue;
    }
    const thap = doiGia(themLay(0));
    const cao = doiGia(themLay(1));
    const soMau = Math.round(Number(themLay(2).split(".").join("")));
    // KHOÁ GOM PHẢI CÓ ĐỦ NĂM CHIỀU, kể cả VỊ TRÍ. Thiếu nó thì hai dãy "mặt tiền
    // đường lớn" và "kiệt hẻm" của cùng một phường bị gom làm một, số của dãy sau
    // đè lên dãy trước — mất hẳn phần phân loại vừa thu thập.
    const vt = docViTri(themLay(5));
    const khoa = [chuanTen(tinh), chuanTen(khuVuc), chuanTen(loaiHinh), mucDich, vt ?? "", chuanTen(duAnO), chuanTen(duongO), chuanTen(loaiConO)].join("|");
    let muc = gom.get(khoa);
    if (!muc) {
      muc = {
        tinh,
        khuVuc: khuVuc || undefined,
        loaiHinh: loaiHinh || undefined,
        mucDich,
        nguon: lay(6) || "Khảo sát của Coastal Land",
        capNhat: lay(7) || homNayVn(),
        nguonLink: themLay(3) || undefined,
        mauSo: docMauSo(themLay(4), loaiHinh),
        viTri: vt,
        duAn: duAnO || undefined,
        duong: duongO || undefined,
        loaiCon: loaiConO || undefined,
        nhapLuc: new Date().toISOString(),
        moc: [],
      };
      gom.set(khoa, muc);
    }
    const giaDong = Math.round((chiKhoang ? (thap + cao) / 2 : gia) * 1_000_000);
    // Thấp/cao chỉ nhận khi đúng phía so với giá phổ biến — điền ngược là sai số
    // liệu, thà bỏ còn hơn vẽ ra một biểu đồ có đường thấp nằm trên đường cao.
    const mocMoi: Omit<MocQuy, "quy"> = {
      giaM2: giaDong,
      thap: Number.isFinite(thap) && thap > 0 && (chiKhoang || thap <= gia) ? Math.round(thap * 1_000_000) : undefined,
      cao: Number.isFinite(cao) && (chiKhoang ? cao >= thap : cao >= gia) ? Math.round(cao * 1_000_000) : undefined,
      soMau: Number.isFinite(soMau) && soMau > 0 ? soMau : undefined,
    };
    // Kỳ 6 tháng / năm suy ra từng quý; quý có dòng số riêng luôn thắng số suy ra
    const { quy: dsQuy, suyRa } = kyRaQuy(ky);
    for (const q of dsQuy) {
      const kq = khoa + "|" + q;
      if (suyRa && quyRieng.has(kq)) continue;
      if (!suyRa) quyRieng.add(kq);
      const cu = muc.moc.find((m) => m.quy === q);
      if (cu) Object.assign(cu, mocMoi);
      else muc.moc.push({ quy: q, ...mocMoi });
    }
  }

  const items = [...gom.values()].map((x) => ({
    ...x,
    moc: [...x.moc].sort((a, b) => a.quy.localeCompare(b.quy)),
  }));
  return { items, loi };
}

/** Tổng tiền thuê mỗi tháng: 58 triệu/tháng · 800 nghìn/tháng. */
export function vndThang(v: number): string {
  if (v >= 1e6) return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(v / 1e6)} triệu/tháng`;
  return `${Math.round(v / 1000).toLocaleString("vi-VN")} nghìn/tháng`;
}

/** Đổi đồng/m² sang chuỗi gọn: 78,5 triệu/m². Tin cho thuê thì thêm "/tháng". */
export function vndM2(v: number, laThue = false): string {
  const duoi = laThue ? "/tháng" : "";
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(".", ",")} tỷ/m²${duoi}`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(".", ",")} triệu/m²${duoi}`;
  return `${Math.round(v / 1000).toLocaleString("vi-VN")} nghìn/m²${duoi}`;
}


// ── SO SÁNH VỚI CÁC PHƯỜNG/XÃ TRONG TỈNH (như Batdongsan, theo HỆ MỚI) ─────
// Hệ mới chỉ còn tỉnh → phường/xã (không còn quận), nên so trong cùng tỉnh/thành:
// cùng loại hình + cùng bán/thuê + đúng mẫu số, giá phổ biến của ĐÚNG quý đang
// hiện. Phường nào không có số quý đó thì không có dòng. Tối đa 10 dòng, luôn có
// phường của tin.

export type OSanh = { ten: string; gia: number; soMau?: number; chinhNo: boolean };

// MỘT KHỐI, MỘT NGUỒN SỐ (chủ dự án 21/10/2026): bảng so sánh dùng CÙNG nguồn với số "Giá phổ biến" trên cùng khối
// (`tuTinh` = dãy của tin là số web tự tính từ tin) — trước đây cùng một phường hiện hai số khác nhau (50,4 trên, 55,0
// dưới). Phường khác chỉ đưa vào khi đủ SO_TIN_TOI_THIEU tin (3 tin không đại diện cho cả phường).
const SO_TIN_TOI_THIEU = 5;
export function soSanhKhuVuc(tin: Listing, items: ChiSoKhuVuc[], ky: string, tuTinh: boolean): OSanh[] {
  const tinhGoc = tin.diaGioi?.province ?? "";
  const phuongGoc = tin.diaGioi?.ward ?? "";
  if (!tinhGoc || !phuongGoc || !ky) return [];
  const loai = chuanTen(tin.type);
  const mucDich = laTinThue(tin.purpose) ? "thue" : "ban";
  const mau = mauSoLichSu(tin.type, mucDich);
  const theoPhuong = new Map<string, OSanh>();
  for (const x of items.map(veQuy)) {
    if (chuanTen(x.tinh) !== chuanTen(tinhGoc) || !x.khuVuc || x.duAn || x.duong || x.viTri) continue;
    if (!x.loaiHinh || chuanTen(x.loaiHinh) !== loai || (x.mucDich ?? "ban") !== mucDich) continue;
    if (x.mauSo !== mau) continue;
    const ph = chuanTen(x.khuVuc);
    const m = x.moc.find((y) => y.quy === ky);
    if (!m) continue;
    if (Boolean(m.soMau) !== tuTinh) continue; // khác nguồn với số trên cùng khối
    const chinhNo = ph === chuanTen(phuongGoc);
    if (tuTinh && !chinhNo && (m.soMau ?? 0) < SO_TIN_TOI_THIEU) continue;
    if (theoPhuong.has(ph)) continue;
    theoPhuong.set(ph, { ten: x.khuVuc, gia: m.giaM2, soMau: m.soMau, chinhNo });
  }
  const ds = [...theoPhuong.values()].sort((a, b) => b.gia - a.gia);
  const goc = ds.find((o) => o.chinhNo);
  if (!goc || ds.length < 2) return [];
  const top = ds.slice(0, 10);
  if (!top.includes(goc)) top[top.length - 1] = goc;
  return top;
}

// ── XU HƯỚNG TỪ KHO CỦA CHÍNH MÌNH ─────────────────────────────────────────
// Bảng gia_khu_vuc_thang chụp mặt bằng giá mỗi tháng và giữ lại vĩnh viễn. Khi
// kho đủ dày (mỗi quý có mẫu), web tự vẽ đường giá của mình và KHÔNG cần số
// mượn bên ngoài nữa — đây chính là cách Batdongsan làm, chỉ khác quy mô.
// Trả mọi dãy của tỉnh + loại hình + bán/thuê (theo dự án, theo phường)
// để bộ chọn 4 bậc (chiSoChoTin) lấy dãy sát nhất mà đủ số.

export async function khoCuaMinh(
  tinh: string,
  loaiHinh: string,
  mucDich: string,
): Promise<ChiSoKhuVuc[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !tinh || !coLichSuGia(loaiHinh)) return [];
  tinh = tenTinhChuan(tinh);

  const q =
    `${url}/rest/v1/gia_khu_vuc_thang` +
    `?select=thang,phuong,du_an,trung_vi,thap,cao,so_mau` +
    `&tinh=eq.${encodeURIComponent(tinh)}` +
    `&loai_hinh=eq.${encodeURIComponent(loaiHinh)}` +
    `&muc_dich=eq.${encodeURIComponent(mucDich)}` +
    `&order=thang.desc&limit=5000`;

  try {
    const r = await fetch(q, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      cache: "no-store",
    });
    if (!r.ok) return [];
    const ds = (await r.json()) as {
      thang: string;
      phuong: string;
      du_an?: string;
      trung_vi: number;
      thap: number;
      cao: number;
      so_mau: number;
    }[];
    if (!Array.isArray(ds)) return [];

    // Gom từng dãy: theo dự án, hoặc theo phường. Mỗi mốc giữ số tin (so_mau)
    // để hiện kèm, như Batdongsan.
    const gom = new Map<string, ChiSoKhuVuc>();
    for (const d of ds) {
      // Mốc tính từ dưới MAU_TOI_THIEU tin không phải số liệu (chủ dự án 23/10/2026: "theo 3 BĐS mà dám đưa ra số liệu") → bỏ
      if (!(d.so_mau >= MAU_TOI_THIEU)) continue;
      const duAn = d.du_an ?? "";
      const tenPhuong = tenPhuongChuan(tinh, d.phuong);
      const khoa = [chuanTen(tenPhuong), duAn].join("|");
      let x = gom.get(khoa);
      if (!x) {
        x = {
          tinh,
          khuVuc: duAn ? undefined : tenPhuong || undefined,
          duAn: duAn || undefined,
          loaiHinh,
          mucDich: mucDich === "thue" ? "thue" : "ban",
          mauSo: mauSoLichSu(loaiHinh, mucDich),
          nguon: "tin đăng trên Coastal Land",
          capNhat: d.thang,
          moc: [],
        };
        gom.set(khoa, x);
      }
      // Cùng tháng đã có (tên phường ghi lệch ở dòng cũ) → giữ dòng nhiều tin hơn.
      const trung = x.moc.find((m) => m.quy === d.thang.slice(0, 7));
      if (trung) {
        if ((trung.soMau ?? 0) >= d.so_mau) continue;
        x.moc.splice(x.moc.indexOf(trung), 1);
      }
      x.moc.push({
        quy: d.thang.slice(0, 7),
        giaM2: Math.round(d.trung_vi),
        thap: d.thap > 0 ? Math.round(d.thap) : undefined,
        cao: d.cao > 0 ? Math.round(d.cao) : undefined,
        soMau: d.so_mau,
      });
    }
    // Xếp cũ → mới, giữ tới 61 tháng (đủ xem 5 năm).
    return [...gom.values()].map((x) => ({ ...x, moc: x.moc.sort((a, b) => a.quy.localeCompare(b.quy)).slice(-61) }));
  } catch {
    return [];
  }
}

/**
 * CÓ ĐỦ SỐ ĐỂ HIỆN KHỐI LỊCH SỬ GIÁ KHÔNG.
 *
 * Chưa đủ thì ẩn HẲN cả khối — không tiêu đề, không một dòng phân trần. Khách
 * vào xem tin không cần biết kho số của mình dày mỏng ra sao; hiện một khối
 * trống chỉ để nói "chưa có" là tự khai điểm yếu.
 *
 * Dùng chung cho trang tin (quyết định có dựng khối không) và cho chính biểu đồ,
 * để không bao giờ xảy ra cảnh tiêu đề có mà bên dưới rỗng.
 */
export function coDuDeHienLichSuGia(
  chiSo: ChiSoKhuVuc | null,
  matBang: MatBangGia | null,
  soSanh: { trungVi: number }[] = [],
): boolean {
  const soMoc = chiSo?.moc?.filter((m) => m.giaM2 > 0).length ?? 0;
  return !!matBang || soMoc >= 2 || soSanh.length >= 2;
}

/**
 * HAI NGUỒN, CHỌN NGUỒN NÀO — lấy nguồn có NHIỀU MỐC HƠN, hoà thì lấy số của
 * chính mình.
 *
 * Kho tự chụp mỗi tháng thêm đúng một mốc, nên lúc mới chạy nó luôn ngắn hơn
 * hẳn dãy nhập tay (7 quý). Nếu cứ hễ có 2 mốc là dùng thì tới đầu tháng sau,
 * một đường hai chấm sẽ đè mất đường bảy quý vừa nhập — vừa mất công nhập, vừa
 * nói lên ít hơn. Khi kho của mình dài hơn thì nó thắng, và web tự chuyển sang
 * số của chính mình, không ai phải bấm gì.
 */

// ── MẶT BẰNG GIÁ THEO LOẠI HÌNH CHO CẢ MỘT KHU VỰC ─────────────────────────
// Dùng ở trang khu vực (/mua-ban/da-nang…): khách vào xem "nhà đất Đà Nẵng" thì
// câu đầu tiên họ muốn biết là mỗi loại hình đang bao nhiêu một mét vuông.

export type DongBangGia = { loai: string; trungVi: number; thap: number; cao: number; soMau: number };

export function bangGiaTheoLoai(tin: Listing[], mucDich: "ban" | "thue" = "ban"): DongBangGia[] {
  const nhom = new Map<string, number[]>();
  for (const x of tin) {
    // "can-thue" cũng thuộc thị trường cho thuê — xem laTinThue().
    if ((laTinThue(x.purpose) ? "thue" : "ban") !== mucDich) continue;
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
      laTinThue(x.purpose) === laTinThue(tin.purpose) &&
      chuanTen(x.diaGioi?.province ?? "") === tinh &&
      giaMoiM2(x) !== null,
  ).length;
}

/** Cùng kỳ năm trước: "2026-08" → "2025-08" · "2026-Q2" → "2025-Q2" */
export function luiMotNam(q: string): string {
  const thang = q.match(/^(\d{4})-(\d{2})$/);
  if (thang) return `${Number(thang[1]) - 1}-${thang[2]}`;
  const quy = q.match(/^(\d{4})-Q([1-4])$/i);
  return quy ? `${Number(quy[1]) - 1}-Q${quy[2]}` : "";
}

/** Kỳ liền trước: "2026-01" → "2025-12" · "2026-Q1" → "2025-Q4". Năm/khác → "". */
export function kyTruoc(q: string): string {
  const thang = q.match(/^(\d{4})-(\d{2})$/);
  if (thang) {
    const n = +thang[1], t = +thang[2];
    return t > 1 ? `${n}-${String(t - 1).padStart(2, "0")}` : `${n - 1}-12`;
  }
  const quy = q.match(/^(\d{4})-Q([1-4])$/i);
  if (quy) return +quy[2] > 1 ? `${quy[1]}-Q${+quy[2] - 1}` : `${+quy[1] - 1}-Q4`;
  return "";
}

/** Số kỳ LIỀN MẠCH (không hổng kỳ nào) tính ngược từ mốc mới nhất. */
export function soKyLienMach(chiSo: ChiSoKhuVuc | null): number {
  const ds = (chiSo?.moc ?? []).filter((m) => m.giaM2 > 0);
  if (!ds.length) return 0;
  const co = new Set(ds.map((m) => m.quy));
  let q = ds[ds.length - 1].quy;
  let n = 0;
  while (q && co.has(q)) {
    n++;
    q = kyTruoc(q);
  }
  return n;
}

/** ĐỦ SỐ LIỆU để hiện Lịch sử giá: từ cùng kỳ năm trước tới mốc mới nhất phải có
 *  ĐỦ MỌI KỲ, không hổng kỳ nào (13 tháng hoặc 5 quý). Thiếu một kỳ là không hiện — ghi "Dữ liệu sẽ được cập nhật".
 *  (23/10/2026 chủ dự án: bỏ biểu đồ 2 kỳ + bỏ số tự tính từ 1–2 tin / cả tỉnh, trở về đúng chốt.) */
export function coDuLichSuGia(chiSo: ChiSoKhuVuc | null): boolean {
  const ds = (chiSo?.moc ?? []).filter((m) => m.giaM2 > 0);
  const cuoi = ds[ds.length - 1];
  if (!cuoi) return false;
  const moiNam = /^\d{4}-\d{2}$/.test(cuoi.quy) ? 12 : /^\d{4}-Q[1-4]$/i.test(cuoi.quy) ? 4 : 0;
  return moiNam > 0 && soKyLienMach(chiSo) >= moiNam + 1;
}
