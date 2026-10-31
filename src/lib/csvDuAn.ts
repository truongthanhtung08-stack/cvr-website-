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

// loi = lỗi chặn dòng (trạng thái sai, địa danh sai, toạ độ không đọc được, trùng dự án trong tệp) → không có payload.
// thieu = TRƯỜNG BẮT BUỘC còn trống (luật anh 31/10/2026, D42): tên · chủ đầu tư · tỉnh · phường · địa chỉ · loại hình · trạng thái · nguồn.
//   Dự án mới thiếu ô nào là chặn; hồ sơ đã có trên web thì chỉ chặn ô mà cả tệp lẫn web đều trống (napDuAn.ts).
// anhLink / anhTen = cột `anh`: link https dùng thẳng · tên tệp khớp với ảnh chọn kèm (cùng thư mục) → tải lên kho ảnh của web.
export type DongDuAn = {
  dong: number; loi: string[]; thieu: string[]; payload: Record<string, unknown> | null; ten: string; slug: string;
  anhLink: string[]; anhTen: string[];
};

// Trường bắt buộc: [cột tệp, tên hiện trên màn xem trước]
export const TRUONG_BAT_BUOC: [Cot, string][] = [
  ["ten_du_an", "tên dự án"], ["chu_dau_tu", "chủ đầu tư"], ["tinh", "tỉnh/thành"], ["phuong_xa", "phường/xã"],
  ["dia_chi_chi_tiet", "địa chỉ"], ["loai_hinh", "loại hình"], ["trang_thai", "trạng thái"], ["nguon", "nguồn"],
];

// Tên tệp ảnh khớp nhau: bỏ hoa/thường, dấu, đuôi (kể cả đuôi kép "a.jpg.jpg"), ghi thiếu đuôi vẫn khớp
const DUOI_ANH = /\.(jpe?g|png|webp|gif|avif|heic|heif|bmp)$/i;
export function gocTenAnh(s: string): string {
  let t = s.trim().split(/[\\/]/).pop() ?? "";
  while (DUOI_ANH.test(t)) t = t.replace(DUOI_ANH, "");
  return slug(t);
}

// Ảnh chọn kèm của một dòng: tên ghi ở cột `anh` (đúng thứ tự ghi), không ghi thì tự lấy <mã dự án>.jpg, <mã>-1.jpg, <mã>-2.jpg…
// (số nhỏ trước → ảnh đầu là ảnh tiêu biểu). Trả tên tệp đã chọn + tên ghi trong cột mà không có tệp.
export function anhTepCuaDong<T extends { name: string }>(d: DongDuAn, tep: T[]): { tep: T[]; thieu: string[] } {
  if (d.anhTen.length) {
    const ra: T[] = [];
    const thieu: string[] = [];
    for (const ten of d.anhTen) {
      const f = tep.find((x) => gocTenAnh(x.name) === gocTenAnh(ten));
      if (f) ra.push(f); else thieu.push(ten);
    }
    return { tep: ra, thieu };
  }
  const so = (f: T) => { const m = gocTenAnh(f.name).slice(d.slug.length).match(/^-(\d+)$/); return m ? Number(m[1]) : 0; };
  const ra = tep
    .filter((f) => { const g = gocTenAnh(f.name); return g === d.slug || new RegExp(`^${d.slug}-\\d+$`).test(g); })
    .sort((a, b) => so(a) - so(b));
  return { tep: ra, thieu: [] };
}

export function docDuAnTuCsv(text: string): DongDuAn[] {
  return docDuAnTuBang(docCsv(text));
}

// Cùng bộ kiểm cho bảng đã đọc sẵn (sheet "Dự án" trong tệp Excel tin hàng loạt — 22/10/2026)
export function docDuAnTuBang(rows: string[][]): DongDuAn[] {
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (c: Cot) => head.indexOf(c);
  const dongCuaSlug = new Map<string, number>();
  return rows.slice(1).map((r, i) => {
    const v = (c: Cot) => (idx(c) >= 0 ? (r[idx(c)] ?? "").trim() : "");
    const loi: string[] = [];
    const ten = v("ten_du_an");
    // D42 (anh 31/10/2026): thiếu trường bắt buộc là CHẶN — thay luật 30/10 "thiếu vẫn nạp, web ghi Đang cập nhật".
    // Không để máy tự gán trạng thái hay bất cứ trường nào.
    const thieu = TRUONG_BAT_BUOC.filter(([c]) => !v(c)).map(([, nhan]) => nhan);
    if (v("tinh")) { const l = loiDiaDanh(v("tinh"), v("phuong_xa") || undefined); if (l) loi.push(l); }
    const trangThai = v("trang_thai");
    if (trangThai && !TRANG_THAI_HOP_LE.includes(trangThai)) loi.push(`trạng thái "${trangThai}" không hợp lệ`);
    if (v("toa_do") && !parseLatLng(v("toa_do"))) loi.push(`toạ độ "${v("toa_do")}" không đọc được`);
    if (ten) {
      const truoc = dongCuaSlug.get(slug(ten));
      if (truoc) loi.push(`trùng dự án ở dòng ${truoc}`); else dongCuaSlug.set(slug(ten), i + 2);
    }
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
    // Cột `anh`: link https dùng thẳng như cũ; còn lại là TÊN TỆP ảnh chọn kèm — không bỏ im lặng (khớp ở napDuAn.ts)
    const anhGhi = v("anh").split(/[|;\n]/).map((x) => x.trim()).filter(Boolean);
    const anh = anhGhi.filter((x) => /^https?:\/\//i.test(x));
    const anhTen = anhGhi.filter((x) => !/^https?:\/\//i.test(x));
    const giaTu = v("gia_tu");
    const payload = loi.length || !ten
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
    return { dong: i + 2, loi, thieu, payload, ten, slug: slug(ten), anhLink: anh, anhTen };
  });
}
