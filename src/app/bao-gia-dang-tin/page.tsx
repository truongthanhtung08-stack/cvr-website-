import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import PricingSidebar, { type SidebarGroup } from "@/components/PricingSidebar";
import PropertyCard from "@/components/PropertyCard";
import { ProjectCard, ProjectRow } from "@/components/ProjectSlider";
import { getTier, tierFromBadge, type TierId, utilityTools } from "@/lib/packages";
import { getListings } from "@/lib/listingsDb";
import { getProjects } from "@/lib/contentDb";
import { getBilling } from "@/lib/siteContent";
import { priceLinesFor } from "@/lib/billing";
import type { Listing, Project } from "@/lib/data";

export const metadata: Metadata = {
  title: "Báo giá dịch vụ và truyền thông | Coastal Land",
  description:
    "Bảng giá dịch vụ Coastal Land: gói đăng tin VIP (CVR Diamond, Gold, Silver), tin đăng lẻ, đẩy tin, gói dự án, bài PR và banner quảng cáo.",
};

// ═══════════════ DỮ LIỆU BẢNG GIÁ ═══════════════
// Nguồn: file "Gia đăng tin + QC" (D:\Coastal Land\Bảng giá truyền thông).
// Các gói Đẩy tin / Dự án / PR / Banner: đối chuẩn thị trường, đổi giá chỉ sửa tại đây.

type PriceLine = { label: string; original?: string; price: string };

const vipPkgs = [
  {
    tierId: "diamond" as TierId,
    benefits: [
      "Tăng lượt xem gấp 20 lần tin thường.",
      "Tiếp cận nhiều khách hàng nhất.",
      "Xuất hiện nhiều trên các vị trí nổi bật của Website.",
    ],
    displays: [
      "Xuất hiện trên Trang chủ.",
      "Đứng trên CVR Gold.",
      "Tiêu đề màu đỏ + Bôi đậm + Viết hoa.",
      "Xuất hiện trong box “Bất động sản nổi bật”.",
      "Chèn 1 link bất kỳ dưới tin đăng.",
    ],
    prices: [
      { label: "Giá 1 tuần", price: "980.000đ" },
      { label: "Giá 2 tuần (−15%)", original: "1.960.000đ", price: "1.700.000đ" },
      { label: "Giá 4 tuần (−30%)", original: "3.920.000đ", price: "2.800.000đ" },
    ] as PriceLine[],
  },
  {
    tierId: "gold" as TierId,
    benefits: [
      "Tăng lượt xem gấp 10 lần tin thường.",
      "Tiếp cận nhiều khách hàng.",
      "Xuất hiện nhiều trên các vị trí nổi bật của Website.",
    ],
    displays: [
      "Đứng trên CVR Silver.",
      "Tiêu đề màu vàng + Bôi đậm + Viết hoa.",
      "Xuất hiện trong box “Bất động sản nổi bật”.",
    ],
    prices: [
      { label: "Giá 1 tuần", price: "490.000đ" },
      { label: "Giá 2 tuần (−20%)", original: "980.000đ", price: "800.000đ" },
      { label: "Giá 4 tuần (−35%)", original: "1.960.000đ", price: "1.300.000đ" },
    ] as PriceLine[],
  },
  {
    tierId: "silver" as TierId,
    benefits: ["Tăng lượt xem gấp 5 lần tin thường.", "Tiếp cận khách hàng tốt."],
    displays: ["Đứng trên CVR Basic.", "Tiêu đề màu xanh + Bôi đậm."],
    prices: [
      { label: "Giá 1 tuần", price: "170.000đ" },
      { label: "Giá 2 tuần (−15%)", original: "340.000đ", price: "300.000đ" },
      { label: "Giá 4 tuần (−30%)", original: "680.000đ", price: "500.000đ" },
    ] as PriceLine[],
  },
];

const basicPkg = {
  benefits: ["Tiếp cận khách hàng tốt.", "Chi phí thấp nhất."],
  displays: ["Nằm bên dưới các tin cao cấp.", "Tiêu đề hiển thị mặc định."],
  prices: [
    { label: "Giá 1 tuần", price: "15.000đ" },
    { label: "Giá 2 tuần", price: "20.000đ" },
    { label: "Giá 4 tuần", price: "30.000đ" },
  ] as PriceLine[],
};

