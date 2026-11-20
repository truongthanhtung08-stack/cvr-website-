import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "zmp-ui";
import { loaiTheo } from "../lib/boLoc";

// MENU ≡ = MENU WEB ĐIỆN THOẠI (Header.tsx navItems, anh 20/11/2026: "chỉnh lại menu trên Zalo Mini App"): cùng thứ tự Mua bán ·
// Cho thuê · Dự án · Tin tức · Báo giá; Mua bán / Cho thuê có mục con loại hình (cây loại hình chung, lib/boLoc loaiTheo) trượt vào
// kèm "‹ Mua bán". Màn đen buông xuống như web (.menu-man). Tiện ích · Điểm tin thị trường là trang web — Mini App không mở trang web
// (chính sách Zalo) nên không đưa vào.
type Muc = { nhan: string; duong: string; con?: { nhan: string; duong: string }[] };
const conTheo = (md: "ban" | "thue") => [
  { nhan: md === "ban" ? "Tất cả nhà đất bán" : "Tất cả nhà đất cho thuê", duong: `/ds/${md}` },
  ...loaiTheo(md).map((l) => ({ nhan: l.nhan, duong: `/ds/${md}?loai=${encodeURIComponent(l.nhan)}` })),
];
const MUC: Muc[] = [
  { nhan: "Mua bán", duong: "/ds/ban", con: conTheo("ban") },
  { nhan: "Cho thuê", duong: "/ds/thue", con: conTheo("thue") },
  { nhan: "Dự án", duong: "/du-an" },
  { nhan: "Tin tức", duong: "/tin-tuc" },
  { nhan: "Báo giá", duong: "/bang-gia" },
];

export default function MenuWeb() {
  const [mo, setMo] = useState(false);
  const [nhom, setNhom] = useState<Muc | null>(null);
  const dieuHuong = useNavigate();
  const di = (d: string) => { setMo(false); setNhom(null); dieuHuong(d); };
  return (
    <>
      <button type="button" className="nut-menu press" aria-label="Menu" onClick={() => setMo(true)}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {mo && createPortal(
        <div className="menu-man-app" role="dialog" aria-label="Menu">
          <div className="menu-dau">
            {nhom ? (
              <button type="button" className="menu-lui" onClick={() => setNhom(null)}>‹ {nhom.nhan}</button>
            ) : <span />}
            <button type="button" className="menu-dong" aria-label="Đóng" onClick={() => { setMo(false); setNhom(null); }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <nav key={nhom?.nhan ?? "goc"} className={`menu-ds${nhom ? " menu-con" : ""}`}>
            {((nhom ? nhom.con : MUC) as Muc[]).map((m, i) => (
              <button
                type="button"
                key={m.duong}
                className="menu-dong-muc"
                style={{ animationDelay: `${20 + i * 25}ms` }}
                onClick={() => (m.con ? setNhom(m) : di(m.duong))}
              >
                <span>{m.nhan}</span>
                {m.con ? <span className="menu-mui">›</span> : null}
              </button>
            ))}
          </nav>
          {!nhom && (
            <div className="menu-cuoi">
              <button type="button" className="menu-dang-tin" onClick={() => di("/dang-tin")}>Đăng tin</button>
            </div>
          )}
        </div>
      , document.body)}
    </>
  );
}
