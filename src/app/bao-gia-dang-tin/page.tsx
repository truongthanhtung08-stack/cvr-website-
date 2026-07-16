import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import { getTier } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Báo giá truyền thông | Coastal Land",
  description:
    "Bảng giá dịch vụ truyền thông Coastal Land: gói đăng tin VIP (CVR Diamond, Gold, Silver), tin đăng lẻ, đẩy tin, gói dự án, bài PR và banner quảng cáo.",
};

// ── Dữ liệu bảng giá — theo file "Gia đăng tin + QC" (D:\Coastal Land\Bảng giá truyền thông) ──
type VipPkg = {
  tierId: "diamond" | "gold" | "silver";
  benefits: string[];
  displays: string[];
  sample: { title: string; address: string };
  prices: { label: string; original?: string; price: string }[];
};

const vipPkgs: VipPkg[] = [
  {
    tierId: "diamond",
    benefits: [
      "Tăng lượt xem gấp 20 lần tin thường.",
      "Tiếp cận nhiều khách hàng nhất.",
      "Xuất hiện nhiều trên các vị trí nổi bật của Website.",
    ],
    displays: [
      "Xuất hiện trên Trang chủ.",
      "Đứng trên CVR Gold.",
      "Tiêu đề màu đỏ + Bôi đậm + Viết hoa + icon HOT màu đỏ.",
      "Xuất hiện trong box “Bất động sản nổi bật”.",
      "Chèn 1 link bất kỳ dưới tin đăng.",
    ],
    sample: { title: "VILLA BIỂN 3 TẦNG MẶT TIỀN VÕ NGUYÊN GIÁP, VIEW MỸ KHÊ", address: "Phước Mỹ, Sơn Trà, Đà Nẵng" },
    prices: [
      { label: "Giá 1 tuần", price: "980.000đ" },
      { label: "Giá 2 tuần (−15%)", original: "1.960.000đ", price: "1.700.000đ" },
      { label: "Giá 4 tuần (−30%)", original: "3.920.000đ", price: "2.800.000đ" },
    ],
  },
  {
    tierId: "gold",
    benefits: [
      "Tăng lượt xem gấp 10 lần tin thường.",
      "Tiếp cận nhiều khách hàng.",
      "Xuất hiện nhiều trên các vị trí nổi bật của Website.",
    ],
    displays: [
      "Đứng trên CVR Silver.",
      "Tiêu đề màu vàng + Bôi đậm + Viết hoa + icon HOT màu vàng.",
      "Xuất hiện trong box “Bất động sản nổi bật”.",
    ],
    sample: { title: "CĂN HỘ THE FILMORE 2PN VIEW SÔNG HÀN, BÀN GIAO CAO CẤP", address: "Hải Châu I, Hải Châu, Đà Nẵng" },
    prices: [
      { label: "Giá 1 tuần", price: "490.000đ" },
      { label: "Giá 2 tuần (−20%)", original: "980.000đ", price: "800.000đ" },
      { label: "Giá 4 tuần (−35%)", original: "1.960.000đ", price: "1.300.000đ" },
    ],
  },
  {
    tierId: "silver",
    benefits: ["Tăng lượt xem gấp 5 lần tin thường.", "Tiếp cận khách hàng tốt."],
    displays: ["Đứng trên CVR Basic.", "Tiêu đề màu xanh + Bôi đậm + icon HOT màu xanh."],
    sample: { title: "Đất nền KĐT sinh thái Hòa Xuân, sổ đỏ trao tay", address: "Hòa Xuân, Cẩm Lệ, Đà Nẵng" },
    prices: [
      { label: "Giá 1 tuần", price: "170.000đ" },
      { label: "Giá 2 tuần (−15%)", original: "340.000đ", price: "300.000đ" },
      { label: "Giá 4 tuần (−30%)", original: "680.000đ", price: "500.000đ" },
    ],
  },
];

