import React from "react";
import { Box, Page, Spinner } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import TheDuAn from "../components/TheDuAn";
import { layDuAn } from "../lib/tin";
import { useTai } from "../lib/useTai";

export default function DuAnDs() {
  const { data, dangTai } = useTai(() => layDuAn(), [], []);
  return (
    <Page>
      <TieuDe title="Dự án" />
      {dangTai ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : (
        <div className="luoi-du-an">{data.map((d) => <TheDuAn key={d.slug} duAn={d} />)}</div>
      )}
    </Page>
  );
}
