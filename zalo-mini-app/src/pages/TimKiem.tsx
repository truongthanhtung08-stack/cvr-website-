import React, { useEffect, useState } from "react";
import { Box, Input, Page, Text } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import ChonMucDich from "../components/ChonMucDich";
import DanhSachTin from "../components/DanhSachTin";
import { timTin, type Tin } from "../lib/tin";
import { useTai } from "../lib/useTai";

// TÌM KIẾM — gõ tới đâu tìm tới đó (chờ 0,3 giây sau lần gõ cuối), không cần bấm Enter.
export default function TimKiem() {
  const [mucDich, setMucDich] = useState<"ban" | "thue">("ban");
  const [tuKhoa, setTuKhoa] = useState("");
  const [daTim, setDaTim] = useState("");
  useEffect(() => {
    const h = setTimeout(() => setDaTim(tuKhoa), 300);
    return () => clearTimeout(h);
  }, [tuKhoa]);

  // Hết tin khớp vẫn hiện tin liên quan kèm nhãn báo (giống web — không để trang trống).
  const { data, dangTai, loi } = useTai<{ ds: Tin[]; lienQuan: boolean }>(
    () => timTin(daTim, mucDich),
    [daTim, mucDich],
    { ds: [], lienQuan: false },
  );
  return (
    <Page>
      <TieuDe title="Tìm kiếm" />
      <Box p={3} style={{ display: "grid", gap: 12, background: "#fff" }}>
        <Input.Search
          placeholder="Nhà riêng Hòa Xuân, căn hộ 2 phòng ngủ…"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          onSearch={(v) => setDaTim(v)}
          autoFocus
        />
        <ChonMucDich giaTri={mucDich} doi={setMucDich} />
      </Box>
      {!dangTai && daTim.trim() && (
        <Box px={4} pt={3}>
          <Text size="small" className="chu-phu">
            {data.lienQuan ? `Chưa có tin khớp đủ “${daTim}” — tin gần giống:` : `${data.ds.length} tin khớp “${daTim}”`}
          </Text>
        </Box>
      )}
      <DanhSachTin ds={data.ds} dangTai={dangTai} loi={loi} trong="Chưa có tin." />
    </Page>
  );
}
