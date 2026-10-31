// ============================================================================
// NẠP DỰ ÁN HÀNG LOẠT BẰNG CSV — mục "Tra cứu dự án" kiểu Mã số thuế (chủ dự án 15/10/2026)
// Cowork lọc + nạp dự án toàn quốc HẰNG TUẦN theo tệp mẫu public/mau-nhap-du-an.csv.
// Mỗi dòng → một dự án ở trạng thái CHỜ DUYỆT; chủ dự án duyệt trong admin rồi mới lên web.
// Bảng giá / "giá từ": chỉ điền khi số liệu chắc chắn — bỏ trống thì trang dự án chỉ có
// thông tin cơ bản + hình ảnh (chủ dự án chốt 15/10/2026).
// ============================================================================

import { chuDauTuChuan, loiDiaDanh } from "@/lib/tenChuan";
import { parseLatLng } from "@/lib/googleMaps";
import { tenChuan } from "@/lib/thongSoDuAn";

// Thứ tự cột = THỨ TỰ BẢNG TỔNG QUAN trang dự án (chủ dự án chốt 31/10/2026, thay thứ tự 22/10): tên · chủ đầu tư · loại hình ·
// diện tích dự án · quy mô · loại hình căn hộ · số lượng căn hộ · rồi các mục khác. MỘT mẫu cho mọi nơi (Admin, Cowork, scripts).
// Đọc theo TÊN cột nên tệp cũ vẫn nạp được (san_pham → "Loại hình căn hộ"; quy_mo kiểu "Nhãn: giá trị; …" giữ như cũ).
export const COT_DU_AN = [
  "ten_du_an", "chu_dau_tu", "loai_hinh", "dien_tich_du_an", "quy_mo", "loai_hinh_can_ho", "so_luong_can_ho",
  "trang_thai", "don_vi_phat_trien", "tinh", "phuong_xa", "dia_chi_chi_tiet",
  // TOẠ ĐỘ lấy trên Google Maps ("16.0254, 108.2205" hoặc link Google Maps) → bản đồ trang dự án ghim ĐÚNG như Google (30/10/2026)
  "toa_do",
  "khoi_cong", "ban_giao", "phap_ly", "tien_ich", "tong_quan", "gia_tu", "anh", "nguon", "ngay_cap_nhat",
  "san_pham", // cột cũ = loai_hinh_can_ho
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
  return docDuAnTuBang(docCsv(text));
}

// Cùng bộ kiểm cho bảng đã đọc sẵn (sheet "Dự án" trong tệp Excel tin hàng loạt — 22/10/2026)
export function docDuAnTuBang(rows: string[][]): DongDuAn[] {
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (c: Cot) => head.indexOf(c);
  return rows.slice(1).map((r, i) => {
    const v = (c: Cot) => (idx(c) >= 0 ? (r[idx(c)] ?? "").trim() : "");
    const loi: string[] = [];
    const ten = v("ten_du_an");
    if (!ten) loi.push("thiếu tên dự án");
    if (!v("tinh")) loi.push("thiếu tỉnh/thành");
    else { const l = loiDiaDanh(v("tinh"), v("phuong_xa") || undefined); if (l) loi.push(l); }
    if (!v("nguon")) loi.push("thiếu nguồn thông tin");
    // Trường bắt buộc của thẻ dự án (trạng thái · tên · địa chỉ · loại hình · chủ đầu tư · ảnh) LUÔN HIỆN; hồ sơ chưa có dữ liệu
    // trường nào thì vẫn nạp, thẻ và trang dự án ghi "Đang cập nhật" (chủ dự án 30/10/2026). Không để máy tự gán trạng thái.
    const trangThai = v("trang_thai");
    if (trangThai && !TRANG_THAI_HOP_LE.includes(trangThai)) loi.push(`trạng thái "${trangThai}" không hợp lệ`);
    // quy_mo: một giá trị → dòng "Quy mô"; tệp cũ ghi "Nhãn: giá trị; …" → mỗi cặp một dòng như trước
    const quyMoGoc = v("quy_mo");
    const quyMo = quyMoGoc.includes(":")
      ? quyMoGoc.split(";").map((x) => x.split(":"))
        .filter((p) => p.length >= 2 && p[0].trim() && p.slice(1).join(":").trim())
        .map((p) => ({ label: tenChuan(p[0]), value: p.slice(1).join(":").trim() }))
      : quyMoGoc ? [{ label: "Quy mô", value: quyMoGoc }] : [];
    const them = (label: string, value: string) => (value ? [{ label, value }] : []);
    // Đúng thứ tự bảng Tổng quan, tên mục y như trang dự án hiện (31/10/2026)
    const scale = [
      ...them("Diện tích dự án", v("dien_tich_du_an")),
      ...quyMo,
      ...them("Loại hình căn hộ", v("loai_hinh_can_ho") || v("san_pham")),
      ...them("Số lượng căn hộ", v("so_luong_can_ho")),
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
          // MỘT DỰ ÁN NHIỀU LOẠI HÌNH (chủ dự án 22/10/2026): đất nền, nhà phố, biệt thự/villa, shophouse…
          // ghi cách nhau bằng dấu chấm phẩy → lưu "Đất nền, Nhà phố, Shophouse"; trang lọc theo loại hình
          // khớp từng loại (projectsInCategory so "chứa"), nên dự án hiện ở mọi loại hình nó có.
          type: v("loai_hinh").split(/[;|]/).map((x) => x.trim()).filter(Boolean).join(", ") || null,
          status_text: trangThai, // cột không nhận null — chưa có trạng thái thì chuỗi trống, web ghi "Đang cập nhật"
          developer: v("chu_dau_tu") ? chuDauTuChuan(v("chu_dau_tu")) : null,
          province: v("tinh"),
          ward: v("phuong_xa") || null,
          price_from: giaTu || null,
          images: anh,
          scale,
          amenities: v("tien_ich").split(";").map((x) => x.trim()).filter(Boolean),
          overview: v("tong_quan") || null,
          details: {
            tier: "basic",
            // Hồ sơ DẠNG THẺ: hiện ở Tra cứu dự án, không lên Dự án nổi bật (chủ dự án 29/10/2026)
            dangThe: true,
            addressDetail: v("dia_chi_chi_tiet") || undefined,
            ...(parseLatLng(v("toa_do")) ? { mapPin: v("toa_do").trim() } : {}),
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
