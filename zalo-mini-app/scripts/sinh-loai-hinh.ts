// Sinh danh sách loại hình cha + ô loại con cho Zalo Mini App từ ĐÚNG nguồn web (categories.ts + listingSpec.ts).
import { nhomChonLoaiHinh, tenLoaiHinhMenu, tachChonLoaiHinh, oTheoMucChon } from "../../src/lib/categories";
import { fieldsFor, O_LOAI_CON } from "../../src/lib/listingSpec";
const ra: Record<string, unknown[]> = {};
for (const md of ["ban", "thue"] as const) {
  ra[md] = nhomChonLoaiHinh(md).flatMap((g) => g.items).map((v) => {
    const { type, loaiCon } = tachChonLoaiHinh(v);
    const con = oTheoMucChon(fieldsFor(type, md), type, loaiCon || undefined).find((f) => O_LOAI_CON.includes(f.key));
    return { ma: v, ten: tenLoaiHinhMenu(v, md), ...(con ? { con: { key: con.key, label: con.label, options: con.options ?? [] } } : {}) };
  });
}
console.log(JSON.stringify(ra));
