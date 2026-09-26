import React, { useState } from "react";
import { Box, Button, Icon, Sheet, Text } from "zmp-ui";
import { dtTheo, giaTheo, loaiTheo, SAP_XEP, type BoLoc, type MucDich } from "../lib/boLoc";

type O = "tinh" | "loai" | "gia" | "dienTich" | "sapXep";

// Thanh lọc gọn kiểu Zalo: hàng nút trượt ngang, bấm nút nào mở bảng chọn dưới lên.
export default function ThanhLoc({ md, boLoc, doi, dsTinh }: { md: MucDich; boLoc: BoLoc; doi: (b: BoLoc) => void; dsTinh: string[] }) {
  const [mo, setMo] = useState<O | null>(null);

  const luaChon: Record<O, { tieuDe: string; ds: string[] }> = {
    tinh: { tieuDe: "Khu vực", ds: dsTinh },
    loai: { tieuDe: "Loại hình", ds: loaiTheo(md).map((l) => l.nhan) },
    gia: { tieuDe: "Mức giá", ds: giaTheo(md).map((g) => g.nhan) },
    dienTich: { tieuDe: "Diện tích", ds: dtTheo(md).map((d) => d.nhan) },
    sapXep: { tieuDe: "Sắp xếp", ds: SAP_XEP.map((s) => s.nhan) },
  };

  const giaTriNut = (o: O) =>
    o === "sapXep"
      ? SAP_XEP.find((s) => s.gt === boLoc.sapXep)!.nhan
      : o === "tinh"
        ? boLoc.tinh ?? boLoc.khuVuc // ô khu vực trang chủ (Quy Nhơn…) hiện ở nút Khu vực
        : (boLoc[o] as string | undefined);

  const chon = (o: O, v?: string) => {
    if (o === "sapXep") doi({ ...boLoc, sapXep: SAP_XEP.find((s) => s.nhan === v)?.gt ?? "moi" });
    else if (o === "tinh") doi({ ...boLoc, tinh: v, khuVuc: undefined });
    else doi({ ...boLoc, [o]: v });
    setMo(null);
  };

  return (
    <>
      <div className="thanh-loc">
        {(["tinh", "loai", "gia", "dienTich", "sapXep"] as O[]).map((o) => {
          const gt = giaTriNut(o);
          const bat = o !== "sapXep" && !!gt;
          return (
            <button key={o} className={bat ? "bat" : ""} onClick={() => setMo(o)}>
              {gt ?? luaChon[o].tieuDe}
              <Icon icon="zi-chevron-down" size={16} />
            </button>
          );
        })}
      </div>
      <Sheet visible={mo !== null} onClose={() => setMo(null)} autoHeight mask handler swipeToClose>
        {mo && (
          <Box p={4} style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Text.Title size="normal" style={{ marginBottom: 8 }}>{luaChon[mo].tieuDe}</Text.Title>
            {mo !== "sapXep" && (
              <div className="dong-chon" onClick={() => chon(mo, undefined)}>
                <span>Tất cả</span>
                {!giaTriNut(mo) && <Icon icon="zi-check" />}
              </div>
            )}
            {luaChon[mo].ds.map((v) => (
              <div key={v} className="dong-chon" onClick={() => chon(mo, v)}>
                <span>{v}</span>
                {giaTriNut(mo) === v && <Icon icon="zi-check" />}
              </div>
            ))}
            <Box mt={3}><Button fullWidth variant="secondary" onClick={() => setMo(null)}>Đóng</Button></Box>
          </Box>
        )}
      </Sheet>
    </>
  );
}
