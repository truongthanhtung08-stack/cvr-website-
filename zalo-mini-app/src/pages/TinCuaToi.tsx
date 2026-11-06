import React, { useState } from "react";
import { Box, Button, Page, Spinner, Text, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { anh } from "../lib/tin";
import { tachAnh } from "../lib/media";
import { ngay } from "../lib/dinhDang";
import { supabase, usePhien } from "../lib/supabase";
import { useTai } from "../lib/useTai";
import logoTron from "../assets/logo-tron.svg";

// ============================================================================
// TIN CỦA TÔI — CẤU TRÚC THEO WEB (src/components/TinCuaToi.tsx, 06/11/2026): hàng lọc trạng thái cuộn ngang · mỗi tin: ảnh · tiêu đề ·
// trạng thái · ngày · hàng nút (Sửa · Xem · Up tin · Đẩy tin · Đăng lại). Tin Admin ẩn không có nút Sửa (như web).
// Sửa → DangTin ?id= · Up tin / Đẩy tin / Đăng lại → GoiTin (cùng API máy chủ web, giá do máy chủ tính).
// ============================================================================
const WEB = "https://coastalland.vn";
const TRANG_THAI: Record<string, { nhan: string; mau: string }> = {
  approved: { nhan: "Đang hiển thị", mau: "#15803d" },
  pending: { nhan: "Chờ duyệt", mau: "#b8860b" },
  draft: { nhan: "Nháp", mau: "#6e6e73" },
  rejected: { nhan: "Cần chỉnh sửa", mau: "#d70018" },
  expired: { nhan: "Hết hạn", mau: "#6e6e73" },
  hidden: { nhan: "Đã ẩn", mau: "#6e6e73" },
};
const LOC = [["all", "Tất cả"], ["approved", "Đang hiển thị"], ["pending", "Chờ duyệt"], ["draft", "Nháp"], ["rejected", "Cần chỉnh sửa"], ["expired", "Hết hạn"]] as const;

type Dong = { id: string; title: string; status: string; images: string[]; created_at: string; tier_expires_at: string | null; details: { ha_boi?: string } | null };

export default function TinCuaToi() {
  const dieuHuong = useNavigate();
  const { nguoiDung, san } = usePhien();
  const [loc, setLoc] = useState<string>("all");
  const { data, dangTai } = useTai<Dong[]>(
    async () =>
      nguoiDung
        ? (((await supabase.from("listings").select("id,title,status,images,created_at,tier_expires_at,details").eq("owner_id", nguoiDung.id).order("created_at", { ascending: false }).limit(200)).data ?? []) as Dong[])
        : [],
    [nguoiDung?.id],
    [],
  );
  const ds = data.filter((t) => loc === "all" || t.status === loc);

  return (
    <Page style={{ paddingBottom: 24 }}>
      <TieuDe title="Tin đăng" />
      {!san || dangTai ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : !nguoiDung ? (
        <Box p={4}><Button fullWidth onClick={() => dieuHuong("/dang-nhap?tiep=/tin-cua-toi")}>Đăng nhập bằng Zalo</Button></Box>
      ) : (
        <>
          <div className="tab-noi-bat" style={{ paddingTop: 12 }}>
            {LOC.map(([k, nhan]) => {
              const so = k === "all" ? data.length : data.filter((t) => t.status === k).length;
              return <button key={k} className={loc === k ? "bat" : ""} onClick={() => setLoc(k)}>{nhan} {so > 0 && `(${so})`}</button>;
            })}
          </div>
          {ds.length === 0 ? (
            <Box p={4} style={{ display: "grid", gap: 12 }}>
              <Text className="chu-phu">Chưa có tin.</Text>
              <Button onClick={() => dieuHuong("/dang-tin")}>Đăng tin</Button>
            </Box>
          ) : (
            ds.map((t) => {
              const tt = TRANG_THAI[t.status] ?? { nhan: t.status, mau: "#6e6e73" };
              const a = tachAnh(t.images)[0];
              const adminAn = t.status === "hidden" && t.details?.ha_boi !== "khach";
              return (
                <div key={t.id} className="tcm-dong">
                  <div className="tcm-tren" onClick={() => t.status === "approved" && dieuHuong(`/tin/${t.id}`)}>
                    {a ? <img src={anh(a)} alt="" /> : <div className="anh-trong tcm-anh"><img src={logoTron} alt="" /></div>}
                    <div className="tcm-chu">
                      <p className="tcm-ten">{t.title || "(chưa có tiêu đề)"}</p>
                      <p className="tcm-tt" style={{ color: tt.mau }}>{tt.nhan}</p>
                      <p className="tcm-ngay">Gửi {ngay(t.created_at)}{t.tier_expires_at ? ` · Hết hạn ${ngay(t.tier_expires_at)}` : ""}</p>
                    </div>
                  </div>
                  <div className="tcm-nut">
                    {!adminAn && <button onClick={() => dieuHuong(`/dang-tin?id=${t.id}`)}>Sửa</button>}
                    {t.status === "approved" && <button onClick={() => dieuHuong(`/tin/${t.id}`)}>Xem</button>}
                    {t.status === "approved" && <button className="chinh" onClick={() => dieuHuong(`/goi-tin/${t.id}?viec=up`)}>Up tin</button>}
                    {t.status === "approved" && <button className="chinh" onClick={() => dieuHuong(`/goi-tin/${t.id}?viec=day`)}>Đẩy tin</button>}
                    {(t.status === "expired" || (t.status === "hidden" && !adminAn)) && <button className="chinh" onClick={() => dieuHuong(`/goi-tin/${t.id}?viec=dang-lai`)}>Đăng lại</button>}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}
    </Page>
  );
}
