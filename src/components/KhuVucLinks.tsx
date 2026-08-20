import Link from "next/link";
import { khuVucList, khuVucTrongDiem, slugKhuVuc } from "@/lib/khuVuc";

// ============================================================================
// KHỐI LIÊN KẾT "XEM THEO KHU VỰC" — đặt cuối trang danh sách.
// ----------------------------------------------------------------------------
// Hai công dụng, cả hai đều quan trọng:
//   1. KHÁCH: đang xem nhà đất bán, muốn xem riêng Đà Nẵng hay Huế → bấm một cái.
//   2. GOOGLE: đây là ĐƯỜNG BÒ tới các trang khu vực. Trang nào không có liên
//      kết trỏ tới thì gần như không được lập chỉ mục, dù có nằm trong sitemap.
//
// Chỉ liệt kê khu vực CÓ TIN + các khu vực trọng điểm (vùng đang phủ sóng) —
// không rải hết 34 tỉnh để tránh dẫn khách vào trang trống.
// ============================================================================
export default function KhuVucLinks({
  base,
  demTheoTinh,
  tinhDangXem,
}: {
  base: "/mua-ban" | "/cho-thue" | "/du-an";
  // [tên tỉnh, số tin] — lấy từ chính dữ liệu của trang
  demTheoTinh: [string, number][];
  tinhDangXem?: string;
}) {
  const dem = new Map(demTheoTinh);
  const ten = Array.from(
    new Set([...demTheoTinh.filter(([, n]) => n > 0).map(([t]) => t), ...khuVucTrongDiem]),
  ).filter((t) => khuVucList.some((k) => k.name === t) && t !== tinhDangXem);

  if (ten.length === 0) return null;

  const nhan =
    base === "/cho-thue" ? "Cho thuê theo khu vực" : base === "/du-an" ? "Dự án theo khu vực" : "Nhà đất bán theo khu vực";

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
        <h2 className="text-base font-semibold tracking-tight text-cvr-ink sm:text-lg">{nhan}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ten.map((t) => {
            const n = dem.get(t) ?? 0;
            return (
              <Link
                key={t}
                href={`${base}/${slugKhuVuc(t)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-cvr-line bg-cvr-surface px-3.5 py-1.5 text-sm text-cvr-ink transition hover:border-cvr-blue hover:text-cvr-blue-ink"
              >
                {t}
                {n > 0 && <span className="text-[12px] text-cvr-faint">{n}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
