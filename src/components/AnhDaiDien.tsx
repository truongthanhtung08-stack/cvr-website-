"use client";

import { useState } from "react";

// ẢNH ĐẠI DIỆN THẬT của khách (Google / Zalo cấp khi đăng nhập, hoặc khách tự đặt trong Cài đặt). Không có ảnh,
// hoặc ảnh hỏng → HÌNH NGƯỜI XÁM mặc định (chuẩn các web lớn — chủ dự án 26/10/2026: đăng nhập bằng số, tên là số
// điện thoại, vòng tròn chữ số "0" rất xấu). Không bao giờ hiện ảnh minh hoạ giả.
// className quyết định cỡ + màu nền của vòng tròn (dùng được trên nền tối lẫn sáng).
export default function AnhDaiDien({ url, ten, className }: { url?: string | null; ten: string; className: string }) {
  const [hong, setHong] = useState(false);
  void ten;
  const chu = (
    <svg viewBox="0 0 24 24" className="h-[62%] w-[62%] opacity-60" fill="currentColor" aria-hidden>
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.6-8 5.8V21h16v-1.2c0-3.2-3.6-5.8-8-5.8Z" />
    </svg>
  );
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
