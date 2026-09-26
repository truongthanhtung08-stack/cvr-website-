import React, { useState } from "react";
import { useNavigate } from "zmp-ui";
import { anh, hangHieuLuc, type Tin } from "../lib/tin";
import { gia, dienTich, diaChi } from "../lib/dinhDang";
import { daLuu, doiLuu } from "../lib/daLuu";

// Thẻ tin — theo đúng thẻ trên web (src/components/PropertyCard.tsx + tiers trong src/lib/packages.ts):
// huy hiệu hạng · số ảnh · tiêu đề (Diamond/Gold VIẾT HOA) · mô tả theo hạng (3/2/1/0 dòng) · giá trái, diện tích phải · địa chỉ.
const HANG: Record<string, { ten: string; mau: string; hoa: boolean; dong: number }> = {
  diamond: { ten: "Diamond", mau: "#c1121f", hoa: true, dong: 3 },
  gold: { ten: "Gold", mau: "#b8860b", hoa: true, dong: 2 },
  silver: { ten: "Silver", mau: "#2f5d84", hoa: false, dong: 1 },
  basic: { ten: "", mau: "", hoa: false, dong: 0 },
};

function tomTat(t: Tin): string {
  let mo = (t.description ?? "").replace(/::\w+::|\*\*|!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  if (mo.toLowerCase().startsWith(t.title.toLowerCase().slice(0, 40))) mo = mo.slice(t.title.length).replace(/^[\s.,:;–—-]+/, "");
  if (mo.length >= 30) return mo;
  const noi = [t.ward, t.province].filter(Boolean).join(", ");
  return `${t.type} tại ${noi}. Diện tích ${dienTich(t) ?? "—"}${t.beds ? ` • ${t.beds} PN` : ""}.`;
}

export default function TheTin({ tin }: { tin: Tin }) {
  const dieuHuong = useNavigate();
  const h = HANG[hangHieuLuc(tin)];
  const [luu, setLuu] = useState(() => daLuu(tin.id));
  const thoaThuan = tin.price_vnd == null;

  return (
    <article className="the-tin" onClick={() => dieuHuong(`/tin/${tin.id}`)}>
      <div style={{ position: "relative" }}>
        <img src={anh(tin.images?.[0])} alt={tin.title} loading="lazy" />
        {h.ten && <span className="nhan-hang" style={{ background: `${h.mau}e6` }}>{h.ten}</span>}
        <button
          className="nut-tim"
          aria-label="Lưu tin"
          onClick={(e) => {
            e.stopPropagation();
            setLuu(doiLuu(tin.id));
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={luu ? "#e11d48" : "none"} stroke={luu ? "#e11d48" : "#fff"} strokeWidth="2">
            <path d="M12 20.3s-7.5-4.6-9.2-9.4C1.6 7.4 4 4.2 7.4 4.2c2 0 3.5 1.1 4.6 2.6 1.1-1.5 2.6-2.6 4.6-2.6 3.4 0 5.8 3.2 4.6 6.7-1.7 4.8-9.2 9.4-9.2 9.4Z" />
          </svg>
        </button>
        <span className="so-anh">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h3l2-3h6l2 3h3v13H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
          {tin.images?.length || 1}
        </span>
      </div>
      <div className="than-the">
        <h3 className={`tieu-de${h.hoa ? " hoa" : ""}`}>{tin.title}</h3>
        {h.dong > 0 && <p className="mo-ta" style={{ WebkitLineClamp: h.dong }}>{tomTat(tin)}</p>}
        <div className="gia-dt">
          <span className="gia" style={thoaThuan ? { color: "var(--cl-muted)" } : undefined}>{gia(tin)}</span>
          <span>{dienTich(tin)}</span>
        </div>
        <p className="dia-chi">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
          <span>{diaChi(tin)}</span>
        </p>
      </div>
    </article>
  );
}
