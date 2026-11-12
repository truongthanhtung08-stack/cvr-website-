import tuKhoaLoi from "@/data/tu-khoa-loi.json";

// CHỮ LÕI THEO BẢNG TỪ KHOÁ — MỘT CHỖ GIỮ cho pseo.ts (trang lõi <loại>/<tỉnh> + trang con) và khuVuc.ts (trang tỉnh /mua-ban|cho-thue/<tỉnh>).
// Bản mặc định = src/data/tu-khoa-loi.json (scripts/nap-tu-khoa.ts); Admin → Từ khoá lõi (tải tệp) → tuKhoaLoiDb.napTuKhoaLoi() thay bằng bản Admin.
// Khoá = đường dẫn trang lõi, vd "/mua-ban/can-ho-chung-cu/da-nang", "/mua-ban/da-nang".
type Bang = Record<string, { loi?: string; loiCon?: string; uuTien?: boolean }>;
let bang: Bang = (tuKhoaLoi as { trang: Bang }).trang;
let phienBan = 0;
export function datTuKhoaLoi(trang: Bang) { if (JSON.stringify(trang) !== JSON.stringify(bang)) { bang = trang; phienBan++; } }
export const phienBanTuKhoa = () => phienBan;
export const loiCuaTrang = (duong: string): string | undefined => bang[duong]?.loi || undefined;
// Chữ lõi cho TRANG CON của một trang lõi (phường, giá…): lõi của trang, hoặc loiCon khi chính trang lõi đang top giữ chữ cũ
export const loiChoCon = (duong: string): string | undefined => bang[duong]?.loi || bang[duong]?.loiCon || undefined;
// Trang lõi anh đánh x (ưu tiên 2–3): pseo.ts giữ trang này khi trùng tin với trang con của nó
export const laLoiUuTien = (duong: string): boolean => !!bang[duong]?.uuTien;
