import React from "react";
import { Box, Page, Spinner } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import TheBaiViet from "../components/TheBaiViet";
import { layBaiViet } from "../lib/tin";
import { useTai } from "../lib/useTai";

export default function TinTucDs() {
  const { data, dangTai } = useTai(() => layBaiViet(), [], []);
  return (
    <Page>
      <TieuDe title="Tin tức" />
      {dangTai ? <Box flex justifyContent="center" p={6}><Spinner /></Box> : <div className="luoi-du-an">{data.map((b) => <TheBaiViet key={b.slug} bai={b} />)}</div>}
    </Page>
  );
}
