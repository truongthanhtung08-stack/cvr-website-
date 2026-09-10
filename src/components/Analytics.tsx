import Script from "next/script";

// ============================================================================
// GOOGLE ANALYTICS 4 + GOOGLE ADS — đo lượng khách, nguồn khách, hành vi trên web.
// ----------------------------------------------------------------------------
// Vì sao cần: không có số liệu thì chạy marketing là chạy mù — không biết khách
// vào từ đâu, xem tin nào, bỏ đi ở bước nào, tiền quảng cáo nào ra lead.
//
// MÃ ĐO LƯỜNG ĐANG DÙNG: G-2RE29WXQCC
//   · Tài sản "coastalland.vn" · luồng "Coastal Land Web" (tạo 20/8/2026).
//   · Mã này KHÔNG phải khoá bí mật — mọi website dùng Analytics đều để lộ nó
//     trong mã nguồn trang, nên ghi thẳng vào đây được, khỏi phải vào Vercel.
//   · Muốn đổi sang tài sản khác mà không sửa code: đặt biến NEXT_PUBLIC_GA_ID
//     trên Vercel → giá trị đó được ưu tiên.
//
// MÃ GOOGLE ADS ĐANG DÙNG: AW-18365884419
//   · Là "thẻ Google" của tài khoản quảng cáo — dùng CHUNG thư viện gtag.js với
//     Analytics ở trên, nên chỉ cần thêm một dòng config, KHÔNG nạp thêm script
//     (nạp 2 lần chỉ làm web chậm chứ không đo tốt hơn).
//   · Sau khi lên web: Google Ads → Mục tiêu → Trình quản lý thẻ → "Kiểm tra
//     lượt cài đặt thẻ" sẽ báo Đang hoạt động (có thể chờ vài giờ mới cập nhật).
//   · Muốn đổi mã mà không sửa code: đặt biến NEXT_PUBLIC_ADS_ID trên Vercel.
//
// Xem số liệu: analytics.google.com → tài sản coastalland.vn → Báo cáo →
// Thời gian thực (mở web trên điện thoại là thấy có người đang online).
//
// Script đặt afterInteractive: chờ trang hiện xong mới tải → không làm chậm
// lần hiển thị đầu tiên (điểm tốc độ Google chấm vẫn giữ nguyên).
// ============================================================================
const GA_MAC_DINH = "G-2RE29WXQCC";
const ADS_MAC_DINH = "AW-18365884419";

export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID || GA_MAC_DINH;
  const adsId = process.env.NEXT_PUBLIC_ADS_ID || ADS_MAC_DINH;
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
          ${adsId ? `gtag('config', '${adsId}');` : ""}
        `}
      </Script>
    </>
  );
}