const upRows: { label: string; values: { original?: string; price: string }[] }[] = [
  { label: "Up ngay", values: [{ price: "90.000đ" }, { price: "46.000đ" }, { price: "17.000đ" }, { price: "5.000đ" }] },
  { label: "Up 3 lần (−20%)", values: [{ original: "270.000đ", price: "216.000đ" }, { original: "138.000đ", price: "110.400đ" }, { original: "51.000đ", price: "40.800đ" }, { original: "15.000đ", price: "12.000đ" }] },
  { label: "Up 7 lần (−30%)", values: [{ original: "630.000đ", price: "441.000đ" }, { original: "322.000đ", price: "225.400đ" }, { original: "119.000đ", price: "83.300đ" }, { original: "35.000đ", price: "24.500đ" }] },
  { label: "Up 13 lần (−40%)", values: [{ original: "1.170.000đ", price: "702.000đ" }, { original: "598.000đ", price: "358.800đ" }, { original: "221.000đ", price: "132.600đ" }, { original: "65.000đ", price: "39.000đ" }] },
  { label: "Up 27 lần (−50%)", values: [{ original: "2.430.000đ", price: "1.215.000đ" }, { original: "1.242.000đ", price: "621.000đ" }, { original: "459.000đ", price: "229.500đ" }, { original: "135.000đ", price: "67.500đ" }] },
];

const pjPkgs = [
  {
    tierId: "diamond" as TierId,
    name: "CVR-PJ Diamond",
    img: "sun-cosmo-residence.jpg",
    sample: { title: "Sun Cosmo Residence", address: "Hòa Hải, Ngũ Hành Sơn, Đà Nẵng" },
    displays: ["Xuất hiện trên Trang chủ.", "Xuất hiện trên CVR-PJ Gold.", "Xuất hiện trên CVR Diamond.", "Icon màu đỏ nổi bật."],
    prices: [
      { label: "Giá 1 tuần", price: "6.800.000đ" },
      { label: "Giá 2 tuần (−6%)", original: "13.600.000đ", price: "12.800.000đ" },
    ] as PriceLine[],
  },
  {
    tierId: "gold" as TierId,
    name: "CVR-PJ Gold",
    img: "the-filmore-da-nang.jpg",
    sample: { title: "The Filmore Da Nang", address: "Hải Châu, Đà Nẵng" },
    displays: ["Xuất hiện trên CVR-PJ Silver.", "Xuất hiện trên CVR Gold.", "Icon màu vàng nổi bật."],
    prices: [
      { label: "Giá 1 tuần", price: "3.500.000đ" },
      { label: "Giá 2 tuần (−6%)", original: "7.000.000đ", price: "6.600.000đ" },
    ] as PriceLine[],
  },
  {
    tierId: "silver" as TierId,
    name: "CVR-PJ Silver",
    img: "khu-do-thi-fpt-city.jpg",
    sample: { title: "Khu đô thị FPT City", address: "Ngũ Hành Sơn, Đà Nẵng" },
    displays: ["Xuất hiện trên CVR-PJ Basic.", "Xuất hiện trên CVR Silver.", "Icon màu xanh nổi bật."],
    prices: [
      { label: "Giá 1 tuần", price: "2.000.000đ" },
      { label: "Giá 2 tuần (−5%)", original: "4.000.000đ", price: "3.800.000đ" },
    ] as PriceLine[],
  },
];

const prPkgs = [
  { tierId: "diamond" as TierId, name: "CVR-PR Diamond", price: "8.900.000đ", displays: ["Xuất hiện trên Trang chủ: box Tin tức.", "Xuất hiện trên trang chuyên mục Tin tức.", "Chia sẻ trên Fanpage Facebook của Coastal Land."] },
  { tierId: "gold" as TierId, name: "CVR-PR Gold", price: "5.900.000đ", displays: ["Xuất hiện trên Trang chủ: box Tin tức.", "Xuất hiện trên trang chuyên mục Tin tức."] },
  { tierId: "silver" as TierId, name: "CVR-PR Silver", price: "2.900.000đ", displays: ["Xuất hiện trên trang chuyên mục Tin tức."] },
];

const prNotes = [
  "Một bài PR không quá 5 ảnh minh hoạ.",
  "Bài PR gửi trước 2 ngày.",
  "Bài PR xuất hiện ở Trang chủ trong 1 ngày, xuất hiện trên trang chuyên mục Tin tức vĩnh viễn.",
];

