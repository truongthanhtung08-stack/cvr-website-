import React, { useState } from "react";
import { Icon } from "zmp-ui";
import { openPhone, openWebview } from "zmp-sdk";
import { supabase, usePhien } from "../lib/supabase";

// LIÊN HỆ NGƯỜI ĐĂNG — thanh đáy trang tin, như web: [Zalo] [0981 ••• ••• · Hiện số để gọi].
// Trong Mini App KHÔNG bắt xác thực để xem số (chủ dự án chốt 27/09/2026).
// Khách ĐÃ ĐĂNG NHẬP thì mở số qua hàm reveal_contact của web → ghi thành KHÁCH QUAN TÂM
// cho người đăng (cùng bảng listing_leads, người đăng thấy ở trang Khách hàng trên web).
// Chưa đăng nhập vẫn hiện số — chỉ là không ghi được ai đã hỏi.
const dep = (s: string) => s.replace(/(\d{4})(\d{3})(\d+)/, "$1 $2 $3");

export default function XemSo({ id, sdt, soAn }: { id: string; sdt?: string | null; soAn?: string | null }) {
  const { nguoiDung } = usePhien();
  const [hien, setHien] = useState(false);
  if (!sdt) return null;

  const moSo = async () => {
    setHien(true);
    if (nguoiDung) await supabase.rpc("reveal_contact", { p_listing_id: id }).then(() => {}, () => {});
  };
  const nhanZalo = async () => {
    if (!hien) await moSo();
    // zalo.me/<số> mở thẳng khung chat Zalo với người đăng (Zalo tự nhận link của mình).
    const link = `https://zalo.me/${sdt}`;
    // Ngoài Mini App (xem thử bằng trình duyệt) không có openWebview → mở thẳng link.
    openWebview({ url: link }).catch(() => { window.location.href = link; });
  };

  return (
    <div className="lien-he">
      <button className="nut-zalo" onClick={nhanZalo}>
        <Icon icon="zi-chat" size={20} /> Zalo
      </button>
      {!hien ? (
        <button className="nut-goi" onClick={moSo}>
          <Icon icon="zi-call" size={20} /> {soAn} · Hiện số
        </button>
      ) : (
        <button className="nut-goi" onClick={() => openPhone({ phoneNumber: sdt }).catch(() => {})}>
          <Icon icon="zi-call" size={20} /> Gọi {dep(sdt)}
        </button>
      )}
    </div>
  );
}
