import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostListingForm from "@/components/PostListingForm";

export const metadata: Metadata = {
  title: "Đăng tin bất động sản | Coastal Land",
  description: "Đăng tin bán / cho thuê nhà đất tại Đà Nẵng, Huế và Miền Trung trên Coastal Land — biểu mẫu chuyên nghiệp, đầy đủ thuộc tính theo loại hình, duyệt nhanh bằng AI.",
};

const steps = [
  { n: "1", t: "Nhập thông tin", d: "Chọn loại hình, khu vực, giá, diện tích và đặc điểm bất động sản." },
  { n: "2", t: "Tải hình ảnh", d: "Thêm ảnh thực tế, video và giấy tờ pháp lý để tăng độ tin cậy." },
  { n: "3", t: "AI kiểm duyệt", d: "Tin được duyệt nhanh, lọc trùng và cảnh báo nội dung không hợp lệ." },
  { n: "4", t: "Tiếp cận khách", d: "Tin hiển thị tới đúng người mua đang tìm tại khu vực của bạn." },
];

export default function DangTinPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">Đăng tin bất động sản</h1>
            <p className="mx-auto mt-3 max-w-2xl text-white/65">Biểu mẫu chuyên nghiệp với đầy đủ thuộc tính theo từng loại hình — bạn chỉ cần chọn và điền.</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-cl-ink">{s.n}</span>
                <h3 className="mt-2.5 text-sm font-semibold text-white">{s.t}</h3>
                <p className="mt-1 text-xs text-white/55">{s.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <PostListingForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

