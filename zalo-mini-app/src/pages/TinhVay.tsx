import React, { useState } from "react";
import { Box, Header, Input, Page, Text } from "zmp-ui";

// Máy tính khoản vay mua nhà — trả góp đều hằng tháng (gốc + lãi).
// Ô nhập dùng text + inputMode, KHÔNG dùng type="number" (quy ước dự án).
const so = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;
const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`;

export default function TinhVay() {
  const [vay, setVay] = useState("2.000.000.000");
  const [laiNam, setLaiNam] = useState("9");
  const [nam, setNam] = useState("20");

  const P = so(vay);
  const r = so(laiNam) / 100 / 12;
  const n = Math.round(so(nam) * 12);
  const thang = n > 0 ? (r > 0 ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n) : 0;
  const tongLai = thang * n - P;

  const dinhDangTien = (s: string) => {
    const chiSo = s.replace(/\D/g, "");
    return chiSo ? Number(chiSo).toLocaleString("vi-VN") : "";
  };

  return (
    <Page style={{ background: "#fff" }}>
      <Header title="Tính khoản vay" />
      <Box p={4} style={{ display: "grid", gap: 12 }}>
        <Input label="Số tiền vay (đồng)" inputMode="numeric" value={vay} onChange={(e) => setVay(dinhDangTien(e.target.value))} />
        <Input label="Lãi suất (%/năm)" inputMode="decimal" value={laiNam} onChange={(e) => setLaiNam(e.target.value)} />
        <Input label="Thời hạn vay (năm)" inputMode="numeric" value={nam} onChange={(e) => setNam(e.target.value.replace(/\D/g, ""))} />
      </Box>
      <Box mx={4} p={4} style={{ background: "var(--cl-surface)", borderRadius: 16 }}>
        <Text size="small" className="chu-phu">Trả mỗi tháng</Text>
        <Text.Title size="xLarge" style={{ color: "var(--cl-blue)", marginTop: 4 }}>{vnd(thang)}</Text.Title>
        <Box mt={3} flex justifyContent="space-between"><Text size="small" className="chu-phu">Tổng tiền lãi</Text><Text size="small">{vnd(tongLai)}</Text></Box>
        <Box mt={1} flex justifyContent="space-between"><Text size="small" className="chu-phu">Tổng phải trả</Text><Text size="small">{vnd(P + tongLai)}</Text></Box>
      </Box>
      <Box p={4}><Text size="xSmall" className="chu-phu">Kết quả tham khảo theo cách trả góp đều hằng tháng; lãi suất thực tế theo từng ngân hàng.</Text></Box>
    </Page>
  );
}
