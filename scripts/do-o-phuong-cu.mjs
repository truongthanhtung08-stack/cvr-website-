// ĐO Ô "PHƯỜNG/XÃ TRƯỚC SÁP NHẬP" — ô này chỉ được hiện khi máy thật sự bí.
//   node scripts/do-o-phuong-cu.mjs
import path from "node:path";
import { createJiti } from "jiti";
const ROOT = path.resolve(import.meta.dirname, "..");
const jiti = createJiti(ROOT + "/kiem.mjs", { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { ungVienPhuongCu, haiDongDiaChi } = await jiti.import(ROOT + "/src/lib/diaChiHaiHe.ts");
const { provinceNamesNew, wardsOfNew } = await jiti.import(ROOT + "/src/lib/locations.ts");

let tong = 0, hoi = 0, tuSuy = 0, chiu = 0;
const mau = [];
for (const tinh of provinceNamesNew) {
  for (const phuong of wardsOfNew(tinh) ?? []) {
    tong++;
    const uv = ungVienPhuongCu("moi", tinh, phuong);
    const tuCo = haiDongDiaChi("moi", { tinh, phuong }).cu.split(",").filter(Boolean).length >= 3;
    if (uv.length) { hoi++; if (mau.length < 6 && uv.length > 3) mau.push(`${phuong}, ${tinh} → hỏi ${uv.length} lựa chọn: ${uv.map((x) => x.nhan).join(" · ")}`); }
    else if (tuCo) tuSuy++;
    else chiu++;
  }
}
console.log(`Tổng phường/xã hệ mới cả nước: ${tong}`);
console.log(`  · máy TỰ SUY ra phường cũ, không hỏi gì:            ${tuSuy} (${(tuSuy / tong * 100).toFixed(1)}%)`);
console.log(`  · HỎI người đăng bằng danh sách có sẵn:             ${hoi} (${(hoi / tong * 100).toFixed(1)}%)`);
console.log(`  · bảng không có dữ liệu, không hỏi được:            ${chiu} (${(chiu / tong * 100).toFixed(1)}%)`);
console.log("\nVài ví dụ ô sẽ hiện:");
mau.forEach((x) => console.log("  " + x));
// Ô KHÔNG ĐƯỢC hiện khi người nhập đang ở hệ cũ
const cu = ungVienPhuongCu("cu", "Đà Nẵng", "An Hải Bắc");
console.log(`\nNhập theo hệ cũ → ô phải ẩn: ${cu.length === 0 ? "ĐÚNG (ẩn)" : "SAI (vẫn hiện)"}`);
const daSuy = ungVienPhuongCu("moi", "Đà Nẵng", "Phường Hòa Xuân");
console.log(`Phường Hòa Xuân (máy suy ra được) → ô phải ẩn: ${daSuy.length === 0 ? "ĐÚNG (ẩn)" : "SAI (vẫn hiện)"}`);
