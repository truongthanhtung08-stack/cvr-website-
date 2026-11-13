import React, { useMemo, useState } from "react";
import { Box, Icon, Sheet, Text } from "zmp-ui";
import BieuTuongWeb from "./BieuTuongWeb";

// Ô CHỌN CÓ TÌM — như ô chọn web (src/components/ChonCoTim.tsx, 14/11/2026 anh: bảng Tỉnh/Thành "khó vl"): bấm ô mở bảng trượt từ
// đáy, ô tìm ở đầu, gõ có dấu hay không dấu đều ra (gõ "da" ra Đà Nẵng); danh sách dài không phải cuộn tay.
export type LuaChon = { gt: string; nhan: string };
const boDau = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

export default function ChonCoTim({
  nhan, giuCho, giaTri, ds, onChon, tat = false,
}: { nhan: string; giuCho: string; giaTri: string; ds: LuaChon[]; onChon: (gt: string) => void; tat?: boolean }) {
  const [mo, setMo] = useState(false);
  const [tu, setTu] = useState("");
  const loc = useMemo(() => {
    const k = boDau(tu.trim());
    if (!k) return ds;
    const bat = ds.filter((d) => boDau(d.nhan).startsWith(k));
    return [...bat, ...ds.filter((d) => !bat.includes(d) && boDau(d.nhan).includes(k))];
  }, [ds, tu]);
  const dangChon = ds.find((d) => d.gt === giaTri)?.nhan;
  const chon = (gt: string) => { onChon(gt); setMo(false); setTu(""); };

  return (
    <>
      <div className="o-chon-tim">
        <label>{nhan}</label>
        <button type="button" disabled={tat} className={dangChon ? "" : "trong"} onClick={() => setMo(true)}>
          <span>{dangChon ?? giuCho}</span>
          <Icon icon="zi-chevron-down" size={20} />
        </button>
      </div>
      <Sheet visible={mo} onClose={() => { setMo(false); setTu(""); }} autoHeight mask handler swipeToClose>
        <Box p={4} style={{ display: "grid", gap: 8 }}>
          <Text.Title size="normal">{nhan.replace(/\s*\*$/, "")}</Text.Title>
          <input className="o-tim-bang" placeholder="Tìm" value={tu} onChange={(e) => setTu(e.target.value)} />
          <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
            {loc.map((d) => (
              <div key={d.gt} className="dong-chon" onClick={() => chon(d.gt)}>
                <span>{d.nhan}</span>
                {d.gt === giaTri && <BieuTuongWeb ten="dau" co={24} />}
              </div>
            ))}
          </div>
        </Box>
      </Sheet>
    </>
  );
}
