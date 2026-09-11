// Danh mục đơn vị hành chính — HAI HỆ, ĐỦ TOÀN QUỐC.
//   • Hệ CŨ (trước sáp nhập 2025): `provincesOld` — 63 tỉnh · 697 quận/huyện · 10.972 phường/xã,
//     mỗi phường cũ kèm CHỈ SỐ phường mới tương ứng (ánh xạ chính thức, không phải dò tên).
//   • Hệ MỚI (sau sáp nhập 2025):  `provincesNew` — 34 tỉnh · 3.321 phường/xã (bỏ cấp Quận/Huyện).
// Hai bảng đó là dữ liệu gốc, sinh tự động từ nguồn mở — không sửa tay. File này
// chỉ nối hai hệ lại với nhau (`provinceMergers`) và cung cấp hàm tra cứu.

import { provincesNew } from "./provincesNew";
import { provincesOld } from "./provincesOld";

export type Ward = string;

export type District = {
  name: string;
  wards: Ward[];
  /** Tỉnh CŨ (trước sáp nhập 2025) mà quận/huyện này thuộc về. Phải ghi ở mọi tỉnh
   *  mới gộp từ NHIỀU tỉnh cũ — không ghi thì chọn "Địa chỉ cũ" sẽ ra những cặp
   *  sai như "Đà Nẵng → Hội An" (Hội An vốn thuộc Quảng Nam). */
  tinhCu?: string;
};

export type Province = {
  name: string;
  districts: District[];
};


// Quận/huyện của MỘT TỈNH CŨ. Cấp quận/huyện chỉ còn tồn tại ở hệ cũ, nên tham số
// ở đây là TÊN TỈNH TRƯỚC SÁP NHẬP ("Quảng Nam", "Bình Định"…).
//
// Bảng `provinces` là bảng LAI: khoá theo tên tỉnh MỚI nhưng cấp dưới là quận/huyện
// CŨ gộp chung của nhiều tỉnh cũ. Vì vậy phải quy về tỉnh mới để tìm, rồi lọc lại
// theo `tinhCu` — nếu không sẽ ra những cặp sai như "Đà Nẵng → Hội An".
function quanHuyenCua(provinceName: string): District[] {
  // Tên tỉnh CŨ → tra thẳng danh mục 63 tỉnh trước sáp nhập.
  const cu = provincesOld.find((x) => x.name === provinceName);
  if (cu) return cu.districts.map((d) => ({ ...d, tinhCu: provinceName }));
  // Tin cũ lưu theo TÊN MỚI ("Đà Nẵng", "Huế") → trả trọn quận/huyện của mọi tỉnh
  // cũ đã gộp vào, để dữ liệu đã đăng vẫn tra được.
  return quanHuyenToanTinh(provinceName);
}

// Toàn bộ quận/huyện CŨ nằm trong một tỉnh — gồm MỌI tỉnh cũ đã gộp vào nó.
// Dùng khi chỉ biết tên tỉnh hiện hành (bản đồ trả về) mà cần dò xem một địa danh
// thuộc tỉnh cũ nào: ghim ở Hội An, bản đồ nói "Đà Nẵng", tra bảng này ra Quảng Nam.
export function quanHuyenToanTinh(tenTinh: string): District[] {
  const tinhMoi = newProvinceOf(tenTinh);
  return provinces.find((p) => p.name === tinhMoi)?.districts ?? [];
}

// Lấy danh sách quận/huyện theo tên tỉnh cũ (rỗng nếu không khớp)
export function districtsOf(provinceName: string): string[] {
  return quanHuyenCua(provinceName).map((d) => d.name);
}

// Lấy danh sách phường/xã theo tỉnh cũ + quận/huyện (rỗng nếu không khớp)
export function wardsOf(provinceName: string, districtName: string): string[] {
  return quanHuyenCua(provinceName).find((d) => d.name === districtName)?.wards ?? [];
}

// ═══════════════════════════════════════════════════════════════════════════
// HAI HỆ ĐƠN VỊ HÀNH CHÍNH — khách chọn 1 trong 2 (nút bật/tắt trên bộ lọc):
//   • "cu"  = TRƯỚC sát nhập — 3 cấp: Tỉnh → Quận/Huyện → Phường/Xã (dữ liệu `provincesOld`)
//   • "moi" = SAU sát nhập 2025 — 2 cấp: Tỉnh → Phường/Xã (dữ liệu `provincesNew`, bỏ Quận/Huyện)
// Áp dụng đồng bộ cho Dự án · Mua bán · Cho thuê, cả PC & Mobile.
// ═══════════════════════════════════════════════════════════════════════════
export type GeoMode = "cu" | "moi";

// Tên tỉnh/thành hệ MỚI — dùng cho select cấp 1 khi mode = "moi"
export const provinceNamesNew: string[] = provincesNew.map((p) => p.name);

