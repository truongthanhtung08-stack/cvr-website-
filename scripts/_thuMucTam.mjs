// THƯ MỤC TẠM CHO CÁC LỆNH ĐO (trình duyệt Edge chạy ngầm) — chủ dự án 24/10/2026: ổ C đầy.
// Trước đây mỗi lần đo tạo một hồ sơ Edge ~0,5 GB trong %TEMP% ổ C và không xoá (tích tới 24 GB).
// Nay: đặt ở ổ D, tự xoá khi lệnh kết thúc. Không có ổ D thì dùng %TEMP% như cũ (vẫn xoá).
import fs from "node:fs";
import path from "node:path";

const GOC = fs.existsSync("D:/") ? "D:/Coastal Land/_tam" : process.env.TEMP;

export function thuMucTam(ten) {
  const dir = path.join(GOC, ten);
  fs.mkdirSync(dir, { recursive: true });
  process.on("exit", () => {
    try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
  });
  return dir;
}

export const TAM = GOC;
