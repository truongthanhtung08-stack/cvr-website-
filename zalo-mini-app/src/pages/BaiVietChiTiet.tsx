import React from "react";
import { Box, Header, Page, Spinner, Text } from "zmp-ui";
import { useParams } from "react-router-dom";
import NoiDung from "../components/NoiDung";
import { anh, layMotBaiViet } from "../lib/tin";
import { ngay } from "../lib/dinhDang";
import { useTai } from "../lib/useTai";

export default function BaiVietChiTiet() {
  const { slug = "" } = useParams();
  const { data: b, dangTai } = useTai(() => layMotBaiViet(slug), [slug], null);
  if (dangTai) return <Page><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (!b)
    return (
      <Page>
        <Header title="Tin tức" />
        <Box p={4}><Text className="chu-phu">Bài viết không còn hiển thị.</Text></Box>
      </Page>
    );
  return (
    <Page style={{ background: "#fff" }}>
      <Header title="Tin tức" />
      {b.image && <img src={anh(b.image)} alt={b.title} style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block" }} />}
      <Box p={4}>
        <Text.Title size="large">{b.title}</Text.Title>
        <Text size="xSmall" className="chu-phu" style={{ margin: "6px 0 12px" }}>{[b.category, ngay(b.published_at)].filter(Boolean).join(" · ")}</Text>
        {b.content && <NoiDung text={b.content} />}
      </Box>
    </Page>
  );
}
