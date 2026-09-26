// Tin đã xem gần đây — giữ trên máy khách, tối đa 30 tin.
const KHOA = "cl-da-xem";

export function dsDaXem(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KHOA) ?? "[]");
  } catch {
    return [];
  }
}

export function ghiDaXem(id: string) {
  const moi = [id, ...dsDaXem().filter((x) => x !== id)].slice(0, 30);
  try {
    localStorage.setItem(KHOA, JSON.stringify(moi));
  } catch {}
}
