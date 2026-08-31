import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Khung dùng chung cho các trang văn bản dài (Điều khoản · Chính sách bảo mật).
// Cột chữ hẹp (max-w-3xl) để mỗi dòng ~75 ký tự — dễ đọc, đúng tinh thần Apple.
export default function TrangPhapLy({
  title,
  capNhat,
  moDau,
  children,
}: {
  title: string;
  // Trang thông tin (Liên hệ, Tuyển dụng, FAQ…) không cần dòng "Cập nhật lần cuối" → bỏ trống.
  capNhat?: string;
  moDau: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-3xl px-4 pt-8 pb-footer sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight text-cvr-ink sm:text-4xl">{title}</h1>
          {capNhat && <p className="mt-3 text-sm text-cvr-faint">Cập nhật lần cuối: {capNhat}</p>}
          <p className="mt-5 text-[15px] leading-8 text-cvr-body">{moDau}</p>
          <div className="mt-10 space-y-9">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// Một mục trong văn bản. Bỏ `so` khi mục không cần đánh số (trang thông tin).
export function Muc({ so, title, children }: { so?: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-cvr-ink">
        {so != null && <span className="text-cvr-gold-ink">{so}. </span>}
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-8 text-cvr-body">{children}</div>
    </section>
  );
}

// Danh sách gạch đầu dòng dùng chung.
export function DanhSach({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((x, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[13px] h-1.5 w-1.5 shrink-0 rounded-full bg-cvr-gold" />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}
