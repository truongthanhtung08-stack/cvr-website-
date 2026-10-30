import Image from "next/image";
import Link from "next/link";
import { normalizeVi } from "@/lib/filters";
import type { DongTraCuu } from "@/lib/traCuuDuAn";
import { getTier, HUY_HIEU_CLS } from "@/lib/packages";

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
      // ĐỒNG BỘ (chủ dự án 31/10/2026: thẻ to nhỏ rất xấu, không để khoảng trống): 5 dòng của thẻ (ảnh · tên · địa chỉ · loại hình [· tình trạng] ·
      // chủ đầu tư) là 5 hàng SUBGRID của dải slide → mọi thẻ trong dải cao bằng nhau, từng dòng thẳng hàng giữa các thẻ, chữ hiện đủ
      className="card-lux group row-span-5 grid grid-rows-subgrid gap-0 overflow-hidden rounded-none border-0 bg-white shadow-lux shadow-lux-hover hover:-translate-y-1 hover:border-cvr-blue/45"
    >
      <span className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-cvr-surface">
        {d.anh ? (
          <Image src={d.anh} alt={d.ten} fill sizes="(max-width:640px) 80vw, 25vw" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo/symbol-dark.svg" alt="" className="absolute inset-0 m-auto h-10 w-10 opacity-25" />
        )}
        {/* QUY ĐỊNH HIỂN THỊ CẤP (chốt 4–5/9, một kiểu mọi nơi như thẻ tin): huy hiệu viên thuốc HUY_HIEU_CLS + dải màu cấp đỉnh thẻ;
            nội dung huy hiệu = tình trạng dự án; mọi nhãn rộng đều 112 px (vừa chữ dài nhất "Đã hoàn thành"), chữ căn giữa (chủ dự án 31/10/2026); thẻ thường trơn */}
        {d.cap && (<>
          <span className="absolute inset-x-0 top-0 z-10 h-px" style={{ backgroundColor: getTier(d.cap).bar }} aria-hidden />
          <span className={HUY_HIEU_CLS.replace("w-[70px]", "w-[112px]")} style={{ backgroundColor: getTier(d.cap).accent, color: getTier(d.cap).badgeText }}>{d.tinhTrang || "Đang cập nhật"}</span>
        </>)}
      </span>
      {/* CHỮ DƯỚI ẢNH ĐỒNG NHẤT THẺ TIN (PropertyCard, chủ dự án 31/10/2026): tên 15 px đậm dòng 1,5 · các dòng 13 px biểu tượng +
          nội dung · dòng cuối gạch trên như dòng người đăng. Trường bắt buộc luôn hiện, thiếu ghi "<trường> đang cập nhật" */}
      <span className="min-w-0 px-3 pt-3 text-[15px] font-bold leading-[1.5] text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">{d.ten}</span>
      {/* Địa chỉ = ĐÚNG dòng địa chỉ thẻ tin: địa chỉ MỚI (phường + tỉnh), ghim, 13 px, một dòng (chủ dự án 31/10/2026) */}
      <span className="flex min-w-0 items-center gap-1 px-3 pt-1.5 text-[13px] text-cvr-muted">
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <span className="line-clamp-1 min-w-0">{d.diaChi.replace(/^.*?(?=(Phường|Xã|Đặc khu) )/, "")}</span>
      </span>
      {/* GỌN, CÓ LOGIC (chủ dự án 31/10/2026): loại hình + tình trạng chung một dòng ("Căn hộ cao cấp · Đang mở bán"); thẻ VIP đã có
          tình trạng ở nhãn trên ảnh → dòng chỉ ghi loại hình. Không còn dòng trống; chữ dài tự xuống dòng, thẻ giãn đều cả dải */}
      <span className="flex min-w-0 items-start gap-1 px-3 pb-3 pt-1.5 text-[13px] text-cvr-body">
        <svg className="mt-[3px] h-3.5 w-3.5 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /></svg>
        <span className="min-w-0">
          <span className={d.loaiHinh ? "" : "text-cvr-faint"}>{d.loaiHinh || "Loại hình đang cập nhật"}</span>
          {!d.cap && <span className={d.tinhTrang ? "" : "text-cvr-faint"}> · {d.tinhTrang || "Tình trạng đang cập nhật"}</span>}
        </span>
      </span>
      <span className={`mx-3 flex min-w-0 items-start gap-1 border-t border-cvr-line pb-3 pt-2.5 text-[13px] ${d.chuDauTu ? "font-medium text-cvr-body" : "text-cvr-faint"}`}>
        <svg className="mt-[3px] h-3.5 w-3.5 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M16 9h2a2 2 0 012 2v10M8 7h4M8 11h4M8 15h4M2 21h20" /></svg>
        <span className="min-w-0">{d.chuDauTu || "Chủ đầu tư đang cập nhật"}</span>
      </span>
    </Link>
  );
}

