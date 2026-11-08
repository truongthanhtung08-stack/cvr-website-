"use client";

import Link, { useLinkStatus } from "next/link";
import BieuTuong, { type TenBieuTuong } from "@/components/BieuTuong";
import { BIEU_TUONG } from "@/lib/bieuTuong";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSaved } from "@/lib/useSaved";
import { useAuth } from "@/lib/useAuth";
import { useSoViecKhach, tongSoViec } from "@/lib/useSoTinCanXem";
import { resetHomeIfOnHome } from "@/components/HomeExpand";
import { ZALO_OA_URL } from "@/lib/lienHe";
import { useAnKhiCuon } from "@/lib/useAnKhiCuon";

// Trang có thanh dưới (người mua có nút Tin nhắn; khu Tài khoản thì nút chat nổi đè thẻ "Số dư ví" — lỗi 23) — Chatbox ẩn nút
// chat nổi trên điện thoại ở mọi trang có thanh dưới (07/11/2026)
export function coThanhChat(pathname: string) {
  return !HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
}

// ── Thanh tab DƯỚI CÙNG — chỉ hiện trên điện thoại/tablet (< lg). Desktop KHÔNG đổi gì.
//
// Chuẩn Apple (iOS Tab Bar):
//   · Chiều cao 49pt + đệm thêm đúng safe-area (thanh Home iPhone).
//   · Nền kính mờ saturate(180%) blur(20px) — cùng công thức với .nav-glass của header.
//   · Viền trên là sợi tóc thật (0.5px trên màn retina).
//   · Icon 25px: mục KHÔNG chọn = nét mảnh · mục ĐANG chọn = ĐẶC (filled) + màu nhấn.
//   · Nhãn 10px, tracking âm nhẹ. Vùng chạm ≥ 49px.

// fill = null → mục đang chọn vẽ NÉT ĐẬM (bộ Tabler không có bản tô đặc)
type IconPair = { line: React.ReactNode; fill: React.ReactNode | null };

