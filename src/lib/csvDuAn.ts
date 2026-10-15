// ============================================================================
// NẠP DỰ ÁN HÀNG LOẠT BẰNG CSV — mục "Tra cứu dự án" kiểu Mã số thuế (chủ dự án 15/10/2026)
// Cowork lọc + nạp dự án toàn quốc HẰNG TUẦN theo tệp mẫu public/mau-nhap-du-an.csv.
// Mỗi dòng → một dự án ở trạng thái CHỜ DUYỆT; chủ dự án duyệt trong admin rồi mới lên web.
// Bảng giá / "giá từ": chỉ điền khi số liệu chắc chắn — bỏ trống thì trang dự án chỉ có
// thông tin cơ bản + hình ảnh (chủ dự án chốt 15/10/2026).
// ============================================================================

export const COT_DU_AN = [
  "ten_du_an", "loai_hinh", "trang_thai", "chu_dau_tu", "don_vi_phat_trien", "tinh", "phuong_xa",
  "dia_chi_chi_tiet", "quy_mo", "san_pham", "khoi_cong", "ban_giao", "phap_ly", "tien_ich",
  "tong_quan", "gia_tu", "anh", "nguon", "ngay_cap_nhat",
] as const;
type Cot = (typeof COT_DU_AN)[number];

export const TRANG_THAI_HOP_LE = ["Sắp mở bán", "Đang mở bán", "Đã bàn giao", "Đã hoàn thành"];

// Đọc CSV (có ngoặc kép, dấu phẩy trong ô, xuống dòng trong ô)
export function docCsv(text: string): string[][] {
  const s = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export type DongDuAn = { dong: number; loi: string[]; payload: Record<string, unknown> | null; ten: string; slug: string };

export function docDuAnTuCsv(text: string): DongDuAn[] {
  const rows = docCsv(text);
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (c: Cot) => head.indexOf(c);
  return rows.slice(1).map((r, i) => {
    const v = (c: Cot) => (idx(c) >= 0 ? (r[idx(c)] ?? "").trim() : "");
    const loi: string[] = [];
    const ten = v("ten_du_an");
    if (!ten) loi.push("thiếu tên dự án");
    if (!v("tinh")) loi.push("thiếu tỉnh/thành");
    if (!v("nguon")) loi.push("thiếu nguồn thông tin");
    const trangThai = v("trang_thai");
    // Bắt buộc: trang dự án mặc định ghi "Đang mở bán" khi trống — không để máy tự gán trạng thái
    if (!trangThai) loi.push("thiếu trạng thái");
    else if (!TRANG_THAI_HOP_LE.includes(trangThai)) loi.push(`trạng thái "${trangThai}" không hợp lệ`);
    const quyMo = v("quy_mo")
      .split(";")
      .map((x) => x.split(":"))
      .filter((p) => p.length >= 2 && p[0].trim() && p.slice(1).join(":").trim())
      .map((p) => ({ label: p[0].trim(), value: p.slice(1).join(":").trim() }));
    const them = (label: string, value: string) => (value ? [{ label, value }] : []);
    const scale = [
      ...quyMo,
      ...them("Sản phẩm", v("san_pham")),
      ...them("Khởi công", v("khoi_cong")),
      ...them("Bàn giao", v("ban_giao")),
      ...them("Pháp lý", v("phap_ly")),
    ];
    const anh = v("anh").split("|").map((x) => x.trim()).filter((x) => /^https?:\/\//.test(x));
    const giaTu = v("gia_tu");
    const payload = loi.length
      ? null
      : {
          slug: slug(ten),
          name: ten,
          type: v("loai_hinh") || null,
          status_text: trangThai,
          developer: v("chu_dau_tu") || null,
          province: v("tinh"),
          ward: v("phuong_xa") || null,
          price_from: giaTu || null,
          images: anh,
          scale,
          amenities: v("tien_ich").split(";").map((x) => x.trim()).filter(Boolean),
          overview: v("tong_quan") || null,
          details: {
            tier: "basic",
            addressDetail: v("dia_chi_chi_tiet") || undefined,
            developmentUnit: v("don_vi_phat_trien") || undefined,
            purposes: ["ban"],
            priceMode: giaTu ? "show" : "hidden",
            nguon: v("nguon"),
            ngayCapNhat: v("ngay_cap_nhat") || undefined,
          },
          status: "pending",
        };
    return { dong: i + 2, loi, payload, ten, slug: slug(ten) };
  });
}
