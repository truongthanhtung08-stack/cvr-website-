import { docKho, ghiKho } from "./kho";

// SO SÁNH — danh sách tin đang so (như web useCompare), giữ trong bộ nhớ Zalo. Điện thoại: tối đa 3 tin (bảng vừa màn).
const KHOA = "cl-so-sanh";
export const TOI_DA_SO_SANH = 3;
export const dsSoSanh = (): string[] => docKho<string[]>(KHOA, []);
export const dangSoSanh = (id: string) => dsSoSanh().includes(id);
export function doiSoSanh(id: string): boolean {
  const ds = dsSoSanh();
  if (ds.includes(id)) { ghiKho(KHOA, ds.filter((x) => x !== id)); return false; }
  ghiKho(KHOA, [...ds, id].slice(-TOI_DA_SO_SANH));
  return true;
}
export const boSoSanh = (id: string) => ghiKho(KHOA, dsSoSanh().filter((x) => x !== id));
