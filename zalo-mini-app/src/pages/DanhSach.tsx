import React, { useEffect, useState } from "react";
import { Header, Page } from "zmp-ui";
import { useParams, useSearchParams } from "react-router-dom";
import DanhSachTin from "../components/DanhSachTin";
import ThanhLoc from "../components/ThanhLoc";
import { BO_LOC_TRONG, type BoLoc, type MucDich } from "../lib/boLoc";
import { layTinhCoTin, locTin } from "../lib/tin";
import { useTai } from "../lib/useTai";

// Tab Mua bán / Cho thuê — danh sách tin + bộ lọc giống trang /mua-ban, /cho-thue trên web.
export default function DanhSach() {
  const { md: mdUrl } = useParams();
  const md: MucDich = mdUrl === "thue" ? "thue" : "ban";
  const [thamSoUrl] = useSearchParams();
  // Vào từ ô khu vực / nút "Xem thêm" trang chủ: ?kv=Quy Nhơn · ?loai=Nhà riêng
  const tuUrl = (): BoLoc => ({ ...BO_LOC_TRONG, khuVuc: thamSoUrl.get("kv") ?? undefined, loai: thamSoUrl.get("loai") ?? undefined });
  const [boLoc, setBoLoc] = useState<BoLoc>(tuUrl);
  // Đổi tab Mua bán ↔ Cho thuê: loại hình, mức giá khác nhau → bắt đầu lại bộ lọc.
  useEffect(() => setBoLoc(tuUrl()), [md, thamSoUrl.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

  const dsTinh = useTai(() => layTinhCoTin(md), [md], []);
  const { data, dangTai, loi } = useTai(() => locTin(md, boLoc), [md, JSON.stringify(boLoc)], []);
  const ten = md === "thue" ? "cho thuê" : "bán";

  return (
    <Page style={{ paddingBottom: 72 }}>
      <Header title={boLoc.khuVuc ? `Nhà đất ${ten} ${boLoc.khuVuc}` : `Nhà đất ${ten}`} showBackIcon={false} />
      <ThanhLoc md={md} boLoc={boLoc} doi={setBoLoc} dsTinh={dsTinh.data} />
      <DanhSachTin ds={data} dangTai={dangTai} loi={loi} trong="Chưa có tin khớp bộ lọc." />
    </Page>
  );
}
