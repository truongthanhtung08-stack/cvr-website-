import { findCategory, rentCategories, saleCategories } from "@/lib/categories";
import { timKhuVuc, slugKhuVuc } from "@/lib/khuVuc";
import { emptyFilters, normalizeVi, type Filters } from "@/lib/filters";
import { parseQuery, LOAI_HINH } from "@/lib/smartSearch";
import { THANH_PHO } from "@/lib/pseo";

// ============================================================================
// TÌM XONG VỀ TRANG SẠCH (bộ lọc trang chủ, 17/10/2026)
// ----------------------------------------------------------------------------
// Bộ lọc khớp đúng một trang pSEO có sẵn (loại hình · tỉnh · mức giá dưới X) → trả đường dẫn sạch
// (/mua-ban/can-ho-chung-cu/da-nang) — trang đang lên Google, khách chia sẻ link gọn.
// Còn lại (từ khoá, phường, diện tích, nhiều nơi, lọc thêm…) → null, nơi gọi dùng trang lọc như cũ.
// Chỉ ghép những dạng trang LUÔN mở được (không phụ thuộc có tin hay không) — không dẫn khách vào 404.
// ============================================================================

export const GIA_DUOI: Record<"ban" | "thue", number[]> = { ban: [1, 2, 3, 5, 10], thue: [3, 5, 10, 20] };

export function duongDanSach(muc: "ban" | "thue", f: Filters): string | null {
  const conLai =
    f.keyword.trim() || f.project || f.areaMin != null || f.areaMax != null || f.priceMin != null ||
    f.beds || f.direction || f.legal || f.furnishing || f.verified || f.broker || f.locations.length > 1;
  if (conLai) return null;
  const goc = muc === "thue" ? "/cho-thue" : "/mua-ban";

  const loc = f.locations[0];
  if (loc && (loc.district || loc.ward)) return null;
  const tinh = loc ? timKhuVuc(slugKhuVuc(loc.province)) : null;
  if (loc && !tinh) return null;

  let cat = null;
  if (f.types.length) {
    const ds = muc === "thue" ? rentCategories : saleCategories;
    cat = ds.find((c) => c.types.length === f.types.length && c.types.every((t) => f.types.includes(t))) ?? null;
    if (!cat) return null;
  }

  let giaDuoi = "";
  if (f.priceMax != null) {
    // Bộ lọc giữ giá theo TỶ cho cả bán lẫn thuê
    const tri = muc === "thue" ? Math.round(f.priceMax * 1000) : f.priceMax;
    if (!GIA_DUOI[muc].includes(tri) || !cat || !tinh) return null;
    giaDuoi = muc === "thue" ? `gia-duoi-${tri}-trieu` : `gia-duoi-${tri}-ty`;
  }

  if (cat && tinh) return `${goc}/${cat.slug}/${tinh.slug}${giaDuoi ? `/${giaDuoi}` : ""}`;
  if (cat) return findCategory(muc === "thue" ? rentCategories : saleCategories, cat.slug) ? `${goc}/${cat.slug}` : null;
  if (tinh) return `${goc}/${tinh.slug}`;
  return goc;
}

