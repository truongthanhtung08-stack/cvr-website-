import React from "react";
import { Box, Button, Page, Spinner, Swiper, Text } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import ThuGonTin from "../components/ThuGonTin";
import { useParams } from "react-router-dom";
import NoiDung from "../components/NoiDung";
import { anh, layMotDuAn } from "../lib/tin";
import { diaChiDuAn } from "../lib/dinhDang";
import { useTai } from "../lib/useTai";
import { chiaSeTin, nhanCoastalLand } from "../lib/zalo";
import logoTron from "../assets/logo-tron.svg";

// CHI TIẾT DỰ ÁN — CÙNG CHUẨN trang chi tiết tin (06/11/2026): ảnh 4:3 vuốt · khối đầu (tên, vị trí, tình trạng) · Thông tin dự án
// 2 cột · Tiện ích · Tổng quan · thu gọn cả trang (Xem thêm trong phần chữ, Thu gọn cuối trang) · thanh nút cố định đáy.
export default function DuAnChiTiet() {
  const { slug = "" } = useParams();
  const { data: d, dangTai } = useTai(() => layMotDuAn(slug), [slug], null);
  if (dangTai) return <Page><TieuDe title="Dự án" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (!d)
    return (
      <Page>
        <TieuDe title="Dự án" />
        <Box p={4}><Text className="chu-phu">Dự án này không còn hiển thị.</Text></Box>
      </Page>
    );
  const thongTin = [
    ["Loại hình", d.type],
    ["Chủ đầu tư", d.developer],
    ["Tình trạng", d.status_text],
  ].filter(([, v]) => v) as [string, string][];
  const anhs = (d.images ?? []).filter((u) => u && !/youtu\.?be|\.mp4|\.webm|\.mov/i.test(u));
  return (
    <Page style={{ paddingBottom: 96 }}>
      <TieuDe title="Chi tiết dự án" />
      {anhs.length ? (
        <Swiper dots loop={anhs.length > 1}>
          {anhs.map((u, i) => (
            <Swiper.Slide key={i}>
              <img src={anh(u)} alt={d.name} style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", display: "block" }} />
            </Swiper.Slide>
          ))}
        </Swiper>
      ) : (
        <div className="anh-trong"><img src={logoTron} alt="" /></div>
      )}

      <section className="khoi-ct">
        <h1 className="tieu-de-tin">{d.name}</h1>
        <p className="dong-dc">{diaChiDuAn(d)}</p>
        {/* Tình trạng đã có ở bảng Thông tin dự án bên dưới — bỏ nhãn trùng dưới tên (06/11/2026). */}
      </section>

      <ThuGonTin>
        {thongTin.length > 0 && (
          <section className="khoi-ct">
            <h2 className="muc-tin">Thông tin dự án</h2>
            <div className="dong-ds">
              {thongTin.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}
            </div>
          </section>
        )}
        {d.overview && (
          <section className="khoi-ct" data-thu-gon="mo-ta">
            <h2 className="muc-tin">Tổng quan</h2>
            <NoiDung text={d.overview} />
          </section>
        )}
        {d.amenities?.length > 0 && (
          <section className="khoi-ct">
            <h2 className="muc-tin">Tiện ích</h2>
            <Box flex style={{ flexWrap: "wrap", gap: 8 }}>{d.amenities.map((x) => <span key={x} className="chip">{x}</span>)}</Box>
          </section>
        )}
      </ThuGonTin>

      <div className="nut-chinh">
        <Button variant="secondary" onClick={() => chiaSeTin(d.name, diaChiDuAn(d), anh(anhs[0]), `/du-an/${slug}`)}>Chia sẻ</Button>
        <Button fullWidth onClick={() => nhanCoastalLand(`Tôi quan tâm dự án ${d.name}`)}>Nhận thông tin dự án</Button>
      </div>
    </Page>
  );
}
