// ============================================================================
// HỒ SƠ DOANH NGHIỆP — MỘT CHỖ ĐỊNH NGHĨA "ĐỦ" (chủ dự án 23/10/2026: "làm đúng cái Google cần")
// Doanh nghiệp = profiles.role "company". Hồ sơ đủ + đồng ý cho đăng → hiện ở /chuyen-gia/cong-ty
// kèm dữ liệu Organization cho Google. Dùng chung: Admin → Khách hàng (nhãn thiếu gì), trang công ty.
// Cột: company_name · hd_ten_cong_ty · hd_mst · hd_dia_chi · hd_email (thông tin hoá đơn, 0017 — cùng
// là thông tin pháp nhân) · dn_website · dn_logo · dn_gioi_thieu · dn_mang_xa_hoi · dn_dong_y_dang (0065).
// ============================================================================

// Bắt buộc để Google nhận diện được doanh nghiệp thật: tên, tên pháp nhân, mã số, địa chỉ, giới thiệu.
// Website, email, logo, mạng xã hội: có thì khai, không có vẫn đủ.
const BAT_BUOC: [string, string][] = [
  ["company_name", "tên hiển thị"],
  ["hd_ten_cong_ty", "tên pháp nhân"],
  ["hd_mst", "mã số doanh nghiệp"],
  ["hd_dia_chi", "địa chỉ"],
  ["dn_gioi_thieu", "giới thiệu"],
];

export function thieuHoSoDn(p: Record<string, unknown>): string[] {
  const thieu = BAT_BUOC.filter(([k]) => !String(p[k] ?? "").trim()).map(([, ten]) => ten);
  if (!p.dn_dong_y_dang) thieu.push("đồng ý cho đăng");
  return thieu;
}

// ── SHEET "DOANH NGHIỆP" TRONG TỆP EXCEL TIN HÀNG LOẠT (chủ dự án 23/10/2026, như sheet "Dự án" 22/10) ─────
// Cowork gặp người đăng là doanh nghiệp → tra thông tin công khai, ghi một dòng vào sheet này (cột như
// public/mau-ho-so-cong-ty.csv). Nạp tin là nạp luôn: so_dien_thoai khớp tài khoản → vai trò "Công ty / Sàn",
// hồ sơ vào Admin → Khách hàng → Doanh nghiệp. Chỉ điền ô còn trống — ô admin đã điền giữ nguyên.
export type DongDoanhNghiep = { dong: number; loi: string[]; ten: string; sdt: string; hoSo: Record<string, string> };

export function docDoanhNghiepTuBang(rows: string[][], chuanSdt: (s: string) => string): DongDoanhNghiep[] {
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  return rows
    .slice(1)
    .map((r, i) => {
      const v = (c: string) => (head.indexOf(c) >= 0 ? String(r[head.indexOf(c)] ?? "").trim() : "");
      const loi: string[] = [];
      const ten = v("ten_phap_nhan");
      const sdt = chuanSdt(v("so_dien_thoai").split("|")[0] ?? "");
      if (!ten) loi.push("thiếu tên pháp nhân");
      if (!/^\d{10}(\d{3})?$/.test(v("ma_so_thue").replace(/[\s-]/g, ""))) loi.push("mã số thuế phải 10 hoặc 13 chữ số");
      if (!sdt) loi.push("thiếu số điện thoại (trùng số đăng tin) để ghép tài khoản");
      const diaChi = [v("dia_chi_tru_so"), v("phuong_xa"), v("tinh")].filter(Boolean).join(", ");
      const hoSo: Record<string, string> = Object.fromEntries(
        Object.entries({
          company_name: v("ten_thuong_goi") || ten,
          hd_ten_cong_ty: ten,
          hd_mst: v("ma_so_thue").replace(/[\s-]/g, ""),
          hd_dia_chi: diaChi,
          hd_email: v("email"),
          dn_website: v("website"),
          dn_logo: v("logo"),
          dn_gioi_thieu: v("gioi_thieu"),
          dn_mang_xa_hoi: v("mang_xa_hoi").split("|").map((x) => x.trim()).filter(Boolean).join("\n"),
        }).filter(([, x]) => x),
      );
      return { dong: i + 2, loi, ten, sdt, hoSo };
    })
    .filter((d) => d.ten || d.sdt);
}
