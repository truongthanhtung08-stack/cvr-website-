import React from "react";
import { Box, Text, useNavigate } from "zmp-ui";
import { anh, type DuAn } from "../lib/tin";
import { diaChiDuAn } from "../lib/dinhDang";

export default function TheDuAn({ duAn }: { duAn: DuAn }) {
  const dieuHuong = useNavigate();
  return (
    <div className="the-tin" onClick={() => dieuHuong(`/du-an/${duAn.slug}`)}>
      <div style={{ position: "relative" }}>
        <img src={anh(duAn.images?.[0])} alt={duAn.name} loading="lazy" />
        {duAn.status_text && <span className="nhan-hang" style={{ background: "var(--cl-blue)" }}>{duAn.status_text}</span>}
      </div>
      <Box p={3}>
        <Text.Title size="small" className="cat-dong">{duAn.name}</Text.Title>
        {duAn.type && <Text size="xSmall" className="chu-phu">{duAn.type}</Text>}
        <Text size="xSmall" className="chu-phu">{diaChiDuAn(duAn)}</Text>
      </Box>
    </div>
  );
}
