import React, { useState } from "react";
import { Box, Button, Input, Page, Text, useNavigate } from "zmp-ui";
import { getAccessToken, getPhoneNumber } from "zmp-sdk";
import TieuDe from "../components/TieuDe";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { layNguoiZalo } from "../lib/zalo";

// ĐĂNG NHẬP — chung tài khoản với coastalland.vn.
//   1) CHÍNH: "Đăng nhập nhanh bằng Zalo" — Zalo hỏi khách có chia sẻ số điện thoại không,
//      đồng ý là vào (máy chủ đổi mã ra số thật: /api/auth/zalo-mini-app). Chạy khi Zalo đã
//      duyệt Mini App + có máy chủ Việt Nam; chưa đủ thì tự lùi về cách 2, khách không kẹt.
//   2) DỰ PHÒNG: nhập số → mã OTP gửi về Zalo → nhập mã.
// Zalo bắt nói rõ vì sao xin số trước khi hỏi quyền (chính sách 3.3.4) — dòng giải thích bên dưới.
const WEB = "https://coastalland.vn";

export default function DangNhap() {
  const dieuHuong = useNavigate();
  const [thamSo] = useSearchParams();
  const tiep = thamSo.get("tiep") || "/tai-khoan";
  const [buoc, setBuoc] = useState<"chon" | "so" | "ma">("chon");
  const [so, setSo] = useState("");
  const [ma, setMa] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string>();

  const nhanhBangZalo = async () => {
    setDang(true);
    setLoi(undefined);
    try {
      const accessToken = await getAccessToken();
      const { token: maSdt } = await getPhoneNumber();
      if (!accessToken || !maSdt) throw new Error("khong_co_token");
      const nguoi = await layNguoiZalo();
      const r = await fetch(`${WEB}/api/auth/zalo-mini-app`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, maSdt, ten: nguoi?.name }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.loi);
      const { error } = await supabase.auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token });
      if (error) throw error;
      dieuHuong(tiep, { replace: true });
    } catch {
      // Khách từ chối chia sẻ số, hoặc Zalo chưa cấp quyền / chưa có máy chủ VN → dùng mã OTP.
      setLoi("Chưa đăng nhập nhanh được — bạn nhập số điện thoại để nhận mã nhé.");
      setBuoc("so");
    } finally {
      setDang(false);
    }
  };

  // Mã do máy chủ web gửi qua Zalo (/api/xac-thuc/dang-nhap-sdt) — CHUNG quy tắc với web
  // (chốt 28/09/2026): 1 số = 1 tài khoản, số được đánh dấu đã xác minh, tài khoản email cũ
  // có số này thì vào đúng tài khoản đó, tin Coastal Land đăng hộ tự về. Không dùng OTP của
  // Supabase nữa (mã đúng nhưng số không được xác minh → tin không về, dễ đẻ tài khoản trùng).
  const goiMa = async (body: Record<string, string>) => {
    try {
      const r = await fetch(`${WEB}/api/xac-thuc/dang-nhap-sdt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return (await r.json()) as { ok: boolean; loi?: string; access_token?: string; refresh_token?: string };
    } catch {
      return { ok: false, loi: "Không kết nối được. Vui lòng thử lại." };
    }
  };

  const guiMa = async () => {
    setDang(true);
    setLoi(undefined);
    const j = await goiMa({ buoc: "gui-ma", sdt: so });
    setDang(false);
    if (!j.ok) setLoi(j.loi || "Chưa gửi được mã. Vui lòng thử lại sau.");
    else setBuoc("ma");
  };

  const xacThuc = async () => {
    setDang(true);
    setLoi(undefined);
    const j = await goiMa({ buoc: "xac-nhan", sdt: so, ma });
    if (j.ok && j.access_token && j.refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token });
      setDang(false);
      if (!error) return dieuHuong(tiep, { replace: true });
    }
    setDang(false);
    setLoi(j.loi || "Mã xác thực không đúng hoặc đã hết hạn.");
  };

  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title="Đăng nhập" />
      <Box p={4} style={{ display: "grid", gap: 12 }}>
        {buoc === "chon" && (
          <>
            <Text.Title size="large">Đăng nhập Coastal Land</Text.Title>
            <Text size="small" className="chu-phu">
              Coastal Land dùng số điện thoại Zalo của bạn làm tài khoản — để đăng tin, lưu tin và nhận báo khi có người quan tâm. Số của bạn không hiện công khai.
            </Text>
            <Button fullWidth loading={dang} onClick={nhanhBangZalo}>Đăng nhập nhanh bằng Zalo</Button>
            <Button fullWidth variant="tertiary" onClick={() => setBuoc("so")}>Nhận mã qua số điện thoại</Button>
          </>
        )}
        {buoc === "so" && (
          <>
            <Text.Title size="large">Số điện thoại của bạn</Text.Title>
            <Input placeholder="0905 123 456" inputMode="tel" value={so} onChange={(e) => setSo(e.target.value)} />
            <Button fullWidth loading={dang} disabled={so.replace(/\D/g, "").length < 9} onClick={guiMa}>Nhận mã qua Zalo</Button>
          </>
        )}
        {buoc === "ma" && (
          <>
            <Text.Title size="large">Nhập mã xác thực</Text.Title>
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
