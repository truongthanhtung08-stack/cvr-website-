// LẤY TRANG THÔNG TIN TỪ WEB VÀO MINI APP (06/11/2026 — chuẩn Mini App: không mở trang web, mọi màn chạy trong Zalo).
// Chạy: node scripts/lay-trang-tinh.mjs → ghi src/lib/trangTinh.json (đóng gói cùng app). Web đổi chữ thì chạy lại rồi build.
// Chỉ giữ chữ + cấu trúc (tiêu đề, đoạn, danh sách, bảng); bỏ liên kết, nút, ảnh, form, mã.
import { writeFileSync } from "node:fs";

const WEB = "https://coastalland.vn";
const TRANG = [
  ["gioi-thieu", "Giới thiệu"],
  ["tuyen-dung", "Tuyển dụng"],
  ["quy-che", "Quy chế hoạt động"],
  ["dieu-khoan", "Điều khoản thoả thuận"],
  ["bao-mat", "Chính sách bảo mật"],
  ["huong-dan", "Hướng dẫn đăng tin"],
  ["faq", "Câu hỏi thường gặp"],
  ["quy-dinh", "Quy định đăng tin"],
];
const GIU = new Set(["h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "b", "strong", "em", "i", "table", "thead", "tbody", "tr", "th", "td", "br", "details", "summary"]);

function lam(html) {
  let m = (html.match(/<main[\s\S]*?<\/main>/) || [html])[0];
  for (const t of ["script", "style", "svg", "noscript", "form", "button", "iframe", "nav", "select", "textarea", "picture", "video"])
    m = m.replace(new RegExp(`<${t}[\\s\\S]*?<\\/${t}>`, "gi"), "");
  m = m.replace(/<(img|input|source|hr|link|meta)[^>]*>/gi, "");
  m = m.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  m = m.replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (the, ten) => (GIU.has(ten.toLowerCase()) ? the.replace(/\s[^>]*?(\/?)>$/, "$1>").replace(/<([a-z0-9]+)\s[^>]*>/i, "<$1>") : " "));
  m = m.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ");
  for (let i = 0; i < 4; i++) m = m.replace(/<([a-z0-9]+)>\s*<\/\1>/gi, "");
  return m.trim();
}

const kq = {};
for (const [duong, ten] of TRANG) {
  const r = await fetch(`${WEB}/${duong}`);
  if (!r.ok) throw new Error(`${duong}: ${r.status}`);
  kq[duong] = { ten, html: lam(await r.text()) };
  console.log(duong, kq[duong].html.length);
}
writeFileSync(new URL("../src/lib/trangTinh.json", import.meta.url), JSON.stringify(kq));
