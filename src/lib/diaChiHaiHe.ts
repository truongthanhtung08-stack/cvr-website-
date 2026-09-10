// ============================================================================
// ĐỊA CHỈ HAI HỆ — HỆ MỚI (Tỉnh → Phường/Xã) ↔ HỆ CŨ (Tỉnh → Quận/Huyện → Phường/Xã)
//
// Từ 2025 cả nước chạy SONG SONG hai cách gọi địa giới: người đăng tin và người
// mua mỗi bên quen một hệ. Tin ghi "Phường An Hải, Đà Nẵng" (hệ mới) thì người
// quen hệ cũ tìm "Sơn Trà" không thấy, và ngược lại. Vì vậy mọi nơi hiển thị địa
// chỉ đều phải cho thấy CẢ HAI, còn ô nhập thì gõ hệ nào cũng được.
//
// ĐỘ CHẮC CHẮN — nói thẳng để không ai tưởng máy biết hết:
//   · Cấp TỈNH: chắc chắn 100% — có bảng sáp nhập đầy đủ (provinceMergers).
//   · Cấp PHƯỜNG/XÃ: CHƯA có bảng sáp nhập chính thức trong dự án, nên chỉ dò
//     theo TÊN trong danh mục hai hệ (phường mới thường mang tên quận/huyện hoặc
//     phường cũ). Dò ra thì ghi rõ, KHÔNG dò ra thì để trống chứ tuyệt đối không
//     đoán bừa — địa chỉ sai còn tệ hơn địa chỉ thiếu.
//
// Có bảng sáp nhập cấp phường/xã chính thức thì chỉ cần thay phần dò tên bên
// dưới, mọi nơi gọi hàm này tự đúng theo.
// ============================================================================

import {
  provinces,
  provinceMergers,
  newProvinceOf,
  wardsOfNew,
  provinceNamesNew,
  type GeoMode,
} from "@/lib/locations";
import { normalizeVi } from "@/lib/filters";

export type DiaChiCu = { tinh: string; quan: string; phuong: string };
export type DiaChiMoi = { tinh: string; phuong: string };

export type HaiHe = {
  moi: DiaChiMoi;
  cu: DiaChiCu;
  /** true = suy ra được tới cấp phường/xã; false = chỉ chắc tới cấp tỉnh */
  duToiPhuong: boolean;
};

// So tên địa giới: bỏ tiền tố cấp ("Phường", "Xã", "Quận", "Thị trấn"…) rồi bỏ dấu.
// "Phường Hải Châu" và "Hải Châu" phải coi là một.
function loiTen(s: string): string {
  return normalizeVi(s || "").replace(/^(thanh pho|tp\.?|tinh|quan|huyen|phuong|xa|thi tran|thi xa) /, "").trim();
}

function trung(a: string, b: string): boolean {
  const x = loiTen(a), y = loiTen(b);
  return !!x && !!y && x === y;
}

// ─── HỆ MỚI → HỆ CŨ ─────────────────────────────────────────────────────────
// Biết Tỉnh mới + Phường mới, tìm xem trước sáp nhập nó nằm ở tỉnh/quận/phường nào.
export function suyRaHeCu(tinhMoi: string, phuongMoi: string): HaiHe["cu"] & { duToiPhuong: boolean } {
  const tinhCuUngVien = provinceMergers[tinhMoi] ?? [];

  if (phuongMoi) {
    for (const tenTinhCu of tinhCuUngVien) {
      const tinhCu = provinces.find((p) => p.name === tenTinhCu);
      if (!tinhCu) continue;
      // 1) Phường mới trùng tên một QUẬN/HUYỆN cũ — trường hợp phổ biến nhất sau
      //    sáp nhập ("Phường Hải Châu" ← "Quận Hải Châu").
      const quanTrung = tinhCu.districts.find((d) => trung(d.name, phuongMoi));
      if (quanTrung) return { tinh: tenTinhCu, quan: quanTrung.name, phuong: "", duToiPhuong: true };
      // 2) Phường mới giữ nguyên tên một PHƯỜNG/XÃ cũ.
      for (const d of tinhCu.districts) {
        const phuongTrung = d.wards.find((w) => trung(w, phuongMoi));
        if (phuongTrung) return { tinh: tenTinhCu, quan: d.name, phuong: phuongTrung, duToiPhuong: true };
      }
      // 3) Phường mới GỘP nhiều phường cũ cùng gốc tên: "An Hải" ← An Hải Bắc ·
      //    An Hải Tây · An Hải Đông. Nêu đích danh một phường trong đó là SAI
      //    (nó chỉ là một phần), nên chỉ trả về QUẬN/HUYỆN chứa cả nhóm — vừa
      //    đúng vừa đủ để người quen hệ cũ nhận ra chỗ đó là đâu.
      const quanChua = new Set<string>();
      for (const d of tinhCu.districts) {
        if (d.wards.some((w) => loiTen(w).startsWith(loiTen(phuongMoi) + " "))) quanChua.add(d.name);
      }
      if (quanChua.size === 1) {
        return { tinh: tenTinhCu, quan: [...quanChua][0], phuong: "", duToiPhuong: true };
      }
    }
  }

  // Không dò ra phường: tỉnh cũ chỉ chắc chắn khi tỉnh mới KHÔNG sáp nhập từ
  // nhiều tỉnh (vd Hà Nội ← Hà Nội). Sáp nhập nhiều tỉnh mà không biết phường thì
  // không thể đoán nó thuộc tỉnh cũ nào — để trống.
  const chiMotTinhCu = tinhCuUngVien.length === 1 ? tinhCuUngVien[0] : "";
  return { tinh: chiMotTinhCu, quan: "", phuong: "", duToiPhuong: false };
}

