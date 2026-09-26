import React, { useEffect, useRef, useState } from "react";
import { Box, Header, Icon, Page, Spinner, Text, useNavigate } from "zmp-ui";
import { useParams } from "react-router-dom";
import TheTin from "../components/TheTin";
import XemSo from "../components/XemSo";
import { anh, hangHieuLuc, layTinChiTiet, layTinTuongTu, type TinChiTiet } from "../lib/tin";
import { gia, dienTich, diaChi, ngay } from "../lib/dinhDang";
import { NHAN_THONG_SO } from "../lib/nhanThongSo";
import { daLuu, doiLuu } from "../lib/daLuu";
import { ghiDaXem } from "../lib/daXem";
import { chiaSeTin } from "../lib/zalo";
import { useTai } from "../lib/useTai";

// CHI TIẾT TIN — theo đúng trang /bat-dong-san/<id> của web (bản điện thoại):
// ảnh (số ảnh, 1/N) · nhãn hạng + Mã tin + Chia sẻ · ngày đăng · tiêu đề · địa chỉ mới + hệ cũ ·
// khung Mức giá / Diện tích / Giá m² + thông số 2 cột · Mô tả · Tiện ích · BĐS tương tự ·
// nút đen cố định "0981 ••• ••• · Hiện số để gọi".

const NHAN_HANG: Record<string, { ten: string; mau: string }> = {
  diamond: { ten: "Tin Diamond", mau: "#c1121f" },
  gold: { ten: "Tin Gold", mau: "#b8860b" },
  silver: { ten: "Tin Silver", mau: "#2f5d84" },
  basic: { ten: "Tin thường", mau: "#6e6e73" },
};

const laDat = (t: TinChiTiet) => /đất/i.test(t.type);

// Giá / m² — như web: đất, căn hộ tự tính; NHÀ chỉ hiện khi người bán tự ghi.
function giaM2(t: TinChiTiet): string | null {
  const tr = (v: number) => `${(v / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr/m²${laDat(t) ? " đất" : ""}`;
  if (t.don_gia_ban) return tr(t.don_gia_ban);
  if (t.purpose !== "ban" || !t.price_vnd || !t.area_m2 || !/đất|căn hộ|chung cư/i.test(t.type)) return null;
  return tr(t.price_vnd / t.area_m2);
}

function AnhTin({ ds, tieuDe }: { ds: (string | undefined)[]; tieuDe: string }) {
  const khung = useRef<HTMLDivElement>(null);
  const [so, setSo] = useState(1);
  return (
    <div style={{ position: "relative" }}>
      <div ref={khung} className="banner-khung" onScroll={(e) => setSo(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth) + 1)}>
        {ds.map((u, i) => (
          <img key={i} src={anh(u)} alt={tieuDe} style={{ flex: "0 0 100%", width: "100%", aspectRatio: "16 / 10", objectFit: "cover", scrollSnapAlign: "start" }} />
        ))}
      </div>
      <span className="so-anh" style={{ top: 10, bottom: "auto", left: 10 }}>
        <Icon icon="zi-camera" size={14} /> {ds.length}
      </span>
      {ds.length > 1 && <span className="so-anh" style={{ left: "auto", right: 10 }}>{so}/{ds.length}</span>}
    </div>
  );
}

