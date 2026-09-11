import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { getHeroBanners } from "@/lib/siteContent";
import { asset } from "@/lib/asset";
import Chatbox from "@/components/Chatbox";
import CompareBar from "@/components/CompareBar";
import MobileTabBar from "@/components/MobileTabBar";
import ScrollTopOnRoute from "@/components/ScrollTopOnRoute";
import RouteMotion from "@/components/RouteMotion";
import SiteJsonLd from "@/components/SiteJsonLd";
import Analytics from "@/components/Analytics";
import PwaRegister from "@/components/PwaRegister";
import DemHienThi from "@/components/DemHienThi";

// Font chính toàn site: Inter — hiện đại, chuyên nghiệp, "SF Pro của web" (kiểu Apple),
// hỗ trợ tiếng Việt đầy đủ.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// Font hiện đại cho tiêu đề quảng cáo (Hero) — geometric sans, dấu "&" gọn đẹp, đủ dấu tiếng Việt
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = "https://coastalland.vn";
const SITE_TITLE = "COASTAL LAND";
// CÂU ĐỊNH VỊ CHUẨN — dùng thống nhất ở MỌI nơi: tiêu đề mặc định, thẻ chia sẻ
// (Zalo/Facebook/Messenger), manifest, và tên trên Google Business Profile.
// Google đối chiếu các nguồn này với nhau: gọi mỗi nơi một kiểu thì thương hiệu bị loãng.
const SITE_TAGLINE = "COASTAL LAND — Bất động sản Duyên hải Miền Trung";
const SITE_DESC =
  "Sàn giao dịch bất động sản Đà Nẵng, Huế và Duyên hải Miền Trung — mua bán, cho thuê nhà đất, căn hộ, đất nền và dự án.";
// ── ẢNH XEM TRƯỚC KHI CHIA SẺ LINK (Zalo · Facebook · Messenger) ────────────
// LẤY ĐÚNG ẢNH HERO CỦA TRANG CHỦ mà chủ dự án đặt trong /admin/noi-dung.
//
// Trước đây chỗ này khai cứng /images/hero-thanh-pho-hien-dai-26.jpg — một ảnh
// AI vẽ: thành phố không có thật, mấy toà nhà còn có chữ nhảm trên nóc. Gửi link
// qua Zalo là khách thấy tấm đó, không liên quan gì tới Coastal Land.
//
// Nay đọc thẳng từ CMS nên: đổi ảnh Hero trong admin là ảnh chia sẻ đổi theo,
// không phải sửa code. Không lấy được (CSDL lỗi) thì dùng LOGO — thà logo còn
// hơn một tấm ảnh bịa.
const OG_LOGO_URL = new URL("/logo/logo-horizontal.jpg", SITE_URL).toString();

