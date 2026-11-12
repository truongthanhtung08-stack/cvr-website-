import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Icon, Page, Spinner, Text, useNavigate } from "zmp-ui";
import { useParams, useSearchParams } from "react-router-dom";
import TieuDe from "../components/TieuDe";
import BangGiaMaTran, { TEN_HANG, type GoiBang } from "../components/BangGiaMaTran";
import { supabase, usePhien } from "../lib/supabase";
import { layBangGia } from "../lib/tin";
import { useTai } from "../lib/useTai";

// ============================================================================
// UP TIN · ĐẨY TIN · ĐĂNG LẠI — cùng máy chủ, cùng luật với web (Tin đăng của tôi):
//   · Up tin      → /api/tin-dang/nang-goi (chọn ô giá cao hơn gói đang chạy, chờ Admin duyệt, tiền tạm giữ)
//   · Đẩy tin     → /api/tin-dang/day (lên đầu ngay, trừ ví hoặc lượt trong kho)
//   · Đăng lại    → /api/tin-dang/up (tin hết hạn / khách tự hạ, chọn gói mới, duyệt như tin mới; ví thiếu → nạp xong tự gửi)
// Mọi số tiền do máy chủ tính (xemGia) — Mini App không tự tính giá.
// ============================================================================
const WEB = "https://coastalland.vn";
const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`;
type Viec = "up" | "day" | "dang-lai";
const TEN: Record<Viec, string> = { up: "Up tin", day: "Đẩy tin", "dang-lai": "Đăng lại" };

async function goiWeb(duong: string, body: Record<string, unknown>) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  try {
    const r = await fetch(`${WEB}${duong}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    return { status: r.status, j: (await r.json().catch(() => ({}))) as Record<string, any> };
  } catch {
    return { status: 0, j: { ok: false, loi: "Không kết nối được. Vui lòng thử lại." } as Record<string, any> };
  }
}

type OUp = { tier: string; ten: string; days: number; gia: number | null; duoc: boolean; phaiTra: number | null; khauTruCo: number; khauTru: number };

