"use client";
import { useEffect, useState } from "react";
import { daCoDiaDanh, khiCoDiaDanh, napDiaDanh } from "@/lib/diaDanhNguon";

// Thành phần nào dựng giao diện từ địa danh (ô tìm, bộ lọc khu vực, form đăng tin…) gọi hook này: nạp dữ liệu địa danh
// sau khi trang hiện xong, về tới thì vẽ lại. Trả về true khi đã có dữ liệu.
// Máy chủ dựng và lần vẽ đầu ở trình duyệt LUÔN là false (máy chủ có sẵn địa danh, trình duyệt chưa) — để hai bên ra cùng
// một nội dung, không lỗi lệch dựng trang (React #418 ở /tim-kiem, đo 21/10/2026).
export function useDiaDanh(): boolean {
  const [co, setCo] = useState(false);
  useEffect(() => {
    if (daCoDiaDanh()) { setCo(true); return; }
    const bo = khiCoDiaDanh(() => setCo(true));
    void napDiaDanh();
    return bo;
  }, []);
  return co;
}
