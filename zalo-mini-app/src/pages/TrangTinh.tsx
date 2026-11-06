import React from "react";
import { Box, Page, Text } from "zmp-ui";
import { useParams } from "react-router-dom";
import TieuDe from "../components/TieuDe";
import trangTinh from "../lib/trangTinh.json";

// TRANG THÔNG TIN (Giới thiệu, Quy chế, Điều khoản, Bảo mật…) — chạy NGAY TRONG Mini App, không mở trang web (chuẩn Mini App).
// Nội dung = đúng chữ trang web, lấy lúc build bằng scripts/lay-trang-tinh.mjs (web đổi chữ thì chạy lại script rồi build).
export const DS_TRANG = trangTinh as Record<string, { ten: string; html: string }>;

// Chính sách kiểm duyệt Zalo 4.8: tiêu đề chính sách, điều khoản phải ghi rõ của Mini App nào → thêm "Coastal Land".
const PHAP_LY = new Set(["quy-che", "dieu-khoan", "bao-mat"]);

export default function TrangTinh() {
  const { duong = "" } = useParams();
  const goc = DS_TRANG[duong];
  const t = goc && PHAP_LY.has(duong) ? { ten: goc.ten + " Coastal Land", html: goc.html.replace(/<h1>[\s\S]*?<\/h1>/, "<h1>" + goc.ten + " Coastal Land</h1>") } : goc;
  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title={t?.ten ?? "Thông tin"} />
      {t ? (
        <div className="trang-tinh" dangerouslySetInnerHTML={{ __html: t.html }} />
      ) : (
        <Box p={6} style={{ textAlign: "center" }}><Text className="chu-phu">Không tìm thấy trang.</Text></Box>
      )}
    </Page>
  );
}
