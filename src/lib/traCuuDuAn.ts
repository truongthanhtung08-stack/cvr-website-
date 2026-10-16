import { NGUONG_INDEX_CDT, nhomChuDauTu } from "@/lib/chuDauTu";
import type { Project } from "@/lib/data";

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
