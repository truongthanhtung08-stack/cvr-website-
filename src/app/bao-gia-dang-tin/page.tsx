import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import PricingSidebar, { type SidebarGroup } from "@/components/PricingSidebar";
import TinHienThiMau from "@/components/TinHienThiMau";
import NhanGoi from "@/components/NhanGoi";
import BangDacDiem from "@/components/BangDacDiem";
import KhungCuonNgang from "@/components/KhungCuonNgang";
import { ProjectCard, ProjectRow } from "@/components/ProjectSlider";
import { getProjects } from "@/lib/contentDb";
import type { Project } from "@/lib/data";
import { getTier, type TierId } from "@/lib/packages";
import { getBilling, getQuyDinhGia } from "@/lib/siteContent";
import { bangTheoMucDich, bangUp, goiPr, ghiChuPr, bangBanner, giaTra, priceLinesDuAn } from "@/lib/billing";
import BangGiaGoiTin from "@/components/BangGiaGoiTin";
import BangGiaDayTin from "@/components/BangGiaDayTin";
import NutMucDichGia from "@/components/NutMucDichGia";
import TheGoiBaoGia, { DAT_THE_TRUOC } from "@/components/TheGoiBaoGia";
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
// CÂY MỤC GIỐNG HỆT menu Báo giá trên đầu web (Header.tsx) — chủ dự án 22/10/2026 tối: "menu tổng Báo giá, trong có các mục
// con — bấm vào đâu ra phần ấy, bấm vào tổng ra tổng". Mỗi gói: tên gói (bấm ra cả gói) → Bảng giá · Đặc điểm · Quy định.
// Bảng nào admin duyệt thêm (hội viên, dự án, PR, banner) thì tự có mục.
const nhomDichVu = (coHoiVien: boolean, da: Set<string> = new Set()): SidebarGroup[] => [
  {
    title: "Gói đăng tin",
    href: "#bang-gia-tin",
    items: [
      { label: "Bảng giá", href: "#gia-goi-tin" },
      { label: "Mẫu tin hiển thị", href: "#minh-hoa" },
      { label: "Đặc điểm chi tiết", href: "#dac-diem" },
      { label: "Quy định", href: "/quy-dinh#quy-dinh-goi-tin" },
    ],
  },
  {
    title: "Gói đẩy tin",
    href: "#goi-day-tin",
    items: [
      { label: "Bảng giá", href: "#gia-day-tin" },
      { label: "Quy định", href: "/quy-dinh#quy-dinh-day-tin" },
    ],
  },
  ...(coHoiVien ? [{ title: "Gói hội viên", href: "#goi-hoi-vien", items: [] }] : []),
  ...(da.has("du-an") ? [{ title: "Gói dự án", href: "#goi-du-an", items: [] }] : []),
  ...(da.has("pr") ? [{ title: "Bài PR", href: "#goi-pr", items: [] }] : []),
  ...(da.has("banner") ? [{ title: "Banner", href: "#goi-banner", items: [] }] : []),
];


