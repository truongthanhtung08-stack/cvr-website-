import React from "react";
import { Box, Page, Spinner, Text } from "zmp-ui";
import { openPhone } from "zmp-sdk";
import TieuDe from "../components/TieuDe";
import { soVN, supabase, usePhien } from "../lib/supabase";
import { useTai } from "../lib/useTai";

// KHÁCH HÀNG — người đã xem số / để lại liên hệ trên tin của mình (bảng listing_leads, cùng nguồn web
// src/app/tai-khoan/khach-hang/page.tsx). Bấm số là gọi.
type Lead = { id: number; listing_id: string; viewer_name: string | null; viewer_phone: string | null; created_at: string };
const luc = (s: string) => new Date(s).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

export default function KhachHang() {
  const { nguoiDung } = usePhien();
  const ds = useTai(
    async () => {
      if (!nguoiDung) return { lead: [] as Lead[], ten: {} as Record<string, string> };
      const tin = ((await supabase.from("listings").select("id,title").eq("owner_id", nguoiDung.id)).data ?? []) as { id: string; title: string }[];
      if (!tin.length) return { lead: [], ten: {} };
      const lead = ((await supabase.from("listing_leads").select("id,listing_id,viewer_name,viewer_phone,created_at")
        .in("listing_id", tin.map((t) => t.id)).order("created_at", { ascending: false }).limit(300)).data ?? []) as Lead[];
      return { lead, ten: Object.fromEntries(tin.map((t) => [t.id, t.title])) };
    },
    [nguoiDung?.id],
    { lead: [] as Lead[], ten: {} as Record<string, string> },
  );
  return (
    <Page>
      <TieuDe title="Khách hàng" />
      {ds.dangTai ? (
        <Box flex justifyContent="center" p={6}><Spinner /></Box>
      ) : !ds.data.lead.length ? (
        <Box p={6} style={{ textAlign: "center" }}><Text className="chu-phu">Chưa có khách hàng.</Text></Box>
      ) : (
        <div className="ds-dong">
          {ds.data.lead.map((l) => (
            <div key={l.id} className="dong-hd">
              <div className="dong-hd-tren">
                <b>{l.viewer_name || "Khách"}</b>
                <span>{luc(l.created_at)}</span>
              </div>
              <p>{ds.data.ten[l.listing_id] ?? "—"}</p>
              {l.viewer_phone && (
                <button className="nut-goi" onClick={() => openPhone({ phoneNumber: l.viewer_phone! }).catch(() => { window.location.href = `tel:${l.viewer_phone}`; })}>
                  {soVN(l.viewer_phone)}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
