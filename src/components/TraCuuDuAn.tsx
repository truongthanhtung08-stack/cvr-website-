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

// Thẻ DỌC (ảnh trên, chữ dưới) — khối "Dự án tương tự" ở trang dự án tra cứu: CÙNG KIỂU thẻ Dự án nổi bật (Tên · Địa chỉ ·
// Loại hình · Chủ đầu tư), hiện đủ chữ, thẻ trong hàng cao bằng nhau (chủ dự án 30/10/2026)
export function TheDuAnDoc({ d }: { d: DongTraCuu }) {
  return (
    <Link
      href={`/du-an/${d.slug}`}
      className="card-lux group flex h-full flex-col overflow-hidden rounded-none border border-cvr-line bg-white shadow-lux shadow-lux-hover hover:-translate-y-1 hover:border-cvr-blue/45"
    >
      <span className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-cvr-surface">
        {d.anh ? (
          <Image src={d.anh} alt={d.ten} fill sizes="(max-width:640px) 80vw, 25vw" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo/symbol-dark.svg" alt="" className="absolute inset-0 m-auto h-10 w-10 opacity-25" />
        )}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/80 px-2.5 py-[3px] text-[11px] font-semibold uppercase tracking-[0.06em] text-cvr-ink shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-1 ring-white/60 backdrop-blur-md">{d.tinhTrang || "Đang cập nhật"}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col p-3">
        <span className="font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">{d.ten}</span>
        <span className="mt-1 flex items-start gap-1 text-xs text-cvr-muted">
          <svg className="mt-px h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="min-w-0">{d.diaChi}</span>
        </span>
        {/* Trường bắt buộc luôn hiện, chưa có thì "Đang cập nhật" (chủ dự án 30/10/2026) */}
        <span className="mb-3 mt-1 text-xs text-cvr-body">Loại hình: {d.loaiHinh || "Đang cập nhật"}</span>
        <span className="mt-auto border-t border-cvr-line pt-2.5 text-xs text-cvr-body">
          Chủ đầu tư: <span className="font-medium text-cvr-ink">{d.chuDauTu || "Đang cập nhật"}</span>
        </span>
      </span>
    </Link>
  );
}

// Một dòng thông tin thẻ tra cứu: NHÃN mờ · GIÁ TRỊ đậm (chủ dự án 30/10/2026: "nội dung không phân biệt được phần nào");
// chưa có thông tin thì "Đang cập nhật" mờ hẳn, để thông tin thật nổi lên
function Dong({ nhan, gt }: { nhan: string; gt?: string }) {
  return (
    <span className="mt-1 flex gap-1.5 text-[13px] leading-snug sm:text-sm">
      <span className="shrink-0 text-cvr-muted">{nhan}</span>
      <span className={`min-w-0 ${gt ? "font-medium text-cvr-ink" : "text-cvr-faint"}`}>{gt || "Đang cập nhật"}</span>
    </span>
  );
}

export function TheTraCuu({ d }: { d: DongTraCuu }) {
  return (
    // CÙNG KHUÔN thẻ dự án trên trang (viền, bóng, ảnh bo góc, khe 20px) để cân với Dự án nổi bật — chủ dự án 29/10/2026.
    // Ảnh trái cả máy tính lẫn điện thoại (danh bạ nhiều dòng — gọn hơn ảnh trên); ảnh và khối chữ cùng mép trên, cùng mép dưới.
    <Link
      href={`/du-an/${d.slug}`}
      className="card-lux group flex h-full items-stretch gap-3 rounded-none border border-cvr-line bg-white p-2.5 shadow-lux shadow-lux-hover hover:-translate-y-1 hover:border-cvr-blue/45 sm:gap-5 sm:p-3"
    >
      {/* Ảnh dự án — chưa có ảnh: khung xám + biểu tượng Coastal Land (không lấy ảnh chung chung thay) */}
      {/* ẢNH TỰ GIÃN THEO CHỮ (chủ dự án 30/10/2026): cao đúng bằng khối chữ (self-stretch), tối thiểu 96 / 120 px để ảnh
          không dẹt — chữ dài (tên 2 dòng, điện thoại) thì ảnh cao theo, không hở trên dưới */}
      {/* GỌN CHO ĐIỆN THOẠI (30/10/2026): ảnh 96 px (máy tính 160) để chữ đủ chỗ, ít bẻ dòng */}
      <span className="relative min-h-24 w-24 shrink-0 self-stretch overflow-hidden rounded-lg bg-cvr-surface sm:min-h-30 sm:w-40 sm:rounded-xl">
        {d.anh ? (
          <Image src={d.anh} alt={d.ten} fill sizes="(max-width:640px) 96px, 160px" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo/symbol-dark.svg" alt="" className="absolute inset-0 m-auto h-7 w-7 opacity-25 sm:h-12 sm:w-12" />
        )}
      </span>
      {/* TRƯỜNG BẮT BUỘC LUÔN HIỆN (chủ dự án 30/10/2026): Tên → Chủ đầu tư → Địa chỉ (hệ mới) → Loại hình → Trạng thái;
          chưa có thông tin thì ghi "Đang cập nhật", không ẩn */}
      <span className="min-w-0 flex-1">
        <span className="-mt-0.5 mb-1 line-clamp-2 text-[15px] font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:text-lg">{d.ten}</span>
        <Dong nhan="Chủ đầu tư:" gt={d.chuDauTu} />
        <Dong nhan="Địa chỉ:" gt={d.diaChi} />
        <Dong nhan="Loại hình:" gt={d.loaiHinh} />
        <Dong nhan="Trạng thái:" gt={d.tinhTrang} />
      </span>
    </Link>
  );
}
