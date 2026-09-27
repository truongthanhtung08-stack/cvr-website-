import React, { useEffect, useRef, useState } from "react";
import { Box, Icon, ImageViewer, Page, Sheet, Spinner, Text, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { useParams } from "react-router-dom";
import TheTin from "../components/TheTin";
import TruotNgang from "../components/TruotNgang";
import XemSo from "../components/XemSo";
import { anh, hangHieuLuc, layTinChiTiet, layTinTuongTu, type TinChiTiet } from "../lib/tin";
import { gia, dienTich, diaChi, ngay } from "../lib/dinhDang";
import { NHAN_THONG_SO } from "../lib/nhanThongSo";
import { daLuu, doiLuu } from "../lib/daLuu";
import { ghiDaXem } from "../lib/daXem";
import { chiaSeTin } from "../lib/zalo";
import { useTai } from "../lib/useTai";

// CHI TIẾT TIN — kiểu Mini App Zalo: ảnh · các khối trắng trên nền xám (giá + tiêu đề ·
// đặc điểm dạng dòng · mô tả thu gọn · tiện ích · dự án · người đăng · tin tương tự) · nút gọi cố định.

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

// ẢNH TIN — chép đúng khung ảnh web điện thoại (src/components/Gallery.tsx, khối sm:hidden):
// khung 16:9 vuốt ngang từng tấm (KHÔNG tự chạy) · huy hiệu số ảnh góc trên trái ·
// nút ‹ › hai bên (ẩn ở tấm đầu/cuối) · dải mờ đáy: "Tất cả ảnh" trái, "n/N" phải ·
// chạm ảnh → xem lớn toàn màn hình (ImageViewer của Zalo, vuốt + phóng to được).
function AnhTin({ ds, tieuDe }: { ds: (string | undefined)[]; tieuDe: string }) {
  const khung = useRef<HTMLDivElement>(null);
  const [dang, setDang] = useState(0);
  const [xemLon, setXemLon] = useState<number | null>(null);
  const [tatCa, setTatCa] = useState(false);
  const toi = (i: number) => khung.current?.scrollTo({ left: i * khung.current.clientWidth, behavior: "smooth" });
  const anhLon = ds.map((u) => ({ src: anh(u), alt: tieuDe }));

  return (
    <div className="anh-tin">
      <div ref={khung} className="anh-tin-khung" onScroll={(e) => setDang(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {ds.map((u, i) => (
          <img key={i} src={anh(u)} alt={`${tieuDe} ${i + 1}`} onClick={() => setXemLon(i)} />
        ))}
      </div>
      <span className="anh-tin-dem">
        <Icon icon="zi-camera" size={14} /> {ds.length}
      </span>
      {ds.length > 1 && dang > 0 && (
        <button className="anh-tin-nut trai" aria-label="Tấm trước" onClick={() => toi(dang - 1)}><Icon icon="zi-chevron-left" size={20} /></button>
      )}
      {ds.length > 1 && dang < ds.length - 1 && (
        <button className="anh-tin-nut phai" aria-label="Tấm sau" onClick={() => toi(dang + 1)}><Icon icon="zi-chevron-right" size={20} /></button>
      )}
      <div className="anh-tin-day">
        <button onClick={() => setTatCa(true)}><Icon icon="zi-gallery" size={16} /> Tất cả ảnh</button>
        <span>{dang + 1}/{ds.length}</span>
      </div>
      <ImageViewer images={anhLon} activeIndex={xemLon ?? 0} visible={xemLon !== null} onClose={() => setXemLon(null)} maskStyle={{ background: "#000" }} />
      <Sheet visible={tatCa} onClose={() => setTatCa(false)} mask handler swipeToClose title={`Tất cả ảnh (${ds.length})`}>
        <div className="anh-tat-ca">
          {ds.map((u, i) => (
            <img key={i} src={anh(u)} alt={`${tieuDe} ${i + 1}`} loading="lazy" onClick={() => { setTatCa(false); setXemLon(i); }} />
          ))}
        </div>
      </Sheet>
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

  if (dangTai) return <Page><TieuDe title="Chi tiết tin" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (loi || !tin)
    return (
      <Page>
        <TieuDe title="Chi tiết tin" />
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
    <Page style={{ paddingBottom: 96 }}>
      <TieuDe title="Chi tiết tin" />
      <AnhTin ds={tin.images?.length ? tin.images : [undefined]} tieuDe={tin.title} />

      <section className="khoi-ct">
        <div className="gia-ct">
          <strong>{gia(tin)}</strong>
          {dienTich(tin) && <span>{dienTich(tin)}</span>}
          {dg && <span>{dg}</span>}
        </div>
        <h1 className="tieu-de-tin">{tin.title}</h1>
        <p className="dong-dc">
          <Icon icon="zi-location" size={16} />
          <span>
            {diaChi(tin)}
            {diaChiCu && <small>Hệ cũ: {diaChiCu}</small>}
          </span>
        </p>
        <div className="meta-ct">
          <span className="nhan-loai" style={{ color: hang.mau, borderColor: `${hang.mau}55` }}>{hang.ten}</span>
          <span>Mã {tin.id.slice(0, 8).toUpperCase()}</span>
          {tin.published_at && <span>· {ngay(tin.published_at)}</span>}
          <div className="nut-ct">
            <button onClick={() => setLuu(doiLuu(tin.id))} aria-label="Lưu tin">
              <Icon icon={luu ? "zi-heart-solid" : "zi-heart"} size={20} style={luu ? { color: "#e11d48" } : undefined} />
            </button>
            <button onClick={() => chiaSeTin(tin.title, `${gia(tin)} · ${diaChi(tin)}`, anh(tin.images?.[0]))} aria-label="Chia sẻ">
              <Icon icon="zi-share-external-1" size={20} />
            </button>
          </div>
        </div>
      </section>

      <section className="khoi-ct">
        <h2 className="muc-tin">Đặc điểm</h2>
        <div className="dong-ds">
          {[[laDat(tin) ? "Diện tích đất" : "Diện tích", dienTich(tin) ?? "—"] as [string, string], ...thongSo].map(([k, v]) => (
            <div key={k}><span>{k}</span><strong>{v}</strong></div>
          ))}
        </div>
      </section>

      {tin.description && <MoTa noiDung={tin.description} />}

      {tienIch.length > 0 && (
        <section className="khoi-ct">
          <h2 className="muc-tin">Tiện ích</h2>
          <Box flex style={{ flexWrap: "wrap", gap: 8 }}>{tienIch.map((x) => <span key={x} className="chip">{x}</span>)}</Box>
        </section>
      )}

      {(tin.du_an || tin.nguoi_dang) && (
        <section className="khoi-ct dong-ds dong-bam">
          {tin.du_an && (
            <div onClick={() => tin.du_an_slug && dieuHuong(`/du-an/${tin.du_an_slug}`)}>
              <span>Dự án</span>
              <strong>{tin.du_an}{tin.du_an_slug && <Icon icon="zi-chevron-right" size={18} />}</strong>
            </div>
          )}
          {tin.nguoi_dang && (
            <div>
              <span>Người đăng</span>
              <strong>{tin.nguoi_dang}</strong>
            </div>
          )}
        </section>
      )}

      {tuongTu.data.length > 0 && (
        <section className="khoi-ct" style={{ padding: "14px 0 16px" }}>
          <h2 className="muc-tin" style={{ padding: "0 16px" }}>Tin tương tự</h2>
          <TruotNgang>{tuongTu.data.slice(0, 8).map((t) => <TheTin key={t.id} tin={t} />)}</TruotNgang>
        </section>
      )}

      <div className="nut-chinh">
        <div style={{ flex: 1, minWidth: 0 }}><XemSo sdt={tin.sdt} soAn={tin.sdt_an} /></div>
      </div>
    </Page>
  );
}

// Mô tả dài thu gọn 6 dòng, bấm "Xem thêm" mới mở hết (kiểu Zalo).
function MoTa({ noiDung }: { noiDung: string }) {
  const [mo, setMo] = useState(false);
  const dai = noiDung.length > 280;
  return (
    <section className="khoi-ct">
      <h2 className="muc-tin">Mô tả</h2>
      <p className={`mo-ta-ct${mo || !dai ? "" : " gon"}`}>{noiDung}</p>
      {dai && <button className="xem-them-ct" onClick={() => setMo(!mo)}>{mo ? "Thu gọn" : "Xem thêm"}</button>}
    </section>
  );
}
