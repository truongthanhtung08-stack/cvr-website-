// ĐO TOÀN QUỐC: bản đồ trả TÊN PHƯỜNG HỆ MỚI mà form đang ở HỆ CŨ.
// ----------------------------------------------------------------------------
// Đây là ca đã làm hỏng màn hình của chủ dự án 17/09/2026: ghim/chọn "Phường Hoài
// Nhơn Đông, Gia Lai" rồi sang hệ cũ thì ô Tỉnh giữ nguyên "Gia Lai" (tên MỚI) và
// ô Quận/Huyện trống — vì quận suy ra ("Hoài Nhơn") vốn thuộc BÌNH ĐỊNH.
//
// Chạy qua HẾT 3.321 phường/xã hệ mới của 34 tỉnh, không lấy mẫu.
// Bắt hai loại sai:
//   · QUẬN MA    — quận điền ra KHÔNG có trong danh mục quận của tỉnh đó → ô
//                  Quận/Huyện trên form hiện trống, người đăng tưởng mất dữ liệu.
//   · KHÔNG RA QUẬN — bỏ trống cả quận (chỉ chấp nhận khi tỉnh chưa có danh mục).
//
//   node scripts/do-phuong-moi-o-he-cu.mjs
// Mã thoát 0 = sạch.
// ============================================================================
import path from "node:path";
import { createJiti } from "jiti";

const ROOT = path.resolve(import.meta.dirname, "..");
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });
const { ganDiaGioi } = await jiti.import(ROOT + "/src/lib/diaGioiTuBanDo.ts");
const { provinceNamesFor, wardsOfNew, districtsOf, wardsOf } = await jiti.import(ROOT + "/src/lib/locations.ts");

let tong = 0, quanMa = 0, khongRaQuan = 0, phuongTrong = 0, tinhTrong = 0;
const viDu = [];

for (const tinhMoi of provinceNamesFor("moi")) {
  for (const phuongMoi of wardsOfNew(tinhMoi)) {
    tong++;
    // Bản đồ đọc ra tên hệ mới; form đang ở hệ CŨ.
    const kq = ganDiaGioi({ tinh: tinhMoi, quan: "", phuong: phuongMoi }, "cu", {
      province: "",
      district: "",
      ward: "",
    });
    const dsQuan = districtsOf(kq.province);
    if (!kq.province) {
      tinhTrong++;
      if (viDu.length < 12) viDu.push(`TỈNH TRỐNG: ${phuongMoi}, ${tinhMoi}`);
      continue;
    }
    if (!kq.district) {
      // Tỉnh chưa có danh mục quận/huyện cũ thì bỏ trống là chấp nhận được.
      if (dsQuan.length) {
        khongRaQuan++;
        if (viDu.length < 12) viDu.push(`KHÔNG RA QUẬN: ${phuongMoi}, ${tinhMoi} → ${kq.province}`);
      }
      continue;
    }
    if (dsQuan.length && !dsQuan.includes(kq.district)) {
      quanMa++;
      if (viDu.length < 12)
        viDu.push(`QUẬN MA: ${phuongMoi}, ${tinhMoi} → ${kq.province} · ${kq.district} (tỉnh này không có quận đó)`);
      continue;
    }
    if (!kq.ward) phuongTrong++;
  }
}

console.log(`Đã đo ${tong} phường/xã hệ mới, trên ${provinceNamesFor("moi").length} tỉnh/thành\n`);
console.log(`  Tỉnh trống          : ${tinhTrong}`);
console.log(`  Quận MA (sai tỉnh)  : ${quanMa}`);
console.log(`  Không ra quận       : ${khongRaQuan}`);
console.log(`  Ra quận nhưng trống phường : ${phuongTrong}   (chấp nhận được — khách chọn trong danh sách quận đó)`);
for (const v of viDu) console.log("   " + v);

// ── CHIỀU NGƯỢC: bản đồ trả TÊN PHƯỜNG CŨ mà form đang ở HỆ MỚI ─────────────
// Nơi nào OpenStreetMap chưa cập nhật thì vẫn đọc ra tên cũ ("An Hải Bắc",
// "Quận Hải Châu"). Hệ mới phải quy đổi ngược lại được, nếu không ô Phường/Xã
// bỏ trống.
let tongCu = 0, phuongTrongMoi = 0, tinhTrongMoi = 0;
const viDu2 = [];
for (const tinhCu of provinceNamesFor("cu")) {
  for (const quanCu of districtsOf(tinhCu)) {
    for (const phuongCu of wardsOf(tinhCu, quanCu)) {
      tongCu++;
      const kq = ganDiaGioi({ tinh: tinhCu, quan: quanCu, phuong: phuongCu }, "moi", {
        province: "",
        district: "",
        ward: "",
      });
      if (!kq.province) {
        tinhTrongMoi++;
        if (viDu2.length < 12) viDu2.push(`TỈNH TRỐNG: ${phuongCu}, ${quanCu}, ${tinhCu}`);
      } else if (!kq.ward) {
        phuongTrongMoi++;
        if (viDu2.length < 12) viDu2.push(`PHƯỜNG TRỐNG: ${phuongCu}, ${quanCu}, ${tinhCu} → ${kq.province}`);
      }
    }
  }
}
console.log(`\nCHIỀU NGƯỢC — bản đồ đọc tên CŨ, form ở hệ MỚI: ${tongCu} địa chỉ`);
console.log(`  Tỉnh trống   : ${tinhTrongMoi}`);
console.log(`  Phường trống : ${phuongTrongMoi}`);
for (const v of viDu2) console.log("   " + v);

const loi = tinhTrong + quanMa + khongRaQuan + tinhTrongMoi + phuongTrongMoi;
console.log("\n" + (loi === 0 ? "✅ TOÀN QUỐC SẠCH CẢ HAI CHIỀU." : `❌ ${loi} ca phải sửa.`));
process.exit(loi === 0 ? 0 : 1);
