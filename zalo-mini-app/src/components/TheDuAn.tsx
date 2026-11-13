import React from "react";
import { useNavigate } from "zmp-ui";
import { anh, type DuAn } from "../lib/tin";
import { diaChiDuAn } from "../lib/dinhDang";
import { tachAnh } from "../lib/media";
import logoTron from "../assets/logo-tron.svg";

// Thẻ dự án — CHỮ DƯỚI ẢNH THEO THẺ DỰ ÁN MỘT CHUẨN của web (ProjectSlider ChuTheChuan, chốt 30–31/10/2026):
// tên 2 dòng · vị trí (có ghim) · "Loại hình:" · dòng cuối gạch trên: "Chủ đầu tư:" + giá (vàng đậm). Trống → "Đang cập nhật" mờ.
// Màu cấp = đúng src/lib/packages.ts của web (cùng bảng HANG trong TheTin).
const MAU_CAP: Record<string, string> = { diamond: "#c1121f", gold: "#b8860b", silver: "#2f5d84" };

function Dong({ nhan, gt }: { nhan: string; gt: string | null }) {
  return (
    <p className="dong-da"><b>{nhan}:</b> <span className={gt ? "" : "mo"}>{gt || "Đang cập nhật"}</span></p>
  );
}

export default function TheDuAn({ duAn }: { duAn: DuAn }) {
  const dieuHuong = useNavigate();
  const viTri = diaChiDuAn(duAn);
  const mau = MAU_CAP[duAn.tier ?? ""];
  return (
    <div className="the-tin the-du-an" onClick={() => dieuHuong(`/du-an/${duAn.slug}`)}>
      <div className="anh-the">
        {/* Ảnh bìa = ẢNH đầu tiên (bỏ qua link video YouTube nằm chung mảng images — như web) */}
        {tachAnh(duAn.images)[0] ? <img src={anh(tachAnh(duAn.images)[0])} alt={duAn.name} loading="lazy" /> : <div className="anh-trong"><img src={logoTron} alt="" /></div>}
        {/* Như web (NhanTinhTrang): chỉ dự án cấp VIP có nhãn tình trạng trên ảnh + dải màu cấp đỉnh ảnh; màu theo cấp */}
        {mau && <span className="dai-da" style={{ background: mau }} aria-hidden />}
        {mau && <span className="nhan-da" style={{ background: mau }}>{duAn.status_text || "Đang cập nhật"}</span>}
      </div>
      <div className="than-the">
        <h3 className="tieu-de dam">{duAn.name}</h3>
        <p className="vi-tri-da">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M17.657 16.657 13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" />
            <path d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
          </svg>
          <span className={viTri ? "" : "mo"}>{viTri || "Đang cập nhật"}</span>
        </p>
        <Dong nhan="Loại hình" gt={duAn.type} />
        <div className="day-da">
          <Dong nhan="Chủ đầu tư" gt={duAn.developer} />
          <span className="gia-da">{duAn.price_from ? String(duAn.price_from) : "Liên hệ"}</span>
        </div>
      </div>
    </div>
  );
}
