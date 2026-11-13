import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "zmp-ui";
import { openPhone, openWebview } from "zmp-sdk";
import { anh, hangHieuLuc, type Tin } from "../lib/tin";
import { gia, dienTich, diaChi, luc, tomTatTin } from "../lib/dinhDang";
import { daLuu, doiLuu } from "../lib/daLuu";
import { tachAnh } from "../lib/media";
import { theoDoiThe } from "../lib/hienThi";
import { chiaSeTin } from "../lib/zalo";
import { supabase, usePhien } from "../lib/supabase";
import BieuTuongWeb from "./BieuTuongWeb";
import logoTron from "../assets/logo-tron.svg";

// THẺ TIN TO — trang chủ, ĐÚNG thẻ web điện thoại (src/components/TheTinMobile.tsx, 12/11/2026): ảnh lớn tràn bề ngang · hàng 3 ảnh nhỏ
// (Diamond, Gold) · tiêu đề · giá · diện tích đỏ · địa chỉ · mô tả theo cấp · người đăng + Làm mới · tim · chia sẻ · [Zalo] [số ẩn đuôi + mắt].
// Luật cấp = web TheTinMobile (14/11/2026): mô tả Diamond 3 · Gold 3 · Silver 2 · Basic 2 dòng; Zalo + số chỉ tin Diamond · Gold · Silver;
// ngày "Đăng …" / "Làm mới …"; giá trống "Giá thỏa thuận".
const HANG: Record<string, { ten: string; mau: string; hoa: boolean; dong: number; anhNho: boolean }> = {
  diamond: { ten: "DIAMOND", mau: "#c1121f", hoa: true, dong: 3, anhNho: true },
  gold: { ten: "GOLD", mau: "#b8860b", hoa: true, dong: 3, anhNho: true },
  silver: { ten: "SILVER", mau: "#2f5d84", hoa: false, dong: 2, anhNho: false },
};
const anDuoi = (s: string) => { const d = s.replace(/\D/g, ""); return `${d.slice(0, 4)} ${d.slice(4, 7)} ***`; };
const chuCai = (ten: string) => ten.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

