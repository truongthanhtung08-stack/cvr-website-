import React from "react";
import { Box, Spinner, Text } from "zmp-ui";
import TheTinNgang from "./TheTinNgang";
import type { Tin } from "../lib/tin";

export default function DanhSachTin({ ds, dangTai, loi, trong }: { ds: Tin[]; dangTai: boolean; loi?: string; trong: string }) {
  if (dangTai) return <Box flex justifyContent="center" p={6}><Spinner /></Box>;
  if (loi) return <Box p={4}><Text className="chu-phu">{loi}</Text></Box>;
  if (!ds.length) return <Box p={4}><Text className="chu-phu">{trong}</Text></Box>;
  return <div className="ds-ngang">{ds.map((t) => <TheTinNgang key={t.id} tin={t} />)}</div>;
}
