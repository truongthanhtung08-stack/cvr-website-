import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";

export const metadata: Metadata = {
  title: "Nhận báo giá đăng tin | Coastal Land",
  description: "Để lại thông tin để nhận bảng giá các gói đăng tin (Tin thường, VIP) và ưu đãi mới nhất từ Coastal Land — gửi trong 5 phút.",
};

const packages = [
  { name: "Tin thường", price: "Miễn phí", note: "Hiển thị tiêu chuẩn", perks: ["Đăng không giới hạn", "Duyệt bằng AI nhanh", "Hiển thị trong tìm kiếm"] },
  { name: "Tin VIP", price: "Liên hệ", note: "Nổi bật, ưu tiên đầu trang", perks: ["Gắn nhãn VIP nổi bật", "Ưu tiên top kết quả", "Tăng 5× lượt xem"], highlight: true },
  { name: "Gói môi giới", price: "Liên hệ", note: "Dành cho sàn & môi giới", perks: ["Quản lý nhiều tin", "Báo cáo hiệu quả", "Hỗ trợ chuyên viên riêng"] },
];

export default function BaoGiaPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">Dành cho người bán & môi giới</span>
            <h1 className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">Nhận báo giá đăng tin</h1>
            <p className="mt-3 text-white/65">Để lại thông tin, chuyên viên Coastal Land gửi bảng giá chi tiết và tư vấn gói phù hợp trong 5 phút.</p>
          </div>

          {/* Bảng gói */}
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {packages.map((p) => (
              <div key={p.name} className={`rounded-2xl border p-6 ${p.highlight ? "border-white/40 bg-white/[0.06]" : "border-white/12 bg-white/[0.03]"}`}>
                {p.highlight && <span className="mb-2 inline-block rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-cvr-ink">Phổ biến</span>}
                <h3 className="font-serif text-xl font-bold text-white">{p.name}</h3>
                <p className="mt-1 text-2xl font-extrabold text-white">{p.price}</p>
                <p className="text-xs text-white/55">{p.note}</p>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex gap-2"><span className="text-white">✓</span> {perk}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="mx-auto mt-12 max-w-2xl">
            <LeadForm cta="Nhận báo giá ngay" topics={["Báo giá gói Tin VIP", "Báo giá gói môi giới", "Tư vấn gói phù hợp", "Khác"]} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