const ICONS: Record<string, IconPair> = {
  // Ngôi nhà
  home: {
    line: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.4 12 4.3l7.5 6.1V19a1.6 1.6 0 0 1-1.6 1.6h-3.3v-5.9H9.4v5.9H6.1A1.6 1.6 0 0 1 4.5 19Z" />,
    fill: <path d="M11.06 3.03a1.5 1.5 0 0 1 1.88 0l7.5 6.1c.35.29.56.72.56 1.17V19a2.6 2.6 0 0 1-2.6 2.6h-3.3a1 1 0 0 1-1-1v-4.9h-4.2v4.9a1 1 0 0 1-1 1H6.1A2.6 2.6 0 0 1 3.5 19v-8.7c0-.45.21-.88.56-1.17Z" />,
  },
  // Thẻ giá — Mua bán
  tag: {
    line: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.1 3.6h5.8a1.5 1.5 0 0 1 1.5 1.5v5.8a1.5 1.5 0 0 1-.44 1.06l-7.7 7.7a1.5 1.5 0 0 1-2.12 0l-5.8-5.8a1.5 1.5 0 0 1 0-2.12l7.7-7.7a1.5 1.5 0 0 1 1.06-.44Z" />
        <path strokeLinecap="round" strokeWidth={2.6} d="M16.4 7.6h.01" />
      </>
    ),
    fill: <path fillRule="evenodd" clipRule="evenodd" d="M13.1 3.1h5.8A2 2 0 0 1 20.9 5.1v5.8a2 2 0 0 1-.59 1.42l-7.7 7.7a2 2 0 0 1-2.83 0l-5.8-5.8a2 2 0 0 1 0-2.83l7.7-7.7a2 2 0 0 1 1.42-.59Zm3.3 3.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />,
  },
  // Toà nhà — Cho thuê
  building: {
    line: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.4 20.5V6a1.6 1.6 0 0 1 1.6-1.6h5a1.6 1.6 0 0 1 1.6 1.6v14.5M12.6 20.5V10.6h5.4A1.6 1.6 0 0 1 19.6 12.2v8.3M3 20.5h18" />
        <path strokeLinecap="round" d="M7.2 8.3h2.2M7.2 12h2.2M7.2 15.7h2.2M15.2 14.3h1.7M15.2 17.4h1.7" />
      </>
    ),
    fill: (
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 3.4h5a2.6 2.6 0 0 1 2.6 2.6v3.6H18a2.6 2.6 0 0 1 2.6 2.6v8.3H22a.75.75 0 0 1 0 1.5H2a.75.75 0 0 1 0-1.5h1.4V6A2.6 2.6 0 0 1 6 3.4Zm1.2 3.9a.75.75 0 0 0 0 1.5h2.2a.75.75 0 0 0 0-1.5H7.2Zm0 3.7a.75.75 0 0 0 0 1.5h2.2a.75.75 0 0 0 0-1.5H7.2Zm0 3.7a.75.75 0 0 0 0 1.5h2.2a.75.75 0 0 0 0-1.5H7.2Zm8 -.9a.75.75 0 0 0 0 1.5h1.7a.75.75 0 0 0 0-1.5h-1.7Zm0 3.1a.75.75 0 0 0 0 1.5h1.7a.75.75 0 0 0 0-1.5h-1.7Z"
      />
    ),
  },
  // Mua bán · Cho thuê · Dự án lấy từ BỘ BIỂU TƯỢNG CHUNG (src/lib/bieuTuong.ts) — menu, thanh tab, ô tìm trang chủ cùng một hình (25/10/2026)
  muaBan: {
    line: <path d={BIEU_TUONG.muaBan} />,
    fill: null,
  },
  choThue: {
    line: <path d={BIEU_TUONG.choThue} />,
    fill: null,
  },
  duAnC: {
    line: <path d={BIEU_TUONG.duAn} />,
    fill: null,
  },
  // Hai toà tháp — Dự án
  duAn: {
    line: (
      <>
        <rect x="3.5" y="8.5" width="7" height="11.5" rx="1" />
        <rect x="12" y="4" width="8" height="16" rx="1" />
        <path strokeLinecap="round" d="M2.5 20.5h19M6 11.6h2M6 14.6h2M15 7.2h2M15 10.6h2M15 14h2" />
      </>
    ),
    fill: (
      <>
        <rect x="3.4" y="8.4" width="7.2" height="12.2" rx="1.2" />
        <rect x="11.9" y="3.9" width="8.2" height="16.7" rx="1.2" />
      </>
    ),
  },
  // Bốn ô — Tổng quan (chế độ người bán)
  grid: {
    line: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />,
    fill: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  },
  // Tờ tin — Tin đăng (chế độ người bán)
  doc: {
    line: <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5h7.5l4.5 4.5v11.4a1.6 1.6 0 0 1-1.6 1.6H7a1.6 1.6 0 0 1-1.6-1.6V5.1A1.6 1.6 0 0 1 7 3.5ZM9 12.5h6M9 16h6M9 9h3" />,
    fill: <path fillRule="evenodd" clipRule="evenodd" d="M7 3h7.7c.27 0 .52.1.7.29l4.4 4.4c.2.19.3.44.3.71v11a2.1 2.1 0 0 1-2.1 2.1H7a2.1 2.1 0 0 1-2.1-2.1V5.1A2.1 2.1 0 0 1 7 3Zm2 5.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5H9Zm0 3.5a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5H9Zm0 3.5a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5H9Z" />,
  },
  // Dấu cộng trong vòng tròn — Đăng tin (chế độ người bán)
  plus: {
    line: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z" />,
    fill: <path fillRule="evenodd" clipRule="evenodd" d="M12 2.75a9.25 9.25 0 1 0 0 18.5 9.25 9.25 0 0 0 0-18.5Zm.75 5.25a.75.75 0 0 0-1.5 0v3.25H8a.75.75 0 0 0 0 1.5h3.25V16a.75.75 0 0 0 1.5 0v-3.25H16a.75.75 0 0 0 0-1.5h-3.25V8Z" />,
  },
  // Hai người — Khách hàng (chế độ người bán)
  users: {
    line: <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 19.5v-1a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v1M9.5 11a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM20.5 19.5v-1a4 4 0 0 0-3-3.87M15.25 4.63a3.25 3.25 0 0 1 0 6.24" />,
    fill: <path d="M9.5 3.75a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM7.5 13.75A4.75 4.75 0 0 0 2.75 18.5v1a.75.75 0 0 0 .75.75h12a.75.75 0 0 0 .75-.75v-1a4.75 4.75 0 0 0-4.75-4.75h-4ZM15.4 4.05a.75.75 0 0 1 .95-.47 4 4 0 0 1 0 7.59.75.75 0 1 1-.48-1.42 2.5 2.5 0 0 0 0-4.75.75.75 0 0 1-.47-.95ZM17.1 14.4a.75.75 0 0 1 .91-.54 4.75 4.75 0 0 1 3.24 4.64v1a.75.75 0 0 1-1.5 0v-1a3.25 3.25 0 0 0-2.1-3.19.75.75 0 0 1-.55-.91Z" />,
  },
  // Người dùng — Tài khoản
  user: {
    line: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.9 8.2a3.9 3.9 0 1 1-7.8 0 3.9 3.9 0 0 1 7.8 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.9 20.6a7.1 7.1 0 0 1 14.2 0" />
      </>
    ),
    fill: <path d="M12 3.55a4.65 4.65 0 1 0 0 9.3 4.65 4.65 0 0 0 0-9.3ZM12 14.1a7.85 7.85 0 0 0-7.85 6.9 1 1 0 0 0 1 1.1h13.7a1 1 0 0 0 1-1.1A7.85 7.85 0 0 0 12 14.1Z" />,
  },
};

