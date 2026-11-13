import React, { Suspense, lazy } from "react";
import { AnimationRoutes, App, BottomNavigation, Route, SnackbarProvider, ZMPRouter, useLocation, useNavigate } from "zmp-ui";
import BieuTuongWeb from "./components/BieuTuongWeb";
import { tuVaoBangZalo } from "./lib/lienKet";
import { canBanPhim } from "./lib/banPhim";
import { datChoVao } from "./lib/supabase";

// TẢI THEO MÀN (chuẩn hiệu suất Zalo: LCP < 2,5 giây, tải trang < 1,5 giây — Chính sách kiểm duyệt mục 5.3): màn đầu (5 tab) nằm sẵn
// trong gói chính; màn khác chỉ tải khi mở. Khung chờ = trang trắng cùng nền (không nhảy bố cục).
function cham(nap: () => Promise<{ default: React.ComponentType }>) {
  const C = lazy(nap);
  return () => <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fff" }} />}><C /></Suspense>;
}
import TrangChu from "./pages/TrangChu";
const TimKiem = cham(() => import("./pages/TimKiem"));
const DichVu = cham(() => import("./pages/DichVu"));
import TaiKhoan from "./pages/TaiKhoan";
import DanhSach from "./pages/DanhSach";
import ChiTietTin from "./pages/ChiTietTin";
import DuAnDs from "./pages/DuAnDs";
const DuAnChiTiet = cham(() => import("./pages/DuAnChiTiet"));
const TinTucDs = cham(() => import("./pages/TinTucDs"));
const BaiVietChiTiet = cham(() => import("./pages/BaiVietChiTiet"));
const BangGia = cham(() => import("./pages/BangGia"));
const DaLuu = cham(() => import("./pages/DaLuu"));
const DaXem = cham(() => import("./pages/DaXem"));
const DangNhap = cham(() => import("./pages/DangNhap"));
const DangTin = cham(() => import("./pages/DangTin"));
const TinCuaToi = cham(() => import("./pages/TinCuaToi"));
const GoiTin = cham(() => import("./pages/GoiTin"));
const HoaDon = cham(() => import("./pages/HoaDon"));
const KhachHang = cham(() => import("./pages/KhachHang"));
const CaiDat = cham(() => import("./pages/CaiDat"));
const DuAnCuaToi = cham(() => import("./pages/DuAnCuaToi"));
const SoSanh = cham(() => import("./pages/SoSanh"));
const HoiVien = cham(() => import("./pages/HoiVien"));
const TimKiemLuu = cham(() => import("./pages/TimKiemLuu"));
const TrangTinh = cham(() => import("./pages/TrangTinh"));
const NapTien = cham(() => import("./pages/NapTien"));

// THANH DƯỚI 4 NÚT (Zalo Mini App Design Guidelines: "số lượng tab ở bottom bar không nên vượt quá 4", 06/11/2026) — Dự án vào từ
// khối "Dự án nổi bật · Xem thêm" ở Trang chủ. Trước đó: THANH DƯỚI = ĐÚNG web điện thoại (06/11/2026 "lấy giao diện web trên mobile làm chuẩn"): Trang chủ · Mua bán · Cho thuê · Dự án ·
// Tài khoản. Đăng tin vào từ ô công cụ trang chủ và trang Tài khoản; mở toàn màn hình, không hiện thanh tab.
// 12/11/2026 — CÙNG thanh dưới web điện thoại (MobileTabBar: Home · Lưu · Đăng tin · Tin nhắn · Hồ sơ), giữ 4 nút theo Zalo:
// Tin nhắn (chat Zalo OA) nằm ở Hồ sơ; Mua bán · Cho thuê · Dự án vào từ 3 ô dưới ảnh đầu Trang chủ (như web).
const TAB = [
  { duong: "/", nhan: "Home", icon: "trangChu" },
  { duong: "/da-luu", nhan: "Lưu", icon: "tim" },
  { duong: "/dang-tin", nhan: "Đăng tin", icon: "dangTin" },
  { duong: "/tai-khoan", nhan: "Hồ sơ", icon: "taiKhoan" },
] as const;
const tabCua = (p: string) => p;

function ThanhDuoi() {
  const { pathname } = useLocation();
  const dieuHuong = useNavigate();
  const tab = tabCua(pathname);
  // Đăng tin mở toàn màn hình (có thanh nút gửi ở đáy) — không hiện thanh tab.
  if (tab === "/dang-tin" || !TAB.some((t) => t.duong === tab)) return null;
  return (
    <BottomNavigation fixed activeKey={tab}>
      {TAB.map((t) => (
        <BottomNavigation.Item
          key={t.duong}
          itemKey={t.duong}
          label={t.nhan}
          // Đăng tin = vòng xanh dấu + như web (MobileTabBar)
          // Cùng bộ biểu tượng thanh dưới web (MobileTabBar → BieuTuong Phosphor): thường = nét, đang chọn = tô đặc
          icon={t.duong === "/dang-tin" ? <span className="tab-dang-tin"><BieuTuongWeb ten="dangTin" co={22} /></span> : <BieuTuongWeb ten={t.icon} co={24} dac={tab === t.duong} />}
          onClick={() => dieuHuong(t.duong)}
        />
      ))}
    </BottomNavigation>
  );
}

// Mở app là vào tài khoản theo Zalo — chạy ngay khi tải mã (trước khi màn nào đọc phiên)
datChoVao(tuVaoBangZalo());

export default function UngDung() {
  React.useEffect(() => canBanPhim(), []);
  return (
    <App>
      <SnackbarProvider>
        <ZMPRouter>
          <AnimationRoutes>
            <Route path="/" element={<TrangChu />} />
            <Route path="/tim-kiem" element={<TimKiem />} />
            <Route path="/dich-vu" element={<DichVu />} />
            <Route path="/tai-khoan" element={<TaiKhoan />} />
            <Route path="/ds/:md" element={<DanhSach />} />
            <Route path="/tin/:id" element={<ChiTietTin />} />
            <Route path="/du-an" element={<DuAnDs />} />
            <Route path="/du-an/:slug" element={<DuAnChiTiet />} />
            <Route path="/tin-tuc" element={<TinTucDs />} />
            <Route path="/tin-tuc/:slug" element={<BaiVietChiTiet />} />
            <Route path="/bang-gia" element={<BangGia />} />
            <Route path="/da-luu" element={<DaLuu />} />
            <Route path="/da-xem" element={<DaXem />} />
            <Route path="/dang-nhap" element={<DangNhap />} />
            <Route path="/dang-tin" element={<DangTin />} />
            <Route path="/tin-cua-toi" element={<TinCuaToi />} />
            <Route path="/goi-tin/:id" element={<GoiTin />} />
            <Route path="/hoa-don" element={<HoaDon />} />
            <Route path="/khach-hang" element={<KhachHang />} />
            <Route path="/cai-dat" element={<CaiDat />} />
            <Route path="/tim-kiem-luu" element={<TimKiemLuu />} />
            <Route path="/hoi-vien" element={<HoiVien />} />
            <Route path="/so-sanh" element={<SoSanh />} />
            <Route path="/du-an-cua-toi" element={<DuAnCuaToi />} />
            <Route path="/thong-tin/:duong" element={<TrangTinh />} />
            <Route path="/nap-tien" element={<NapTien />} />
          </AnimationRoutes>
          <ThanhDuoi />
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
}
