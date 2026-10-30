import Image from "next/image";
import Breadcrumb from "@/components/Breadcrumb";
import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import RelatedListingsTabs from "@/components/RelatedListingsTabs";
import ListingShowcase from "@/components/ListingShowcase";
import { TheTraCuu } from "@/components/TraCuuDuAn";
import type { Listing } from "@/lib/data";
import type { DongTraCuu } from "@/lib/traCuuDuAn";

// TRANG CHI TIẾT DỰ ÁN TRA CỨU (chủ dự án 29/10/2026): dự án ở mục Tra cứu là THÔNG TIN CƠ BẢN để tra — khác trang Dự án nổi bật
// (ảnh lớn, tổng quan, mặt bằng, tiện ích…). Bố cục kiểu tra mã số thuế: ảnh + BẢNG thông tin (tên · chủ đầu tư · địa chỉ ·
// loại hình · tình trạng · thông số có nguồn · ngày cập nhật · nguồn) → tin bán / cho thuê tại dự án → bất động sản tương tự.
// Dùng cho hồ sơ dạng thẻ (nạp từ tệp Cowork) và dự án mới chỉ biết từ tin (chưa có hồ sơ).
export type TraCuuChiTiet = {
  slug: string;
  ten: string;
  anh: string;            // "" = chưa có ảnh → khung xám + biểu tượng Coastal Land
  chuDauTu: string;       // "" = chưa có
  diaChi: string;
  diaChiCu: string;
  loaiHinh: string;       // "" = chưa có
  tinhTrang: string;      // "" = không hiện dòng
  thongSo: { label: string; value: string }[];
  capNhat: string;        // "" = không hiện dòng
  nguon: string;          // "" = không hiện dòng
  coHoSo: boolean;        // false = dự án mới biết từ tin
};

function Dong({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-cvr-line py-2.5 text-sm sm:text-[15px]">
      <dt className="w-28 shrink-0 text-cvr-muted sm:w-32">{nhan}</dt>
      <dd className="min-w-0 flex-1 text-cvr-ink">{children}</dd>
    </div>
  );
}

export default function TrangDuAnTraCuu({
  d,
  tinBan,
  tinThue,
  tuongTu,
  tinh,
  cungKhuVuc,
}: {
  d: TraCuuChiTiet;
  tinBan: Listing[];
  tinThue: Listing[];
  tuongTu: { nhe: Listing[]; ids: string[] };
  tinh: string;
  cungKhuVuc: DongTraCuu[];
}) {
  return (
    <>
      <Breadcrumb items={[{ name: "Dự án", href: "/du-an" }, { name: "Tra cứu dự án", href: "/du-an#tra-cuu" }, { name: d.ten, href: `/du-an/${d.slug}` }]} />
      <div className="mx-auto max-w-7xl px-4 pb-footer sm:px-6 lg:px-8">
        <HomeExpandProvider>
          <HomeCollapsible>
            {/* TRA NHANH (30/10/2026): TÊN trước — điện thoại: tên → ảnh ngang thấp → bảng; máy tính: ảnh trái tự giãn cao bằng
                tên + bảng bên phải (ảnh khớp khối chữ, không hở) */}
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-x-8 lg:gap-y-3">
              <h1 className="order-1 text-[21px] font-semibold leading-[1.3] tracking-tight text-cvr-ink sm:text-[28px] lg:col-span-3 lg:col-start-3 lg:row-start-1">{d.ten}</h1>

              {/* Ảnh dự án — một ảnh (hồ sơ tra cứu); chưa có: khung xám + biểu tượng Coastal Land */}
              <div className="relative order-2 -mx-4 aspect-[16/9] overflow-hidden bg-cvr-surface sm:mx-0 sm:rounded-xl lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:aspect-auto lg:min-h-64">
                {d.anh ? (
                  <Image src={d.anh} alt={d.ten} fill priority fetchPriority="high" sizes="(max-width:1024px) 100vw, 40vw" className="object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/logo/symbol-dark.svg" alt="" className="absolute inset-0 m-auto h-14 w-14 opacity-25" />
                )}
              </div>

              {/* Bảng thông tin cơ bản — kiểu tra mã số thuế */}
              <div className="order-3 lg:col-span-3 lg:col-start-3 lg:row-start-2">
                <dl className="border-t border-cvr-line">
                  <Dong nhan="Chủ đầu tư">{d.chuDauTu || "Đang cập nhật"}</Dong>
                  <Dong nhan="Địa chỉ">
                    {d.diaChi}
                    {d.diaChiCu && <span className="mt-0.5 block text-[13px] text-cvr-faint">Địa chỉ cũ: {d.diaChiCu}</span>}
                  </Dong>
                  <Dong nhan="Loại hình">{d.loaiHinh || "Đang cập nhật"}</Dong>
                  {d.tinhTrang && <Dong nhan="Tình trạng">{d.tinhTrang}</Dong>}
                  {d.thongSo.map((s) => <Dong key={s.label} nhan={s.label}>{s.value}</Dong>)}
                  {d.capNhat && <Dong nhan="Cập nhật">{d.capNhat}</Dong>}
                  {d.nguon && <Dong nhan="Nguồn">{d.nguon}</Dong>}
                </dl>
                {d.coHoSo ? (
                  <p className="mt-3 text-[13px] text-cvr-faint">
                    Thông tin dự án do Coastal Land tổng hợp từ nguồn công khai, không phải trang chính thức của chủ đầu tư.
                  </p>
                ) : (
                  <p className="mt-3 rounded-xl bg-cvr-surface px-4 py-2.5 text-sm text-cvr-body">Thông tin dự án đang được cập nhật.</p>
                )}
              </div>
            </div>
          </HomeCollapsible>

          {(tinBan.length > 0 || tinThue.length > 0) && (
            <section id="tin-du-an" className="scroll-mt-14">
              <RelatedListingsTabs ban={tinBan} thue={tinThue} tenDuAn={d.ten} title={`Tin mua bán liên quan tại dự án ${d.ten}`} />
            </section>
          )}
          {/* Tra tiếp ngay tại chỗ: dự án khác cùng tỉnh, đúng thẻ Tra cứu của trang Dự án */}
          {cungKhuVuc.length > 0 && (
            <HomeCollapsible>
              <section className="mt-10">
                <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Dự án khác tại {tinh}</h2>
                <ul className="mt-4 flex flex-col gap-4 sm:gap-5">
                  {cungKhuVuc.map((x) => <li key={x.slug}><TheTraCuu d={x} /></li>)}
                </ul>
              </section>
            </HomeCollapsible>
          )}
          <ListingShowcase items={tuongTu.nhe} idsDayDu={tuongTu.ids} sectionKey="bds-tuong-tu" title="Bất động sản tương tự" heading="Bất động sản tương tự" relevance emptyNote="Chưa có bất động sản tương tự." />
        </HomeExpandProvider>
      </div>
    </>
  );
}
