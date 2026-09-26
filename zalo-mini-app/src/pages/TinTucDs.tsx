import React from "react";
import { Box, Header, Page, Spinner } from "zmp-ui";
import TheBaiViet from "../components/TheBaiViet";
import { layBaiViet } from "../lib/tin";
import { useTai } from "../lib/useTai";

export default function TinTucDs() {
  const { data, dangTai } = useTai(() => layBaiViet(), [], []);
  return (
    <Page>
      <Header title="Tin tức & cẩm nang" />
      {dangTai ? <Box flex justifyContent="center" p={6}><Spinner /></Box> : data.map((b) => <TheBaiViet key={b.slug} bai={b} />)}
    </Page>
  );
}
