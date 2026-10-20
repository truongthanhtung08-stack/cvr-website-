import type { Listing, Project } from "@/lib/data";
import { khoaDuAn, type DuAnTen } from "@/lib/duAnTen";

// Dựng danh mục tên dự án từ bảng Dự án + trường "Dự án" của tin còn hạn, gộp tên trùng (cùng mã hoặc cùng tên lõi).
// Dùng ở máy chủ: /api/du-an/ten (gửi cho ô tìm) và /api/goi-y/that (gợi ý theo dữ liệu thật).
export function dungDsDuAn(tin: Listing[], duAn: Project[]): DuAnTen[] {
  const theoKhoa = new Map<string, DuAnTen>();
  const theoMa = new Map<string, DuAnTen>(); // cùng mã dự án mà tin ghi tên khác (gõ sai, viết tắt) → vẫn là một dự án
  const lay = (ten: string, slug: string, tinh: string, coTrang: boolean) => {
    const k = khoaDuAn(ten);
    const cu = theoMa.get(slug) ?? theoKhoa.get(k);
    if (cu) {
      if (coTrang && !cu.coTrang) { cu.coTrang = true; cu.slug = slug; cu.ten = ten; }
      theoMa.set(slug, cu);
      return cu;
    }
    const moi: DuAnTen = { ten, slug, tinh, coTrang, ban: 0, thue: 0 };
    theoKhoa.set(k, moi);
    theoMa.set(slug, moi);
    return moi;
  };
  for (const p of duAn) lay(p.name, p.slug, p.location.split(",").pop()?.trim() ?? "", true);
  for (const l of tin) {
    const ten = l.projectName?.trim();
    if (!ten || !l.projectSlug) continue;
    const d = lay(ten, l.projectSlug, l.location.split(",").pop()?.trim() ?? "", false);
    if ((l.purpose ?? "ban") === "thue") d.thue++;
    else d.ban++;
  }
  return [...theoKhoa.values()];
}
