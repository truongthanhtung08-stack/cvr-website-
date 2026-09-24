"use client";

import { useState } from "react";

// ẢNH ĐẠI DIỆN THẬT của khách (Google / Zalo cấp khi đăng nhập). Không có ảnh,
// hoặc ảnh hỏng → chữ cái đầu của tên. Không bao giờ hiện ảnh minh hoạ giả.
// className quyết định cỡ + màu nền của vòng tròn (dùng được trên nền tối lẫn sáng).
export default function AnhDaiDien({ url, ten, className }: { url?: string | null; ten: string; className: string }) {
  const [hong, setHong] = useState(false);
  const chu = ten.trim().charAt(0).toUpperCase() || "T";
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${className}`}>
      {url && !hong ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          // Ảnh Google (lh3.googleusercontent.com) hay chặn khi có referrer.
          referrerPolicy="no-referrer"
          onError={() => setHong(true)}
        />
      ) : (
        chu
      )}
    </span>
  );
}
