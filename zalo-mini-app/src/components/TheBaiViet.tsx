import React from "react";
import { Text, useNavigate } from "zmp-ui";
import { anh, type BaiViet } from "../lib/tin";
import { ngay } from "../lib/dinhDang";

export default function TheBaiViet({ bai }: { bai: BaiViet }) {
  const dieuHuong = useNavigate();
  return (
    <div className="the-ngang" onClick={() => dieuHuong(`/tin-tuc/${bai.slug}`)}>
      <img src={anh(bai.image ?? undefined)} alt={bai.title} loading="lazy" />
      <div>
        <Text size="small" style={{ fontWeight: 600 }} className="cat-dong">{bai.title}</Text>
        <Text size="xSmall" className="chu-phu" style={{ marginTop: 4 }}>{[bai.category, ngay(bai.published_at)].filter(Boolean).join(" · ")}</Text>
      </div>
    </div>
  );
}
