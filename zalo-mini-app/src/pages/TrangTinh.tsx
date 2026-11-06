import React from "react";
import { Box, Button, Page, Text, useNavigate } from "zmp-ui";
import { useParams } from "react-router-dom";
import TieuDe from "../components/TieuDe";
import trangTinh from "../lib/trangTinh.json";

// TRANG THÔNG TIN (Giới thiệu, Quy chế, Điều khoản, Bảo mật…) — chạy NGAY TRONG Mini App, không mở trang web (chuẩn Mini App).
// Nội dung = đúng chữ trang web, lấy lúc build bằng scripts/lay-trang-tinh.mjs (web đổi chữ thì chạy lại script rồi build).
export const DS_TRANG = trangTinh as Record<string, { ten: string; html: string }>;

// Chính sách kiểm duyệt Zalo 4.8: tiêu đề chính sách, điều khoản phải ghi rõ của Mini App nào → thêm "Coastal Land".
const PHAP_LY = new Set(["quy-che", "dieu-khoan", "bao-mat"]);

// NÚT CUỐI TRANG như web (06/11/2026): Giới thiệu có "Xem dự án" và CTA "Đăng tin" · "Xem Bất động sản" — mở thẳng màn trong app.
const CTA: Record<string, { nhan: string; di: string; phu?: boolean }[]> = {
  "gioi-thieu": [{ nhan: "Đăng tin", di: "/dang-tin" }, { nhan: "Xem Bất động sản", di: "/ds/ban", phu: true }, { nhan: "Xem dự án", di: "/du-an", phu: true }],
};

export default function TrangTinh() {
  const dieuHuong = useNavigate();
  const { duong = "" } = useParams();
  const goc = DS_TRANG[duong];
  const t = goc && PHAP_LY.has(duong) ? { ten: goc.ten + " Coastal Land", html: goc.html.replace(/<h1>[\s\S]*?<\/h1>/, "<h1>" + goc.ten + " Coastal Land</h1>") } : goc;
  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title={t?.ten ?? "Thông tin"} />
      {t ? (
        <>
          <div className="trang-tinh" dangerouslySetInnerHTML={{ __html: t.html }} />
          {CTA[duong] && (
            <Box px={4} pb={8} style={{ display: "grid", gap: 12 }}>
              {CTA[duong].map((c) => <Button key={c.nhan} fullWidth variant={c.phu ? "secondary" : "primary"} onClick={() => dieuHuong(c.di)}>{c.nhan}</Button>)}
            </Box>
          )}
        </>
      ) : (
        <Box p={6} style={{ textAlign: "center" }}><Text className="chu-phu">Không tìm thấy trang.</Text></Box>
      )}
    </Page>
  );
}
