// ĐO GHIM BẢN ĐỒ → ĐIỀN ĐỊA GIỚI, 14 điểm trên 7 khu vực.
// Đi đúng đường form gọi: traDiaChi() → ganDiaGioi(). Xem docs/CHOT-DIA-CHI-BAN-DO.md
//   node scripts/do-ghim-ban-do.mjs moi | cu
// ĐO "GHIM BẢN ĐỒ → ĐIỀN ĐỊA GIỚI" bằng ĐÚNG hàm form đăng tin gọi:
//   traDiaChi() (src/lib/timToaDo.ts) → ganDiaGioi() (src/lib/diaGioiTuBanDo.ts)
// Chỉ vá fetch để đường dẫn "/api/…" trỏ về web thật (trong Node không có origin).
import path from "node:path";
import { createJiti } from "jiti";

const gocFetch = globalThis.fetch;
globalThis.fetch = (u, o) =>
  gocFetch(typeof u === "string" && u.startsWith("/") ? "https://coastalland.vn" + u : u, o);

const ROOT = path.resolve(import.meta.dirname, "..");
const jiti = createJiti(ROOT + "/kiem.mjs", { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { traDiaChi } = await jiti.import(ROOT + "/src/lib/timToaDo.ts");
const { ganDiaGioi } = await jiti.import(ROOT + "/src/lib/diaGioiTuBanDo.ts");
const { districtsOf } = await jiti.import(ROOT + "/src/lib/locations.ts");

const DIEM = [
  ["Đà Nẵng — Sơn Trà", 16.0678, 108.2447, "Đà Nẵng", "Đà Nẵng"],
  ["Đà Nẵng — Hòa Xuân", 16.02, 108.2269, "Đà Nẵng", "Đà Nẵng"],
  ["Hội An (nay Đà Nẵng)", 15.8801, 108.338, "Đà Nẵng", "Quảng Nam"],
  ["Huế — Phú Xuân", 16.4637, 107.5909, "Huế", "Thừa Thiên Huế"],
  ["Huế — Thuận An", 16.568, 107.63, "Huế", "Thừa Thiên Huế"],
  ["Quy Nhơn (nay Gia Lai)", 13.7829, 109.2196, "Gia Lai", "Bình Định"],
  ["Nha Trang (Khánh Hòa)", 12.2388, 109.1967, "Khánh Hòa", "Khánh Hòa"],
  ["Cam Ranh (Khánh Hòa)", 11.9214, 109.1591, "Khánh Hòa", "Khánh Hòa"],
  ["Phan Thiết (nay Lâm Đồng)", 10.928, 108.1, "Lâm Đồng", "Bình Thuận"],
  ["Mũi Né (nay Lâm Đồng)", 10.933, 108.287, "Lâm Đồng", "Bình Thuận"],
  ["Đông Hà (Quảng Trị)", 16.8163, 107.1003, "Quảng Trị", "Quảng Trị"],
  ["Đồng Hới (nay Quảng Trị)", 17.4689, 106.6223, "Quảng Trị", "Quảng Bình"],
  ["TP. Quảng Ngãi", 15.1214, 108.8044, "Quảng Ngãi", "Quảng Ngãi"],
  ["Dung Quất (Quảng Ngãi)", 15.38, 108.77, "Quảng Ngãi", "Quảng Ngãi"],
];

const he = process.argv[2] === "cu" ? "cu" : "moi";
let dungTinh = 0, saiTinh = 0, thieuPhuong = 0;
console.log(`HỆ ĐỊA CHỈ: ${he.toUpperCase()}\n`);
// Hệ CŨ phải trả TÊN TỈNH TRƯỚC SÁP NHẬP (Hội An → Quảng Nam, Quy Nhơn → Bình
// Định…). So với tên tỉnh mới là tự bắt lỗi oan.
for (const [ten, lat, lng, tinhMoi, tinhCu] of DIEM) {
  const tinhMongDoi = he === "cu" ? tinhCu : tinhMoi;
  const t = await traDiaChi(lat, lng);
  const dc = { tinh: t?.tinh ?? "", quan: t?.quan ?? "", phuong: t?.phuong ?? "" };
  const kq = ganDiaGioi(dc, he, { province: "", district: "", ward: "" });
  // Ở hệ CŨ, quận điền ra PHẢI có thật trong danh mục quận của tỉnh đó — nếu
  // không thì ô Quận/Huyện trên form hiện trống, người đăng tưởng mất dữ liệu.
  const quanHopLe = he === "moi" || !kq.district || districtsOf(kq.province).includes(kq.district);
  const ok = kq.province === tinhMongDoi && quanHopLe;
  ok ? dungTinh++ : saiTinh++;
  if (!kq.ward) thieuPhuong++;
  console.log(
    `${ok ? "✓" : "✗"} ${ten.padEnd(26)} tỉnh: ${(kq.province || "∅").padEnd(12)} quận: ${(kq.district || "—").padEnd(14)} phường: ${(kq.ward || "∅").padEnd(26)}${ok ? "" : " (mong đợi " + tinhMongDoi + ")"}`,
  );
  if (!ok || !kq.ward) console.log(`      bản đồ đọc: ${dc.phuong || "—"} | ${dc.quan || "—"} | ${dc.tinh || "—"}`);
  await new Promise((r) => setTimeout(r, 1100));
}
console.log(`\nĐúng ${dungTinh}/${DIEM.length} · sai ${saiTinh} · không ra phường ${thieuPhuong}`);
process.exit(saiTinh === 0 && thieuPhuong === 0 ? 0 : 1);
