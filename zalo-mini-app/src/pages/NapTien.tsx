import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Input, Page, Text, useNavigate } from "zmp-ui";
import { Payment } from "zmp-sdk/apis";
import TieuDe from "../components/TieuDe";
import XacMinhSo from "../components/XacMinhSo";
import { supabase, usePhien } from "../lib/supabase";

// NẠP TIỀN VÀO VÍ — trong Mini App bắt buộc thanh toán qua Checkout của Zalo (chính sách nền tảng; bản 51 bị trả về vì nút Nạp
// gọi Checkout chưa bật). Cách chạy (09/11/2026): máy chủ web tạo đơn PayOS → trả mã VietQR → Payment.openCheckoutPopup (khung
// chuyển khoản ngân hàng chuẩn của Zalo, mở thẳng app ngân hàng) → gắn orderId Zalo vào đơn → PayOS báo tiền về thì cộng
// CÙNG VÍ với web và báo trạng thái đơn cho Zalo. Trang tự đọc lại số dư tới khi tiền vào.
const WEB = "https://coastalland.vn";
const MUC = [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];
const vnd = (v: number) => `${v.toLocaleString("vi-VN")} đ`;
const CHO_TOI_DA = 10 * 60_000; // đọc số dư tối đa 10 phút sau khi khách sang app ngân hàng

export default function NapTien() {
  const dieuHuong = useNavigate();
  const { phien, nguoiDung, san } = usePhien();
  const [soTien, setSoTien] = useState<number>(500_000);
  const [dang, setDang] = useState(false);
  const [canSo, setCanSo] = useState(false);
  const [cho, setCho] = useState(false);
  const [bao, setBao] = useState<{ loai: "loi" | "ok"; chu: string }>();
  const [soDu, setSoDu] = useState(0);
  const soDuTruoc = useRef(0);

  const docSoDu = async () =>
    nguoiDung ? Number((await supabase.from("profiles").select("balance").eq("id", nguoiDung.id).maybeSingle()).data?.balance ?? 0) : 0;

  useEffect(() => {
    docSoDu().then(setSoDu).catch(() => {});
  }, [nguoiDung?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chờ tiền vào: đọc số dư mỗi 4 giây (cả khi khách quay lại từ app ngân hàng), dừng khi số dư tăng hoặc quá 10 phút.
  useEffect(() => {
    if (!cho) return;
    const batDau = Date.now();
    const id = setInterval(async () => {
      const moi = await docSoDu().catch(() => soDuTruoc.current);
      if (moi > soDuTruoc.current) {
        setSoDu(moi);
        setCho(false);
        setBao({ loai: "ok", chu: `Đã nhận ${vnd(moi - soDuTruoc.current)}. Số dư: ${vnd(moi)}.` });
      } else if (Date.now() - batDau > CHO_TOI_DA) setCho(false);
    }, 4000);
    return () => clearInterval(id);
  }, [cho]); // eslint-disable-line react-hooks/exhaustive-deps

  const goi = async (duong: string, body: unknown) => {
    const r = await fetch(`${WEB}/api/thanh-toan/zalo-checkout/${duong}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${phien?.access_token}` },
      body: JSON.stringify(body),
    });
    return r.json();
  };

  const nap = async () => {
    setDang(true);
    setBao(undefined);
    try {
      const j = await goi("tao-don", { soTien });
      if (j.code === "CAN_XAC_MINH_SDT") return setCanSo(true);
      if (!j.ok) throw new Error(j.loi);
      soDuTruoc.current = await docSoDu();
      const rs = await Payment.openCheckoutPopup({ amount: j.amount, orderDescription: j.desc, qrContent: j.qrContent, method: "BANK" });
      if (rs.status !== "pay") return;
      // orderId: tài liệu Zalo có (khi method BANK dùng tài khoản động), kiểu của zmp-sdk 2.53.4 chưa khai
      const orderId = (rs as { orderId?: string }).orderId;
      if (orderId) await goi("gan-don", { maDon: j.maDon, orderId }).catch(() => {});
      setCho(true);
    } catch (e) {
      const ma = (e as { code?: number }).code;
      setBao({
        loai: "loi",
        chu: ma === -1404 ? "Zalo trên máy chưa hỗ trợ thanh toán. Vui lòng cập nhật Zalo." : (e as Error).message || "Chưa thanh toán được, vui lòng thử lại.",
      });
    } finally {
      setDang(false);
    }
  };

  if (san && !nguoiDung)
    return (
      <Page style={{ background: "#fff" }}>
        <TieuDe title="Nạp tiền" />
        <Box p={4} style={{ display: "grid", gap: 12 }}>
          <Button fullWidth onClick={() => dieuHuong("/dang-nhap?tiep=/nap-tien")}>Thử lại</Button>
        </Box>
      </Page>
    );

  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title="Nạp tiền" />
      <Box p={4} style={{ display: "grid", gap: 14 }}>
        <div className="khung-vi">
          <span>Số dư ví</span>
          <strong>{vnd(soDu)}</strong>
        </div>
        {canSo ? (
          <>
            <Text.Title size="small">Xác minh số điện thoại</Text.Title>
            <XacMinhSo
              dangTin={false}
              nutZalo="Dùng số điện thoại Zalo"
              chuaDangNhap={() => dieuHuong("/dang-nhap?tiep=/nap-tien")}
              xong={() => setCanSo(false)}
            />
          </>
        ) : (
          <>
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
            <Button fullWidth loading={dang || cho} disabled={soTien < 10_000} onClick={nap}>Nạp {vnd(soTien)}</Button>
          </>
        )}
        {bao && <Text size="small" style={{ color: bao.loai === "loi" ? "#d70018" : "var(--cl-body)" }}>{bao.chu}</Text>}
      </Box>
    </Page>
  );
}
