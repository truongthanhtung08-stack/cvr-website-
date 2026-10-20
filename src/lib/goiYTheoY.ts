import { normalizeVi } from "@/lib/filters";
import { parseQuery } from "@/lib/smartSearch";
import { duongDanGanNhat } from "@/lib/duongDanTim";

// ============================================================================
// GỢI Ý THEO Ý CÂU GÕ — MỘT hàm cho MỌI ô tìm (trang chủ, Mua bán, Cho thuê; PC và điện thoại)
// ----------------------------------------------------------------------------
// Chủ dự án 21/10/2026: bỏ gợi ý kiểu Google khớp ký tự ("Xã Hội An, An Giang", "Mua biệt thự tại Hội An" in đậm phần web
// tự thêm). Gợi ý dựng từ đúng Ý câu: MỤC ĐÍCH + LOẠI HÌNH + KHU VỰC + ĐẶC ĐIỂM.
//   · Câu không nói mua hay thuê → gợi ý CẢ "Bán …" lẫn "Cho thuê …" (mục đang đứng trước); trừ loại chỉ có một phía
//     (đất → bán; phòng trọ → thuê) hoặc giá đã nói rõ (tỷ → bán; triệu → thuê).
//   · Địa danh trùng tên → nơi nổi tiếng (Hội An = Hội An, Đà Nẵng) — parseQuery đã chọn; nơi khác khách phải gõ tỉnh.
//   · Giữ đặc điểm khách gõ ("gần biển"), rồi một dòng nới ra cả tỉnh, cùng loại hình.
// Không hiểu được loại hình hay khu vực nào → không gợi ý gì (chỉ còn dòng câu khách gõ, nơi gọi tự thêm).
// ============================================================================
export type MucTim = "ban" | "thue";
export type DongGoiY = { nhan: string; muc: MucTim; href: string };

const DONG_TU: Record<MucTim, string> = { ban: "Bán", thue: "Cho thuê" };

/** Đường dẫn của một dòng gợi ý: trang danh mục gần nhất của đúng mục + giữ nguyên câu để lọc chi tiết */
export function hrefGoiY(muc: MucTim, nhan: string): string {
  const goc = duongDanGanNhat(muc, nhan)?.split("?")[0] ?? (muc === "thue" ? "/cho-thue" : "/mua-ban");
  return `${goc}?q=${encodeURIComponent(nhan)}`;
}

export function goiYTheoY(raw: string, mucDangDung: MucTim): DongGoiY[] {
  const p = parseQuery(raw);
  const nq = ` ${normalizeVi(raw).replace(/[^a-z0-9]+/g, " ")} `;
  const loai = p.types[0]?.toLowerCase() ?? (/ nha /.test(nq) && !/ nha dat /.test(nq) ? "nhà" : "");
  const pl = p.place;
  const noi = pl?.ward ?? pl?.district ?? pl?.province ?? p.places[0] ?? "";
  if (!loai && !noi) return [];

  // Mục đích: câu nói rõ → đúng mục đó; không nói → cả hai, trừ khi loại hình / giá chỉ thuộc một phía
  let muc: MucTim[];
  if (p.purpose) muc = [p.purpose];
  else if (p.types.length && p.types.every((t) => /^đất/i.test(t))) muc = ["ban"];
  else if (p.types.length && p.types.every((t) => ["Phòng trọ", "Văn phòng", "Mặt bằng"].includes(t))) muc = ["thue"];
  else if ((p.priceMaxTy ?? p.priceMinTy ?? 0) >= 1 || / \d+[.,]?\d* ?(ty|ti) /.test(nq)) muc = ["ban"];
  else if (p.priceMaxTy != null || p.priceMinTy != null) muc = ["thue"];
  else if (/ \d+[.,]?\d* ?(trieu|tr) /.test(nq) && !/ \d+[.,]?\d* ?(ty|ti) /.test(nq)) muc = ["thue"]; // "căn hộ 10 triệu" = giá thuê tháng
  else muc = mucDangDung === "thue" ? ["thue", "ban"] : ["ban", "thue"];

  // Đặc điểm: đọc lại đúng cách khách nói ("gần biển" / "view biển")
  const dacDiem = p.features.map((f) => (f === "view biển" && !/ view bien | huong bien /.test(nq) ? "gần biển" : f)).join(", ");
  const pn = p.beds ? `${p.beds} phòng ngủ` : "";
  const gia = p.priceMaxTy != null
    ? `dưới ${p.priceMaxTy >= 1 ? `${p.priceMaxTy} tỷ` : `${Math.round(p.priceMaxTy * 1000)} triệu`}`
    : p.priceMinTy != null ? `trên ${p.priceMinTy >= 1 ? `${p.priceMinTy} tỷ` : `${Math.round(p.priceMinTy * 1000)} triệu`}` : "";
  const cau = (dongTu: string, tai: string) =>
    [dongTu, loai || "nhà đất", pn, dacDiem, tai ? `tại ${tai}` : "", gia].filter(Boolean).join(" ");

  const ds: DongGoiY[] = [];
  const them = (m: MucTim, nhan: string) => {
    if (ds.some((x) => normalizeVi(x.nhan) === normalizeVi(nhan))) return;
    ds.push({ nhan, muc: m, href: hrefGoiY(m, nhan) });
  };
  for (const m of muc) them(m, cau(DONG_TU[m], noi));
  // Nới khu vực ra cả tỉnh — cùng loại hình, cùng đặc điểm
  const tinh = pl?.province;
  if (tinh && noi && tinh !== noi && loai) for (const m of muc) them(m, cau(DONG_TU[m], tinh));
  return ds.slice(0, 4);
}
