import React, { useState } from "react";
import { Box, Button, Header, Input, Page, Text, useNavigate } from "zmp-ui";
import { useSearchParams } from "react-router-dom";
import { e164, supabase } from "../lib/supabase";

// Đăng nhập bằng số điện thoại: nhập số → mã gửi về Zalo → nhập mã. Chung tài khoản với web.
export default function DangNhap() {
  const dieuHuong = useNavigate();
  const [thamSo] = useSearchParams();
  const tiep = thamSo.get("tiep") || "/tai-khoan";
  const [buoc, setBuoc] = useState<"so" | "ma">("so");
  const [so, setSo] = useState("");
  const [ma, setMa] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string>();

  const guiMa = async () => {
    setDang(true);
    setLoi(undefined);
    const { error } = await supabase.auth.signInWithOtp({ phone: e164(so) });
    setDang(false);
    if (error) setLoi(/provider|not enabled|unsupported|sms/i.test(error.message) ? "Chưa gửi được mã. Vui lòng thử lại sau." : error.message);
    else setBuoc("ma");
  };

  const xacThuc = async () => {
    setDang(true);
    setLoi(undefined);
    const { error } = await supabase.auth.verifyOtp({ phone: e164(so), token: ma, type: "sms" });
    setDang(false);
    if (error) setLoi("Mã xác thực không đúng hoặc đã hết hạn.");
    else dieuHuong(tiep, { replace: true });
  };

  return (
    <Page style={{ background: "#fff" }}>
      <Header title="Đăng nhập" />
      <Box p={4} style={{ display: "grid", gap: 12 }}>
        <Text.Title size="large">{buoc === "so" ? "Số điện thoại của bạn" : "Nhập mã xác thực"}</Text.Title>
        {buoc === "so" ? (
          <>
            <Input placeholder="0905 123 456" inputMode="tel" value={so} onChange={(e) => setSo(e.target.value)} />
            <Button fullWidth loading={dang} disabled={so.replace(/\D/g, "").length < 9} onClick={guiMa}>Nhận mã qua Zalo</Button>
          </>
        ) : (
          <>
            <Text size="small" className="chu-phu">Mã đã gửi về Zalo của số {so}</Text>
            <Input placeholder="Mã 6 số" inputMode="numeric" value={ma} onChange={(e) => setMa(e.target.value.replace(/\D/g, "").slice(0, 6))} />
            <Button fullWidth loading={dang} disabled={ma.length < 6} onClick={xacThuc}>Đăng nhập</Button>
            <Button fullWidth variant="tertiary" onClick={() => { setBuoc("so"); setMa(""); }}>Đổi số khác</Button>
          </>
        )}
        {loi && <Text size="small" style={{ color: "#d70018" }}>{loi}</Text>}
      </Box>
    </Page>
  );
}
