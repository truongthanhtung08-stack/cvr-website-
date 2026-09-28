import React from "react";
import { openPhone, openWebview } from "zmp-sdk";
import logoTron from "../assets/logo-tron.svg";
import { layChanTrang } from "../lib/tin";
import { useTai } from "../lib/useTai";
import { nhanCoastalLand } from "../lib/zalo";

// ============================================================================
// CHÂN TRANG — RÚT GỌN (chủ dự án 28/09/2026): logo + tên, gọi / nhắn Zalo, một hàng liên kết
// chính (mở trang web ngay trong Zalo), dòng pháp lý bắt buộc (tên, MST, địa chỉ). Hotline/email lấy
// từ nội dung admin trên web (site_content "footer").
// ============================================================================
const WEB = "https://coastalland.vn";
const MAC_DINH = { hotline: "+84 377 985 036", email: "hotro@coastalland.vn" };
// CHÉP từ src/lib/phapLy.ts của web — đổi ở web thì đổi cả ở đây.
const PHAP_LY = { tenCongTy: "COASTAL LAND", mst: "0402353502", diaChi: "220 Nguyễn Mậu Tài, phường Hòa Xuân, thành phố Đà Nẵng" };
// RÚT GỌN (chủ dự án 28/09/2026: không bê nguyên web) — một hàng liên kết chính.
const LINK = [["Giới thiệu", "/gioi-thieu"], ["Quy chế", "/quy-che"], ["Điều khoản", "/dieu-khoan"], ["Bảo mật", "/bao-mat"], ["Liên hệ", "/lien-he"]];

// Gắn utm_source=zalo → web + Google Analytics tính lượt này là traffic từ kênh Zalo Mini App.
const moWeb = (duong: string) => {
  const url = `${WEB}${duong}?utm_source=zalo&utm_medium=mini_app`;
  openWebview({ url }).catch(() => { window.location.href = url; });
};

export default function ChanTrang() {
  const nd = useTai(layChanTrang, [], {});
  const f = { ...MAC_DINH, ...nd.data };
  const goi = () => openPhone({ phoneNumber: f.hotline.replace(/\D/g, "").replace(/^84/, "0") }).catch(() => {});

  return (
    <footer className="chan-trang">
      <div className="ct-hieu">
        <img src={logoTron} alt="" />
        <div>
          <strong>COASTAL LAND</strong>
          <span>Cổng thông tin mua bán, cho thuê bất động sản</span>
        </div>
      </div>
      <div className="ct-nut">
        <button onClick={goi}>Gọi {f.hotline}</button>
        <button className="ct-zalo" onClick={() => nhanCoastalLand()}>Nhắn Zalo</button>
      </div>
      <nav className="ct-link">
        {LINK.map(([nhan, duong]) => (
          <button key={duong} onClick={() => moWeb(duong)}>{nhan}</button>
        ))}
      </nav>
      <div className="ct-phap-ly">
        <p><b>{PHAP_LY.tenCongTy}</b> · MST {PHAP_LY.mst}</p>
        <p>{PHAP_LY.diaChi}</p>
        <p>{f.email}</p>
        <p>© {new Date().getFullYear()} coastalland.vn</p>
      </div>
    </footer>
  );
}
