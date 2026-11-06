import { docKho, ghiKho } from "./kho";

// Tin đã xem gần đây — giữ trong bộ nhớ của Zalo (src/lib/kho.ts), tối đa 30 tin.
const KHOA = "cl-da-xem";

export const dsDaXem = (): string[] => docKho<string[]>(KHOA, []);
export const ghiDaXem = (id: string) => ghiKho(KHOA, [id, ...dsDaXem().filter((x) => x !== id)].slice(0, 30));
