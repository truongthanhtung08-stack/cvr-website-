import React, { useEffect, useRef, useState } from "react";
import { Box, Spinner, Text } from "zmp-ui";
import TheTin from "./TheTin";
import type { Tin } from "../lib/tin";

// Danh sách tin CHIA TRANG như web (không kéo dài vô tận): 10 tin/trang, số trang ở cuối.
const MOI_TRANG = 10;

// Số trang hiện gọn: trang đầu · quanh trang đang xem · trang cuối (-1 = dấu …).
function soHien(dang: number, tong: number): number[] {
  const ds: number[] = [];
  for (let i = 0; i < tong; i++) {
    if (i === 0 || i === tong - 1 || Math.abs(i - dang) <= 1) ds.push(i);
    else if (ds[ds.length - 1] !== -1) ds.push(-1);
  }
  return ds;
}

export default function DanhSachTin({ ds, dangTai, loi, trong }: { ds: Tin[]; dangTai: boolean; loi?: string; trong: string }) {
  const [trang, setTrang] = useState(0);
  const dau = useRef<HTMLDivElement>(null);
  useEffect(() => setTrang(0), [ds]); // bộ lọc / từ khoá đổi → về trang đầu

  if (dangTai) return <Box flex justifyContent="center" p={6}><Spinner /></Box>;
  if (loi) return <Box p={4}><Text className="chu-phu">{loi}</Text></Box>;
  if (!ds.length) return <Box p={4}><Text className="chu-phu">{trong}</Text></Box>;

  const soTrang = Math.ceil(ds.length / MOI_TRANG);
  const den = (i: number) => {
    setTrang(i);
    dau.current?.scrollIntoView({ behavior: "smooth", block: "start" }); // về đầu danh sách
  };
  return (
    <>
      <div ref={dau} className="ds-doc" style={{ scrollMarginTop: 120 }}>{ds.slice(trang * MOI_TRANG, (trang + 1) * MOI_TRANG).map((t) => <TheTin key={t.id} tin={t} />)}</div>
      {soTrang > 1 && (
        <div className="phan-trang">
          <button disabled={trang === 0} onClick={() => den(trang - 1)}>‹</button>
          {soHien(trang, soTrang).map((i, k) =>
            i < 0 ? <span key={k}>…</span> : <button key={k} className={i === trang ? "bat" : ""} onClick={() => den(i)}>{i + 1}</button>,
          )}
          <button disabled={trang === soTrang - 1} onClick={() => den(trang + 1)}>›</button>
        </div>
      )}
    </>
  );
}
