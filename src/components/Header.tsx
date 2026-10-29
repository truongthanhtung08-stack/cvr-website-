"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import BackBar from "@/components/BackBar";
import { resetHomeIfOnHome } from "@/components/HomeExpand";
import { TIEN_ICH } from "@/lib/packages";
import BieuTuong, { type TenBieuTuong } from "@/components/BieuTuong";
import { rentCategories, saleCategories } from "@/lib/categories";
import { useSaved } from "@/lib/useSaved";
import { useAuth, displayName, anhDaiDien, signOut } from "@/lib/useAuth";
import AnhDaiDien from "@/components/AnhDaiDien";

// href KHÔNG bắt buộc: mục chỉ có `children` là NHÃN NHÓM (không bấm được),
// dùng để gom danh mục — tránh link cha trỏ trùng một mục con.
type NavChild = { label: string; href?: string; children?: NavChild[] };
// icon = path 'd' của SVG (24x24, outline) — hiện bên trái mỗi mục trong menu Mobile (kiểu Batdongsan).
type NavItem = { label: string; href: string; children?: NavChild[]; icon?: TenBieuTuong };

// Biểu tượng menu = BỘ CHUNG Phosphor (src/components/BieuTuong.tsx) — cùng hình với thanh tab dưới đáy (25/10/2026)

// Loại hình BĐS trong menu — lấy từ NGUỒN DUY NHẤT `src/lib/categories.ts`,
// cũng chính là nguồn sinh ra các trang danh mục thật + sitemap. Nhờ vậy menu
// không bao giờ trỏ vào đường dẫn không có trang (trước đây 29 link trả 404).
const loaiHinhBan: NavChild[] = saleCategories.map((c) => ({ label: c.label, href: `/mua-ban/${c.slug}` }));
const loaiHinhThue: NavChild[] = rentCategories.map((c) => ({ label: c.label, href: `/cho-thue/${c.slug}` }));
// MENU DỰ ÁN (chủ dự án 16/10/2026): Dự án nổi bật (có gói) tách khỏi Tra cứu dự án toàn quốc.
// Gọn (chủ dự án 22/10/2026): một trang Dự án duy nhất (dự án có gói đứng đầu) · Theo khu vực · Theo loại hình.
// Dự án: KHÔNG menu con (chủ dự án 25/10/2026) — bấm là vào thẳng trang Dự án, lọc khu vực / loại hình ngay trong trang.


// MENU BÁO GIÁ (chủ dự án chốt 01/10/2026): MỌI THỨ VỀ GIÁ vào MỘT menu, trỏ về MỘT trang
// Báo giá (từng mục là một phần của trang). Công cụ tiện ích tách sang menu Tiện ích.
// CHỈ MỤC CÓ THẬT TRÊN TRANG (chủ dự án 22/10/2026 tối: "bấm vào menu báo giá thấy như bãi rác") — trước có Gói hội viên,
// Gói dự án, Bài PR, Banner trỏ tới phần chưa duyệt (không có trên trang → bấm không ra gì).
// CÂY MỤC (chủ dự án 22/10/2026 tối: "menu tổng Báo giá, trong có các mục con — bấm vào đâu ra phần ấy, bấm vào tổng ra
// tổng"): Báo giá → từng gói (bấm ra cả gói) → Bảng giá · Đặc điểm · Quy định của gói đó. Cột menu trái trong trang Báo giá
// (nhomDichVu) cùng cây này; bảng nào admin duyệt thêm thì cột đó tự có mục.
// 25/10/2026 (chủ dự án): menu Báo giá CHỈ gồm các dịch vụ ĐANG CÓ bảng giá trên trang Báo giá, mỗi mục bấm ra đúng bảng
// giá đó — bỏ hết mục con lặt vặt (Bảng giá / Mẫu tin / Đặc điểm / Quy định). Một cột, máy tính và điện thoại như nhau.
// Admin duyệt thêm bảng giá dịch vụ nào lên trang thì thêm một dòng ở đây.
const danhMucBaoGia: NavChild[] = [
  { label: "Gói đăng tin", href: "/bao-gia-dang-tin#bang-gia-tin" },
  { label: "Gói đẩy tin", href: "/bao-gia-dang-tin#goi-day-tin" },
];
// MENU DỰ ÁN (chủ dự án 29/10/2026): Dự án nổi bật (dự án có ảnh, trang đã duyệt) · Tra cứu dự án (danh bạ chữ mọi dự án —
// có hồ sơ + dự án khách chọn khi đăng tin).
const danhMucDuAn: NavChild[] = [
  { label: "Dự án nổi bật", href: "/du-an" },
  { label: "Tra cứu dự án", href: "/du-an/tra-cuu" },
];
// MENU TIỆN ÍCH (chủ dự án duyệt 25/10/2026): một cột, chỉ công cụ dùng được ngay — danh sách ở packages.ts (TIEN_ICH)
const danhMucTienIch: NavChild[] = TIEN_ICH.map((t) => ({ label: t.label, href: t.href }));

