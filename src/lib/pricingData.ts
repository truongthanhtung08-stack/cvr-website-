// ============================================================================
// DỮ LIỆU BẢNG GIÁ DỊCH VỤ (/bao-gia-dang-tin) — admin sửa được qua site_content key 'pricing'.
// Ảnh mẫu để đường dẫn RAW (component tự qua asset()). Màu/nhãn cấp tin lấy từ lib/packages.
// ============================================================================
import type { TierId } from "@/lib/packages";

export type PriceLine = { label: string; original?: string; price: string };
export type Sample = { image: string; title: string; address: string; price?: string };

export type VipPkg = { tierId: TierId; benefits: string[]; displays: string[]; sample: Sample; prices: PriceLine[] };
export type BasicPkg = { benefits: string[]; displays: string[]; sample: Sample; prices: PriceLine[] };
export type UpRow = { label: string; values: { original?: string; price: string }[] };
export type PjPkg = { tierId: TierId; name: string; image: string; sample: { title: string; address: string }; displays: string[]; prices: PriceLine[] };
export type PrPkg = { tierId: TierId; name: string; price: string; displays: string[] };
export type BannerRow = { name: string; size: string; price: string; pos: string; note: string };
export type BannerTable = { title: string; sizeLabel: string; rows: BannerRow[] };
export type FeatureRow = { label: string; values: [string, string, string, string] };

export type PricingData = {
  intro: { kicker: string; title: string; desc: string };
  vipPkgs: VipPkg[];
  basicPkg: BasicPkg;
  upRows: UpRow[];
  pjPkgs: PjPkg[];
  prPkgs: PrPkg[];
  prNotes: string[];
  bannerTables: BannerTable[];
  featureRows: FeatureRow[];
  rules: string[];
  hotline: string;
};

