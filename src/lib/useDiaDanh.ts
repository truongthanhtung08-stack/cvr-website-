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
    napKhiRanh();
    return bo;
  }, []);
  return co;
}

// NẠP LÚC MÁY RẢNH (tốc độ điện thoại, đo 21/10/2026): gói địa danh ~90 KB nén — nạp ngay lúc mở trang là giành đường truyền và
// máy với ảnh, chữ đầu trang. Nay chờ trang tải xong rồi nạp khi máy rảnh (chậm nhất 3 giây sau). Khách chạm / gõ trước đó, hoặc
// địa chỉ có từ khoá tìm (?q=, cần địa danh để hiểu câu) → nạp ngay.
let daHen = false;
function napKhiRanh() {
  if (daHen) return;
  daHen = true;
  if (/[?&]q=/.test(window.location.search)) { void napDiaDanh(); return; }
  const nap = () => { void napDiaDanh(); };
  window.addEventListener("pointerdown", nap, { once: true, capture: true });
  window.addEventListener("keydown", nap, { once: true, capture: true });
  const ranh = () => (window.requestIdleCallback ? window.requestIdleCallback(nap, { timeout: 3000 }) : window.setTimeout(nap, 1000));
  if (document.readyState === "complete") ranh();
  else window.addEventListener("load", ranh, { once: true });
}
