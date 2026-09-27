import React from "react";
import { Box, Input, Page, Spinner, useNavigate } from "zmp-ui";
import Khoi from "../components/Khoi";
import TheTin from "../components/TheTin";
import TheDuAn from "../components/TheDuAn";
import TruotNgang from "../components/TruotNgang";
import IconCL, { type TenIcon } from "../components/IconCL";
import { layDuAn, layTinhCoTin, layTinTrangChu } from "../lib/tin";
import { useTai } from "../lib/useTai";
import { nhanCoastalLand } from "../lib/zalo";
import logoTron from "../assets/logo-tron.svg";

// TRANG CHỦ — cấu trúc chuẩn Mini App Zalo (không bê nguyên web):
// Đầu trang (logo tròn + tên app, ngang cụm ⋯ ✕) · ô tìm ·
// Menu dịch vụ 2 hàng (hàng 1 = mua bán/cho thuê/dự án/đăng tin · hàng 2 = tiện ích) ·
// Nhà đất bán · Nhà đất cho thuê (mỗi khối: VIP trước, tin mới sau, slide tự trôi như web) · Dự án · Khu vực.
// Phần lớn trang là TIN (80/20). Không banner (chủ dự án bỏ 27/09).

type DichVu = { nhan: string; icon: TenIcon; nen: string; mau: string } & ({ duong: string } | { bam: () => void });
const DICH_VU: DichVu[] = [
  { nhan: "Mua bán", icon: "muaBan", nen: "#eef4ff", mau: "#0071e3", duong: "/ds/ban" },
  { nhan: "Cho thuê", icon: "choThue", nen: "#eaf7ef", mau: "#1a8f4c", duong: "/ds/thue" },
  { nhan: "Dự án", icon: "duAn", nen: "#fbf4e6", mau: "#8a6d2e", duong: "/du-an" },
  { nhan: "Đăng tin", icon: "dangTin", nen: "#fff0f0", mau: "#d70018", duong: "/dang-tin" },
  { nhan: "Tin tức", icon: "tinTuc", nen: "#f2efff", mau: "#6b4fd8", duong: "/tin-tuc" },
  { nhan: "Bảng giá", icon: "bangGia", nen: "#eef4ff", mau: "#0071e3", duong: "/bang-gia" },
  { nhan: "Tính vay", icon: "tinhVay", nen: "#eaf7ef", mau: "#1a8f4c", duong: "/tinh-vay" },
  { nhan: "Tư vấn", icon: "tuVan", nen: "#fbf4e6", mau: "#8a6d2e", bam: () => nhanCoastalLand() },
];

function Cho({ dang }: { dang: boolean }) {
  return dang ? <Box flex justifyContent="center" p={4}><Spinner /></Box> : null;
}

export default function TrangChu() {
  const dieuHuong = useNavigate();
  const ban = useTai(() => layTinTrangChu("ban"), [], []);
  const thue = useTai(() => layTinTrangChu("thue"), [], []);
  const duAn = useTai(() => layDuAn(8), [], []);
  const tinh = useTai(() => layTinhCoTin("ban"), [], []); // tỉnh đang có tin thật — không ảnh, không số bịa

  return (
    <Page style={{ paddingBottom: 72, paddingTop: 0 }}>
      <div className="dau-app">
        <div className="hang-app">
          <img src={logoTron} alt="" />
          <div>
            <strong>Coastal Land</strong>
            <span>Cổng đăng tin nhà đất</span>
          </div>
        </div>
        <div onClick={() => dieuHuong("/tim-kiem")}>
          <Input.Search placeholder="Tìm nhà đất, khu vực, dự án…" readOnly />
        </div>
      </div>

      <div className="luoi-dv">
        {DICH_VU.map((d) => (
          <button key={d.nhan} onClick={() => ("bam" in d ? d.bam() : dieuHuong(d.duong))}>
            <span className="o" style={{ background: d.nen, color: d.mau }}><IconCL ten={d.icon} co={24} /></span>
            {d.nhan}
          </button>
        ))}
      </div>

      {/* Hai khối tin song song: BÁN · CHO THUÊ — mỗi khối tin VIP xếp trước, rồi tin mới. */}
      <Khoi tieuDe="Nhà đất bán" xemThem="/ds/ban">
        <Cho dang={ban.dangTai} />
        {!ban.dangTai && <TruotNgang>{ban.data.map((t) => <TheTin key={t.id} tin={t} />)}</TruotNgang>}
      </Khoi>

      <Khoi tieuDe="Nhà đất cho thuê" xemThem="/ds/thue">
        <Cho dang={thue.dangTai} />
        {!thue.dangTai && <TruotNgang>{thue.data.map((t) => <TheTin key={t.id} tin={t} />)}</TruotNgang>}
      </Khoi>

      {duAn.data.length > 0 && (
        <Khoi tieuDe="Dự án nổi bật" xemThem="/du-an">
          <TruotNgang>{duAn.data.map((d) => <TheDuAn key={d.slug} duAn={d} />)}</TruotNgang>
        </Khoi>
      )}

      {tinh.data.length > 0 && (
        <Khoi tieuDe="Tìm theo khu vực">
          <div className="chip-loc boc">
            {tinh.data.map((t) => (
              <button key={t} onClick={() => dieuHuong(`/ds/ban?kv=${encodeURIComponent(t)}`)}>{t}</button>
            ))}
          </div>
        </Khoi>
      )}

    </Page>
  );
}
