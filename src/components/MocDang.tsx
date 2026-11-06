"use client";

import { useEffect, useState } from "react";
import { freshText } from "@/lib/data";

// DÒNG "Đăng 3 giờ trước" / "Làm mới 2 giờ trước" TRÊN THẺ TIN — tính theo giờ MÁY KHÁCH (07/11/2026).
// Trang dựng sẵn chỉ dựng lại khi dữ liệu đổi thật (không còn dựng lại theo giờ — tiết kiệm Vercel), nên chữ ghi lúc dựng
// sẽ cũ dần → vẽ lại một lần sau khi mở. suppressHydrationWarning: React không báo lệch giữa chữ lúc dựng và chữ trên máy.
export default function MocDang({ postedAt, bumpedAt, hetHan, coChuDang, className }: {
  postedAt?: string;
  bumpedAt?: string;
  hetHan?: boolean;
  coChuDang?: boolean;
  className?: string;
}) {
  const [, setDaMo] = useState(false);
  useEffect(() => setDaMo(true), []);
  const m = freshText(postedAt, bumpedAt);
  const chu = hetHan ? "Hết hạn" : coChuDang && !m.startsWith("Làm mới") ? `Đăng ${m.charAt(0).toLowerCase()}${m.slice(1)}` : m;
  return <span className={className} suppressHydrationWarning>{chu}</span>;
}
