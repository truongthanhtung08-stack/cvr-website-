import React from "react";
import { openPhone } from "zmp-sdk";
import { useNavigate } from "zmp-ui";
import { nhanCoastalLand } from "../lib/zalo";
import logoTron from "../assets/logo-tron.svg";
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
  { ten: "Về COASTAL LAND", link: [["Giới thiệu", "/thong-tin/gioi-thieu"], ["Tuyển dụng", "/thong-tin/tuyen-dung"], ["Liên hệ", "chat"], ["Quy chế hoạt động", "/thong-tin/quy-che"], ["Điều khoản thoả thuận", "/thong-tin/dieu-khoan"], ["Chính sách bảo mật", "/thong-tin/bao-mat"]] },
  { ten: "Hỗ trợ khách hàng", link: [["Hướng dẫn đăng tin", "/thong-tin/huong-dan"], ["Báo giá dịch vụ", "/bang-gia"], ["Câu hỏi thường gặp", "/thong-tin/faq"], ["Quy định đăng tin", "/thong-tin/quy-dinh"], ["Góp ý, báo lỗi", "chat"]] },
];

export default function ChanTrang() {
  const dieuHuong = useNavigate();
  const nd = useTai(layChanTrang, [], {});
  const f = { ...MAC_DINH, ...Object.fromEntries(Object.entries(nd.data).filter(([, v]) => v)) };
  const goi = () => openPhone({ phoneNumber: f.hotline.replace(/\D/g, "").replace(/^84/, "0") }).catch(() => {});

  return (
    <footer className="chan-trang">
      <div className="ct-hieu">
        <img src={logoTron} alt="" />
        <strong>COASTAL LAND</strong>
      </div>
      <p className="ct-tagline">{f.tagline}</p>
      <ul className="ct-lien-he">
        <li>{MAC_DINH.address}</li>{/* như web: địa chỉ lấy từ phapLy.ts (Admin không đè) */}
        <li>Hỗ trợ kỹ thuật: <b onClick={goi}>{f.hotline}</b></li>
        <li>{f.email}</li>
      </ul>
      {NHOM.map((n) => (
        <div key={n.ten} className="ct-nhom">
          <h3>{n.ten}</h3>
          <div className="ct-link">
            {n.link.map(([nhan, duong]) => <button key={nhan} onClick={() => (duong === "chat" ? nhanCoastalLand() : dieuHuong(duong))}>{nhan}</button>)}
          </div>
        </div>
      ))}
      <p className="ct-ban-quyen">© {new Date().getFullYear()} COASTAL LAND</p>
    </footer>
  );
}