// Thứ tự menu (chủ dự án duyệt 22/10/2026 — PC trái → phải, điện thoại trên → dưới): người tìm nhà dùng nhiều nhất
// trước, phần cho người bán cuối (sát nút Đăng tin): Mua bán · Cho thuê · Dự án · Tin tức · Tiện ích · Báo giá
// (25/10/2026: bỏ "Chuyên gia" khỏi menu chính — chủ dự án; danh bạ chuyên gia nằm trong menu Tiện ích)
const navItems: NavItem[] = [
  { label: "Mua bán", href: "/mua-ban", children: loaiHinhBan, icon: "muaBan" as const },
  { label: "Cho thuê", href: "/cho-thue", children: loaiHinhThue, icon: "choThue" as const },
  { label: "Dự án", href: "/du-an", children: danhMucDuAn, icon: "duAn" as const },
  { label: "Tin tức", href: "/tin-tuc", icon: "tinTuc" as const },
  { label: "Tiện ích", href: "/tien-ich/gia-nha-dat", children: danhMucTienIch, icon: "tienIch" as const },
  { label: "Báo giá", href: "/bao-gia-dang-tin", children: danhMucBaoGia, icon: "baoGia" as const },
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
        className="nav-link whitespace-nowrap text-sm font-medium text-cvr-line transition-colors hover:text-white"
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
        className="nav-link whitespace-nowrap text-sm font-medium text-cvr-line transition-colors group-hover:text-white"
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
                {g.href ? (
                  // Tên nhóm bấm được (menu Báo giá: tên gói → cả gói, 22/10/2026)
                  <Link href={g.href} className="block rounded-lg px-3.5 pb-1.5 pt-3 text-[14px] font-semibold text-cvr-ink transition-colors hover:text-cvr-gold-ink">
                    {g.label}
                  </Link>
                ) : (
                  <p className="px-3.5 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-cvr-faint">
                    {g.label}
                  </p>
                )}
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
      className="relative flex h-11 w-9 items-center justify-center text-cvr-line transition-colors hover:text-white xl:h-auto xl:w-auto xl:gap-1.5"
    >
      {/* Chấm đỏ = ĐÚNG số tin đã lưu (tối đa 100), cả điện thoại lẫn máy tính (25/10/2026 — trước đây "9+" và máy tính không có số) */}
      <span className="relative flex">
        <BieuTuong ten="tim" className="h-[22px] w-[22px] xl:h-[18px] xl:w-[18px]" />
        {count > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold leading-none text-white">
            {count}
          </span>
        )}
      </span>
      <span className="hidden text-sm font-medium xl:inline">Lưu</span>
    </Link>
  );
}

// Menu tài khoản khi đã đăng nhập (avatar + dropdown)
// MỤC TÀI KHOẢN — MỘT danh sách cho máy tính (menu ảnh đại diện) và điện thoại (đầu menu), khớp khu quản lý.
// Bỏ "Đăng tin" khỏi danh sách này (25/10/2026): nút Đăng tin đã đứng riêng ở cả hai bản, không lặp.
const TAI_KHOAN_LINKS: { label: string; href: string }[] = [
  { label: "Tổng quan", href: "/tai-khoan" },
  { label: "Tin đăng", href: "/tai-khoan/tin-dang" },
  { label: "Khách hàng", href: "/tai-khoan/khach-hang" },
  { label: "Tài khoản", href: "/tai-khoan/ca-nhan" },
];
// Điện thoại: hai mục tài khoản ở nhóm cuối menu (Tổng quan = dòng ảnh đại diện, Tin đăng = nút cạnh Đăng tin)
const TAI_KHOAN_PHU: { label: string; href: string; icon: TenBieuTuong }[] = [
  { label: "Khách hàng", href: "/tai-khoan/khach-hang", icon: "khachHang" },
  { label: "Tài khoản", href: "/tai-khoan/ca-nhan", icon: "taiKhoan" },
];

