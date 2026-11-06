import React from "react";
import { openPhone, openWebview } from "zmp-sdk";
import logoTron from "../assets/logo-tron.svg";
import { layChanTrang } from "../lib/tin";
import { useTai } from "../lib/useTai";
import { nhanCoastalLand } from "../lib/zalo";

// ============================================================================
// CHÂN TRANG — CHÉP ĐÚNG CẤU TRÚC WEB (src/components/Footer.tsx, chủ dự án 06/11/2026: "lấy giao diện web trên mobile làm chuẩn"):
// logo · dòng đậm (tagline) · đoạn giới thiệu · địa chỉ → hỗ trợ kỹ thuật → email → Zalo · 3 nhóm liên kết (Về COASTAL LAND ·
// Hỗ trợ khách hàng · Khu vực) · © năm COASTAL LAND. Chữ (tagline, giới thiệu, hotline, email, địa chỉ) đọc từ nội dung admin
// trên web (site_content "footer") — cùng nguồn với web. Trang web mở trong khung Zalo (openWebview, utm Zalo); Khu vực mở danh
// sách ngay trong Mini App. 06/11/2026: Mini App KHÔNG làm SEO / pSEO — bỏ đoạn giới thiệu và nhóm liên kết Khu vực của web.
// ============================================================================
const WEB = "https://coastalland.vn";
// Mặc định = src/lib/footerMacDinh.ts của web (khi chưa đọc được nội dung admin).
const MAC_DINH = {
  tagline: "Cổng thông tin bất động sản trực tuyến",
  description: "",
  hotline: "+84 377 985 036",
  email: "hotro@coastalland.vn",
  address: "220 Nguyễn Mậu Tài, Phường Hòa Xuân, Thành phố Đà Nẵng",
};
// CHÉP từ src/components/Footer.tsx — đổi ở web thì đổi cả ở đây.
const NHOM: { ten: string; link: [string, string][] }[] = [
  { ten: "Về COASTAL LAND", link: [["Giới thiệu", "/gioi-thieu"], ["Tuyển dụng", "/tuyen-dung"], ["Liên hệ", "/lien-he"], ["Quy chế hoạt động", "/quy-che"], ["Điều khoản thoả thuận", "/dieu-khoan"], ["Chính sách bảo mật", "/bao-mat"]] },
  { ten: "Hỗ trợ khách hàng", link: [["Hướng dẫn đăng tin", "/huong-dan"], ["Báo giá dịch vụ", "/bao-gia-dang-tin"], ["Câu hỏi thường gặp", "/faq"], ["Quy định đăng tin", "/quy-dinh"], ["Góp ý, báo lỗi", "/gop-y"]] },
];

// Gắn utm_source=zalo → web + Google Analytics tính lượt này là traffic từ kênh Zalo Mini App (cộng hưởng traffic web).
const moWeb = (duong: string) => {
  const url = `${WEB}${duong}?utm_source=zalo&utm_medium=mini_app`;
  openWebview({ url }).catch(() => { window.location.href = url; });
};

export default function ChanTrang() {
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
        <li><span className="ct-zalo" onClick={() => nhanCoastalLand()}>Zalo</span></li>
      </ul>
      {NHOM.map((n) => (
        <div key={n.ten} className="ct-nhom">
          <h3>{n.ten}</h3>
          <div className="ct-link">
            {n.link.map(([nhan, duong]) => <button key={duong} onClick={() => moWeb(duong)}>{nhan}</button>)}
          </div>
        </div>
      ))}
      <p className="ct-ban-quyen">© {new Date().getFullYear()} COASTAL LAND</p>
    </footer>
  );
}
