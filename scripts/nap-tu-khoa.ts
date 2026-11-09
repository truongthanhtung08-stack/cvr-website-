// NẠP BẢNG TỪ KHOÁ LÕI TỪ MÁY (dự phòng — đường chính là Admin → Từ khoá lõi → Tải tệp lên, không cần Push).
// Ghi src/data/tu-khoa-loi.json = bản mặc định trong mã (web dùng khi Admin chưa tải tệp nào).
//   npx tsx scripts/nap-tu-khoa.ts ["D:\Coastal Land\SEO\Plan SEO - pSEO\HE-THONG-TU-KHOA.xlsx"]
// Luật đọc + luật an toàn: src/lib/tuKhoaLoiDoc.ts (một luật với Admin).
import fs from "node:fs";
import { docBangTuKhoaLoi } from "../src/lib/tuKhoaLoiDoc";

const FILE = process.argv[2] || "D:\\Coastal Land\\SEO\\Plan SEO - pSEO\\HE-THONG-TU-KHOA.xlsx";
const kq = docBangTuKhoaLoi(fs.readFileSync(FILE));
fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/tu-khoa-loi.json", JSON.stringify({ nguon: "HE-THONG-TU-KHOA.xlsx · sheet Từ khoá lõi · cột Lên web", trang: kq.trang }, null, 2) + "\n");
console.log(`Chọn ${kq.soDong} dòng Bán/Cho thuê → đổi chữ lõi ${kq.doi.length} trang:`);
kq.doi.forEach((d) => console.log(`  ${d.trang}: "${d.cu}" → "${d.moi}"`));
console.log(`Giữ nguyên ${kq.giu.length}:`);
kq.giu.forEach((x) => console.log("  " + x));
