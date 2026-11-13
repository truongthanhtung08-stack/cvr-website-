import React from "react";
import { Box, Button, Page, Spinner, Text, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { useParams } from "react-router-dom";
import NoiDung from "../components/NoiDung";
import { anh, layBaiViet, layMotBaiViet } from "../lib/tin";
import { ngay } from "../lib/dinhDang";
import { useTai } from "../lib/useTai";
import { chiaSeTin } from "../lib/zalo";

// BÀI VIẾT = TRANG BÀI VIẾT WEB ĐIỆN THOẠI (14/11/2026): chuyên mục → tiêu đề → ngày giờ đăng → ảnh 16:9 → nội dung → Chia sẻ → Bài viết khác.
const THU = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const thuNgayGio = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${THU[d.getDay()]}, ${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
};

export default function BaiVietChiTiet() {
  const dieuHuong = useNavigate();
  const { slug = "" } = useParams();
  const { data: b, dangTai } = useTai(() => layMotBaiViet(slug), [slug], null);
  const khac = useTai(() => layBaiViet(), [], []);
  if (dangTai) return <Page><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (!b)
    return (
      <Page>
        <TieuDe title="Tin tức" />
        <Box p={4}><Text className="chu-phu">Bài viết không còn hiển thị.</Text></Box>
      </Page>
    );
  const baiKhac = khac.data.filter((x) => x.slug !== slug).slice(0, 5);
  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title="Tin tức" />
      <article className="bai-viet">
        {b.category && <span className="nhan-muc">{b.category}</span>}
        <h1>{b.title}</h1>
        <p className="ngay-bai">{thuNgayGio(b.published_at)}</p>
        {b.image && <img className="anh-bai" src={anh(b.image)} alt={b.title} />}
        {b.content && <NoiDung text={b.content} />}
        <Box mt={4}>
          <Button size="small" variant="secondary" onClick={() => chiaSeTin(b.title, b.excerpt ?? "", anh(b.image ?? ""), `/tin-tuc/${slug}`)}>
            Chia sẻ
          </Button>
        </Box>
      </article>
      {baiKhac.length > 0 && (
        <section className="bai-khac">
          <h2>Bài viết khác</h2>
          {baiKhac.map((x) => (
            <div key={x.slug} className="dong-bai-khac" onClick={() => dieuHuong(`/tin-tuc/${x.slug}`)}>
              {x.image && <img src={anh(x.image)} alt="" loading="lazy" />}
              <div><b>{x.title}</b><small>{[x.category, ngay(x.published_at)].filter(Boolean).join(" · ")}</small></div>
            </div>
          ))}
        </section>
      )}
    </Page>
  );
}
