import type { Project } from "@/lib/data";

// ============================================================================
// TRANG CHỦ ĐẦU TƯ — /chu-dau-tu/<tên> (pSEO trục 11, kiểu Mã số thuế)
// Gom dự án theo tên chủ đầu tư. Tên phải ghi thống nhất ngay từ dữ liệu (chuẩn DATA gửi
// Cowork) — ở đây chỉ so khớp sau khi bỏ dấu, không tự gộp các cách gọi khác nhau.
// Index khi chủ đầu tư có ≥ 2 dự án đã đăng (1 dự án thì trùng ý với chính trang dự án).
// ============================================================================

export const NGUONG_INDEX_CDT = 2;

export const slugChuDauTu = (ten: string) =>
  ten.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const laChuDauTuThat = (ten?: string) => !!ten && ten.trim() !== "" && ten !== "Đang cập nhật";

export function nhomChuDauTu(projects: Project[]): Map<string, { ten: string; duAn: Project[] }> {
  const m = new Map<string, { ten: string; duAn: Project[] }>();
  for (const p of projects) {
    if (!laChuDauTuThat(p.developer)) continue;
    const s = slugChuDauTu(p.developer);
    const g = m.get(s);
    if (g) g.duAn.push(p);
    else m.set(s, { ten: p.developer.trim(), duAn: [p] });
  }
  return m;
}
