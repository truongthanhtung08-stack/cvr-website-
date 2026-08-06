"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { packages, utilityTools } from "@/lib/packages";
import { haptic } from "@/lib/haptic";
import { useSaved } from "@/lib/useSaved";
import { useAuth, displayName, signOut } from "@/lib/useAuth";

// href KHÔNG bắt buộc: mục chỉ có `children` là NHÃN NHÓM (không bấm được),
// dùng để gom danh mục — tránh link cha trỏ trùng một mục con.
type NavChild = { label: string; href?: string; children?: NavChild[] };
// icon = path 'd' của SVG (24x24, outline) — hiện bên trái mỗi mục trong menu Mobile (kiểu Batdongsan).
type NavItem = { label: string; href: string; children?: NavChild[]; icon?: string };

// Icon cho từng mục menu Mobile (outline, chuẩn Apple)
const ICONS = {
  duAn: "M3 21h18M5 21V5a1 1 0 011-1h5a1 1 0 011 1v16M13 21V9a1 1 0 011-1h4a1 1 0 011 1v12M8 7h.01M8 11h.01M8 15h.01M16 12h.01M16 16h.01",
  muaBan: "M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9",
  choThue: "M3 21h18M6 21V7a1 1 0 011-1h4a1 1 0 011 1v14M14 21V11a1 1 0 011-1h3a1 1 0 011 1v10M8.5 9h.01M8.5 13h.01",
  tinTuc: "M4 5a1 1 0 011-1h10a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM16 8h3a1 1 0 011 1v9a2 2 0 01-2 2M7 8h6M7 12h6M7 16h4",
  chuyenGia: "M16 20v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M10 11a4 4 0 100-8 4 4 0 000 8zM18 8v6M21 11h-6",
  tienIch: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
};

// Đầy đủ loại hình BĐS bán (kiểu Homedy)
const loaiHinhBan: NavChild[] = [
  { label: "Căn hộ chung cư", href: "/mua-ban/can-ho-chung-cu" },
  { label: "Nhà riêng", href: "/mua-ban/nha-rieng" },
  { label: "Nhà biệt thự, liền kề", href: "/mua-ban/biet-thu-lien-ke" },
  { label: "Nhà mặt phố", href: "/mua-ban/nha-mat-pho" },
  { label: "Shophouse, nhà phố thương mại", href: "/mua-ban/shophouse" },
  { label: "Đất nền dự án", href: "/mua-ban/dat-nen-du-an" },
  { label: "Đất", href: "/mua-ban/dat" },
  { label: "Trang trại, khu nghỉ dưỡng", href: "/mua-ban/trang-trai-nghi-duong" },
  { label: "Condotel", href: "/mua-ban/condotel" },
  { label: "Kho, nhà xưởng", href: "/mua-ban/kho-nha-xuong" },
  { label: "Bất động sản khác", href: "/mua-ban/bds-khac" },
];

// Đầy đủ loại hình BĐS cho thuê (kiểu Homedy)
const loaiHinhThue: NavChild[] = [
  { label: "Căn hộ chung cư", href: "/cho-thue/can-ho-chung-cu" },
  { label: "Nhà riêng", href: "/cho-thue/nha-rieng" },
  { label: "Nhà biệt thự, liền kề", href: "/cho-thue/biet-thu-lien-ke" },
  { label: "Nhà mặt phố", href: "/cho-thue/nha-mat-pho" },
  { label: "Shophouse, nhà phố thương mại", href: "/cho-thue/shophouse" },
  { label: "Nhà trọ, phòng trọ", href: "/cho-thue/phong-tro" },
  { label: "Văn phòng", href: "/cho-thue/van-phong" },
  { label: "Cửa hàng, ki ốt", href: "/cho-thue/cua-hang-ki-ot" },
  { label: "Kho, nhà xưởng, đất", href: "/cho-thue/kho-nha-xuong" },
  { label: "Bất động sản khác", href: "/cho-thue/bds-khac" },
];

const loaiHinhDuAn: NavChild[] = [
  { label: "Căn hộ chung cư", href: "/du-an/can-ho-chung-cu" },
  { label: "Khu đô thị mới", href: "/du-an/khu-do-thi-moi" },
  { label: "Khu nghỉ dưỡng, sinh thái", href: "/du-an/khu-nghi-duong" },
  { label: "Nhà ở xã hội", href: "/du-an/nha-o-xa-hoi" },
  { label: "Cao ốc văn phòng", href: "/du-an/cao-oc-van-phong" },
  { label: "Trung tâm thương mại", href: "/du-an/trung-tam-thuong-mai" },
  { label: "Biệt thự, liền kề", href: "/du-an/biet-thu-lien-ke" },
  { label: "Shophouse", href: "/du-an/shophouse" },
];

