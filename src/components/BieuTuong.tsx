// MỘT BỘ BIỂU TƯỢNG CHO CẢ WEB — Phosphor (chủ dự án duyệt 25/10/2026: "chọn cho tôi một bộ đẹp và chuyên nghiệp nhất",
// "cái nào có icon phải đồng bộ hết"). Menu máy tính + điện thoại, thanh tab dưới đáy (khách + người bán), ô tìm trang chủ,
// khu tài khoản đều vẽ qua đây. Trang quản trị (admin) giữ bộ riêng theo lời chủ dự án.
// Bản /dist/ssr: không dùng context nên chạy được cả thành phần máy chủ lẫn máy khách; mỗi hình chỉ kéo đúng hình đó.
import {
  House, Buildings, City, Newspaper, User, Heart, FileText, Plus,
  SquaresFour, Wallet, Receipt, Star, Bell, Gear, SignOut, ShieldCheck, ShareNetwork,
} from "@/components/HinhPhosphor"; // bản gọn của Phosphor (chỉ nét thường + tô) — xem đầu tệp đó

const HINH = {
  trangChu: House,
  muaBan: Buildings,
  duAn: City,
  tinTuc: Newspaper,
  taiKhoan: User,
  tim: Heart,
  tinDang: FileText,
  dangTin: Plus,
  tongQuan: SquaresFour,
  vi: Wallet,
  hoaDon: Receipt,
  hoiVien: Star,
  thongBao: Bell,
  caiDat: Gear,
  dangXuat: SignOut,
  quanTri: ShieldCheck,
  chiaSe: ShareNetwork,
} as const;

// Bốn mục chủ dự án chọn GIỮ HÌNH CŨ (25/10/2026). Vẽ lại cùng độ dày nét Phosphor (1,5/24) và phóng cho bằng cỡ các hình
// Phosphor bên cạnh ("tùy biến độ to nhỏ"). vien = khung ngoài (bản đặc: tô kín) · chiTiet = nét bên trong (bản đặc: khoét trống).
const HINH_CU = {
  choThue: { tl: 1.18, dy: -1.3, vien: "M3 21h18M6 21V7a1 1 0 011-1h4a1 1 0 011 1v14M14 21V11a1 1 0 011-1h3a1 1 0 011 1v10", chiTiet: "M8.5 9h.01M8.5 13h.01" },
  tienIch: { tl: 1.12, vien: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z", chiTiet: "" },
  baoGia: { tl: 1.05, vien: "M7 3h5a1.99 1.99 0 011.41.59l7 7a2 2 0 010 2.82l-7 7a2 2 0 01-2.82 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z", chiTiet: "M7 7h.01" },
  khachHang: { tl: 1.12, vien: "M15.5 19.5v-1a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v1M9.5 11a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM20.5 19.5v-1a4 4 0 0 0-3-3.87M15.25 4.63a3.25 3.25 0 0 1 0 6.24", chiTiet: "" },
} as const;

export type TenBieuTuong = keyof typeof HINH | keyof typeof HINH_CU;

// dac = dạng tô đặc (mục đang chọn trên thanh tab, tim đã lưu)
export default function BieuTuong({ ten, dac = false, className = "h-5 w-5" }: { ten: TenBieuTuong; dac?: boolean; className?: string }) {
  if (ten in HINH_CU) {
    const h = HINH_CU[ten as keyof typeof HINH_CU];
    const net = 1.5 / h.tl;
    const bien = `translate(12 ${12 + ("dy" in h ? h.dy : 0)}) scale(${h.tl}) translate(-12 -12)`;
    const ma = `bt-${ten}`;
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {dac ? (
          <>
            <mask id={ma}>
              <g transform={bien} strokeWidth={net}>
                <path d={h.vien} fill="#fff" stroke="#fff" />
                {h.chiTiet && <path d={h.chiTiet} stroke="#000" strokeWidth={net * 1.6} />}
              </g>
            </mask>
            <rect width="24" height="24" fill="currentColor" stroke="none" mask={`url(#${ma})`} />
          </>
        ) : (
          <g transform={bien} strokeWidth={net}>
            <path d={h.vien} />
            {h.chiTiet && <path d={h.chiTiet} />}
          </g>
        )}
      </svg>
    );
  }
  const Hinh = HINH[ten as keyof typeof HINH];
  return <Hinh className={className} weight={dac ? "fill" : "regular"} aria-hidden />;
}