// Danh sách tỉnh/thành theo hệ đã chọn.
// Hệ CŨ = tên tỉnh TRƯỚC sáp nhập (63 tỉnh). Trước đây chỗ này trả về danh sách
// tỉnh MỚI nên chọn "Địa chỉ cũ" vẫn hiện "Đà Nẵng" rồi cho chọn quận "Hội An" —
// sai, vì trước sáp nhập Hội An thuộc Quảng Nam.
export function provinceNamesFor(mode: GeoMode): string[] {
  return mode === "moi" ? provinceNamesNew : oldProvinceNames;
}

// Phường/xã hệ MỚI của tỉnh chứa `provinceName` — nhận cả tên tỉnh cũ lẫn tên mới.
// Dùng làm phương án dự phòng khi một tỉnh cũ chưa có danh mục quận/huyện: thà cho
// chọn phường theo tên mới còn hơn để ô trống không chọn được gì.
export function wardsOfAny(provinceName: string): string[] {
  return wardsOfNew(newProvinceOf(provinceName));
}

// Phường/xã trực thuộc tỉnh (hệ MỚI — 2 cấp, không qua quận/huyện)
export function wardsOfNew(provinceName: string): string[] {
  return provincesNew.find((p) => p.name === provinceName)?.wards ?? [];
}

// ═══════════════════════════════════════════════════════════════════════════
// SÁT NHẬP 2025 — 63 TỈNH CŨ → 34 TỈNH MỚI
// Cho khách 2 lựa chọn: chọn theo tên tỉnh MỚI (sau sát nhập) hoặc tên tỉnh CŨ
// (trước sát nhập — nhiều người vẫn quen). Chọn tên cũ → tự quy về tỉnh mới để lọc.
//
// `provinceMergers`: tỉnh MỚI → danh sách tỉnh CŨ gộp vào (phần tử đầu = tên cũ
// tương ứng chính nó; Huế đổi tên từ "Thừa Thiên Huế"). Đây là NGUỒN SỰ THẬT —
// mọi danh sách/ánh xạ cũ↔mới dưới đây suy ra từ bảng này.
// Nguồn: Nghị quyết sắp xếp đơn vị hành chính cấp tỉnh 2025.
// ═══════════════════════════════════════════════════════════════════════════
export const provinceMergers: Record<string, string[]> = {
  // — 6 THÀNH PHỐ TRỰC THUỘC TW —
  "Hà Nội": ["Hà Nội"],
  "Huế": ["Thừa Thiên Huế"],
  "Hải Phòng": ["Hải Phòng", "Hải Dương"],
  "Đà Nẵng": ["Đà Nẵng", "Quảng Nam"],
  "Hồ Chí Minh": ["TP. Hồ Chí Minh", "Bình Dương", "Bà Rịa - Vũng Tàu"],
  "Cần Thơ": ["Cần Thơ", "Sóc Trăng", "Hậu Giang"],
  // — MIỀN NÚI & TRUNG DU BẮC BỘ —
  "Tuyên Quang": ["Tuyên Quang", "Hà Giang"],
  "Lào Cai": ["Lào Cai", "Yên Bái"],
  "Thái Nguyên": ["Thái Nguyên", "Bắc Kạn"],
  "Phú Thọ": ["Phú Thọ", "Vĩnh Phúc", "Hòa Bình"],
  "Bắc Ninh": ["Bắc Ninh", "Bắc Giang"],
  "Cao Bằng": ["Cao Bằng"],
  "Lạng Sơn": ["Lạng Sơn"],
  "Quảng Ninh": ["Quảng Ninh"],
  "Lai Châu": ["Lai Châu"],
  "Điện Biên": ["Điện Biên"],
  "Sơn La": ["Sơn La"],
  // — ĐỒNG BẰNG SÔNG HỒNG —
  "Hưng Yên": ["Hưng Yên", "Thái Bình"],
  "Ninh Bình": ["Ninh Bình", "Hà Nam", "Nam Định"],
  // — BẮC TRUNG BỘ & DUYÊN HẢI MIỀN TRUNG —
  "Thanh Hóa": ["Thanh Hóa"],
  "Nghệ An": ["Nghệ An"],
  "Hà Tĩnh": ["Hà Tĩnh"],
  "Quảng Trị": ["Quảng Trị", "Quảng Bình"],
  "Quảng Ngãi": ["Quảng Ngãi", "Kon Tum"],
  "Gia Lai": ["Gia Lai", "Bình Định"],
  "Khánh Hòa": ["Khánh Hòa", "Ninh Thuận"],
  "Đắk Lắk": ["Đắk Lắk", "Phú Yên"],
  "Lâm Đồng": ["Lâm Đồng", "Đắk Nông", "Bình Thuận"],
  // — ĐÔNG NAM BỘ & TÂY NAM BỘ —
  "Đồng Nai": ["Đồng Nai", "Bình Phước"],
  "Tây Ninh": ["Tây Ninh", "Long An"],
  "Vĩnh Long": ["Vĩnh Long", "Bến Tre", "Trà Vinh"],
  "Đồng Tháp": ["Đồng Tháp", "Tiền Giang"],
  "Cà Mau": ["Cà Mau", "Bạc Liêu"],
  "An Giang": ["An Giang", "Kiên Giang"],
};

