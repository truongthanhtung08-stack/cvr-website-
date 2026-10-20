"use client";
import { useEffect, useState } from "react";
import type { DongGoiY, MucTim } from "@/lib/goiYTheoY";

// Gợi ý theo DỮ LIỆU THẬT từ máy chủ (/api/goi-y/that) — gọi khi khách NGỪNG GÕ 0,3 giây (không gọi mỗi phím, giữ chi phí
// Vercel), nhớ kết quả từng câu trong phiên. Trong lúc chờ giữ nguyên danh sách cũ để không nhấp nháy.
// Trả null khi máy chủ LỖI — nơi gọi dùng gợi ý dự phòng ở máy khách.
const nho = new Map<string, DongGoiY[]>();

export function useGoiYThat(cau: string, muc: MucTim): DongGoiY[] | null {
  const q = cau.replace(/\s+/g, " ").trim();
  const khoa = `${muc}|${q}`;
  const [ds, setDs] = useState<DongGoiY[] | null>(() => nho.get(khoa) ?? []);
  useEffect(() => {
    if (q.length < 2) { setDs([]); return; }
    const co = nho.get(khoa);
    if (co) { setDs(co); return; }
    const hoan = new AbortController();
    const hen = window.setTimeout(() => {
      fetch(`/api/goi-y/that?q=${encodeURIComponent(q)}&md=${muc}`, { signal: hoan.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((kq: DongGoiY[]) => { nho.set(khoa, kq); setDs(kq); })
        .catch((e: unknown) => { if ((e as Error)?.name !== "AbortError") setDs(null); });
    }, 300);
    return () => { window.clearTimeout(hen); hoan.abort(); };
  }, [khoa, q, muc]);
  return ds;
}
