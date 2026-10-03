import { chuanTen } from "@/lib/locations";
import { dungODienTichXayDung } from "@/lib/listingSpec";
import { mauSoCuaLoaiHinh, veQuy, tenTinhChuan, tenPhuongChuan, coLichSuGia, type ChiSoKhuVuc } from "@/lib/chiSoGia";

// ════════════════════════════════════════════════════════════════════════════
// LỊCH SỬ GIÁ CÒN THIẾU — dựng từ CHÍNH TIN ĐANG ĐĂNG trên web.
// Mỗi tin cần một dãy theo phường (và theo dự án nếu tin thuộc dự án), cùng loại
// hình + bán/thuê. Đối chiếu 8 quý gần nhất (không tính quý đang chạy — quý này
// web tự tính) với số đã có (kho tự tính + số đã nhập); quý nào chưa có thì ra
// một dòng đúng khuôn tệp mẫu để Cowork điền.
// Dùng chung cho nút admin và đường tự động /api/chi-so-gia/con-thieu.
// ════════════════════════════════════════════════════════════════════════════

export const COT_MAU = [
  "tinh", "khu_vuc", "loai_hinh", "muc_dich", "ky", "gia_m2_trieu", "gia_thap_trieu", "gia_cao_trieu",
  "nguon", "cap_nhat", "so_mau", "nguon_link", "mau_so", "vi_tri", "du_an", "duong",
  // Số tin đang đăng trên web cần dãy này — dãy nhiều tin xếp trước, làm trước
  // thì lịch sử giá hiện sớm cho nhiều tin nhất. Web bỏ qua cột này khi nộp.
  "so_tin_tren_web",
] as const;

export type TinCan = {
  province: string | null;
  ward: string | null;
  type: string | null;
  purpose: string | null;
  details: { project?: string; projectName?: string } | null;
};
export type DongKho = { thang: string; tinh: string; phuong: string; du_an?: string; loai_hinh: string; muc_dich: string };

export function dongConThieu(tin: TinCan[], kho: DongKho[], items: ChiSoKhuVuc[], now = new Date()): string[][] {
  // Dãy cần có: khoá = tỉnh|phường|dự án|loại hình|bán/thuê (chuẩn hoá để so).
  type Day = { tinh: string; phuong: string; duAn: string; duAnSlug: string; loai: string; md: "ban" | "thue" };
  const k = (tinh: string, phuong: string, duAn: string, loai: string, md: string) =>
    [chuanTen(tinh), chuanTen(phuong), chuanTen(duAn), chuanTen(loai), md].join("|");
  const can = new Map<string, Day>();
  const soTin = new Map<string, number>();
  const dem = (khoa: string) => soTin.set(khoa, (soTin.get(khoa) ?? 0) + 1);
  for (const t of tin) {
    const md = t.purpose === "thue" ? "thue" : t.purpose === "ban" || !t.purpose ? "ban" : null;
    const tinh = tenTinhChuan(t.province);
    const loai = (t.type ?? "").trim();
    if (!md || !tinh || !coLichSuGia(loai)) continue;
    // BÁN NHÀ: web tính trên m² sàn, nguồn công bố tính trên diện tích tin (m² đất) —
    // Cowork không có số cùng cách tính, nên không giao. Web tự tính dần từ tin đăng.
    if (md === "ban" && dungODienTichXayDung(loai)) continue;
    const phuong = tenPhuongChuan(tinh, t.ward);
    if (phuong) {
      can.set(k(tinh, phuong, "", loai, md), { tinh, phuong, duAn: "", duAnSlug: "", loai, md });
      dem(k(tinh, phuong, "", loai, md));
    }
    const slug = (t.details?.project ?? "").trim();
    if (slug) {
      const ten = (t.details?.projectName ?? "").trim() || slug;
      can.set(k(tinh, "", ten, loai, md), { tinh, phuong: "", duAn: ten, duAnSlug: slug, loai, md });
      dem(k(tinh, "", ten, loai, md));
    }
  }

  // Tháng đã có số: kho tự tính (đủ mẫu) + số đã nhập (đúng mẫu số).
  const co = new Map<string, Set<string>>();
  const danh = (khoa: string, thang: string) => {
    if (!co.has(khoa)) co.set(khoa, new Set());
    co.get(khoa)!.add(thang);
  };
  const slugSangTen = new Map([...can.values()].filter((d) => d.duAnSlug).map((d) => [d.duAnSlug, d.duAn]));
  for (const r of kho) {
    const duAn = r.du_an ? slugSangTen.get(r.du_an) ?? r.du_an : "";
    const [y, m] = String(r.thang).slice(0, 7).split("-");
    danh(k(r.tinh, duAn ? "" : r.phuong, duAn, r.loai_hinh, r.muc_dich), `${y}-Q${Math.ceil(Number(m) / 3)}`);
  }
  for (const x of items.map(veQuy)) {
    if (!x.loaiHinh || x.viTri) continue;
    if (x.mucDich === "thue" ? !!x.mauSo : x.mauSo !== mauSoCuaLoaiHinh(x.loaiHinh)) continue;
    for (const m of x.moc) if (m.giaM2 > 0) danh(k(x.tinh, x.duAn ? "" : x.khuVuc ?? "", x.duAn ?? "", x.loaiHinh, x.mucDich ?? "ban"), m.quy);
  }

  // 8 quý gần nhất (2 năm), không tính quý đang chạy (quý này web tự tính).
  const thang: string[] = [];
  const quyNay = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3);
  for (let i = 8; i >= 1; i--) {
    const q = quyNay - i;
    thang.push(`${Math.floor(q / 4)}-Q${(q % 4) + 1}`);
  }
  const dong: string[][] = [];
  const theoUuTien = [...can.entries()].sort((a, b) => (soTin.get(b[0]) ?? 0) - (soTin.get(a[0]) ?? 0));
  for (const [khoa, d] of theoUuTien) {
    const daCo = co.get(khoa) ?? new Set();
    for (const t of thang) {
      if (daCo.has(t)) continue;
      dong.push([d.tinh, d.phuong, d.loai, d.md, t, "", "", "", "", "", "", "", d.md === "thue" ? "" : mauSoCuaLoaiHinh(d.loai), "", d.duAn, "", String(soTin.get(khoa) ?? 0)]);
    }
  }
  return dong;
}