export const PRICING_DEFAULT: PricingData = {
  intro: {
    kicker: "Coastal Land — Bảng giá 2026",
    title: "Báo giá dịch vụ và truyền thông",
    desc: "Giải pháp đăng tin và quảng cáo giúp người bán, môi giới, chủ đầu tư tiếp cận đúng khách hàng tiềm năng tại Miền Trung.",
  },
  vipPkgs: [
    {
      tierId: "diamond",
      benefits: [
        "Tăng lượt xem gấp 20 lần tin thường.",
        "Tiếp cận nhiều khách hàng nhất.",
        "Xuất hiện nhiều trên các vị trí nổi bật của Website.",
      ],
      displays: [
        "Xuất hiện trên Trang chủ.",
        "Đứng trên CVR Gold.",
        "Tiêu đề màu đỏ + Bôi đậm + Viết hoa + icon HOT màu đỏ.",
        "Xuất hiện trong box “Bất động sản nổi bật”.",
        "Chèn 1 link bất kỳ dưới tin đăng.",
      ],
      sample: { image: "/images/tin/anh tin Diamond.png", title: "VILLA BIỂN 3 TẦNG MẶT TIỀN VÕ NGUYÊN GIÁP, VIEW MỸ KHÊ", address: "Phước Mỹ, Sơn Trà, Đà Nẵng", price: "33 tỷ · 350 m²" },
      prices: [
        { label: "Giá 1 tuần", price: "980.000đ" },
        { label: "Giá 2 tuần (−15%)", original: "1.960.000đ", price: "1.700.000đ" },
        { label: "Giá 4 tuần (−30%)", original: "3.920.000đ", price: "2.800.000đ" },
      ],
    },
    {
      tierId: "gold",
      benefits: [
        "Tăng lượt xem gấp 10 lần tin thường.",
        "Tiếp cận nhiều khách hàng.",
        "Xuất hiện nhiều trên các vị trí nổi bật của Website.",
      ],
      displays: [
        "Đứng trên CVR Silver.",
        "Tiêu đề màu vàng + Bôi đậm + Viết hoa + icon HOT màu vàng.",
        "Xuất hiện trong box “Bất động sản nổi bật”.",
      ],
      sample: { image: "/images/tin/2.jpg", title: "CĂN HỘ THE FILMORE 2PN VIEW SÔNG HÀN, BÀN GIAO CAO CẤP", address: "Hải Châu I, Hải Châu, Đà Nẵng", price: "7,2 tỷ · 95 m²" },
      prices: [
        { label: "Giá 1 tuần", price: "490.000đ" },
        { label: "Giá 2 tuần (−20%)", original: "980.000đ", price: "800.000đ" },
        { label: "Giá 4 tuần (−35%)", original: "1.960.000đ", price: "1.300.000đ" },
      ],
    },
    {
      tierId: "silver",
      benefits: ["Tăng lượt xem gấp 5 lần tin thường.", "Tiếp cận khách hàng tốt."],
      displays: ["Đứng trên CVR Basic.", "Tiêu đề màu xanh + Bôi đậm + icon HOT màu xanh."],
      sample: { image: "/images/tin/4.jpg", title: "Đất nền KĐT sinh thái Hòa Xuân, sổ đỏ trao tay", address: "Hòa Xuân, Cẩm Lệ, Đà Nẵng", price: "4,2 tỷ · 100 m²" },
      prices: [
        { label: "Giá 1 tuần", price: "170.000đ" },
        { label: "Giá 2 tuần (−15%)", original: "340.000đ", price: "300.000đ" },
        { label: "Giá 4 tuần (−30%)", original: "680.000đ", price: "500.000đ" },
      ],
    },
  ],
  basicPkg: {
    benefits: ["Tiếp cận khách hàng tốt.", "Chi phí thấp nhất."],
    displays: ["Nằm bên dưới các tin cao cấp.", "Tiêu đề hiển thị mặc định."],
    sample: { image: "/images/tin/3.jpg", title: "Nhà phố 4 tầng mặt tiền kinh doanh trung tâm Thanh Khê", address: "Tam Thuận, Thanh Khê, Đà Nẵng", price: "8,5 tỷ · 100 m²" },
    prices: [
      { label: "Giá 1 tuần", price: "15.000đ" },
      { label: "Giá 2 tuần", price: "20.000đ" },
      { label: "Giá 4 tuần", price: "30.000đ" },
    ],
  },
  upRows: [
    { label: "Up ngay", values: [{ price: "90.000đ" }, { price: "46.000đ" }, { price: "17.000đ" }, { price: "5.000đ" }] },
    { label: "Up 3 lần (−20%)", values: [{ original: "270.000đ", price: "216.000đ" }, { original: "138.000đ", price: "110.400đ" }, { original: "51.000đ", price: "40.800đ" }, { original: "15.000đ", price: "12.000đ" }] },
    { label: "Up 7 lần (−30%)", values: [{ original: "630.000đ", price: "441.000đ" }, { original: "322.000đ", price: "225.400đ" }, { original: "119.000đ", price: "83.300đ" }, { original: "35.000đ", price: "24.500đ" }] },
    { label: "Up 13 lần (−40%)", values: [{ original: "1.170.000đ", price: "702.000đ" }, { original: "598.000đ", price: "358.800đ" }, { original: "221.000đ", price: "132.600đ" }, { original: "65.000đ", price: "39.000đ" }] },
    { label: "Up 27 lần (−50%)", values: [{ original: "2.430.000đ", price: "1.215.000đ" }, { original: "1.242.000đ", price: "621.000đ" }, { original: "459.000đ", price: "229.500đ" }, { original: "135.000đ", price: "67.500đ" }] },
  ],
  pjPkgs: [
    {
      tierId: "diamond",
      name: "CVR-PJ Diamond",
      image: "/images/du-an/sun-cosmo-residence.jpg",
      sample: { title: "Sun Cosmo Residence", address: "Hòa Hải, Ngũ Hành Sơn, Đà Nẵng" },
      displays: ["Xuất hiện trên Trang chủ.", "Xuất hiện trên CVR-PJ Gold.", "Xuất hiện trên CVR Diamond.", "Icon màu đỏ nổi bật."],
      prices: [
        { label: "Giá 1 tuần", price: "6.800.000đ" },
        { label: "Giá 2 tuần (−6%)", original: "13.600.000đ", price: "12.800.000đ" },
      ],
    },
    {
      tierId: "gold",
      name: "CVR-PJ Gold",
      image: "/images/du-an/the-filmore-da-nang.jpg",
      sample: { title: "The Filmore Da Nang", address: "Hải Châu, Đà Nẵng" },
      displays: ["Xuất hiện trên CVR-PJ Silver.", "Xuất hiện trên CVR Gold.", "Icon màu vàng nổi bật."],
      prices: [
        { label: "Giá 1 tuần", price: "3.500.000đ" },
        { label: "Giá 2 tuần (−6%)", original: "7.000.000đ", price: "6.600.000đ" },
      ],
    },
    {
      tierId: "silver",
      name: "CVR-PJ Silver",
      image: "/images/du-an/khu-do-thi-fpt-city.jpg",
      sample: { title: "Khu đô thị FPT City", address: "Ngũ Hành Sơn, Đà Nẵng" },
      displays: ["Xuất hiện trên CVR-PJ Basic.", "Xuất hiện trên CVR Silver.", "Icon màu xanh nổi bật."],
      prices: [
        { label: "Giá 1 tuần", price: "2.000.000đ" },
        { label: "Giá 2 tuần (−5%)", original: "4.000.000đ", price: "3.800.000đ" },
      ],
    },
  ],
  prPkgs: [
    { tierId: "diamond", name: "CVR-PR Diamond", price: "8.900.000đ", displays: ["Xuất hiện trên Trang chủ: box Tin tức.", "Xuất hiện trên trang chuyên mục Tin tức.", "Chia sẻ trên Fanpage Facebook của Coastal Land."] },
    { tierId: "gold", name: "CVR-PR Gold", price: "5.900.000đ", displays: ["Xuất hiện trên Trang chủ: box Tin tức.", "Xuất hiện trên trang chuyên mục Tin tức."] },
    { tierId: "silver", name: "CVR-PR Silver", price: "2.900.000đ", displays: ["Xuất hiện trên trang chuyên mục Tin tức."] },
  ],
  prNotes: [
    "Một bài PR không quá 5 ảnh minh hoạ.",
    "Bài PR gửi trước 2 ngày.",
    "Bài PR xuất hiện ở Trang chủ trong 1 ngày, xuất hiện trên trang chuyên mục Tin tức vĩnh viễn.",
  ],
  bannerTables: [
    {
      title: "Banner Web",
      sizeLabel: "Kích thước (px)",
      rows: [
        { name: "CVR-BANNER Homepage 1", size: "370 × 300", price: "7.500.000đ", pos: "Trang chủ", note: "Chia sẻ 3" },
        { name: "CVR-BANNER Homepage 2", size: "370 × 312", price: "5.000.000đ", pos: "Trang chủ", note: "Chia sẻ 3" },
        { name: "CVR-BANNER Homepage 3", size: "370 × 430", price: "6.000.000đ", pos: "Trang chủ", note: "Chia sẻ 3" },
        { name: "CVR-BANNER Listing 1", size: "370 × 600", price: "7.000.000đ", pos: "Trang danh sách Tin đăng / Dự án", note: "Chia sẻ 3" },
        { name: "CVR-BANNER Listing 2", size: "370 × 320", price: "3.000.000đ", pos: "Trang danh sách Tin đăng / Dự án", note: "Chia sẻ 3" },
        { name: "CVR-BANNER Listing 3", size: "370 × 430", price: "5.000.000đ", pos: "Trang danh sách Tin đăng / Dự án", note: "Chia sẻ 3" },
      ],
    },
    {
      title: "Banner Mobile Web",
      sizeLabel: "Kích thước (px)",
      rows: [
        { name: "CVR-BANNER Mobile Homepage", size: "345 × 200", price: "5.000.000đ", pos: "Trang chủ (mobile)", note: "Chia sẻ 3" },
        { name: "CVR-BANNER Mobile Listing", size: "345 × 150", price: "3.000.000đ", pos: "Trang chủ + Tin đăng (mobile)", note: "Bao toàn tỉnh lẻ: 1.500.000đ" },
      ],
    },
    {
      title: "Banner Web + Mobile Web (Combo)",
      sizeLabel: "Sản phẩm",
      rows: [
        { name: "CVR-BANNER Combo Homepage", size: "Banner Homepage 1 + Mobile Homepage", price: "10.000.000đ", pos: "Web + Mobile", note: "Chiết khấu 20%" },
        { name: "CVR-BANNER Combo Listing", size: "Banner Listing 1 + Mobile Listing", price: "8.900.000đ", pos: "Web + Mobile", note: "Chiết khấu 15%" },
      ],
    },
  ],
  featureRows: [
    { label: "Thứ hạng tin đăng", values: ["1", "2", "3", "4"] },
    { label: "Kích thước tin đăng", values: ["Rất lớn", "Lớn", "Trung bình", "Nhỏ nhất"] },
    { label: "Hiển thị mô tả tin đăng", values: ["✓", "✓", "✓", "✓"] },
    { label: "Hiển thị thông tin người bán", values: ["✓", "✓", "✓", "✓"] },
    { label: "Hiển thị nút gọi điện", values: ["✓", "✓", "✓", "✓"] },
    { label: "Chèn link mô tả tin đăng", values: ["✓", "—", "—", "—"] },
    { label: "Ưu tiên hiển thị sớm (*)", values: ["✓", "✓", "✓", "—"] },
    { label: "Không hiển thị quảng cáo (**)", values: ["✓", "✓", "—", "—"] },
    { label: "Nhân đôi hiển thị (***)", values: ["✓", "—", "—", "—"] },
  ],
  rules: [
    "(*) Ưu tiên hiển thị sớm: các tin VIP (CVR Diamond, CVR Gold và CVR Silver) được ưu tiên hiển thị và kiểm duyệt trước.",
    "(**) Không hiển thị quảng cáo: ở trang chi tiết tin đăng, trên cả giao diện desktop và mobile sẽ không xuất hiện banner quảng cáo — người xem tập trung tối đa vào nội dung tin.",
    "(***) Nhân đôi hiển thị: chức năng đặc biệt của CVR Diamond — khi tạo tin, khách hàng được tặng kèm một Tin thường hiển thị đồng thời ở trang kết quả tìm kiếm; khi Đẩy tin CVR Diamond, tin thường đi kèm cũng được đẩy miễn phí.",
    "Việc hiển thị tin đăng trên Sàn dựa trên các tiêu chí gồm nhưng không giới hạn ở: loại gói dịch vụ (tin thường, CVR Silver, CVR Gold, CVR Diamond), thời điểm đăng tin và các tiêu chí kỹ thuật khác theo quy định của Sàn tại từng thời điểm.",
  ],
  hotline: "0377 985 036",
};
