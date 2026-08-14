import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import Chatbox from "@/components/Chatbox";
import CompareBar from "@/components/CompareBar";
import MobileTabBar from "@/components/MobileTabBar";
import ScrollTopOnRoute from "@/components/ScrollTopOnRoute";
import RouteMotion from "@/components/RouteMotion";

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
const SITE_DESC =
  "Bất động sản Đà Nẵng, Miền Trung và Duyên hải Việt Nam."
const OG_IMAGE_PATH = "/images/hero-thanh-pho-hien-dai-26.jpg";
const OG_IMAGE_URL = new URL(OG_IMAGE_PATH, SITE_URL).toString();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | COASTAL LAND",
  },
  description: SITE_DESC,
  keywords: [
    "bất động sản Đà Nẵng", "bất động sản Huế", "bất động sản Duyên hải Miền Trung",
    "nhà đất Đà Nẵng", "mua bán nhà đất", "cho thuê nhà đất", "dự án bất động sản",
    "đất nền", "căn hộ", "villa biển", "COASTAL LAND", "coastalland.vn",
  ],
  alternates: { canonical: "/" },
verification: {
  google: "Kltt2fEbpFCiNLrRJwZATFfhyKayu507-q7KhxEwUWQ",
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
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: "COASTAL LAND — Bất động sản Duyên hải Miền Trung" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
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
        <ScrollTopOnRoute />
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
