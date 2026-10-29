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
    // CÙNG KHUÔN thẻ dự án trên trang (viền, bóng, ảnh bo góc, khe 20px) để cân với Dự án nổi bật — chủ dự án 29/10/2026.
    // Ảnh trái cả máy tính lẫn điện thoại (danh bạ nhiều dòng — gọn hơn ảnh trên), ảnh và chữ cân giữa theo chiều cao.
    <Link
      href={`/du-an/${d.slug}`}
      className="card-lux group flex items-center gap-3 rounded-none border border-cvr-line bg-white p-2.5 shadow-lux shadow-lux-hover hover:-translate-y-1 hover:border-cvr-blue/45 sm:gap-5 sm:p-3"
    >
      {/* Ảnh dự án — chưa có ảnh: khung xám + biểu tượng Coastal Land (không lấy ảnh chung chung thay) */}
      <span className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-cvr-surface sm:w-48 sm:rounded-xl md:w-56">
        {d.anh ? (
          <Image src={d.anh} alt={d.ten} fill sizes="(max-width:640px) 112px, 224px" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo/symbol-dark.svg" alt="" className="absolute inset-0 m-auto h-8 w-8 opacity-25 sm:h-12 sm:w-12" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:text-lg">{d.ten}</span>
        <span className="mt-1 block text-xs text-cvr-body sm:text-sm">Chủ đầu tư: <span className="font-medium text-cvr-ink">{d.chuDauTu || "Đang cập nhật"}</span></span>
        <span className="mt-0.5 block text-xs text-cvr-body sm:text-sm">Địa chỉ: {d.diaChi}</span>
        {d.diaChiCu && <span className="block text-[11px] text-cvr-faint sm:text-xs">Địa chỉ cũ: {d.diaChiCu}</span>}
        <span className="mt-0.5 block text-xs text-cvr-body sm:text-sm">Loại hình: {d.loaiHinh || "Đang cập nhật"}</span>
      </span>
    </Link>
  );
}