const danhMucChuyenGia: NavChild[] = [
  { label: "Danh bạ chuyên gia", href: "/chuyen-gia" },
  { label: "Chuyên gia tại Đà Nẵng", href: "/chuyen-gia/da-nang" },
  { label: "Chuyên gia tại Huế", href: "/chuyen-gia/hue" },
  { label: "Sàn giao dịch, công ty BĐS", href: "/chuyen-gia/cong-ty" },
  { label: "Trở thành chuyên gia", href: "/chuyen-gia/dang-ky" },
];

// Menu Tiện ích — Báo giá dịch vụ ở TRÊN CÙNG, dưới là 2 nhóm: Dịch vụ · Công cụ tiện ích.
// "Dịch vụ" / "Công cụ tiện ích" chỉ là NHÃN NHÓM (không có href) — trước đây trỏ trùng
// mục con đầu tiên (goi-dang-tin, so-sanh-nha-dat) gây link thừa.
const danhMucTienIch: NavChild[] = [
  {
    label: "Báo giá dịch vụ và truyền thông",
    href: "/bao-gia-dang-tin",
  },
  {
    label: "Dịch vụ",
    children: packages.map((item) => ({ label: item.label, href: `/tien-ich/${item.slug}` })),
  },
  {
    label: "Công cụ tiện ích",
    children: utilityTools.map((item) => ({ label: item.label, href: `/tien-ich/${item.slug}` })),
  },
];

// Thứ tự menu: Dự án · Mua bán · Cho thuê · Tin tức · Chuyên gia · Tiện ích
const navItems: NavItem[] = [
  { label: "Dự án", href: "/du-an", children: loaiHinhDuAn, icon: ICONS.duAn },
  { label: "Mua bán", href: "/mua-ban", children: loaiHinhBan, icon: ICONS.muaBan },
  { label: "Cho thuê", href: "/cho-thue", children: loaiHinhThue, icon: ICONS.choThue },
  { label: "Tin tức", href: "/tin-tuc", icon: ICONS.tinTuc },
  { label: "Chuyên gia", href: "/chuyen-gia", children: danhMucChuyenGia, icon: ICONS.chuyenGia },
  { label: "Tiện ích", href: "/bao-gia-dang-tin", children: danhMucTienIch, icon: ICONS.tienIch },
];

