import React from "react";
import { Input, Page, useNavigate } from "zmp-ui";
import Khoi from "../components/Khoi";
import KhoiNoiBat from "../components/KhoiNoiBat";
import TheDuAn from "../components/TheDuAn";
import TruotNgang from "../components/TruotNgang";
import IconCL, { type TenIcon } from "../components/IconCL";
import { layBaiViet, layDuAnNoiBat, layTinhCoTin } from "../lib/tin";
import TheBaiViet from "../components/TheBaiViet";
import { useTai } from "../lib/useTai";
import { nhanCoastalLand } from "../lib/zalo";
import logoTron from "../assets/logo-tron.svg";
import ChanTrang from "../components/ChanTrang";

// TRANG CHỦ — cấu trúc chuẩn Mini App Zalo (không bê nguyên web):
// Đầu trang (logo tròn + tên app, ngang cụm ⋯ ✕) · ô tìm ·
// Menu dịch vụ 2 hàng (hàng 1 = mua bán/cho thuê/dự án/đăng tin · hàng 2 = tiện ích) ·
// Nhà đất bán · Nhà đất cho thuê (mỗi khối: VIP trước, tin mới sau, slide tự trôi như web) · Dự án · Khu vực.
// Phần lớn trang là TIN (80/20). Không banner (chủ dự án bỏ 27/09).

type DichVu = { nhan: string; icon: TenIcon; nen: string; mau: string } & ({ duong: string } | { bam: () => void });
// Hai hàng, mỗi hàng một việc (06/11/2026 "sắp lại cho logic"): hàng 1 = XEM (3 mảng + Tin tức) · hàng 2 = ĐĂNG (Đăng tin,
// tin của mình, giá đăng, hỏi Coastal Land). Đủ 4 × 2, không ô trống.
const DICH_VU: DichVu[] = [
  { nhan: "Mua bán", icon: "muaBan", nen: "#eef4ff", mau: "#0071e3", duong: "/ds/ban" },
  { nhan: "Cho thuê", icon: "choThue", nen: "#eaf7ef", mau: "#1a8f4c", duong: "/ds/thue" },
  { nhan: "Dự án", icon: "duAn", nen: "#fbf4e6", mau: "#8a6d2e", duong: "/du-an" },
  { nhan: "Tin tức", icon: "tinTuc", nen: "#f2efff", mau: "#6b4fd8", duong: "/tin-tuc" },
  { nhan: "Đăng tin", icon: "dangTin", nen: "#0071e3", mau: "#ffffff", duong: "/dang-tin" },
  { nhan: "Tin của tôi", icon: "taiKhoan", nen: "#eaf7ef", mau: "#1a8f4c", duong: "/tin-cua-toi" },
  { nhan: "Bảng giá", icon: "bangGia", nen: "#eef4ff", mau: "#0071e3", duong: "/bang-gia" },
  { nhan: "Tư vấn", icon: "tuVan", nen: "#fbf4e6", mau: "#8a6d2e", bam: () => nhanCoastalLand() },
];


export default function TrangChu() {
  const dieuHuong = useNavigate();
  const duAn = useTai(() => layDuAnNoiBat(8), [], []); // như web: chỉ dự án nổi bật, theo cấp, 8 dự án — còn lại ở Xem thêm
  const tinh = useTai(() => layTinhCoTin("ban"), [], []);
  const baiViet = useTai(() => layBaiViet(6), [], []); // như web: khối Tin tức trên trang chủ, Xem thêm → danh sách bài // tỉnh đang có tin thật — không ảnh, không số bịa

  return (
    <Page style={{ paddingBottom: 72, paddingTop: 0 }}>
      <div className="dau-app">
        <div className="hang-app">
          <img src={logoTron} alt="" />
          <div>
            <strong>COASTAL LAND</strong>
            <span>Cổng đăng tin mua bán, cho thuê nhà đất</span>
          </div>
        </div>
        <div onClick={() => dieuHuong("/tim-kiem")}>
          <Input.Search placeholder="Tìm nhà đất, khu vực, dự án…" readOnly />
        </div>
      </div>

      {/* Ô công cụ đã BỎ (chủ dự án 06/11/2026: "đã có menu phía dưới thì bỏ dòng menu bên trên") — thanh menu dưới là lối vào chính. */}

      {/* Như web: Bất động sản nổi bật (2 slide × 8 tin theo cấp, có tab + Xem thêm) — thay 2 khối trượt Bán / Cho thuê (06/11/2026) */}
      <KhoiNoiBat />

      {duAn.data.length > 0 && (
        <Khoi tieuDe="Dự án nổi bật" xemThem="/du-an">
          <TruotNgang hep>{duAn.data.map((d) => <TheDuAn key={d.slug} duAn={d} />)}</TruotNgang>
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

      {baiViet.data.length > 0 && (
        <Khoi tieuDe="Tin tức" xemThem="/tin-tuc">
          <TruotNgang hep>{baiViet.data.map((b) => <TheBaiViet key={b.slug} bai={b} />)}</TruotNgang>
        </Khoi>
      )}

      <ChanTrang />
    </Page>
  );
}
