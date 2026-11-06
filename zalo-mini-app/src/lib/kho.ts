import { nativeStorage } from "zmp-sdk";

// BỘ NHỚ CỦA ZALO (Native Storage — quyền ID 90 đã cấp): lưu trong ứng dụng Zalo, không mất khi webview xoá bộ nhớ trình duyệt.
// Ngoài Zalo (máy thử) thư viện tự dùng Local Storage. Lỗi gì cũng không làm hỏng màn.
export function docKho<T>(khoa: string, macDinh: T): T {
  try {
    const s = nativeStorage.getItem(khoa) ?? localStorage.getItem(khoa);
    return s ? (JSON.parse(s) as T) : macDinh;
  } catch {
    return macDinh;
  }
}

export function ghiKho(khoa: string, giaTri: unknown) {
  const s = JSON.stringify(giaTri);
  try { nativeStorage.setItem(khoa, s); } catch { try { localStorage.setItem(khoa, s); } catch { /* bỏ qua */ } }
}
