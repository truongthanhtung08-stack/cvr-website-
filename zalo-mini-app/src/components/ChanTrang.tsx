import React from "react";
import { openPhone } from "zmp-sdk";
import { useNavigate } from "zmp-ui";
import { nhanCoastalLand } from "../lib/zalo";
import logoNgang from "../assets/logo-ngang.svg";
import { layChanTrang } from "../lib/tin";
import { useTai } from "../lib/useTai";

// ============================================================================
// CHÂN TRANG — CHÉP ĐÚNG CẤU TRÚC WEB (src/components/Footer.tsx, chủ dự án 06/11/2026: "lấy giao diện web trên mobile làm chuẩn"):
// logo · dòng đậm (tagline) · đoạn giới thiệu · địa chỉ → hỗ trợ kỹ thuật → email → Zalo · 3 nhóm liên kết (Về COASTAL LAND ·
// Hỗ trợ khách hàng · Khu vực) · © năm COASTAL LAND. Chữ (tagline, giới thiệu, hotline, email, địa chỉ) đọc từ nội dung admin
// trên web (site_content "footer") — cùng nguồn với web. KHÔNG mở trang web (chuẩn Mini App, 06/11/2026); Khu vực mở danh
// sách ngay trong Mini App. 06/11/2026: Mini App KHÔNG làm SEO / pSEO — bỏ đoạn giới thiệu và nhóm liên kết Khu vực của web.
// ============================================================================
// Mặc định = src/lib/footerMacDinh.ts của web (khi chưa đọc được nội dung admin).
const MAC_DINH = {
  tagline: "Cổng thông tin bất động sản trực tuyến",
  description: "",
  hotline: "+84 377 985 036",
  email: "hotro@coastalland.vn",
  address: "220 Nguyễn Mậu Tài, Phường Hòa Xuân, Thành phố Đà Nẵng",
};
// 06/11/2026: Mini App KHÔNG mở trang web (bấm là bật bảng web của Zalo — chủ dự án bác). Hai nhóm liên kết như web, mỗi liên kết mở
// MÀN TRONG APP: trang thông tin (TrangTinh, chữ lấy từ web lúc build) · Bảng giá · Nhắn Zalo Coastal Land (Liên hệ, Góp ý).
const NHOM: { ten: string; link: [string, string][] }[] = [
  { ten: "Về COASTAL LAND", link: [["Giới thiệu", "/thong-tin/gioi-thieu"], ["Quy chế hoạt động", "/thong-tin/quy-che"], ["Điều khoản thoả thuận", "/thong-tin/dieu-khoan"], ["Chính sách bảo mật", "/thong-tin/bao-mat"]] },
  { ten: "Hỗ trợ khách hàng", link: [["Hướng dẫn đăng tin", "/thong-tin/huong-dan"], ["Báo giá dịch vụ", "/bang-gia"], ["Câu hỏi thường gặp", "/thong-tin/faq"], ["Quy định đăng tin", "/thong-tin/quy-dinh"], ["Góp ý, báo lỗi", "chat"]] },
];

export default function ChanTrang() {
  const dieuHuong = useNavigate();
  const nd = useTai(layChanTrang, [], {});
  const f = { ...MAC_DINH, ...Object.fromEntries(Object.entries(nd.data).filter(([, v]) => v)) };
  const goi = () => openPhone({ phoneNumber: f.hotline.replace(/\D/g, "").replace(/^84/, "0") }).catch(() => {});

  return (
    <footer className="chan-trang">
      {/* Logo ngang có slogan — ĐÚNG tệp chân trang web dùng (public/logo/logo-horizontal-dark.svg, BrandLogo size lg). */}
      <img className="ct-logo" src={logoNgang} alt="COASTAL LAND" />
      <p className="ct-tagline">{f.tagline}</p>
      <ul className="ct-lien-he">
        {/* Như chân trang web bản điện thoại: mỗi dòng có biểu tượng (vị trí · điện thoại · thư). Địa chỉ lấy từ phapLy.ts (Admin không đè). */}
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span>{MAC_DINH.address}</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" /></svg><span>Hỗ trợ kỹ thuật: <b onClick={goi}>{f.hotline}</b></span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8l9-5 9 5" /></svg><span>{f.email}</span></li>
        {/* Website như chân trang web — chỉ hiện chữ, KHÔNG bấm mở web (Chính sách kiểm duyệt Zalo 4.1). */}
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg><span>coastalland.vn</span></li>
      </ul>
      {/* Như web bản điện thoại: 2 nhóm liên kết đặt cạnh nhau, mỗi nhóm một cột dọc. */}
      <div className="ct-cot">
      {NHOM.map((n) => (
        <div key={n.ten} className="ct-nhom">
          <h3>{n.ten}</h3>
          <div className="ct-link">
            {n.link.map(([nhan, duong]) => <button key={nhan} onClick={() => (duong === "chat" ? nhanCoastalLand() : dieuHuong(duong))}>{nhan}</button>)}
          </div>
        </div>
      ))}
      </div>
      <p className="ct-ban-quyen">© {new Date().getFullYear()} COASTAL LAND</p>
    </footer>
  );
}