export default function TheTinDoc({ tin }: { tin: Tin }) {
  const dieuHuong = useNavigate();
  const { nguoiDung } = usePhien();
  const h = HANG[hangHieuLuc(tin)];
  const [luu, setLuu] = useState(() => daLuu(tin.id));
  const [hienSo, setHienSo] = useState(false);
  const anhs = tachAnh(tin.images);
  const moTa = tomTatTin(tin);
  const ten = tin.nguoi_dang || "Coastal Land";
  const the = useRef<HTMLElement>(null);
  useEffect(() => (the.current && tin.id !== "xem-truoc" ? theoDoiThe(the.current, tin.id) : undefined), [tin.id]); // Xem trước ở form đăng tin: không đếm lượt hiển thị

  const dung = (e: React.MouseEvent) => e.stopPropagation();
  // Mở số như trang tin (XemSo): khách đã liên kết → ghi Khách quan tâm cho người đăng
  const moSo = (e: React.MouseEvent) => {
    dung(e);
    if (!hienSo) {
      setHienSo(true);
      if (nguoiDung) supabase.rpc("reveal_contact", { p_listing_id: tin.id, p_nguon: "zalo" }).then(() => {}, () => {});
    } else if (tin.sdt) openPhone({ phoneNumber: tin.sdt }).catch(() => {});
  };
  const nhanZalo = (e: React.MouseEvent) => {
    dung(e);
    if (!tin.sdt) return;
    const link = `https://zalo.me/${tin.sdt.replace(/\D/g, "")}`;
    openWebview({ url: link }).catch(() => { window.location.href = link; });
  };

  return (
    <article ref={the} className={`the-to ${h ? "co-hang" : ""}`} style={h ? { borderTopColor: h.mau } : undefined} onClick={() => dieuHuong(`/tin/${tin.id}`)}>
      <div className="the-to-anh">
        {anhs[0] ? <img src={anh(anhs[0])} alt={tin.title} loading="lazy" /> : <div className="anh-trong"><img src={logoTron} alt="" /></div>}
        {h && <span className="the-to-hang" style={{ background: h.mau }}>{h.ten}</span>}
        {anhs.length > 1 && <span className="the-to-so"><BieuTuongWeb ten="anh" co={14} /> {anhs.length}</span>}
      </div>
      {h?.anhNho && anhs.length >= 4 && (
        <div className="the-to-nho">{anhs.slice(1, 4).map((a) => <img key={a} src={anh(a)} alt="" loading="lazy" />)}</div>
      )}
      <div className="the-to-than">
        <h3 className={h?.hoa ? "hoa" : ""}>{tin.title}</h3>
        <div className="the-to-gia">
          <span>{gia(tin) === "Thỏa thuận" ? "Giá thỏa thuận" : gia(tin)}</span>
          {dienTich(tin) && <><i>·</i><span>{dienTich(tin)}</span></>}
          {/* Như web TheTinMobile: Diamond · Gold thêm số phòng ngủ, phòng tắm (hình giường, bồn tắm của web BieuTuongThe) */}
          {(hangHieuLuc(tin) === "diamond" || hangHieuLuc(tin) === "gold") && <>
            {!!tin.beds && <span className="the-to-pn"><i>·</i>{tin.beds}<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-label="phòng ngủ"><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></svg></span>}
            {!!tin.baths && <span className="the-to-pn"><i>·</i>{tin.baths}<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-label="phòng tắm"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /><path d="M10 5 8 7" /><path d="M2 12h20" /><path d="M7 19v2" /><path d="M17 19v2" /></svg></span>}
          </>}
        </div>
        <div className="the-to-dc"><BieuTuongWeb ten="viTri" co={16} /> {diaChi(tin)}</div>
        {moTa && <p className="the-to-mota" style={{ WebkitLineClamp: h?.dong ?? 2 }}>{moTa}</p>}
        <div className="the-to-nguoi">
          <span className="the-to-avt">{chuCai(ten)}</span>
          <div><b>{ten}</b><small>{/^Làm mới/.test(luc(tin)) ? luc(tin) : luc(tin) && `Đăng ${luc(tin).replace(/^Hôm qua$/, "hôm qua")}`}</small></div>
          <button aria-label="Lưu tin" onClick={(e) => { dung(e); setLuu(doiLuu(tin.id)); }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={luu ? "#e11d48" : "none"} stroke={luu ? "#e11d48" : "currentColor"} strokeWidth="1.8"><path d="M12 20.3s-7.5-4.6-9.2-9.4C1.6 7.4 4 4.2 7.4 4.2c2 0 3.5 1.1 4.6 2.6 1.1-1.5 2.6-2.6 4.6-2.6 3.4 0 5.8 3.2 4.6 6.7-1.7 4.8-9.2 9.4-9.2 9.4Z" /></svg>
          </button>
          <button aria-label="Chia sẻ" onClick={(e) => { dung(e); chiaSeTin(tin.title, `${gia(tin)} · ${diaChi(tin)}`, anh(anhs[0]), `/tin/${tin.id}`); }}>
            <BieuTuongWeb ten="chiaSe" co={22} />
          </button>
        </div>
        {h && tin.sdt && (
          <div className="the-to-lienhe">
            <button className="the-to-zalo" onClick={nhanZalo}>Zalo</button>
            <button className="the-to-goi" onClick={moSo}><BieuTuongWeb ten="dienThoai" co={18} /> {hienSo ? `Gọi ${tin.sdt}` : anDuoi(tin.sdt)}{!hienSo && <BieuTuongWeb ten="mat" co={18} />}</button>
          </div>
        )}
      </div>
    </article>
  );
}
