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
import TinhVay from "./pages/TinhVay";
import DaLuu from "./pages/DaLuu";
import DaXem from "./pages/DaXem";
import DangNhap from "./pages/DangNhap";
import DangTin from "./pages/DangTin";
import TinCuaToi from "./pages/TinCuaToi";

// 4 tab dưới; các trang con dùng thanh tiêu đề có nút quay lại.
// Thanh dưới giống hệt thanh tab của web trên điện thoại (src/components/MobileTabBar.tsx).
const TAB = [
  { duong: "/", nhan: "Trang chủ", icon: "home" },
  { duong: "/ds/ban", nhan: "Mua bán", icon: "muaBan" },
  { duong: "/ds/thue", nhan: "Cho thuê", icon: "choThue" },
  { duong: "/du-an", nhan: "Dự án", icon: "duAn" },
  { duong: "/tai-khoan", nhan: "Tài khoản", icon: "taiKhoan" },
] as const;

function ThanhDuoi() {
  const { pathname } = useLocation();
  if (!TAB.some((t) => t.duong === pathname)) return null;
  return (
    <BottomNavigation fixed activeKey={pathname}>
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
            <Route path="/tinh-vay" element={<TinhVay />} />
            <Route path="/da-luu" element={<DaLuu />} />
            <Route path="/da-xem" element={<DaXem />} />
            <Route path="/dang-nhap" element={<DangNhap />} />
            <Route path="/dang-tin" element={<DangTin />} />
            <Route path="/tin-cua-toi" element={<TinCuaToi />} />
          </AnimationRoutes>
          <ThanhDuoi />
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
}
