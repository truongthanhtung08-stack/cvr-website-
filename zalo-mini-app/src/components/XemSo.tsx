import React, { useState } from "react";
import { Icon } from "zmp-ui";
import { openPhone } from "zmp-sdk";

// Nút số điện thoại người đăng — như web hiện "0981 ••• ••• · Hiện số để gọi".
// Trong Mini App khách đã đăng nhập bằng Zalo nên KHÔNG bắt xác thực: bấm lần đầu hiện đủ số,
// bấm tiếp là gọi (chủ dự án chốt 27/09/2026).
const dep = (s: string) => s.replace(/(\d{4})(\d{3})(\d+)/, "$1 $2 $3");

export default function XemSo({ sdt, soAn }: { sdt?: string | null; soAn?: string | null }) {
  const [hien, setHien] = useState(false);
  if (!sdt) return null;
  if (!hien)
    return (
      <button className="nut-goi" onClick={() => setHien(true)}>
        <Icon icon="zi-call" size={20} /> {soAn} · Hiện số để gọi
      </button>
    );
  return (
    <button className="nut-goi" onClick={() => openPhone({ phoneNumber: sdt }).catch(() => {})}>
      <Icon icon="zi-call" size={20} /> Gọi {dep(sdt)}
    </button>
  );
}
