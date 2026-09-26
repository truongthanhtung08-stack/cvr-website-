// Tin đã lưu — giữ trên máy khách (giống nút tim trên web khi chưa đăng nhập).
const KHOA = "cl-da-luu";

export function dsDaLuu(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KHOA) ?? "[]");
  } catch {
    return [];
  }
}

export function daLuu(id: string) {
  return dsDaLuu().includes(id);
}

export function doiLuu(id: string): boolean {
  const ds = dsDaLuu();
  const co = ds.includes(id);
  const moi = co ? ds.filter((x) => x !== id) : [id, ...ds].slice(0, 200);
  try {
    localStorage.setItem(KHOA, JSON.stringify(moi));
  } catch {}
  return !co;
}
