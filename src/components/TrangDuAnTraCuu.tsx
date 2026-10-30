import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import RelatedListingsTabs from "@/components/RelatedListingsTabs";
import AnhTraCuu from "@/components/AnhTraCuu";
import MoTaThuGon from "@/components/MoTaThuGon";
import RichContent from "@/components/RichContent";
import DanhSachThuGon from "@/components/DanhSachThuGon";
import { TheDuAnDoc } from "@/components/TraCuuDuAn";
import type { Listing } from "@/lib/data";
import type { DongTraCuu } from "@/lib/traCuuDuAn";

// TRANG CHI TIẾT DỰ ÁN TRA CỨU (chủ dự án 29/10/2026): dự án ở mục Tra cứu là THÔNG TIN CƠ BẢN để tra — khác trang Dự án nổi bật
// (ảnh lớn, tổng quan, mặt bằng, tiện ích…). Bố cục kiểu tra mã số thuế: ảnh + BẢNG thông tin (tên · chủ đầu tư · địa chỉ ·
// loại hình · tình trạng · thông số có nguồn · ngày cập nhật · nguồn) → tin bán / cho thuê tại dự án → bất động sản tương tự.
// Dùng cho hồ sơ dạng thẻ (nạp từ tệp Cowork) và dự án mới chỉ biết từ tin (chưa có hồ sơ).
// TỰ ĐẦY DẦN THEO HỒ SƠ (30/10/2026): cùng một khung — hồ sơ có thêm cột nào (mẫu mau-nhap-du-an.csv) thì hiện thêm đúng chỗ:
// bảng thêm dòng (đơn vị phát triển, giá từ, quy mô, sản phẩm, khởi công, bàn giao, pháp lý); nhiều ảnh → bộ đếm + xem lớn;
// tổng quan → mục "Tổng quan dự án" (thu gọn 6 dòng); tiện ích → mục "Tiện ích dự án" (6 mục + Xem thêm). Trống thì không hiện.
export type TraCuuChiTiet = {
  slug: string;
  ten: string;
  anhs: string[];         // [] = chưa có ảnh → khung xám + biểu tượng Coastal Land
  chuDauTu: string;       // "" = chưa có
  donViPhatTrien: string; // "" = không hiện dòng
  diaChi: string;
  diaChiCu: string;
  loaiHinh: string;       // "" = chưa có
  tinhTrang: string;      // "" = không hiện dòng
  giaTu: string;          // "" = không hiện dòng (chỉ khi hồ sơ có giá chắc chắn)
  thongSo: { label: string; value: string }[];
  capNhat: string;        // "" = không hiện dòng
  nguon: string;          // "" = không hiện dòng
  tongQuan: string[];     // [] = không hiện mục Tổng quan
  tienIch: string[];      // [] = không hiện mục Tiện ích
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
  duAnTuongTu,
}: {
  d: TraCuuChiTiet;
  tinBan: Listing[];
  tinThue: Listing[];
  duAnTuongTu: DongTraCuu[];
}) {
  return (
    <>
      {/* Không hiện dòng đường dẫn (chủ dự án 30/10/2026 — như trang dự án nổi bật); đường dẫn cho Google ở BreadcrumbJsonLd trang cha */}
      <div className="mx-auto max-w-7xl px-4 pb-footer sm:px-6 lg:px-8">
        <HomeExpandProvider>
          <HomeCollapsible>
            {/* TRA NHANH (30/10/2026): TÊN trước — điện thoại: tên → ảnh ngang thấp → bảng; máy tính: ảnh trái tự giãn cao bằng
                tên + bảng bên phải (ảnh khớp khối chữ, không hở) */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 lg:grid-cols-5 lg:gap-x-8 lg:gap-y-3">
              <h1 className="order-1 text-[21px] font-semibold leading-[1.3] tracking-tight text-cvr-ink sm:text-[28px] lg:col-span-3 lg:col-start-3 lg:row-start-1">{d.ten}</h1>

              {/* Ảnh dự án — một ảnh (hồ sơ tra cứu); chưa có: khung xám + biểu tượng Coastal Land */}
              <div className="relative order-2 -mx-4 aspect-[16/9] overflow-hidden bg-cvr-surface sm:mx-0 sm:rounded-xl lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:aspect-auto lg:min-h-64">
                <AnhTraCuu images={d.anhs} alt={d.ten} />
              </div>

              {/* Bảng thông tin cơ bản — kiểu tra mã số thuế */}
              <div className="order-3 lg:col-span-3 lg:col-start-3 lg:row-start-2">
                <dl className="border-t border-cvr-line">
                  <Dong nhan="Chủ đầu tư">{d.chuDauTu || "Đang cập nhật"}</Dong>
                  {d.donViPhatTrien && <Dong nhan="Đơn vị phát triển">{d.donViPhatTrien}</Dong>}
                  <Dong nhan="Địa chỉ">
                    {d.diaChi}
                    {d.diaChiCu && <span className="mt-0.5 block text-[13px] text-cvr-faint">Địa chỉ cũ: {d.diaChiCu}</span>}
                  </Dong>
                  <Dong nhan="Loại hình">{d.loaiHinh || "Đang cập nhật"}</Dong>
                  {d.tinhTrang && <Dong nhan="Tình trạng">{d.tinhTrang}</Dong>}
                  {d.giaTu && <Dong nhan="Giá từ">{d.giaTu}</Dong>}
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

            {/* Hồ sơ đầy đủ: Tổng quan + Tiện ích (cùng tên mục, cùng cách thu gọn trang dự án) — trống thì không hiện */}
            {d.tongQuan.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-4 text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Tổng quan dự án</h2>
                <MoTaThuGon dong={6}>
                  <div className="space-y-3 text-[15px] leading-relaxed text-cvr-body">
                    <RichContent paragraphs={d.tongQuan} title={d.ten} />
                  </div>
                </MoTaThuGon>
              </section>
            )}
            {d.tienIch.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-4 text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Tiện ích dự án</h2>
                <DanhSachThuGon className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {d.tienIch.map((a) => (
                    <span key={a} className="flex items-start gap-2.5 rounded-xl border border-cvr-line bg-white px-4 py-3 text-[15px] leading-snug text-cvr-body">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-blue" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span className="min-w-0">{a}</span>
                    </span>
                  ))}
                </DanhSachThuGon>
              </section>
            )}
          </HomeCollapsible>

          {(tinBan.length > 0 || tinThue.length > 0) && (
            <section id="tin-du-an" className="scroll-mt-14">
              <RelatedListingsTabs ban={tinBan} thue={tinThue} tenDuAn={d.ten} title={`Bán, cho thuê tại ${d.ten}`} />
            </section>
          )}
          {/* CUỐI TRANG: DỰ ÁN TƯƠNG TỰ (chủ dự án 30/10/2026: mở dự án → dự án tương tự; mở tin → BĐS tương tự) — cùng tỉnh, cùng
              nhóm loại hình đứng trước; đúng thẻ Tra cứu của trang Dự án */}
          {duAnTuongTu.length > 0 && (
            <HomeCollapsible>
              <section className="mt-10">
                <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Dự án tương tự</h2>
                {/* Một hàng trượt: điện thoại 1 thẻ (lộ thẻ kế), máy tính bảng 2, máy tính 4 — vuốt / cuộn ngang */}
                <ul className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 py-2 sm:mx-0 sm:scroll-px-0 sm:gap-5 sm:px-0">
                  {duAnTuongTu.map((x) => (
                    <li key={x.slug} className="w-[80%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"><TheDuAnDoc d={x} /></li>
                  ))}
                </ul>
              </section>
            </HomeCollapsible>
          )}
        </HomeExpandProvider>
      </div>
    </>
  );
}
