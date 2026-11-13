import React from "react";
import { Box, Button, Page, Spinner, Text } from "zmp-ui";
import { openOutApp } from "zmp-sdk";
import TieuDe from "../components/TieuDe";
import ThuGonTin from "../components/ThuGonTin";
import { useParams } from "react-router-dom";
import NoiDung from "../components/NoiDung";
import BieuTuongWeb from "../components/BieuTuongWeb";
import TheTinDoc from "../components/TheTinDoc";
import { anh, layChiTietDuAn, layTinDuAn } from "../lib/tin";
import { diaChiDuAn } from "../lib/dinhDang";
import { useTai } from "../lib/useTai";
import { chiaSeTin, nhanCoastalLand } from "../lib/zalo";
import { AnhTin } from "./ChiTietTin";
import { tachAnh, tachVideo } from "../lib/media";

// CHI TIẾT DỰ ÁN — ĐỦ MỤC NHƯ TRANG DỰ ÁN WEB ĐIỆN THOẠI (src/app/du-an/[slug]/page.tsx, 14/11/2026 "web một nẻo, đây một nẻo"):
// ảnh → tên + địa chỉ → Tổng quan dự án (bảng thông số: Chủ đầu tư · Đơn vị phát triển · Loại hình · Tình trạng · Giá từ · quy mô theo
// Admin, rồi phần giới thiệu, "Cập nhật ngày") → Vị trí → Tiện ích dự án → Mặt bằng dự án → Bảng giá & loại hình (chỉ khi Admin cho hiện
// giá) → Chủ đầu tư (khi có thông tin công ty) → Tin thuộc dự án. Mục nào chưa có dữ liệu thì ẩn — như web.
const ngayVN = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");

