import React from "react";
import { Box, Button, Page, useNavigate } from "zmp-ui";
import { useLocation } from "react-router-dom";
import TieuDe from "./TieuDe";

// Màn cần tài khoản mà khách chưa đăng nhập: một nút Đăng nhập bằng Zalo, xong quay về đúng màn đang mở.
export default function CanDangNhap({ tieuDe }: { tieuDe: string }) {
  const dieuHuong = useNavigate();
  const { pathname, search } = useLocation();
  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title={tieuDe} />
      <Box p={4}><Button fullWidth onClick={() => dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(pathname + search)}`)}>Đăng nhập bằng Zalo</Button></Box>
    </Page>
  );
}
