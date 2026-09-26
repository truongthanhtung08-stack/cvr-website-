import React from "react";
import { Box, Button, Header, Page, Spinner, Swiper, Text } from "zmp-ui";
import { useParams } from "react-router-dom";
import NoiDung from "../components/NoiDung";
import { anh, layMotDuAn } from "../lib/tin";
import { diaChiDuAn } from "../lib/dinhDang";
import { useTai } from "../lib/useTai";
import { chiaSeTin, nhanCoastalLand } from "../lib/zalo";

export default function DuAnChiTiet() {
  const { slug = "" } = useParams();
  const { data: d, dangTai } = useTai(() => layMotDuAn(slug), [slug], null);
  if (dangTai) return <Page><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (!d)
    return (
      <Page>
        <Header title="Dự án" />
        <Box p={4}><Text className="chu-phu">Dự án này không còn hiển thị.</Text></Box>
      </Page>
    );
  const thongTin = [
    ["Loại hình", d.type],
    ["Chủ đầu tư", d.developer],
    ["Tình trạng", d.status_text],
    ["Vị trí", diaChiDuAn(d)],
  ].filter(([, v]) => v) as [string, string][];
  const anhs = d.images?.length ? d.images : [undefined];
  return (
    <Page style={{ paddingBottom: 88 }}>
      <Header title={d.name} />
      <Swiper dots loop={anhs.length > 1}>
        {anhs.map((u, i) => (
          <Swiper.Slide key={i}>
            <img src={anh(u)} alt={d.name} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }} />
          </Swiper.Slide>
        ))}
      </Swiper>
      <Box p={4} style={{ background: "#fff" }}>
        <Text.Title size="normal">{d.name}</Text.Title>
        {thongTin.map(([k, v]) => (
          <Box key={k} mt={2} flex justifyContent="space-between" style={{ gap: 12 }}>
            <Text size="small" className="chu-phu">{k}</Text>
            <Text size="small" style={{ textAlign: "right" }}>{v}</Text>
          </Box>
        ))}
      </Box>
      {d.amenities?.length > 0 && (
        <Box mt={2} p={4} style={{ background: "#fff" }}>
          <Text.Title size="small">Tiện ích</Text.Title>
          <Text size="small" style={{ marginTop: 8 }}>{d.amenities.join(" · ")}</Text>
        </Box>
      )}
      {d.overview && (
        <Box mt={2} p={4} style={{ background: "#fff" }}>
          <Text.Title size="small">Tổng quan</Text.Title>
          <Box mt={2}><NoiDung text={d.overview} /></Box>
        </Box>
      )}
      <div className="nut-chinh">
        <Button variant="secondary" onClick={() => chiaSeTin(d.name, diaChiDuAn(d), anh(d.images?.[0]))}>Chia sẻ</Button>
        <Button fullWidth onClick={() => nhanCoastalLand(`Tôi quan tâm dự án ${d.name}`)}>Nhận thông tin dự án</Button>
      </div>
    </Page>
  );
}
