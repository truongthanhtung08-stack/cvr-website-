import { chuanTen } from "@/lib/locations";
import { mauSoLichSu, veQuy, tenTinhChuan, tenPhuongChuan, coLichSuGia, MAU_TOI_THIEU, type ChiSoKhuVuc } from "@/lib/chiSoGia";
import { chuanLoaiCon } from "@/lib/listingSpec";

// ════════════════════════════════════════════════════════════════════════════
// LỊCH SỬ GIÁ CÒN THIẾU — dựng từ CHÍNH TIN ĐANG ĐĂNG trên web.
// Mỗi tin cần một dãy theo phường (và theo dự án nếu tin thuộc dự án), cùng loại
// hình + bán/thuê. Đối chiếu 8 quý gần nhất (không tính quý đang chạy — quý này
// web tự tính) với số đã có (kho tự tính + số đã nhập); quý nào chưa có thì ra
// một dòng đúng khuôn tệp mẫu để Cowork điền.
// Dùng chung cho nút admin và đường tự động /api/chi-so-gia/con-thieu.
// ════════════════════════════════════════════════════════════════════════════

// KHUÔN ĐÚNG TỆP NỘP (chủ dự án duyệt 22/10/2026 — LICH-SU-GIA-22102026 mục 6): mỗi dòng một QUÝ của một dãy; tinh · khu_vuc ·
// du_an · loai_hinh · muc_dich · ky · mau_so điền sẵn (thuê văn phòng, kho/xưởng/đất: giá/m²/tháng có mau_so; thuê loại hình khác: TỔNG tiền/tháng, mau_so trống — 23/10/2026); Cowork điền giá + nguồn.
export const COT_MAU = [
  "tinh", "khu_vuc", "du_an", "loai_hinh", "loai_con", "muc_dich", "ky", "mau_so",
  "gia_m2_trieu", "gia_thap_trieu", "gia_cao_trieu", "so_mau", "nguon", "nguon_link",
  // Số tin đang đăng trên web cần dãy này — dãy nhiều tin xếp trước, làm trước
  // thì lịch sử giá hiện sớm cho nhiều tin nhất. Web bỏ qua cột này khi nộp.
  "so_tin_tren_web",
] as const;

export type TinCan = {
  province: string | null;
  ward: string | null;
  type: string | null;
  purpose: string | null;
  details: { project?: string; projectName?: string; specs?: { loaiCanho?: string; landType?: string } } | null;
};
export type DongKho = { thang: string; tinh: string; phuong: string; du_an?: string; loai_hinh: string; muc_dich: string; so_mau?: number };

