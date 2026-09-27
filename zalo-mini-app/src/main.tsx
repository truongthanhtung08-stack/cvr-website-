import "zmp-ui/zaui.css";
import "./app.css";
import React from "react";
import { createRoot } from "react-dom/client";
import UngDung from "./app";

// XEM THỬ NGOÀI MINI APP (link cloudflared mở trong trình duyệt Zalo / localhost): không có cụm ⋯ ✕
// của Mini App nên bỏ khoảng chừa cho nó — không thì đầu trang hở một khoảng vô lý.
// Trong Mini App thật (tên miền của Zalo) giữ nguyên khoảng chừa.
if (/trycloudflare\.com$|^localhost$|^127\.|^192\.168\.|^10\./.test(location.hostname)) {
  document.documentElement.classList.add("xem-thu");
}

createRoot(document.getElementById("app")!).render(React.createElement(UngDung));
