import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import PricingSidebar, { type SidebarGroup } from "@/components/PricingSidebar";
import PropertyCard from "@/components/PropertyCard";
import { ProjectCard, ProjectRow } from "@/components/ProjectSlider";
import { getProjects } from "@/lib/contentDb";
import type { Listing, Project } from "@/lib/data";
import { getTier, type TierId } from "@/lib/packages";
import { getBilling, getQuyDinhGia } from "@/lib/siteContent";
import { bangTheoMucDich, bangUp, goiPr, ghiChuPr, bangBanner, giaTra, priceLinesDuAn, freeDangChay, freeNote, tenGoiMienPhi } from "@/lib/billing";
import BangGiaGoiTin from "@/components/BangGiaGoiTin";
import BangGiaDayTin from "@/components/BangGiaDayTin";
import NutMucDichGia from "@/components/NutMucDichGia";
import GoiHoiVienCards, { DieuKienHoiVien } from "@/components/GoiHoiVienCards";

export const metadata: Metadata = {
  alternates: { canonical: "/bao-gia-dang-tin" },
  title: "Báo giá dịch vụ và truyền thông",
  description:
    "Bảng giá dịch vụ Coastal Land: gói tin đăng CVR Basic, CVR Silver, CVR Gold, CVR Diamond, đẩy tin, gói hội viên, gói dự án, bài PR và banner quảng cáo.",
};

// ═══════════════ DỮ LIỆU BẢNG GIÁ ═══════════════
// Nguồn: file "Gia đăng tin + QC" (D:\Coastal Land\Bảng giá truyền thông).
// Các gói Đẩy tin / Dự án / PR / Banner: đối chuẩn thị trường, đổi giá chỉ sửa tại đây.

type PriceLine = { label: string; original?: string; price: string; perDay?: string };

// QUYỀN LỢI · QUY ĐỊNH — chữ CHỈ từ admin đã duyệt (src/lib/quyDinhGia.ts). Chưa duyệt = ẩn.

const pjPkgs = [
  {
    tierId: "diamond" as TierId,
    name: "CVR-PJ Diamond",
    img: "sun-cosmo-residence.jpg",
    sample: { title: "Sun Cosmo Residence", address: "Hòa Hải, Ngũ Hành Sơn, Đà Nẵng" },
  },
  {
    tierId: "gold" as TierId,
    name: "CVR-PJ Gold",
    img: "the-filmore-da-nang.jpg",
    sample: { title: "The Filmore Da Nang", address: "Hải Châu, Đà Nẵng" },
  },
  {
    tierId: "silver" as TierId,
    name: "CVR-PJ Silver",
    img: "khu-do-thi-fpt-city.jpg",
    sample: { title: "Khu đô thị FPT City", address: "Ngũ Hành Sơn, Đà Nẵng" },
  },
];

// Quy định chung + quyền lợi từng hạng: sửa ở admin (src/lib/quyDinhGia.ts).

// Menu sidebar — CHỈ dịch vụ + giá. Công cụ tiện ích (giá đất Nhà nước, so sánh…)
// KHÔNG thuộc báo giá — đã gỡ khỏi trang này (01/10/2026), vẫn ở menu Tiện ích.
// CÙNG 2 NHÓM với menu Báo giá trên đầu trang (Header.tsx) — hai nơi luôn khớp nhau.
const nhomDichVu = (coHoiVien: boolean): SidebarGroup[] => [
  {
    title: "Đăng tin",
    items: [
      { label: "Gói tin đăng CVR", href: "#bang-gia-tin" },
      { label: "Gói đẩy tin", href: "#goi-day-tin" },
      ...(coHoiVien ? [{ label: "Gói hội viên", href: "#goi-hoi-vien" }] : []),
    ],
  },
  {
    title: "Quảng cáo",
    items: [
      { label: "Gói dự án", href: "#goi-du-an" },
      { label: "Bài PR", href: "#goi-pr" },
      { label: "Banner", href: "#goi-banner" },
    ],
  },
  {
    title: "Thông tin",
    items: [
      { label: "Quy định chung", href: "#quy-dinh" },
      { label: "Nhận báo giá", href: "#lien-he" },
    ],
  },
];