export function dongConThieu(tin: TinCan[], kho: DongKho[], items: ChiSoKhuVuc[], now = new Date()): string[][] {
  // Dãy cần có: khoá = tỉnh|phường|dự án|loại hình|bán/thuê (chuẩn hoá để so).
  type Day = { tinh: string; phuong: string; duAn: string; duAnSlug: string; loai: string; loaiCon: string; md: "ban" | "thue" };
  const k = (tinh: string, phuong: string, duAn: string, loai: string, md: string, loaiCon = "") =>
    [chuanTen(tinh), chuanTen(phuong), chuanTen(duAn), chuanTen(loai), md, chuanTen(loaiCon)].join("|");
  const can = new Map<string, Day>();
  const soTin = new Map<string, number>();
  const dem = (khoa: string) => soTin.set(khoa, (soTin.get(khoa) ?? 0) + 1);
  for (const t of tin) {
    const md = t.purpose === "thue" ? "thue" : t.purpose === "ban" || !t.purpose ? "ban" : null;
    const tinh = tenTinhChuan(t.province);
    const loai = (t.type ?? "").trim();
    if (!md || !tinh || !coLichSuGia(loai)) continue;
    // BÁN NHÀ VẪN GIAO (29/10/2026): yêu cầu Cowork chốt 23/10 — làm NHÀ trước, giá ÷ TỔNG m² sàn ghi rõ (lọc tin rao có
    // m² sàn, hệ số…); nguồn chỉ có m² đất thì Cowork không dùng. Trước đây bỏ hẳn bán nhà khỏi danh sách → 46/69 tin chưa có
    // lịch sử giá là bán nhà mà Cowork không hề được giao.
    // Theo phường: dãy đúng LOẠI CON của tin (căn hộ, đất — 29/10/2026); tin chưa có loại con thì dãy chung loại hình.
    const lc = chuanLoaiCon(t.details?.specs?.loaiCanho || t.details?.specs?.landType);
    const phuong = tenPhuongChuan(tinh, t.ward);
    if (phuong) {
      can.set(k(tinh, phuong, "", loai, md, lc), { tinh, phuong, duAn: "", duAnSlug: "", loai, loaiCon: lc, md });
      dem(k(tinh, phuong, "", loai, md, lc));
    }
    const slug = (t.details?.project ?? "").trim();
    if (slug) {
      const ten = (t.details?.projectName ?? "").trim() || slug;
      can.set(k(tinh, "", ten, loai, md), { tinh, phuong: "", duAn: ten, duAnSlug: slug, loai, loaiCon: "", md });
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
    // Số web chỉ tính là "đã có" khi đủ tin (MAU_TOI_THIEU) — tháng ít tin web không hiện thì vẫn giao Cowork lọc (29/10/2026)
    if (r.so_mau != null && r.so_mau < MAU_TOI_THIEU) continue;
    const duAn = r.du_an ? slugSangTen.get(r.du_an) ?? r.du_an : "";
    const [y, m] = String(r.thang).slice(0, 7).split("-");
    danh(k(r.tinh, duAn ? "" : r.phuong, duAn, r.loai_hinh, r.muc_dich), `${y}-Q${Math.ceil(Number(m) / 3)}`);
  }
  for (const x of items.map(veQuy)) {
    if (!x.loaiHinh || x.viTri) continue;
    if (x.mauSo !== mauSoLichSu(x.loaiHinh, x.mucDich ?? "ban")) continue; // đúng mẫu số; thuê tổng tiền thì không có mẫu số (23/10/2026)
    for (const m of x.moc) if (m.giaM2 > 0) danh(k(x.tinh, x.duAn ? "" : x.khuVuc ?? "", x.duAn ?? "", x.loaiHinh, x.mucDich ?? "ban", x.loaiCon ?? ""), m.quy);
  }

  // 20 quý gần nhất (đủ 5 năm — chủ dự án 29/10/2026: "lịch sử giá đến cả 5 năm"), không tính quý đang chạy (quý này web tự tính).
  const thang: string[] = [];
  const quyNay = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3);
  for (let i = 20; i >= 1; i--) {
    const q = quyNay - i;
    thang.push(`${Math.floor(q / 4)}-Q${(q % 4) + 1}`);
  }
  const dong: string[][] = [];
  const theoUuTien = [...can.entries()].sort((a, b) => (soTin.get(b[0]) ?? 0) - (soTin.get(a[0]) ?? 0));
  // Đủ 1 năm (5 quý liền) là web đã vẽ được biểu đồ (chủ dự án 29/10/2026) → 5 quý gần nhất của MỌI dãy xếp trước,
  // quý cũ hơn (tới 5 năm) xếp sau; trong mỗi đợt quý MỚI NHẤT trước (lọc theo thời gian thực).
  for (const dot of [thang.slice(-5).reverse(), thang.slice(0, -5).reverse()]) for (const [khoa, d] of theoUuTien) {
    const daCo = co.get(khoa) ?? new Set();
    for (const t of dot) {
      if (daCo.has(t)) continue;
      dong.push([d.tinh, d.phuong, d.duAn, d.loai, d.loaiCon, d.md, t, mauSoLichSu(d.loai, d.md) ?? "", "", "", "", "", "", "", String(soTin.get(khoa) ?? 0)]);
    }
  }
  return dong;
}