const basicPkg = {
  benefits: ["Tiếp cận khách hàng tốt.", "Chi phí thấp nhất."],
  displays: ["Nằm bên dưới các tin cao cấp.", "Tiêu đề hiển thị mặc định."],
  sample: { title: "Nhà phố 4 tầng mặt tiền kinh doanh trung tâm Thanh Khê", address: "Tam Thuận, Thanh Khê, Đà Nẵng" },
  prices: [
    { label: "Giá 1 tuần", price: "15.000đ" },
    { label: "Giá 2 tuần", price: "20.000đ" },
    { label: "Giá 4 tuần", price: "30.000đ" },
  ],
};

// Bảng "Loại tin và đặc điểm" (sheet 2)
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

// Menu dịch vụ (sidebar) — cấu trúc tham chiếu Homedy
const serviceMenu = [
  { label: "1. Gói đăng tin VIP", href: "#goi-vip" },
  { label: "2. Gói tin đăng lẻ", href: "#goi-le" },
  { label: "3. Gói Đẩy tin", href: "#goi-day-tin" },
  { label: "4. Gói Dự án", href: "#goi-du-an" },
  { label: "5. Gói bài PR", href: "#goi-pr" },
  { label: "6. Gói Banner", href: "#goi-banner" },
  { label: "Loại tin & đặc điểm", href: "#dac-diem" },
  { label: "Quy định chung", href: "#quy-dinh" },
];

// Các gói chưa công bố giá — mô tả + CTA tư vấn
const otherPkgs = [
  { id: "goi-day-tin", no: "3", name: "Gói Đẩy tin (Up tin)", desc: "Đẩy tin đăng lên đầu danh sách của từng loại tin, làm mới thời gian đăng để luôn nằm trong tầm mắt người mua. Gói nhiều lần đẩy tin trong nhiều ngày, mỗi ngày 1 lần." },
  { id: "goi-du-an", no: "4", name: "Gói Dự án", desc: "Trang dự án riêng cho chủ đầu tư/đại lý — trình bày tổng thể, mặt bằng, tiến độ; xuất hiện ở các vị trí dự án nổi bật trên Website." },
  { id: "goi-pr", no: "5", name: "Gói bài PR", desc: "Bài viết truyền thông trên chuyên mục Tin tức — xuất hiện trên Trang chủ và trang chuyên mục, tăng độ tin cậy & nhận diện thương hiệu." },
  { id: "goi-banner", no: "6", name: "Gói Banner quảng cáo", desc: "Vị trí banner nổi bật trên Trang chủ và các trang danh sách — tiếp cận diện rộng toàn bộ khách truy cập." },
];

const HOTLINE = "0905 22 00 22"; // hotline hiển thị — đổi tại đây khi có số chính thức