export default function GoiTin() {
  const { id = "" } = useParams();
  const [thamSo] = useSearchParams();
  const viec = (["up", "day", "dang-lai"].includes(thamSo.get("viec") ?? "") ? thamSo.get("viec") : "day") as Viec;
  const dieuHuong = useNavigate();
  const { phien, san } = usePhien();

  const tin = useTai(
    async () => (phien ? (await supabase.from("listings").select("id,title,purpose,tier,status").eq("id", id).maybeSingle()).data : null),
    [id, phien?.user.id],
    null as { id: string; title: string; purpose: string; tier: string; status: string } | null,
  );
  const bangGia = useTai(() => layBangGia(), [], null);

  const [chon, setChon] = useState<{ tier: string; days: number }>();
  const apKhauTru = true; // khấu trừ gói đang chạy luôn áp (12/11/2026) — cùng luật web
  const [oUp, setOUp] = useState<OUp[]>();
  const [gia, setGia] = useState<{ phaiTra: number; mienPhi?: boolean; dungLuot?: boolean; conLai?: number; hang?: string }>();
  const [loi, setLoi] = useState<string>();
  const [thieu, setThieu] = useState(false);
  const [dang, setDang] = useState(false);
  const [xong, setXong] = useState<string>();

  // Đẩy tin: xem giá ngay · Up tin: tải bảng ô (máy chủ) theo lựa chọn khấu trừ
  useEffect(() => {
    if (!phien || !id) return;
    setLoi(undefined);
    if (viec === "day") goiWeb("/api/tin-dang/day", { id, xemGia: true }).then(({ j }) => (j.ok ? setGia(j as never) : setLoi(j.loi)));
    if (viec === "up")
      goiWeb("/api/tin-dang/nang-goi", { id, xemGia: true, apKhauTru }).then(({ j }) => {
        if (!j.ok) return setLoi(j.loi);
        setOUp(j.o);
      });
  }, [viec, id, phien?.access_token, apKhauTru]);

  // Đăng lại: chọn ô xong hỏi máy chủ số phải trả (gồm ưu đãi thành viên mới nếu đủ điều kiện)
  useEffect(() => {
    if (viec !== "dang-lai" || !chon) return;
    setGia(undefined);
    setLoi(undefined);
    goiWeb("/api/tin-dang/up", { id, tier: chon.tier, soNgay: chon.days, xemGia: true }).then(({ j }) => (j.ok ? setGia(j as never) : setLoi(j.loi)));
  }, [viec, id, chon?.tier, chon?.days]);

  const plansUp: GoiBang[] = useMemo(() => {
    const m = new Map<string, GoiBang>();
    for (const o of oUp ?? []) {
      if (o.gia == null) continue;
      const g = m.get(o.tier) ?? { tierId: o.tier, name: o.ten, terms: [] };
      g.terms.push({ days: o.days, price: o.gia });
      m.set(o.tier, g);
    }
    return [...m.values()];
  }, [oUp]);
  const oDangChon = oUp?.find((o) => o.tier === chon?.tier && o.days === chon?.days);
  const plansDangLai = (bangGia.data?.[tin.data?.purpose === "thue" ? "thue" : "ban"]?.plans ?? []) as GoiBang[];

  const thucHien = async () => {
    setLoi(undefined);
    setThieu(false);
    setDang(true);
    const { status, j } =
      viec === "day"
        ? await goiWeb("/api/tin-dang/day", { id })
        : viec === "up"
          ? await goiWeb("/api/tin-dang/nang-goi", { id, tier: chon?.tier, days: chon?.days, apKhauTru })
          : await goiWeb("/api/tin-dang/up", { id, tier: chon?.tier, soNgay: chon?.days });
    setDang(false);
    if (j.ok)
      return setXong(viec === "day" ? "Tin đã lên đầu" : viec === "up" ? "Đã gửi yêu cầu Up tin" : "Đã gửi đăng lại, đang chờ duyệt");
    setLoi(j.loi || "Chưa thực hiện được. Vui lòng thử lại.");
    if (status === 402 || /nạp|không đủ/i.test(j.loi ?? "")) setThieu(true);
  };

  if (!san || (phien && tin.dangTai)) return <Page><TieuDe title={TEN[viec]} /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (!phien)
    return (
      <Page style={{ background: "#fff" }}>
        <TieuDe title={TEN[viec]} />
        <Box p={4}><Button fullWidth onClick={() => dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(`/goi-tin/${id}?viec=${viec}`)}`)}>Đăng nhập bằng Zalo</Button></Box>
      </Page>
    );

  if (xong)
    return (
      <Page style={{ background: "#fff" }}>
        <TieuDe title={TEN[viec]} ve="/tin-cua-toi" />
        <Box p={4} style={{ display: "grid", gap: 12, textAlign: "center", marginTop: 24 }}>
          <Icon icon="zi-check-circle-solid" size={56} style={{ color: "var(--cl-blue)", margin: "0 auto" }} />
          <Text.Title size="large">{xong}</Text.Title>
          <Button fullWidth onClick={() => dieuHuong("/tin-cua-toi", { replace: true })}>Xem tin của tôi</Button>
        </Box>
      </Page>
    );

  const coChon = viec === "day" || !!chon;
  const phaiTra = viec === "up" ? oDangChon?.phaiTra ?? undefined : gia?.phaiTra;

  return (
    <Page style={{ paddingBottom: 96 }}>
      <TieuDe title={TEN[viec]} />
      <Box p={4} style={{ background: "#fff" }}>
        <Text size="small" className="chu-phu">Tin</Text>
        <Text.Title size="small">{tin.data?.title ?? "—"}</Text.Title>
      </Box>

      {viec !== "day" && (
        <Box mt={2} p={4} style={{ background: "#fff", display: "grid", gap: 12 }}>
          <Text.Title size="small">Chọn gói</Text.Title>
          {viec === "up" ? (
            oUp ? (
              <BangGiaMaTran plans={plansUp} chon={chon} onChon={(t, d) => setChon({ tier: t, days: d })} khoa={(t, d) => !oUp.find((o) => o.tier === t && o.days === d)?.duoc} />
            ) : !loi && <Spinner />
          ) : plansDangLai.length ? (
            <BangGiaMaTran plans={plansDangLai} chon={chon} onChon={(t, d) => setChon({ tier: t, days: d })} />
          ) : (
            <Spinner />
          )}
        </Box>
      )}

      {coChon && (gia || oDangChon) && (
        <Box mt={2} p={4} style={{ background: "#fff" }}>
          <div className="tom-tat-goi">
            {viec === "day" ? (
              <div><span>Hạng tin</span><b>{gia?.dungLuot ? "Dùng lượt trong gói" : gia?.hang}</b></div>
            ) : (
              <div><span>Gói mới</span><b>{TEN_HANG[chon!.tier] ?? chon!.tier} · {chon!.days} ngày</b></div>
            )}
            {viec === "up" && !!oDangChon?.khauTru && <div><span>Khấu trừ gói đang chạy</span><b>− {vnd(oDangChon.khauTru)}</b></div>}
            {gia?.dungLuot ? (
              <div><span>Lượt còn lại</span><b>{gia.conLai}</b></div>
            ) : gia?.mienPhi ? (
              <div><span>Ưu đãi thành viên mới</span><b>Miễn phí</b></div>
            ) : (
              phaiTra != null && <div><span>Phí + VAT 8%</span><b>{vnd(phaiTra)}</b></div>
            )}
            {viec !== "day" && <div><span>Bắt đầu hiển thị</span><b>Khi được duyệt</b></div>}
          </div>
        </Box>
      )}

      {loi && (
        <Box p={4} style={{ display: "grid", gap: 8 }}>
          <Text size="small" style={{ color: "#d70018" }}>{loi}</Text>
          {thieu && <Button size="small" variant="secondary" onClick={() => dieuHuong("/nap-tien")}>Nạp tiền</Button>}
        </Box>
      )}

      <div className="nut-chinh">
        <Button fullWidth loading={dang} disabled={!coChon || (viec === "up" && !oDangChon?.duoc)} onClick={thucHien}>
          {viec === "day" ? "Đẩy tin" : viec === "up" ? "Gửi yêu cầu Up tin" : "Đăng lại"}
        </Button>
      </div>
    </Page>
  );
}
