import React, { useEffect, useState } from "react";
import { Header, Input, Page, useNavigate } from "zmp-ui";
import { useParams, useSearchParams } from "react-router-dom";
import DanhSachTin from "../components/DanhSachTin";
import ThanhLoc from "../components/ThanhLoc";
import ChonMucDich from "../components/ChonMucDich";
import { BO_LOC_TRONG, type BoLoc, type MucDich } from "../lib/boLoc";
import { layTinhCoTin, locTin } from "../lib/tin";
import { useTai } from "../lib/useTai";

// Tab TÌM TIN — gộp Mua bán + Cho thuê (nút gạt trên cùng), ô tìm, hàng lọc, danh sách tin.
export default function DanhSach() {
  const dieuHuong = useNavigate();
  const { md: mdUrl } = useParams();
  const md: MucDich = mdUrl === "thue" ? "thue" : "ban";
  const [thamSoUrl] = useSearchParams();
  // Vào từ ô khu vực / nút "Xem thêm" trang chủ: ?kv=Quy Nhơn · ?loai=Nhà riêng
  const tuUrl = (): BoLoc => ({ ...BO_LOC_TRONG, khuVuc: thamSoUrl.get("kv") ?? undefined, loai: thamSoUrl.get("loai") ?? undefined });
  const [boLoc, setBoLoc] = useState<BoLoc>(tuUrl);
  // Đổi Mua bán ↔ Cho thuê: loại hình, mức giá khác nhau → bắt đầu lại bộ lọc.
  useEffect(() => setBoLoc(tuUrl()), [md, thamSoUrl.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

  const dsTinh = useTai(() => layTinhCoTin(md), [md], []);
  const { data, dangTai, loi } = useTai(() => locTin(md, boLoc), [md, JSON.stringify(boLoc)], []);
  const ten = md === "thue" ? "cho thuê" : "bán";
  const noi = boLoc.khuVuc ?? boLoc.tinh;

  return (
    <Page style={{ paddingBottom: 72 }}>
      <Header title="Tìm tin" showBackIcon={false} />
      <div className="khung-tim">
        <ChonMucDich giaTri={md} doi={(v) => dieuHuong(`/ds/${v}`, { replace: true, animate: false })} />
        <div onClick={() => dieuHuong("/tim-kiem")}>
          <Input.Search placeholder="Tìm theo khu vực, dự án, đường…" readOnly />
        </div>
      </div>
      <ThanhLoc md={md} boLoc={boLoc} doi={setBoLoc} dsTinh={dsTinh.data} />
      <p className="tieu-de-ds">
        {boLoc.loai ?? `Nhà đất ${ten}`}
        {noi && ` tại ${noi}`}
      </p>
      <DanhSachTin ds={data} dangTai={dangTai} loi={loi} trong="Chưa có tin khớp bộ lọc." />
    </Page>
  );
}
