import React from "react";
import { Box, Page, Spinner, Text } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { supabase, usePhien } from "../lib/supabase";
import { useTai } from "../lib/useTai";
import CanDangNhap from "../components/CanDangNhap";

// HÓA ĐƠN — cùng bảng doanh_thu với web (src/app/tai-khoan/hoa-don/page.tsx): mỗi khoản phí đã trả · số hóa đơn khi đã xuất.
type Dong = { id: number; ngay_ghi_nhan: string; mo_ta: string | null; tong_tra: number; hoa_don_so: string | null; hoa_don_trang_thai: string | null };
const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`;
const ngay = (s: string) => new Date(s).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

export default function HoaDon() {
  const { san, nguoiDung } = usePhien();
  const ds = useTai(
    async () =>
      nguoiDung
        ? (((await supabase.from("doanh_thu").select("id,ngay_ghi_nhan,mo_ta,tong_tra,hoa_don_so,hoa_don_trang_thai").order("ngay_ghi_nhan", { ascending: false })).data ?? []) as Dong[])
        : [],
    [nguoiDung?.id],
    [] as Dong[],
  );
  const tong = ds.data.reduce((s, d) => s + Number(d.tong_tra || 0), 0);
  if (san && !nguoiDung) return <CanDangNhap tieuDe="Hóa đơn" />; // chưa vào tài khoản: cùng màn như Gói hội viên
  return (
    <Page>
      <TieuDe title="Hóa đơn" />
      {ds.dangTai ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : !ds.data.length ? (
        <Box p={6} style={{ textAlign: "center" }}><Text className="chu-phu">Chưa có khoản phí nào.</Text></Box>
      ) : (
        <>
          <div className="tom-tat-goi" style={{ background: "#fff", padding: 16 }}>
            <div><span>Tổng đã trả (gồm VAT)</span><b>{vnd(tong)}</b></div>
          </div>
          <div className="ds-dong">
            {ds.data.map((d) => (
              <div key={d.id} className="dong-hd">
                <div className="dong-hd-tren"><span>{ngay(d.ngay_ghi_nhan)}</span><b>{vnd(Number(d.tong_tra))}</b></div>
                <p>{d.mo_ta || "—"}</p>
                {d.hoa_don_so && <span className="chu-phu">Hóa đơn số {d.hoa_don_so}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