const chevronDown = (
  <svg
    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// Panel dropdown nền trắng (tương phản trên header tối, kiểu flyout Apple)
// align="right": mở dọc mép phải (dùng cho menu tài khoản ở sát mép phải — tránh
// panel w-64 canh giữa bị TRÀN sang phải gây kéo lệch trang trên mobile khi đăng nhập).
function DropdownPanel({
  children,
  align = "center",
  wide = false,
}: {
  children: React.ReactNode;
  align?: "center" | "right";
  wide?: boolean;
}) {
  const pos = align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
  return (
    <div className={`invisible absolute top-full z-50 ${wide ? "w-[600px]" : "w-64"} pt-3 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100 ${pos}`}>
      <div className="origin-top translate-y-1.5 scale-[0.98] overflow-hidden rounded-2xl border border-cvr-line bg-white p-2 opacity-0 shadow-xl shadow-black/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
        {children}
      </div>
    </div>
  );
}

// Một dòng trong dropdown desktop — ô bo tròn, sáng nền khi rê chuột (kiểu Apple),
// KHÔNG dùng đường kẻ phân chia.
function DropdownItem({ href, label, strong = false }: { href: string; label: string; strong?: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-xl px-3.5 py-2.5 text-sm transition-colors hover:bg-cvr-surface ${
        strong ? "font-semibold text-cvr-ink" : "font-medium text-cvr-body hover:text-cvr-ink"
      }`}
    >
      {label}
    </Link>
  );
}

function NavLink({ item }: { item: NavItem }) {
  if (!item.children) {
    return (
      <Link
        href={item.href}
        className="nav-link text-sm font-medium text-cvr-line transition-colors hover:text-white"
      >
        {item.label}
      </Link>
    );
  }

  // Mục có NHÓM con (hiện chỉ "Tiện ích") → panel rộng 2 cột kiểu mega-menu Apple.
  const groups = item.children.filter((c) => c.children?.length);
  const singles = item.children.filter((c) => !c.children?.length);

  return (
    <div className="group relative">
      <Link
        href={item.href}
        className="nav-link text-sm font-medium text-cvr-line transition-colors group-hover:text-white"
      >
        {item.label}
      </Link>

      {groups.length ? (
        // ── Panel 2 phần: (1) mục nổi bật ở TRÊN CÙNG (Báo giá dịch vụ) ·
        //    (2) hai nhóm Dịch vụ | Công cụ tiện ích xếp 2 cột.
        <DropdownPanel wide>
          {singles.map((c) => (
            <Link
              key={c.label}
              href={c.href ?? "#"}
              className="mb-1 flex items-center justify-between rounded-xl bg-cvr-surface px-4 py-3 transition-colors hover:bg-cvr-line/50"
            >
              <span className="text-sm font-semibold text-cvr-ink">{c.label}</span>
              <span className="text-sm font-semibold text-cvr-gold-ink">→</span>
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-x-4">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="px-3.5 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-cvr-faint">
                  {g.label}
                </p>
                {g.children?.map((c) => (
                  <DropdownItem key={c.label} href={c.href ?? "#"} label={c.label} />
                ))}
              </div>
            ))}
          </div>
        </DropdownPanel>
      ) : (
        <DropdownPanel>
          {item.children.map((c) => (
            <DropdownItem key={c.label} href={c.href ?? "#"} label={c.label} strong />
          ))}
        </DropdownPanel>
      )}
    </div>
  );
}

// Nút "Lưu" — dẫn tới danh sách tin đã lưu
// ♡ Yêu thích trên thanh header (kiểu Batdongsan): MOBILE = icon trái tim,
// DESKTOP (lg) = có thêm chữ "Lưu" (giữ nguyên như đã duyệt).
// MOBILE: bọc trong ô chạm 44×44 (chuẩn Apple) để cân với nút ☰ và không dính sát mép;
//         có huy hiệu đếm số tin đã lưu như Batdongsan.
function SaveButton() {
  const { count } = useSaved();

  return (
    <Link
      href="/tin-luu"
      aria-label={count > 0 ? `Tin đã lưu (${count})` : "Tin đã lưu"}
      className="relative flex h-11 w-11 items-center justify-center text-cvr-line transition-colors hover:text-white lg:h-auto lg:w-auto lg:gap-1.5"
    >
      <svg className="h-[22px] w-[22px] lg:h-[18px] lg:w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
      </svg>
      {count > 0 && (
        <span className="absolute right-[7px] top-[7px] flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold leading-none text-white lg:hidden">
          {count > 9 ? "9+" : count}
        </span>
      )}
      <span className="hidden text-sm font-medium lg:inline">Lưu</span>
    </Link>
  );
}

// Menu tài khoản khi đã đăng nhập (avatar + dropdown)
function AccountMenu({ name, onLogout }: { name: string; onLogout: () => void }) {
  const initial = name.trim().charAt(0).toUpperCase() || "T";
  const links: { label: string; href: string }[] = [
    { label: "Tổng quan", href: "/tai-khoan" },
    { label: "Tin đã đăng", href: "/tai-khoan/tin-dang" },
    { label: "Tin đã lưu", href: "/tin-luu" },
    { label: "Cài đặt tài khoản", href: "/tai-khoan/cai-dat" },
  ];

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 transition-colors"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/15">
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-cvr-line group-hover:text-white lg:inline">
          {name}
        </span>
        {chevronDown}
      </button>

      <DropdownPanel align="right">
        <div className="mb-1 rounded-xl bg-cvr-surface px-3.5 py-2.5">
          <p className="truncate text-sm font-semibold text-cvr-ink">{name}</p>
          <p className="text-xs text-cvr-muted">Thành viên COASTAL LAND</p>
        </div>
        {links.map((child) => (
          <DropdownItem key={child.href} href={child.href} label={child.label} />
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="block w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-cvr-muted transition-colors hover:bg-cvr-surface hover:text-cvr-ink"
        >
          Đăng xuất
        </button>
      </DropdownPanel>
    </div>
  );
}

// ── Menu MOBILE (< lg) — panel trượt xuống kiểu Apple: nền tối, chữ lớn,
//    mục có danh mục con mở dạng accordion. Khoá cuộn nền khi đang mở.
function MobileMenu({
  open,
  onClose,
  user,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: ReturnType<typeof useAuth>["user"];
  onLogout: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Đóng menu thì gập luôn accordion để lần mở sau sạch sẽ
  useEffect(() => {
    if (!open) setExpanded(null);
  }, [open]);

  return (
    <div
      // absolute theo header (KHÔNG dùng fixed: backdrop-filter của .nav-glass biến header
      // thành containing block, fixed sẽ neo sai). top-full = ngay dưới thanh 60px.
      className={`menu-glass absolute inset-x-0 top-full z-40 flex h-[calc(100dvh-60px-env(safe-area-inset-top))] flex-col overflow-y-auto overscroll-contain transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0 pointer-events-none"
      }`}
    >
      <nav className="flex-1 px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-5">
        {/* ── ĐĂNG TIN + (chưa đăng nhập → Đăng nhập/Đăng ký) — đầu menu.
            Kiểu Batdongsan: KHI ĐÃ ĐĂNG NHẬP, tài khoản & avatar nằm ở THANH TRÊN
            (avatar + ♡ + 🔔), KHÔNG lặp lại khối tài khoản trong menu drawer. ── */}
        <div className="mb-7">
          {user ? (
            // Đã đăng nhập — kiểu Batdongsan: [avatar + tên] … [🔔], gần đầu menu.
            <div className="mb-3 flex items-center gap-3">
              <Link href="/tai-khoan" onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-[16px] font-semibold text-white">
                  {displayName(user).trim().charAt(0).toUpperCase() || "T"}
                </span>
                <span className="min-w-0 truncate text-[16px] font-semibold text-white">{displayName(user)}</span>
              </Link>
              <Link
                href="/tai-khoan"
                onClick={onClose}
                aria-label="Thông báo"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors active:bg-white/10"
              >
                <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="mb-3 grid grid-cols-2 gap-2.5">
              <Link
                href="/dang-nhap"
                onClick={onClose}
                className="flex min-h-[46px] items-center justify-center rounded-full text-[15px] font-semibold text-white ring-1 ring-inset ring-white/25 transition-colors active:bg-white/10"
              >
                Đăng nhập
              </Link>
              <Link
                href="/dang-ky"
                onClick={onClose}
                className="flex min-h-[46px] items-center justify-center rounded-full bg-white text-[15px] font-semibold text-cvr-ink transition-transform active:scale-[0.98]"
              >
                Đăng ký
              </Link>
            </div>
          )}

          <Link
            href="/dang-tin"
            onClick={() => { haptic(); onClose(); }}
            className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-full bg-cvr-blue text-[15px] font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Đăng tin ngay
          </Link>
        </div>

        {/* Danh sách menu — KHÔNG dùng đường kẻ phân chia (kiểu Apple): phân tách bằng
            khoảng trắng; mục đang mở được bọc khối kính sáng nhẹ để gom nhóm thị giác. */}
        <div className="space-y-1">
        {navItems.map((item) => (
          <div
            key={item.href}
            className={`-mx-3 rounded-2xl px-3 transition-colors duration-300 ${
              expanded === item.label ? "bg-white/[0.07]" : ""
            }`}
          >
            {item.children ? (
              <>
                {/* Hàng menu tách đôi: BẤM VÀO TÊN = mở trang tổng (xem tất cả) ·
                    BẤM MŨI TÊN = mở/gập danh mục con. Không còn dòng "Xem tất cả". */}
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex min-h-[56px] flex-1 items-center gap-3.5 text-[17px] font-medium text-white"
                  >
                    {item.icon && (
                      <svg className="h-[22px] w-[22px] shrink-0 text-white/75" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                    )}
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                    aria-expanded={expanded === item.label}
                    aria-label={`${expanded === item.label ? "Thu gọn" : "Mở rộng"} ${item.label}`}
                    className="-mr-2 flex h-[56px] w-12 shrink-0 items-center justify-center"
                  >
                    <svg
                      className={`h-4 w-4 text-white/50 transition-transform duration-300 ${expanded === item.label ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <div
                  className="grid"
                  // Inline (không dùng class grid-rows-[..] — Tailwind không sinh rule ổn định)
                  style={{
                    gridTemplateRows: expanded === item.label ? "1fr" : "0fr",
                    transition: "grid-template-rows 300ms cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  {/* pl-9 = 22px icon + gap-3.5 → danh mục con thẳng hàng với CHỮ của mục cha */}
                  <div className="overflow-hidden pb-3 pl-9">
                    {item.children.map((child) => (
                      <div key={child.label}>
                        <div className="py-3">
                          {child.href ? (
                            <Link
                              href={child.href}
                              onClick={onClose}
                              className="block text-[15px] font-semibold text-white/90 transition-colors active:text-white"
                            >
                              {child.label}
                            </Link>
                          ) : (
                            <p className="pb-0.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/50">
                              {child.label}
                            </p>
                          )}
                          {child.children?.length ? (
                            <div className="mt-2.5 space-y-3.5 pl-3.5">
                              {child.children.map((grandChild) => (
                                <Link
                                  key={grandChild.label}
                                  href={grandChild.href ?? "#"}
                                  onClick={onClose}
                                  className="block text-[15px] font-medium text-white/75 transition-colors active:text-white"
                                >
                                  {grandChild.label}
                                </Link>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <Link
                href={item.href}
                onClick={onClose}
                className="flex min-h-[56px] items-center gap-3.5 text-[17px] font-medium text-white"
              >
                {item.icon && (
                  <svg className="h-[22px] w-[22px] shrink-0 text-white/75" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                )}
                {item.label}
              </Link>
            )}
          </div>
        ))}
        </div>

        {/* Hành động phụ — Tin đã lưu · Đăng xuất (tài khoản & đăng tin đã nằm ở ĐẦU menu).
            Icon 22px + gap-3.5 để chữ thẳng hàng với các mục menu chính phía trên.
            Tách khỏi menu chính bằng KHOẢNG TRẮNG, không dùng đường kẻ. */}
        <div className="mt-7">
          <Link
            href="/tin-luu"
            onClick={onClose}
            className="flex min-h-[56px] items-center gap-3.5 text-[16px] font-medium text-white/85"
          >
            <svg className="h-[22px] w-[22px] shrink-0 text-white/60" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
            </svg>
            Tin đã lưu
          </Link>
          {user && (
            <button
              type="button"
              onClick={() => { onLogout(); onClose(); }}
              className="flex min-h-[56px] w-full items-center gap-3.5 text-left text-[16px] font-medium text-white/60"
            >
              <svg className="h-[22px] w-[22px] shrink-0 text-white/45" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 01-2-2V6a2 2 0 012-2h6" />
              </svg>
              Đăng xuất
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`nav-glass sticky top-0 z-50 w-full border-b border-white/10 transition-shadow duration-300 ${
        scrolled ? "shadow-lg shadow-black/25" : ""
      }`}
    >
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo trắng (nền tối) */}
        <Link href="/" aria-label="COASTAL LAND — Trang chủ">
          <BrandLogo size="md" tone="light" />
        </Link>

        {/* Điều hướng */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Hành động: Lưu · (Đăng nhập | Tài khoản) · Đăng tin */}
        <div className="flex items-center gap-1 sm:gap-5">
          <SaveButton />

          {/* Tài khoản/Đăng nhập — CHỈ desktop (lg). MOBILE: avatar + tài khoản nằm TRONG
              drawer menu (kiểu Batdongsan) → thanh header mobile chỉ Logo · ♡ · ☰. */}
          <div className="hidden items-center lg:flex">
            {user ? (
              <AccountMenu name={displayName(user)} onLogout={signOut} />
            ) : (
              <Link
                href="/dang-nhap"
                className="text-sm font-medium text-cvr-line transition-colors hover:text-white"
              >
                Đăng nhập
              </Link>
            )}
          </div>

          {/* Đăng tin — chỉ desktop (< lg đã có trong Menu, tránh chật thanh trên điện thoại) */}
          <Link
            href="/dang-tin"
            onClick={() => haptic()}
            className="btn-dangtin hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white sm:px-5 sm:py-2.5 lg:flex"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Đăng tin
          </Link>

          {/* Hamburger — chỉ mobile/tablet (< lg), 2 gạch → X kiểu Apple */}
          <button
            type="button"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="relative -mr-1 flex h-11 w-11 items-center justify-center lg:hidden"
          >
            <span
              className={`absolute h-[1.5px] w-[18px] rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                menuOpen ? "rotate-45" : "-translate-y-[3.5px]"
              }`}
            />
            <span
              className={`absolute h-[1.5px] w-[18px] rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                menuOpen ? "-rotate-45" : "translate-y-[3.5px]"
              }`}
            />
          </button>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} user={user} onLogout={signOut} />
    </header>
  );
}