// THẺ TRA CỨU ĐỒNG NHẤT VỚI THẺ DỰ ÁN ĐANG CHẠY (thẻ ngang Dự án nổi bật — chủ dự án 30/10/2026: "đồng nhất từng cái trên thẻ
// dự án"): trạng thái = nhãn tròn trên ảnh · tên · địa chỉ có biểu tượng ghim · "Loại hình: …" · gạch ngăn · "Chủ đầu tư: …".
// Trường bắt buộc luôn hiện, chưa có thông tin thì "Đang cập nhật" (mờ hơn thông tin thật). Máy tính ảnh trái cùng cỡ thẻ nổi bật;
// điện thoại ảnh trái 96 px (danh bạ nhiều dự án chưa có ảnh — ảnh trên tràn viền sẽ toàn khung xám), nhãn trạng thái đầu cột chữ.
const NHAN_TT = "rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-cvr-ink shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-1 ring-white/60 backdrop-blur-md";
const giaTri = (gt?: string) => <span className={gt ? "font-medium text-cvr-ink" : "text-cvr-faint"}>{gt || "Đang cập nhật"}</span>;

export function TheTraCuu({ d }: { d: DongTraCuu }) {
  return (
    <Link
      href={`/du-an/${d.slug}`}
      className="card-lux group flex h-full items-stretch gap-3 rounded-none border border-cvr-line bg-white p-2.5 shadow-lux shadow-lux-hover hover:-translate-y-1 hover:border-cvr-blue/45 sm:gap-5 sm:p-3"
    >
      {/* Ảnh — chưa có ảnh: khung xám + biểu tượng Coastal Land; cao theo khối chữ (self-stretch) */}
      <span className="relative min-h-24 w-24 shrink-0 self-stretch overflow-hidden rounded-lg bg-cvr-surface sm:aspect-[4/3] sm:min-h-0 sm:w-56 sm:self-start sm:rounded-xl md:w-64">
        {d.anh ? (
          <Image src={d.anh} alt={d.ten} fill sizes="(max-width:640px) 96px, 256px" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo/symbol-dark.svg" alt="" className="absolute inset-0 m-auto h-7 w-7 opacity-25 sm:h-12 sm:w-12" />
        )}
        <span className={`absolute left-2.5 top-2.5 hidden sm:block ${NHAN_TT}`}>{d.tinhTrang || "Đang cập nhật"}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col sm:py-1 sm:pr-1">
        <span className={`mb-1.5 self-start sm:hidden ${NHAN_TT} px-2 text-[10px]`}>{d.tinhTrang || "Đang cập nhật"}</span>
        <span className="line-clamp-2 font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:text-lg">{d.ten}</span>
        <span className="mt-1 flex items-start gap-1 text-xs text-cvr-muted">
          <svg className="mt-px h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="min-w-0">{d.diaChi}</span>
        </span>
        <span className="mb-3 mt-1.5 text-xs text-cvr-body">Loại hình: {giaTri(d.loaiHinh)}</span>
        <span className="mt-auto border-t border-cvr-line pt-2.5 text-xs text-cvr-body">Chủ đầu tư: {giaTri(d.chuDauTu)}</span>
      </span>
    </Link>
  );
}