export default function ChiTietTin() {
  const { id = "" } = useParams();
  const dieuHuong = useNavigate();
  const { data: tin, dangTai, loi } = useTai(() => layTinChiTiet(id), [id], null);
  const tuongTu = useTai(() => (tin ? layTinTuongTu(tin) : Promise.resolve([])), [tin?.id], []);
  const [luu, setLuu] = useState(() => daLuu(id));
  useEffect(() => {
    if (tin) ghiDaXem(tin.id);
  }, [tin]);

  if (dangTai) return <Page><Header title="Chi tiết tin" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (loi || !tin)
    return (
      <Page>
        <Header title="Chi tiết tin" />
        <Box p={4}><Text className="chu-phu">{loi ?? "Tin này không còn hiển thị."}</Text></Box>
      </Page>
    );

  const hang = NHAN_HANG[hangHieuLuc(tin)];
  const cu = tin.dia_chi_cu;
  const diaChiCu = cu ? [cu.phuong, cu.quan, cu.tinh].filter(Boolean).join(", ") : "";
  const dg = giaM2(tin);

  // Thông số 2 cột — giống khung đặc điểm trên web.
  const thongSo: [string, string][] = [
    ...(tin.built_area_m2 ? [["Diện tích xây dựng", `${tin.built_area_m2.toLocaleString("vi-VN")} m²`] as [string, string]] : []),
    ...(tin.beds ? [["Phòng ngủ", String(tin.beds)] as [string, string]] : []),
    ...(tin.baths ? [["Phòng tắm", String(tin.baths)] as [string, string]] : []),
    ...Object.entries(tin.dac_diem ?? {})
      .filter(([, v]) => v !== "" && v != null)
      .map(([k, v]) => {
        const [nhan, donVi] = NHAN_THONG_SO[k] ?? [k];
        return [donVi ? `${nhan} (${donVi})` : nhan, String(v)] as [string, string];
      }),
    ...(tin.huong ? [["Hướng", tin.huong] as [string, string]] : []),
    ...(tin.phap_ly ? [["Pháp lý", tin.phap_ly] as [string, string]] : []),
    ...(tin.noi_that ? [["Nội thất", tin.noi_that] as [string, string]] : []),
    ["Loại hình", tin.type],
  ];
  const tienIch = [...(tin.tien_ich ?? []), ...(tin.noi_that_ds ?? [])];

  return (
    <Page style={{ paddingBottom: 96, background: "#fff" }}>
      <Header title="Chi tiết tin" />
      <AnhTin ds={tin.images?.length ? tin.images : [undefined]} tieuDe={tin.title} />

      <Box px={4} pt={3}>
        <Box flex alignItems="center" style={{ gap: 8, flexWrap: "wrap" }}>
          <span className="nhan-loai" style={{ color: hang.mau, borderColor: `${hang.mau}55` }}>{hang.ten}</span>
          <Text size="xSmall" className="chu-phu">Mã tin: {tin.id.slice(0, 8).toUpperCase()}</Text>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="nut-vien" onClick={() => setLuu(doiLuu(tin.id))} aria-label="Lưu tin">
              <Icon icon={luu ? "zi-heart-solid" : "zi-heart"} size={18} style={luu ? { color: "#e11d48" } : undefined} />
            </button>
            <button className="nut-vien" onClick={() => chiaSeTin(tin.title, `${gia(tin)} · ${diaChi(tin)}`, anh(tin.images?.[0]))}>
              <Icon icon="zi-share-external-1" size={18} /> Chia sẻ
            </button>
          </div>
        </Box>
        {tin.published_at && <Text size="xSmall" className="chu-phu" style={{ marginTop: 6 }}>· Đăng {ngay(tin.published_at)}</Text>}
        <h1 className="tieu-de-tin">{tin.title}</h1>
        <Box flex style={{ gap: 6 }}>
          <Icon icon="zi-location" size={18} style={{ color: "var(--cl-muted)", flex: "none" }} />
          <div>
            <Text size="small" style={{ color: "var(--cl-body)" }}>{diaChi(tin)}</Text>
            {diaChiCu && <Text size="xSmall" className="chu-phu" style={{ marginTop: 2 }}>Địa chỉ hệ cũ: {diaChiCu}</Text>}
          </div>
        </Box>
      </Box>

      <div className="khung-gia">
        <div className="luoi-2">
          <div><span>Mức giá</span><strong className="gia">{gia(tin)}</strong></div>
          <div><span>{laDat(tin) ? "Diện tích đất" : "Diện tích"}</span><strong>{dienTich(tin) ?? "—"}</strong></div>
          {dg && <div><span>Giá / m²</span><strong>{dg}</strong></div>}
        </div>
        {thongSo.length > 0 && (
          <div className="luoi-2" style={{ borderTop: "1px solid var(--cl-line)", marginTop: 14, paddingTop: 14 }}>
            {thongSo.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}
          </div>
        )}
      </div>

      {tin.description && (
        <Box px={4} pt={2}>
          <h2 className="muc-tin">Thông tin mô tả</h2>
          <Text size="small" style={{ whiteSpace: "pre-line", lineHeight: 1.7, color: "var(--cl-body)" }}>{tin.description}</Text>
        </Box>
      )}

      {tienIch.length > 0 && (
        <Box px={4} pt={2}>
          <h2 className="muc-tin">Tiện ích</h2>
          <Box flex style={{ flexWrap: "wrap", gap: 8 }}>{tienIch.map((x) => <span key={x} className="chip">{x}</span>)}</Box>
        </Box>
      )}

      {tin.du_an && (
        <Box px={4} pt={2}>
          <h2 className="muc-tin">Dự án</h2>
          <Box flex justifyContent="space-between" alignItems="center" onClick={() => tin.du_an_slug && dieuHuong(`/du-an/${tin.du_an_slug}`)}>
            <Text size="small" style={{ fontWeight: 600 }}>{tin.du_an}</Text>
            {tin.du_an_slug && <Icon icon="zi-chevron-right" />}
          </Box>
        </Box>
      )}

      {tin.nguoi_dang && (
        <Box px={4} pt={2} pb={2}>
          <h2 className="muc-tin">Người đăng</h2>
          <Box flex alignItems="center" style={{ gap: 12 }}>
            <span className="o-tron"><Icon icon="zi-user" /></span>
            <Text style={{ fontWeight: 600 }}>{tin.nguoi_dang}</Text>
          </Box>
        </Box>
      )}

      {tuongTu.data.length > 0 && (
        <section className="khoi" style={{ background: "var(--cl-surface)" }}>
          <div className="khoi-dau"><Text.Title size="small">Bất động sản tương tự</Text.Title></div>
          <div className="truot-ngang">{tuongTu.data.map((t) => <TheTin key={t.id} tin={t} />)}</div>
        </section>
      )}

      <div className="nut-chinh">
        <div style={{ flex: 1, minWidth: 0 }}><XemSo listingId={tin.id} soAn={tin.sdt_an} /></div>
      </div>
    </Page>
  );
}
