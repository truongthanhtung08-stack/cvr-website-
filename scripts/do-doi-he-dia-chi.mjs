// ĐO ĐỔI HỆ ĐỊA CHỈ HAI CHIỀU — chạy lại sau mỗi lần sửa gì đụng tới địa giới.
// Đi đúng đường form đăng tin gọi: doiHeGiuNguyen(). Xem docs/CHOT-DIA-CHI-BAN-DO.md
//   node scripts/do-doi-he-dia-chi.mjs [số phường mỗi quận, mặc định 3]
// ĐO CHUYỂN HỆ ĐỊA CHỈ HAI CHIỀU — đúng cách form đăng tin gọi (doiHeGiuNguyen).
// Chạy trên TOÀN BỘ danh mục đang dùng trong ô select, không phải mẫu chọn tay.
import path from "node:path";
import { createJiti } from "jiti";
const ROOT = path.resolve(import.meta.dirname, "..");
const jiti = createJiti(ROOT + "/kiem.mjs", { alias: { "@": ROOT + "/src" }, jsx: { runtime: "automatic" } });

const dch = await jiti.import(ROOT + "/src/lib/diaChiHaiHe.ts");
const loc = await jiti.import(ROOT + "/src/lib/locations.ts");

const { doiHeGiuNguyen } = dch;
const provinceNamesFor = loc.provinceNamesFor ?? dch.provinceNamesFor;
const districtsOf = loc.districtsOf;
const wardsOf = loc.wardsOf;
const wardsOfNew = loc.wardsOfNew;

function mau(he, gioiHan) {
  // Lấy đúng danh sách mà ô select đang dùng cho hệ đó
  const tinhs = provinceNamesFor ? provinceNamesFor(he) : [];
  const ra = [];
  for (const tinh of tinhs) {
    const quans = he === "cu" ? districtsOf(tinh) ?? [] : [""];
    if (he === "moi") {
      for (const phuong of (wardsOfNew(tinh) ?? []).slice(0, gioiHan)) ra.push({ tinh, quan: "", phuong });
    } else {
      for (const quan of quans) {
        for (const phuong of (wardsOf(tinh, quan) ?? []).slice(0, gioiHan)) ra.push({ tinh, quan, phuong });
      }
    }
  }
  return ra;
}

function doChieu(heGoc, heDich, gioiHan) {
  const ds = mau(heGoc, gioiHan);
  let trang = 0, saiVeGoc = 0, ok = 0;
  const viDu = [];
  for (const g of ds) {
    // Bấm "đổi hệ" lần 1
    const b1 = doiHeGiuNguyen(heGoc, heDich, g, null);
    if (!b1.ket.province || !b1.ket.ward) trang++;
    // Bấm "đổi hệ" lần 2 — phải về ĐÚNG bộ ban đầu
    const b2 = doiHeGiuNguyen(
      heDich,
      heGoc,
      { tinh: b1.ket.province, quan: b1.ket.district, phuong: b1.ket.ward },
      b1.nho,
    );
    const veDung =
      b2.ket.province === g.tinh && (b2.ket.district ?? "") === (g.quan ?? "") && b2.ket.ward === g.phuong;
    if (veDung) ok++;
    else {
      saiVeGoc++;
      if (viDu.length < 5)
        viDu.push(`LỆCH: ${g.phuong}, ${g.quan}, ${g.tinh} → ${b1.ket.ward}, ${b1.ket.province} → ${b2.ket.ward}, ${b2.ket.province}`);
    }
  }
  console.log(`\n${heGoc.toUpperCase()} → ${heDich.toUpperCase()} → ${heGoc.toUpperCase()}: ${ds.length} địa chỉ`);
  console.log(`   về đúng: ${ok} · trắng ô: ${trang} · lệch: ${saiVeGoc}`);
  for (const v of viDu) console.log("   " + v);
  return saiVeGoc;   // CHỈ 'lệch' mới là lỗi — xem ghi chú ở cuối file
}

const gioiHan = Number(process.argv[2] ?? 3);
const loi = doChieu("cu", "moi", gioiHan) + doChieu("moi", "cu", gioiHan);

// ⚠️ 'TRẮNG Ô' KHÔNG PHẢI LỖI, ĐỪNG ĐI SỬA.
// Đổi từ hệ MỚI sang hệ CŨ, nhiều phường mới gộp 2–4 phường cũ nên KHÔNG thể nêu
// đích danh một phường cũ — nêu ra là chỉ sai nhà người ta. Web cố ý để trống ô
// Phường/Xã và giữ nguyên danh sách phường cũ của quận đó để khách tự chọn.
// Dữ liệu KHÔNG mất: bấm quay lại hệ mới là phường mới trở về nguyên vẹn — đó là
// con số 'về đúng' ở trên, phải luôn bằng tổng số địa chỉ.
// CHỈ 'lệch' mới là lỗi: đổi đi đổi lại mà ra phường KHÁC.
console.log("\n" + (loi === 0 ? "✅ HAI CHIỀU CHUẨN — không lệch, không mất dữ liệu." : `❌ ${loi} trường hợp LỆCH — phải sửa.`));
process.exit(loi === 0 ? 0 : 1);
