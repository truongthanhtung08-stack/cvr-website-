import React, { useState } from "react";
import { Box, Button, Icon, Input, Sheet, Text } from "zmp-ui";
import { openPhone } from "zmp-sdk";

// Xem số người bán — dùng ĐÚNG API /api/xem-so của web: nhập SĐT → mã về Zalo → nhập mã → hiện số.
// Vé xác thực (30 ngày) giữ trên máy nên các tin sau bấm là thấy số ngay, như trên web.
const API = "https://coastalland.vn/api/xem-so";
const KHOA_VE = "cl-ve-xem-so";

const docVe = () => {
  try {
    return localStorage.getItem(KHOA_VE) ?? undefined;
  } catch {
    return undefined;
  }
};

async function goi(body: Record<string, string | undefined>) {
  const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return (await r.json()) as { ok: boolean; sdt?: string; ve?: string; daGui?: boolean; loi?: string };
}

export default function XemSo({ listingId, soAn }: { listingId: string; soAn?: string | null }) {
  const [mo, setMo] = useState(false);
  const [buoc, setBuoc] = useState<"sdt" | "ma">("sdt");
  const [sdt, setSdt] = useState("");
  const [ma, setMa] = useState("");
  const [soNguoiBan, setSoNguoiBan] = useState<string>();
  const [loi, setLoi] = useState<string>();
  const [dang, setDang] = useState(false);

  const nhanSo = (d: { ok: boolean; sdt?: string; ve?: string; loi?: string }) => {
    if (d.ok && d.sdt) {
      setSoNguoiBan(d.sdt);
      setMo(false);
      if (d.ve) try { localStorage.setItem(KHOA_VE, d.ve); } catch {}
      return true;
    }
    setLoi(d.loi ?? "Chưa lấy được số. Thử lại sau.");
    return false;
  };

  const batDau = async () => {
    setLoi(undefined);
    const ve = docVe();
    if (ve) {
      setDang(true);
      const d = await goi({ listingId, ve }).catch(() => null);
      setDang(false);
      if (d?.ok && d.sdt) return nhanSo(d);
      try { localStorage.removeItem(KHOA_VE); } catch {}
    }
    setBuoc("sdt");
    setMo(true);
  };

  const guiMa = async () => {
    setDang(true);
    setLoi(undefined);
    const d = await goi({ listingId, sdt }).catch(() => null);
    setDang(false);
    if (d?.ok && d.daGui) setBuoc("ma");
    else setLoi(d?.loi ?? "Chưa gửi được mã. Kiểm tra mạng rồi thử lại.");
  };

  const xacNhan = async () => {
    setDang(true);
    const d = await goi({ listingId, sdt, ma }).catch(() => null);
    setDang(false);
    if (d) nhanSo(d);
    else setLoi("Kiểm tra mạng rồi thử lại.");
  };

  if (soNguoiBan)
    return (
      <button className="nut-goi" onClick={() => openPhone({ phoneNumber: soNguoiBan }).catch(() => {})}>
        <Icon icon="zi-call" size={20} /> Gọi {soNguoiBan.replace(/(d{4})(d{3})(d+)/, "$1 $2 $3")}
      </button>
    );

  return (
    <>
      {/* Hiện số che 3 số cuối như web; bấm vào là mở số đầy đủ. */}
      <button className="nut-goi" disabled={dang} onClick={batDau}>
        <Icon icon="zi-call" size={20} /> {soAn ? `${soAn} · Hiện số để gọi` : "Hiện số để gọi"}
      </button>
      <Sheet visible={mo} onClose={() => setMo(false)} autoHeight mask handler swipeToClose>
        <Box p={4} style={{ display: "grid", gap: 12 }}>
          <Text.Title size="normal">{buoc === "sdt" ? "Xác thực số điện thoại" : "Nhập mã xác thực"}</Text.Title>
          {buoc === "sdt" ? (
            <>
              <Input placeholder="Số điện thoại của bạn" inputMode="tel" value={sdt} onChange={(e) => setSdt(e.target.value)} />
              <Button fullWidth loading={dang} disabled={sdt.replace(/\D/g, "").length < 9} onClick={guiMa}>Nhận mã qua Zalo</Button>
            </>
          ) : (
            <>
              <Text size="small" className="chu-phu">Mã đã gửi về Zalo của số {sdt}</Text>
              <Input placeholder="Mã 6 số" inputMode="numeric" value={ma} onChange={(e) => setMa(e.target.value.replace(/\D/g, "").slice(0, 6))} />
              <Button fullWidth loading={dang} disabled={ma.length < 4} onClick={xacNhan}>Xem số</Button>
            </>
          )}
          {loi && <Text size="small" style={{ color: "#d70018" }}>{loi}</Text>}
        </Box>
      </Sheet>
    </>
  );
}
