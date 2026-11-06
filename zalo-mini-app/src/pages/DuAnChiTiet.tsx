import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Page, Spinner, Text } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { useParams } from "react-router-dom";
import NoiDung from "../components/NoiDung";
import { anh, layMotDuAn } from "../lib/tin";
import { diaChiDuAn } from "../lib/dinhDang";
import { useTai } from "../lib/useTai";
import { chiaSeTin, nhanCoastalLand } from "../lib/zalo";
import { AnhTin } from "./ChiTietTin";
import { tachAnh, tachVideo } from "../lib/media";

// CHI TIẾT DỰ ÁN — CÙNG CHUẨN trang chi tiết tin (06/11/2026): ảnh 4:3 vuốt · khối đầu (tên, vị trí, tình trạng) · Thông tin dự án
// 2 cột · Tiện ích · Tổng quan · thu gọn cả trang (Xem thêm trong phần chữ, Thu gọn cuối trang) · thanh nút cố định đáy.
export default function DuAnChiTiet() {
  const { slug = "" } = useParams();
  const { data: d, dangTai } = useTai(() => layMotDuAn(slug), [slug], null);
  if (dangTai) return <Page><TieuDe title="Dự án" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (!d)
    return (
      <Page>
        <TieuDe title="Dự án" />
        <Box p={4}><Text className="chu-phu">Dự án này không còn hiển thị.</Text></Box>
      </Page>
    );
  const thongTin = [
    ["Loại hình", d.type],
    ["Chủ đầu tư", d.developer],
    ["Tình trạng", d.status_text],
  ].filter(([, v]) => v) as [string, string][];
  const anhs = tachAnh(d.images ?? []);
  return (
    <Page style={{ paddingBottom: 96 }}>
      <TieuDe title="Chi tiết dự án" />
      {/* CÙNG KHUNG ẢNH trang tin (06/11/2026 "cả dự án cũng thế"): 4:3, video đứng đầu, đếm video · ảnh, bấm ảnh → danh sách dọc → xem lớn */}
      <AnhTin anhs={anhs} videos={tachVideo(d.images ?? [])} tieuDe={d.name} />

      <section className="khoi-ct">
        <h1 className="tieu-de-tin">{d.name}</h1>
        <p className="dong-dc">{diaChiDuAn(d)}</p>
        {/* Tình trạng đã có ở bảng Thông tin dự án bên dưới — bỏ nhãn trùng dưới tên (06/11/2026). */}
      </section>

        {thongTin.length > 0 && (
          <section className="khoi-ct">
            <h2 className="muc-tin">Thông tin dự án</h2>
            <div className="dong-ds">
              {thongTin.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}
            </div>
          </section>
        )}
        {d.overview && (
          <section className="khoi-ct">
            <h2 className="muc-tin">Tổng quan</h2>
            <GonDoan><NoiDung text={d.overview} /></GonDoan>
          </section>
        )}
        {d.amenities?.length > 0 && (
          <section className="khoi-ct">
            <h2 className="muc-tin">Tiện ích</h2>
            <Box flex style={{ flexWrap: "wrap", gap: 8 }}>{d.amenities.map((x) => <span key={x} className="chip">{x}</span>)}</Box>
          </section>
        )}

      <div className="nut-chinh">
        <Button variant="secondary" onClick={() => chiaSeTin(d.name, diaChiDuAn(d), anh(anhs[0]), `/du-an/${slug}`)}>Chia sẻ</Button>
        <Button fullWidth onClick={() => nhanCoastalLand(`Tôi quan tâm dự án ${d.name}`)}>Nhận thông tin dự án</Button>
      </div>
    </Page>
  );
}

// NHƯ TRANG TIN: phần chữ dài thu gọn, nút "Xem thêm" / "Thu gọn" NGAY DƯỚI phần chữ (không đặt cuối trang).
function GonDoan({ children }: { children: React.ReactNode }) {
  const khung = useRef<HTMLDivElement>(null);
  const [mo, setMo] = useState(false);
  const [dai, setDai] = useState(false);
  useEffect(() => {
    const el = khung.current;
    if (el) setDai(el.scrollHeight > el.clientHeight + 4);
  }, [children]);
  return (
    <>
      <div ref={khung} className={mo ? undefined : "doan-gon"}>{children}</div>
      {(dai || mo) && (
        <button className="nut-mo-ta" onClick={() => { if (mo) khung.current?.closest("section")?.scrollIntoView({ block: "start" }); setMo(!mo); }}>
          {mo ? "Thu gọn" : "Xem thêm"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transform: mo ? "rotate(180deg)" : undefined }}><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}
    </>
  );
}
