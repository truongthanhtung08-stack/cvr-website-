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

// 5 tab dưới kiểu Mini App Zalo; các trang con dùng thanh tiêu đề có nút quay lại.
const TAB = [
  { duong: "/", nhan: "Trang chủ", icon: "home" },
  { duong: "/ds/ban", nhan: "Tìm tin", icon: "timKiem" },
  { duong: "/dang-tin", nhan: "Đăng tin", icon: "dangTin" },
  { duong: "/da-luu", nhan: "Đã lưu", icon: "daLuu" },
  { duong: "/tai-khoan", nhan: "Cá nhân", icon: "taiKhoan" },
] as const;
// Trang nào thuộc tab nào (Tìm tin gồm cả Mua bán lẫn Cho thuê).
const tabCua = (p: string) => (p.startsWith("/ds/") ? "/ds/ban" : p);

function ThanhDuoi() {
  const { pathname } = useLocation();
  const tab = tabCua(pathname);
  // Đăng tin mở toàn màn hình (có thanh nút gửi ở đáy) — không hiện thanh tab.
  if (tab === "/dang-tin" || !TAB.some((t) => t.duong === tab)) return null;
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
