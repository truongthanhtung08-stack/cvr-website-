import Image from "next/image";
import Link from "next/link";
import { normalizeVi } from "@/lib/filters";
import type { DongTraCuu } from "@/lib/traCuuDuAn";

// TRA CỨU DỰ ÁN (chủ dự án 29/10/2026): phần trái trang Dự án (/du-an) — danh bạ kiểu tra mã số thuế, mỗi thẻ: ảnh · Tên ·
// Chủ đầu tư · Địa chỉ · Loại hình. Bộ lọc của trang Dự án áp chung cho phần này và Dự án nổi bật (ProjectsBrowser).

// Gom loại hình tự do của dự án về nhóm lớn — cùng cách lọc Dự án nổi bật (ProjectsBrowser typeOf)
export const nhomLoai = (type: string) =>
  !type ? "" : type.includes("Căn hộ") ? "Căn hộ" : type.includes("đô thị") ? "Khu đô thị" : "Nghỉ dưỡng & biệt thự";

/** Lọc danh bạ theo đúng bộ lọc trang Dự án ("Tất cả" = không lọc trường đó) */
export function locTraCuu(ds: DongTraCuu[], q: string, tinh: string, loai: string, tinhTrang: string, tatCa: string): DongTraCuu[] {
  const tu = normalizeVi(q).split(/\s+/).filter(Boolean);
  return ds.filter((d) => {
    if (tinh !== tatCa && d.tinh !== tinh) return false;
    if (loai !== tatCa && nhomLoai(d.loaiHinh) !== loai) return false;
    if (tinhTrang !== tatCa && d.tinhTrang !== tinhTrang) return false;
    if (!tu.length) return true;
    const chu = normalizeVi(`${d.ten} ${d.chuDauTu} ${d.loaiHinh} ${d.diaChi} ${d.diaChiCu}`);
    return tu.every((t) => chu.includes(t));
  });
}

export function TheTraCuu({ d }: { d: DongTraCuu }) {
  return (
    <Link href={`/du-an/${d.slug}`} className="group flex gap-3 py-4 sm:gap-5">
      {/* Ảnh dự án — chưa có ảnh: khung xám + biểu tượng Coastal Land (không lấy ảnh chung chung thay) */}
      <span className="relative h-20 w-28 shrink-0 overflow-hidden bg-cvr-surface sm:h-28 sm:w-40">
        {d.anh ? (
          <Image src={d.anh} alt={d.ten} fill sizes="(max-width:640px) 112px, 160px" className="object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo/symbol-dark.svg" alt="" className="absolute inset-0 m-auto h-8 w-8 opacity-25" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold leading-snug text-cvr-ink group-hover:text-cvr-blue-ink group-hover:underline">{d.ten}</span>
        <span className="mt-1 block text-sm text-cvr-body">Chủ đầu tư: {d.chuDauTu || "Đang cập nhật"}</span>
        <span className="mt-0.5 block text-sm text-cvr-body">Địa chỉ: {d.diaChi}</span>
        {d.diaChiCu && <span className="block text-[13px] text-cvr-faint">Địa chỉ cũ: {d.diaChiCu}</span>}
        <span className="mt-0.5 block text-sm text-cvr-body">Loại hình: {d.loaiHinh || "Đang cập nhật"}</span>
      </span>
    </Link>
  );
}
