import React, { useEffect, useState } from "react";
import { Box, Button, Input, Page, Spinner, Switch, Text } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { supabase, usePhien } from "../lib/supabase";
import CanDangNhap from "../components/CanDangNhap";

// CÀI ĐẶT — cùng hồ sơ + cùng cách lưu với web (src/app/tai-khoan/cai-dat/page.tsx): họ tên (khách tự đặt → giữ khi gộp / đăng nhập
// lại: tu_dat, tu_dat_ten), tên trên tin đổi theo (/api/tai-khoan/dong-bo-ten-anh) · thông tin xuất hóa đơn công ty.
const WEB = "https://coastalland.vn";

export default function CaiDat() {
  const { san, nguoiDung } = usePhien();
  const [hs, setHs] = useState<Record<string, any> | null>(null);
  const [ten, setTen] = useState("");
  const [hd, setHd] = useState({ bat: false, cty: "", mst: "", diaChi: "", email: "" });
  const [dang, setDang] = useState<"" | "ten" | "hd">("");
  const [bao, setBao] = useState<string>();

  useEffect(() => {
    if (!nguoiDung) return;
    supabase.from("profiles").select("full_name,xuat_hoa_don,hd_ten_cong_ty,hd_mst,hd_dia_chi,hd_email").eq("id", nguoiDung.id).maybeSingle().then(({ data }) => {
      setHs(data ?? {});
      setTen(data?.full_name ?? "");
      setHd({ bat: !!data?.xuat_hoa_don, cty: data?.hd_ten_cong_ty ?? "", mst: data?.hd_mst ?? "", diaChi: data?.hd_dia_chi ?? "", email: data?.hd_email ?? "" });
    });
  }, [nguoiDung?.id]);

  const luuTen = async () => {
    if (!nguoiDung || !ten.trim()) return setBao("Nhập họ tên.");
    setDang("ten");
    setBao(undefined);
    const tenCu = hs?.full_name ?? null;
    const { error } = await supabase.from("profiles").update({ full_name: ten.trim() }).eq("id", nguoiDung.id);
    if (!error) {
      await supabase.auth.updateUser({ data: { full_name: ten.trim(), tu_dat: true, tu_dat_ten: true } });
      if ((tenCu ?? "").trim() !== ten.trim()) {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (token)
          await fetch(`${WEB}/api/tai-khoan/dong-bo-ten-anh`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ tenCu }) }).catch(() => {});
      }
      setHs((h) => ({ ...(h ?? {}), full_name: ten.trim() }));
    }
    setDang("");
    setBao(error ? `Lưu thất bại: ${error.message}` : "Đã lưu");
  };

  const luuHd = async () => {
    if (!nguoiDung) return;
    if (hd.bat && (!hd.cty.trim() || !hd.mst.trim())) return setBao("Điền Tên công ty và Mã số thuế.");
    setDang("hd");
    setBao(undefined);
    const { error } = await supabase.from("profiles").update({
      xuat_hoa_don: hd.bat, hd_ten_cong_ty: hd.cty.trim() || null, hd_mst: hd.mst.trim() || null, hd_dia_chi: hd.diaChi.trim() || null, hd_email: hd.email.trim() || null,
    }).eq("id", nguoiDung.id);
    setDang("");
    setBao(error ? `Lưu thất bại: ${error.message}` : "Đã lưu");
  };

  if (san && !nguoiDung) return <CanDangNhap tieuDe="Cài đặt" />; // chưa vào tài khoản: cùng màn như Gói hội viên
  if (!hs) return <Page><TieuDe title="Cài đặt tài khoản" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  return (
    <Page style={{ paddingBottom: 24 }}>
      <TieuDe title="Cài đặt tài khoản" />
      <Box mt={2} p={4} style={{ background: "#fff", display: "grid", gap: 12 }}>
        <Text.Title size="small">Họ tên</Text.Title>
        <Input value={ten} onChange={(e) => setTen(e.target.value)} maxLength={60} />
        <Button size="small" loading={dang === "ten"} onClick={luuTen}>Lưu</Button>
      </Box>
      <Box mt={2} p={4} style={{ background: "#fff", display: "grid", gap: 12 }}>
        <Box flex justifyContent="space-between" alignItems="center">
          <Text.Title size="small">Xuất hóa đơn công ty</Text.Title>
          <Switch checked={hd.bat} onChange={(e) => setHd({ ...hd, bat: e.target.checked })} />
        </Box>
        {hd.bat && (
          <>
            <Input label="Tên công ty" value={hd.cty} onChange={(e) => setHd({ ...hd, cty: e.target.value })} />
            <Input label="Mã số thuế" inputMode="numeric" value={hd.mst} onChange={(e) => setHd({ ...hd, mst: e.target.value })} />
            <Input label="Địa chỉ" value={hd.diaChi} onChange={(e) => setHd({ ...hd, diaChi: e.target.value })} />
            <Input label="Email nhận hóa đơn" inputMode="email" value={hd.email} onChange={(e) => setHd({ ...hd, email: e.target.value })} />
          </>
        )}
        <Button size="small" loading={dang === "hd"} onClick={luuHd}>Lưu</Button>
      </Box>
      {bao && <Box p={4}><Text size="small" style={{ color: bao === "Đã lưu" ? "var(--cl-ink)" : "#d70018" }}>{bao}</Text></Box>}
    </Page>
  );
}
