import { NGUONG_INDEX_CDT, nhomChuDauTu } from "@/lib/chuDauTu";
import type { Listing, Project } from "@/lib/data";
import { dungDsDuAn } from "@/lib/duAnTenMayChu";
import { cungDuAn } from "@/lib/filters";

// Dùng chung cho trang Tra cứu dự án (/du-an/tra-cuu).

// "15/10/2026" → số để xếp mới nhất trước
const ngaySo = (s?: string) => { const m = s?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? +m[3] * 10000 + +m[2] * 100 + +m[1] : 0; };

// Lối theo CHỦ ĐẦU TƯ + dự án MỚI CẬP NHẬT (Cowork nạp hằng tuần)
export function nhomTraCuu(projects: Project[]) {
  const cdt = [...nhomChuDauTu(projects).entries()]
    .filter(([, g]) => g.duAn.length >= NGUONG_INDEX_CDT)
    .map(([slug, g]) => ({ href: `/chu-dau-tu/${slug}`, nhan: g.ten }));
  const moi = [...projects]
    .sort((a, b) => ngaySo(b.capNhat) - ngaySo(a.capNhat))
    .slice(0, 12)
    .map((p) => ({ href: `/du-an/${p.slug}`, nhan: p.name }));
  return [
    ...(cdt.length ? [{ tieuDe: "Theo chủ đầu tư", links: cdt }] : []),
    ...(moi.length ? [{ tieuDe: "Dự án mới cập nhật", links: moi }] : []),
  ];
}

// Đếm dự án theo tỉnh — cho khối "Dự án theo khu vực"
const tinhCua = (location: string) => location.split(",").pop()?.trim() ?? "";
export function demDuAnTheoTinh(items: { location: string }[]): [string, number][] {
  const m = new Map<string, number>();
  for (const p of items) {
    const t = tinhCua(p.location);
    if (t) m.set(t, (m.get(t) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

// ── DANH BẠ TRA CỨU DỰ ÁN (/du-an/tra-cuu — chủ dự án 29/10/2026) ──────────────────────────────────────────────────────────
// Mọi dự án: có hồ sơ (kể cả hồ sơ cơ bản chưa ảnh) + dự án khách chọn khi đăng tin (gộp tên trùng như ô tìm — dungDsDuAn).
// Mỗi dòng chỉ 4 trường kiểu tra mã số thuế: tên · chủ đầu tư · loại hình · địa chỉ (+ tình trạng để lọc, số tin bán / cho thuê).
export type DongTraCuu = {
  slug: string;
  ten: string;
  chuDauTu: string;  // "" = hồ sơ chưa có
  loaiHinh: string;  // "" = hồ sơ chưa có
  tinhTrang: string; // "" = hồ sơ chưa có
  diaChi: string;
  diaChiCu: string;
  tinh: string;
  ban: number;
  thue: number;
};

export function dongTraCuu(tin: Listing[], duAn: Project[]): DongTraCuu[] {
  const theoSlug = new Map(duAn.map((p) => [p.slug, p]));
  // Mã tin viết khác mã hồ sơ ("golden-bay" / "goldenbay") → gộp vào dòng hồ sơ, cùng luật trang dự án (cungDuAn)
  const ds = dungDsDuAn(tin, duAn);
  const coHoSo = ds.filter((d) => d.coTrang);
  const gon = ds.filter((d) => {
    if (d.coTrang) return true;
    const cha = coHoSo.find((h) => cungDuAn(d.slug, h.slug));
    if (!cha) return true;
    cha.ban += d.ban;
    cha.thue += d.thue;
    return false;
  });
  return gon
    .map((d) => {
      const p = d.coTrang ? theoSlug.get(d.slug) : undefined;
      const tin1 = p ? undefined : tin.find((l) => l.projectSlug === d.slug);
      return {
        slug: d.slug,
        ten: p?.name ?? d.ten,
        chuDauTu: p && p.developer !== "Đang cập nhật" ? p.developer : "",
        loaiHinh: p && p.type !== "Dự án bất động sản" ? p.type : "",
        tinhTrang: p?.status ?? "",
        diaChi: p?.location ?? tin1?.location ?? d.tinh,
        diaChiCu: p?.locationCu ?? tin1?.locationCu ?? "",
        tinh: d.tinh,
        ban: d.ban,
        thue: d.thue,
      };
    })
    .sort((a, b) => b.ban + b.thue - (a.ban + a.thue) || a.ten.localeCompare(b.ten, "vi"));
}
