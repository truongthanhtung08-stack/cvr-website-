import React, { useState } from "react";
import { Box, Input, Page, Spinner, useNavigate } from "zmp-ui";
import Banner from "../components/Banner";
import Khoi from "../components/Khoi";
import TheTin from "../components/TheTin";
import TheDuAn from "../components/TheDuAn";
import TheBaiViet from "../components/TheBaiViet";
import IconCL, { type TenIcon } from "../components/IconCL";
import { anh, layBaiViet, layBanner, layDuAn, layKhuVuc, layTinDanhChoBan, layTinVip, NHOM_DANH_CHO_BAN } from "../lib/tin";
import { useTai } from "../lib/useTai";
import { nhanCoastalLand } from "../lib/zalo";
import logoTron from "../assets/logo-tron.svg";

// TRANG CHỦ — cấu trúc chuẩn Mini App Zalo (không bê nguyên web):
// Đầu trang (logo tròn + tên app, ngang cụm ⋯ ✕) · ô tìm · banner · lưới dịch vụ ·
// Tin VIP · Dành cho bạn · Dự án nổi bật · Theo khu vực · Tin tức.
// Banner, khu vực lấy từ /admin/noi-dung — admin đổi là web và Mini App cùng đổi.

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

// Đường dẫn của web (trong nội dung admin) → trang tương ứng trong Mini App.
function duongMiniApp(href?: string): string | null {
  if (!href) return null;
  const duAn = href.match(/^\/du-an\/([^/?#]+)/);
  if (duAn) return `/du-an/${duAn[1]}`;
  const tinh = href.match(/[?&]tinh=([^&]+)/);
  if (tinh) return `/ds/${href.startsWith("/cho-thue") ? "thue" : "ban"}?kv=${tinh[1]}`;
  if (href.startsWith("/mua-ban")) return "/ds/ban";
  if (href.startsWith("/cho-thue")) return "/ds/thue";
  return null;
}

export default function TrangChu() {
  const dieuHuong = useNavigate();
  const [nhom, setNhom] = useState(0);
  const banner = useTai(() => layBanner(), [], []);
  const vip = useTai(() => layTinVip(10), [], []);
  const danhCho = useTai(() => layTinDanhChoBan(NHOM_DANH_CHO_BAN[nhom]), [nhom], []);
  const duAn = useTai(() => layDuAn(8), [], []);
  const khuVuc = useTai(() => layKhuVuc(), [], []);
  const bai = useTai(() => layBaiViet(4), [], []);
  const n = NHOM_DANH_CHO_BAN[nhom];
  const xemThemDanhCho = "md" in n ? `/ds/${n.md}${"loai" in n ? `?loai=${encodeURIComponent(n.loai)}` : ""}` : "/ds/ban";

  return (
    <Page style={{ paddingBottom: 72, paddingTop: 0 }}>
      <div className="dau-app">
        <div className="hang-app">
          <img src={logoTron} alt="" />
          <div>
            <strong>Coastal Land</strong>
            <span>Nhà đất Miền Trung</span>
          </div>
        </div>
        <div onClick={() => dieuHuong("/tim-kiem")}>
          <Input.Search placeholder="Tìm nhà đất, khu vực, dự án…" readOnly />
        </div>
      </div>

      {banner.data.length > 0 && (
        <div className="khung-banner">
          <Banner ds={banner.data} bam={(s) => { const d = duongMiniApp(s.href); if (d) dieuHuong(d); }} />
        </div>
      )}

      <div className="luoi-dv">
        {DICH_VU.map((d) => (
          <button key={d.nhan} onClick={() => ("bam" in d ? d.bam() : dieuHuong(d.duong))}>
            <span className="o" style={{ background: d.nen, color: d.mau }}><IconCL ten={d.icon} co={24} /></span>
            {d.nhan}
          </button>
        ))}
      </div>

      {vip.data.length > 0 && (
        <Khoi tieuDe="Tin VIP nổi bật" xemThem="/ds/ban">
          <div className="truot-ngang">{vip.data.map((t) => <TheTin key={t.id} tin={t} />)}</div>
        </Khoi>
      )}

      <Khoi tieuDe="Dành cho bạn" xemThem={xemThemDanhCho}>
        <div className="chip-loc">
          {NHOM_DANH_CHO_BAN.map((g, i) => (
            <button key={g.nhan} className={i === nhom ? "bat" : ""} onClick={() => setNhom(i)}>{g.nhan}</button>
          ))}
        </div>
        <Cho dang={danhCho.dangTai} />
        {!danhCho.dangTai && <div className="truot-ngang">{danhCho.data.map((t) => <TheTin key={t.id} tin={t} />)}</div>}
      </Khoi>

      {duAn.data.length > 0 && (
        <Khoi tieuDe="Dự án nổi bật" xemThem="/du-an">
          <div className="truot-ngang">{duAn.data.map((d) => <TheDuAn key={d.slug} duAn={d} />)}</div>
        </Khoi>
      )}

      {khuVuc.data.length > 0 && (
        <Khoi tieuDe="Theo khu vực">
          <div className="luoi-khu-vuc">
            {khuVuc.data.map((k, i) => (
              <div
                key={k.name}
                className={`o-khu-vuc${i === 0 ? " lon" : ""}`}
                onClick={() => dieuHuong(duongMiniApp(k.href) ?? `/ds/ban?kv=${encodeURIComponent(k.name)}`)}
              >
                <img src={anh(k.image)} alt={k.name} loading="lazy" />
                <div>
                  <strong>{k.name}</strong>
                  {k.count && <span>{k.count}</span>}
                </div>
              </div>
            ))}
          </div>
        </Khoi>
      )}

      {bai.data.length > 0 && (
        <Khoi tieuDe="Tin tức thị trường" xemThem="/tin-tuc">
          {bai.data.map((b) => <TheBaiViet key={b.slug} bai={b} />)}
        </Khoi>
      )}
    </Page>
  );
}
