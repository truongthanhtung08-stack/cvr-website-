import React, { useState } from "react";
import { useNavigate } from "zmp-ui";
import { anh, hangHieuLuc, type Tin } from "../lib/tin";
import { gia, dienTich, diaChi, luc, tomTatTin } from "../lib/dinhDang";
import { daLuu, doiLuu } from "../lib/daLuu";

// Thẻ tin ẢNH TRÊN · CHỮ DƯỚI (chủ dự án chốt 27/09 — app chạy trên điện thoại).
// Ảnh vừa phải để nhường chỗ cho tiêu đề + nội dung: hạng · số ảnh · tim trên ảnh;
// dưới ảnh: tiêu đề 2 dòng · nội dung 2 dòng · giá + diện tích · địa chỉ + thời gian.
// Dùng chung cho danh sách dọc (.ds-doc) và dải trượt ngang (.truot-ngang).
const HANG: Record<string, { ten: string; mau: string }> = {
  diamond: { ten: "Diamond", mau: "#c1121f" },
  gold: { ten: "Gold", mau: "#b8860b" },
  silver: { ten: "Silver", mau: "#2f5d84" },
};

export default function TheTin({ tin }: { tin: Tin }) {
  const dieuHuong = useNavigate();
  const h = HANG[hangHieuLuc(tin)];
  const [luu, setLuu] = useState(() => daLuu(tin.id));
  const moTa = tomTatTin(tin);
  const soAnh = tin.images?.length ?? 0;

  return (
    <article className="the-tin" onClick={() => dieuHuong(`/tin/${tin.id}`)}>
      <div className="anh-the">
        <img src={anh(tin.images?.[0])} alt={tin.title} loading="lazy" />
        {h && <span className="nhan-hang" style={{ background: `${h.mau}e6` }}>{h.ten}</span>}
        {soAnh > 1 && <span className="so-anh">{soAnh} ảnh</span>}
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
        {moTa && <p className="mo-ta">{moTa}</p>}
        <div className="gia-dt">
          <span className="gia" style={tin.price_vnd == null ? { color: "var(--cl-muted)" } : undefined}>{gia(tin)}</span>
          {dienTich(tin) && <span>{dienTich(tin)}</span>}
        </div>
        <div className="day-the-moi">
          <span>{diaChi(tin)}</span>
          <span>{luc(tin)}</span>
        </div>
      </div>
    </article>
  );
}
