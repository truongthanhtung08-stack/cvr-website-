import React, { useState } from "react";
import { Box, Button, Page, Spinner, Text, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { layNhieuTin, anh, type Tin } from "../lib/tin";
import { gia, dienTich, diaChi } from "../lib/dinhDang";
import { tachAnh } from "../lib/media";
import { useTai } from "../lib/useTai";
import { boSoSanh, dsSoSanh } from "../lib/soSanh";

// SO SÁNH BẤT ĐỘNG SẢN — bản gọn của web (src/app/so-sanh): bảng song song thông số các tin đã bấm "So sánh" ở trang tin.
const DONG: [string, (t: Tin) => string][] = [
  ["Mức giá", (t) => gia(t)],
  ["Diện tích", (t) => dienTich(t) ?? "—"],
  ["Phòng ngủ", (t) => (t.beds ? String(t.beds) : "—")],
  ["Phòng tắm", (t) => (t.baths ? String(t.baths) : "—")],
  ["Loại hình", (t) => t.type],
  ["Nhu cầu", (t) => (t.purpose === "thue" ? "Cho thuê" : "Mua bán")],
  ["Khu vực", (t) => diaChi(t)],
];

export default function SoSanh() {
  const dieuHuong = useNavigate();
  const [ids, setIds] = useState(dsSoSanh);
  const { data, dangTai } = useTai(() => layNhieuTin(ids), [ids.join(",")], []);
  const bo = (id: string) => { boSoSanh(id); setIds(dsSoSanh()); };
  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title="So sánh" />
      {dangTai ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : !data.length ? (
        <Box p={6} style={{ display: "grid", gap: 12, textAlign: "center" }}>
          <Text className="chu-phu">Chưa có bất động sản nào để so sánh.</Text>
          <Button onClick={() => dieuHuong("/ds/ban")}>Xem bất động sản</Button>
        </Box>
      ) : (
        <div className="cuon-bang" style={{ padding: "8px 16px 24px" }}>
          <table className="bang-so-sanh">
            <thead>
              <tr>
                <th />
                {data.map((t) => (
                  <th key={t.id}>
                    <img src={anh(tachAnh(t.images)[0])} alt="" onClick={() => dieuHuong(`/tin/${t.id}`)} />
                    <p onClick={() => dieuHuong(`/tin/${t.id}`)}>{t.title}</p>
                    <button onClick={() => bo(t.id)}>Bỏ</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DONG.map(([nhan, lay]) => (
                <tr key={nhan}><td>{nhan}</td>{data.map((t) => <td key={t.id}>{lay(t)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