// ─── HỆ CŨ → HỆ MỚI ─────────────────────────────────────────────────────────
// Biết Tỉnh cũ (+ Quận/Huyện, Phường/Xã cũ), tìm tên theo hệ mới.
export function suyRaHeMoi(tinhCu: string, quanCu: string, phuongCu: string): DiaChiMoi & { duToiPhuong: boolean } {
  // Cấp tỉnh luôn chắc chắn.
  const tinhMoi = newProvinceOf(tinhCu) || (provinceNamesNew.includes(tinhCu) ? tinhCu : "");
  if (!tinhMoi) return { tinh: "", phuong: "", duToiPhuong: false };

  const phuongMoiDS = wardsOfNew(tinhMoi);
  // 1) Phường/xã cũ còn nguyên tên trong hệ mới.
  const theoPhuong = phuongCu ? phuongMoiDS.find((w) => trung(w, phuongCu)) : undefined;
  if (theoPhuong) return { tinh: tinhMoi, phuong: theoPhuong, duToiPhuong: true };
  // 2) Phường mới mang tên quận/huyện cũ.
  const theoQuan = quanCu ? phuongMoiDS.find((w) => trung(w, quanCu)) : undefined;
  if (theoQuan) return { tinh: tinhMoi, phuong: theoQuan, duToiPhuong: true };

  return { tinh: tinhMoi, phuong: "", duToiPhuong: false };
}

// ─── GỘP CHUNG ──────────────────────────────────────────────────────────────
// Nhận địa chỉ người đăng đã nhập theo MỘT hệ, trả về cả hai hệ.
export function dongBoHaiHe(
  he: GeoMode,
  diaChi: { tinh: string; quan?: string; phuong?: string },
): HaiHe {
  const tinh = diaChi.tinh || "";
  const quan = diaChi.quan || "";
  const phuong = diaChi.phuong || "";

  if (he === "moi") {
    const cu = suyRaHeCu(tinh, phuong);
    return {
      moi: { tinh, phuong },
      cu: { tinh: cu.tinh, quan: cu.quan, phuong: cu.phuong },
      duToiPhuong: cu.duToiPhuong,
    };
  }

  const moi = suyRaHeMoi(tinh, quan, phuong);
  return {
    moi: { tinh: moi.tinh, phuong: moi.phuong },
    cu: { tinh, quan, phuong },
    duToiPhuong: moi.duToiPhuong,
  };
}

// Tin đã lưu chỉ có ba cột ward/district/province, không ghi nó nhập theo hệ nào.
// CÓ Quận/Huyện = hệ cũ (hệ mới đã bỏ cấp này) — đó là dấu hiệu duy nhất và đủ chắc.
export function heCuaTin(district: string | null | undefined): GeoMode {
  return district && district.trim() ? "cu" : "moi";
}

// ─── CÂU CHỮ HIỂN THỊ ───────────────────────────────────────────────────────
// Ghép thành một dòng đọc được. Trả "" khi không có gì chắc chắn để nói — thà
// không hiện còn hơn hiện nửa vời.
export function chuHeMoi(h: HaiHe): string {
  return [h.moi.phuong, h.moi.tinh].filter(Boolean).join(", ");
}

export function chuHeCu(h: HaiHe): string {
  return [h.cu.phuong, h.cu.quan, h.cu.tinh].filter(Boolean).join(", ");
}

// Dòng phụ hiện dưới địa chỉ chính: chỉ ra cách gọi theo hệ CÒN LẠI.
// he = hệ mà người đăng đã nhập (hệ chính đang hiển thị).
export function dongDiaChiConLai(he: GeoMode, h: HaiHe): string {
  const con = he === "moi" ? chuHeCu(h) : chuHeMoi(h);
  if (!con) return "";
  return he === "moi" ? `Tên cũ: ${con}` : `Tên mới: ${con}`;
}