function AccountMenu({ name, anh, onLogout }: { name: string; anh: string; onLogout: () => void }) {
  const links = TAI_KHOAN_LINKS;

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 transition-colors"
      >
        <AnhDaiDien url={anh} ten={name} className="h-8 w-8 bg-white/10 text-sm text-white ring-1 ring-white/15" />
        {chevronDown}
      </button>

      <DropdownPanel align="right">
        <div className="mb-1 rounded-xl bg-cvr-surface px-3.5 py-2.5">
          <p className="truncate text-sm font-semibold text-cvr-ink">{name}</p>
          <p className="text-xs text-cvr-muted">Thành viên</p>
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
  // CHỈ DỰNG NỘI DUNG MENU KHI KHÁCH MỞ LẦN ĐẦU (tốc độ, đo 21/10/2026): menu đóng chỉ ẩn bằng độ mờ nên Next coi mọi link
  // trong đó là "đang thấy" → mỗi lần mở bất kỳ trang nào trên điện thoại là tải trước ~13 trang khác (~40 lượt gọi + ~15
  // tệp mã), giành máy với trang đang mở. Mở một lần rồi thì giữ nguyên như cũ (đóng mở mượt, link tải trước bình thường).
  const [daMo, setDaMo] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (open) setDaMo(true); }, [open]);

  // KHÔNG khoá cuộn bằng overflow:hidden nữa.
  // Đó chính là thủ phạm của lỗi "cuộn xuống rồi bấm menu thì menu bị ẩn":
  // đặt overflow:hidden lên <html>/<body> làm mất luôn ngữ cảnh cuộn → header
  // position:sticky rơi về vị trí gốc (trôi khỏi màn hình), để hở một dải nội dung
  // trang phía trên panel và mất luôn nút ☰ để đóng.
  // Panel đã phủ kín màn hình + overscroll-contain nên nền không trôi theo tay vuốt.

  // Đóng menu thì gập luôn accordion để lần mở sau sạch sẽ
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) setExpanded(null);
  }, [open]);

  return (
    <div
      // FIXED theo màn hình và nằm NGOÀI <header> (xem Header bên dưới).
      // Trước đây panel là absolute BÊN TRONG header sticky → khi đã cuộn trang,
      // header dính + body khoá cuộn làm mốc neo sai: menu bị đẩy lệch lên và cụt
      // (trông như "ẩn"). Fixed neo thẳng vào màn hình nên cuộn tới đâu cũng đúng.
      // z-[45]: trên thanh tab đáy (z-40), dưới header (z-50) để nút ☰ vẫn bấm đóng được.
      className={`menu-solid fixed inset-x-0 bottom-0 top-[calc(60px+var(--at))] z-[45] flex flex-col overflow-y-auto overscroll-contain transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] xl:hidden ${
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0 pointer-events-none"
      }`}
    >
      {(open || daMo) && <nav className="flex-1 px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-5">
        {/* ── ĐĂNG TIN + (chưa đăng nhập → Đăng nhập/Đăng ký) — đầu menu.
            Kiểu Batdongsan: KHI ĐÃ ĐĂNG NHẬP, tài khoản & avatar nằm ở THANH TRÊN
            (avatar + ♡ + 🔔), KHÔNG lặp lại khối tài khoản trong menu drawer. ── */}
        {/* CTA ĐẦU MENU — CÙNG MỘT KHUÔN cho hai trạng thái (chủ dự án 25/10/2026: cân đối, dễ nhìn):
            hàng hai nút bằng nhau cao 44px — trái nút viền (chưa đăng nhập: Đăng nhập · đã đăng nhập: Tin đăng),
            phải nút xanh "+ Đăng tin". Đã đăng nhập thì thêm MỘT dòng ảnh đại diện + tên phía trên (bấm → Tổng quan).
            Các mục tài khoản còn lại (Khách hàng, Tài khoản) nằm ở nhóm cuối menu cùng Tin đã lưu · Đăng xuất. */}
        <div className="mb-7">
          {user && (
            // Ảnh đại diện 40px + tên 16px đậm + dòng phụ "Thành viên" — CÙNG khối tên trong menu ảnh đại diện máy tính (25/10/2026)
            <Link href="/tai-khoan" onClick={onClose} className="mb-4 flex min-w-0 items-center gap-3">
              <AnhDaiDien url={anhDaiDien(user)} ten={displayName(user)} className="h-10 w-10 shrink-0 bg-white/15 text-[15px] text-white ring-1 ring-white/20" />
              <span className="min-w-0">
                <span className="block truncate text-[16px] font-semibold leading-tight text-white">{displayName(user)}</span>
                <span className="mt-0.5 block text-[13px] leading-tight text-white/55">Thành viên</span>
              </span>
            </Link>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Link href={user ? "/tai-khoan/tin-dang" : "/dang-nhap"} onClick={onClose} className="flex min-h-[44px] items-center justify-center rounded-full text-[15px] font-semibold text-white ring-1 ring-inset ring-white/25 transition-colors active:bg-white/10">
              {user ? "Tin đăng" : "Đăng nhập"}
            </Link>
            <Link
              href="/dang-tin"
              onClick={onClose}
              className="press flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-cvr-blue text-[15px] font-semibold text-white"
            >
              <svg className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Đăng tin
            </Link>
          </div>
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
                      <BieuTuong ten={item.icon} className="h-[22px] w-[22px] shrink-0 text-white/75" />
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
                  <BieuTuong ten={item.icon} className="h-[22px] w-[22px] shrink-0 text-white/75" />
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
          {/* Đã đăng nhập: mục tài khoản còn lại — cùng kiểu hàng với Tin đã lưu · Đăng xuất */}
          {user && TAI_KHOAN_PHU.map((l) => (
            <Link key={l.href} href={l.href} onClick={onClose} className="flex min-h-[56px] items-center gap-3.5 text-[16px] font-medium text-white/85">
              <BieuTuong ten={l.icon} className="h-[22px] w-[22px] shrink-0 text-white/60" />
              {l.label}
            </Link>
          ))}
          <Link
            href="/tin-luu"
            onClick={onClose}
            className="flex min-h-[56px] items-center gap-3.5 text-[16px] font-medium text-white/85"
          >
            <BieuTuong ten="tim" className="h-[22px] w-[22px] shrink-0 text-white/60" />
            Tin đã lưu
          </Link>
          {user && (
            <button
              type="button"
              onClick={() => { onLogout(); onClose(); }}
              className="flex min-h-[56px] w-full items-center gap-3.5 text-left text-[16px] font-medium text-white/60"
            >
              <BieuTuong ten="dangXuat" className="h-[22px] w-[22px] shrink-0 text-white/45" />
              Đăng xuất
            </button>
          )}
        </div>
      </nav>}
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
    <>
      <header
      className={`nav-glass sticky top-0 z-50 w-full border-b border-white/10 transition-shadow duration-300 ${
        scrolled ? "shadow-lg shadow-black/25" : ""
      }`}
    >
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo trắng (nền tối) — bấm là thấy phản hồi NGAY: logo nhún nhẹ rồi bật lại
            (thay cho rung), thanh tiến trình chạy trên đỉnh, trang chủ hiện dần lên. */}
        <Link
          href="/"
          aria-label="COASTAL LAND — Trang chủ"
          onClick={() => resetHomeIfOnHome()}
          className="press press-logo inline-flex"
        >
          <BrandLogo size="md" tone="light" />
        </Link>

        {/* Điều hướng */}
        <nav className="hidden items-center gap-8 xl:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Hành động: Lưu · (Đăng nhập | Tài khoản) · Đăng tin
            MOBILE: ♡ nằm SÁT nút ☰ (gap-0) — vẫn giữ vùng chạm cao 44px. */}
        <div className="flex items-center gap-0 sm:gap-5">
          <SaveButton />

          {/* Tài khoản/Đăng nhập — CHỈ desktop (lg). MOBILE: avatar + tài khoản nằm TRONG
              drawer menu (kiểu Batdongsan) → thanh header mobile chỉ Logo · ♡ · ☰. */}
          <div className="hidden items-center xl:flex">
            {user ? (
              <AccountMenu name={displayName(user)} anh={anhDaiDien(user)} onLogout={signOut} />
            ) : (
              // Chưa đăng nhập: CHỈ "Đăng nhập" — trang đăng nhập tự lo cả tài khoản mới, không cần nút Đăng ký (chủ dự án 25/10/2026)
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
            className="btn-dangtin hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-white sm:px-5 sm:py-2.5 xl:flex"
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
            className="relative -mr-1 flex h-11 w-11 items-center justify-center xl:hidden"
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
      </header>

      {/* Nút QUAY LẠI trên điện thoại — dính ngay dưới header, có ở mọi trang
          (trừ trang chủ) để khách không bị kẹt trong các mục sâu. */}
      <BackBar />

      {/* Menu mobile để NGOÀI <header>: header có backdrop-filter (.nav-glass) — mọi
          phần tử fixed nằm bên trong sẽ bị neo vào header thay vì vào màn hình. */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} user={user} onLogout={signOut} />
    </>
  );
}
