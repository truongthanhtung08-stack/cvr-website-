import { applyFilters, diemTen, emptyFilters, khopTen, matchType, normalizeVi, typeGroupsFor, type Filters, type LocationSel } from "@/lib/filters";
import { parseQuery } from "@/lib/smartSearch";
import { tenTinhTuongDuong } from "@/lib/locations";
import { duAnThuocNhom, projectCategories } from "@/lib/categories";
import { laChuDauTuThat, slugChuDauTu } from "@/lib/chuDauTu";

// ============================================================================
// BỘ LỌC DỰ ÁN — MỘT GỐC cho trang Dự án và tab Dự án của bộ lọc tổng trang chủ (chủ dự án 01/11/2026: "xây từ cha → con, con → cha,
// từng bộ phận, từng phần — gom về bộ lọc tổng"; "không logic thì lệch cả bộ lọc, gợi ý sai lệch").
// Khách chọn trường nào trước cũng được: mỗi trường chỉ hiện lựa chọn còn khớp với TẤT CẢ các trường KHÁC đã chọn. Khách chưa chọn trường
// khác thì danh sách để ĐỦ (coTruongKhac). Gợi ý khi gõ lấy đúng tập kết quả này, khớp tên kiểu Google (khopTen / diemTen).
// ============================================================================

/** Một dự án để lọc — dựng từ hồ sơ dự án / dòng tra cứu (trường trống = "") */
/** Tình trạng dự án CHỌN NHIỀU (chủ dự án 02/11/2026) — lưu một chuỗi, các tình trạng cách nhau "|" */
export const dsTinhTrang = (s?: string) => (s ?? "").split("|").filter(Boolean);

export type DuAnLoc = {
  slug: string;
  ten: string;
  chuDauTu: string;
  loaiHinh: string;
  tinhTrang: string;
  /** Địa chỉ để dò khu vực — gộp địa chỉ mới + cũ + tỉnh (bộ lọc khớp cả hai hệ) */
  diaChiTim: string;
  tinh: string;
};

export type TruongDa = "kv" | "loai" | "cdt" | "tt" | "da";

// LOẠI HÌNH DỰ ÁN = CÂY LOẠI HÌNH MUA BÁN (chủ dự án 01/11/2026: "loại hình bất động sản mua bán / cho thuê cha – con đã cấu trúc rất
// rõ — cấu trúc web từ đầu đã tính bộ lọc theo những trường này; không khớp thì dữ liệu ra kết quả thế nào"). Một dự án mang loại nào
// trong cây là đọc từ chữ loại hình của hồ sơ (hoặc loại của các tin thật thuộc dự án — traCuuDuAn): tách từng vế, khớp đúng lựa chọn
// của cây, rồi đọc thêm bằng bộ hiểu câu (parseQuery: "Tổ hợp căn hộ cao cấp…" → Căn hộ). Bộ lọc Dự án dùng CHÍNH cây đó (f.types).
/** Cây loại hình của Dự án = cây Mua bán gộp thêm nhóm, loại chỉ có ở Cho thuê (văn phòng, mặt bằng…) — bỏ nhóm "Khác", phòng trọ */
export const CAY_LOAI_DU_AN = (() => {
  const m = new Map<string, string[]>();
  for (const g of [...typeGroupsFor("ban"), ...typeGroupsFor("thue")]) {
    if (g.label === "Khác" || g.label === "Phòng trọ") continue;
    const cu = m.get(g.label) ?? [];
    // cùng nghĩa giữa hai cây ("Nhà biệt thự / Liền kề" ≈ "Biệt thự / Liền kề", "Shophouse / Nhà phố thương mại" ≈ "Nhà phố thương mại") → một
    const dau = (x: string) => normalizeVi(x.split("/")[0].trim());
    for (const o of g.items) if (!cu.some((x) => normalizeVi(x).includes(dau(o)) || normalizeVi(o).includes(dau(x)))) cu.push(o);
    m.set(g.label, cu);
  }
  return [...m].map(([label, items]) => ({ label, items }));
})();
const LUA_CHON_LOAI = CAY_LOAI_DU_AN.flatMap((g) => g.items);
export function loaiCuaDuAn(loaiHinh: string): string[] {
  if (!loaiHinh) return [];
  const ra = new Set<string>();
  for (const ve of loaiHinh.split(/[,;·]/).map((x) => x.trim()).filter(Boolean)) {
    for (const o of LUA_CHON_LOAI) if (matchType(ve, o)) ra.add(o); // một chiều: "Căn hộ cao cấp" → Căn hộ (không ra Căn hộ dịch vụ)
  }
  // bộ hiểu câu: nhãn trùng ĐÚNG lựa chọn thì lấy đúng; không thì lựa chọn có chứa nhãn ("Biệt thự" → Nhà biệt thự / Liền kề)
  for (const nhan of parseQuery(loaiHinh).types) {
    const dung = LUA_CHON_LOAI.filter((o) => matchType(nhan, o));
    const chua = LUA_CHON_LOAI.filter((o) => normalizeVi(o).includes(normalizeVi(nhan)));
    for (const o of dung.length ? dung : chua.slice(0, 1)) ra.add(o); // không trùng đúng → một loại gần nhất theo thứ tự cây
  }
  // "Nghỉ dưỡng" trơn = khu nghỉ dưỡng (không phải condotel)
  if (/ nghi duong /.test(` ${normalizeVi(loaiHinh)} `) && !ra.size) ra.add("Khu nghỉ dưỡng");
  return [...ra];
}

