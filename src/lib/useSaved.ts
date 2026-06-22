"use client";

import { useCallback, useEffect, useState } from "react";

// Lưu danh sách ID tin yêu thích vào localStorage (giống "Tin đã lưu" của batdongsan.com.vn).
// Chưa cần đăng nhập — sau này khi có tài khoản sẽ đồng bộ lên Supabase.
const KEY = "cvr_saved";
const EVENT = "cvr-saved-change";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function useSaved() {
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

  const toggle = useCallback((id: string) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
    setIds(next);
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, count: ids.length, toggle, has };
}
