import React from "react";
import { Box, Header, Page, Spinner } from "zmp-ui";
import TheDuAn from "../components/TheDuAn";
import { layDuAn } from "../lib/tin";
import { useTai } from "../lib/useTai";

export default function DuAnDs() {
  const { data, dangTai } = useTai(() => layDuAn(), [], []);
  return (
    <Page style={{ paddingBottom: 72 }}>
      <Header title="Dự án" showBackIcon={false} />
      {dangTai ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : (
        <Box p={3} style={{ display: "grid", gap: 12 }}>{data.map((d) => <TheDuAn key={d.slug} duAn={d} />)}</Box>
      )}
    </Page>
  );
}