// Dùng chung cho menu mục đích của bộ lọc trang chủ (chủ dự án 17/10/2026: "đồng bộ icon toàn trang web")
export type TenIcon = keyof typeof ICONS;
// Vẽ qua BỘ BIỂU TƯỢNG CHUNG (Phosphor, 25/10/2026): thường = nét, đang chọn = tô đặc. Giữ tên cũ để nơi gọi không đổi.
const TEN_PHOSPHOR: Record<string, TenBieuTuong> = {
  home: "trangChu", tag: "baoGia", building: "duAn", muaBan: "muaBan", choThue: "choThue", duAnC: "duAn", duAn: "duAn",
  grid: "tongQuan", doc: "tinDang", plus: "dangTin", users: "khachHang", user: "taiKhoan", tim: "tim",
};
export function TabIcon({ name, active, className = "h-[25px] w-[25px]" }: { name: TenIcon; active: boolean; className?: string }) {
  return <BieuTuong ten={TEN_PHOSPHOR[name] ?? "trangChu"} dac={active} className={className} />;
}

// ── Nội dung 1 tab — ĐẶT BÊN TRONG <Link> để dùng useLinkStatus ────────────
// useLinkStatus cho biết cú chạm vào ĐÚNG link này có đang chờ trang mới không.
// Nhờ vậy tab sáng lên + icon chuyển sang nét đặc NGAY khi ngón tay nhấc lên,
// không phải đợi máy chủ trả dữ liệu (trước đây chạm xong tab vẫn xám → tưởng máy treo).
function TabBody({
  icon,
  label,
  on,
  badge,
}: {
  icon: keyof typeof ICONS;
  label: string;
  on: boolean;
  badge?: number;
}) {
  const { pending } = useLinkStatus();
  const active = on || pending;

  return (
    <span
      className={`press flex min-h-[50px] flex-col items-center justify-center gap-[3px] py-0.5 transition-colors duration-200 ${
        active ? "text-cvr-blue" : "text-cvr-muted"
      }`}
    >
      <span className="relative">
        <TabIcon name={icon} active={active} className="h-[26px] w-[26px]" />
        {badge ? (
          <span className="absolute -right-1.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="whitespace-nowrap text-[12px] font-medium leading-none tracking-[-0.01em]">{label}</span>
    </span>
  );
}

// Trang KHÔNG hiện tab bar: đã có thanh hành động riêng dưới đáy, hoặc là luồng
// toàn màn hình (đăng nhập / đăng tin / admin) — tab bar chỉ gây rối và che nút.
const HIDDEN_PREFIXES = [
  "/admin",
  "/bat-dong-san/", // đã có thanh Gọi · Zalo dính đáy
  "/dang-nhap",
  "/dang-ky",
  "/quen-mat-khau",
  "/dang-tin",
  "/auth",
];

export default function MobileTabBar() {
  const pathname = usePathname() || "/";
  const { count } = useSaved();
  const { user } = useAuth();
  // Chấm đỏ "Tin đăng" (chế độ người bán): chờ duyệt · bị từ chối · sắp hết hạn — chỉ đếm khi đang ở khu tài khoản (06/11/2026)
  // Đăng nhập rồi thì Ở MỌI TRANG đều đếm (chủ dự án 06/11/2026: "đăng nhập vào một tài khoản thì tất cả giống nhau")
  const soViec = useSoViecKhach(user?.id, pathname);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  // CHẾ ĐỘ NGƯỜI BÁN — vào khu quản lý tài khoản thì chính thanh này đổi sang
  // 5 nút của người đăng tin (như app Batdongsan), không chồng thêm thanh thứ hai.
  // Muốn quay về chế độ người mua: bấm logo ở đầu trang.
  if (pathname.startsWith("/tai-khoan")) {
    const tabsBan = [
      { href: "/tai-khoan", label: "Tổng quan", icon: "grid" as const, on: pathname === "/tai-khoan" },
      { href: "/tai-khoan/tin-dang", label: "Tin đăng", icon: "doc" as const, on: pathname.startsWith("/tai-khoan/tin-dang") },
        { href: "/tai-khoan/khach-hang", label: "Khách hàng", icon: "users" as const, on: pathname.startsWith("/tai-khoan/khach-hang") },
      {
        href: "/tai-khoan/ca-nhan",
        label: "Hồ sơ", // MỘT TÊN với thanh trang công khai + menu ≡ (07/11/2026)
        icon: "user" as const,
        on: pathname !== "/tai-khoan" && !pathname.startsWith("/tai-khoan/tin-dang") && !pathname.startsWith("/tai-khoan/khach-hang"),
      },
    ];
    // Nút ‹ trong khu quản lý đi theo tầng, Tổng quan là trang chủ (BackBar.tsx).
    return <ThanhTab tabs={tabsBan} count={0} soViec={soViec} nutDangTinNoi dangTinBang />; // nút bằng nhau như thanh trang công khai (07/11/2026)
  }

  // THANH DƯỚI GỌN (chủ dự án 07/11/2026): bỏ Mua bán · Cho thuê · Dự án — ô tìm tự đọc mục đích sang đúng mục, menu ≡ có đủ
  // ba mục; chỗ trống dành cho Chat (thay nút chat nổi đè nội dung) và Đăng tin. Chỉ điện thoại; máy tính không có thanh này.
  // CHUẨN (anh 08/11/2026: "chuẩn chỉ có 1" · "bấm vào thì mới xanh, và chỉ xanh khi đang ở đó"): mỗi nút chỉ xanh ở ĐÚNG trang của
  // nó, tối đa một nút xanh; trang không có nút riêng (Mua bán, Cho thuê, Dự án…) thì không nút nào xanh.
  const onLuu = pathname.startsWith("/tin-luu");
  const onDang = pathname.startsWith("/dang-tin");
  const onHoSo = pathname.startsWith("/tai-khoan") || pathname.startsWith("/dang-nhap") || pathname.startsWith("/dang-ky");
  const tabs = [
    // THỨ TỰ (chủ dự án 07/11/2026): Trang chủ · ♡ Lưu · + Đăng tin (giữa) · Tin nhắn · Tài khoản
    { href: "/", label: "Home", icon: "home" as const, on: pathname === "/" }, // chủ dự án 07/11/2026: "Trang chủ = Home"
    // ♡ TIN ĐÃ LƯU chuyển từ đầu trang xuống đây (chủ dự án 07/11/2026) — cùng chữ "Lưu", cùng chấm đỏ đếm số tin như nút đầu trang
    { href: "/tin-luu", label: "Lưu", icon: "tim" as const, on: onLuu },
    { href: "/dang-tin", label: "Đăng tin", icon: "plus" as const, on: onDang },
    // TIN NHẮN = nút chat chuẩn của web (cùng hình bong bóng, cùng đường Zalo OA với nút chat nổi) — chủ dự án 07/11/2026
    { href: ZALO_OA_URL, label: "Tin nhắn", icon: "home" as const, on: false, ngoai: true },
    {
      href: user ? "/tai-khoan" : "/dang-nhap",
      label: "Hồ sơ", // chủ dự án 07/11/2026: "Tài khoản = Hồ sơ"
      icon: "user" as const,
      on: onHoSo,
    },
  ];

  // Đăng tin = ĐÚNG NÚT CHUẨN của thanh khu Tài khoản (vòng tròn xanh dấu + trắng) — chủ dự án 07/11/2026, ảnh điện thoại
  return <ThanhTab tabs={tabs} count={count} soViec={{ "/tai-khoan": tongSoViec(soViec) }} nutDangTinNoi dangTinBang />;
}

// Khung thanh tab — dùng chung cho chế độ người mua và chế độ người bán.
function ThanhTab({ tabs, count, soViec = {}, nutDangTinNoi = false, dangTinBang = false }: { dangTinBang?: boolean; tabs: { href: string; label: string; icon: keyof typeof ICONS; on: boolean; ngoai?: boolean }[]; count: number; soViec?: Record<string, number>; nutDangTinNoi?: boolean }) {
  // ĐANG CUỘN thì trượt thanh xuống khuất, DỪNG CUỘN 0,35 s thì hiện lại (chủ dự án 02/11/2026: "cần không gian hiển thị trên mobile, ẩn
  // luôn menu ở footer khi cuộn"). Thanh nằm cố định đè lên trang nên ẩn / hiện không làm nội dung xê dịch.
  // Bộ đo chung với hàng trường lọc (08/11/2026): cuộn xuống quá 12px mới ẩn, cuộn lên hiện ngay, dừng tay hiện lại — hai thanh cùng nhịp
  const anKhiCuon = useAnKhiCuon();
  // BẤM LÀ SÁNG NGAY (anh 08/11/2026): chạm nút nào thì nút đó sáng ngay lúc chạm, nút cũ tắt — không chờ trang mới tải xong (trước: hai
  // nút cùng sáng trong lúc chờ). Sang trang xong thì về luật "trang nào nút đó" (t.on).
  const pathname = usePathname();
  const [chon, setChon] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- đã sang trang mới: bỏ nút chạm tạm, theo đường dẫn thật
  useEffect(() => { setChon(null); }, [pathname]);
  const sang = (t: { href: string; on: boolean }) => (chon ? t.href === chon : t.on);
  // Chỉ ghi "vừa bấm" khi SANG TRANG KHÁC — bấm nút của chính trang đang đứng (Home ở trang chủ) thì không ghi, kẻo nút kẹt xanh mãi vì
  // đường dẫn không đổi (lỗi 08/11/2026: bấm Home rồi chọn Cho thuê, Home vẫn xanh)
  const bam = (href: string) => { if (href !== pathname) setChon(href); };
  return (
    <>
      {/* Chỗ trống cuối trang để tab bar không che nội dung/footer */}
      <div className="h-[var(--tabbar-h)] shrink-0 lg:hidden" aria-hidden />

      <nav
        aria-label="Điều hướng nhanh"
        data-do-cao="tabbar-h"
        className={`an-khi-go-phim tabbar-glass fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] chuyen-an-hien lg:hidden ${anKhiCuon ? "pointer-events-none translate-y-full" : ""}`}
        // HIỆU ỨNG BẤM (anh 08/11/2026: "bấm vào hàng menu dưới không có hiệu ứng nào, bấm không biết đã bấm hay chưa"): :active trên
        // điện thoại chỉ hiện khi giữ ngón tay đủ lâu (iPhone bỏ qua hẳn) → chạm là gắn lớp "vua-bam" 280ms cho nút đó (nhún + vệt sáng).
        onPointerDown={(e) => {
          const li = (e.target as HTMLElement).closest("li");
          if (!li) return;
          li.classList.remove("vua-bam");
          void li.offsetWidth; // chạm liên tiếp vẫn chạy lại hiệu ứng
          li.classList.add("vua-bam");
          window.setTimeout(() => li.classList.remove("vua-bam"), 280);
        }}
      >
        <ul className="flex items-stretch">
          {tabs.map((t) => (
            <li key={t.href} className="flex-1">
              {t.ngoai ? (
                // CHAT = mở Zalo OA của Coastal Land (cùng đường dẫn nút chat nổi cũ). Đường dẫn thật, không window.open: iPhone và trình
                // duyệt trong Zalo / Facebook chặn cửa sổ mở bằng mã.
                <a href={t.href} target="_blank" rel="noopener noreferrer" aria-label="Nhắn tin cho Coastal Land qua Zalo" className="press flex min-h-[50px] flex-col items-center justify-center gap-[3px] py-0.5 text-cvr-muted">
                  {/* bong bóng tin nhắn kiểu Apple Messages (anh 07/11/2026): bầu dục ngang, đuôi cong góc dưới trái; nét 1,6 bằng nét Home · Lưu · Hồ sơ */}
                  <svg className="h-[26px] w-[26px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 3.75c-4.97 0-9 3.3-9 7.38 0 2.27 1.25 4.3 3.22 5.66-.17 1.33-.83 2.5-1.82 3.3 1.86.08 3.52-.5 4.72-1.47.92.24 1.88.36 2.88.36 4.97 0 9-3.3 9-7.38S16.97 3.75 12 3.75Z" />
                  </svg>
                  <span className="whitespace-nowrap text-[12px] font-medium leading-none tracking-[-0.01em]">{t.label}</span>
                </a>
              ) : nutDangTinNoi && t.href === "/dang-tin" ? (
                // ĐĂNG TIN = NÚT CHÍNH của khu quản lý (25/09): vòng tròn xanh. 22/10/2026 chủ dự án: "cân đối, không phải
                // cứ to là nổi bật mà cản trở giao diện" → bỏ nhô lên, cùng cỡ + cùng hàng với các tab khác, không che nội dung.
                <Link href={t.href} onClick={() => bam(t.href)} aria-label="Đăng tin" className={`press relative flex min-h-[50px] flex-col items-center justify-center ${dangTinBang ? "gap-[3px] py-0.5" : "-top-[6px] gap-px"}`}>
                  {/* 22/10/2026 chủ dự án: giữ kiểu cũ, to hơn một chút — 35px. 29/10/2026: to thêm chút nữa + nhô lên một chút → 38px,
                      cả nút dời lên 6px để chữ "Đăng tin" thẳng hàng chữ các nút khác (vòng tròn nhô khỏi thanh ~5px). Các nút khác giữ nguyên. */}
                  {/* dangTinBang (thanh trang công khai, chủ dự án 07/11/2026: "các menu bằng nhau hết"): cùng kiểu vòng tròn xanh, cỡ BẰNG biểu tượng các nút khác, không nhô */}
                  {dangTinBang ? (
                    // thanh công khai: CÙNG MỘT KIỂU với Home · Lưu · Tin nhắn · Hồ sơ — biểu tượng nét 1,6 cỡ 26px, không vòng tròn đặc nhô lên; chỉ khác màu xanh
                    // (anh 08/11/2026 tối: "thanh điều hướng treo ngoe — chuẩn nào ra chuẩn ấy, một kiểu")
                    <svg className="h-[26px] w-[26px] text-cvr-blue" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden>
                      <circle cx="12" cy="12" r="9" />
                      <path strokeLinecap="round" d="M12 8v8M8 12h8" />
                    </svg>
                  ) : (
                  <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-cvr-blue text-white">
                    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  )}
                  <span className={`whitespace-nowrap text-[12px] font-medium leading-none tracking-[-0.01em] text-cvr-blue`}>{t.label}</span>
                </Link>
              ) : (
              <Link
                href={t.href}
                onClick={() => { bam(t.href); if (t.href === "/") resetHomeIfOnHome(); }}
                aria-current={sang(t) ? "page" : undefined}
                className="block"
              >
                <TabBody
                  icon={t.icon}
                  label={t.label}
                  on={sang(t)}
                  badge={t.href === "/tin-luu" ? count : t.href === "/tai-khoan/ca-nhan" ? (soViec["/tai-khoan/nap-tien"] ?? 0) + (soViec["/tai-khoan/hoi-vien"] ?? 0) : soViec[t.href] ?? 0}
                />
              </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
