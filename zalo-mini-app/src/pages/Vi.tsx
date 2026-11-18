import React from "react";
import { Box, Button, Page, Spinner, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import CanDangNhap from "../components/CanDangNhap";
import { supabase, usePhien } from "../lib/supabase";
import { useTai } from "../lib/useTai";

// VÍ — CHỈ HIỂN THỊ số dư (cùng ví với web, rpc so_du_kha_dung 0056) + lối sang Hóa đơn (lịch sử phí đã trả).
// Zalo từ chối bản 78 (16/11/2026): "nền tảng chưa hỗ trợ Mini App có chức năng Nạp tiền — chỉ được hiển thị thông tin thu nhập,
// lịch sử và tài khoản". ⛔ Không thêm nút / chữ / đường nạp tiền vào Mini App.
const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`;
type SoDu = { so_du: number; tam_giu: number; kha_dung: number };

export default function Vi() {
  const dieuHuong = useNavigate();
  const { san, nguoiDung } = usePhien();
  const vi = useTai(
    async () => (nguoiDung ? (((await supabase.rpc("so_du_kha_dung")).data as SoDu[] | null)?.[0] ?? null) : null),
    [nguoiDung?.id],
    null as SoDu | null,
  );
  if (san && !nguoiDung) return <CanDangNhap tieuDe="Ví" />;
  const v = vi.data;
  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title="Ví" />
      {vi.dangTai ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : (
        <Box p={4} style={{ display: "grid", gap: 12 }}>
          <div className="khung-vi"><span>Số dư</span><strong>{vnd(Number(v?.so_du ?? 0))}</strong></div>
          {Number(v?.tam_giu ?? 0) > 0 && (
            <div className="tom-tat-goi">
              <div><span>Tạm giữ cho tin chờ duyệt</span><b>{vnd(Number(v?.tam_giu))}</b></div>
              <div><span>Khả dụng</span><b>{vnd(Number(v?.kha_dung ?? 0))}</b></div>
            </div>
          )}
          <Button fullWidth variant="secondary" onClick={() => dieuHuong("/hoa-don")}>Hóa đơn của tôi</Button>
        </Box>
      )}
    </Page>
  );
}
