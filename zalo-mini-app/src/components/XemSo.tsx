import React, { useState } from "react";
import { openPhone, openWebview } from "zmp-sdk";
import BieuTuongWeb from "./BieuTuongWeb";
import { supabase, usePhien } from "../lib/supabase";

// LIÊN HỆ NGƯỜI ĐĂNG — thanh đáy trang tin, như web: [Zalo] [0981 234 ••• · Hiện số để gọi].
// Trong Mini App KHÔNG bắt xác thực để xem số (chủ dự án chốt 27/09/2026).
// Khách ĐÃ ĐĂNG NHẬP thì mở số qua hàm reveal_contact của web → ghi thành KHÁCH QUAN TÂM
// cho người đăng (cùng bảng listing_leads, người đăng thấy ở trang Khách hàng trên web).
// Chưa đăng nhập vẫn hiện số — chỉ là không ghi được ai đã hỏi.
const dep = (s: string) => s.replace(/(\d{4})(\d{3})(\d+)/, "$1 $2 $3");

export default function XemSo({ id, sdt, soAn, ten }: { id: string; sdt?: string | null; soAn?: string | null; ten?: string | null }) {
  const { nguoiDung } = usePhien();
  const [hien, setHien] = useState(false);
  if (!sdt) return null;

  const moSo = async () => {
    setHien(true);
    if (nguoiDung) await supabase.rpc("reveal_contact", { p_listing_id: id, p_nguon: "zalo" }).then(() => {}, () => {});
  };
  const nhanZalo = async () => {
    if (!hien) await moSo();
    // zalo.me/<số> mở thẳng khung chat Zalo với người đăng (Zalo tự nhận link của mình).
    const link = `https://zalo.me/${sdt}`;
    // Ngoài Mini App (xem thử bằng trình duyệt) không có openWebview → mở thẳng link.
    openWebview({ url: link }).catch(() => { window.location.href = link; });
  };

  return (
    // Như thanh liên hệ web điện thoại: ảnh / chữ cái người đăng · ô Zalo chỉ logo · nút số xanh
    <div className="lien-he">
      {ten && <span className="lien-he-avt">{ten.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase()}</span>}
      <button className="nut-zalo" onClick={nhanZalo} aria-label="Nhắn Zalo">
        <span className="logo-zalo">Zalo</span>
      </button>
      {!hien ? (
        <button className="nut-goi" onClick={moSo}>
          {/* Như web: số ẩn đuôi + CON MẮT (06/11/2026 "hiện số chỉ cần con mắt") */}
          <BieuTuongWeb ten="dienThoai" co={20} /> {soAn} <BieuTuongWeb ten="mat" co={20} />
        </button>
      ) : (
        <button className="nut-goi" onClick={() => openPhone({ phoneNumber: sdt }).catch(() => {})}>
          <BieuTuongWeb ten="dienThoai" co={20} /> Gọi {dep(sdt)}
        </button>
      )}
    </div>
  );
}
