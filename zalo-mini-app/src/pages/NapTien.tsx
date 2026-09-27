import React, { useState } from "react";
import { Box, Button, Input, Page, Text, useNavigate } from "zmp-ui";
import { CheckoutSDK } from "zmp-sdk/apis";
import TieuDe from "../components/TieuDe";
import { supabase, usePhien } from "../lib/supabase";
import { useTai } from "../lib/useTai";

// NẠP TIỀN VÀO VÍ — trong Mini App bắt buộc thanh toán qua Checkout SDK của Zalo
// (chính sách nền tảng). Máy chủ web tạo đơn + ký MAC (/api/thanh-toan/zalo-checkout/tao-don),
// Mini App mở trang thanh toán của Zalo; Zalo báo kết quả về máy chủ, tiền vào CÙNG VÍ với web.
// Chưa bật Checkout (chờ Zalo duyệt + cắm khoá) thì máy chủ trả "chưa bật" và trang báo rõ.
const WEB = "https://coastalland.vn";
const MUC = [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];
const vnd = (v: number) => `${v.toLocaleString("vi-VN")} đ`;

export default function NapTien() {
  const dieuHuong = useNavigate();
  const { phien, nguoiDung, san } = usePhien();
  const [soTien, setSoTien] = useState<number>(500_000);
  const [dang, setDang] = useState(false);
  const [bao, setBao] = useState<{ loai: "loi" | "ok"; chu: string }>();
  const vi = useTai(
    async () => (nguoiDung ? Number((await supabase.from("profiles").select("balance").eq("id", nguoiDung.id).maybeSingle()).data?.balance ?? 0) : 0),
    [nguoiDung?.id],
    0,
  );

  const nap = async () => {
    setDang(true);
    setBao(undefined);
    try {
      const r = await fetch(`${WEB}/api/thanh-toan/zalo-checkout/tao-don`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${phien?.access_token}` },
        body: JSON.stringify({ soTien }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.loi);
      await CheckoutSDK.createOrder({ amount: j.amount, desc: j.desc, item: j.item, extradata: j.extradata, mac: j.mac });
      setBao({ loai: "ok", chu: "Đã gửi yêu cầu thanh toán. Thanh toán xong, số dư ví tự cập nhật và Coastal Land báo cho bạn qua Zalo." });
    } catch (e) {
      setBao({ loai: "loi", chu: (e as Error).message || "Chưa thanh toán được, vui lòng thử lại." });
    } finally {
      setDang(false);
    }
  };

  if (san && !nguoiDung)
    return (
      <Page style={{ background: "#fff" }}>
        <TieuDe title="Nạp tiền" />
        <Box p={4} style={{ display: "grid", gap: 12 }}>
          <Text className="chu-phu">Đăng nhập để nạp tiền vào ví đăng tin.</Text>
          <Button fullWidth onClick={() => dieuHuong("/dang-nhap?tiep=/nap-tien")}>Đăng nhập</Button>
        </Box>
      </Page>
    );

  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title="Nạp tiền" />
      <Box p={4} style={{ display: "grid", gap: 14 }}>
        <div className="khung-vi">
          <span>Số dư ví</span>
          <strong>{vnd(vi.data)}</strong>
        </div>
        <Text.Title size="small">Chọn số tiền</Text.Title>
        <div className="luoi-muc-nap">
          {MUC.map((m) => (
            <button key={m} className={m === soTien ? "bat" : ""} onClick={() => setSoTien(m)}>{vnd(m)}</button>
          ))}
        </div>
        <Input
          label="Hoặc nhập số khác (đ)"
          inputMode="numeric"
          value={soTien ? soTien.toLocaleString("vi-VN") : ""}
          onChange={(e) => setSoTien(Number(e.target.value.replace(/\D/g, "")) || 0)}
        />
        <Button fullWidth loading={dang} disabled={soTien < 10_000} onClick={nap}>Nạp {vnd(soTien)}</Button>
        {bao && <Text size="small" style={{ color: bao.loai === "loi" ? "#d70018" : "var(--cl-body)" }}>{bao.chu}</Text>}
        <Text size="xSmall" className="chu-phu">Ví dùng chung với coastalland.vn — nạp ở đâu cũng đăng tin được ở cả hai nơi.</Text>
      </Box>
    </Page>
  );
}
