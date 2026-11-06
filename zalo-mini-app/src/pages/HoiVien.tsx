import React, { useEffect, useState } from "react";
import { Box, Button, Page, Spinner, Text, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import CanDangNhap from "../components/CanDangNhap";
import { supabase, usePhien } from "../lib/supabase";
import { layBangGia, type GoiHoiVien } from "../lib/tin";
import { gomVat } from "../components/BangGiaMaTran";
import { TEN_VOUCHER } from "./BangGia";

// GÓI HỘI VIÊN — bản gọn của web (src/app/tai-khoan/hoi-vien): đang có gói → tên, hạn, voucher kỳ này; chưa có → chọn gói + thời hạn,
// mua bằng số dư ví qua CÙNG máy chủ web (/api/hoi-vien/mua — máy chủ tự tính lại giá). Giá theo bảng Admin, hiện đã gồm VAT 8%.
const WEB = "https://coastalland.vn";
const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`;
const ngay = (s: string) => new Date(s).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
type GoiCuaToi = { id: number; ten_goi: string; het_han: string };
type Voucher = { loai: string; giam: number; so_luong: number; con_lai: number; den: string };

export default function HoiVien() {
  const dieuHuong = useNavigate();
  const { san, nguoiDung, phien } = usePhien();
  const [goi, setGoi] = useState<GoiCuaToi | null | undefined>(undefined);
  const [voucher, setVoucher] = useState<Voucher[]>([]);
  const [dsGoi, setDsGoi] = useState<GoiHoiVien[]>([]);
  const [soDu, setSoDu] = useState(0);
  const [chon, setChon] = useState<{ goi: string; thang: number }>();
  const [dang, setDang] = useState(false);
  const [bao, setBao] = useState<{ ok: boolean; chu: string }>();

  const tai = async () => {
    if (!nguoiDung) return;
    await supabase.rpc("cap_voucher_hoi_vien", { p_user: nguoiDung.id });
    const [{ data: g }, { data: hs }, bang] = await Promise.all([
      supabase.from("hoi_vien").select("id,ten_goi,het_han").eq("user_id", nguoiDung.id).gt("het_han", new Date().toISOString()).order("het_han", { ascending: false }).limit(1),
      supabase.from("profiles").select("balance").eq("id", nguoiDung.id).maybeSingle(),
      layBangGia(),
    ]);
    const hienTai = (g?.[0] as GoiCuaToi | undefined) ?? null;
    setGoi(hienTai);
    setSoDu(Number(hs?.balance ?? 0));
    setDsGoi(bang?.hoiVien ?? []);
    if (hienTai) {
      const bayGio = new Date().toISOString();
      const { data: v } = await supabase.from("hoi_vien_voucher").select("loai,giam,so_luong,con_lai,den").eq("hoi_vien_id", hienTai.id).lte("tu", bayGio).gt("den", bayGio);
      setVoucher((v ?? []) as Voucher[]);
    }
  };
  useEffect(() => { void tai(); }, [nguoiDung?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const goiChon = dsGoi.find((g) => g.id === chon?.goi);
  const ky = goiChon?.thoiHan.find((t) => t.thang === chon?.thang);
  const phaiTra = ky ? gomVat(ky.price) : 0;

  const mua = async () => {
    if (!goiChon || !ky) return;
    setDang(true);
    setBao(undefined);
    try {
      const r = await fetch(`${WEB}/api/hoi-vien/mua`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${phien?.access_token}` },
        body: JSON.stringify({ goi: goiChon.id, thang: ky.thang }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setBao({ ok: false, chu: j.loi || "Chưa mua được gói. Vui lòng thử lại." });
      else { setBao({ ok: true, chu: `Đã kích hoạt ${goiChon.ten} đến ${ngay(j.hetHan)}` }); setChon(undefined); await tai(); }
    } catch {
      setBao({ ok: false, chu: "Không kết nối được. Vui lòng thử lại." });
    }
    setDang(false);
  };

  if (san && !nguoiDung) return <CanDangNhap tieuDe="Gói hội viên" />;
  if (goi === undefined) return <Page><TieuDe title="Gói hội viên" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  return (
    <Page style={{ paddingBottom: 96 }}>
      <TieuDe title="Gói hội viên" />
      {bao && <Box p={4}><Text size="small" style={{ color: bao.ok ? "var(--cl-ink)" : "#d70018" }}>{bao.chu}</Text></Box>}
      {goi ? (
        <Box mt={2} p={4} style={{ background: "#fff", display: "grid", gap: 8 }}>
          <Text className="chu-phu">Gói đang dùng</Text>
          <Text.Title size="large">{goi.ten_goi}</Text.Title>
          <Text size="small">Hết hạn {ngay(goi.het_han)}</Text>
          <Text.Title size="small" style={{ marginTop: 8 }}>Voucher kỳ này</Text.Title>
          {voucher.length ? (
            <div className="tom-tat-goi">
              {voucher.map((v) => (
                <div key={v.loai}><span>Giảm {vnd(gomVat(v.giam))}/lần {TEN_VOUCHER[v.loai] ?? v.loai}</span><b>{v.con_lai}/{v.so_luong} · hạn {ngay(v.den)}</b></div>
              ))}
            </div>
          ) : <Text size="small" className="chu-phu">Kỳ này không còn voucher.</Text>}
        </Box>
      ) : !dsGoi.length ? (
        <Box p={6} style={{ textAlign: "center" }}><Text className="chu-phu">Gói hội viên sắp mở bán.</Text></Box>
      ) : (
        dsGoi.map((g) => (
          <Box key={g.id} mt={2} p={4} style={{ background: "#fff", display: "grid", gap: 8 }}>
            <Text.Title size="small">{g.ten}</Text.Title>
            <Text size="xSmall" className="chu-phu">
              Mỗi 30 ngày: {g.voucher.map((v) => `${v.soLuong} voucher ${TEN_VOUCHER[v.loai] ?? v.loai} (giảm ${vnd(gomVat(v.giam))})`).join(" · ")}
            </Text>
            <div className="tab-noi-bat" style={{ padding: 0, flexWrap: "wrap" }}>
              {g.thoiHan.map((t) => (
                <button key={t.thang} className={chon?.goi === g.id && chon.thang === t.thang ? "bat" : ""} onClick={() => setChon({ goi: g.id, thang: t.thang })}>
                  {t.thang} tháng · {vnd(gomVat(t.price))}
                </button>
              ))}
            </div>
          </Box>
        ))
      )}
      {!goi && ky && (
        <div className="nut-chinh">
          {soDu >= phaiTra ? (
            <Button fullWidth loading={dang} onClick={mua}>Mua {vnd(phaiTra)} từ ví</Button>
          ) : (
            <Button fullWidth onClick={() => dieuHuong("/nap-tien")}>Nạp thêm {vnd(phaiTra - soDu)}</Button>
          )}
        </div>
      )}
    </Page>
  );
}
