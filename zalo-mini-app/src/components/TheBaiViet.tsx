import React from "react";
import { useNavigate } from "zmp-ui";
import { anh, type BaiViet } from "../lib/tin";
import { ngay } from "../lib/dinhDang";
import logoTron from "../assets/logo-tron.svg";

// Thẻ bài viết — CÙNG KIỂU thẻ tin / thẻ dự án của Mini App (06/11/2026): ảnh 4:3 · tiêu đề 2 dòng · chuyên mục · ngày.
export default function TheBaiViet({ bai }: { bai: BaiViet }) {
  const dieuHuong = useNavigate();
  return (
    <div className="the-tin the-du-an" onClick={() => dieuHuong(`/tin-tuc/${bai.slug}`)}>
      <div className="anh-the">
        {bai.image ? <img src={anh(bai.image)} alt={bai.title} loading="lazy" /> : <div className="anh-trong"><img src={logoTron} alt="" /></div>}
      </div>
      <div className="than-the">
        <h3 className="tieu-de dam">{bai.title}</h3>
        <p className="dong-phu">{[bai.category, ngay(bai.published_at)].filter(Boolean).join(" · ")}</p>
      </div>
    </div>
  );
}
