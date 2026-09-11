// ════════════════════════════════════════════════════════════════════════════
// CHÉP "THỢ PHỤ" CỦA MAPLIBRE RA public/ — chạy tự động trước mỗi lần dev/build
//
// VÌ SAO CẦN: bản đồ MapLibre giao việc tải & giải mã ô bản đồ cho một Worker
// riêng. Từ bản 6, MapLibre tìm file worker bằng đường dẫn TƯƠNG ĐỐI so với
// chính nó (import.meta.url). Next gộp thư viện vào /_next/static/chunks/… nên
// nó đi tìm /_next/static/chunks/maplibre-gl-worker.mjs — file KHÔNG hề tồn tại
// → máy chủ trả trang 404 (HTML) → worker chết → bản đồ TRẮNG TRƠ, kẹt mãi ở
// "Đang mở bản đồ…". Đo được trên web thật ngày 11/09/2026.
//
// CÁCH CHỮA: chép sẵn worker ra public/maplibre/ rồi chỉ đường cho MapLibre
// bằng setWorkerUrl (xem src/components/MapViewMo.tsx).
//
//   · Chép ĐÚNG bản đang cài trong node_modules → không bao giờ lệch phiên bản
//     với thư viện chính, kể cả sau khi nâng cấp maplibre-gl.
//   · Đổi đuôi .mjs → .js: máy chủ chắc chắn trả đúng kiểu text/javascript.
//     Worker nạp kiểu module mà nhận về kiểu khác là trình duyệt chặn thẳng.
//   · maplibre-gl-shared là phần dùng chung, worker import tới nên phải chép kèm.
//
// Thư mục public/maplibre/ VẪN commit vào repo: Vercel có thể gọi thẳng `next build`
// (không qua npm run build) thì prebuild không chạy — có sẵn file trong repo là
// chắc chắn không bao giờ trắng bản đồ. Script này chạy mỗi lần dev/build chỉ để
// file luôn khớp đúng phiên bản maplibre-gl đang cài.
// ════════════════════════════════════════════════════════════════════════════

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const goc = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tuDist = (ten) => resolve(goc, "node_modules/maplibre-gl/dist", ten);
const raPublic = (ten) => resolve(goc, "public/maplibre", ten);

await mkdir(resolve(goc, "public/maplibre"), { recursive: true });

for (const ten of ["maplibre-gl-worker", "maplibre-gl-shared"]) {
  const noiDung = await readFile(tuDist(`${ten}.mjs`), "utf8");
  // Sửa luôn đường import bên trong cho khớp đuôi mới.
  await writeFile(raPublic(`${ten}.js`), noiDung.replaceAll("./maplibre-gl-shared.mjs", "./maplibre-gl-shared.js"));
}

console.log("✓ Đã chép worker MapLibre ra public/maplibre/");