// Danh sách tên tỉnh CŨ (63) — kèm tỉnh mới chứa nó. Sắp theo A→Z (bảng chọn "tỉnh cũ").
export type OldProvince = { name: string; newName: string };
export const oldProvinces: OldProvince[] = Object.entries(provinceMergers)
  .flatMap(([newName, olds]) => olds.map((name) => ({ name, newName })))
  .sort((a, b) => a.name.localeCompare(b.name, "vi"));

// Tên các tỉnh CŨ — cho select cấp 1 ở chế độ "tỉnh cũ".
export const oldProvinceNames: string[] = oldProvinces.map((o) => o.name);

// Tỉnh cũ → tỉnh mới (quy đổi khi khách chọn theo tên cũ). Không khớp → trả chính nó.
export function newProvinceOf(oldName: string): string {
  return oldProvinces.find((o) => o.name === oldName)?.newName ?? oldName;
}

// Tỉnh mới → các tỉnh cũ gộp vào (để hiện chú thích "gồm …").
export function oldNamesOf(newName: string): string[] {
  return provinceMergers[newName] ?? [newName];
}

// ── NỐI HAI HỆ TÊN TỈNH LẠI VỚI NHAU ────────────────────────────────────────
// Tin cũ lưu tên tỉnh CŨ, tin mới lưu tên tỉnh MỚI. Nếu tìm kiếm chỉ so đúng
// một tên thì dữ liệu bị chia đôi: chọn "Đà Nẵng" (mới) sẽ KHÔNG ra tin lưu là
// "Quảng Nam" (cũ) và ngược lại. Hàm này trả về MỌI tên tương đương của một
// tỉnh để bộ lọc khớp cả hai hệ — chủ dự án nhập theo hệ nào cũng tìm ra.
export function tenTinhTuongDuong(ten: string): string[] {
  const ds = new Set<string>([ten]);
  // Tên MỚI → thêm các tỉnh cũ đã gộp vào nó
  for (const cu of provinceMergers[ten] ?? []) ds.add(cu);
  // Tên CŨ → thêm tên mới sau sáp nhập
  const moi = oldProvinces.find((o) => o.name === ten)?.newName;
  if (moi) {
    ds.add(moi);
    // …và các tỉnh cũ "anh em" cùng gộp vào tỉnh mới đó thì KHÔNG thêm:
    // chọn "Quảng Nam" chỉ nên ra tin Quảng Nam + tin ghi theo tên mới,
    // không kéo luôn tin của tỉnh cũ khác.
  }
  return [...ds];
}

// ── BẢNG LAI: TỈNH MỚI → QUẬN/HUYỆN CŨ ──────────────────────────────────────
// Sinh tự động từ `provincesOld` (63 tỉnh trước sáp nhập) + `provinceMergers`,
// KHÔNG còn gõ tay. Trước đây bảng này nhập tay và chỉ có 8 tỉnh lõi Miền Trung,
// nên 43/63 tỉnh cũ không chọn được Quận/Huyện, và dữ liệu dễ lệch với danh mục
// gốc. Mỗi quận/huyện mang sẵn `tinhCu` để tra ngược ra tỉnh trước sáp nhập.
export const provinces: Province[] = provinceNamesNew.map((tenMoi) => ({
  name: tenMoi,
  districts: (provinceMergers[tenMoi] ?? [tenMoi]).flatMap((tinhCu) =>
    (provincesOld.find((x) => x.name === tinhCu)?.districts ?? []).map((d) => ({
      name: d.name,
      wards: d.wards,
      tinhCu,
    })),
  ),
}));

// Tên các tỉnh/thành — dùng cho select cấp 1
export const provinceNames: string[] = provinces.map((p) => p.name);

// ── ÁNH XẠ CHÍNH THỨC CŨ ↔ MỚI (Nghị quyết 202/2025/QH15) ───────────────────
// provincesOld ghi sẵn: phường cũ thứ i thuộc quận d nằm ở phường mới `d.moi[i]`
// của tỉnh mới. Hai bảng tra dưới đây dựng MỘT LẦN khi nạp module, sau đó tra tức
// thì — không phải dò tên nữa, nên đúng 100% thay vì ~90%.

type ChoCu = { tinh: string; quan: string; phuong: string };

