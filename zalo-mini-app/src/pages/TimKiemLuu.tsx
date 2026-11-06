import React, { useEffect, useState } from "react";
import { Box, Button, Page, Spinner, Text, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import CanDangNhap from "../components/CanDangNhap";
import { supabase, usePhien } from "../lib/supabase";
import { duongMoLai, type DongLuu } from "../lib/timKiemLuu";

// TÌM KIẾM ĐÃ LƯU — như web (src/app/tai-khoan/tim-kiem): mở lại đúng bộ lọc · xoá. Lưu bằng nút chuông ở Mua bán / Cho thuê.
const ngay = (s: string) => new Date(s).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

export default function TimKiemLuu() {
  const dieuHuong = useNavigate();
  const { san, nguoiDung } = usePhien();
  const [ds, setDs] = useState<DongLuu[] | null>(null);
  useEffect(() => {
    if (!nguoiDung) return;
    supabase.from("tim_kiem_luu").select("id,muc_dich,tham_so,ten,bao_luc,created_at").order("created_at", { ascending: false })
      .then(({ data }) => setDs((data ?? []) as DongLuu[]));
  }, [nguoiDung?.id]);
  const xoa = async (id: string) => {
    const { error } = await supabase.from("tim_kiem_luu").delete().eq("id", id);
    if (!error) setDs((cu) => (cu ?? []).filter((d) => d.id !== id));
  };
  if (san && !nguoiDung) return <CanDangNhap tieuDe="Tìm kiếm đã lưu" />;
  return (
    <Page>
      <TieuDe title="Tìm kiếm đã lưu" />
      {ds === null ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : !ds.length ? (
        <Box p={6} style={{ display: "grid", gap: 12, textAlign: "center" }}>
          <Text className="chu-phu">Chưa có tìm kiếm nào được lưu.</Text>
          <Button onClick={() => dieuHuong("/ds/ban")}>Tìm nhà đất</Button>
        </Box>
      ) : (
        <div className="ds-dong">
          {ds.map((d) => (
            <div key={d.id} className="dong-hd" style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}>
              <div onClick={() => dieuHuong(duongMoLai(d))}>
                <p style={{ fontWeight: 600 }}>{d.ten}</p>
                <span className="chu-phu" style={{ fontSize: 12 }}>
                  {d.muc_dich === "ban" ? "Mua bán" : "Cho thuê"} · Lưu {ngay(d.created_at)}{d.bao_luc ? ` · Báo gần nhất ${ngay(d.bao_luc)}` : ""}
                </span>
              </div>
              <button className="nut-goi" onClick={() => xoa(d.id)}>Xoá</button>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
