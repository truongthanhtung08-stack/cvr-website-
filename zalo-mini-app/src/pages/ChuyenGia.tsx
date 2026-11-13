import React, { useState } from "react";
import { Box, Icon, Input, Page, Spinner, Text, useNavigate } from "zmp-ui";
import { useParams } from "react-router-dom";
import TieuDe from "../components/TieuDe";
import DanhSachTin from "../components/DanhSachTin";
import { layNhieuTin } from "../lib/tin";
import BieuTuongWeb from "../components/BieuTuongWeb";
import { useTai } from "../lib/useTai";

// DANH BẠ CHUYÊN GIA — bản gọn của web (/chuyen-gia): người bán, cho thuê nhà đất trên Coastal Land, gom từ tin thật trên máy chủ web
// (/api/chuyen-gia — số đã che). Bấm một người → tin đang đăng của họ (liên hệ ngay trong từng tin, như web).
const WEB = "https://coastalland.vn";
type CG = { slug: string; ten: string; anh?: string; soTin: number; khuVuc: string[]; loaiHinh: string[]; sdtChe: string[] };
const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

function Anh({ cg }: { cg: CG }) {
  return cg.anh ? <img className="cg-anh" src={cg.anh} alt="" /> : <span className="cg-anh"><BieuTuongWeb ten="nguoi" co={24} /></span>;
}

export function DanhBaChuyenGia() {
  const dieuHuong = useNavigate();
  const [tim, setTim] = useState("");
  const { data, dangTai } = useTai(async () => ((await (await fetch(`${WEB}/api/chuyen-gia`)).json()).ds ?? []) as CG[], [], [] as CG[]);
  const ds = tim.trim() ? data.filter((c) => boDau(`${c.ten} ${c.khuVuc.join(" ")}`).includes(boDau(tim.trim()))) : data;
  return (
    <Page>
      <TieuDe title="Chuyên gia" />
      <div className="khung-tim"><Input.Search placeholder="Tìm theo tên, khu vực…" value={tim} onChange={(e) => setTim(e.target.value)} /></div>
      {dangTai ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : !ds.length ? (
        <Box p={6} style={{ textAlign: "center" }}><Text className="chu-phu">Không có chuyên gia khớp.</Text></Box>
      ) : (
        <div className="ds-dong">
          {ds.map((c) => (
            <div key={c.slug} className="dong-cg" onClick={() => dieuHuong(`/chuyen-gia/${c.slug}`)}>
              <Anh cg={c} />
              <div>
                <b>{c.ten}</b>
                <span>{c.soTin} tin · {c.khuVuc.slice(0, 2).join(", ")}</span>
                {c.loaiHinh.length > 0 && <span>{c.loaiHinh.join(" · ")}</span>}
              </div>
              <Icon icon="zi-chevron-right" />
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}

export default function HoSoChuyenGia() {
  const { slug = "" } = useParams();
  const ho = useTai(async () => (await (await fetch(`${WEB}/api/chuyen-gia?slug=${encodeURIComponent(slug)}`)).json()) as { ok: boolean; cg?: CG; tin?: string[] }, [slug], null);
  const tin = useTai(() => layNhieuTin(ho.data?.tin ?? []), [ho.data?.tin?.join(",")], []);
  const cg = ho.data?.cg;
  return (
    <Page style={{ paddingBottom: 24 }}>
      <TieuDe title={cg?.ten ?? "Chuyên gia"} />
      {ho.dangTai ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : !cg ? (
        <Box p={6} style={{ textAlign: "center" }}><Text className="chu-phu">Không tìm thấy chuyên gia.</Text></Box>
      ) : (
        <>
          <div className="dong-cg dau-cg">
            <Anh cg={cg} />
            <div>
              <b>{cg.ten}</b>
              <span>{cg.soTin} tin · {cg.khuVuc.join(", ")}</span>
              {cg.loaiHinh.length > 0 && <span>{cg.loaiHinh.join(" · ")}</span>}
            </div>
          </div>
          <DanhSachTin ds={tin.data} dangTai={tin.dangTai} loi={tin.loi} trong="Chưa có tin đang hiển thị." />
        </>
      )}
    </Page>
  );
}
