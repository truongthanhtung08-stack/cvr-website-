import Link from "next/link";

// ⚠️ Coastal Land là CỔNG THÔNG TIN: chỉ NỖ LỰC XÁC THỰC thông tin, không cam
// kết tuyệt đối ("mọi tin đăng"), không đứng ra giao dịch, không làm thủ tục.
const benefits = [
  {
    title: "Nỗ lực xác thực",
    description: "Đội ngũ Coastal Land rà soát và xác thực thông tin tin đăng trước khi công bố.",
    icon: "M",
  },
  {
    title: "Minh bạch pháp lý",
    description: "Thông tin sổ đỏ, sổ hồng và quy hoạch được nêu rõ để bạn tự đối chiếu trước khi quyết định.",
    icon: "P",
  },
  {
    title: "Kết nối trực tiếp",
    description: "Người mua, người bán và môi giới chuyên nghiệp tại Miền Trung liên hệ thẳng với nhau.",
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
    <section className="section-edge bg-cvr-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-cvr-gold-ink">
              Coastal Land — Tinh hoa bất động sản Miền Trung
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-cvr-ink sm:text-4xl">
              Tìm đúng sản phẩm, đối chiếu đúng giá, kết nối đúng người.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-cvr-muted">
              Coastal Land là cổng thông tin bất động sản — giúp người mua, người bán và môi giới tại Đà Nẵng, Huế và Miền Trung tìm thấy nhau qua tin đăng chất lượng, thông tin pháp lý rõ ràng.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/mua-ban"
                className="inline-flex items-center justify-center rounded-full bg-cvr-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-cvr-body"
              >
                Xem tin mua bán
              </Link>
              <Link
                href="/dang-tin"
                className="inline-flex items-center justify-center rounded-full border border-cvr-line bg-white px-5 py-3 text-sm font-semibold text-cvr-ink transition hover:bg-black/5"
              >
                Đăng tin miễn phí
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((item) => (
              <article key={item.title} className="shadow-lux rounded-none border border-cvr-line bg-white p-6 transition hover:-translate-y-1.5 hover:border-cvr-blue/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-none bg-cvr-surface text-lg font-bold text-cvr-ink">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-cvr-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-cvr-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
