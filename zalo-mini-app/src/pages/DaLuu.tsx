import React from "react";
import { Header, Page } from "zmp-ui";
import DanhSachTin from "../components/DanhSachTin";
import { dsDaLuu } from "../lib/daLuu";
import { layNhieuTin } from "../lib/tin";
import { useTai } from "../lib/useTai";

export default function DaLuu() {
  const ids = dsDaLuu();
  const { data, dangTai, loi } = useTai(() => layNhieuTin(ids), [ids.join(",")], []);
  return (
    <Page>
      <Header title="Tin đã lưu" />
      <DanhSachTin ds={data} dangTai={dangTai} loi={loi} trong="Chưa có tin đã lưu." />
    </Page>
  );
}