// Ô TÌM THÔNG MINH (chủ dự án 17/10/2026: "bộ lọc thông minh thì không cần dòng menu dài"): khách gõ
// MỘT câu — "căn hộ Nha Trang", "bán đất Đà Nẵng dưới 3 tỷ" — máy tách ra loại hình · thành phố/tỉnh ·
// giá rồi đưa tới đúng trang sạch. Câu có đặc điểm riêng (gần biển, 3 phòng ngủ, tên phường…) → null,
// nơi gọi về trang kết quả lọc như cũ (bộ tìm thông minh ở đó xử lý trọn câu).
export function duongDanTuCau(mucTab: "ban" | "thue", raw: string): string | null {
  const p = parseQuery(raw);
  if (p.features.length || p.beds || p.priceMinTy != null) return null;
  // Thành phố lớn là từ khoá chính ("Nha Trang", "Đà Lạt"…) → trang thành phố. Dò TRƯỚC địa giới:
  // tên thành phố cũng là tên quận cũ, dò sau thì bị coi là "quận" và rơi về trang lọc.
  const nq = ` ${normalizeVi(raw).replace(/[^a-z0-9]+/g, " ")} `;
  const tp = THANH_PHO.find((t) => nq.includes(` ${normalizeVi(t.name).replace(/[^a-z0-9]+/g, " ")} `));
  // CHÍNH XÁC (chủ dự án 17/10: "bộ lọc chính xác và đơn giản"): chỉ nhận tên tỉnh đứng thành TỪ TRỌN
  // ("thuê" không phải "Huế", "văn phòng" không phải "Văn Phong"). Câu còn chữ máy không chắc hiểu
  // (tên phường, đặc điểm…) → null: về trang kết quả tìm đầy đủ, không đoán.
  const coTu = (ten: string) => nq.includes(` ${normalizeVi(ten).replace(/[^a-z0-9]+/g, " ")} `);
  const places = p.places.filter(coTu);
  let con = nq.replace(/(duoi|tren|tu|den|nho hon|lon hon)?\s*\d+[.,]?\d*\s*(ty|ti|trieu|tr)\b/g, " ");
  const bo = [
    ...LOAI_HINH.flatMap(([, keys]) => keys),
    ...places.map((t) => normalizeVi(t)),
    ...(tp ? [normalizeVi(tp.name), normalizeVi(tp.tinh)] : []),
    "nha dat", "bat dong san", "bds", "can ban", "cho thue", "can mua", "ban", "mua", "thue", "can", "tim", "nha", "tai", "o", "khu vuc", "gia re",
  ].sort((x, y) => y.length - x.length);
  for (const k of bo) con = con.replace(new RegExp(`(^| )${k.replace(/[^a-z0-9 ]/g, "")}(?= |$)`, "g"), " ");
  if (con.trim()) return null;
  const typeOnlyThue = p.types.length > 0 && p.types.every((t) => ["Văn phòng", "Mặt bằng", "Phòng trọ"].includes(t));
  const muc = p.purpose ?? (typeOnlyThue ? "thue" : mucTab);
  const goc = muc === "thue" ? "/cho-thue" : "/mua-ban";

  // Nhãn loại hình của bộ tách câu → trang loại hình (theo mục đích). Không có trang tương ứng → null.
  const LOAI: Record<string, { ban?: string; thue?: string }> = {
    "Chung cư": { ban: "can-ho-chung-cu", thue: "can-ho-chung-cu" },
    "Căn hộ": { ban: "can-ho-chung-cu", thue: "can-ho-chung-cu" },
    "Nhà riêng": { ban: "nha-rieng", thue: "nha-rieng" },
    "Nhà mặt phố": { ban: "nha-mat-pho", thue: "nha-mat-pho" },
    "Biệt thự": { ban: "biet-thu-lien-ke", thue: "biet-thu-lien-ke" },
    "Shophouse": { ban: "shophouse", thue: "shophouse" },
    "Đất nền": { ban: "dat", thue: "kho-nha-xuong" },
    "Condotel": { ban: "condotel" },
    "Đất nông nghiệp": { ban: "dat" },
    "Homestay": { ban: "homestay-farmstay", thue: "homestay-farmstay" },
    "Khu nghỉ dưỡng": { ban: "khu-nghi-duong" },
    "Kho xưởng": { ban: "kho-nha-xuong", thue: "kho-nha-xuong" },
    "Văn phòng": { thue: "van-phong" },
    "Mặt bằng": { thue: "cua-hang-ki-ot" },
    "Phòng trọ": { thue: "phong-tro" },
  };
  let loai = "";
  if (p.types.length) {
    const slugs = new Set(p.types.map((t) => LOAI[t]?.[muc]));
    if (slugs.size !== 1 || slugs.has(undefined)) return null;
    loai = [...slugs][0]!;
  } else if (/ nha /.test(nq) && !/ nha dat /.test(nq)) {
    loai = "nha"; // "bán nhà Huế" → nhóm Nhà (trang pSEO /mua-ban/nha/<tỉnh>)
  }

  const tinh = tp ? timKhuVuc(slugKhuVuc(tp.tinh)) : places.length === 1 ? timKhuVuc(slugKhuVuc(places[0])) : null;
  if (places.length > 1 && !tp) return null;
  if ((tp || places.length) && !tinh) return null;

  let gia = "";
  if (p.priceMaxTy != null) {
    const tri = muc === "thue" ? Math.round(p.priceMaxTy * 1000) : p.priceMaxTy;
    if (!GIA_DUOI[muc].includes(tri) || !loai || !tinh || tp) return null;
    gia = muc === "thue" ? `gia-duoi-${tri}-trieu` : `gia-duoi-${tri}-ty`;
  }

  // "giá rẻ" không làm trang riêng (không đo được) → xếp giá thấp trước trên trang kết quả
  const reTruoc = / gia re /.test(nq) ? "?sapxep=gia-tang" : "";
  const phan = [goc];
  if (loai) phan.push(loai);
  if (tinh) phan.push(tinh.slug);
  if (tp) phan.push(tp.slug);
  else if (gia) phan.push(gia);
  return phan.join("/") + reTruoc;
}

