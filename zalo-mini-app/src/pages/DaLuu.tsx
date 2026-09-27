import React from "react";
import { Page } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import DanhSachTin from "../components/DanhSachTin";
import { dsDaLuu } from "../lib/daLuu";
import { layNhieuTin } from "../lib/tin";
import { useTai } from "../lib/useTai";

export default function DaLuu() {
  const ids = dsDaLuu();
  const { data, dangTai, loi } = useTai(() => layNhieuTin(ids), [ids.join(",")], []);
  return (
    <Page style={{ paddingBottom: 72 }}>
      <TieuDe title="Tin đã lưu" showBackIcon={false} />
      <DanhSachTin ds={data} dangTai={dangTai} loi={loi} trong="Chưa có tin đã lưu." />
    </Page>
  );
}
