import React, { useEffect, useState } from "react";
import { Box, Button, Page, Spinner, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { useSearchParams } from "react-router-dom";
import { vaoNgay } from "../lib/lienKet";

// VÀO TÀI KHOẢN — KHÔNG CÓ BƯỚC LIÊN KẾT (anh 14/11/2026: "không có liên kết cái gì cả"). Màn cần tài khoản đưa tới đây khi lần
// vào ngầm lúc mở app chưa xong / hỏng: vào ngay bằng Zalo cá nhân của khách rồi quay về đúng màn đang mở. Hỏng (mạng) → nút Thử lại.
export default function DangNhap() {
  const dieuHuong = useNavigate();
  const [thamSo] = useSearchParams();
  const tiep = thamSo.get("tiep") || "/tai-khoan";
  const [dang, setDang] = useState(true);

  const vao = async () => {
    setDang(true);
    const xong = await vaoNgay();
    setDang(false);
    if (xong) dieuHuong(tiep, { replace: true });
  };
  useEffect(() => { void vao(); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- chỉ chạy một lần khi mở màn

  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title="Tài khoản" />
      <Box p={4} flex justifyContent="center">
        {dang ? <Spinner /> : <Button fullWidth onClick={vao}>Thử lại</Button>}
      </Box>
    </Page>
  );
}
