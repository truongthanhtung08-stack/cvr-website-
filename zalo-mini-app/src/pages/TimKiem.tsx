import React, { useState } from "react";
import { Box, Header, Input, Page } from "zmp-ui";
import ChonMucDich from "../components/ChonMucDich";
import DanhSachTin from "../components/DanhSachTin";
import { layTinMoi, timTin, type Tin } from "../lib/tin";
import { Text } from "zmp-ui";
import { useTai } from "../lib/useTai";

export default function TimKiem() {
  const [mucDich, setMucDich] = useState<"ban" | "thue">("ban");
  const [tuKhoa, setTuKhoa] = useState("");
  const [daTim, setDaTim] = useState("");
  // Hết tin khớp vẫn hiện tin liên quan kèm nhãn báo (giống web — không để trang trống).
  const { data, dangTai, loi } = useTai<{ ds: Tin[]; lienQuan: boolean }>(
    async () => {
      const ds = await timTin(daTim, mucDich);
      if (ds.length || !daTim) return { ds, lienQuan: false };
      return { ds: await layTinMoi(mucDich, 20), lienQuan: true };
    },
    [daTim, mucDich],
    { ds: [], lienQuan: false },
  );
  return (
    <Page>
      <Header title="Tìm kiếm" />
      <Box p={3} style={{ display: "grid", gap: 12 }}>
        <Input.Search
          placeholder="Đà Nẵng, Hòa Xuân, căn hộ, đất nền…"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          onSearch={(v) => setDaTim(v)}
          autoFocus
        />
        <ChonMucDich giaTri={mucDich} doi={setMucDich} />
      </Box>
      {data.lienQuan && !dangTai && (
        <Box px={3}><Text size="small" className="chu-phu">Chưa có tin khớp “{daTim}” — tin liên quan:</Text></Box>
      )}
      <DanhSachTin ds={data.ds} dangTai={dangTai} loi={loi} trong="Chưa có tin." />
    </Page>
  );
}
