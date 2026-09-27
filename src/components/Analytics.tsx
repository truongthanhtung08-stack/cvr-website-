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
          // NGUỒN KHÁCH TỪ TRONG APP ZALO / FACEBOOK: mở link trong app thì thường không có
          // referrer → GA4 xếp vào "trực tiếp", không đo được Zalo mang về bao nhiêu khách.
          // Link chưa gắn utm mà trình duyệt là của Zalo/Facebook → tự gắn nguồn cho LƯỢT ĐẦU
          // (chỉ trong số liệu gửi GA4, KHÔNG đổi địa chỉ trên thanh trình duyệt).
          var cl_ua = navigator.userAgent, cl_url = location.href, cl_cfg = {};
          if (!/[?&]utm_source=/.test(cl_url)) {
            var cl_nguon = /Zalo/i.test(cl_ua) ? 'zalo' : /FBAN|FBAV|FB_IAB/.test(cl_ua) ? 'facebook' : '';
            if (cl_nguon) cl_cfg.page_location = cl_url + (cl_url.indexOf('?') < 0 ? '?' : '&') + 'utm_source=' + cl_nguon + '&utm_medium=app_trinh_duyet';
          }
          gtag('config', '${id}', cl_cfg);
          ${adsId ? `gtag('config', '${adsId}');` : ""}
          // CẦU NỐI GOOGLE → ZALO: khách bấm nhắn Zalo (OA / người đăng) hoặc bấm gọi → sự kiện GA4
          // để biết khách đến từ Google có sang Zalo không. KHÔNG phải chuyển đổi Ads (chỉ đo).
          document.addEventListener('click', function (e) {
            var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
            if (!a) return;
            var h = a.getAttribute('href') || '';
            if (/zalo\\.me\\//.test(h)) gtag('event', 'lien_he_zalo', { link_url: h, trang: location.pathname });
            else if (/^tel:/.test(h)) gtag('event', 'bam_goi', { trang: location.pathname });
          }, true);
        `}
      </Script>
    </>
  );
}