// TRANG pSEO GẦN NHẤT (chủ dự án 17/10/2026: tìm "căn hộ chung cư Khánh Hòa dưới 3 tỷ view biển" ra trang chung chung, trong
// khi trang pSEO "Bán căn hộ chung cư Khánh Hòa dưới 3 tỷ" có sẵn ngay cuối trang). Câu có thêm chi tiết web không làm trang
// riêng → về trang pSEO đúng LOẠI · NƠI · GIÁ, giữ nguyên câu trong ?q để ô tìm hiện lại và tin khớp chi tiết xếp lên đầu.
// Trang pSEO vẫn tự trỏ canonical về chính nó (không sinh trang trùng cho Google).
export function duongDanGanNhat(muc: "ban" | "thue", raw: string): string | null {
  const thang = duongDanTuCau(muc, raw);
  if (thang) return thang;
  const p = parseQuery(raw);
  const nq = ` ${normalizeVi(raw).replace(/[^a-z0-9]+/g, " ")} `;
  const loai = p.types.join(" ") || (/ nha /.test(nq) && !/ nha dat /.test(nq) ? "nhà" : "");
  const gia = p.priceMaxTy != null ? `dưới ${p.priceMaxTy} tỷ` : "";
  const dongTu = p.purpose === "thue" ? "thuê" : p.purpose === "ban" ? "bán" : "";
  // thử nơi cụ thể trước (thành phố như Nha Trang), không được thì về tỉnh
  const noiThu = [p.place?.district, p.place?.province ?? p.places[0]].filter(Boolean) as string[];
  for (const noi of noiThu) {
    const u = duongDanTuCau(muc, [dongTu, loai, noi, gia].filter(Boolean).join(" "));
    if (u && u.split("?")[0].split("/").length > 2) {
      const [duong, cu] = u.split("?");
      const q = new URLSearchParams(cu);
      q.set("q", raw.trim());
      return `${duong}?${q.toString()}`;
    }
  }
  return null;
}

// BỘ TÌM 3 BƯỚC TRANG CHỦ (kiểu Airbnb, 17/10/2026): Ở đâu · Loại hình · Mức giá → trang sạch.
// duongNoi = "<tỉnh>" hoặc "<tỉnh>/<thành phố>" · nhom = slug trang nhóm loại hình · giaDuoi = số tỷ (bán) / triệu (thuê).
// Mức giá chỉ ghép được khi có đủ nhóm + tỉnh và không có thành phố (đúng dạng trang pSEO đang có) — còn lại null.
export function duongDanBuoc(muc: "ban" | "thue", duongNoi: string | null, nhom: string | null, giaDuoi: number | null): string | null {
  const [tinh, tp] = (duongNoi ?? "").split("/").filter(Boolean);
  if (giaDuoi != null && (!nhom || !tinh || tp || !GIA_DUOI[muc].includes(giaDuoi))) return null;
  const gia = giaDuoi == null ? null : muc === "thue" ? `gia-duoi-${giaDuoi}-trieu` : `gia-duoi-${giaDuoi}-ty`;
  return [muc === "thue" ? "/cho-thue" : "/mua-ban", nhom, tinh, tp, gia].filter(Boolean).join("/");
}
