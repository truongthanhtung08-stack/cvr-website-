import React from "react";
import { anh } from "../lib/tin";

// Nội dung bài viết / tổng quan dự án: chữ thường + dòng ảnh dạng ![](url) như trên web.
export default function NoiDung({ text }: { text: string }) {
  return (
    <div className="noi-dung" style={{ fontSize: 15, lineHeight: 1.6, color: "var(--cl-body)" }}>
      {text.split("\n").map((dong, i) => {
        const m = dong.trim().match(/^!\[[^\]]*\]\(([^)]+)\)$/);
        if (m) return <img key={i} src={anh(m[1])} alt="" loading="lazy" />;
        return dong.trim() ? <p key={i} style={{ margin: "0 0 10px" }}>{dong}</p> : null;
      })}
    </div>
  );
}