export default function DuAnChiTiet() {
  const { slug = "" } = useParams();
  const { data: d, dangTai } = useTai(() => layChiTietDuAn(slug), [slug], null);
  const tinDuAn = useTai(() => layTinDuAn(slug), [slug], []);
  if (dangTai) return <Page><TieuDe title="Dự án" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (!d)
    return (
      <Page>
        <TieuDe title="Dự án" />
        <Box p={4}><Text className="chu-phu">Dự án này không còn hiển thị.</Text></Box>
      </Page>
    );
  const ct = d.ct ?? {};
  const hienGia = ct.priceMode === "show";
  const giaTu = d.price_from ? String(d.price_from) : "";
  const boMuc = ["Tình trạng", "Chủ đầu tư", "Loại hình", "Giá từ"];
  const thongSo = [
    ["Chủ đầu tư", d.developer || "Đang cập nhật"],
    ...(ct.developmentUnit ? [["Đơn vị phát triển", ct.developmentUnit]] : []),
    ["Loại hình", d.type || "Đang cập nhật"],
    ["Tình trạng", d.status_text || "Đang cập nhật"],
    ...(hienGia && giaTu ? [["Giá từ", giaTu]] : []),
    ...(d.scale ?? []).filter((s) => s?.label && s?.value && !boMuc.includes(s.label) && !/địa chỉ|vị trí/i.test(s.label)).map((s) => [s.label, s.value]),
  ] as [string, string][];
  const anhs = tachAnh(d.images ?? []);
  const matBang = (ct.floorPlans ?? []).filter((f) => f?.image);
  const bangGia = hienGia ? (ct.priceTable ?? []).filter((p) => p && (p.unit || p.area || p.price)) : [];
  const cdt = ct.developerInfo;
  const coCdt = !!d.developer && !!(cdt?.logo || cdt?.established || cdt?.website || cdt?.desc);
  const diaChi = diaChiDuAn(d);
  const moBanDo = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ct.mapPin?.trim() || diaChi)}`;
    openOutApp({ url }).catch(() => { window.location.href = url; });
  };

  return (
    <Page style={{ paddingBottom: 96 }}>
      <TieuDe title="Chi tiết dự án" />
      <AnhTin anhs={anhs} videos={tachVideo(d.images ?? [])} tieuDe={d.name} />

      <section className="khoi-ct">
        <h1 className="tieu-de-tin">{d.name}</h1>
        <p className="dong-dc"><BieuTuongWeb ten="viTri" co={16} /><span>{diaChi}</span></p>
      </section>

      <ThuGonTin>
        <section className="khoi-ct">
          <h2 className="muc-tin">Tổng quan dự án</h2>
          <div className="bang-ts">
            {thongSo.map(([k, v]) => (
              <div key={k}><span>{k}</span><strong className={v === "Đang cập nhật" ? "mo" : ""}>{v}</strong></div>
            ))}
          </div>
          {/* Như web: bảng thông số luôn hiện, chỉ phần giới thiệu dài mới thu gọn */}
          {d.overview && <div data-thu-gon="mo-ta" style={{ marginTop: 20 }}><NoiDung text={d.overview} /></div>}
          {(ct.ngayCapNhat || d.updated_at) && <p className="ngay-cap-nhat">Cập nhật ngày {ngayVN(ct.ngayCapNhat || d.updated_at)}</p>}
        </section>

        {diaChi && (
          <section className="khoi-ct">
            <h2 className="muc-tin">Vị trí & tiện ích xung quanh</h2>
            <p className="dong-dc"><BieuTuongWeb ten="viTri" co={16} /><span>{diaChi}</span></p>
            <button className="nut-ban-do" onClick={moBanDo}><BieuTuongWeb ten="viTri" co={18} /> Xem vị trí trên Google Maps</button>
          </section>
        )}

        {d.amenities?.length > 0 && (
          <section className="khoi-ct">
            <h2 className="muc-tin">Tiện ích dự án</h2>
            <div className="ds-tien-ich">
              {d.amenities.map((x) => <span key={x}><BieuTuongWeb ten="dau" co={16} />{x}</span>)}
            </div>
          </section>
        )}

        {matBang.length > 0 && (
          <section className="khoi-ct">
            <h2 className="muc-tin">Mặt bằng dự án</h2>
            <div className="mat-bang">
              {matBang.map((f, i) => (
                <figure key={i}>
                  <img src={anh(f.image!)} alt={f.label || d.name} loading="lazy" />
                  {(f.label || f.note) && <figcaption>{f.label}{f.note ? ` · ${f.note}` : ""}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {bangGia.length > 0 && (
          <section className="khoi-ct">
            <h2 className="muc-tin">Bảng giá & loại hình</h2>
            <div className="bang-gia-da">
              <div className="dau"><span>Loại căn</span><span>Diện tích</span><span>Hướng</span><span>Giá</span></div>
              {bangGia.map((u, i) => (
                <div key={i}><span>{u.unit || "—"}</span><span>{u.area || "—"}</span><span>{u.direction || "—"}</span><span>{u.price || "Liên hệ"}</span></div>
              ))}
            </div>
          </section>
        )}

        {coCdt && (
          <section className="khoi-ct">
            <h2 className="muc-tin">Chủ đầu tư</h2>
            <div className="cdt-dau">
              {cdt?.logo && <img src={anh(cdt.logo)} alt={d.developer ?? ""} />}
              <div>
                <strong>{d.developer}</strong>
                {cdt?.established && <small>{cdt.established}</small>}
              </div>
            </div>
            {cdt?.desc && <div style={{ marginTop: 12 }}><NoiDung text={cdt.desc} /></div>}
            {ct.developmentUnit && <p className="chu-phu" style={{ marginTop: 12 }}>Đơn vị phát triển: <b>{ct.developmentUnit}</b></p>}
          </section>
        )}
      </ThuGonTin>

      {tinDuAn.data.length > 0 && (
        <section className="khoi-ct">
          <h2 className="muc-tin">Tin thuộc dự án</h2>
          <div style={{ display: "grid", gap: 12 }}>{tinDuAn.data.map((t) => <TheTinDoc key={t.id} tin={t} />)}</div>
        </section>
      )}

      <div className="nut-chinh">
        <Button variant="secondary" onClick={() => chiaSeTin(d.name, diaChi, anh(anhs[0]), `/du-an/${slug}`)}>Chia sẻ</Button>
        <Button fullWidth onClick={() => nhanCoastalLand(`Tôi quan tâm dự án ${d.name}`)}>Nhận thông tin dự án</Button>
      </div>
    </Page>
  );
}
