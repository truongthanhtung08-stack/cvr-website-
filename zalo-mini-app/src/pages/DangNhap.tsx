import React, { useState } from "react";
import { Box, Button, Input, Page, Text, useNavigate } from "zmp-ui";
import { authorize, getAccessToken } from "zmp-sdk";
import TieuDe from "../components/TieuDe";
import logoTron from "../assets/logo-tron.svg";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

// ĐĂNG NHẬP — chung tài khoản với coastalland.vn (chủ dự án 06/11/2026: Mini App tận dụng nền tảng Zalo, đăng nhập bằng Zalo).
//   1) CHÍNH: "Đăng nhập bằng Zalo" — Zalo hỏi khách cho phép chia sẻ TÊN + ẢNH (scope.userInfo, quyền mặc định của Mini App),
//      đồng ý là vào: máy chủ hỏi Zalo id + tên + ảnh → cùng tài khoản với nút Zalo trên web (/api/auth/zalo-mini-app).
//      KHÔNG xin số lúc đăng nhập — số chỉ bắt buộc khi đăng tin, xác minh bằng mã tới chính số đó (luật 06/11).
//   2) DỰ PHÒNG: nhập số → mã gửi về Zalo của số đó → nhập mã (cùng đường web /api/xac-thuc/dang-nhap-sdt).
// Chỉ hỏi quyền khi khách BẤM nút (luật Mini App: không xin quyền lúc mở app) và nói rõ lấy gì, để làm gì.
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
      await authorize({ scopes: ["scope.userInfo"] }); // Zalo hiện hộp hỏi khách cho phép chia sẻ tên + ảnh
      // Máy chủ tự hỏi Zalo id + tên + ảnh bằng mã này — không nhận tên / ảnh do máy khách gửi lên.
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("khong_co_token");
      const r = await fetch(`${WEB}/api/auth/zalo-mini-app`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.loi);
      const { error } = await supabase.auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token });
      if (error) throw error;
      dieuHuong(tiep, { replace: true });
    } catch {
      setLoi("Chưa đăng nhập được. Vui lòng thử lại.");
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
            {/* Bố cục: logo · tên · câu Zalo bắt buộc · nút Zalo chính · lối phụ */}
            <Box flex flexDirection="column" alignItems="center" style={{ gap: 10, margin: "24px 0 12px" }}>
              <img src={logoTron} alt="Coastal Land" width={72} height={72} style={{ borderRadius: "50%" }} />
              <Text.Title size="large">COASTAL LAND</Text.Title>
            </Box>
            {/* Zalo bắt buộc nói rõ lấy thông tin gì, để làm gì trước khi hỏi quyền (bản 51 bị trả về) — câu anh duyệt 09/11/2026 */}
            <Text size="small" className="chu-phu" style={{ textAlign: "center" }}>
              Dùng tên và ảnh đại diện Zalo để tạo tài khoản Coastal Land: đăng tin, lưu tin, nạp tiền và nhận thông báo.
            </Text>
            <Button fullWidth size="large" loading={dang} onClick={nhanhBangZalo}>Đăng nhập bằng Zalo</Button>
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
