import React from "react";
import { Box, Page, Spinner, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { anh, layBaiViet, type BaiViet } from "../lib/tin";
import { ngay } from "../lib/dinhDang";
import { useTai } from "../lib/useTai";
import logoTron from "../assets/logo-tron.svg";

// TIN TỨC = TRANG TIN TỨC WEB ĐIỆN THOẠI (src/app/tin-tuc, đo cạnh nhau 14/11/2026): tiêu đề + câu giới thiệu (chữ web) · bài nổi bật
// ảnh lớn chữ đè lên ảnh · các bài sau ảnh rộng + tiêu đề 2 dòng + tóm tắt 2 dòng + "chuyên mục · ngày".
export default function TinTucDs() {
  const dieuHuong = useNavigate();
  const { data, dangTai } = useTai(() => layBaiViet(), [], []);
  const [dau, ...con] = data;
  const anhBai = (b: BaiViet) => (b.image ? <img src={anh(b.image)} alt={b.title} loading="lazy" /> : <div className="anh-trong"><img src={logoTron} alt="" /></div>);
  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title="Tin tức" />
      <h1 className="tieu-de-form">Tin tức bất động sản</h1>
      <p className="gioi-thieu-tt">Phân tích thị trường, cẩm nang &amp; kinh nghiệm mua bán, cho thuê nhà đất.</p>
      {dangTai ? <Box flex justifyContent="center" p={6}><Spinner /></Box> : (
        <div className="ds-bai">
          {dau && (
            <article className="bai-noi-bat" onClick={() => dieuHuong(`/tin-tuc/${dau.slug}`)}>
              {anhBai(dau)}
              <div><h2>{dau.title}</h2><p>{[dau.category, ngay(dau.published_at)].filter(Boolean).join(" · ")}</p></div>
            </article>
          )}
          {con.map((b) => (
            <article key={b.slug} className="bai-dong" onClick={() => dieuHuong(`/tin-tuc/${b.slug}`)}>
              <div className="bai-anh">{anhBai(b)}</div>
              <h3>{b.title}</h3>
              {b.excerpt && <p className="tom-tat">{b.excerpt}</p>}
              <p className="phu">{[b.category, ngay(b.published_at)].filter(Boolean).join(" · ")}</p>
            </article>
          ))}
        </div>
      )}
    </Page>
  );
}
