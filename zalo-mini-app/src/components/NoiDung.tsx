import React from "react";
import { anh } from "../lib/tin";

// Nội dung bài viết / tổng quan dự án — đọc ĐÚNG ký hiệu soạn thảo của web (src/components/RichContent.tsx, src/lib/chuThuan.ts):
//   ::center:: ::right:: ::justify:: đầu dòng = canh lề (không in ra chữ) · ![](url) = ảnh · @[video](url) = video (bỏ qua — Mini App cấm
//   mở trang ngoài) · **đậm** *nghiêng* = bỏ dấu, giữ chữ. 06/11/2026: trước in thẳng ":justify:" ra cho khách.
const CANH: Record<string, React.CSSProperties["textAlign"]> = { center: "center", right: "right", justify: "justify" };
const boDau = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/(^|[^\d*])\*(?!\s)(.+?)\*(?!\d)/g, "$1$2");

export default function NoiDung({ text }: { text: string }) {
  return (
    <div className="noi-dung" style={{ fontSize: 15, lineHeight: 1.6, color: "var(--cl-body)" }}>
      {text.split("\n").map((dong, i) => {
        let d = dong.trim();
        const m = d.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
        if (m) return <img key={i} src={anh(m[1])} alt="" loading="lazy" />;
        if (/^@\[video\]\([^)]*\)$/i.test(d)) return null;
        let canh: React.CSSProperties["textAlign"];
        const c = d.match(/^:{1,2}(center|right|justify):{1,2}\s*/i);
        if (c) { canh = CANH[c[1].toLowerCase()]; d = d.slice(c[0].length); }
        d = boDau(d.replace(/:{1,2}(center|right|justify):{1,2}/gi, " ").trim());
        return d ? <p key={i} style={{ margin: "0 0 10px", textAlign: canh }}>{d}</p> : null;
      })}
    </div>
  );
}
