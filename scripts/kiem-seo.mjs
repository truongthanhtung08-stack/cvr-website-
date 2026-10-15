// ════════════════════════════════════════════════════════════════════════════
// KIỂM SEO TRƯỚC KHI XIN PUSH — MỘT LỆNH (kế hoạch tự động hoá D4, 15/10/2026)
//
//   npm run kiem-seo
//
//   ① npm run soat          → tsc · eslint · next build (dừng nếu hỏng)
//   ② next start -p 3105    → chạy đúng bản vừa build, cổng phụ (không đụng cổng 3000)
//   ③ scripts/seo-kiem-tra  → rà MỌI địa chỉ trong sitemap của bản máy: mã trạng thái,
//                              title, mô tả, h1, canonical, noindex, alt, dung lượng, trùng
//   ④ tắt máy chủ, trả lại next-env.d.ts (build tự sửa tệp này)
//
// Không push. Kết quả: bảng tổng in ra màn hình + docs/seo-kiem-tra-<ngày>.json.
// ════════════════════════════════════════════════════════════════════════════

import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const GOC = path.resolve(import.meta.dirname, "..");
const CONG = 3105;
// shell chỉ cho npm (trên Windows npm là tệp .cmd); lệnh node chạy thẳng — đường dẫn có dấu cách ("X1 GEN 8") vỡ khi qua shell
const chay = (lenh, doi) => spawnSync(lenh, doi, { cwd: GOC, stdio: "inherit", shell: lenh === "npm" && process.platform === "win32" });

const soat = chay("npm", ["run", "soat"]);
if (soat.status !== 0) {
  console.error("✗ Hỏng ở bước soát (tsc/eslint/build) — chưa rà SEO.");
  process.exit(1);
}

const mayChu = spawn(process.execPath, [path.join(GOC, "node_modules/next/dist/bin/next"), "start", "-p", String(CONG)], { cwd: GOC, stdio: "ignore" });
const cho = async () => {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://localhost:${CONG}/robots.txt`)).ok) return true; } catch { /* chưa lên */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
};

let ma = 0;
try {
  if (!(await cho())) throw new Error("máy chủ thử không lên");
  const kq = chay(process.execPath, [path.join(GOC, "scripts/seo-kiem-tra.mjs"), `http://localhost:${CONG}`]);
  ma = kq.status ?? 1;
} catch (e) {
  console.error("✗", e.message);
  ma = 1;
} finally {
  mayChu.kill();
  chay("git", ["checkout", "--", "next-env.d.ts"]);
}
process.exit(ma);