function khoaCu(tinh: string, quan: string, phuong: string): string {
  return `${chuanTen(tinh)}|${chuanTen(quan)}|${chuanTen(phuong)}`;
}

// Bỏ dấu + bỏ tiền tố cấp để hai nguồn tên khác nhau vẫn gặp nhau.
// Các cấp hành chính đứng trước tên riêng. "Đặc khu" là cấp MỚI từ 2025 (13 đảo).
const CAP_HANH_CHINH = [
  "tinh", "thanh pho", "tp.", "tp", "thi xa", "tx.", "tx",
  "quan", "huyen", "phuong", "xa", "thi tran", "dac khu",
];

// Bỏ dấu tiếng Việt, gom khoảng trắng, chuẩn hoá dấu gạch nối.
function moc(t: string): string {
  const khongDau = Array.from((t || "").normalize("NFD"))
    .filter((ch) => { const m = ch.codePointAt(0) ?? 0; return m < 0x300 || m > 0x36f; })
    .join("")
    .split("đ").join("d")
    .split("Đ").join("d")
    .toLowerCase();
  return khongDau
    .split("-").map((x) => x.trim()).join(" - ")
    .split(" ").filter(Boolean).join(" ")
    .trim();
}

/** Tên riêng: bỏ dấu VÀ bỏ tiền tố cấp — "Thành phố Hội An" và "Hội An" thành một. */
export function chuanTen(t: string): string {
  const x = moc(t);
  for (const c of CAP_HANH_CHINH) if (x.startsWith(c + " ")) return x.slice(c.length + 1).trim();
  return x;
}

/** Như chuanTen nhưng GIỮ cấp, viết gọn một lối: "Thành phố Quảng Ngãi" và
 *  "TP. Quảng Ngãi" cùng ra "tp. quang ngai", còn tỉnh "Quảng Ngãi" ra "quang ngai".
 *  Cần nó để phân biệt huyện/thành phố trùng tên tỉnh. */
export function chuanTenCap(t: string): string {
  const x = moc(t);
  if (x.startsWith("thanh pho ")) return "tp. " + x.slice(10).trim();
  if (x.startsWith("thi xa ")) return "tx. " + x.slice(7).trim();
  return x;
}

// Như chuanTen nhưng GIỮ cấp, viết gọn về một lối: "Thành phố Quảng Ngãi" và
// "TP. Quảng Ngãi" cùng ra "tp. quang ngai", còn tỉnh "Quảng Ngãi" ra "quang ngai".

const _cuSangMoi = new Map<string, { tinh: string; phuong: string }>();
const _moiSangCu = new Map<string, ChoCu[]>();
for (const p of provincesOld) {
  const tinhMoi = newProvinceOf(p.name);
  const dsPhuongMoi = provincesNew.find((x) => x.name === tinhMoi)?.wards ?? [];
  for (const d of p.districts) {
    for (let i = 0; i < d.wards.length; i++) {
      const pm = dsPhuongMoi[d.moi[i]];
      if (!pm) continue;
      _cuSangMoi.set(khoaCu(p.name, d.name, d.wards[i]), { tinh: tinhMoi, phuong: pm });
      const k = `${chuanTen(tinhMoi)}|${chuanTen(pm)}`;
      const ds = _moiSangCu.get(k);
      const cho: ChoCu = { tinh: p.name, quan: d.name, phuong: d.wards[i] };
      if (ds) ds.push(cho);
      else _moiSangCu.set(k, [cho]);
    }
  }
}

/** Phường/xã CŨ → tên theo hệ mới. Không có trong bảng → null (không đoán). */
export function phuongMoiCua(tinhCu: string, quanCu: string, phuongCu: string) {
  return _cuSangMoi.get(khoaCu(tinhCu, quanCu, phuongCu)) ?? null;
}

/** Phường/xã MỚI → những chỗ cũ đã gộp vào nó (một phường mới thường gộp 2–4 phường cũ). */
export function choCuCua(tinhMoi: string, phuongMoi: string): ChoCu[] {
  return _moiSangCu.get(`${chuanTen(tinhMoi)}|${chuanTen(phuongMoi)}`) ?? [];
}

/** Cả quận/huyện CŨ này nay nằm ở những phường/xã mới nào (không trùng lặp). */
export function phuongMoiCuaQuan(tinhCu: string, quanCu: string): string[] {
  const p = provincesOld.find((x) => chuanTen(x.name) === chuanTen(tinhCu));
  const d = p?.districts.find((x) => chuanTenCap(x.name) === chuanTenCap(quanCu) || chuanTen(x.name) === chuanTen(quanCu));
  if (!p || !d) return [];
  const ds = provincesNew.find((x) => x.name === newProvinceOf(p.name))?.wards ?? [];
  const ra = new Set<string>();
  for (const i of d.moi) { const w = ds[i]; if (w) ra.add(w); }
  return [...ra];
}
