// NGUỒN DỮ LIỆU ĐỊA DANH (hai hệ) — bản MÁY CHỦ: nạp sẵn, dùng ngay.
// Trình duyệt dùng bản diaDanhNguon.trinhDuyet.ts (next.config.ts → turbopack.resolveAlias, điều kiện "browser"):
// ~300 KB địa danh không nằm trong mã tải lúc mở trang nữa mà nạp sau (đo 20/10/2026: chiếm 1/5 mã của mọi trang).
// Hai file PHẢI cùng tên hàm xuất.
export { provincesOld } from "./provincesOld";
export { provincesNew } from "./provincesNew";

/** Dữ liệu địa danh đã sẵn sàng chưa (máy chủ: luôn sẵn). */
export function daCoDiaDanh(): boolean {
  return true;
}

/** Nạp dữ liệu địa danh (máy chủ: có sẵn rồi). */
export function napDiaDanh(): Promise<void> {
  return Promise.resolve();
}

/** Báo khi dữ liệu nạp xong (máy chủ: không bao giờ phải chờ). */
export function khiCoDiaDanh(_f: () => void): () => void {
  return () => {};
}