const bannerTables = [
  {
    title: "Banner Web",
    sizeLabel: "Kích thước (px)",
    rows: [
      { name: "CVR-BANNER Homepage 1", size: "370 × 300", price: "7.500.000đ", pos: "Trang chủ", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Homepage 2", size: "370 × 312", price: "5.000.000đ", pos: "Trang chủ", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Homepage 3", size: "370 × 430", price: "6.000.000đ", pos: "Trang chủ", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Listing 1", size: "370 × 600", price: "7.000.000đ", pos: "Trang danh sách Tin đăng / Dự án", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Listing 2", size: "370 × 320", price: "3.000.000đ", pos: "Trang danh sách Tin đăng / Dự án", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Listing 3", size: "370 × 430", price: "5.000.000đ", pos: "Trang danh sách Tin đăng / Dự án", note: "Chia sẻ 3" },
    ],
  },
  {
    title: "Banner Mobile Web",
    sizeLabel: "Kích thước (px)",
    rows: [
      { name: "CVR-BANNER Mobile Homepage", size: "345 × 200", price: "5.000.000đ", pos: "Trang chủ (mobile)", note: "Chia sẻ 3" },
      { name: "CVR-BANNER Mobile Listing", size: "345 × 150", price: "3.000.000đ", pos: "Trang chủ + Tin đăng (mobile)", note: "Bao toàn tỉnh lẻ: 1.500.000đ" },
    ],
  },
  {
    title: "Banner Web + Mobile Web (Combo)",
    sizeLabel: "Sản phẩm",
    rows: [
      { name: "CVR-BANNER Combo Homepage", size: "Banner Homepage 1 + Mobile Homepage", price: "10.000.000đ", pos: "Web + Mobile", note: "Chiết khấu 20%" },
      { name: "CVR-BANNER Combo Listing", size: "Banner Listing 1 + Mobile Listing", price: "8.900.000đ", pos: "Web + Mobile", note: "Chiết khấu 15%" },
    ],
  },
];

const featureRows: { label: string; values: [string, string, string, string] }[] = [
  { label: "Thứ hạng tin đăng", values: ["1", "2", "3", "4"] },
  { label: "Kích thước tin đăng", values: ["Rất lớn", "Lớn", "Trung bình", "Nhỏ nhất"] },
  { label: "Hiển thị mô tả tin đăng", values: ["✓", "✓", "✓", "✓"] },
  { label: "Hiển thị thông tin người bán", values: ["✓", "✓", "✓", "✓"] },
  { label: "Hiển thị nút gọi điện", values: ["✓", "✓", "✓", "✓"] },
  { label: "Chèn link mô tả tin đăng", values: ["✓", "—", "—", "—"] },
  { label: "Ưu tiên hiển thị sớm (*)", values: ["✓", "✓", "✓", "—"] },
  { label: "Không hiển thị quảng cáo (**)", values: ["✓", "✓", "—", "—"] },
  { label: "Nhân đôi hiển thị (***)", values: ["✓", "—", "—", "—"] },
];

const rules = [
  "(*) Ưu tiên hiển thị sớm: các tin VIP (CVR Diamond, CVR Gold và CVR Silver) được ưu tiên hiển thị và kiểm duyệt trước.",
  "(**) Không hiển thị quảng cáo: ở trang chi tiết tin đăng, trên cả giao diện desktop và mobile sẽ không xuất hiện banner quảng cáo — người xem tập trung tối đa vào nội dung tin.",
  "(***) Nhân đôi hiển thị: chức năng đặc biệt của CVR Diamond — khi tạo tin, khách hàng được tặng kèm một Tin thường hiển thị đồng thời ở trang kết quả tìm kiếm; khi Đẩy tin CVR Diamond, tin thường đi kèm cũng được đẩy miễn phí.",
  "Việc hiển thị tin đăng trên Sàn dựa trên các tiêu chí gồm nhưng không giới hạn ở: loại gói dịch vụ (tin thường, CVR Silver, CVR Gold, CVR Diamond), thời điểm đăng tin và các tiêu chí kỹ thuật khác theo quy định của Sàn tại từng thời điểm.",
];

// Menu sidebar — 2 PHẦN. Phần "Danh sách dịch vụ" KHÔNG còn mục Công cụ tiện ích;
// Công cụ tiện ích tách thành phần riêng nằm PHÍA SAU.
const serviceGroups: SidebarGroup[] = [
  {
    title: "Danh sách dịch vụ",
    items: [
      { label: "1. Gói đăng tin VIP", href: "#goi-vip" },
      { label: "2. Gói tin đăng lẻ", href: "#goi-le" },
      { label: "3. Gói Đẩy tin", href: "#goi-day-tin" },
      { label: "4. Gói Dự án", href: "#goi-du-an" },
      { label: "5. Gói bài PR", href: "#goi-pr" },
      { label: "6. Gói Banner", href: "#goi-banner" },
      { label: "Loại tin & đặc điểm", href: "#dac-diem" },
      { label: "Quy định chung", href: "#quy-dinh" },
      { label: "Nhận báo giá", href: "#lien-he" },
    ],
  },
  {
    title: "Công cụ tiện ích",
    items: [
      { label: "Tất cả công cụ", href: "#cong-cu-tien-ich" },
      ...utilityTools.map((t) => ({ label: t.label, href: `/tien-ich/${t.slug}` })),
    ],
  },
];

const HOTLINE = "0377 985 036";

// ═══════════════ TRANG ═══════════════
// Thẻ tin minh hoạ từng cấp = TIN THẬT mới nhất của cấp đó trong Supabase
// (không còn tin/ảnh mẫu cứng). Đăng hoặc sửa tin trong admin → trang này tự đổi theo.
export default async function BaoGiaPage() {
  const [listings, allProjects, billing] = await Promise.all([getListings(), getProjects(), getBilling()]);
  // GIÁ TIN lấy từ bảng giá admin (/admin/gia-khuyen-mai) — chưa lưu thì dùng giá
  // in sẵn bên dưới. Trước đây giá viết cứng tại trang này nên sửa ở admin không đổi.
  const giaTin = (id: TierId, macDinh: PriceLine[]): PriceLine[] => priceLinesFor(billing, id) ?? macDinh;
  const newestOfTier = (id: TierId): Listing | null =>
    listings.find((l) => tierFromBadge(l.badge) === id) ?? null;
  const samples: Record<TierId, Listing | null> = {
    diamond: newestOfTier("diamond"),
    gold: newestOfTier("gold"),
    silver: newestOfTier("silver"),
    basic: newestOfTier("basic"),
  };
  // Dự án mẫu từng cấp CVR-PJ — dự án thật mới nhất của cấp đó
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
              tiếp cận đúng khách hàng tiềm năng tại Miền Trung.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[248px_1fr] lg:gap-10">
            <PricingSidebar groups={serviceGroups} hotline={HOTLINE} />

            <div className="min-w-0 space-y-12 sm:space-y-14">
              {/* 1. GÓI ĐĂNG TIN VIP */}
              <section id="goi-vip" className="scroll-mt-24">
                <SectionTitle no="01" title="Gói đăng tin VIP" desc="Giải pháp tiếp cận tin đăng hiệu quả tới khách hàng tiềm năng." />
                <div className="mt-6 space-y-6">
                  {vipPkgs.map((p) => (
                    <PkgCard
                      key={p.tierId}
                      tierId={p.tierId}
                      name={getTier(p.tierId).name}
                      benefits={p.benefits}
                      displays={p.displays}
                      media={<TierSample listing={samples[p.tierId]} />}
                      prices={giaTin(p.tierId, p.prices)}
                      cta={{ label: "Đăng tin ngay", href: "/dang-tin" }}
                    />
                  ))}
                </div>
              </section>

              {/* 2. GÓI TIN ĐĂNG LẺ */}
              <section id="goi-le" className="scroll-mt-24">
                <SectionTitle no="02" title="Gói tin đăng lẻ" desc="CVR Basic — đăng tin tiết kiệm, phù hợp nhu cầu cơ bản." />
                <div className="mt-6">
                  <PkgCard
                    tierId="basic"
                    name="CVR Basic"
                    benefits={basicPkg.benefits}
                    displays={basicPkg.displays}
                    media={<TierSample listing={samples.basic} />}
                    prices={giaTin("basic", basicPkg.prices)}
                    cta={{ label: "Đăng tin ngay", href: "/dang-tin" }}
                  />
                </div>
              </section>

              {/* 3. GÓI ĐẨY TIN */}
              <section id="goi-day-tin" className="scroll-mt-24">
                <SectionTitle no="03" title="Gói Đẩy tin" desc="Đẩy tin đăng lên trên đầu của từng loại tin. Gói nhiều lần đẩy tin trong nhiều ngày, mỗi ngày 1 lần." />
                <div className="mt-6 overflow-x-auto rounded-2xl border border-cvr-line bg-white shadow-lux">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="border-b border-cvr-line text-left">
                        <th className="px-6 py-4 font-semibold text-cvr-ink">Gói</th>
                        {(["diamond", "gold", "silver", "basic"] as const).map((id) => {
                          const t = getTier(id);
                          return (
                            <th key={id} className="px-4 py-4 text-center font-semibold tracking-tight" style={{ color: t.accent }}>
                              CVR-UP {t.short}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {upRows.map((r) => (
                        <tr key={r.label} className="border-b border-cvr-line/60 transition-colors last:border-0 hover:bg-cvr-surface/50">
                          <td className="px-6 py-4 font-medium text-cvr-body">{r.label}</td>
                          {r.values.map((v, i) => (
                            <td key={i} className="px-4 py-4 text-center">
                              {v.original && <span className="mr-1.5 text-xs text-cvr-faint line-through">{v.original}</span>}
                              <span className="font-semibold tracking-tight text-cvr-ink">{v.price}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. GÓI DỰ ÁN */}
              <section id="goi-du-an" className="scroll-mt-24">
                <SectionTitle no="04" title="Gói Dự án" desc="Vị trí dự án nổi bật dành cho chủ đầu tư và đại lý phân phối." />
                <div className="mt-6 space-y-6">
                  {pjPkgs.map((p) => (
                    <PkgCard
                      key={p.name}
                      tierId={p.tierId}
                      name={p.name}
                      displays={p.displays}
                      media={<ProjectTierSample project={projectOfTier(p.tierId)} />}
                      prices={p.prices}
                      cta={{ label: "Liên hệ tư vấn", href: "#lien-he" }}
                    />
                  ))}
                </div>
              </section>

              {/* 5. GÓI BÀI PR */}
              <section id="goi-pr" className="scroll-mt-24">
                <SectionTitle no="05" title="Gói bài PR" desc="Bài viết truyền thông trên chuyên mục Tin tức — tăng độ tin cậy và nhận diện thương hiệu." />
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
                          <p className="mt-1 text-[26px] font-semibold tracking-tight text-cvr-ink">{p.price}</p>
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
                <SectionTitle no="06" title="Gói Banner quảng cáo" desc="Vị trí banner nổi bật trên Trang chủ và các trang danh sách — tiếp cận toàn bộ khách truy cập." />
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
                              <td className="px-4 py-4 font-semibold tracking-tight text-cvr-ink">{r.price}</td>
                              <td className="px-4 py-4 text-cvr-body">{r.pos}</td>
                              <td className="px-4 py-4 text-cvr-muted">{r.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                <p className="mt-4 text-[13px] leading-relaxed text-cvr-faint">
                  Chế độ &ldquo;Chia sẻ 3&rdquo; theo traffic · Thời gian quảng cáo dưới 7 ngày tính tròn 1 tuần ·
                  Gửi banner trước 1 ngày (banner đặc biệt: 3 ngày) · Định dạng GIF/JPG/PNG, dung lượng &lt; 150KB.
                </p>
              </section>

              {/* LOẠI TIN & ĐẶC ĐIỂM */}
              <section id="dac-diem" className="scroll-mt-24">
                <SectionTitle title="Loại tin và đặc điểm" desc="So sánh đặc điểm hiển thị giữa các cấp tin." />
                <div className="mt-6 overflow-x-auto rounded-2xl border border-cvr-line bg-white shadow-lux">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-cvr-line text-left">
                        <th className="px-6 py-4 font-semibold text-cvr-ink">Đặc điểm</th>
                        {(["diamond", "gold", "silver", "basic"] as const).map((id) => {
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
                      {featureRows.map((r) => (
                        <tr key={r.label} className="border-b border-cvr-line/60 transition-colors last:border-0 hover:bg-cvr-surface/50">
                          <td className="px-6 py-3.5 text-cvr-body">{r.label}</td>
                          {r.values.map((v, i) => (
                            <td key={i} className={`px-4 py-3.5 text-center ${v === "✓" ? "font-semibold text-cvr-ink" : "text-cvr-muted"}`}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* QUY ĐỊNH CHUNG */}
              <section id="quy-dinh" className="scroll-mt-24">
                <SectionTitle title="Quy định chung" desc="" />
                <div className="mt-6 space-y-3 rounded-2xl bg-cvr-surface p-6">
                  {rules.map((r) => (
                    <p key={r} className="text-sm leading-relaxed text-cvr-body">{r}</p>
                  ))}
                </div>
              </section>

              {/* CÔNG CỤ TIỆN ÍCH — phần 2 của menu, nằm SAU toàn bộ danh sách dịch vụ */}
              <section id="cong-cu-tien-ich" className="scroll-mt-24">
                <SectionTitle title="Công cụ tiện ích" desc="Bộ công cụ miễn phí đi kèm dịch vụ — tra cứu giá, so sánh, tính lãi vay, pháp lý và phong thủy." />
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {utilityTools.map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/tien-ich/${tool.slug}`}
                      className="group flex flex-col rounded-2xl border border-cvr-line bg-white p-5 shadow-lux transition hover:-translate-y-0.5 hover:border-cvr-gold-ink"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cvr-gold-ink">Tiện ích</p>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight text-cvr-ink">{tool.label}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-cvr-muted">{tool.description}</p>
                      <span className="mt-auto pt-4 inline-flex text-sm font-semibold text-cvr-ink transition group-hover:text-cvr-gold-ink">Xem ngay →</span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* LIÊN HỆ */}
              <section id="lien-he" className="scroll-mt-24">
                <SectionTitle title="Nhận báo giá và tư vấn" desc="Để lại thông tin, chuyên viên Coastal Land liên hệ trong 5 phút." />
                <div className="mt-6 max-w-2xl">
                  <LeadForm
                    cta="Nhận báo giá ngay"
                    topics={["Gói đăng tin VIP", "Gói Đẩy tin", "Gói Dự án", "Gói bài PR", "Gói Banner", "Khác"]}
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
  cta,
}: {
  tierId: TierId;
  name: string;
  benefits?: string[];
  displays: string[];
  media: React.ReactNode;
  prices: PriceLine[];
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
            {prices.map((pr, i) => (
              <div key={pr.label} className={`py-3.5 ${i > 0 ? "border-t border-cvr-line/70" : "pt-0"}`}>
                <p className="text-[13px] text-cvr-muted">{pr.label}</p>
                <p className="mt-0.5">
                  {pr.original && (
                    <span className="mr-2 text-[13px] text-cvr-faint line-through">{pr.original}</span>
                  )}
                  <span className="text-[20px] font-semibold tracking-tight text-cvr-ink">{pr.price}</span>
                </p>
              </div>
            ))}
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

// ── THẺ TIN MINH HOẠ TỪNG CẤP ────────────────────────────────────────────────
// Tin có HAI kiểu bố trí, thẻ mẫu tự đổi theo thiết bị đang xem — mỗi lúc MỘT thẻ,
// KHÔNG hiện 2 thẻ cùng lúc (sẽ lặp lại đúng một tấm ảnh):
//   · Từ sm trở lên (PC/tablet) → ảnh BÊN TRÁI, nội dung BÊN PHẢI (layout="list")
//   · Dưới sm (điện thoại)      → ảnh Ở TRÊN,   nội dung Ở DƯỚI   (variant="tier")
// Cả hai đều là component thật đang chạy trên sàn, dữ liệu là TIN THẬT mới nhất
// của cấp đó → đăng/sửa tin trong admin là thẻ này tự thay theo.
function TierSample({ listing }: { listing: Listing | null }) {
  // Chưa có tin ở cấp này → VẪN dựng khung, báo trống (đừng để trắng trơn).
  if (!listing) {
    return (
      <div className="mt-6 max-w-[420px] rounded-2xl border border-dashed border-cvr-line bg-cvr-surface/60 px-4 py-8 text-center">
        <p className="text-sm text-cvr-muted">
          Chưa có tin ở cấp này — có tin được duyệt là thẻ mẫu tự hiện.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* PC/tablet: ảnh trái – nội dung phải */}
      <div className="mt-6 hidden sm:block">
        <PropertyCard item={listing} layout="list" />
      </div>
      {/* Điện thoại: ảnh trên – nội dung dưới */}
      <div className="mt-6 max-w-[320px] sm:hidden">
        <PropertyCard item={listing} variant="tier" />
      </div>
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
