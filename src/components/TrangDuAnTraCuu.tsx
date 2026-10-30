import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import RelatedListingsTabs from "@/components/RelatedListingsTabs";
import AnhTraCuu from "@/components/AnhTraCuu";
import MoTaThuGon from "@/components/MoTaThuGon";
import RichContent from "@/components/RichContent";
import DanhSachThuGon from "@/components/DanhSachThuGon";
import DuAnTuongTuTraCuu from "@/components/DuAnTuongTuTraCuu";
import ProjectNearby from "@/components/ProjectNearby";
import FloorPlans from "@/components/FloorPlans";
import VideoEmbed from "@/components/VideoEmbed";
import type { Listing } from "@/lib/data";
import type { DongTraCuu } from "@/lib/traCuuDuAn";

// TRANG CHI TIẾT DỰ ÁN TRA CỨU (chủ dự án 29/10/2026): dự án ở mục Tra cứu là THÔNG TIN CƠ BẢN để tra — khác trang Dự án nổi bật
// (ảnh lớn, tổng quan, mặt bằng, tiện ích…). Bố cục kiểu tra mã số thuế: ảnh + BẢNG thông tin (tên · chủ đầu tư · địa chỉ ·
// loại hình · tình trạng · thông số có nguồn · ngày cập nhật · nguồn) → tin bán / cho thuê tại dự án → bất động sản tương tự.
// Dùng cho hồ sơ dạng thẻ (nạp từ tệp Cowork) và dự án mới chỉ biết từ tin (chưa có hồ sơ).
// TỰ ĐẦY DẦN THEO HỒ SƠ (30/10/2026): cùng một khung — hồ sơ có thêm cột nào (mẫu mau-nhap-du-an.csv) thì hiện thêm đúng chỗ:
// bảng thêm dòng (đơn vị phát triển, giá từ, quy mô, sản phẩm, khởi công, bàn giao, pháp lý); nhiều ảnh → bộ đếm + xem lớn;
// PHẦN THÊM giống trang Dự án nổi bật (chủ dự án 30/10/2026): cùng tên mục, cùng khung — Tổng quan · Video · Vị trí & tiện ích
// xung quanh (bản đồ) · Mặt bằng · Tiện ích · Bảng giá; TỰ GIÃN: có thông tin mới hiện mục đó, thiếu thì ẩn hẳn → giao diện luôn gọn.
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
  videos: string[];       // [] = không hiện mục Video
  viTri: { mapQuery: string; places: { category: string; name: string; distance: string }[] } | null; // null = không hiện bản đồ
  matBang: { label: string; image: string; note: string }[];                  // [] = không hiện mục Mặt bằng
  bangGia: { unit: string; area: string; direction: string; price: string }[]; // [] = không hiện mục Bảng giá (chỉ khi hồ sơ cho hiện giá)
  coHoSo: boolean;        // false = dự án mới biết từ tin
};

// Khung mục — CÙNG KIỂU Section trang Dự án nổi bật (nền xám bo góc, tiêu đề 19/22 px)
function Muc({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-2xl bg-cvr-surface p-4 sm:p-5">
      <h2 className="mb-4 text-[19px] font-semibold tracking-tight text-cvr-ink sm:text-[22px]">{title}</h2>
      {children}
    </section>
  );
}

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
                  <Dong nhan="Trạng thái">{d.tinhTrang || "Đang cập nhật"}</Dong>
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

            {/* PHẦN THÊM — có thông tin mới hiện (cùng tên mục, cùng khung trang Dự án nổi bật) */}
            <div className="mt-3">
              {d.tongQuan.length > 0 && (
                <Muc title="Tổng quan dự án">
                  <MoTaThuGon dong={6}>
                    <div className="space-y-3 text-[15px] leading-relaxed text-cvr-body">
                      <RichContent paragraphs={d.tongQuan} title={d.ten} />
                    </div>
                  </MoTaThuGon>
                </Muc>
              )}
              {d.videos.length > 0 && (
                <Muc title="Video dự án">
                  <div className="space-y-4">{d.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}</div>
                </Muc>
              )}
              {d.viTri && (
                <Muc title="Vị trí & tiện ích xung quanh">
                  <ProjectNearby mapQuery={d.viTri.mapQuery} address={d.diaChi} places={d.viTri.places} zoom={16} />
                </Muc>
              )}
              {d.matBang.length > 0 && (
                <Muc title="Mặt bằng dự án">
                  <FloorPlans items={d.matBang} />
                </Muc>
              )}
              {d.tienIch.length > 0 && (
                <Muc title="Tiện ích dự án">
                  <DanhSachThuGon className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {d.tienIch.map((a) => (
                      <span key={a} className="flex items-start gap-2.5 rounded-xl border border-cvr-line bg-white px-4 py-3 text-[15px] leading-snug text-cvr-body">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-blue" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <span className="min-w-0">{a}</span>
                      </span>
                    ))}
                  </DanhSachThuGon>
                </Muc>
              )}
              {d.bangGia.length > 0 && (
                <Muc title="Bảng giá & loại hình">
                  <div className="overflow-hidden rounded-xl border border-cvr-line">
                    <div className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] bg-white px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-cvr-muted">
                      <span>Loại căn</span><span>Diện tích</span><span>Hướng</span><span className="text-right">Giá</span>
                    </div>
                    {d.bangGia.map((u, i) => (
                      <div key={i} className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] items-center border-t border-cvr-line/70 bg-white px-4 py-3 text-sm">
                        <span className="font-medium text-cvr-ink">{u.unit || "—"}</span>
                        <span className="text-cvr-body">{u.area || "—"}</span>
                        <span className="text-cvr-body">{u.direction || "—"}</span>
                        <span className={`text-right ${u.price ? "font-semibold text-cvr-ink" : "text-cvr-muted"}`}>{u.price || "Liên hệ"}</span>
                      </div>
                    ))}
                  </div>
                </Muc>
              )}
            </div>
          </HomeCollapsible>

          {(tinBan.length > 0 || tinThue.length > 0) && (
            <section id="tin-du-an" className="scroll-mt-14">
              <RelatedListingsTabs ban={tinBan} thue={tinThue} tenDuAn={d.ten} title={`Tin mua bán, cho thuê tại ${d.ten}`} />
            </section>
          )}
          {/* CUỐI TRANG: DỰ ÁN TƯƠNG TỰ (chủ dự án 30/10/2026: mở dự án → dự án tương tự; mở tin → BĐS tương tự) — cùng tỉnh, cùng
              nhóm loại hình đứng trước; đúng thẻ Tra cứu của trang Dự án */}
          <DuAnTuongTuTraCuu ds={duAnTuongTu} />
        </HomeExpandProvider>
      </div>
    </>
  );
}