const HOTLINE = "0377 985 036";

// ═══════════════ VÍ DỤ MINH HOẠ TỪNG LOẠI TIN ═══════════════
// Chủ dự án chốt 01/10/2026: CHỈ LẤY ẢNH THẬT (ảnh chuẩn nhất của tin thật đang ở đúng
// hạng), KHÔNG dùng tiêu đề / thông tin của tin thật — tiêu đề là VÍ DỤ chuẩn SEO
// (loại giao dịch · loại nhà · đặc điểm · đường/khu · phường · tỉnh). Ảnh lưu CỐ ĐỊNH ở đây
// nên tin VIP hết hạn thì minh hoạ vẫn còn (ảnh trong kho không bị xoá khi tin hết hạn).
// Ảnh chọn bằng mắt 01/10: bỏ ảnh bìa là băng rôn khuyến mãi / ảnh cận đồ trang trí.
const KHO = "https://miyugmacyerqvzhgmbyd.supabase.co/storage/v1/object/public/listings/";
// Mô tả ví dụ ĐỦ DÀI để thẻ hiện đúng số dòng của từng hạng (Kim cương 3 · Vàng 2 · Bạc 1 ·
// Thường 0) — tiêu đề viết hoa, dải nhấn, huy hiệu do PropertyCard tự áp theo hạng.
const viDu = (id: string, title: string, image: string, location: string, desc: string): Listing =>
  ({ id, title, image, location, desc, price: "Thoả thuận", area: "" }) as Listing;
// Tiêu đề + mô tả ĐỦ DÀI và DÀI NGANG NHAU ở cả 4 hạng — để khách thấy rõ khác biệt hiển thị
// (tiêu đề VIẾT HOA hay không · mô tả 3/2/1/0 dòng), không phải do nội dung ngắn dài khác nhau.
const MO_TA_CHUNG =
  " Pháp lý sổ hồng chính chủ, sẵn sàng giao dịch. Khu dân cư hiện hữu, gần trường học, chợ, bệnh viện và các trục đường chính, thuận tiện di chuyển vào trung tâm.";
const VI_DU_MINH_HOA: Record<TierId, Listing> = {
  diamond: { ...viDu("vi-du-diamond", "Bán nhà 3 tầng 2 mặt tiền đường 10,5m, nội thất gỗ cao cấp, sổ hồng chính chủ, phường Hòa Xuân, Đà Nẵng",
    KHO + "1788255659524-763311-IMG_1787991692267_1787991698851.webp", "Phường Hòa Xuân, Đà Nẵng",
    "Nhà xây kiên cố, phòng khách rộng thoáng, 4 phòng ngủ, 4 phòng tắm, bếp liên thông phòng ăn, sân thượng rộng." + MO_TA_CHUNG), badge: "VIP" },
  gold: { ...viDu("vi-du-gold", "Bán nhà phố liền kề 4 tầng khu đô thị mới, đường nội khu 13,5m, sổ hồng riêng, phường Thuận Hóa, Huế",
    KHO + "1788251683728-709049-hue07-5.webp", "Phường Thuận Hóa, Huế",
    "Thiết kế hiện đại đồng bộ cả dãy, 4 phòng ngủ, mặt tiền rộng phù hợp vừa ở vừa kinh doanh, an ninh 24/7." + MO_TA_CHUNG), badge: "Nổi bật" },
  silver: { ...viDu("vi-du-silver", "Bán villa 2 mặt tiền thiết kế hiện đại, đầy đủ nội thất cao cấp, trung tâm phường Hải Châu, Đà Nẵng",
    KHO + "1788251609839-665955-dn15-5.webp", "Phường Hải Châu, Đà Nẵng",
    "Phòng khách thông tầng, 5 phòng ngủ, sân vườn và chỗ đậu ô tô trong nhà, hoàn thiện cao cấp dọn vào ở ngay." + MO_TA_CHUNG), badge: "Mới" },
  basic: viDu("vi-du-basic", "Bán nhà 3 tầng mới xây, đường trước nhà 7,5m, kết cấu chắc chắn, sổ hồng chính chủ, phường Hòa Xuân, Đà Nẵng",
    KHO + "fbded30f4d07e2de6aeb383a-1784362006949-284895-1.webp", "Phường Hòa Xuân, Đà Nẵng",
    "Nhà 3 phòng ngủ, 3 phòng tắm, hoàn thiện mới, khu dân cư đông đúc." + MO_TA_CHUNG),
};

