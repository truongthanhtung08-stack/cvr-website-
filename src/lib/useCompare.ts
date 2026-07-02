"use client";

import { useCallback, useEffect, useState } from "react";

// Danh sách ID tin ĐANG SO SÁNH (localStorage). Tối đa 4 tin — như batdongsan/homedy.
const KEY = "cvr_compare";
const EVENT = "cvr-compare-change";
export const COMPARE_MAX = 4;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.slice(0, COMPARE_MAX) : [];
  } catch {
    return [];
  }
}

function write(next: string[]) {
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function useCompare() {
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

  // Thêm/bỏ 1 tin. Trả về false nếu đã đầy (không thêm được).
  const toggle = useCallback((id: string): boolean => {
    const cur = read();
    if (cur.includes(id)) {
      write(cur.filter((x) => x !== id));
      return true;
    }
    if (cur.length >= COMPARE_MAX) return false; // đã đầy
    write([...cur, id]);
    return true;
  }, []);

  const remove = useCallback((id: string) => write(read().filter((x) => x !== id)), []);
  const clear = useCallback(() => write([]), []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, count: ids.length, toggle, remove, clear, has, full: ids.length >= COMPARE_MAX };
}