// ═══════════════ VÍ DỤ MINH HOẠ TỪNG LOẠI TIN ═══════════════
// Chủ dự án chốt 01/10/2026: CHỈ LẤY ẢNH THẬT (ảnh chuẩn nhất của tin thật đang ở đúng
// hạng), KHÔNG dùng tiêu đề / thông tin của tin thật — tiêu đề là VÍ DỤ chuẩn SEO
// (loại giao dịch · loại nhà · đặc điểm · đường/khu · phường · tỉnh). Ảnh lưu CỐ ĐỊNH ở đây
// nên tin VIP hết hạn thì minh hoạ vẫn còn (ảnh trong kho không bị xoá khi tin hết hạn).
// Ảnh chọn bằng mắt 01/10: bỏ ảnh bìa là băng rôn khuyến mãi / ảnh cận đồ trang trí.
// ═══════════════ TRANG ═══════════════
// Thẻ tin minh hoạ từng cấp = TIN THẬT mới nhất của cấp đó trong Supabase
// (không còn tin/ảnh mẫu cứng). Đăng hoặc sửa tin trong admin → trang này tự đổi theo.
export default async function BaoGiaPage() {
  const [allProjects, billing, quyDinh] = await Promise.all([getProjects(), getBilling(), getQuyDinhGia()]);
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
  // ĐẨY TIN · PR · BANNER: lấy đúng bản chủ dự án đặt ở /admin/gia-khuyen-mai.
  // Chưa lưu gì thì hàm tự trả mức chuẩn — trang không bao giờ trống.
  const upRows = bangUp(bangBan);
  // CHO THUÊ có bảng riêng CHỈ KHI đã công bố giá theo mục đích — trước đó giá
  // bán và thuê là một, hiện nút gạt Bán | Cho thuê chỉ thừa.
  const coThue = !!billing.congBo;
  const bangThue = bangTheoMucDich(billing, "thue");
  const upRowsThue = bangUp(bangThue);
  // Dự án · PR · Banner: chỉ hiện bảng ĐÃ DUYỆT RIÊNG (chủ dự án 10/10/2026)
  const daDuyet = new Set(billing.mucDaDuyet ?? []);
  const prPkgs = goiPr(billing);
  const prNotes = ghiChuPr(billing);
  const bannerTables = bangBanner(billing);
  // GÓI HỘI VIÊN — chỉ hiện khi admin đã bấm "Công bố gói hội viên".
  const goiHoiVien = billing.hoiVien ?? [];
  const coHv = goiHoiVien.length > 0;
  const so = (n: number) => String(n + (coHv ? 1 : 0)).padStart(2, "0"); // mục sau Gói hội viên dồn số
  // Dự án mẫu từng cấp CVR-PJ — dự án thật của cấp đó
  const projectOfTier = (id: TierId): Project | null =>
    allProjects.find((x) => (x.tier ?? "basic") === id) ?? null;


  // QUY ĐỊNH MỘT CHỖ = trang Quy định đăng tin (/quy-dinh — đọc admin). Ở đây chỉ chú thích (*) (**) (***) giải nghĩa dòng
  // trong bảng đặc điểm → ngay dưới bảng.
  const chuThich = quyDinh.quyDinhChung.filter((s) => /^\(\*+\)/.test(s.trim()));

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        {/* CẤU TRÚC = CÂY MENU BÁO GIÁ (chủ dự án 22/10/2026 tối): Báo giá → Gói tin đăng CVR (Bảng giá · Đặc điểm · Quy định) →
            Gói đẩy tin (Bảng giá · Quy định). Bấm mục nào trên menu đầu web / cột menu trái là tới đúng phần đó; bấm "Báo giá"
            ra đầu trang. Cuối trang: Nhận báo giá. */}
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
          {/* Điện thoại: thanh tiêu đề trên cùng đã ghi "Báo giá dịch vụ" → tiêu đề này chỉ để Google đọc (không hiện lặp); máy tính hiện */}
          <h1 className="sr-only lg:not-sr-only lg:text-[34px] lg:font-semibold lg:leading-tight lg:tracking-tight lg:text-cvr-ink">Báo giá dịch vụ</h1>
          <div className="grid grid-cols-1 gap-6 lg:mt-8 lg:grid-cols-[220px_1fr] lg:gap-12">
            <PricingSidebar groups={nhomDichVu(coHv, daDuyet)} />

            <div className="min-w-0 space-y-14 sm:space-y-16">
              {/* Nút gạt Tin bán | Tin cho thuê (ngay cạnh chữ "Bảng giá" của từng gói) đổi `data-md` của khung này → mọi con số
                  trong hai bảng giá đổi theo, hai nút luôn khớp nhau (NutMucDichGia) */}
              {/* data-goi: thẻ gói đang chọn (TheGoiBaoGia) · data-md: Tin bán | Tin cho thuê (NutMucDichGia) */}
              <div id="vung-bang-gia" data-md="ban" data-goi="tin" className="group/gia group/goi" suppressHydrationWarning>
                <script dangerouslySetInnerHTML={{ __html: DAT_THE_TRUOC }} />
                <TheGoiBaoGia />

                {/* ═══ GÓI TIN ĐĂNG CVR ═══ */}
                {/* ═══ THẺ "GÓI ĐĂNG TIN" — tên gói đã ở thẻ chọn phía trên nên tiêu đề chỉ để Google đọc ═══ */}
                <section id="bang-gia-tin" className="mt-2 scroll-mt-4 group-data-[goi=day]/goi:hidden">
                  <h2 className="sr-only">Gói đăng tin</h2>

                  <PhanCon id="gia-goi-tin" tieuDe="Bảng giá" dau phai={coThue && <NutMucDichGia />}>
                    <div className={coThue ? "group-data-[md=thue]/gia:hidden" : ""}><BangGiaGoiTin plans={bangBan.plans} kieuBaoGia /></div>
                    {coThue && <div className="hidden group-data-[md=thue]/gia:block"><BangGiaGoiTin plans={bangThue.plans} kieuBaoGia /></div>}
                  </PhanCon>

                  {quyDinh.bangQuyenLoi.length > 0 && (
                    <PhanCon id="minh-hoa" tieuDe="Mẫu tin hiển thị">
                      {/* THẺ MẪU TỪNG CẤP ngay dưới bảng giá — tiêu đề "Tin hiển thị" (chủ dự án 22/10/2026 tối: "câu hình minh hoạ = Tin
                          hiển thị"), KHÔNG tên gói phía trên thẻ ("tên gói và dấu VIP như thế là trùng lặp" — huy hiệu cấp nằm sẵn trên
                          ảnh thẻ). Thẻ tin thật của web, vuốt qua lại; nút ‹ › nằm trên dải. */}
                      <TinHienThiMau />
                    </PhanCon>
                  )}

                  {/* Khối 2: ĐẶC ĐIỂM CHI TIẾT = bảng so sánh (dùng chung với hộp so sánh ở bước chọn gói khi đăng tin) + chú thích (*).
                      Chữ quyền lợi từng gói (trước nằm dưới hình) trùng bảng này nên bỏ — câu nào bảng chưa có thì thêm dòng trong admin. */}
                  {quyDinh.bangQuyenLoi.length > 0 && (
                    <PhanCon id="dac-diem" tieuDe="Đặc điểm chi tiết">
                      <KhungCuonNgang>
                        <BangDacDiem dong={quyDinh.bangQuyenLoi} />
                      </KhungCuonNgang>
                      {chuThich.length > 0 && <DanhSach ds={chuThich} nho className="mt-3" />}
                    </PhanCon>
                  )}

                  {/* Quy định: chỉ tên, bấm vào tới phần của gói này trong trang Quy định đăng tin — quy định một chỗ */}
                  <LinkQuyDinh href="/quy-dinh#quy-dinh-goi-tin" />

                  <a href="/dang-tin" className={`mt-8 ${NUT_CHINH}`}>
                    Đăng tin
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </a>
                </section>

                {/* ═══ GÓI ĐẨY TIN — cùng bố cục ═══ */}
                {/* ═══ THẺ "GÓI ĐẨY TIN" — cùng bố cục ═══ */}
                <section id="goi-day-tin" className="mt-2 hidden scroll-mt-4 group-data-[goi=day]/goi:block">
                  <h2 className="sr-only">Gói đẩy tin</h2>
                  {/* Câu nói đúng chức năng đẩy tin (chủ dự án 22/10/2026 tối: "sửa cả nội dung cho đúng chức năng") — cơ chế: tin đang hiển thị
                      lên đầu danh sách cùng loại tin, thẻ ghi "Làm mới …" theo giờ đẩy, ngày đăng + thời hạn giữ nguyên (docs/BAN-GIAO-CO-CHE-UP-DAY-TIN.md) */}
                  <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-cvr-muted">Đưa tin lên đầu danh sách cùng loại tin, giữ nguyên ngày đăng và thời hạn.</p>

                  <PhanCon id="gia-day-tin" tieuDe="Bảng giá" dau phai={coThue && <NutMucDichGia />}>
                    <div className={coThue ? "group-data-[md=thue]/gia:hidden" : ""}><BangGiaDayTin rows={upRows} trangBaoGia /></div>
                    {coThue && <div className="hidden group-data-[md=thue]/gia:block"><BangGiaDayTin rows={upRowsThue} trangBaoGia /></div>}
                  </PhanCon>

                  <LinkQuyDinh href="/quy-dinh#quy-dinh-day-tin" />

                  {/* Khách muốn đẩy tin vào đâu (chủ dự án 09/10/2026): Tin đăng của tôi → nút Đẩy tin ở từng tin */}
                  <a href="/tai-khoan/tin-dang" className={`mt-8 ${NUT_CHINH}`}>
                    Đẩy tin của tôi
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </a>
                </section>
              </div>

              {/* 4. GÓI HỘI VIÊN — mua theo tháng, voucher mỗi 30 ngày (cơ chế Batdongsan) */}
              {coHv && (
                <section id="goi-hoi-vien" className="scroll-mt-4">
                  <SectionTitle no="03" title="Gói Hội viên" desc="Dành cho môi giới đăng tin thường xuyên." />
                  <div className="mt-6">
                    <GoiHoiVienCards goi={goiHoiVien} />
                    <DieuKienHoiVien dong={quyDinh.dieuKienHoiVien} />
                  </div>
                </section>
              )}

              {/* 4. GÓI DỰ ÁN */}
{daDuyet.has("du-an") && (
              <section id="goi-du-an" className="scroll-mt-4">
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
              )}

              {/* 5. GÓI BÀI PR */}
{daDuyet.has("pr") && (
              <section id="goi-pr" className="scroll-mt-4">
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
                            className={`mt-4 flex w-full ${NUT_CHINH}`}
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
              )}

              {/* 6. GÓI BANNER */}
{daDuyet.has("banner") && (
              <section id="goi-banner" className="scroll-mt-4">
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
              )}

              {/* NHẬN BÁO GIÁ */}
              <section id="lien-he" className="scroll-mt-4">
                <SectionTitle title="Nhận báo giá và tư vấn" desc="Để lại thông tin, chuyên viên Coastal Land liên hệ trong 5 phút." />
                <div className="mt-5 max-w-2xl">
                  <LeadForm
                    cta="Nhận báo giá ngay"
                    topics={["Gói đăng tin", "Gói đẩy tin", "Gói Dự án", "Gói bài PR", "Gói Banner", "Khác"]}
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

// MỘT KIỂU CHO CẢ TRANG (chủ dự án 22/10/2026): tiêu đề mục (h2) · tiêu đề khối con (h3) · nút hành động chính.
// Bỏ dòng "Dịch vụ 01/02" trên tiêu đề mục (đánh số không giúp khách hiểu, lại lệch khi bảng nào chưa duyệt).
function SectionTitle({ title, desc }: { no?: string; title: string; desc: string }) {
  return (
    <header>
      <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-cvr-ink sm:text-[26px]">{title}</h2>
      {desc && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cvr-muted">{desc}</p>}
    </header>
  );
}

// Danh sách quy định / chú thích — một kiểu cho cả trang
function DanhSach({ ds, nho, className = "" }: { ds: string[]; nho?: boolean; className?: string }) {
  return (
    <ul className={`space-y-1.5 leading-relaxed ${nho ? "text-[12.5px] text-cvr-muted" : "text-sm text-cvr-body"} ${className}`}>
      {ds.map((r) => <li key={r} className="flex gap-2"><span className="text-cvr-muted" aria-hidden>·</span><span>{r}</span></li>)}
    </ul>
  );
}

// MỘT PHẦN CON trong gói (Bảng giá · Đặc điểm · Quy định) — đúng mục con của menu Báo giá: tiêu đề nhỏ (+ nút bên phải nếu có)
// + nội dung, cách đều nhau. `id` = neo để menu bấm tới.
function PhanCon({ tieuDe, id, dau, phai, children }: { tieuDe: string; id?: string; dau?: boolean; phai?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div id={id} className={`${dau ? "mt-6" : "mt-10"} ${id ? "scroll-mt-4" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TieuDeKhoi>{tieuDe}</TieuDeKhoi>
        {phai}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

// "Quy định" trong mỗi gói — CHỈ TÊN, bấm vào tới phần quy định của gói đó trong trang Quy định đăng tin (footer). Quy định
// thống nhất MỘT chỗ (chủ dự án 22/10/2026 tối: "chỉ đưa vào tên, bấm vào ra menu này — thống nhất một cái"). Cùng cỡ chữ với
// tiêu đề Bảng giá · Đặc điểm để ba mục con của gói ngang hàng nhau.
function LinkQuyDinh({ href }: { href: string }) {
  return (
    <Link href={href} className={`mt-10 w-fit hover:underline ${KIEU_MUC_CHINH}`}>
      Quy định
      <svg className="h-4 w-4 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
    </Link>
  );
}

// Mục chính trong gói (Bảng giá · Tin hiển thị · Đặc điểm chi tiết · Quy định): chữ to đậm + vạch vàng thương hiệu bên trái — nổi
// khác hẳn chữ thường (chủ dự án 22/10/2026 tối: "các mục chính … cho khác").
const KIEU_MUC_CHINH = "flex items-center gap-2.5 text-[18px] font-bold tracking-tight text-cvr-ink before:h-[18px] before:w-[3px] before:rounded-full before:bg-cvr-gold before:content-['']";
function TieuDeKhoi({ children }: { children: React.ReactNode }) {
  return <h3 className={KIEU_MUC_CHINH}>{children}</h3>;
}

// Nút đen gọn hơn (chủ dự án 23/10/2026: "các nút CTA màu đen hơi to — Đẩy tin, Đăng tin, Nhận báo giá")
const NUT_CHINH = "btn-dangtin inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-[13.5px] font-semibold text-white transition active:scale-[0.99]";

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
              className={`mt-5 flex w-full ${NUT_CHINH}`}
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