export const tinhCua = (diaChi: string) => diaChi.split(",").pop()?.trim() ?? "";

export const khopKhuVuc = (diaChi: string, locations: LocationSel[], tinh?: string) =>
  !locations.length ||
  locations.some((l) =>
    // Chọn CẢ TỈNH: so ĐÚNG tỉnh của dự án — so chữ trong địa chỉ thì "Điện Biên" khớp nhầm đường Điện Biên Phủ (Đà Nẵng) (01/11/2026)
    !l.district && !l.ward && tinh
      ? tenTinhTuongDuong(l.province).includes(tinh)
      : applyFilters([{ id: "", title: "", price: "", area: "", type: "", location: diaChi, diaChiTim: diaChi }], { ...emptyFilters(), locations: [l] }).length > 0);

export function thuHepDuAn<T extends DuAnLoc>(ds: T[], f: Filters) {
  const loaiNho = new Map<string, string[]>();
  const loaiCua = (loai: string) => { let r = loaiNho.get(loai); if (!r) { r = loaiCuaDuAn(loai); loaiNho.set(loai, r); } return r; };
  const khopLoai = (loai: string) =>
    (!f.types.length || loaiCua(loai).some((o) => f.types.includes(o))) &&
    (!f.loaiDuAn?.length || projectCategories.some((c) => f.loaiDuAn!.includes(c.slug) && duAnThuocNhom([{ type: loai }], c).length > 0));
  const khopCdt = (ten: string) => !f.chuDauTu || slugChuDauTu(ten) === slugChuDauTu(f.chuDauTu);
  const khopTru = (p: T, tru: TruongDa) =>
    (tru === "kv" || khopKhuVuc(p.diaChiTim, f.locations, p.tinh)) &&
    (tru === "loai" || khopLoai(p.loaiHinh)) &&
    (tru === "cdt" || khopCdt(p.chuDauTu)) &&
    (tru === "tt" || !f.tinhTrang || dsTinhTrang(f.tinhTrang).includes(p.tinhTrang)) &&
    (tru === "da" || !f.project || p.ten === f.project);

  const choLoaiDs = ds.filter((p) => khopTru(p, "loai"));
  const choLoai = choLoaiDs.map((p) => ({ type: p.loaiHinh }));
  const cdt = new Map<string, string>();
  for (const p of ds) if (laChuDauTuThat(p.chuDauTu) && khopTru(p, "cdt")) cdt.set(slugChuDauTu(p.chuDauTu), p.chuDauTu.trim());
  // MỘT TẬP dự án cho bảng chọn Dự án + gợi ý khi gõ = đúng tập kết quả theo các trường đã chọn (không lệch nhau)
  const tapDuAn = ds.filter((p) => khopTru(p, "da"));

  return {
    tapDuAn,
    demLoai: (slug: string) => { const c = projectCategories.find((x) => x.slug === slug); return c ? duAnThuocNhom(choLoai, c).length : 0; },
    /** Số dự án của một lựa chọn trong CÂY LOẠI HÌNH (theo mọi trường khác đã chọn) */
    demLoaiBds: (o: string) => choLoaiDs.filter((p) => loaiCua(p.loaiHinh).includes(o)).length,
    dsChuDauTu: [...cdt.values()].sort((a, b) => a.localeCompare(b, "vi")),
    tinhTrangCo: [...new Set(ds.filter((p) => khopTru(p, "tt")).map((p) => p.tinhTrang).filter(Boolean))],
    /** Khách đã chọn trường KHÁC chưa — chưa thì danh sách trường này để đủ */
    coTruongKhac: (tru: TruongDa) =>
      (tru !== "kv" && f.locations.length > 0) || (tru !== "loai" && (!!f.loaiDuAn?.length || f.types.length > 0)) || (tru !== "cdt" && !!f.chuDauTu) ||
      (tru !== "tt" && !!f.tinhTrang) || (tru !== "da" && !!f.project),
    /** Gợi ý khi gõ: dự án trong tập kết quả khớp tên / chủ đầu tư kiểu Google — trùng TÊN dự án xếp trước */
    goiY: (kw: string, toiDa = 6) =>
      tapDuAn
        .filter((p) => khopTen(`${p.ten} ${p.chuDauTu}`, kw))
        .map((p) => ({ p, d: diemTen(p.ten, kw) * 10 + diemTen(p.chuDauTu, kw) }))
        .sort((a, b) => b.d - a.d)
        .slice(0, toiDa)
        .map((x) => x.p),
  };
}
