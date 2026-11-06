import React from "react";
import { AnimationRoutes, App, BottomNavigation, Route, SnackbarProvider, ZMPRouter, useLocation } from "zmp-ui";
import IconCL from "./components/IconCL";
import TrangChu from "./pages/TrangChu";
import TimKiem from "./pages/TimKiem";
import DichVu from "./pages/DichVu";
import TaiKhoan from "./pages/TaiKhoan";
import DanhSach from "./pages/DanhSach";
import ChiTietTin from "./pages/ChiTietTin";
import DuAnDs from "./pages/DuAnDs";
import DuAnChiTiet from "./pages/DuAnChiTiet";
import TinTucDs from "./pages/TinTucDs";
import BaiVietChiTiet from "./pages/BaiVietChiTiet";
import BangGia from "./pages/BangGia";
import DaLuu from "./pages/DaLuu";
import DaXem from "./pages/DaXem";
import DangNhap from "./pages/DangNhap";
import DangTin from "./pages/DangTin";
import TinCuaToi from "./pages/TinCuaToi";
import GoiTin from "./pages/GoiTin";
import HoaDon from "./pages/HoaDon";
import KhachHang from "./pages/KhachHang";
import CaiDat from "./pages/CaiDat";
import NapTien from "./pages/NapTien";

// THANH DƯỚI = ĐÚNG web điện thoại (06/11/2026 "lấy giao diện web trên mobile làm chuẩn"): Trang chủ · Mua bán · Cho thuê · Dự án ·
// Tài khoản. Đăng tin vào từ ô công cụ trang chủ và trang Tài khoản; mở toàn màn hình, không hiện thanh tab.
const TAB = [
  { duong: "/", nhan: "Trang chủ", icon: "home" },
  { duong: "/ds/ban", nhan: "Mua bán", icon: "muaBan" },
  { duong: "/ds/thue", nhan: "Cho thuê", icon: "choThue" },
  { duong: "/du-an", nhan: "Dự án", icon: "duAn" },
  { duong: "/tai-khoan", nhan: "Tài khoản", icon: "taiKhoan" },
] as const;
const tabCua = (p: string) => p;

function ThanhDuoi() {
  const { pathname } = useLocation();
  const tab = tabCua(pathname);
  // Đăng tin mở toàn màn hình (có thanh nút gửi ở đáy) — không hiện thanh tab.
  if (!TAB.some((t) => t.duong === tab)) return null;
  return (
    <BottomNavigation fixed activeKey={tab}>
      {TAB.map((t) => (
        <BottomNavigation.Item key={t.duong} itemKey={t.duong} label={t.nhan} icon={<IconCL ten={t.icon} />} linkTo={t.duong} />
      ))}
    </BottomNavigation>
  );
}

export default function UngDung() {
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
            <Route path="/nap-tien" element={<NapTien />} />
          </AnimationRoutes>
          <ThanhDuoi />
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
}
