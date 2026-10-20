// NGUỒN DỮ LIỆU ĐỊA DANH — bản TRÌNH DUYỆT (xem diaDanhNguon.ts). Mảng rỗng lúc mở trang; napDiaDanh() tải gói riêng
// rồi đổ vào CHÍNH các mảng này, nên mọi hàm tra cứu (locations.ts…) thấy dữ liệu ngay khi về.
// Mỗi lần mở trang tải 1 lần (~90 KB nén), trình duyệt + CDN giữ lại cho lần sau.
import type { ProvinceOld } from "./provincesOld";
import type { ProvinceNew } from "./provincesNew";

export const provincesOld: ProvinceOld[] = [];
export const provincesNew: ProvinceNew[] = [];

let daCo = false;
let dangNap: Promise<void> | null = null;
const cho = new Set<() => void>();

export function daCoDiaDanh(): boolean {
  return daCo;
}

export function napDiaDanh(): Promise<void> {
  dangNap ??= import("./diaDanhGoi").then((g) => {
    provincesOld.push(...g.provincesOld);
    provincesNew.push(...g.provincesNew);
    daCo = true;
    cho.forEach((f) => f());
    cho.clear();
  });
  return dangNap;
}

export function khiCoDiaDanh(f: () => void): () => void {
  if (daCo) return () => {};
  cho.add(f);
  return () => cho.delete(f);
}
