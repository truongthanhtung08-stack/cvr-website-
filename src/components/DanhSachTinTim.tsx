import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TheTinMobile from "@/components/TheTinMobile";
import { getListingsTim } from "@/lib/listingsDb";

// MỤC RIÊNG TIN NGƯỜI MUA, NGƯỜI THUÊ (chủ dự án 05/11/2026: "Mục riêng trong Mua bán / Cho thuê" · "dùng chung 1 thẻ (mua bán, cho
// thuê, mua, thuê), không có hình lấy logo xám mặc định" · "khi search thì dùng chung cho 2 loại là mua bán và cho thuê").
// Tin "mua" / "can-thue" CHỈ hiện ở đây — danh sách bán, thuê, ô tìm, bộ lọc, trang Google (pSEO), bảng giá giữ nguyên.
// Cùng thẻ với danh sách Mua bán / Cho thuê (TheTinMobile: điện thoại · bản pc ở máy tính). Dữ liệu: getListingsTim (một truy vấn nhỏ).
export default async function DanhSachTinTim({ muc, tieuDe }: { muc: "mua" | "can-thue"; tieuDe: string }) {
  const tin = await getListingsTim(muc);
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">{tieuDe}</h1>
          <p className="mt-1 text-sm text-cvr-muted">{tin.length} tin</p>
          <div className="mt-5 max-w-3xl">
            <div className="-mx-4 grid grid-cols-1 gap-2.5 bg-[#e5e5ea] sm:hidden">
              {tin.map((item, i) => <TheTinMobile key={item.id} item={item} uuTien={i === 0} />)}
            </div>
            <div className="hidden sm:flex sm:flex-col sm:gap-5">
              {tin.map((item, i) => (
                <div key={item.id} className="overflow-hidden rounded-xl bg-white shadow-lux"><TheTinMobile item={item} pc uuTien={i === 0} /></div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
