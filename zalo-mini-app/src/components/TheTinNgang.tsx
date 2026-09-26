import React from "react";
import { useNavigate } from "zmp-ui";
import { anh, hangHieuLuc, type Tin } from "../lib/tin";
import { gia, dienTich, diaChi, luc } from "../lib/dinhDang";

// Thẻ tin NGANG cho danh sách — dạng dòng gọn kiểu Mini App Zalo: ảnh trái, thông tin phải.
const HANG: Record<string, { ten: string; mau: string }> = {
  diamond: { ten: "Diamond", mau: "#c1121f" },
  gold: { ten: "Gold", mau: "#b8860b" },
  silver: { ten: "Silver", mau: "#2f5d84" },
};

export default function TheTinNgang({ tin }: { tin: Tin }) {
  const dieuHuong = useNavigate();
  const h = HANG[hangHieuLuc(tin)];
  return (
    <article className="the-ngang-tin" onClick={() => dieuHuong(`/tin/${tin.id}`)}>
      <div className="anh">
        <img src={anh(tin.images?.[0])} alt={tin.title} loading="lazy" />
        {tin.images?.length > 1 && <span>{tin.images.length} ảnh</span>}
      </div>
      <div className="than">
        <h3>
          {h && <em style={{ color: h.mau, borderColor: h.mau }}>{h.ten}</em>}
          {tin.title}
        </h3>
        <p className="gia-dong">
          <strong style={tin.price_vnd == null ? { color: "var(--cl-muted)" } : undefined}>{gia(tin)}</strong>
          {dienTich(tin) && <span>· {dienTich(tin)}</span>}
        </p>
        <p className="phu">{diaChi(tin)}</p>
        <p className="phu nho">{luc(tin)}</p>
      </div>
    </article>
  );
}
