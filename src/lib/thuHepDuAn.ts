import { applyFilters, diemTen, emptyFilters, khopTen, type Filters, type LocationSel } from "@/lib/filters";
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

export const tinhCua = (diaChi: string) => diaChi.split(",").pop()?.trim() ?? "";

export const khopKhuVuc = (diaChi: string, locations: LocationSel[], tinh?: string) =>
  !locations.length ||
  locations.some((l) =>
    // Chọn CẢ TỈNH: so ĐÚNG tỉnh của dự án — so chữ trong địa chỉ thì "Điện Biên" khớp nhầm đường Điện Biên Phủ (Đà Nẵng) (01/11/2026)
    !l.district && !l.ward && tinh
      ? tenTinhTuongDuong(l.province).includes(tinh)
      : applyFilters([{ id: "", title: "", price: "", area: "", type: "", location: diaChi, diaChiTim: diaChi }], { ...emptyFilters(), locations: [l] }).length > 0);

export function thuHepDuAn<T extends DuAnLoc>(ds: T[], f: Filters) {
  const khopLoai = (loai: string) =>
    !f.loaiDuAn?.length || projectCategories.some((c) => f.loaiDuAn!.includes(c.slug) && duAnThuocNhom([{ type: loai }], c).length > 0);
  const khopCdt = (ten: string) => !f.chuDauTu || slugChuDauTu(ten) === slugChuDauTu(f.chuDauTu);
  const khopTru = (p: T, tru: TruongDa) =>
    (tru === "kv" || khopKhuVuc(p.diaChiTim, f.locations, p.tinh)) &&
    (tru === "loai" || khopLoai(p.loaiHinh)) &&
    (tru === "cdt" || khopCdt(p.chuDauTu)) &&
    (tru === "tt" || !f.tinhTrang || p.tinhTrang === f.tinhTrang) &&
    (tru === "da" || !f.project || p.ten === f.project);

  const choLoai = ds.filter((p) => khopTru(p, "loai")).map((p) => ({ type: p.loaiHinh }));
  const cdt = new Map<string, string>();
  for (const p of ds) if (laChuDauTuThat(p.chuDauTu) && khopTru(p, "cdt")) cdt.set(slugChuDauTu(p.chuDauTu), p.chuDauTu.trim());
  // MỘT TẬP dự án cho bảng chọn Dự án + gợi ý khi gõ = đúng tập kết quả theo các trường đã chọn (không lệch nhau)
  const tapDuAn = ds.filter((p) => khopTru(p, "da"));

  return {
    tapDuAn,
    demLoai: (slug: string) => { const c = projectCategories.find((x) => x.slug === slug); return c ? duAnThuocNhom(choLoai, c).length : 0; },
    dsChuDauTu: [...cdt.values()].sort((a, b) => a.localeCompare(b, "vi")),
    tinhTrangCo: [...new Set(ds.filter((p) => khopTru(p, "tt")).map((p) => p.tinhTrang).filter(Boolean))],
    /** Khách đã chọn trường KHÁC chưa — chưa thì danh sách trường này để đủ */
    coTruongKhac: (tru: TruongDa) =>
      (tru !== "kv" && f.locations.length > 0) || (tru !== "loai" && !!f.loaiDuAn?.length) || (tru !== "cdt" && !!f.chuDauTu) ||
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
