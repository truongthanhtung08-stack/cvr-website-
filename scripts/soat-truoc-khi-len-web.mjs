// ════════════════════════════════════════════════════════════════════════════
// SOÁT TRƯỚC KHI LÊN WEB — MỘT LỆNH, BIẾT CÓ ĐƯỢC PHÉP PUSH KHÔNG
//
//   npm run soat
//
// VÌ SAO CÓ FILE NÀY (chuyện thật, ngày 12/09/2026): sửa xong, chạy
// `tsc --noEmit` thấy sạch, báo "đã lên web". Nhưng tsc KHÔNG bắt được lỗi JSX
// — bản build hỏng nên Vercel không bao giờ deploy được. Web vẫn chạy bản cũ,
// mà cả hai bên đều tưởng bản mới đã lên. Mất mấy ngày đi tìm lỗi không tồn tại.
//
// TỪ ĐÓ THÀNH LUẬT: chỉ được nói "đã lên web" sau khi `next build` chạy HẾT và
// sạch. Lệnh này chạy đủ ba bước theo đúng thứ tự từ nhanh tới chậm, hỏng ở
// bước nào dừng ngay ở đó — khỏi ngồi chờ build ba phút để biết sai một dấu phẩy.
//
//   ① tsc --noEmit   ~20 giây  → sai kiểu dữ liệu
//   ② eslint         ~15 giây  → luật React (gọi hàm không thuần khi vẽ…)
//   ③ next build     ~2-3 phút → lỗi JSX, lỗi lúc dựng trang — CỬA CHẶN THẬT
//
// Lệnh này KHÔNG push. Push vẫn là việc của chủ dự án, khi nào gõ "Push".
// ════════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";
import path from "node:path";

const GOC = path.resolve(import.meta.dirname, "..");

// Gọi THẲNG tệp chạy trong node_modules, không qua npx.
// Vì sao: trên Windows, Node từ chối chạy tệp .cmd nếu không mở shell (báo
// EINVAL) — tức `npx.cmd` gọi kiểu này là hỏng câm, không in ra chữ nào, chỉ
// thấy "hỏng ở bước 1" mà không biết vì sao. Gọi thẳng thì chạy ở đâu cũng được
// và không phải mở shell.
/**
 * Danh sách tệp .ts/.tsx đang sửa (kể cả tệp mới chưa add).
 *
 * VÌ SAO CHỈ SOÁT TỆP VỪA SỬA, KHÔNG SOÁT CẢ src/: soát cả src/ hiện ra 39 lỗi
 * có SẴN từ trước (phần lớn là luật mới của React 19 về setState trong useEffect,
 * ở những tệp đang chạy tốt). Bắt sửa hết mới cho push thì cái cửa này chặn luôn
 * mọi việc — mà sửa bừa những tệp đang chạy tốt còn nguy hiểm hơn.
 *
 * → Ở đây chỉ gác PHẦN MÌNH VỪA ĐỘNG VÀO. Đống lỗi cũ là việc riêng, dọn có chủ
 *   đích, chứ không dọn kèm lúc đang vội đẩy một sửa đổi khác.
 */
function tepVuaSua() {
  const r = spawnSync("git", ["status", "--porcelain"], { cwd: GOC, encoding: "utf8" });
  return (r.stdout || "")
    .split("\n")
    .map((d) => d.slice(3).trim().replace(/^"|"$/g, ""))
    .filter((d) => /\.(ts|tsx)$/.test(d) && !d.startsWith("scripts/"));
}

const BUOC = [
  { ten: "Kiểu dữ liệu (tsc)", lenh: ["node_modules/typescript/bin/tsc", ["--noEmit"]], batDuoc: "Sai kiểu dữ liệu, thiếu thuộc tính, gọi hàm sai tham số." },
  { ten: "Luật viết mã (eslint) — chỉ tệp vừa sửa", lenh: ["node_modules/eslint/bin/eslint.js", tepVuaSua()], batDuoc: "Luật React: gọi hàm không thuần lúc vẽ, đặt state thẳng trong useEffect…" },
  { ten: "Dựng bản thật (next build)", lenh: ["node_modules/next/dist/bin/next", ["build"]], batDuoc: "Lỗi JSX và lỗi lúc dựng trang — thứ tsc KHÔNG thấy. Đây là cửa chặn thật." },
];

console.log("\n═══ SOÁT TRƯỚC KHI LÊN WEB ═══\n");

for (let i = 0; i < BUOC.length; i++) {
  const b = BUOC[i];
  console.log(`\n── Bước ${i + 1}/${BUOC.length}: ${b.ten} ──\n`);

  // Không có tệp nào để soát (vd chưa sửa tệp .ts nào) → bỏ qua, đừng gọi
  // eslint với danh sách rỗng vì nó sẽ soát cả dự án.
  if (b.lenh[1].length === 0) {
    console.log("   (không có tệp nào cần soát — bỏ qua)");
    continue;
  }
  const kq = spawnSync(process.execPath, [path.join(GOC, b.lenh[0]), ...b.lenh[1]], {
    cwd: GOC,
    stdio: "inherit",
  });

  if (kq.status !== 0) {
    console.log(`\n✕ HỎNG Ở BƯỚC ${i + 1}: ${b.ten}`);
    // Không chạy nổi lệnh (thiếu node_modules…) khác hẳn với chạy được mà có lỗi.
    if (kq.error) console.log(`  Không chạy được lệnh: ${kq.error.message}`);
    console.log(`  Bước này bắt: ${b.batDuoc}`);
    console.log("\n⛔ CHƯA ĐƯỢC PUSH. Sửa hết lỗi ở trên rồi chạy lại: npm run soat\n");
    process.exit(1);
  }
  console.log(`\n✓ Bước ${i + 1} sạch.`);
}

// Nhắc luôn phần đang dở dang — push mà quên `git add` một tệp mới là bản trên
// web thiếu tệp đó, build hỏng ngay mà trên máy vẫn chạy tốt.
const st = spawnSync("git", ["status", "--porcelain"], { cwd: GOC, encoding: "utf8" });
const doi = (st.stdout || "").trim().split("\n").filter(Boolean);

console.log("\n═══════════════════════════════════");
console.log("✓ CẢ BA BƯỚC SẠCH — bản này lên web được.");
if (doi.length > 0) {
  console.log(`\n${doi.length} tệp đang thay đổi chưa commit:`);
  for (const d of doi.slice(0, 20)) console.log("   " + d);
  if (doi.length > 20) console.log(`   … và ${doi.length - 20} tệp nữa`);
  console.log("\nNhớ `git add -A` cho đủ — thiếu một tệp mới là build trên Vercel hỏng.");
}
console.log("\nPush là việc của chủ dự án. Chờ chữ “Push”.\n");
