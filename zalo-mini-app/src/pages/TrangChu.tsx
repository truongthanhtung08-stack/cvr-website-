import React, { useState } from "react";
import { Box, Button, Input, Page, Spinner, Text, useNavigate } from "zmp-ui";
import Banner from "../components/Banner";
import Khoi from "../components/Khoi";
import TheTin from "../components/TheTin";
import TheDuAn from "../components/TheDuAn";
import TheBaiViet from "../components/TheBaiViet";
import { anh, layBaiViet, layBanner, layDuAn, layKhuVuc, layTinDanhChoBan, NHOM_DANH_CHO_BAN } from "../lib/tin";
import { useTai } from "../lib/useTai";
import logo from "../assets/logo-trang.svg";

// TRANG CHỦ — theo đúng thứ tự trang chủ web (bản điện thoại):
// Banner · Bất động sản dành cho bạn · Dự án nổi bật · Bất động sản theo khu vực · Tin nổi bật · Đăng tin ngay.
// Banner, khu vực lấy từ /admin/noi-dung — admin đổi là web và Mini App cùng đổi.

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
  const danhCho = useTai(() => layTinDanhChoBan(NHOM_DANH_CHO_BAN[nhom]), [nhom], []);
  const duAn = useTai(() => layDuAn(8), [], []);
  const khuVuc = useTai(() => layKhuVuc(), [], []);
  const bai = useTai(() => layBaiViet(4), [], []);
  const n = NHOM_DANH_CHO_BAN[nhom];
  const xemThemDanhCho = "md" in n ? `/ds/${n.md}${"loai" in n ? `?loai=${encodeURIComponent(n.loai)}` : ""}` : "/ds/ban";

  return (
    <Page style={{ paddingBottom: 72, paddingTop: 0 }}>
      {/* Đầu trang như web: logo + ô tìm. Logo nằm cùng hàng cụm ⋯ ✕ của Zalo. */}
      <Box px={4} pb={3} style={{ background: "var(--cl-ink)", paddingTop: "calc(var(--zaui-safe-area-inset-top, 0px) + 10px)" }}>
        <div style={{ height: 32, display: "flex", alignItems: "center" }}>
          <img src={logo} alt="COASTAL LAND" style={{ height: 26, display: "block" }} />
        </div>
        <Box mt={3} onClick={() => dieuHuong("/tim-kiem")}>
          <Input.Search placeholder="Nhà riêng tại Đà Nẵng" readOnly />
        </Box>
      </Box>

      {banner.data.length > 0 && <Banner ds={banner.data} bam={(s) => { const d = duongMiniApp(s.href); if (d) dieuHuong(d); }} />}

      <Khoi tieuDe="Bất động sản dành cho bạn" xemThem={xemThemDanhCho}>
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
        <Khoi tieuDe="Bất động sản theo khu vực">
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
        <Khoi tieuDe="Tin nổi bật" xemThem="/tin-tuc">
          {bai.data.map((b) => <TheBaiViet key={b.slug} bai={b} />)}
        </Khoi>
      )}

      <section className="khoi" style={{ padding: 20, textAlign: "center", background: "var(--cl-ink)", color: "#fff" }}>
        <img src={logo} alt="COASTAL LAND" style={{ height: 24, margin: "0 auto 10px", display: "block" }} />
        <Text size="small" style={{ color: "#d2d2d7", marginBottom: 14 }}>Cổng đăng tin mua bán, cho thuê bất động sản</Text>
        <Button onClick={() => dieuHuong("/dich-vu")}>Đăng tin ngay</Button>
      </section>
    </Page>
  );
}
