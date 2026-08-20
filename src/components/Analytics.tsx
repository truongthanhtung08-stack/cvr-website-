import Script from "next/script";

// ============================================================================
// GOOGLE ANALYTICS 4 — đo lượng khách, nguồn khách, hành vi trên web.
// ----------------------------------------------------------------------------
// Vì sao cần: không có số liệu thì chạy marketing là chạy mù — không biết khách
// vào từ đâu, xem tin nào, bỏ đi ở bước nào, tiền quảng cáo nào ra lead.
//
// CÁCH BẬT (chủ dự án làm 1 lần, không cần sửa code):
//   1. analytics.google.com → Quản trị → Tạo tài sản (property) cho coastalland.vn
//      → Luồng dữ liệu (Web) → lấy MÃ ĐO LƯỜNG dạng G-XXXXXXXXXX
//   2. Vercel → Settings → Environment Variables → thêm:
//        NEXT_PUBLIC_GA_ID = G-XXXXXXXXXX
//   3. Redeploy. Xong — số liệu chạy về ngay trong mục "Thời gian thực".
//
// Chưa cắm mã → KHÔNG chèn script nào (web không tải thêm gì, không chậm đi).
// Script đặt afterInteractive: chờ trang hiện xong mới tải → không làm chậm
// lần hiển thị đầu tiên (điểm tốc độ Google chấm vẫn giữ nguyên).
// ============================================================================
export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
