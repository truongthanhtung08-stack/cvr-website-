import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";

export const metadata: Metadata = {
  title: "Trở thành chuyên gia Coastal Land | Coastal Land",
  description: "Đăng ký trở thành chuyên gia môi giới trên Coastal Land — tiếp cận khách hàng tiềm năng, hồ sơ xác minh và công cụ hỗ trợ giao dịch.",
};

const benefits = [
  { title: "Tiếp cận khách thật", desc: "Nhận yêu cầu tư vấn từ người mua đã lọc nhu cầu, đúng khu vực & phân khúc bạn phụ trách." },
  { title: "Hồ sơ được xác minh", desc: "Huy hiệu “đã xác minh” tăng uy tín, giúp khách tin tưởng và liên hệ nhanh hơn." },
  { title: "Công cụ hỗ trợ", desc: "Đăng tin, quản lý khách hàng và tài liệu pháp lý trên một nền tảng duy nhất." },
];

export default function DangKyChuyenGiaPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Trở thành chuyên gia Coastal Land</h1>
              <p className="mt-2 text-sm leading-relaxed text-cvr-muted">Gia nhập mạng lưới chuyên gia môi giới uy tín tại Miền Trung. Điền thông tin, đội ngũ Coastal Land sẽ liên hệ xác minh và kích hoạt hồ sơ của bạn.</p>

              <div className="mt-6 space-y-4">
                {benefits.map((b, i) => (
                  <div key={b.title} className="flex gap-4 rounded-none border border-cvr-line bg-cvr-surface p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cvr-ink text-sm font-bold text-white">{i + 1}</span>
                    <div>
                      <h3 className="font-semibold text-cvr-ink">{b.title}</h3>
                      <p className="mt-0.5 text-sm text-cvr-muted">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:sticky lg:top-24">
              <LeadForm
                cta="Gửi đăng ký chuyên gia"
                topics={["Chuyên gia tại Đà Nẵng", "Chuyên gia tại Huế", "Sàn / công ty BĐS", "Cộng tác viên"]}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
