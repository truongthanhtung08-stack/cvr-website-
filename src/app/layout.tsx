import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { getHeroBanners } from "@/lib/siteContent";
import { asset } from "@/lib/asset";
import Chatbox from "@/components/Chatbox";
import CompareBar from "@/components/CompareBar";
import MobileTabBar from "@/components/MobileTabBar";
import BanPhimAo from "@/components/BanPhimAo";
import ScrollTopOnRoute from "@/components/ScrollTopOnRoute";
import RouteMotion from "@/components/RouteMotion";
import VachTim from "@/components/VachTim";
import SiteJsonLd from "@/components/SiteJsonLd";
import Analytics from "@/components/Analytics";
import PwaRegister from "@/components/PwaRegister";
import DemHienThi from "@/components/DemHienThi";
import DoThanhDay from "@/components/DoThanhDay";

// Font chính toàn site: Inter — hiện đại, chuyên nghiệp, "SF Pro của web" (kiểu Apple),
// hỗ trợ tiếng Việt đầy đủ.
//
// TỰ CHỨA HAI TỆP INTER (latin + tiếng Việt) thay cho next/font/google (tốc độ điện thoại, đo 21/10/2026): bản Google kèm thêm
// bộ "latin-ext" 85 KB khai SAU bộ tiếng Việt, mà các chữ đ ă ơ ư… nằm trong cả hai bộ → trình duyệt dùng bộ khai sau, tải
// thêm 85 KB ở mọi trang. Hai tệp dưới đây CHÍNH LÀ hai tệp Google cấp trước đây (cùng phông, cùng nét, 400–800), chỉ bỏ bộ thừa.
// Hai họ phông đứng nối nhau trong --font-inter: chữ nào không thuộc bộ latin thì trình duyệt lấy ở bộ tiếng Việt.
const interLatin = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "400 800",
  style: "normal",
  display: "swap",
  variable: "--font-inter-latin",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
});
const interViet = localFont({
  src: "./fonts/inter-vietnamese.woff2",
  weight: "400 800",
  style: "normal",
  display: "swap",
  variable: "--font-inter-vi",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB" }],
});
// fontFamily dạng "'tên', 'tên Fallback'" → ghép: Inter latin, Inter tiếng Việt, rồi phông dự phòng đã đo cỡ của bản latin
const [tenLatin, duPhongLatin] = interLatin.style.fontFamily.split(", ");
const FONT_INTER = `${tenLatin}, ${interViet.style.fontFamily}, ${duPhongLatin}`;

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  // Không tải trước (đo 21/10/2026): phông này chỉ dùng ở vài chỗ (banner, chữ Hero) — tải trước ở mọi trang là giành đường
  // truyền với ảnh đầu trang trên điện thoại. Chỗ nào dùng thì trình duyệt vẫn tự tải.
  preload: false,
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// Font hiện đại cho tiêu đề quảng cáo (Hero) — geometric sans, dấu "&" gọn đẹp, đủ dấu tiếng Việt
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
  // Không tải trước (đo 21/10/2026): phông này chỉ dùng ở vài chỗ (banner, chữ Hero) — tải trước ở mọi trang là giành đường
  // truyền với ảnh đầu trang trên điện thoại. Chỗ nào dùng thì trình duyệt vẫn tự tải.
  preload: false,
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = "https://coastalland.vn";
const SITE_TITLE = "COASTAL LAND";
// CÂU ĐỊNH VỊ CHUẨN — dùng thống nhất ở MỌI nơi: tiêu đề mặc định, thẻ chia sẻ
// (Zalo/Facebook/Messenger), manifest, và tên trên Google Business Profile.
// Google đối chiếu các nguồn này với nhau: gọi mỗi nơi một kiểu thì thương hiệu bị loãng.
const SITE_TAGLINE = "COASTAL LAND — Cổng thông tin mua bán, cho thuê nhà đất";
const SITE_DESC =
  "Cổng thông tin mua bán, cho thuê nhà đất, căn hộ, đất nền và dự án. Tin hình thật, liên hệ trực tiếp người bán, người cho thuê.";
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
    // Ưu tiên ảnh ĐIỆN THOẠI của hero (1200×520 ≈ 2,3:1): gần chuẩn ảnh chia sẻ 1,91:1 của
    // Facebook/Zalo. Ảnh máy tính 7:2 quá dẹt → khung xem trước khi gửi link bị cắt xấu.
    const s0 = slides.find((s) => s?.imageMobile || s?.image);
    const anh = s0?.imageMobile || s0?.image;
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
      "cổng thông tin bất động sản", "mua bán nhà đất", "cho thuê nhà đất", "đăng tin bất động sản",
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
        images: [{ url: OG_IMAGE_URL, alt: "COASTAL LAND — Cổng thông tin mua bán, cho thuê nhà đất" }],
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
  // Android: bàn phím ảo bật thì trang co lại vừa phần còn nhìn thấy, ô đang gõ không bị che.
  // iPhone và trình duyệt trong Zalo/Facebook bỏ qua dòng này — do <BanPhimAo /> lo.
  interactiveWidget: "resizes-content",
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
    <html lang="vi" style={{ ["--font-inter" as string]: FONT_INTER }} className={`${interLatin.variable} ${interViet.variable} ${playfair.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {/* Mở trong trình duyệt của Zalo → bỏ khoảng chừa đỉnh máy (xem --at trong globals.css). Chạy trước khi vẽ để không giật. */}
        <script dangerouslySetInnerHTML={{ __html: "if(/Zalo|FBAN|FBAV|FB_IAB|Instagram|TikTok|musical_ly/i.test(navigator.userAgent)){var s=document.createElement('style');s.textContent=':root{--at:0px}';document.head.appendChild(s)}" }} />
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
        {/* Vạch xanh "đang tìm" chung cả web: bấm tìm → chạy tới khi kết quả hiện */}
        <VachTim />
        {children}
        <CompareBar />
        <Chatbox />
        <MobileTabBar />
        <DoThanhDay />
        {/* Bàn phím ảo không được che ô khách đang gõ — mọi trang, mọi trình duyệt */}
        <BanPhimAo />
      </body>
    </html>
  );
}
