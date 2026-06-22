import Link from "next/link";

const benefits = [
  {
    title: "Kiểm chứng thực địa",
    description: "Mọi tin đăng đều được đội ngũ Coastal Land xác minh thực tế trước khi công bố.",
    icon: "M",
  },
  {
    title: "Minh bạch pháp lý",
    description: "Sổ đỏ, sổ hồng chính chủ và quy hoạch rõ ràng để bạn yên tâm xuống tiền.",
    icon: "P",
  },
  {
    title: "Giao dịch an toàn",
    description: "Kết nối trực tiếp người mua, người bán và môi giới chuyên nghiệp tại Miền Trung.",
    icon: "A",
  },
  {
    title: "Tìm nhanh theo nhu cầu",
    description: "Bộ lọc khu vực, loại hình, giá và loại sản phẩm giúp bạn ra quyết định nhanh.",
    icon: "T",
  },
];

export default function ValueSection() {
  return (
    <section className="section-edge bg-cl-ink">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-cl-gold-soft">
              Coastal Land — Tinh hoa bất động sản Miền Trung
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Tìm đúng sản phẩm, kiểm chứng đúng giá, chốt giao dịch an toàn.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
              Chúng tôi giúp bạn đi thẳng vào tin đăng chất lượng, pháp lý sáng và dịch vụ hỗ trợ toàn hành trình mua bán, cho thuê tại Đà Nẵng, Huế và Miền Trung.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/mua-ban"
                className="inline-flex items-center justify-center rounded-full bg-cl-gold px-5 py-3 text-sm font-semibold text-cl-ink transition hover:bg-white/90"
              >
                Xem tin mua bán
              </Link>
              <Link
                href="/dang-tin"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Đăng tin miễn phí
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((item) => (
              <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 transition hover:-translate-y-1.5 hover:border-cl-gold/30 hover:bg-white/[0.08]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-white">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
