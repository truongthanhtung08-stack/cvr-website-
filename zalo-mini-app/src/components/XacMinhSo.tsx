import React, { useState } from "react";
import { Button, Input, Text } from "zmp-ui";
import { getAccessToken, getPhoneNumber } from "zmp-sdk";
import { soVN, supabase } from "../lib/supabase";

// XÁC MINH SỐ ĐIỆN THOẠI — một khối dùng chung cho Đăng tin và Nạp tiền (luật tài khoản 06/11/2026: đăng tin / nạp tiền cần số
// đã xác minh). Số Zalo một chạm (getPhoneNumber) hoặc nhập số → mã gửi về Zalo của CHÍNH số đó → nhập mã.
// Cùng đường web /api/xac-thuc/xac-minh-sdt. dangTin = true chỉ ở form đăng tin (máy chủ mới được tự gộp tài khoản — nạp tiền
// dính tiền nên không gộp).

export default function XacMinhSo({ dangTin, nutZalo, chuaDangNhap, xong }: {
  dangTin: boolean;
  nutZalo: string;
  chuaDangNhap: () => void;
  xong: (sdt: string) => void;
}) {
  const [buoc, setBuoc] = useState<"so" | "ma">("so");
  const [sdt, setSdt] = useState("");
  const [ma, setMa] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string>();

  const goi = async (b: "gui-ma" | "xac-nhan" | "so-zalo") => {
    setLoi(undefined);
    setDang(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return chuaDangNhap();
      const r = await fetch("https://coastalland.vn/api/xac-thuc/xac-minh-sdt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          b === "so-zalo"
            ? { buoc: b, dangTin, tokenSo: (await getPhoneNumber()).token, zaloAccessToken: await getAccessToken() }
            : { buoc: b, sdt, ma, dangTin },
        ),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; loi?: string; sdt?: string; doiTaiKhoan?: { access_token: string; refresh_token: string } };
      if (!j.ok) return setLoi(j.loi || "Chưa xác minh được số. Vui lòng thử lại.");
      if (b === "gui-ma") return setBuoc("ma");
      // Số đã thuộc tài khoản khác → máy chủ gộp về tài khoản đó và trả phiên mới (như web)
      if (j.doiTaiKhoan) await supabase.auth.setSession({ access_token: j.doiTaiKhoan.access_token, refresh_token: j.doiTaiKhoan.refresh_token });
      xong(soVN(j.sdt ?? sdt));
    } catch {
      // Khách bấm Từ chối ở hộp hỏi số của Zalo → không báo lỗi, vẫn nhập số khác được (Chính sách kiểm duyệt Zalo 6.3).
      if (b !== "so-zalo") setLoi("Không kết nối được. Vui lòng thử lại.");
    } finally {
      setDang(false);
    }
  };

  return buoc === "so" ? (
    <>
      <Button loading={dang} onClick={() => goi("so-zalo")}>{nutZalo}</Button>
      <Input label="Hoặc nhập số khác" inputMode="tel" value={sdt} onChange={(e) => setSdt(e.target.value)} />
      <Button size="small" loading={dang} disabled={sdt.replace(/\D/g, "").length < 10} onClick={() => goi("gui-ma")}>Nhận mã qua Zalo</Button>
      {loi && <Text size="small" style={{ color: "#d70018" }}>{loi}</Text>}
    </>
  ) : (
    <>
      <Input label={`Mã đã gửi về Zalo của số ${sdt}`} inputMode="numeric" value={ma} onChange={(e) => setMa(e.target.value.replace(/\D/g, "").slice(0, 6))} />
      <Button size="small" loading={dang} disabled={ma.length < 6} onClick={() => goi("xac-nhan")}>Xác minh số</Button>
      <Button size="small" variant="tertiary" onClick={() => { setBuoc("so"); setMa(""); }}>Đổi số khác</Button>
      {loi && <Text size="small" style={{ color: "#d70018" }}>{loi}</Text>}
    </>
  );
}
