import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Icon, Sheet, Text } from "zmp-ui";
import BieuTuongWeb from "./BieuTuongWeb";
import { dtTheo, giaTheo, HUONG_LOC, loaiTheo, NOI_THAT_LOC, PHAP_LY_LOC, type BoLoc, type MucDich } from "../lib/boLoc";
import { provincesNew } from "../lib/provincesNew";

type O = "tinh" | "loai" | "gia" | "dienTich" | "them";
const boDau = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

// THANH LỌC = BỘ LỌC WEB ĐIỆN THOẠI (FilterBar, 14/11/2026 "web một nẻo, đây một nẻo"): Toàn quốc · Loại BĐS · Khoảng giá · Diện tích ·
// Lọc thêm (web điện thoại không có ô sắp xếp). Khu vực: ô tìm + tỉnh/thành → phường/xã của tỉnh đó (có "Tất cả <tỉnh>").
// Chọn một ô thì tìm ngay; Lọc thêm chọn nhiều mục → Áp dụng mới tìm (luật bộ lọc đã chốt).
export default function ThanhLoc({ md, boLoc, doi, dsTinh }: { md: MucDich; boLoc: BoLoc; doi: (b: BoLoc) => void; dsTinh: string[] }) {
  const [mo, setMo] = useState<O | null>(null);
  const [tu, setTu] = useState("");
  const [tinhMo, setTinhMo] = useState<string | null>(null); // đang xem phường của tỉnh này
  const [them, setThem] = useState({ huong: boLoc.huong, phapLy: boLoc.phapLy, noiThat: boLoc.noiThat });

  // BÁM NGAY DƯỚI THANH TIÊU ĐỀ khi cuộn (đo thật trên máy khách — chiều cao thanh tiêu đề mỗi nơi một khác).
  const thanh = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = thanh.current;
    const khung = el?.closest(".zaui-page") as HTMLElement | null;
    const dau = (khung?.querySelector(".zaui-header") ?? document.querySelector(".zaui-header")) as HTMLElement | null;
    if (!el || !khung) return;
    const dat = () => {
      const dem = parseFloat(getComputedStyle(khung).paddingTop) || 0;
      const top = (dau ? dau.getBoundingClientRect().bottom : 0) - khung.getBoundingClientRect().top - dem;
      el.style.top = `${Math.max(0, Math.round(top))}px`;
    };
    dat();
    window.addEventListener("resize", dat);
    return () => window.removeEventListener("resize", dat);
  }, []);

  const moBang = (o: O) => {
    setTu("");
    setTinhMo(o === "tinh" && boLoc.tinh ? boLoc.tinh : null);
    if (o === "them") setThem({ huong: boLoc.huong, phapLy: boLoc.phapLy, noiThat: boLoc.noiThat });
    setMo(o);
  };
  const dong = () => setMo(null);
  const loc = (ds: string[]) => {
    const k = boDau(tu.trim());
    if (!k) return ds;
    const dau = ds.filter((x) => boDau(x).startsWith(k));
    return [...dau, ...ds.filter((x) => !dau.includes(x) && boDau(x).includes(k))];
  };
  const dsPhuong = useMemo(() => (tinhMo ? provincesNew.find((p) => p.name === tinhMo)?.wards ?? [] : []), [tinhMo]);
  const soThem = [boLoc.huong, boLoc.phapLy, boLoc.noiThat].filter(Boolean).length;

  const nhanNut = (o: O) =>
    o === "tinh" ? (boLoc.phuong ? `${boLoc.phuong}` : boLoc.tinh ?? boLoc.khuVuc ?? "Toàn quốc")
      : o === "loai" ? boLoc.loai ?? "Loại BĐS"
        : o === "gia" ? boLoc.gia ?? "Khoảng giá"
          : o === "dienTich" ? boLoc.dienTich ?? "Diện tích"
            : soThem ? `Lọc thêm (${soThem})` : "Lọc thêm";
  const dangBat = (o: O) =>
    o === "tinh" ? !!(boLoc.tinh || boLoc.khuVuc || boLoc.phuong) : o === "them" ? soThem > 0 : !!boLoc[o];

  const Dong = ({ chu, dang, bam }: { chu: string; dang: boolean; bam: () => void }) => (
    <div className="dong-chon" onClick={bam}><span>{chu}</span>{dang && <BieuTuongWeb ten="dau" co={24} />}</div>
  );
  const ChonMot = ({ nhan, ds, gt, dat }: { nhan: string; ds: string[]; gt?: string; dat: (v?: string) => void }) => (
    <div style={{ display: "grid", gap: 8 }}>
      <Text size="small" bold>{nhan}</Text>
      <div className="chon-nhieu">
        {ds.map((v) => <button key={v} className={gt === v ? "bat" : ""} onClick={() => dat(gt === v ? undefined : v)}>{v}</button>)}
      </div>
    </div>
  );

  return (
    <>
      <div ref={thanh} className="thanh-loc">
        {(["tinh", "loai", "gia", "dienTich", "them"] as O[]).map((o) => (
          <button key={o} className={dangBat(o) ? "bat" : ""} onClick={() => moBang(o)}>
            {nhanNut(o)}
            <Icon icon="zi-chevron-down" size={16} />
          </button>
        ))}
      </div>
      <Sheet visible={mo !== null} onClose={dong} autoHeight mask handler swipeToClose>
        {mo === "tinh" && (
          <Box p={4} style={{ display: "grid", gap: 8 }}>
            <Text.Title size="normal">{tinhMo ? tinhMo : "Khu vực"}</Text.Title>
            <input className="o-tim-bang" placeholder={tinhMo ? "Tìm phường / xã" : "Tìm tỉnh / thành"} value={tu} onChange={(e) => setTu(e.target.value)} />
            <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
              {tinhMo ? (
                <>
                  <div className="dong-chon dong-lui" onClick={() => { setTinhMo(null); setTu(""); }}><span>‹ Tỉnh / thành khác</span></div>
                  <Dong chu={`Tất cả ${tinhMo}`} dang={boLoc.tinh === tinhMo && !boLoc.phuong} bam={() => { doi({ ...boLoc, tinh: tinhMo, phuong: undefined, khuVuc: undefined }); dong(); }} />
                  {loc(dsPhuong).map((w) => (
                    <Dong key={w} chu={w} dang={boLoc.phuong === w} bam={() => { doi({ ...boLoc, tinh: tinhMo, phuong: w, khuVuc: undefined }); dong(); }} />
                  ))}
                </>
              ) : (
                <>
                  <Dong chu="Toàn quốc" dang={!boLoc.tinh && !boLoc.khuVuc} bam={() => { doi({ ...boLoc, tinh: undefined, phuong: undefined, khuVuc: undefined }); dong(); }} />
                  {loc(dsTinh).map((t) => (
                    <div key={t} className="dong-chon" onClick={() => { setTinhMo(t); setTu(""); }}>
                      <span>{t}</span>{boLoc.tinh === t ? <BieuTuongWeb ten="dau" co={24} /> : <Icon icon="zi-chevron-right" size={18} />}
                    </div>
                  ))}
                </>
              )}
            </div>
          </Box>
        )}
        {(mo === "loai" || mo === "gia" || mo === "dienTich") && (
          <Box p={4} style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Text.Title size="normal" style={{ marginBottom: 8 }}>{{ loai: "Loại BĐS", gia: "Khoảng giá", dienTich: "Diện tích" }[mo]}</Text.Title>
            <Dong chu="Tất cả" dang={!boLoc[mo]} bam={() => { doi({ ...boLoc, [mo]: undefined }); dong(); }} />
            {(mo === "loai" ? loaiTheo(md).map((l) => l.nhan) : mo === "gia" ? giaTheo(md).map((g) => g.nhan) : dtTheo(md).map((d) => d.nhan)).map((v) => (
              <Dong key={v} chu={v} dang={boLoc[mo] === v} bam={() => { doi({ ...boLoc, [mo]: v }); dong(); }} />
            ))}
          </Box>
        )}
        {mo === "them" && (
          <Box p={4} style={{ display: "grid", gap: 16, maxHeight: "75vh", overflowY: "auto" }}>
            <Text.Title size="normal">Lọc thêm</Text.Title>
            <ChonMot nhan="Hướng nhà" ds={HUONG_LOC} gt={them.huong} dat={(v) => setThem((x) => ({ ...x, huong: v }))} />
            <ChonMot nhan="Pháp lý" ds={PHAP_LY_LOC} gt={them.phapLy} dat={(v) => setThem((x) => ({ ...x, phapLy: v }))} />
            <ChonMot nhan="Nội thất" ds={NOI_THAT_LOC} gt={them.noiThat} dat={(v) => setThem((x) => ({ ...x, noiThat: v }))} />
            <div className="hang-nut-loc">
              <Button variant="secondary" onClick={() => setThem({ huong: undefined, phapLy: undefined, noiThat: undefined })}>Đặt lại</Button>
              <Button onClick={() => { doi({ ...boLoc, ...them }); dong(); }}>Áp dụng</Button>
            </div>
          </Box>
        )}
      </Sheet>
    </>
  );
}
