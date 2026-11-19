// CSS form đăng tin web cho Mini App: lấy NGUYÊN globals.css của web (một nguồn), bỏ dòng @import "tailwindcss" (Mini App tự nạp),
// tách khối @theme ra ngoài, phần còn lại bọc @layer web — CSS riêng của Mini App (không lớp) luôn thắng, các màn khác không đổi.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const goc = path.dirname(fileURLToPath(import.meta.url));
export function taoCssWeb() {
  const src = fs.readFileSync(path.resolve(goc, "../../src/app/globals.css"), "utf8").replace(/\r\n/g, "\n").replace(/^@import "tailwindcss";\s*$/m, "");
  const i = src.indexOf("@theme inline {");
  let j = i, sau = 0;
  for (; j < src.length; j++) { if (src[j] === "{") sau++; else if (src[j] === "}") { sau--; if (sau === 0) break; } }
  const theme = src.slice(i, j + 1);
  const conLai = src.slice(0, i) + src.slice(j + 1);
  const ra = `/* TỰ SINH từ ../src/app/globals.css (scripts/css-web.mjs) — đừng sửa tay */\n@import "tailwindcss" source(none);\n@source "../../src/components";\n@source "../../src/lib";\n${theme}\n@layer web {\n${conLai}\n}\n`;
  const dich = path.resolve(goc, "../src/form-web.css");
  if (!fs.existsSync(dich) || fs.readFileSync(dich, "utf8") !== ra) fs.writeFileSync(dich, ra);
}
