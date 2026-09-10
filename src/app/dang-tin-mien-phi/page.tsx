import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegisterForm from "@/components/RegisterForm";
import { getBilling } from "@/lib/siteContent";
import { freeNote, tenGoiMienPhi } from "@/lib/billing";

// ============================================================================
// TRANG ĐÍCH CHO QUẢNG CÁO GOOGLE — nơi thả khách bấm từ mẫu quảng cáo tìm kiếm.
// ----------------------------------------------------------------------------
// Vì sao cần trang riêng thay vì thả về trang chủ: quảng cáo hứa "đăng tin miễn
// phí" mà khách rơi vào trang chủ đầy tin bán nhà thì họ đi tìm nhà, không ai
// đăng ký — tiền quảng cáo thành tiền cho người xem dạo. Trang này chỉ có MỘT
// việc: người có nhà đất cần bán/cho thuê → tạo tài khoản → đăng tin.
//
// Điểm chất lượng (Quality Score) của Google chấm theo "mức độ liên quan của
// trang đích": chữ trên trang phải TRÙNG với từ khoá và với mẫu quảng cáo. Câu
// H1 dưới đây cố ý lặp đúng cụm "đăng tin bất động sản miễn phí" — đừng đổi
// thành câu bay bổng, điểm chất lượng tụt là giá mỗi lượt bấm tăng.
//
// ⚠️ CÂU CHỮ: Coastal Land là CỔNG THÔNG TIN, không phải môi giới. Không viết
// câu nào khiến khách hiểu là web đứng ra bán hộ, ký gửi hay định giá.
// ⚠️ "Miễn phí" ở đây là MIỄN PHÍ ĐĂNG TIN theo chính sách thành viên mới trong
// admin — không viết thành "miễn phí mãi mãi".
// ============================================================================

export const metadata: Metadata = {
  title: "Đăng tin bất động sản miễn phí — Đà Nẵng, Huế & Miền Trung",
  description:
    "Tạo tài khoản Coastal Land và đăng tin bán / cho thuê nhà đất miễn phí cho thành viên mới. Tin được duyệt nhanh, đến đúng người đang tìm tại khu vực của bạn.",
  alternates: { canonical: "/dang-tin-mien-phi" },
};

const LY_DO = [
  {
    t: "Đăng miễn phí khi mới tham gia",
    d: "Thành viên mới được đăng tin không mất phí theo chính sách hiện hành — đăng thử rồi hãy quyết định có dùng gói trả phí hay không.",
  },
  {
    t: "Tin đến đúng người trong khu vực",
    d: "Khách tìm nhà lọc theo tỉnh, phường/xã, dự án, khoảng giá và diện tích — tin của bạn hiện ra đúng lúc họ đang tìm.",
  },
  {
    t: "Duyệt nhanh, lọc tin rác",
    d: "Tin được kiểm duyệt trước khi hiển thị nên người mua tin tưởng vào kết quả tìm kiếm, tin thật không bị chìm giữa tin ảo.",
  },
  {
    t: "Tự quản lý tin của mình",
    d: "Sửa giá, thêm ảnh, ẩn tin đã bán, xem số lượt xem — tất cả trong trang tài khoản, không phải gọi ai.",
  },
];

export default async function DangTinMienPhiPage() {
  const billing = await getBilling();
  const uuDai = billing.free.active ? freeNote(billing.free, tenGoiMienPhi(billing)) : "";

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        {/* ── HERO + FORM ───────────────────────────────────────────────────
            Form nằm NGAY màn hình đầu, không bắt cuộn đi tìm. Khách quảng cáo
            chỉ cho trang vài giây; thấy phải cuộn là họ bấm back. */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
          {/* THỨ TỰ TRÊN ĐIỆN THOẠI: tiêu đề → FORM → lý do.
              Phần lớn khách bấm quảng cáo tìm kiếm là trên điện thoại; nếu form
              nằm sau 4 mục lý do thì họ phải cuộn hết màn hình mới thấy ô điền,
              và đa số bấm back trước khi tới đó. Trên máy tính (lg) thì trở về
              hai cột: chữ bên trái, form bên phải. */}
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
            {/* Tiêu đề + lời hứa */}
            <div className="lg:col-start-1 lg:row-start-1 lg:pt-6">
              {uuDai && (
                <p className="inline-flex items-center gap-2 rounded-full border border-cvr-gold/40 bg-cvr-gold/[0.08] px-3.5 py-1.5 text-xs font-semibold text-cvr-gold-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-cvr-gold" />
                  {uuDai}
                </p>
              )}

              <h1 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-cvr-ink sm:text-4xl lg:text-5xl">
                Đăng tin bất động sản miễn phí tại Đà Nẵng, Huế và Miền Trung
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-cvr-body sm:text-lg">
                Bạn có nhà, đất, căn hộ cần bán hoặc cho thuê? Tạo tài khoản Coastal Land và
                đăng tin ngay — tin của bạn hiện đến đúng người đang tìm bất động sản tại khu
                vực đó.
              </p>

            </div>

            {/* Form đăng ký — dùng lại đúng component của /dang-ky để sau này
                sửa một chỗ là cả hai trang đổi theo. */}
            <div className="flex justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:justify-end">
              <RegisterForm uuDai={uuDai} />
            </div>

            {/* Lý do chọn Coastal Land */}
            <div className="lg:col-start-1 lg:row-start-2">
              <dl className="space-y-5 border-t border-cvr-line pt-8">
                {LY_DO.map((l) => (
                  <div key={l.t} className="flex items-start gap-3">
                    <svg
                      className="mt-1 h-4 w-4 shrink-0 text-cvr-blue"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.6}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <dt className="text-sm font-semibold text-cvr-ink">{l.t}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-cvr-muted">{l.d}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <p className="mt-8 text-sm text-cvr-muted">
                Đã có tài khoản?{" "}
                <Link
                  href="/dang-nhap?next=/dang-tin"
                  className="font-semibold text-cvr-blue-ink underline-offset-4 hover:underline"
                >
                  Đăng nhập và đăng tin
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* ── BA BƯỚC ──────────────────────────────────────────────────────
            Trả lời câu hỏi trong đầu khách: "đăng ký xong rồi sao nữa?" */}
        <section className="border-t border-cvr-line bg-cvr-surface">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
              Đăng tin trong ba bước
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {[
                { n: "1", t: "Tạo tài khoản", d: "Bằng Google một chạm, hoặc bằng email và số điện thoại." },
                { n: "2", t: "Nhập tin và tải ảnh", d: "Chọn loại hình, khu vực, giá, diện tích rồi tải ảnh thật của bất động sản." },
                { n: "3", t: "Tin lên sóng", d: "Tin qua kiểm duyệt là hiển thị trong kết quả tìm kiếm của người mua." },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-cvr-line bg-white p-6 shadow-lux">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cvr-ink text-sm font-bold text-white">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-cvr-ink">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-cvr-muted">{s.d}</p>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-cvr-faint">
              Coastal Land là cổng thông tin bất động sản — nơi bạn tự đăng và tự quản lý tin của
              mình. Chúng tôi không môi giới, không ký gửi và không tham gia vào giao dịch giữa
              bạn với người mua.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
