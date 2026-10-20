import { normalizeVi } from "@/lib/filters";
import { chuChuaHieu, parseQuery } from "@/lib/smartSearch";
import { duongDanGanNhat } from "@/lib/duongDanTim";
import { timDuAn, type DuAnTen } from "@/lib/duAnTen";

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

/** Đặc điểm đọc lại ĐÚNG cách khách nói ("gần biển" / "view biển", "sổ đỏ", "gần trường đại học") — nq: câu bỏ dấu, có cách hai đầu */
export function docDacDiem(features: string[], nq: string): string {
  return features.filter((f) => f !== "trung tâm").map((f) => {
    if (f === "view biển") return / view bien | huong bien /.test(nq) ? "view biển" : "gần biển";
    if (f === "sổ hồng" && / so do /.test(nq) && !/ so hong /.test(nq)) return "sổ đỏ";
    if (f === "gần trường" && / dai hoc /.test(nq)) return / gan truong dai hoc /.test(nq) ? "gần trường đại học" : "gần đại học";
    return f;
  }).join(", ");
}

export function goiYTheoY(raw: string, mucDangDung: MucTim, dsDuAn: DuAnTen[] = []): DongGoiY[] {
  const p = parseQuery(raw);
  const nq = ` ${normalizeVi(raw).replace(/[^a-z0-9]+/g, " ")} `;
  const loai = p.types[0]?.toLowerCase() ?? (/ nha /.test(nq) && !/ nha dat /.test(nq) ? "nhà" : "");
  const pl = p.place;
  // Tên nơi đọc gọn: "Phường Hải Vân" → "Hải Vân" (khách gõ tên riêng, không gõ cấp)
  const noi = (pl?.ward ?? pl?.district ?? pl?.province ?? p.places[0] ?? "").replace(/^(Phường|Xã|Thị trấn|Đặc khu)\s+/i, "");

  const ds: DongGoiY[] = [];
  const them = (m: MucTim, nhan: string, href = hrefGoiY(m, nhan)) => {
    if (ds.some((x) => normalizeVi(x.nhan) === normalizeVi(nhan))) return;
    ds.push({ nhan, muc: m, href });
  };

  // TÊN DỰ ÁN (từ khoá ngắn ngoài các trường đã cấu trúc — chủ dự án 21/10/2026): "Dự án X" mở trang thông tin dự án (nếu có);
  // "Bán / Cho thuê … X" mở tin THUỘC dự án đó (trường Dự án của tin) — chỉ hiện phía có tin, trừ khi khách nói rõ mua/thuê.
  const khopDa = dsDuAn.length ? timDuAn(raw, dsDuAn, true) : null;
  const tronDa = khopDa && timDuAn(raw, dsDuAn, false);
  // TỪ CHƯA HIỂU (chủ dự án 21/10/2026: không hiểu một từ ≠ không hiểu câu): giữ NGUYÊN cụm từ khách gõ trong dòng gợi ý,
  // không ép vào trường mặc định nào; bấm tìm thì dò trong nội dung tin (cauThanhBoLoc). Không hiểu được trường nào → không gợi ý.
  const chuaHieu = chuChuaHieu(raw, tronDa ? [tronDa.cach] : []);
  if (khopDa) {
    const d = khopDa.duAn;
    if (d.coTrang && !p.purpose) them(mucDangDung, `Dự án ${d.ten}`, `/du-an/${d.slug}`);
    const cacMuc: MucTim[] = p.purpose ? [p.purpose] : mucDangDung === "thue" ? ["thue", "ban"] : ["ban", "thue"];
    for (const m of cacMuc) {
      if ((m === "ban" ? d.ban : d.thue) === 0 && p.purpose !== m) continue;
      them(m, [DONG_TU[m], p.types[0]?.toLowerCase(), d.ten].filter(Boolean).join(" "), `${m === "thue" ? "/cho-thue" : "/mua-ban"}?duan=${encodeURIComponent(d.ten)}`);
    }
    // Gõ TRỌN tên dự án → chữ địa danh nằm trong tên dự án không phải nơi khách tìm ("Vinhomes Hải Vân Bay" ≠ phường Hải Vân)
    if (tronDa) return ds.slice(0, 4);
  }
  // Câu chung ("nhà đất", "bất động sản") hiểu được là mọi loại, mọi nơi → vẫn gợi ý theo mục đích
  if (!loai && !noi && !/ (nha dat|bat dong san|bds) /.test(nq)) return ds;

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
  const dacDiem = docDacDiem(p.features, nq);
  // "trung tâm" đọc như nơi chốn: "Bán nhà tại trung tâm Đà Nẵng" (không phải "nhà trung tâm tại Đà Nẵng")
  const taiTT = p.features.includes("trung tâm") ? "trung tâm " : "";
  const pn = p.beds ? `${p.beds} phòng ngủ` : "";
  const gia = p.priceMaxTy != null
    ? `dưới ${p.priceMaxTy >= 1 ? `${p.priceMaxTy} tỷ` : `${Math.round(p.priceMaxTy * 1000)} triệu`}`
    : p.priceMinTy != null ? `trên ${p.priceMinTy >= 1 ? `${p.priceMinTy} tỷ` : `${Math.round(p.priceMinTy * 1000)} triệu`}` : "";
  const cau = (dongTu: string, tai: string) =>
    // chưa rõ loại mà từ chưa hiểu tự gọi tên món ("căn góc 2 mặt tiền") → đọc thẳng từ đó, không chêm "nhà đất"
    [dongTu, loai || (chuaHieu && !dacDiem && /^căn /i.test(chuaHieu) ? "" : "nhà đất"), pn, [dacDiem, chuaHieu].filter(Boolean).join(", "), tai ? `tại ${taiTT}${tai}` : "", gia].filter(Boolean).join(" ");

  for (const m of muc) them(m, cau(DONG_TU[m], noi));
  // Nới khu vực ra cả tỉnh — cùng loại hình, cùng đặc điểm
  const tinh = pl?.province;
  if (tinh && noi && tinh !== noi && loai) for (const m of muc) them(m, cau(DONG_TU[m], tinh));
  return ds.slice(0, 4);
}
