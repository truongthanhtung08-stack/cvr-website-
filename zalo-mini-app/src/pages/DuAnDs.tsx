import React from "react";
import { Box, Page, Spinner } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import TheDuAn from "../components/TheDuAn";
import { layDuAnTrang } from "../lib/tin";
import { useTai } from "../lib/useTai";

// Trang Dự án — hai phần như web: Dự án nổi bật (theo cấp) · Tra cứu dự án (A-B-C). Cùng một kiểu thẻ, lưới 2 cột.
export default function DuAnDs() {
  const { data, dangTai } = useTai(() => layDuAnTrang(), [], { noiBat: [], traCuu: [] });
  return (
    <Page style={{ paddingBottom: 72 }}>
      <TieuDe title="Dự án" />
      {dangTai ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : (
        <>
          {data.noiBat.length > 0 && <h2 className="tieu-de-phan">Dự án nổi bật</h2>}
          <div className="luoi-du-an">{data.noiBat.map((d) => <TheDuAn key={d.slug} duAn={d} />)}</div>
          {data.traCuu.length > 0 && <h2 className="tieu-de-phan">Tra cứu dự án</h2>}
          <div className="luoi-du-an">{data.traCuu.map((d) => <TheDuAn key={d.slug} duAn={d} />)}</div>
        </>
      )}
    </Page>
  );
}
