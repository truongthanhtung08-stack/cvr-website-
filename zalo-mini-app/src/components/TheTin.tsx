import React, { useState } from "react";
import { useNavigate } from "zmp-ui";
import { anh, hangHieuLuc, type Tin } from "../lib/tin";
import { gia, dienTich, diaChi } from "../lib/dinhDang";
import { daLuu, doiLuu } from "../lib/daLuu";

// Thẻ tin DỌC gọn cho các dải trượt ngang ở trang chủ (kiểu Mini App Zalo):
// ảnh + hạng + tim · tiêu đề 2 dòng · giá · diện tích · địa chỉ.
const HANG: Record<string, { ten: string; mau: string }> = {
  diamond: { ten: "Diamond", mau: "#c1121f" },
  gold: { ten: "Gold", mau: "#b8860b" },
  silver: { ten: "Silver", mau: "#2f5d84" },
};

export default function TheTin({ tin }: { tin: Tin }) {
  const dieuHuong = useNavigate();
  const h = HANG[hangHieuLuc(tin)];
  const [luu, setLuu] = useState(() => daLuu(tin.id));

  return (
    <article className="the-tin" onClick={() => dieuHuong(`/tin/${tin.id}`)}>
      <div style={{ position: "relative" }}>
        <img src={anh(tin.images?.[0])} alt={tin.title} loading="lazy" />
        {h && <span className="nhan-hang" style={{ background: `${h.mau}e6` }}>{h.ten}</span>}
        <button
          className="nut-tim"
          aria-label="Lưu tin"
          onClick={(e) => {
            e.stopPropagation();
            setLuu(doiLuu(tin.id));
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={luu ? "#e11d48" : "none"} stroke={luu ? "#e11d48" : "#fff"} strokeWidth="2">
            <path d="M12 20.3s-7.5-4.6-9.2-9.4C1.6 7.4 4 4.2 7.4 4.2c2 0 3.5 1.1 4.6 2.6 1.1-1.5 2.6-2.6 4.6-2.6 3.4 0 5.8 3.2 4.6 6.7-1.7 4.8-9.2 9.4-9.2 9.4Z" />
          </svg>
        </button>
      </div>
      <div className="than-the">
        <h3 className="tieu-de">{tin.title}</h3>
        <div className="gia-dt">
          <span className="gia" style={tin.price_vnd == null ? { color: "var(--cl-muted)" } : undefined}>{gia(tin)}</span>
          <span>{dienTich(tin)}</span>
        </div>
        <p className="dia-chi"><span>{diaChi(tin)}</span></p>
      </div>
    </article>
  );
}
