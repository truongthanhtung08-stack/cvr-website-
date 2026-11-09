import tuKhoaLoi from "@/data/tu-khoa-loi.json";

// CHỮ LÕI THEO BẢNG TỪ KHOÁ — MỘT CHỖ GIỮ cho pseo.ts (trang lõi <loại>/<tỉnh> + trang con) và khuVuc.ts (trang tỉnh /mua-ban|cho-thue/<tỉnh>).
// Bản mặc định = src/data/tu-khoa-loi.json (scripts/nap-tu-khoa.ts); Admin → Từ khoá lõi (tải tệp) → tuKhoaLoiDb.napTuKhoaLoi() thay bằng bản Admin.
// Khoá = đường dẫn trang lõi, vd "/mua-ban/can-ho-chung-cu/da-nang", "/mua-ban/da-nang".
type Bang = Record<string, { loi?: string }>;
let bang: Bang = (tuKhoaLoi as { trang: Bang }).trang;
export function datTuKhoaLoi(trang: Bang) { bang = trang; }
export const loiCuaTrang = (duong: string): string | undefined => bang[duong]?.loi || undefined;