// ═══════════════ TRANG ═══════════════
// Thẻ tin minh hoạ từng cấp = TIN THẬT mới nhất của cấp đó trong Supabase
// (không còn tin/ảnh mẫu cứng). Đăng hoặc sửa tin trong admin → trang này tự đổi theo.
export default async function BaoGiaPage() {
  const [allProjects, billing, quyDinh] = await Promise.all([getProjects(), getBilling(), getQuyDinhGia()]);
  // Quyền lợi từng hạng + quy định chung: sửa ở admin, không viết trong trang.
  const loiIch = (t: TierId) => quyDinh.quyenLoi[t].loiIch;
  const hienThi = (t: TierId) => quyDinh.quyenLoi[t].hienThi;
  // MỌI GIÁ ĐỀU TỪ ADMIN (/admin/gia-khuyen-mai).
  // Trang này trước đây còn một bảng giá viết cứng chạy song song — Diamond 1 tuần
  // ghi 980.000đ trong khi bảng giá đang chạy là 1.050.000đ. Sửa giá trong admin mà
  // quên sửa code là hai nơi nói hai giá khác nhau. Nay không còn số nào viết riêng
  // trong trang: admin chưa lưu gì thì lùi về bảng giá chuẩn trong billing.ts.
  // Đã công bố giá theo mục đích (/admin/gia-chuan) thì trang này bày bảng BÁN.
  const bangBan = bangTheoMucDich(billing, "ban");
  // MỘT NGUỒN (01/10/2026): KHÔNG lùi về giá viết sẵn trong code khi admin thiếu một gói —
  // giá chỉ đến từ admin; gói admin chưa đặt giá thì không có dòng giá.
  const giaDuAn = (id: TierId): PriceLine[] => priceLinesDuAn(billing, id) ?? [];
  // CHƯƠNG TRÌNH KHUYẾN MÃI đang chạy (admin → Giá & quy định → Miễn phí) — báo cho khách.
  const kmDangChay = freeDangChay(billing.free, new Date().toISOString().slice(0, 10));
  // ĐẨY TIN · PR · BANNER: lấy đúng bản chủ dự án đặt ở /admin/gia-khuyen-mai.
  // Chưa lưu gì thì hàm tự trả mức chuẩn — trang không bao giờ trống.
  const upRows = bangUp(bangBan);
  // CHO THUÊ có bảng riêng CHỈ KHI đã công bố giá theo mục đích — trước đó giá
  // bán và thuê là một, hiện nút gạt Bán | Cho thuê chỉ thừa.
  const coThue = !!billing.congBo;
  const bangThue = bangTheoMucDich(billing, "thue");
  const upRowsThue = bangUp(bangThue);
  const prPkgs = goiPr(billing);
  const prNotes = ghiChuPr(billing);
  const bannerTables = bangBanner(billing);
  // GÓI HỘI VIÊN — chỉ hiện khi admin đã bấm "Công bố gói hội viên".
  const goiHoiVien = billing.hoiVien ?? [];
  const coHv = goiHoiVien.length > 0;
  const so = (n: number) => String(n + (coHv ? 1 : 0)).padStart(2, "0"); // mục sau Gói hội viên dồn số
  const tinMau = (id: TierId): Listing => VI_DU_MINH_HOA[id];
  // Dự án mẫu từng cấp CVR-PJ — dự án thật của cấp đó
  const projectOfTier = (id: TierId): Project | null =>
    allProjects.find((x) => (x.tier ?? "basic") === id) ?? null;


  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        {/* Mở đầu — Apple: nền sáng, headline lớn căn giữa, khoảng trắng rộng */}
        <section className="border-b border-cvr-line bg-cvr-surface">
          <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 text-center sm:px-6 sm:pb-12 sm:pt-14 lg:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cvr-gold-ink">
              Coastal Land — Bảng giá 2026
            </p>
            <h1 className="mx-auto mt-2.5 max-w-3xl text-[30px] font-semibold leading-[1.1] tracking-tight text-cvr-ink sm:text-[40px]">
              Báo giá dịch vụ và truyền thông
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-cvr-muted">
              Giải pháp đăng tin và quảng cáo giúp người bán, môi giới, chủ đầu tư
              tiếp cận đúng khách hàng tiềm năng.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[248px_1fr] lg:gap-10">
            <PricingSidebar groups={nhomDichVu(coHv)} hotline={HOTLINE} />

            <div className="min-w-0 space-y-12 sm:space-y-14">
              {/* KHUNG 3 BẢNG GIÁ THEO MỤC ĐÍCH — nút gạt Bán | Cho thuê đổi `data-md`,
                  mọi con số bên trong đổi theo (xem NutMucDichGia). */}
              <div id="vung-bang-gia" data-md="ban" className="group/gia space-y-12 sm:space-y-14">
              {coThue && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-cvr-muted">Xem giá cho</span>
                  <NutMucDichGia />
                </div>
              )}
              {/* BẢNG GIÁ TIN ĐĂNG KIỂU BATDONGSAN — số ngày × loại tin, giá từ admin, gạt VAT */}
              <section id="bang-gia-tin" className="scroll-mt-24">
                <SectionTitle no="01" title="Gói tin đăng CVR" desc="Giá theo loại tin và số ngày hiển thị." />
                <div className="mt-6">
                  <div className={coThue ? "group-data-[md=thue]/gia:hidden" : ""}><BangGiaGoiTin plans={bangBan.plans} /></div>
                  {coThue && <div className="hidden group-data-[md=thue]/gia:block"><BangGiaGoiTin plans={bangThue.plans} /></div>}
                </div>
                {kmDangChay && (
                  <div className="mt-4 rounded-2xl border border-cvr-blue/25 bg-cvr-blue/[0.06] px-5 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cvr-blue-ink">Khuyến mãi đang áp dụng</p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-cvr-ink">{freeNote(billing.free, tenGoiMienPhi(billing))}</p>
                  </div>
                )}

                {/* QUYỀN LỢI TỪNG LOẠI TIN — nội dung từ admin (Giá chuẩn → Quy định), không ảnh, không lặp giá */}
                <h3 className="mt-10 text-lg font-semibold tracking-tight text-cvr-ink">Quyền lợi từng loại tin</h3>
                <div className="mt-4 space-y-4">
                  {(["basic", "silver", "gold", "diamond"] as const).map((id) => (
                    <QuyenLoiCap key={id} tierId={id} benefits={loiIch(id)} displays={hienThi(id)} mau={<TierSample listing={tinMau(id)} />} />
                  ))}
                </div>
              {/* LOẠI TIN & ĐẶC ĐIỂM */}
              {quyDinh.bangQuyenLoi.length > 0 && <div id="dac-diem" className="mt-10 scroll-mt-24">
                <h3 className="text-lg font-semibold tracking-tight text-cvr-ink">So sánh đặc điểm hiển thị</h3>
                <div className="mt-6 overflow-x-auto rounded-2xl border border-cvr-line bg-white shadow-lux">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-cvr-line text-left">
                        <th className="px-6 py-4 font-semibold text-cvr-ink">Đặc điểm</th>
                        {(["basic", "silver", "gold", "diamond"] as const).map((id) => {
                          const t = getTier(id);
                          return (
                            <th key={id} className="px-4 py-4 text-center font-semibold tracking-tight" style={{ color: t.accent }}>
                              {t.name}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {quyDinh.bangQuyenLoi.map((r) => (
                        <tr key={r.ten} className="border-b border-cvr-line/60 transition-colors last:border-0 hover:bg-cvr-surface/50">
                          <td className="px-6 py-3.5 text-cvr-body">{r.ten}</td>
                          {(["basic", "silver", "gold", "diamond"] as const).map((id) => r.giaTri[id]).map((v, i) => (
                            <td key={i} className={`px-4 py-3.5 text-center ${v === "✓" ? "font-semibold text-cvr-ink" : "text-cvr-muted"}`}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>}
              </section>

              {/* 3. GÓI ĐẨY TIN */}
              <section id="goi-day-tin" className="scroll-mt-24">
                <SectionTitle no="02" title="Gói Đẩy tin" desc="Đưa tin đang hiển thị lên đầu trong cùng loại tin." />
                {coThue && <div className="mt-4"><NutMucDichGia /></div>}
                {/* CÙNG KIỂU bảng giá tin đăng (Batdongsan) — chung với hộp Mua gói đẩy của khách */}
                <div className="mt-6">
                  <div className={coThue ? "group-data-[md=thue]/gia:hidden" : ""}><BangGiaDayTin rows={upRows} /></div>
                  {coThue && <div className="hidden group-data-[md=thue]/gia:block"><BangGiaDayTin rows={upRowsThue} /></div>}
                </div>
              </section>
              </div>

              {/* 4. GÓI HỘI VIÊN — mua theo tháng, voucher mỗi 30 ngày (cơ chế Batdongsan) */}
              {coHv && (
                <section id="goi-hoi-vien" className="scroll-mt-24">
                  <SectionTitle no="03" title="Gói Hội viên" desc="Dành cho môi giới đăng tin thường xuyên." />
                  <div className="mt-6">
                    <GoiHoiVienCards goi={goiHoiVien} />
                    <DieuKienHoiVien dong={quyDinh.dieuKienHoiVien} />
                  </div>
                </section>
              )}

              {/* 4. GÓI DỰ ÁN */}
              <section id="goi-du-an" className="scroll-mt-24">
                <SectionTitle no={so(3)} title="Gói Dự án" desc="Vị trí dự án nổi bật dành cho chủ đầu tư và đại lý phân phối." />
                <div className="mt-6 space-y-6">
                  {pjPkgs.map((p) => (
                    <PkgCard
                      key={p.name}
                      tierId={p.tierId}
                      name={p.name}
                      displays={quyDinh.quyenLoiDuAn[p.tierId]}
                      media={<ProjectTierSample project={projectOfTier(p.tierId)} />}
                      prices={giaDuAn(p.tierId)}
                      cta={{ label: "Liên hệ tư vấn", href: "#lien-he" }}
                    />
                  ))}
                </div>
              </section>

              {/* 5. GÓI BÀI PR */}
              <section id="goi-pr" className="scroll-mt-24">
                <SectionTitle no={so(4)} title="Gói bài PR" desc="Bài viết truyền thông trên chuyên mục Tin tức — tăng độ tin cậy và nhận diện thương hiệu." />
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                  {prPkgs.map((p) => {
                    const t = getTier(p.tierId);
                    return (
                      <article key={p.name} className="flex flex-col rounded-2xl border border-cvr-line bg-white p-6 shadow-lux">
                        <h3 className="text-lg font-semibold tracking-tight" style={{ color: t.accent }}>{p.name}</h3>
                        <ul className="mt-4 flex-1 space-y-2 text-sm leading-relaxed text-cvr-body">
                          {p.displays.map((d) => (
                            <li key={d} className="flex gap-2.5"><CheckIcon /> <span>{d}</span></li>
                          ))}
                        </ul>
                        <div className="mt-6 border-t border-cvr-line pt-5">
                          <p className="text-xs text-cvr-muted">Giá mỗi bài</p>
                          <p className="mt-1 text-[26px] font-semibold tracking-tight text-cvr-ink">{giaTra(p.gia)}</p>
                          <a
                            href="#lien-he"
                            className="mt-4 block rounded-full bg-cvr-ink py-2.5 text-center text-sm font-semibold text-white transition hover:bg-cvr-ink/90 active:scale-[0.99]"
                          >
                            Liên hệ tư vấn
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="mt-6 rounded-2xl bg-cvr-surface p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cvr-muted">Lưu ý</p>
                  <ul className="mt-2.5 space-y-1.5 text-sm leading-relaxed text-cvr-body">
                    {prNotes.map((n) => <li key={n}>– {n}</li>)}
                  </ul>
                </div>
              </section>

              {/* 6. GÓI BANNER */}
              <section id="goi-banner" className="scroll-mt-24">
                <SectionTitle no={so(5)} title="Gói Banner quảng cáo" desc="Vị trí banner nổi bật trên Trang chủ và các trang danh sách — tiếp cận toàn bộ khách truy cập." />
                {bannerTables.map((tbl) => (
                  <div key={tbl.title} className="mt-7">
                    <h3 className="mb-3 text-base font-semibold tracking-tight text-cvr-ink">{tbl.title}</h3>
                    <div className="overflow-x-auto rounded-2xl border border-cvr-line bg-white shadow-lux">
                      <table className="w-full min-w-[680px] text-sm">
                        <thead>
                          <tr className="border-b border-cvr-line text-left">
                            <th className="px-6 py-4 font-semibold text-cvr-ink">Tên gói</th>
                            <th className="px-4 py-4 font-semibold text-cvr-ink">{tbl.sizeLabel}</th>
                            <th className="px-4 py-4 font-semibold text-cvr-ink">Giá/tuần</th>
                            <th className="px-4 py-4 font-semibold text-cvr-ink">Vị trí</th>
                            <th className="px-4 py-4 font-semibold text-cvr-ink">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tbl.rows.map((r) => (
                            <tr key={r.name} className="border-b border-cvr-line/60 transition-colors last:border-0 hover:bg-cvr-surface/50">
                              <td className="px-6 py-4 font-medium text-cvr-ink">{r.name}</td>
                              <td className="px-4 py-4 text-cvr-body">{r.size}</td>
                              <td className="px-4 py-4 font-semibold tracking-tight text-cvr-ink">{giaTra(r.gia)}</td>
                              <td className="px-4 py-4 text-cvr-body">{r.pos}</td>
                              <td className="px-4 py-4 text-cvr-muted">{r.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                {quyDinh.quyDinhBanner.length > 0 && (
                  <p className="mt-4 text-[13px] leading-relaxed text-cvr-faint">{quyDinh.quyDinhBanner.join(" · ")}</p>
                )}
              </section>

              {/* QUY ĐỊNH CHUNG */}
              <section id="quy-dinh" className="scroll-mt-24">
                <SectionTitle title="Quy định chung" desc="" />
                <div className="mt-6 space-y-3 rounded-2xl bg-cvr-surface p-6">
                  {quyDinh.quyDinhChung.map((r) => (
                    <p key={r} className="text-sm leading-relaxed text-cvr-body">{r}</p>
                  ))}
                </div>
              </section>

              {/* LIÊN HỆ */}
              <section id="lien-he" className="scroll-mt-24">
                <SectionTitle title="Nhận báo giá và tư vấn" desc="Để lại thông tin, chuyên viên Coastal Land liên hệ trong 5 phút." />
                <div className="mt-6 max-w-2xl">
                  <LeadForm
                    cta="Nhận báo giá ngay"
                    topics={["Gói tin đăng CVR", "Gói Đẩy tin", "Gói Dự án", "Gói bài PR", "Gói Banner", "Khác"]}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ═══════════════ THÀNH PHẦN ═══════════════

// Tiêu đề section — kicker vàng + headline tracking âm (Apple)
function SectionTitle({ no, title, desc }: { no?: string; title: string; desc: string }) {
  return (
    <header>
      {no && (
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cvr-gold-ink">
          Dịch vụ {no}
        </p>
      )}
      <h2 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-tight text-cvr-ink sm:text-[26px]">{title}</h2>
      {desc && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cvr-muted">{desc}</p>}
    </header>
  );
}

// Thẻ gói dịch vụ 2 cột: nội dung + bảng giá (khung Homedy, chất liệu Apple)
function PkgCard({
  tierId,
  name,
  benefits,
  displays,
  media,
  prices,
  pricesThue,
  cta,
}: {
  tierId: TierId;
  name: string;
  benefits?: string[];
  displays: string[];
  media?: React.ReactNode;
  prices: PriceLine[];
  pricesThue?: PriceLine[]; // có = đã công bố bảng Cho thuê riêng, nút gạt đổi giữa hai bộ
  cta: { label: string; href: string };
}) {
  const t = getTier(tierId);
  const isBasic = tierId === "basic";
  return (
    <article className="overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-lux">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_268px]">
        {/* Nội dung */}
        <div className="p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <h3 className="text-[19px] font-semibold tracking-tight" style={{ color: isBasic ? "#1d1d1f" : t.accent }}>
              {name}
            </h3>
            {!isBasic && (
              <span
                className="rounded-full px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: t.accent, color: "#fff" }}
              >
                {t.short}
              </span>
            )}
          </div>

          {benefits && (
            <ul className="mt-3 space-y-1 text-sm leading-relaxed text-cvr-body">
              {benefits.map((b) => <li key={b}>– {b}</li>)}
            </ul>
          )}

          {/* Tin mẫu = tin thật của cấp, hiển thị đúng kiểu theo thiết bị */}
          {media}
          <ul className="mt-6 space-y-2 text-sm leading-relaxed text-cvr-body">
            {displays.map((d) => (
              <li key={d} className="flex gap-2.5"><CheckIcon /> <span>{d}</span></li>
            ))}
          </ul>
        </div>

        {/* Bảng giá — dính đầu khi cuộn để luôn ngang tầm nội dung bên trái */}
        <aside className="flex flex-col border-t border-cvr-line bg-cvr-surface/70 p-5 sm:p-7 md:border-l md:border-t-0">
          <div className="md:sticky md:top-24">
            {pricesThue ? (
              <>
                <div className="group-data-[md=thue]/gia:hidden"><DongGia prices={prices} /></div>
                <div className="hidden group-data-[md=thue]/gia:block"><DongGia prices={pricesThue} /></div>
              </>
            ) : (
              <DongGia prices={prices} />
            )}
            <Link
              href={cta.href}
              className="mt-5 block rounded-full bg-cvr-ink py-3 text-center text-sm font-semibold text-white transition hover:bg-cvr-ink/90 active:scale-[0.99]"
            >
              {cta.label}
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}

// Các dòng "số ngày → giá" trong cột giá của một thẻ gói.
function DongGia({ prices }: { prices: PriceLine[] }) {
  return (
    <>
      {prices.map((pr, i) => (
        <div key={pr.label} className={`py-3.5 ${i > 0 ? "border-t border-cvr-line/70" : "pt-0"}`}>
          <p className="text-[13px] text-cvr-muted">{pr.label}</p>
          <p className="mt-0.5">
            {pr.original && (
              <span className="mr-2 text-[13px] text-cvr-faint line-through">{pr.original}</span>
            )}
            <span className="text-[20px] font-semibold tracking-tight text-cvr-ink">{pr.price}</span>
          </p>
          {pr.perDay && <p className="mt-0.5 text-[13px] tabular-nums text-cvr-muted">{pr.perDay}</p>}
        </div>
      ))}
    </>
  );
}

// Thẻ QUYỀN LỢI một loại tin — chỉ chữ (không ảnh, không giá; giá ở bảng phía trên).
function QuyenLoiCap({ tierId, benefits, displays, mau }: { tierId: TierId; benefits: string[]; displays: string[]; mau: React.ReactNode }) {
  const t = getTier(tierId);
  return (
    <article className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux sm:p-6" style={{ borderTop: `3px solid ${t.accent}` }}>
      <h4 className="text-[17px] font-semibold tracking-tight" style={{ color: tierId === "basic" ? "#1d1d1f" : t.accent }}>{t.name}</h4>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-cvr-body">
        {[...benefits, ...displays].map((d) => (
          <li key={d} className="flex gap-2"><CheckIcon /> <span>{d}</span></li>
        ))}
      </ul>
      {/* Tin mẫu: tin thật của hạng này, hiển thị đúng như trên sàn */}
      {mau}
    </article>
  );
}

// ── THẺ TIN MINH HOẠ TỪNG CẤP ────────────────────────────────────────────────
// Tin có HAI kiểu bố trí, thẻ mẫu tự đổi theo thiết bị đang xem — mỗi lúc MỘT thẻ,
// KHÔNG hiện 2 thẻ cùng lúc (sẽ lặp lại đúng một tấm ảnh):
//   · Từ sm trở lên (PC/tablet) → ảnh BÊN TRÁI, nội dung BÊN PHẢI (layout="list")
//   · Dưới sm (điện thoại)      → ảnh Ở TRÊN,   nội dung Ở DƯỚI   (variant="tier")
// Cả hai đều là component thật đang chạy trên sàn, dữ liệu là TIN THẬT mới nhất
// của cấp đó → đăng/sửa tin trong admin là thẻ này tự thay theo.
function TierSample({ listing }: { listing: Listing }) {
  // VÍ DỤ MINH HOẠ: khung y hệt thẻ tin trên sàn nhưng KHÔNG bấm được (không phải tin thật).
  return (
    <div className="relative mt-5">
      <span className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-cvr-body shadow">Ví dụ minh hoạ</span>
      <div className="pointer-events-none select-none" aria-hidden>
        {/* PC/tablet: ảnh trái – nội dung phải · Điện thoại: ảnh trên – nội dung dưới */}
        <div className="hidden sm:block"><PropertyCard item={listing} layout="list" /></div>
        <div className="max-w-[320px] sm:hidden"><PropertyCard item={listing} variant="tier" /></div>
      </div>
    </div>
  );
}

// Dự án mẫu từng cấp — DỰ ÁN THẬT, bố trí y hệt thẻ tin:
// PC = ảnh trái / nội dung phải · điện thoại = ảnh trên / nội dung dưới.
function ProjectTierSample({ project }: { project: Project | null }) {
  // Chưa có dự án nào ở cấp này → VẪN dựng khung, báo trống (đừng để trắng trơn).
  if (!project) {
    return (
      <div className="mt-6 max-w-[420px] rounded-2xl border border-dashed border-cvr-line bg-cvr-surface/60 px-4 py-8 text-center">
        <p className="text-sm text-cvr-muted">
          Chưa có dự án ở cấp này — vào <strong>Admin › Dự án</strong> chọn “Cấp dự án (CVR-PJ)” là hiện ngay.
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="mt-6 hidden sm:block">
        <ProjectRow p={project} />
      </div>
      <div className="mt-6 max-w-[320px] sm:hidden">
        <ProjectCard p={project} />
      </div>
    </>
  );
}



function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-gold-ink" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
