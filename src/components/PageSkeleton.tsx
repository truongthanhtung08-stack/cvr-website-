import Header from "@/components/Header";

// ── KHUNG XƯƠNG LÚC CHỜ DỮ LIỆU ────────────────────────────────────────────
// Các trang chính (chủ · mua bán · cho thuê · dự án) đọc Supabase no-store nên
// máy chủ phải render lại mỗi lần vào. Không có khung chờ thì chạm vào tab là
// màn hình ĐỨNG IM cho tới khi dữ liệu về → cảm giác chậm.
// Có file loading.tsx: Next đổi trang NGAY sang khung xương này (và tải sẵn nó
// khi link lọt vào màn hình), nội dung thật thay vào sau — chạm là thấy phản hồi.
//
// banner: chiều cao khối ảnh lớn đầu trang (0 = không có)
// cols  : số cột lưới thẻ ở màn hình lớn
export default function PageSkeleton({
  banner = "h-[190px] sm:h-[420px]",
  cols = "lg:grid-cols-4",
  cards = 8,
}: {
  banner?: string;
  cols?: string;
  cards?: number;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          {banner && <div className={`skel w-full rounded-2xl ${banner}`} />}

          {/* Thanh lọc */}
          <div className="mt-5 flex gap-2.5 overflow-hidden">
            <div className="skel h-10 w-32 shrink-0 rounded-full" />
            <div className="skel h-10 w-28 shrink-0 rounded-full" />
            <div className="skel h-10 w-24 shrink-0 rounded-full" />
            <div className="skel h-10 w-36 shrink-0 rounded-full" />
          </div>

          {/* Lưới thẻ */}
          <div className={`mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 ${cols}`}>
            {Array.from({ length: cards }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-cvr-line">
                <div className="skel aspect-[4/3] w-full" />
                <div className="space-y-2.5 p-4">
                  <div className="skel h-4 w-11/12 rounded-md" />
                  <div className="skel h-4 w-2/3 rounded-md" />
                  <div className="skel h-5 w-1/3 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