async function anhChiaSe(): Promise<string> {
  try {
    const slides = await getHeroBanners();
    const anh = slides.find((s) => s?.image)?.image;
    if (!anh) return OG_LOGO_URL;
    // Ảnh trong CMS có thể là đường dẫn tương đối (/anh/...) hoặc URL đầy đủ của
    // Supabase. Zalo/Facebook chỉ nhận URL TUYỆT ĐỐI.
    return anh.startsWith("http") ? anh : new URL(asset(anh), SITE_URL).toString();
  } catch {
    return OG_LOGO_URL;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const OG_IMAGE_URL = await anhChiaSe();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      // Trang nào không tự khai tiêu đề thì dùng câu định vị chuẩn (trước đây chỉ
      // có "COASTAL LAND" — Google không biết mình làm gì, ở đâu).
      default: SITE_TAGLINE,
      template: "%s | COASTAL LAND",
    },
    description: SITE_DESC,
    keywords: [
      "bất động sản Đà Nẵng", "bất động sản Huế", "bất động sản Duyên hải Miền Trung",
      "nhà đất Đà Nẵng", "mua bán nhà đất", "cho thuê nhà đất", "dự án bất động sản",
      "đất nền", "căn hộ", "villa biển", "COASTAL LAND", "coastalland.vn",
    ],
    // ⚠️ KHÔNG khai canonical ở layout gốc. Next cho trang con KẾ THỪA metadata của
    // layout, nên đặt canonical: "/" ở đây làm MỌI trang (mua-ban, du-an, tin-tuc,
    // từng tin BĐS…) đều tự khai "bản gốc của tôi là trang chủ" → Google coi là
    // trùng lặp và KHÔNG lập chỉ mục trang con. Mỗi trang tự khai canonical riêng.
    verification: {
      google: "Kltt2fEbpFCiNLrRJwZATFfhyKayu507-q7KhxEwUWQ",
      // Meta/Facebook xác minh quyền sở hữu miền coastalland.vn — bắt buộc để đưa
      // app Facebook lên Live (đăng nhập bằng Facebook cho khách ngoài).
      // Lấy ở Meta Business Suite → Domains → coastalland.vn → Thêm thẻ meta.
      // ⚠️ ĐỪNG XOÁ: gỡ thẻ này là Meta huỷ xác minh miền, app rớt khỏi Live.
      other: {
        "facebook-domain-verification": "zehj35msh3k32im86ueqe7b1v3zvdt",
      },
    },
    // ✅ ĐÃ PUBLISH: cho Google index + theo dõi liên kết.
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      url: SITE_URL,
      siteName: "COASTAL LAND",
      // Đây mới là chữ hiện ra khi GỬI LINK qua Zalo/Messenger/Facebook — trước
      // đây để trống chỉ có "COASTAL LAND", khách không biết mình bán gì.
      title: SITE_TAGLINE,
      description: SITE_DESC,
      // KHÔNG khai cứng width/height nữa: ảnh Hero do chủ dự án đổi trong admin, mỗi
        // tấm một kích thước. Khai sai số đo thì Zalo/Facebook cắt ảnh lệch.
        images: [{ url: OG_IMAGE_URL, alt: "COASTAL LAND — Bất động sản Duyên hải Miền Trung" }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TAGLINE,
      description: SITE_DESC,
      images: [OG_IMAGE_URL],
    },
    applicationName: "COASTAL LAND",
    // PWA — cài được lên màn hình chính Android & iOS
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: "COASTAL LAND",
      // Thanh trạng thái trong suốt → nền đen của header chạy lên tận đỉnh máy (kiểu app iOS).
      statusBarStyle: "black-translucent",
    },
    // Safari tự biến các con số (diện tích, mã tin…) thành link gọi điện màu xanh → tắt.
    // Nút gọi/Zalo trên trang chi tiết vẫn hoạt động vì dùng thẻ <a href="tel:"> tường minh.
      formatDetection: { telephone: false },
  };
}

// Chuẩn hiển thị trên điện thoại — Android & iOS
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // KHÔNG khoá phóng to (chuẩn trợ năng của Apple) — chỉ giới hạn mức tối đa.
  maximumScale: 5,
  userScalable: true,
  // Bắt buộc để env(safe-area-inset-*) có giá trị thật trên iPhone tai thỏ / thanh Home.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#161617" },
    { media: "(prefers-color-scheme: dark)", color: "#161617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${playfair.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <SiteJsonLd />
        {/* Google Analytics 4 — chỉ chạy khi đã cắm NEXT_PUBLIC_GA_ID */}
        <Analytics />
        {/* Cài web lên màn hình chính chạy như app (chỉ hoạt động ở bản thật) */}
        <PwaRegister />
        <ScrollTopOnRoute />
        {/* Đếm lượt HIỂN THỊ tin — đặt ở layout gốc nên chạy cho mọi trang có thẻ
            tin, không phải đi gắn từng nơi. */}
        <DemHienThi />
        {/* Thanh tiến trình + hiệu ứng vào trang khi chuyển trang (thay cho rung) */}
        <RouteMotion />
        {children}
        <CompareBar />
        <Chatbox />
        <MobileTabBar />
      </body>
    </html>
  );
}
