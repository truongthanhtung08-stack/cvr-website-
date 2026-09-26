import React from "react";
import { Header, Page } from "zmp-ui";
import DanhSachTin from "../components/DanhSachTin";
import { dsDaXem } from "../lib/daXem";
import { layNhieuTin } from "../lib/tin";
import { useTai } from "../lib/useTai";

export default function DaXem() {
  const ids = dsDaXem();
  const { data, dangTai, loi } = useTai(
    // Giữ đúng thứ tự xem gần nhất trước.
    async () => (await layNhieuTin(ids)).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)),
    [ids.join(",")],
    [],
  );
  return (
    <Page>
      <Header title="Tin đã xem" />
      <DanhSachTin ds={data} dangTai={dangTai} loi={loi} trong="Chưa xem tin nào." />
    </Page>
  );
}
