"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// ⏸️ TẠM ẨN LANDING PAGE (28.07): mọi truy cập /landing/* tự chuyển về /gioi-thieu.
// Dùng redirect phía client để chạy đúng cả bản static export (GitHub Pages) lẫn Vercel.
// MỞ LẠI landing: đặt LANDING_HIDDEN=false trong page.tsx (và khôi phục href landing ở banners.ts).
export default function LandingDisabledRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/gioi-thieu");
  }, [router]);
  return null;
}