export default function BaoGiaPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-cvr-surface">
        {/* Tiêu đề trang */}
        <div className="border-b border-cvr-line bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-semibold tracking-tight text-cvr-ink sm:text-4xl">Báo giá truyền thông</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cvr-muted">
              Bảng giá dịch vụ đăng tin & quảng cáo trên Coastal Land — giải pháp tiếp cận khách hàng
              tiềm năng cho người bán, môi giới và chủ đầu tư tại Miền Trung.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
            {/* ── Sidebar: DANH SÁCH DỊCH VỤ (kiểu Homedy) ── */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-none border border-cvr-line bg-white shadow-lux">
                <p className="border-b border-cvr-line px-4 py-3 text-xs font-bold uppercase tracking-wider text-cvr-ink">
                  Danh sách dịch vụ
                </p>
                <nav className="py-1.5">
                  {serviceMenu.map((m) => (
                    <a
                      key={m.href}
                      href={m.href}
                      className="block px-4 py-2 text-sm font-medium text-cvr-body transition hover:bg-cvr-surface hover:text-cvr-ink"
                    >
                      {m.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Hotline */}
              <div className="mt-4 rounded-none border border-cvr-line bg-cvr-ink p-4 text-center shadow-lux">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Hotline tư vấn</p>
                <a href={`tel:${HOTLINE.replace(/\s/g, "")}`} className="mt-1 block text-xl font-bold text-white">
                  {HOTLINE}
                </a>
                <a
                  href="#lien-he"
                  className="mt-3 block rounded-lg bg-white py-2 text-sm font-semibold text-cvr-ink transition hover:bg-white/90"
                >
                  Nhận tư vấn miễn phí
                </a>
              </div>
            </aside>

            {/* ── Nội dung chính ── */}
            <div className="min-w-0 space-y-10">
              {/* 1. GÓI ĐĂNG TIN VIP */}
              <section id="goi-vip" className="scroll-mt-24">
                <SectionTitle no="1" title="Gói đăng tin VIP" desc="Giải pháp tiếp cận tin đăng hiệu quả tới khách hàng tiềm năng." />
                <div className="mt-4 space-y-5">
                  {vipPkgs.map((p) => {
                    const t = getTier(p.tierId);
                    return (
                      <div key={p.tierId} className="overflow-hidden rounded-none border border-cvr-line bg-white shadow-lux">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
                          {/* Trái: tên + quyền lợi + hiển thị mẫu */}
                          <div className="p-5 sm:p-6">
                            <p className="text-xl font-bold" style={{ color: t.accent }}>{t.name}</p>
                            <ul className="mt-2.5 space-y-1 text-sm text-cvr-body">
                              {p.benefits.map((b) => <li key={b}>– {b}</li>)}
                            </ul>

                            {/* Tin mẫu minh hoạ cách hiển thị */}
                            <div className="mt-4 rounded-lg border border-cvr-line bg-cvr-surface p-3">
                              <p
                                className={`text-sm font-semibold leading-snug ${t.uppercase ? "uppercase" : ""}`}
                                style={{ color: t.titleColor || undefined }}
                              >
                                <FlameIcon color={t.accent} />
                                {p.sample.title}
                              </p>
                              <p className="mt-1 text-xs text-cvr-muted">{p.sample.address}</p>
                            </div>

                            <ul className="mt-4 space-y-1.5 text-sm text-cvr-body">
                              {p.displays.map((d) => (
                                <li key={d} className="flex gap-2">
                                  <CheckIcon /> <span>{d}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Phải: giá + CTA */}
                          <div className="flex flex-col border-t border-cvr-line bg-cvr-surface/60 p-5 sm:p-6 md:border-l md:border-t-0">
                            <div className="flex-1 space-y-3">
                              {p.prices.map((pr) => (
                                <div key={pr.label}>
                                  <p className="text-xs text-cvr-muted">{pr.label}</p>
                                  <p className="text-lg font-bold text-cvr-ink">
                                    {pr.original && (
                                      <span className="mr-2 text-sm font-medium text-cvr-faint line-through">{pr.original}</span>
                                    )}
                                    {pr.price}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <Link
                              href="/dang-tin"
                              className="mt-4 block rounded-lg bg-cvr-ink py-2.5 text-center text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
                            >
                              Đăng tin ngay
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 2. GÓI TIN ĐĂNG LẺ (Basic) */}
              <section id="goi-le" className="scroll-mt-24">
                <SectionTitle no="2" title="Gói tin đăng lẻ" desc="CVR Basic — đăng tin tiết kiệm, phù hợp nhu cầu cơ bản." />
                <div className="mt-4 overflow-hidden rounded-none border border-cvr-line bg-white shadow-lux">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
                    <div className="p-5 sm:p-6">
                      <p className="text-xl font-bold text-cvr-ink">CVR Basic</p>
                      <ul className="mt-2.5 space-y-1 text-sm text-cvr-body">
                        {basicPkg.benefits.map((b) => <li key={b}>– {b}</li>)}
                      </ul>
                      <div className="mt-4 rounded-lg border border-cvr-line bg-cvr-surface p-3">
                        <p className="text-sm font-semibold leading-snug text-cvr-ink">{basicPkg.sample.title}</p>
                        <p className="mt-1 text-xs text-cvr-muted">{basicPkg.sample.address}</p>
                      </div>
                      <ul className="mt-4 space-y-1.5 text-sm text-cvr-body">
                        {basicPkg.displays.map((d) => (
                          <li key={d} className="flex gap-2"><CheckIcon /> <span>{d}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col border-t border-cvr-line bg-cvr-surface/60 p-5 sm:p-6 md:border-l md:border-t-0">
                      <div className="flex-1 space-y-3">
                        {basicPkg.prices.map((pr) => (
                          <div key={pr.label}>
                            <p className="text-xs text-cvr-muted">{pr.label}</p>
                            <p className="text-lg font-bold text-cvr-ink">{pr.price}</p>
                          </div>
                        ))}
                      </div>
                      <Link
                        href="/dang-tin"
                        className="mt-4 block rounded-lg bg-cvr-ink py-2.5 text-center text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
                      >
                        Đăng tin ngay
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3–6. Các gói khác — nhận tư vấn */}
              {otherPkgs.map((p) => (
                <section key={p.id} id={p.id} className="scroll-mt-24">
                  <SectionTitle no={p.no} title={p.name} desc={p.desc} />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-none border border-cvr-line bg-white p-5 shadow-lux sm:p-6">
                    <p className="text-sm text-cvr-muted">
                      Giá theo vị trí &amp; thời lượng — nhận báo giá chi tiết từ chuyên viên Coastal Land.
                    </p>
                    <a
                      href="#lien-he"
                      className="rounded-lg border border-cvr-ink px-5 py-2 text-sm font-semibold text-cvr-ink transition hover:bg-cvr-ink hover:text-white"
                    >
                      Liên hệ tư vấn
                    </a>
                  </div>
                </section>
              ))}

              {/* Loại tin & đặc điểm */}
              <section id="dac-diem" className="scroll-mt-24">
                <SectionTitle no="•" title="Loại tin và đặc điểm" desc="So sánh đặc điểm hiển thị giữa các cấp tin." />
                <div className="mt-4 overflow-x-auto rounded-none border border-cvr-line bg-white shadow-lux">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-cvr-line bg-cvr-surface/60 text-left">
                        <th className="px-4 py-3 font-semibold text-cvr-ink">Đặc điểm</th>
                        {(["diamond", "gold", "silver", "basic"] as const).map((id) => {
                          const t = getTier(id);
                          return (
                            <th key={id} className="px-4 py-3 text-center font-bold" style={{ color: t.accent }}>
                              {t.name}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {featureRows.map((r) => (
                        <tr key={r.label} className="border-b border-cvr-line/70 last:border-0">
                          <td className="px-4 py-2.5 text-cvr-body">{r.label}</td>
                          {r.values.map((v, i) => (
                            <td key={i} className={`px-4 py-2.5 text-center ${v === "✓" ? "font-bold text-cvr-ink" : "text-cvr-muted"}`}>
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Quy định chung */}
              <section id="quy-dinh" className="scroll-mt-24">
                <SectionTitle no="•" title="Quy định chung" desc="" />
                <div className="mt-4 space-y-3 rounded-none border border-cvr-line bg-white p-5 shadow-lux sm:p-6">
                  {rules.map((r) => (
                    <p key={r} className="text-sm leading-relaxed text-cvr-muted">{r}</p>
                  ))}
                </div>
              </section>

              {/* Liên hệ */}
              <section id="lien-he" className="scroll-mt-24">
                <SectionTitle no="•" title="Nhận báo giá & tư vấn" desc="Để lại thông tin, chuyên viên Coastal Land liên hệ trong 5 phút." />
                <div className="mt-4 max-w-2xl">
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

function SectionTitle({ no, title, desc }: { no: string; title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold uppercase tracking-tight text-cvr-ink sm:text-2xl">
        {no !== "•" && <span className="mr-1.5">{no}.</span>}
        {title}
      </h2>
      {desc && <p className="mt-1 text-sm text-cvr-muted">{desc}</p>}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-ink" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FlameIcon({ color }: { color: string }) {
  return (
    <svg className="mb-0.5 mr-1 inline-block h-3.5 w-3.5 align-middle" style={{ color }} fill="currentColor" viewBox="0 0 24 24">
      <path d="M13.5 0.67s0.74 2.65 0.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l0.03-0.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-0.36 3.6-1.21 4.62-2.58 0.39 1.29 0.59 2.65 0.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
    </svg>
  );
}
