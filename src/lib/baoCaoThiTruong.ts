import type { Listing } from "@/lib/data";
import type { KhuVuc } from "@/lib/khuVuc";
import { khop, phuongCuaTin } from "@/lib/pseo";
import { trangGiaNhaDat, type MucGia } from "@/lib/giaNhaDat";
import { oldNamesOf } from "@/lib/locations";
import { thangHienTai } from "@/lib/thang";

// ============================================================================
// BÁO CÁO THỊ TRƯỜNG THEO TỈNH (anh 12/11/2026: "làm 1 form chuẩn cho Coastal Land, cao nhất dữ liệu đã có — làm và chốt").
// Form: D:\Coastal Land\SEO\MAU\bao-cao-thi-truong\FORM-BAO-CAO-THI-TRUONG.md (cấu trúc bản tin DKRA, số từ chính web).
// Số liệu: tin đăng trên web (giá CHÀO, không phải giá giao dịch), đếm cả tin hết hạn — cùng cổng trang Giá nhà đất (src/lib/giaNhaDat.ts).
// Phần 2–3 (mua bán / cho thuê theo phân khúc) = đúng các mục giá của trang Giá nhà đất; báo cáo chỉ thêm tổng quan + kết luận theo số.
// Kết luận chỉ là câu SỐ LIỆU theo mẫu đã duyệt trong form — không bình luận cảm tính. Thông tin khu vực (hạ tầng, chính sách) để Cowork
// bổ sung sau, chưa có thì không hiện. Chi phí: tính lúc dựng trang từ dữ liệu đã có bộ nhớ đệm — không thêm truy vấn hay cron.
// ============================================================================

export type DongTongQuan = { ten: string; muc: "ban" | "thue"; so: number; khoang: string; khuNhieu: { ten: string; so: number }[] };
export type BaoCao = {
  tinh: KhuVuc;
  tieuDe: string;
  tenCu: string[];
  soBan: number;
  soThue: number;
  soMoi: number;
  ban: MucGia[];
  thue: MucGia[];
  tongQuan: DongTongQuan[];
  ketLuan: string[];
  index: boolean;
};

const tenLoai = (x: MucGia) => (x.dk.cat!.tuKhoa ?? x.dk.cat!.h1).replace(/^(Bán|Cho thuê)\s+/i, "");
const hoaDau = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function baoCaoThiTruong(tinh: KhuVuc, listings: Listing[]): BaoCao {
  const trang = trangGiaNhaDat(tinh, listings);
  const trongTinh = (m: "ban" | "thue") => listings.filter((l) => khop(l, { muc: m, tinh }));
  const ban = trongTinh("ban"), thue = trongTinh("thue");
  const dauThang = new Date(); dauThang.setDate(1); dauThang.setHours(0, 0, 0, 0);
  const soMoi = [...ban, ...thue].filter((l) => l.postedAt && new Date(l.postedAt) >= dauThang).length;

  const tongQuan: DongTongQuan[] = [...trang.ban.map((x) => ["ban", x] as const), ...trang.thue.map((x) => ["thue", x] as const)].map(([m, x]) => {
    const tin = listings.filter((l) => khop(l, x.dk));
    const dem = new Map<string, number>();
    for (const l of tin) { const p = phuongCuaTin(l); if (p) dem.set(p, (dem.get(p) ?? 0) + 1); }
    const khuNhieu = [...dem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([ten, so]) => ({ ten, so }));
    return { ten: hoaDau(tenLoai(x)), muc: m, so: tin.length, khoang: x.khoang, khuNhieu };
  });

  // Kết luận theo số (mẫu câu trong form): phân khúc nhiều tin nhất · khu vực tập trung · mặt bằng giá chào — bán rồi thuê
  const ketLuan: string[] = [];
  for (const m of ["ban", "thue"] as const) {
    const ds = tongQuan.filter((d) => d.muc === m).sort((a, b) => b.so - a.so);
    const dau = ds[0];
    if (!dau) continue;
    const viec = m === "ban" ? "chào bán" : "cho thuê";
    const khu = dau.khuNhieu.length ? ` tập trung tại ${dau.khuNhieu.map((k) => `${k.ten} (${k.so} tin)`).join(", ")}` : "";
    ketLuan.push(`Nguồn cung ${viec} nhiều nhất là ${dau.ten.toLowerCase()} (${dau.so} tin)${khu}.`);
    for (const d of ds.slice(0, 3)) if (d.khoang) ketLuan.push(`${m === "thue" ? "Thuê " + d.ten.toLowerCase() : d.ten}: giá chào ${d.khoang}.`);
  }

  return {
    tinh,
    tieuDe: `Báo cáo thị trường bất động sản ${tinh.name} ${thangHienTai()}`,
    tenCu: oldNamesOf(tinh.name).filter((t) => t !== tinh.name),
    soBan: ban.length,
    soThue: thue.length,
    soMoi,
    ban: trang.ban,
    thue: trang.thue,
    tongQuan,
    ketLuan,
    index: trang.index,
  };
}
