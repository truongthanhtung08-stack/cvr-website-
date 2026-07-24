import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import Chatbox from "@/components/Chatbox";
import CompareBar from "@/components/CompareBar";
import MobileTabBar from "@/components/MobileTabBar";

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

export const metadata: Metadata = {
  title: "COASTAL LAND — Bất động sản Đà Nẵng, Huế & Miền Trung",
  description:
    "COASTAL LAND — Gateway to Central Coast property. Sàn giao dịch bất động sản trung gian, khách quan tại Đà Nẵng, Huế và Miền Trung: đất nền, căn hộ, nhà phố, villa biển và bất động sản công nghiệp.",
  // ⚠️ CHƯA PUBLISH: chặn Google index tới khi ra mắt chính thức.
  // Khi publish: XÓA khối robots này + đăng ký Google Search Console.
  robots: { index: false, follow: false },
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
        {children}
        <CompareBar />
        <Chatbox />
        <MobileTabBar />
      </body>
    </html>
  );
}
