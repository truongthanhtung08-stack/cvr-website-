import React from "react";
import { useNavigate } from "zmp-ui";
import { anh, type DuAn } from "../lib/tin";
import { diaChiDuAn } from "../lib/dinhDang";

// Thẻ dự án — cùng chuẩn thẻ tin ở dải nổi bật (06/11/2026): ảnh tỷ lệ vàng · tên đủ 2 dòng · loại hình · địa chỉ 1 dòng.
export default function TheDuAn({ duAn }: { duAn: DuAn }) {
  const dieuHuong = useNavigate();
  return (
    <div className="the-tin the-du-an" onClick={() => dieuHuong(`/du-an/${duAn.slug}`)}>
      <div className="anh-the">
        <img src={anh(duAn.images?.[0])} alt={duAn.name} loading="lazy" />
        {duAn.status_text && <span className="nhan-hang" style={{ background: "var(--cl-blue)" }}>{duAn.status_text}</span>}
      </div>
      <div className="than-the">
        <h3 className="tieu-de dam">{duAn.name}</h3>
        {duAn.type && <p className="dong-phu">{duAn.type}</p>}
        <p className="dong-phu">{diaChiDuAn(duAn)}</p>
      </div>
    </div>
  );
}
