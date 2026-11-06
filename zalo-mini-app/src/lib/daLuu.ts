import { docKho, ghiKho } from "./kho";

// Tin đã lưu — giữ trong bộ nhớ của Zalo (src/lib/kho.ts), tối đa 200 tin.
const KHOA = "cl-da-luu";

export const dsDaLuu = (): string[] => docKho<string[]>(KHOA, []);
export const daLuu = (id: string) => dsDaLuu().includes(id);

export function doiLuu(id: string): boolean {
  const ds = dsDaLuu();
  const co = ds.includes(id);
  ghiKho(KHOA, co ? ds.filter((x) => x !== id) : [id, ...ds].slice(0, 200));
  return !co;
}
