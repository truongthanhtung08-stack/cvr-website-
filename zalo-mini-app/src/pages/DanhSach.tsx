import React, { useEffect, useState } from "react";
import { Input, Page, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { useParams, useSearchParams } from "react-router-dom";
import DanhSachTin from "../components/DanhSachTin";
import ThanhLoc from "../components/ThanhLoc";
import { BO_LOC_TRONG, type BoLoc, type MucDich, soBoLocDangBat } from "../lib/boLoc";
import { layTinhCoTin, locTin } from "../lib/tin";
import { useTai } from "../lib/useTai";
import { usePhien } from "../lib/supabase";
import { luuTimKiem } from "../lib/timKiemLuu";

// Tab MUA BÁN / CHO THUÊ (hai tab dưới riêng như web): ô tìm, hàng lọc, danh sách tin.
export default function DanhSach() {
  const dieuHuong = useNavigate();
  const { md: mdUrl } = useParams();
  const md: MucDich = mdUrl === "thue" ? "thue" : "ban";
  const [thamSoUrl] = useSearchParams();
  // Vào từ ô khu vực / nút "Xem thêm" trang chủ: ?kv=Quy Nhơn · ?loai=Nhà riêng
  const tuUrl = (): BoLoc => ({ ...BO_LOC_TRONG, khuVuc: thamSoUrl.get("kv") ?? undefined, loai: thamSoUrl.get("loai") ?? undefined, gia: thamSoUrl.get("gia") ?? undefined, dienTich: thamSoUrl.get("dt") ?? undefined });
  const [boLoc, setBoLoc] = useState<BoLoc>(tuUrl);
  // Đổi Mua bán ↔ Cho thuê: loại hình, mức giá khác nhau → bắt đầu lại bộ lọc.
  useEffect(() => setBoLoc(tuUrl()), [md, thamSoUrl.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

  // NHẬN TIN MỚI (như nút chuông web — src/components/LuuTimKiem.tsx): lưu bộ lọc đang xem; chưa đăng nhập → đăng nhập rồi quay lại.
  const { nguoiDung } = usePhien();
  const [luu, setLuu] = useState<string>();
  useEffect(() => setLuu(undefined), [md, JSON.stringify(boLoc)]); // eslint-disable-line react-hooks/exhaustive-deps
  const nhanTinMoi = async () => {
    if (!nguoiDung) return dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(`/ds/${md}`)}`);
    setLuu("…");
    setLuu((await luuTimKiem(nguoiDung.id, md, boLoc)) ?? "Đã lưu");
  };

  const dsTinh = useTai(() => layTinhCoTin(md), [md], []);
  const { data, dangTai, loi } = useTai(() => locTin(md, boLoc), [md, JSON.stringify(boLoc)], []);
  const noi = boLoc.phuong ?? boLoc.khuVuc ?? boLoc.tinh;

  return (
    <Page style={{ paddingBottom: 72 }}>
      <TieuDe title={md === "thue" ? "Cho thuê" : "Mua bán"} showBackIcon={false} />
      <div className="khung-tim">
        <div onClick={() => dieuHuong("/tim-kiem")}>
          <Input.Search placeholder="Tìm theo khu vực, dự án, đường…" readOnly />
        </div>
      </div>
      <ThanhLoc md={md} boLoc={boLoc} doi={setBoLoc} dsTinh={dsTinh.data} />
      <div className="hang-tieu-de-ds">
        {/* Tiêu đề như trang web (ListingBrowser): "Mua bán nhà đất tháng 11/2026" · có loại / nơi thì ghép vào */}
        <h1 className="tieu-de-ds">
          {boLoc.loai ? `${md === "thue" ? "Cho thuê" : "Bán"} ${boLoc.loai.toLowerCase()}` : `${md === "thue" ? "Cho thuê" : "Mua bán"} nhà đất`}
          {noi ? ` ${noi}` : ""} tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
        </h1>
        {/* Như web: nút Nhận tin mới chỉ hiện khi khách đang lọc */}
        {soBoLocDangBat(boLoc) > 0 && (
          <button className="nut-chuong" disabled={!!luu} onClick={nhanTinMoi}>{luu ?? "Nhận tin mới"}</button>
        )}
      </div>
      <DanhSachTin ds={data} dangTai={dangTai} loi={loi} trong="Chưa có tin khớp bộ lọc." />
    </Page>
  );
}
