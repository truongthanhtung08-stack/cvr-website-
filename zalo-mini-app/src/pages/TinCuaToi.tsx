import React from "react";
import { Box, Button, Header, Page, Spinner, Text, useNavigate } from "zmp-ui";
import { anh } from "../lib/tin";
import { ngay } from "../lib/dinhDang";
import { supabase, usePhien } from "../lib/supabase";
import { useTai } from "../lib/useTai";

// Tin của tôi — cùng dữ liệu trang /tai-khoan/tin-dang trên web, nhãn trạng thái giống web.
const TRANG_THAI: Record<string, { nhan: string; mau: string }> = {
  pending: { nhan: "Chờ duyệt", mau: "#b8860b" },
  approved: { nhan: "Đang hiển thị", mau: "#15803d" },
  draft: { nhan: "Nháp", mau: "#6e6e73" },
  rejected: { nhan: "Cần chỉnh sửa", mau: "#d70018" },
  expired: { nhan: "Hết hạn", mau: "#6e6e73" },
};

type Dong = { id: string; title: string; status: string; images: string[]; created_at: string };

export default function TinCuaToi() {
  const dieuHuong = useNavigate();
  const { nguoiDung, san } = usePhien();
  const { data, dangTai } = useTai<Dong[]>(
    async () =>
      nguoiDung
        ? ((await supabase.from("listings").select("id,title,status,images,created_at").eq("owner_id", nguoiDung.id).order("created_at", { ascending: false }).limit(100)).data ?? [])
        : [],
    [nguoiDung?.id],
    [],
  );

  return (
    <Page>
      <Header title="Tin của tôi" />
      {!san || dangTai ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : !nguoiDung ? (
        <Box p={4}><Button fullWidth onClick={() => dieuHuong("/dang-nhap?tiep=/tin-cua-toi")}>Đăng nhập để xem tin của bạn</Button></Box>
      ) : data.length === 0 ? (
        <Box p={4} style={{ display: "grid", gap: 12 }}>
          <Text className="chu-phu">Bạn chưa có tin đăng nào.</Text>
          <Button onClick={() => dieuHuong("/dang-tin")}>Đăng tin</Button>
        </Box>
      ) : (
        data.map((t) => {
          const tt = TRANG_THAI[t.status] ?? { nhan: t.status, mau: "#6e6e73" };
          return (
            <div key={t.id} className="the-ngang" onClick={() => t.status === "approved" && dieuHuong(`/tin/${t.id}`)}>
              <img src={anh(t.images?.[0])} alt="" />
              <div>
                <Text size="small" style={{ fontWeight: 600 }} className="cat-dong">{t.title}</Text>
                <Text size="xSmall" style={{ color: tt.mau, fontWeight: 600, marginTop: 4 }}>{tt.nhan}</Text>
                <Text size="xSmall" className="chu-phu">Gửi ngày {ngay(t.created_at)}</Text>
              </div>
            </div>
          );
        })
      )}
    </Page>
  );
}
