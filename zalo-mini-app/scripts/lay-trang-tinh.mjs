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
const GIU = new Set(["img", "div", "h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "b", "strong", "em", "i", "table", "thead", "tbody", "tr", "th", "td", "br", "details", "summary"]);

function lam(html) {
  let m = (html.match(/<main[\s\S]*?<\/main>/) || [html])[0];
  for (const t of ["script", "style", "svg", "noscript", "form", "button", "iframe", "nav", "select", "textarea", "picture", "video"])
    m = m.replace(new RegExp(`<${t}[\\s\\S]*?<\\/${t}>`, "gi"), "");
  // GIỐNG WEB (06/11/2026 "sao không lấy như trang web có hình ảnh"): giữ ẢNH bản điện thoại (bỏ bản _pc), đường dẫn đầy đủ ·
  // thẻ (khung viền p-6) → <div class="the"> · nút tròn của web bỏ (màn trong app tự vẽ nút, mở thẳng màn app).
  m = m.replace(/<img\b[^>]*>/gi, (the) => {
    const src = the.match(/src="([^"]*)"/)?.[1] ?? "";
    if (!src || /[-_]pc\./i.test(src)) return "";
    const url = src.startsWith("http") ? src : WEB + src.replace(/&amp;/g, "&");
    return `<img src="${url}" alt="" loading="lazy">`;
  });
  m = m.replace(/<a\b[^>]*rounded-full[^>]*>[\s\S]*?<\/a>/gi, "");
  m = m.replace(/<div class="[^"]*\bborder\b[^"]*\bp-6\b[^"]*">/gi, "<div class=the>");
  m = m.replace(/<(input|source|hr|link|meta)[^>]*>/gi, "");
  m = m.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  m = m.replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (the, ten) => (ten.toLowerCase() === "img" || /^<div class=the>$/.test(the) ? the : GIU.has(ten.toLowerCase()) ? the.replace(/\s[^>]*?(\/?)>$/, "$1>").replace(/<([a-z0-9]+)\s[^>]*>/i, "<$1>") : " "));
  m = m.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ");
  for (let i = 0; i < 4; i++) m = m.replace(/<([a-z0-9]+)>\s*<\/\1>/gi, "");
  // Bỏ dòng chữ nhỏ đặt trên tiêu đề ("Về COASTAL LAND", "Giá trị cốt lõi") — chủ dự án 06/11/2026: không chú thích.
  m = m.replace(/<p>[^<]{1,40}<\/p>\s*(<h[12]>)/g, "$1");
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
