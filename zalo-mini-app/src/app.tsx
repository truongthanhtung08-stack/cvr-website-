import React, { Suspense, lazy } from "react";
import { AnimationRoutes, App, BottomNavigation, Route, SnackbarProvider, ZMPRouter, useLocation, useNavigate } from "zmp-ui";
import IconCL from "./components/IconCL";

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
const DanhBaChuyenGia = cham(() => import("./pages/ChuyenGia").then((m) => ({ default: m.DanhBaChuyenGia })));
const HoSoChuyenGia = cham(() => import("./pages/ChuyenGia"));
const DuAnCuaToi = cham(() => import("./pages/DuAnCuaToi"));
const SoSanh = cham(() => import("./pages/SoSanh"));
const HoiVien = cham(() => import("./pages/HoiVien"));
const TimKiemLuu = cham(() => import("./pages/TimKiemLuu"));
const TrangTinh = cham(() => import("./pages/TrangTinh"));
const NapTien = cham(() => import("./pages/NapTien"));

// THANH DƯỚI 4 NÚT (Zalo Mini App Design Guidelines: "số lượng tab ở bottom bar không nên vượt quá 4", 06/11/2026) — Dự án vào từ
// khối "Dự án nổi bật · Xem thêm" ở Trang chủ. Trước đó: THANH DƯỚI = ĐÚNG web điện thoại (06/11/2026 "lấy giao diện web trên mobile làm chuẩn"): Trang chủ · Mua bán · Cho thuê · Dự án ·
// Tài khoản. Đăng tin vào từ ô công cụ trang chủ và trang Tài khoản; mở toàn màn hình, không hiện thanh tab.
const TAB = [
  { duong: "/", nhan: "Trang chủ", icon: "home" },
  { duong: "/ds/ban", nhan: "Mua bán", icon: "muaBan" },
  { duong: "/ds/thue", nhan: "Cho thuê", icon: "choThue" },
  { duong: "/tai-khoan", nhan: "Tài khoản", icon: "taiKhoan" },
] as const;
const tabCua = (p: string) => p;

function ThanhDuoi() {
  const { pathname } = useLocation();
  const dieuHuong = useNavigate();
  const tab = tabCua(pathname);
  // Đăng tin mở toàn màn hình (có thanh nút gửi ở đáy) — không hiện thanh tab.
  if (!TAB.some((t) => t.duong === tab)) return null;
  return (
    <>
    {/* NÚT "+ Đăng tin" nổi trên thanh dưới (06/11/2026) — thanh dưới giữ 4 tab theo Zalo Design Guidelines, Đăng tin là nút nổi. */}
    <button className="nut-dang-tin" onClick={() => dieuHuong("/dang-tin")}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
      Đăng tin
    </button>
    <BottomNavigation fixed activeKey={tab}>
      {TAB.map((t) => (
        <BottomNavigation.Item key={t.duong} itemKey={t.duong} label={t.nhan} icon={<IconCL ten={t.icon} />} linkTo={t.duong} />
      ))}
    </BottomNavigation>
    </>
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
            <Route path="/tim-kiem-luu" element={<TimKiemLuu />} />
            <Route path="/hoi-vien" element={<HoiVien />} />
            <Route path="/so-sanh" element={<SoSanh />} />
            <Route path="/du-an-cua-toi" element={<DuAnCuaToi />} />
            <Route path="/chuyen-gia" element={<DanhBaChuyenGia />} />
            <Route path="/chuyen-gia/:slug" element={<HoSoChuyenGia />} />
            <Route path="/thong-tin/:duong" element={<TrangTinh />} />
            <Route path="/nap-tien" element={<NapTien />} />
          </AnimationRoutes>
          <ThanhDuoi />
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
}
