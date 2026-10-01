import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "zmp-ui";
import { anh, hangHieuLuc, type Tin } from "../lib/tin";
import { gia, dienTich, diaChi, luc, tomTatTin } from "../lib/dinhDang";
import { daLuu, doiLuu } from "../lib/daLuu";
import { tachAnh, tachVideo } from "../lib/media";
import { theoDoiThe } from "../lib/hienThi";

// Thẻ tin ẢNH TRÊN · CHỮ DƯỚI (chủ dự án chốt 27/09 — app chạy trên điện thoại).
// Ảnh vừa phải để nhường chỗ cho tiêu đề + nội dung: hạng · số ảnh · tim trên ảnh;
// dưới ảnh: tiêu đề 2 dòng · nội dung 2 dòng · giá + diện tích · địa chỉ + thời gian.
// Dùng chung cho danh sách dọc (.ds-doc) và dải trượt ngang (.truot-ngang).
// QUY ĐỊNH HẠNG — Y HỆT WEB (src/lib/packages.ts, chốt 01/10/2026):
//   Diamond: dải nhấn đỏ · huy hiệu · tiêu đề VIẾT HOA, in đậm · 3 dòng mô tả
//   Gold:    dải nhấn vàng · huy hiệu · tiêu đề VIẾT HOA, in đậm · 2 dòng mô tả
//   Silver:  dải nhấn xanh · huy hiệu · tiêu đề in đậm · 1 dòng mô tả
//   Basic:   trình bày mặc định — không dải nhấn, không huy hiệu, không mô tả
const HANG: Record<string, { ten: string; mau: string; dai: string; hoa: boolean; dong: number }> = {
  diamond: { ten: "Diamond", mau: "#c1121f", dai: "#c1121f", hoa: true, dong: 3 },
  gold: { ten: "Gold", mau: "#b8860b", dai: "#d9b84e", hoa: true, dong: 2 },
  silver: { ten: "Silver", mau: "#2f5d84", dai: "#7ea6c8", hoa: false, dong: 1 },
};

export default function TheTin({ tin }: { tin: Tin }) {
  const dieuHuong = useNavigate();
  const h = HANG[hangHieuLuc(tin)];
  const [luu, setLuu] = useState(() => daLuu(tin.id));
  const moTa = tomTatTin(tin);
  const anhs = tachAnh(tin.images);
  const coVideo = tachVideo(tin.images).length > 0;
  const soAnh = anhs.length;
  // Đếm lượt hiển thị chung với web (người đăng thấy ở trang Khách hàng).
  const the = useRef<HTMLElement>(null);
  useEffect(() => (the.current ? theoDoiThe(the.current, tin.id) : undefined), [tin.id]);

  return (
    <article ref={the} className="the-tin" onClick={() => dieuHuong(`/tin/${tin.id}`)}>
      {h && <div className="dai-nhan" style={{ background: h.dai }} aria-hidden />}
      <div className="anh-the">
        <img src={anh(anhs[0])} alt={tin.title} loading="lazy" />
        {h && <span className="nhan-hang" style={{ background: `${h.mau}e6` }}>{h.ten}</span>}
        {(soAnh > 1 || coVideo) && <span className="so-anh">{coVideo ? "▶ Video · " : ""}{soAnh} ảnh</span>}
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
        <h3 className={`tieu-de ${h ? "dam" : "vua"} ${h?.hoa ? "hoa" : ""}`}>{tin.title}</h3>
        {h && moTa && <p className="mo-ta" style={{ WebkitLineClamp: h.dong }}>{moTa}</p>}
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
