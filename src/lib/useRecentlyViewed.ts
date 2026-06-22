"use client";

import { useEffect, useState } from "react";

// Lưu danh sách ID tin VỪA XEM vào localStorage (giống "Tin đã xem" của Homedy).
const KEY = "cvr_viewed";
const EVENT = "cvr-viewed-change";
const CAP = 12;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// Ghi 1 tin vào lịch sử xem (đưa lên đầu, không trùng, giới hạn CAP).
export function recordView(id: string) {
  if (typeof window === "undefined") return;
  const next = [id, ...read().filter((x) => x !== id)].slice(0, CAP);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(read());
    const sync = () => setIds(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return ids;
}
